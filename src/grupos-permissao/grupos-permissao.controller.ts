import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { GruposPermissaoService } from './grupos-permissao.service';
import { CreateGrupoPermissaoDto } from './dto/create-grupo-permissao.dto';
import { UpdateGrupoPermissaoDto } from './dto/update-grupo-permissao.dto';
import { Permissao } from 'src/auth/decorators/permissao.decorator';
import { GrupoPermissao, Usuario } from '@prisma/client';
import { UsuarioAtual } from 'src/auth/decorators/usuario-atual.decorator';

@Controller('grupos-permissao')
export class GruposPermissaoController {
  constructor(private readonly gruposPermissaoService: GruposPermissaoService) {}

  @Permissao('grupo_permissao_criar')
  @Post('criar')
  criar(@Body() createGrupoPermissaoDto: CreateGrupoPermissaoDto): Promise<GrupoPermissao> {
    return this.gruposPermissaoService.criar(createGrupoPermissaoDto);
  }

  @Permissao('grupo_permissao_lista_completa')
  @Get('lista-completa')
  listaCompleta(): Promise<GrupoPermissao[]> {
    return this.gruposPermissaoService.listaCompleta();
  }

  @Permissao('grupo_permissao_buscar_tudo')
  @Get('buscar-tudo')
  buscarTudo(
    @UsuarioAtual() usuario: Usuario,
    @Query('pagina') pagina?: string,
    @Query('limite') limite?: string,
    @Query('busca') busca?: string
  ): Promise<{ total: number; pagina: number; limite: number; data: GrupoPermissao[] }> {
    return this.gruposPermissaoService.buscarTudo(usuario, +pagina, +limite, busca);
  }

  @Permissao('grupo_permissao_buscar_id')
  @Get('buscar-por-id/:id')
  buscarPorId(@Param('id') id: string): Promise<GrupoPermissao> {
    return this.gruposPermissaoService.buscarPorId(id);
  }

  @Permissao('grupo_permissao_atualizar')
  @Patch('atualizar/:id')
  atualizar(@Param('id') id: string, @Body() updateGrupoPermissaoDto: UpdateGrupoPermissaoDto): Promise<GrupoPermissao> {
    return this.gruposPermissaoService.atualizar(id, updateGrupoPermissaoDto);
  }

  @Permissao('grupo_permissao_excluir')
  @Delete('excluir/:id')
  excluir(@Param('id') id: string): Promise<{ desativado: boolean }> {
    return this.gruposPermissaoService.excluir(id);
  }
}
