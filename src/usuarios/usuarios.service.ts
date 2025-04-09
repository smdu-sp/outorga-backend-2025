import {
  BadRequestException,
  ForbiddenException,
  Global,
  Injectable,
  InternalServerErrorException,
  NotFoundException
} from '@nestjs/common';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { $Enums, Permissao, Usuario } from '@prisma/client';
import { AppService } from 'src/app.service';
import { Client as LdapClient } from 'ldapts';
import { BuscarNovoResponseDTO, UsuarioAutorizadoResponseDTO, UsuarioPaginadoResponseDTO, UsuarioResponseDTO } from './dto/usuario-response.dto';

@Global()
@Injectable()
export class UsuariosService {
  constructor(
    private prisma: PrismaService,
    private app: AppService,
  ) {}

  async permitido(id: string, permissao: string): Promise<boolean> {
    if (!id || id === '') throw new BadRequestException('ID vazio.');
    if (!permissao || permissao === '') throw new BadRequestException('ID vazio.');
    const usuario = await this.prisma.usuario.findUnique({ 
      where: { 
        id,
        OR: [
          { permissoes: { some: { permissao }}},
          { grupos: { some: { permissoes: { some: { permissao }}}}},
          { dev: true },
        ]
      },
      select: { id: true }
    });
    return !usuario ? false : true;
  }

  async listaCompleta(): Promise<UsuarioResponseDTO[]> {
    const lista: Usuario[] = await this.prisma.usuario.findMany({
      orderBy: { nome: 'asc' },
    });
    if (!lista || lista.length == 0) throw new ForbiddenException('Nenhum usuário encontrado.');
    return lista;
  }

  async criar(
    createUsuarioDto: CreateUsuarioDto,
  ): Promise<UsuarioResponseDTO> {
    const { grupos, permissoes } = createUsuarioDto;
    const loguser: UsuarioResponseDTO = await this.buscarPorLogin(createUsuarioDto.login);
    if (loguser) throw new ForbiddenException('Login já cadastrado.');
    const emailuser: UsuarioResponseDTO = await this.buscarPorEmail(createUsuarioDto.email);
    if (emailuser) throw new ForbiddenException('Email já cadastrado.');
    const usuario: Usuario = await this.prisma.usuario.create({
      data: {
        ...createUsuarioDto,
        grupos: grupos && grupos.length > 0 ? { connect: grupos.map(id => ({ id }))} : {},
        permissoes: permissoes && permissoes.length > 0 ? { connect: permissoes.map(id => ({ id }))} : {},
      },
      include: { grupos: true, permissoes: true },
    });
    if (!usuario) throw new InternalServerErrorException('Não foi possível criar o usuário, tente novamente.');
    return usuario;
  }

  async buscarTudo(
    usuario: Usuario = null,
    pagina: number = 1,
    limite: number = 10,
    status: number = 1,
    busca?: string
  ): Promise<UsuarioPaginadoResponseDTO> {
    [pagina, limite] = this.app.verificaPagina(pagina, limite);
    const searchParams = {
      ...(busca && { OR: [
        { nome: { contains: busca } },
        { login: { contains: busca } },
        { email: { contains: busca } },
      ]}),
    };
    const total: number = await this.prisma.usuario.count({ where: searchParams });
    if (total == 0) return { total: 0, pagina: 0, limite: 0, data: [] };
    [pagina, limite] = this.app.verificaLimite(pagina, limite, total);
    const usuarios: Usuario[] = await this.prisma.usuario.findMany({
      where: searchParams,
      include: { grupos: true, permissoes: true },
      orderBy: { nome: 'asc' },
      skip: (pagina - 1) * limite,
      take: limite,
    });
    return {
      total: +total,
      pagina: +pagina,
      limite: +limite,
      data: usuarios,
    };
  }

  async buscarPorId(id: string): Promise<UsuarioResponseDTO> {
    const usuario: Usuario = await this.prisma.usuario.findUnique({
      where: { id },
      include: { grupos: true, permissoes: true },
    });
    return usuario;
  }

