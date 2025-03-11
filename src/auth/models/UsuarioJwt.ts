import { Permissao } from "@prisma/client";

export interface UsuarioJwt {
  id: string;
  login: string;
  nome: string;
  email: string;
  status: boolean;
  avatar?: string;
  dev: boolean;
}
