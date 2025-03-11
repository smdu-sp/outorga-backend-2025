import { BadRequestException, ForbiddenException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreatePermissaoDto } from './dto/create-permissao.dto';
import { UpdatePermissaoDto } from './dto/update-permissao.dto';
import { AppService } from 'src/app.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { Permissao, Usuario } from '@prisma/client';

@Injectable()
export class PermissoesService {
  constructor(
    private prisma: PrismaService,
    private app: AppService
  ) {}

  async buscarPorPermissao(permissao: string) {
    const permissaoBusca = await this.prisma.permissao.findUnique({ where: { permissao }});
    return permissaoBusca;
  }
  
  async criar(createPermissaoDto: CreatePermissaoDto) {
    const { nome, permissao, grupos } = createPermissaoDto;
    if (!nome || nome === '') throw new BadRequestException('O nome da permissão deve ser informado.');
    if (!permissao || permissao === '') throw new BadRequestException('A permissão deve ser informada.');
    const validaPermissao = await this.buscarPorPermissao(permissao);
    if (validaPermissao) throw new BadRequestException('Essa permissão já está cadastrada.');
    const permissaoNova = await this.prisma.permissao.create({ data: { 
      nome,
      permissao,
      grupos: grupos && grupos.length > 0 ? { connect: grupos.map(id => ({ id }))} : {}
    }});
    if (!permissaoNova) throw new InternalServerErrorException('Não foi possível criar a permissão.');
    return permissaoNova;
  }
  
  async listaCompleta() {
    const lista: Permissao[] = await this.prisma.permissao.findMany({
      orderBy: { nome: 'asc' }
    });
    if (!lista || lista.length == 0) throw new ForbiddenException('Nenhuma permissão encontrada.');
    return lista;
  }

  async buscarTudo(
    usuario: Usuario = null,
    pagina: number = 1,
    limite: number = 10,
    busca?: string
  ) {
    [pagina, limite] = this.app.verificaPagina(pagina, limite);
    const searchParams = {
      ...(busca && { OR: [
        { nome: { contains: busca } },
      ]}),
    };
    const total: number = await this.prisma.permissao.count({ where: searchParams });
    if (total == 0) return { total: 0, pagina: 0, limite: 0, data: [] };
    [pagina, limite] = this.app.verificaLimite(pagina, limite, total);
    const permissoes: Permissao[] = await this.prisma.permissao.findMany({
      where: searchParams,
      orderBy: { nome: 'asc' },
      include: { grupos: true },
      skip: (pagina - 1) * limite,
      take: limite,
    });
    return {
      total: +total,
      pagina: +pagina,
      limite: +limite,
      data: permissoes,
    };
  }

  async buscarPorId(id: string) {
    if (!id || id === '') throw new BadRequestException('O ID da permissão deve ser informado.');
    const permissao = await this.prisma.permissao.findUnique({ where: { id }, include: { grupos: true }});
    if (!permissao) throw new NotFoundException('Permissão nao encontrada.');
    return permissao;
  }

  async atualizar(id: string, updatePermissaoDto: UpdatePermissaoDto) {
    const { nome, permissao, grupos } = updatePermissaoDto;
    if (!id || id === '') throw new BadRequestException('O ID da permissão deve ser informado.');
    if (nome === '') throw new BadRequestException('O nome da permissão não pode ser vazio.');
    if (permissao === '') throw new BadRequestException('O campo permissão não pode ser vazio.');
    if (permissao && permissao !== '') {
      const validaPermissao = await this.buscarPorPermissao(permissao);
      if (validaPermissao && validaPermissao.id !== id) throw new BadRequestException('Essa permissão já está cadastrada.');
    }
    const permissaoAtualizada = await this.prisma.permissao.update({ where: { id }, data: {
      ...(nome && { nome }),
      ...(permissao && { permissao }),
      ...(grupos && { grupos: {
        connect: grupos.map(id => ({ id }))
      }})
    }})
    if (!permissaoAtualizada) throw new InternalServerErrorException('Nao foi possivel atualizar a permissao.');
    return permissaoAtualizada;
  }

  async excluir(id: string) {
    if (!id || id === '') throw new BadRequestException('O ID da permissão deve ser informado.');
    const permissao = await this.prisma.permissao.delete({ where: { id }});
    if (!permissao) throw new NotFoundException('Permissão nao encontrada.');
    return { message: 'Permissão excluida com sucesso.' };
  }
}
