import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { CadastrosService } from './cadastros.service';
import { IsPublic } from 'src/auth/decorators/is-public.decorator';
import { ListaSql } from './dto/cadastros.dto';

@Controller('cadastros')
export class CadastrosController {
  constructor(private readonly cadastrosService: CadastrosService) {}

  @Get('buscar-tudo')
  buscarTudo(
    @Query('pagina') pagina?: string,
    @Query('limite') limite?: string,
    @Query('busca') busca?: string,
    @Query('sistema') sistema?: string,
  ) {
    return this.cadastrosService.buscarTudo(+pagina, +limite, busca, sistema);
  }

  @Post('buscar-lista-sql')
  buscarLista(
    @Body() body: { listaSql: string[] }
  ) {
    return this.cadastrosService.buscaListaSQLTabela(body.listaSql);
  }

  @IsPublic()
  @Get('lista-sistemas')
  buscarListaSistemas() {
    return this.cadastrosService.buscaListaSistemas();
  }
}
