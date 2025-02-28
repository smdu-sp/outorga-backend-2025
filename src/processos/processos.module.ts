import { Module } from '@nestjs/common';
import { ProcessosService } from './processos.service';
import { ProcessosController } from './processos.controller';

@Module({
  controllers: [ProcessosController],
  providers: [ProcessosService],
})
export class ProcessosModule {}
