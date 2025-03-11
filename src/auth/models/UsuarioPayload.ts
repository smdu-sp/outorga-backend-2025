import { Permissao } from "@prisma/client";

export interface UsuarioPayload {
  sub: string;
  login: string;
  email: string;
  nome: string;
  status: boolean;
  avatar?: string;
  dev: boolean;
  iat?: number;
  exp?: number;
}
