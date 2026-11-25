const API_URL = import.meta.env.VITE_API_URL ?? `${location.protocol}//${location.hostname}:3000`;

export interface Usuario {
  id_usuario: number;
  nome: string;
  email: string;
  cargo: string;
  time_id: number | null;
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (res.status === 204) return undefined as T;
  if (res.status === 401 && !path.startsWith('/auth/')) {
    window.dispatchEvent(new Event('sessao-expirada'));
  }
  const json = await res.json();
  if (!res.ok) throw Object.assign(new Error(json.erro ?? 'Erro na requisição'), { status: res.status });
  return json as T;
}

export function login(email: string, senha: string) {
  return api<{ usuario: Usuario }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, senha }),
  });
}
