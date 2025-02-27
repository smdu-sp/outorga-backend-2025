export interface UsuarioJwt {
  id: string;
  login: string;
  nome: string;
  email: string;
  permissao: string;
  status: boolean;
  avatar?: string;
}
