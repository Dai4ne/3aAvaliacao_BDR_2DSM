// Define os cargos e adiciona o usuário autenticado ao tipo de requisição do Express.
export type Cargo =
  | 'superusuario'
  | 'gestor'
  | 'comercial'
  | 'suporte'
  | 'producao'
  | 'software'
  | 'implantacao'
  | 'monitoramento';

export interface AuthUser {
  id: number;
  cargo: Cargo;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}
