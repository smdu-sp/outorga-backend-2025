import { Injectable } from '@nestjs/common';
import { CreateProcessoDto } from './dto/create-processo.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { AppService } from 'src/app.service';

@Injectable()
export class ProcessosService {
  constructor(
    private prisma: PrismaService
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
}
