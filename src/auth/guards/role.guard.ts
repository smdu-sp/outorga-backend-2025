import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UsuariosService } from 'src/usuarios/usuarios.service';

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private readonly usuariosService: UsuariosService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const permissao = this.reflector.get<string>(
      'permissao',
      context.getHandler(),
    );
    if (!permissao) return true;
    const request = context.switchToHttp().getRequest();
    const { id } = request.user;
    return await this.usuariosService.permitido(id, permissao);
  }
}
