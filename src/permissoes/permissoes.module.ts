import { Module } from '@nestjs/common';
import { PermissoesService } from './permissoes.service';
import { PermissoesController } from './permissoes.controller';

@Module({
  controllers: [PermissoesController],
  providers: [PermissoesService],
})
export class PermissoesModule {}
