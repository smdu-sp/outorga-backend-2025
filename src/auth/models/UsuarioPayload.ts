export interface UsuarioPayload {
  sub: string;
  login: string;
  email: string;
  nome: string;
  permissao: string;
  status: boolean;
  avatar?: string;
  iat?: number;
  exp?: number;
}
