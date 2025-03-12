import { Module } from '@nestjs/common';
import { GruposPermissaoService } from './grupos-permissao.service';
import { GruposPermissaoController } from './grupos-permissao.controller';

@Module({
  controllers: [GruposPermissaoController],
  providers: [GruposPermissaoService],
})
export class GruposPermissaoModule {}
