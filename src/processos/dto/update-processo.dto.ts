import { PartialType } from '@nestjs/swagger';
import { CreateProcessoDto } from './create-processo.dto';

export class UpdateProcessoDto extends PartialType(CreateProcessoDto) {}
