import { BadRequestException, Injectable } from '@nestjs/common';
import { AppService } from 'src/app.service';
import { BiService } from 'src/prisma/bi.service';

@Injectable()
export class CadastrosService {
  constructor(
    private bi: BiService,
    private app: AppService
  ) {}
  async buscarTudo(
    pagina: number = 1,
    limite: number = 10,
    busca?: string,
    sistema?: string
  ) {
    [pagina, limite] = this.app.verificaPagina(pagina, limite);
    const searchParams = {
      ...(busca && busca !== "" &&
        { OR: [
            { sql_incra: { startsWith: this.app.formatarSql(busca)}},
        ] }),
      ...(sistema && sistema !== "" && { sistema: sistema }),
    };
    const total = await this.bi.cadastros.count({ where: searchParams });
    if (total == 0) return { total: 0, pagina: 0, limite: 0, users: [] };
    [pagina, limite] = this.app.verificaLimite(pagina, limite, total);
    const cadastros = await this.bi.cadastros.findMany({
      where: searchParams,
      orderBy: {
        assunto: {
          dtInclusaoAssunto: 'desc'
        }
      },
      include: { 
        assunto: {
          include: {
            categoria: true
          }
        },
        endereco: true
      },
      skip: (pagina - 1) * limite,
      take: limite,
    });
    return {
      total: +total,
      pagina: +pagina,
      limite: +limite,
      data: cadastros
    };
  }

  async buscarLista(
    sqls: string[]
  ) {
    if (sqls.length <= 0)
      throw new BadRequestException('Lista de SQL vazia.');
    const resposta = [];
    let progresso = 0;
    const dataRelatorio = new Date();
    for (const sql of sqls) {
      const sqlFormatado = this.app.adicionaDigitoSql(sql)
      const cadastro = await this.bi.cadastros.findMany({
        where: {
          sql_incra: { startsWith: sqlFormatado }
        },
        orderBy: {
          assunto: {
            dtInclusaoAssunto: 'desc'
          }
        },
        select: {
          sql_incra: true,
          processo: true,
          sistema: true,
          //falta coordenadoria,
          assunto: {
            select: {
              assunto: true,
              dtInclusaoAssunto: true,
              situacaoAssunto: true,
              dtEmissaoDocumento: true,
            }
          }
        }
      });

      if (cadastro.length > 0){
        cadastro.map((cad, index) => {
          resposta.push({
            'SQL': cad.sql_incra,
            'Processo': cad.processo && cad.processo,
            'Sistema': cad.sistema && cad.sistema,
            'Assunto': cad.assunto && cad.assunto.assunto,
            'Situação': cad.assunto && cad.assunto.situacaoAssunto,
            'Data de Inclusão': cad.assunto && new Date(cad.assunto.dtInclusaoAssunto).toLocaleDateString(),
            'Data de Encerramento': cad.assunto && cad.assunto.dtEmissaoDocumento && new Date(cad.assunto.dtEmissaoDocumento).toLocaleDateString(),
          })
        });
      } else {
        resposta.push({
          'SQL': sqlFormatado,
          'Processo': 'Nenhum processo encontrado',
        })
      }
    }
    if (resposta.length > 0)
      resposta[0]['Data do relatório'] = `${dataRelatorio.toLocaleDateString('pt-BR')} ${dataRelatorio.toLocaleTimeString('pt-BR')}`;
    return resposta;
  }

