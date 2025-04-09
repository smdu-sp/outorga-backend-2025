import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { ProcessosService } from './processos.service';
import { CreateProcessoDto } from './dto/create-processo.dto';
import { ProcessoPaginadoResponseDTO } from './dto/processo-response.dto';
import { Permissao } from 'src/auth/decorators/permissao.decorator';

@Controller('processos')
export class ProcessosController {
  constructor(private readonly processosService: ProcessosService) {}

  @Permissao('processos_importar')
  @Post('importar')
  importar(@Body() createProcessoDto: CreateProcessoDto[]) {
    return this.processosService.importar(createProcessoDto);
  }

  @Permissao('processos_criar')
  @Post('criar')
  criar(@Body() createProcessoDto: CreateProcessoDto) {
    return this.processosService.criar(createProcessoDto);
  }


  @Get('buscar-tudo')
  buscarTudo(
    @Query('pagina') pagina?: string,
    @Query('limite') limite?: string,
    @Query('busca') busca?: string,
  ): Promise<ProcessoPaginadoResponseDTO> {
    return this.processosService.buscarTudo(+pagina, +limite, busca);
  }

  @Get('relatorios/principal')
  relatoriosPrincipal(
    @Query('data_inicio') data_inicio?: string,
    @Query('data_fim') data_fim?: string
  ) {
    return this.processosService.relatoriosPrincipal(data_inicio, data_fim);
  }
}
