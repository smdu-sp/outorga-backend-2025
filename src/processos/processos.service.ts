import { Injectable } from '@nestjs/common';
import { CreateProcessoDto } from './dto/create-processo.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { AppService } from 'src/app.service';
import { Processo, Usuario } from '@prisma/client';
import { ProcessoPaginadoResponseDTO } from './dto/processo-response.dto';

@Injectable()
export class ProcessosService {
  constructor(
    private prisma: PrismaService,
    private app: AppService
  ) {}
  
  async criar(createProcessoDto: CreateProcessoDto[]) {
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
            cpf_cnpj: processo.cpf_cnpj,
            data_entrada: processo.data_entrada,
            parcelas: {
              create: processo.parcelas.map((parcela) => ({
                valor: parcela.valor || 0,
                vencimento: parcela.vencimento,
                num_parcela: parcela.num_parcela,
                data_quitacao: parcela.data_quitacao || undefined,
                status_quitacao: parcela.status_quitacao || false,
                ano_pagamento: parcela.ano_pagamento || undefined
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
        orderBy: { vencimento: 'desc' }
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
    const processosTotal = await this.prisma.processo.count({ 
      where: {
        parcelas: {
          some: {
            AND: [
              data_inicio && { data_quitacao: { gte: new Date(data_inicio)}},
              data_fim && { data_quitacao: { lte: new Date(data_fim)}}
            ]
          }
        }
      } 
    });
  }
}
