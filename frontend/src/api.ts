const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

export interface Usuario {
  id_usuario: number;
  nome: string;
  email: string;
  cargo: string;
  time_id: number | null;
}

/** Wrapper do fetch: injeta o token JWT e lança Error com a mensagem da API. */
export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (res.status === 204) return undefined as T;
  const json = await res.json();
  if (!res.ok) throw new Error(json.erro ?? 'Erro na requisição');
  return json as T;
}

export function login(email: string, senha: string) {
  return api<{ token: string; usuario: Usuario }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, senha }),
  });
}
