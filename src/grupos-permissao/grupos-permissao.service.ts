import { ForbiddenException, Injectable } from '@nestjs/common';
import { CreateGrupoPermissaoDto } from './dto/create-grupo-permissao.dto';
import { UpdateGrupoPermissaoDto } from './dto/update-grupo-permissao.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { AppService } from 'src/app.service';
import { GrupoPermissao, Usuario } from '@prisma/client';

@Injectable()
export class GruposPermissaoService {
  constructor(
    private prisma: PrismaService,
    private app: AppService
  ) {}

  async criar(createGrupoPermissaoDto: CreateGrupoPermissaoDto): Promise<GrupoPermissao> {
    const { nome, permissoes } = createGrupoPermissaoDto;
    if (!nome || nome === "") throw new ForbiddenException('O nome do grupo de permissão deve ser informado.');
    const validaGrupoPermissao = await this.buscarPorNome(nome);
    if (validaGrupoPermissao) throw new ForbiddenException('Esse grupo de permissão já está cadastrado.');
    const grupo_permissao = await this.prisma.grupoPermissao.create({ include: { permissoes: true }, data: {
      nome,
      permissoes: permissoes && permissoes.length > 0 ? { connect: permissoes.map(id => ({ id }))} : {}
    }});
    if (!grupo_permissao) throw new ForbiddenException('Nao foi possivel criar o grupo de permissão.');
    return grupo_permissao;
  }

  async listaCompleta(): Promise<GrupoPermissao[]> {
    const grupos_permissao: GrupoPermissao[] = await this.prisma.grupoPermissao.findMany({
      orderBy: { nome: 'asc' },
    });
    if (!grupos_permissao) throw new ForbiddenException('Nenhum grupo de permissão encontrado.');
    return grupos_permissao;
  }

  async buscarTudo(
      usuario: Usuario = null,
      pagina: number = 1,
      limite: number = 10,
      busca?: string
  ): Promise<{ total: number; pagina: number; limite: number; data: GrupoPermissao[]}> {
    [pagina, limite] = this.app.verificaPagina(pagina, limite);
    const searchParams = {
      ...(busca && { OR: [
        { nome: { contains: busca } },
      ]}),
    };
    const total: number = await this.prisma.grupoPermissao.count({ where: searchParams });
    if (total == 0) return { total: 0, pagina: 0, limite: 0, data: [] };
    [pagina, limite] = this.app.verificaLimite(pagina, limite, total);
    const grupos_permissao: GrupoPermissao[] = await this.prisma.grupoPermissao.findMany({
      where: searchParams,
      orderBy: { nome: 'asc' },
      include: { permissoes: true },
      skip: (pagina - 1) * limite,
      take: limite,
    });
    return {
      total: +total,
      pagina: +pagina,
      limite: +limite,
      data: grupos_permissao,
    };
  }

  async buscarPorNome(nome: string): Promise<GrupoPermissao> {
    if (!nome || nome === "") throw new ForbiddenException('O nome do grupo de permissão deve ser informado.');
    const grupo_permissao = await this.prisma.grupoPermissao.findUnique({ where: { nome } });
    return grupo_permissao;
  }
    
  async buscarPorId(id: string): Promise<GrupoPermissao> {
    if (!id || id === '') throw new ForbiddenException('O ID do grupo de permissão deve ser informado.');
    const grupo_permissao = await this.prisma.grupoPermissao.findUnique({ where: { id }, include: { permissoes: true }});
    if (!grupo_permissao) throw new ForbiddenException('Grupo de permissão nao encontrado.');
    return grupo_permissao;
  }

  async atualizar(id: string, updateGrupoPermissaoDto: UpdateGrupoPermissaoDto): Promise<GrupoPermissao> {
    const { nome, permissoes } = updateGrupoPermissaoDto;
    if (!id || id === '') throw new ForbiddenException('O ID do grupo de permissão deve ser informado.');
    if (nome === "") throw new ForbiddenException('O nome do grupo de permissão deve ser informado.');
    const validaGrupoPermissao = await this.buscarPorNome(nome);
    if (validaGrupoPermissao && validaGrupoPermissao.id !== id) throw new ForbiddenException('Esse grupo de permissão já está cadastrado.');
    const grupo_permissao = await this.prisma.grupoPermissao.update({ where: { id }, data: {
      ...(nome && { nome }), 
      ...(permissoes && permissoes.length > 0 && { permissoes: { connect: permissoes.map(id => ({ id }))}})
    }});
    if (!grupo_permissao) throw new ForbiddenException('Nao foi possivel atualizar o grupo de permissão.');
    return grupo_permissao;
  }

  async excluir(id: string): Promise<{ desativado: boolean }> {
    if (!id || id === '') throw new ForbiddenException('O ID do grupo de permissão deve ser informado.');
    const grupo_permissao = await this.prisma.grupoPermissao.delete({ where: { id }});
    if (!grupo_permissao) throw new ForbiddenException('Nao foi possivel excluir o grupo de permissão.');
    return { desativado: true };
  }
}
