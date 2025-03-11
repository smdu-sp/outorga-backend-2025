import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { Permissao } from 'src/auth/decorators/permissao.decorator';
import { UsuarioAtual } from 'src/auth/decorators/usuario-atual.decorator';
import { Usuario } from '@prisma/client';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { BuscarNovoResponseDTO, UsuarioAutorizadoResponseDTO, UsuarioDesativadoResponseDTO, UsuarioPaginadoResponseDTO, UsuarioResponseDTO } from './dto/usuario-response.dto';

@ApiTags('Usuarios')
@ApiBearerAuth()
@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Permissao('usuario_criar')
  @Post('criar')
  criar(
    @UsuarioAtual() usuario: Usuario,
    @Body() createUsuarioDto: CreateUsuarioDto,
  ): Promise<UsuarioResponseDTO> {
    return this.usuariosService.criar(createUsuarioDto);
  }

  @Permissao('usuario_buscar_tudo')
  @Get('buscar-tudo')
  buscarTudo(
    @UsuarioAtual() usuario: Usuario,
    @Query('pagina') pagina?: string,
    @Query('limite') limite?: string,
    @Query('status') status?: string,
    @Query('busca') busca?: string,
  ): Promise<UsuarioPaginadoResponseDTO> {
    return this.usuariosService.buscarTudo(usuario, +pagina, +limite, +status, busca);
  }

  @Permissao('usuario_buscar_id')
  @Get('buscar-por-id/:id')
  buscarPorId(@Param('id') id: string): Promise<UsuarioResponseDTO> {
    return this.usuariosService.buscarPorId(id);
  }

  @Permissao('usuario_atualizar')
  @Patch('atualizar/:id')
  atualizar(
    @UsuarioAtual() usuario: Usuario,
    @Param('id') id: string,
    @Body() updateUsuarioDto: UpdateUsuarioDto,
  ): Promise<UsuarioResponseDTO> {
    return this.usuariosService.atualizar(usuario, id, updateUsuarioDto);
  }

  @Permissao('usuario_lista_completa')
  @Get('lista-completa')
  listaCompleta(): Promise<UsuarioResponseDTO[]> {
    return this.usuariosService.listaCompleta();
  }

  @Permissao('usuario_desativar')
  @Delete('desativar/:id')
  excluir(@Param('id') id: string): Promise<UsuarioDesativadoResponseDTO> {
    return this.usuariosService.excluir(id);
  }

  @Permissao('usuario_autorizar')
  @Patch('autorizar/:id')
  autorizarUsuario(@Param('id') id: string): Promise<UsuarioAutorizadoResponseDTO> {
    return this.usuariosService.autorizaUsuario(id);
  }

  @Get('valida-usuario')
  validaUsuario(@UsuarioAtual() usuario: Usuario): Promise<UsuarioResponseDTO> {
    return this.usuariosService.validaUsuario(usuario.id);
  }

  @Permissao('usuario_buscar_novo')
  @Get('buscar-novo/:login')
  buscarNovo(@Param('login') login: string): Promise<BuscarNovoResponseDTO> {
    return this.usuariosService.buscarNovo(login);
  }
}