  async buscaListaSQLMulti(
    sqls: string[]
  ) {
    const sqls_formatados = [];

    sqls.map(sql => {
      const sql_formatado = this.app.adicionaDigitoSql(sql);
      if (!sqls_formatados.includes(sql_formatado))
        sqls_formatados.push(sql_formatado);
    });

    const dataRelatorio = new Date();
    const cadastros = await this.bi.cadastros.findMany({
      where: {
        sql_incra: { in: sqls_formatados }
      },
      orderBy: {
        sql_incra: 'asc'
      },
      select: {
        sql_incra: true,
        processo: true,
        sistema: true,
        //falta coordenadoria,
        assunto: {
          select: {
            assunto: true,
            dtInclusaoAssunto: true,
            situacaoAssunto: true,
            dtEmissaoDocumento: true
          }
        }
      }
    });

    const resposta = [];

    if (cadastros.length > 0){
      cadastros.map(cad => {
        resposta.push({
          'SQL': cad.sql_incra,
          'Processo': cad.processo && cad.processo,
          'Sistema': cad.sistema && cad.sistema,
          'Assunto': cad.assunto && cad.assunto.assunto,
          'Situação': cad.assunto && cad.assunto.situacaoAssunto,
          'Data de Inclusão': cad.assunto && new Date(cad.assunto.dtInclusaoAssunto).toLocaleDateString(),
          'Data de Encerramento': cad.assunto && cad.assunto.dtEmissaoDocumento && new Date(cad.assunto.dtEmissaoDocumento).toLocaleDateString(),
        })
      });
    }

    sqls_formatados.map(sql => {
      if (!resposta.find(cad => cad['SQL'] === sql)){
        resposta.push({
          'SQL': sql,
          'Processo': 'Nenhum processo encontrado',
        })
      }
    });

    if (resposta.length > 0) {
      resposta[0]['Data do relatório'] = `${dataRelatorio.toLocaleDateString('pt-BR')} ${dataRelatorio.toLocaleTimeString('pt-BR')}`;
    }
    
    return resposta;
  }

  async buscaListaSQLTabela(
    sqls: string[]
  ) {
    var sqls_formatados = [];

    sqls.map(sql => {
      const sql_formatado = this.app.adicionaDigitoSql(sql);
      if (!sqls_formatados.includes(sql_formatado))
        sqls_formatados.push(sql_formatado);
    });

    // const dataRelatorio = new Date();
    const cadastros = await this.bi.cadastros.findMany({
      where: {
        sql_incra: { in: sqls_formatados }
      },
      orderBy: {
        sql_incra: 'asc'
      },
      select: {
        sql_incra: true,
        processo: true,
        sistema: true,
        //falta coordenadoria,
        assunto: {
          select: {
            assunto: true,
            dtInclusaoAssunto: true,
            situacaoAssunto: true,
            dtEmissaoDocumento: true
          }
        }
      }
    });

    const resposta = [];
    sqls_formatados.sort();
    sqls_formatados.map(sql => {
      var processos = cadastros.filter(cad => cad.sql_incra === sql);
      processos = processos.sort((a, b) => {
        const dateA = a.assunto && a.assunto.dtInclusaoAssunto ? a.assunto.dtInclusaoAssunto : new Date();
        const dateB = b.assunto && b.assunto.dtInclusaoAssunto ? b.assunto.dtInclusaoAssunto : new Date();
        return dateA.getTime() - dateB.getTime();
      });
      const sql_processos = {
        sql,
        processos: processos.length > 0 ?
          processos.map(cad => ({
            processo: cad.processo,
            sistema: cad.sistema,
            assunto: cad.assunto && cad.assunto.assunto,
            situacao: cad.assunto && cad.assunto.situacaoAssunto,
            dataInclusao: cad.assunto && new Date(cad.assunto.dtInclusaoAssunto).toLocaleDateString(),
            dataEncerramento: cad.assunto && cad.assunto.dtEmissaoDocumento && new Date(cad.assunto.dtEmissaoDocumento).toLocaleDateString()
          }))
        : [{
          processo: 'Nenhum processo encontrado'
        }]
      }
      resposta.push(sql_processos);
    });

    return resposta;
  }

  async buscaListaSistemas() {
    const sistemas = await this.bi.cadastros.findMany({
      distinct: ['sistema'],
      select: {
        sistema: true
      }
    })
    return sistemas;
  }
}