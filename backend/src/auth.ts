// Gerencia sessões por cookie e verifica o cargo antes de liberar ações.
import { randomBytes } from 'node:crypto';
import { NextFunction, Request, Response } from 'express';
import type { RowDataPacket } from 'mysql2';
import { AppError } from './AppError';
import { pool } from './db';
import type { AuthUser, Cargo } from './express';

const nomeCookie = 'altave_sessao';
const duracao = 8 * 60 * 60 * 1000;
// Uma sessão guarda o ID do usuário e o horário de expiração em memória.
const sessoes = new Map<string, { usuarioId: number; expiraEm: number }>();

function idSessao(req: Request) {
  return req.headers.cookie?.match(/(?:^|;\s*)altave_sessao=([a-f0-9]{64})(?:;|$)/)?.[1];
}

function opcoesCookie(req: Request) {
  return { httpOnly: true, sameSite: 'strict' as const, secure: req.secure, path: '/' };
}

export function iniciarSessao(req: Request, res: Response, usuario: AuthUser) {
  const agora = Date.now();
  for (const [id, sessao] of sessoes) {
    if (sessao.expiraEm <= agora) sessoes.delete(id);
  }
  sessoes.delete(idSessao(req) ?? '');
  const id = randomBytes(32).toString('hex');
  sessoes.set(id, { usuarioId: usuario.id, expiraEm: agora + duracao });
  res.cookie(nomeCookie, id, { ...opcoesCookie(req), maxAge: duracao });
}

export function encerrarSessao(req: Request, res: Response) {
  sessoes.delete(idSessao(req) ?? '');
  res.clearCookie(nomeCookie, opcoesCookie(req));
}

// Consulta o cargo atual no banco em cada requisição autenticada.
export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  const id = idSessao(req) ?? '';
  const sessao = sessoes.get(id);
  if (!sessao || sessao.expiraEm <= Date.now()) {
    sessoes.delete(id);
    throw new AppError(401, 'Entre para continuar');
  }
  const [rows] = await pool.execute<RowDataPacket[]>('SELECT cargo FROM usuario WHERE id_usuario = ?', [sessao.usuarioId]);
  if (!rows[0]) {
    sessoes.delete(id);
    throw new AppError(401, 'Entre para continuar');
  }
  req.user = { id: sessao.usuarioId, cargo: rows[0].cargo };
  next();
}

/** Restringe a rota a determinados cargos (ex.: requireCargo('gestor', 'superusuario')). */
export function requireCargo(...cargos: Cargo[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user || !cargos.includes(req.user.cargo)) {
      throw new AppError(403, 'Seu cargo não tem permissão para esta ação');
    }
    next();
  };
}
