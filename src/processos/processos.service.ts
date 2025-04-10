import { ForbiddenException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { CreateProcessoDto } from './dto/create-processo.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { AppService } from 'src/app.service';
import { Processo } from '@prisma/client';
import { ProcessoPaginadoResponseDTO } from './dto/processo-response.dto';

@Injectable()
export class ProcessosService {
  constructor(
    private prisma: PrismaService,
    private app: AppService
  ) {}
  
  async importar(createProcessoDto: CreateProcessoDto[]) {
    const resultado = {
      erros: [],
      novos_registros: []
    }
    await Promise.all(createProcessoDto.map(async (processo) => {
      try {
        await this.prisma.processo.create({
          data: {
            tipo: processo.tipo,
            codigo: processo.codigo,
            num_processo: processo.num_processo,
            protocolo_ad: processo.protocolo_ad,
            data_entrada: processo.data_entrada,
            parcelas: {
              create: processo.parcelas.map((parcela) => ({
                valor: parcela.valor || 0,
                vencimento: parcela.vencimento,
                num_parcela: parcela.num_parcela,
                data_quitacao: parcela.data_quitacao || undefined,
                status_quitacao: parcela.status_quitacao || false,
                ano_pagamento: parcela.ano_pagamento || undefined,
                cpf_cnpj: parcela.cpf_cnpj,
              })),
            }
          }
        });
        resultado.novos_registros.push(processo.num_processo);
      } catch (error) {
        console.log(error);
        resultado.erros.push({
          num_processo: processo.num_processo,
          erro: error
        });
      }
    }));
    return resultado;
  }

  async criar(createProcessoDto: CreateProcessoDto) {
    const { num_processo, parcelas, ...processo } = createProcessoDto;
    const processoExiste = await this.buscarPorProcesso(num_processo);
    if (processoExiste) throw new ForbiddenException('Processo já cadastrado.');
    const novoProcesso = await this.prisma.processo.create({
      data: {
        num_processo,
        ...processo,
        ...(parcelas && parcelas.length > 0 && { parcelas: {
          create: parcelas.map((parcela) => ({
            valor: parcela.valor || 0,
            vencimento: parcela.vencimento,
            num_parcela: parcela.num_parcela,
            data_quitacao: parcela.data_quitacao || undefined,
            status_quitacao: parcela.status_quitacao || false,
            ano_pagamento: parcela.ano_pagamento || undefined,
            cpf_cnpj: parcela.cpf_cnpj,
          })),
        }})
      },
      include: { parcelas: true }
    });
    if (!novoProcesso) throw new InternalServerErrorException('Erro ao cadastrar processo.');
    return novoProcesso;
  }

  async buscarPorProcesso(num_processo: string) {
    const processo = await this.prisma.processo.findUnique({
      where: { num_processo }
    });
    console.log(processo);
    return processo;
  }

  async dashboard() {
    const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    const data = new Date();
    const gte = new Date(data.getFullYear(), data.getMonth(), 1);
    const lte = new Date(data.getFullYear(), data.getMonth() + 1, 0);
    const parcelas = await this.prisma.parcela.findMany({
      where: {
        vencimento: { gte, lte }
      },
      include: { processo: true }
    });
    const pde = parcelas.filter((parcela) => parcela.processo.tipo == 'PDE');
    const cota = parcelas.filter((parcela) => parcela.processo.tipo == 'COTA');
    const quantidadeTipo = [
      { label: 'PDE', value: pde.length },
      { label: 'COTA', value: cota.length },
    ];
    const valorTipo = [
      { label: 'PDE', value: pde.reduce((acc, parcela) => acc + parcela.valor, 0).toFixed(2) },
      { label: 'COTA', value: cota.reduce((acc, parcela) => acc + parcela.valor, 0).toFixed(2) },
    ];
    const processosTotal = await this.prisma.processo.count();
    const parcelasRecebidas = await this.prisma.parcela.findMany({ where: 
      { 
        status_quitacao: true,
        vencimento: {
          gte: new Date(data.getFullYear(), 0, 1),
          lt: new Date(data.getFullYear(), data.getMonth(), data.getDate())
        }
      } 
    });
    const parcelasReceber = await this.prisma.parcela.findMany({ where: 
      { 
        status_quitacao: false,
        processo: {
          status_pagamento: 'EM_PAGAMENTO',
        },
        vencimento: {
          gte: new Date(data.getFullYear(), data.getMonth(), data.getDate()),
          lt: new Date(data.getFullYear() + 1, 0, 1)
        }
      } 
    });
    const totalRecebido = parcelasRecebidas.reduce((acc, parcela) => acc + parcela.valor, 0).toFixed(2);
    const totalReceber = parcelasReceber.reduce((acc, parcela) => acc + parcela.valor, 0).toFixed(2);
    const mesAtual = data.getMonth();
    const anoAtual = data.getFullYear();
    const projecaoMensal = [];
    const recebidoMensal = [];
    for (let i = mesAtual; i < 12; i++) {
      const parcelas = parcelasReceber.filter((parcela) => parcela.vencimento.getMonth() == i && parcela.vencimento.getFullYear() == anoAtual);
      const value: number = +parcelas.reduce((acc, parcela) => acc + parcela.valor, 0).toFixed(2);
      projecaoMensal.push({ label: `${meses[i]}/${anoAtual}`, value });
    }
    for (let i = 0; i < mesAtual; i++) {
      const parcelas = parcelasRecebidas.filter((parcela) => parcela.vencimento.getMonth() == i && parcela.vencimento.getFullYear() == anoAtual);
      const value: number = +parcelas.reduce((acc, parcela) => acc + parcela.valor, 0).toFixed(2);
      projecaoMensal.push({ label: `${meses[i]}/${anoAtual}`, value });
    }
    return { quantidadeTipo, valorTipo, processosTotal, totalRecebido, totalReceber, projecaoMensal, recebidoMensal };
  }

  async buscarTudo(
    pagina: number = 1,
    limite: number = 10,
    busca?: string,
  ): Promise<ProcessoPaginadoResponseDTO> {
    [pagina, limite] = this.app.verificaPagina(pagina, limite);
    const searchParams = {
      ...(busca && { OR: [
        { num_processo: { contains: busca } },
        { cpf_cnpj: { contains: busca } },
      ]}),
    };
    const total: number = await this.prisma.processo.count({ where: searchParams });
    if (total == 0) return { total: 0, pagina: 0, limite: 0, data: [] };
    [pagina, limite] = this.app.verificaLimite(pagina, limite, total);
    const processos: Processo[] = await this.prisma.processo.findMany({
      where: searchParams,
      skip: (pagina - 1) * limite,
      take: limite,
      include: { parcelas: {
        orderBy: { num_parcela: 'asc' }
      }}
    });
    return {
      total: +total,
      pagina: +pagina,
      limite: +limite,
      data: processos,
    };
  }

  async relatoriosPrincipal(data_inicio?: string, data_fim?: string) {
    const data_inicio_date = data_inicio ? new Date(data_inicio) : new Date();
    const data_fim_date = data_fim ? new Date(data_fim) : new Date();
    const gte = new Date(data_inicio_date.getFullYear(), data_inicio_date.getMonth(), 1);
    const lte = new Date(data_fim_date.getFullYear(), data_fim_date.getMonth() + 1, 0);

    const valor_mes = await this.prisma.parcela.aggregate({
      _sum: { valor: true },
      where: { vencimento: { gte, lte }}
    });

    const processos_mes = await this.prisma.parcela.findMany({
      where: { vencimento: { gte, lte }},
      select: { processo_id: true },
      distinct: ['processo_id']
    })

    return { valor_mes: +valor_mes._sum.valor, processos_mes: processos_mes.length };
  }
}
