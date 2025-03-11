import { Global, Module } from '@nestjs/common';
import { CadastrosModule } from './cadastros/cadastros.module';
import { PrismaModule } from './prisma/prisma.module';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RoleGuard } from './auth/guards/role.guard';
import { ProcessosModule } from './processos/processos.module';
import { PermissoesModule } from './permissoes/permissoes.module';

@Global()
@Module({
  exports: [AppService],
  imports: [CadastrosModule, PrismaModule, AuthModule, UsuariosModule, ProcessosModule, PermissoesModule],
  controllers: [],
  providers: [AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RoleGuard,
    },
  ],
})
export class AppModule {}