import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { PermissoesService } from './permissoes.service';
import { CreatePermissaoDto } from './dto/create-permissao.dto';
import { UpdatePermissaoDto } from './dto/update-permissao.dto';
import { Permissao } from 'src/auth/decorators/permissao.decorator';
import { Usuario } from '@prisma/client';
import { UsuarioAtual } from 'src/auth/decorators/usuario-atual.decorator';

@Controller('permissoes')
export class PermissoesController {
  constructor(private readonly permissoesService: PermissoesService) {}

  @Permissao('permissao_criar')
  @Post('criar')
  criar(@Body() createPermissaoDto: CreatePermissaoDto) {
    return this.permissoesService.criar(createPermissaoDto);
  }
  
  @Permissao('permissao_lista_completa')
  @Get('lista-completa')
  listaCompleta() {
    return this.permissoesService.listaCompleta();
  }

  @Permissao('permissao_buscar_tudo')
  @Get('buscar-tudo')
  buscarTudo(
    @UsuarioAtual() usuario: Usuario,
    @Query('pagina') pagina?: string,
    @Query('limite') limite?: string,
    @Query('busca') busca?: string
  ) {
    return this.permissoesService.buscarTudo(usuario, +pagina, +limite, busca);
  }

  @Permissao('permissao_buscar_id')
  @Get('buscar-por-id/:id')
  buscarPorId(@Param('id') id: string) {
    return this.permissoesService.buscarPorId(id);
  }

  @Permissao('permissao_atualizar')
  @Patch('atualizar/:id')
  atualizar(@Param('id') id: string, @Body() updatePermissaoDto: UpdatePermissaoDto) {
    return this.permissoesService.atualizar(id, updatePermissaoDto);
  }

  @Permissao('permissao_excluir')
  @Delete('excluir/:id')
  excluir(@Param('id') id: string) {
    return this.permissoesService.excluir(id);
  }
}
