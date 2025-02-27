import {
  BadRequestException,
  ForbiddenException,
  Global,
  Injectable,
  InternalServerErrorException
} from '@nestjs/common';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { $Enums, Permissao, Usuario } from '@prisma/client';
import { AppService } from 'src/app.service';
import { Client, createClient } from 'ldapjs';
import { BuscarNovoResponseDTO, UsuarioAutorizadoResponseDTO, UsuarioPaginadoResponseDTO, UsuarioResponseDTO } from './dto/usuario-response.dto';

@Global()
@Injectable()
export class UsuariosService {
  constructor(
    private prisma: PrismaService,
    private app: AppService,
  ) {}

  async retornaPermissao(id: string): Promise<Permissao> {
    const usuario: Usuario = await this.prisma.usuario.findUnique({ 
      where: { id } 
    });
    return usuario.permissao;
  }

  async listaCompleta(): Promise<UsuarioResponseDTO[]> {
    const lista: Usuario[] = await this.prisma.usuario.findMany({
      orderBy: { nome: 'asc' },
    });
    if (!lista || lista.length == 0) 
      throw new ForbiddenException('Nenhum usuário encontrado.');
    return lista;
  }

  validaPermissaoCriador(
    permissao: $Enums.Permissao,
    permissaoCriador: $Enums.Permissao,
  ): Permissao {
    if (
      permissao === $Enums.Permissao.DEV &&
      permissaoCriador === $Enums.Permissao.SUP
    )
      permissao = $Enums.Permissao.SUP;
    if (
      (permissao === $Enums.Permissao.DEV ||
        permissao === $Enums.Permissao.SUP) &&
      permissaoCriador === $Enums.Permissao.ADM
    )
      permissao = $Enums.Permissao.ADM;
    return permissao;
  }

  async criar(
    createUsuarioDto: CreateUsuarioDto, 
    criador?: Usuario
  ): Promise<UsuarioResponseDTO> {
    const loguser: UsuarioResponseDTO = await this.buscarPorLogin(createUsuarioDto.login);
    if (loguser) throw new ForbiddenException('Login já cadastrado.');
    const emailuser: UsuarioResponseDTO = await this.buscarPorEmail(createUsuarioDto.email);
    if (emailuser) throw new ForbiddenException('Email já cadastrado.');
    if (!criador) createUsuarioDto.permissao = 'USR';
    if (criador) {
      const permissaoCriador: Permissao = await this.retornaPermissao(criador.id);
      if (permissaoCriador !== $Enums.Permissao.DEV)
        createUsuarioDto.permissao = this.validaPermissaoCriador(
          createUsuarioDto.permissao,
          permissaoCriador,
        );
    }
    const usuario: Usuario = await this.prisma.usuario.create({
      data: { ...createUsuarioDto }
    });
    if (!usuario)
      throw new InternalServerErrorException(
        'Não foi possível criar o usuário, tente novamente.',
      );
    return usuario;
  }

  async buscarTudo(
    usuario: Usuario = null,
    pagina: number = 1,
    limite: number = 10,
    status: number = 1,
    busca?: string,
    permissao?: string,
  ): Promise<UsuarioPaginadoResponseDTO> {
    [pagina, limite] = this.app.verificaPagina(pagina, limite);
    const searchParams = {
      ...(busca && { OR: [
        { nome: { contains: busca } },
        { login: { contains: busca } },
        { email: { contains: busca } },
      ]}),
      ...(permissao !== '' && { permissao: $Enums.Permissao[permissao] }),
      ...(usuario.permissao !== 'DEV' ? { status: true } : status && { status: status === 1 }),
    };
    const total: number = await this.prisma.usuario.count({ where: searchParams });
    if (total == 0) return { total: 0, pagina: 0, limite: 0, data: [] };
    [pagina, limite] = this.app.verificaLimite(pagina, limite, total);
    const usuarios: Usuario[] = await this.prisma.usuario.findMany({
      where: searchParams,
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
      where: { id }
    });
    return usuario;
  }

  async buscarPorEmail(email: string): Promise<UsuarioResponseDTO> {
    return await this.prisma.usuario.findUnique({ where: { email } });
  }

  async buscarPorLogin(login: string): Promise<UsuarioResponseDTO> {
    return await this.prisma.usuario.findUnique({ where: { login } });
  }

  async atualizar(
    usuario: Usuario,
    id: string,
    updateUsuarioDto: UpdateUsuarioDto,
  ): Promise<UsuarioResponseDTO> {
    const usuarioLogado: Usuario = await this.buscarPorId(usuario.id);
    if (!usuarioLogado || ['TEC', 'USR'].includes(usuarioLogado.permissao) && id !== usuarioLogado.id)
      throw new ForbiddenException('Operação não autorizada para este usuário.')
    if (updateUsuarioDto.login) {
      const usuario: Usuario = await this.buscarPorLogin(updateUsuarioDto.login);
      if (usuario && usuario.id !== id)
        throw new ForbiddenException('Login já cadastrado.');
    }
    if (updateUsuarioDto.permissao)
      updateUsuarioDto.permissao = this.validaPermissaoCriador(
        updateUsuarioDto.permissao,
        usuarioLogado.permissao,
      );
    const usuarioAtualizado: Usuario = await this.prisma.usuario.update({
      data: updateUsuarioDto,
      where: { id },
    });
    return usuarioAtualizado;
  }

  async excluir(id: string): Promise<{ desativado: boolean }> {
    await this.prisma.usuario.update({
      data: { status: false },
      where: { id },
    });
    return {
      desativado: true,
    };
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
    const client: Client = createClient({
      url: process.env.LDAP_SERVER,
    });
    await new Promise<void>((resolve, reject) => {
      client.bind(`${process.env.USER_LDAP}${process.env.LDAP_DOMAIN}`, process.env.PASS_LDAP, (err) => {
        if (err) {
          client.destroy();
          reject(new InternalServerErrorException('Não foi possível buscar o usuário.'));
        }
        resolve();
      });
    });
    const usuario_ldap = await new Promise<any>((resolve, reject) => {
      client.search(
        process.env.LDAP_BASE,
        {
          filter: `(&(samaccountname=${login})(company=SMUL))`,
          scope: 'sub',
          attributes: ['name', 'mail'],
        },
        (err, res) => {
          if (err) {
            client.destroy();
            resolve('erro');
          }
          res.on('searchEntry', async (entry) => {
            const nome = JSON.stringify(
              entry.pojo.attributes[0].values[0],
            ).replaceAll('"', '');
            const email = JSON.stringify(
              entry.pojo.attributes[1].values[0],
            ).replaceAll('"', '').toLowerCase();
            resolve({ nome, email });
          });
          res.on('error', (err) => {
            client.destroy();
            resolve('erro');
          });
          res.on('end', () => {
            client.destroy();
            resolve('erro');
          });
        },
      );
    });
    client.destroy();
    if (!usuario_ldap.email) throw new BadRequestException('Usuário não encontrado.');
    return {
      login,
      nome: usuario_ldap.nome,
      email: usuario_ldap.email,
    };
  }
}