  async buscarPorEmail(email: string): Promise<UsuarioResponseDTO> {
    return await this.prisma.usuario.findUnique({ where: { email } });
  }

  async buscarPorLogin(login: string): Promise<UsuarioResponseDTO> {
    return await this.prisma.usuario.findUnique({ where: { login }, include: { permissoes: true } });
  }

  async atualizar(
    usuario: Usuario,
    id: string,
    updateUsuarioDto: UpdateUsuarioDto,
  ): Promise<UsuarioResponseDTO> {
    const usuarioLogado: Usuario = await this.buscarPorId(usuario.id);
    const { grupos, permissoes } = updateUsuarioDto;
    if (updateUsuarioDto.login) {
      const usuario: Usuario = await this.buscarPorLogin(updateUsuarioDto.login);
      if (usuario && usuario.id !== id){
        console.log(usuario);
        // throw new ForbiddenException('Login já cadastrado.');
      }
    }
    const usuarioAtualizado: Usuario = await this.prisma.usuario.update({
      data: {
        ...updateUsuarioDto,
        ...(grupos && grupos.length >= 0 && { grupos: { set: [], connect: grupos.map(id => ({ id }))}}),
        ...(permissoes && permissoes.length >= 0 && { permissoes: { set: [], connect: permissoes.map(id => ({ id }))}}),
      },
      where: { id },
      include: { grupos: true, permissoes: true },
    });
    return usuarioAtualizado;
  }

  async excluir(id: string): Promise<{ desativado: boolean }> {
    await this.prisma.usuario.update({
      data: { status: false },
      where: { id },
    });
    return { desativado: true };
  }

  async autorizaUsuario(id: string): Promise<UsuarioAutorizadoResponseDTO> {
    const autorizado: Usuario = await this.prisma.usuario.update({
      where: { id },
      data: { status: true },
    });
    if (autorizado && autorizado.status === true) return { autorizado: true };
    throw new ForbiddenException('Erro ao autorizar o usuário.');
  }

  async validaUsuario(id: string): Promise<UsuarioResponseDTO> {
    const usuario: Usuario = await this.prisma.usuario.findUnique({ where: { id }});
    if (!usuario) throw new ForbiddenException('Usuário não encontrado.');
    if (usuario.status !== true) throw new ForbiddenException('Usuário inativo.');
    return usuario;
  }

  async buscarNovo(login: string): Promise<BuscarNovoResponseDTO> {
    const usuarioExiste: Usuario = await this.buscarPorLogin(login);
    if (usuarioExiste && usuarioExiste.status === true) throw new ForbiddenException('Login já cadastrado.');
    if (usuarioExiste && usuarioExiste.status !== true){
      const usuarioReativado: Usuario = await this.prisma.usuario.update({ 
        where: { id: usuarioExiste.id }, 
        data: { status: true } 
      });
      return usuarioReativado;
    }
    const client: LdapClient = new LdapClient({
      url: process.env.LDAP_SERVER,
    });
    try {
      await client.bind(`${process.env.USER_LDAP}${process.env.LDAP_DOMAIN}`, process.env.PASS_LDAP);
    } catch (error) {
      throw new InternalServerErrorException('Não foi possível buscar o usuário.');
    }
    let nome: string, email: string;
    try {
      const usuario = await client.search(
        process.env.LDAP_BASE,
        {
          filter: `(&(samaccountname=${login})(company=SMUL))`,
          scope: 'sub',
          attributes: ['name', 'mail'],
        }
      );
      const { name, mail } = usuario.searchEntries[0];
      nome = name.toString();
      email = mail.toString().toLowerCase();
    } catch (error) {
      await client.unbind();
      throw new InternalServerErrorException('Não foi possível buscar o usuário.');
    }
    if (!nome || !email) throw new NotFoundException('Usuário não encontrado.');
    return { login, nome, email };
  }
}
