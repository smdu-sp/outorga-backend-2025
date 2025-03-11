import { SetMetadata } from '@nestjs/common';

export const Permissao = (permissao: string) =>
  SetMetadata('permissao', permissao);
