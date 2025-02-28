import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ProcessosService } from './processos.service';
import { CreateProcessoDto } from './dto/create-processo.dto';
import { UpdateProcessoDto } from './dto/update-processo.dto';

@Controller('processos')
export class ProcessosController {
  constructor(private readonly processosService: ProcessosService) {}

  @Post('criar')
  criar(@Body() createProcessoDto: CreateProcessoDto[]) {
    return this.processosService.criar(createProcessoDto);
  }
}
