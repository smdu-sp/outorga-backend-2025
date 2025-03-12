import { PartialType } from '@nestjs/swagger';
import { CreateGrupoPermissaoDto } from './create-grupo-permissao.dto';

export class UpdateGrupoPermissaoDto extends PartialType(CreateGrupoPermissaoDto) {}
