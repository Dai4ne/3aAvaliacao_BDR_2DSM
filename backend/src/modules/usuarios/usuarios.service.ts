import bcrypt from 'bcryptjs';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { pool } from '../../config/db';
import { AppError } from '../../utils/AppError';
import type { Cargo } from '../../types/express';

const SAFE_COLUMNS = 'id_usuario, nome, email, cargo, time_id';

export interface NovoUsuario {
  nome: string;
  email: string;
  senha: string;
  cargo: Cargo;
  time_id?: number | null;
}

export async function criarUsuario(data: NovoUsuario) {
  const hash = await bcrypt.hash(data.senha, 10);

  // time_id é opcional: usuário pode nascer sem time
  const [result] = await pool.query<ResultSetHeader>(
    'INSERT INTO usuario (nome, email, senha, cargo, time_id) VALUES (?, ?, ?, ?, ?)',
    [data.nome, data.email, hash, data.cargo, data.time_id ?? null],
  );
  return buscarUsuario(result.insertId);
}

export async function listarUsuarios(filtros: { time_id?: number; semTime?: boolean }) {
  const where: string[] = [];
  const params: unknown[] = [];

  if (filtros.semTime) where.push('time_id IS NULL');
  else if (filtros.time_id) {
    where.push('time_id = ?');
    params.push(filtros.time_id);
  }

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT ${SAFE_COLUMNS} FROM usuario ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY nome`,
    params,
  );
  return rows;
}

export async function buscarUsuario(id: number) {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT ${SAFE_COLUMNS} FROM usuario WHERE id_usuario = ?`,
    [id],
  );
  if (!rows[0]) throw new AppError(404, 'Usuário não encontrado');
  return rows[0];
}

export async function atualizarUsuario(id: number, data: { nome?: string; cargo?: Cargo }) {
  await buscarUsuario(id);
  const entries = Object.entries(data).filter(([, v]) => v !== undefined);
  if (!entries.length) throw new AppError(400, 'Nenhum campo para atualizar');

  await pool.query(
    `UPDATE usuario SET ${entries.map(([k]) => `${k} = ?`).join(', ')} WHERE id_usuario = ?`,
    [...entries.map(([, v]) => v), id],
  );
  return buscarUsuario(id);
}

export async function removerUsuario(id: number) {
  await buscarUsuario(id);

  const [lider] = await pool.query<RowDataPacket[]>(
    'SELECT id_time FROM `time` WHERE responsavel_id = ?',
    [id],
  );
  if (lider.length) {
    throw new AppError(409, 'Usuário é responsável por um time. Troque o responsável antes de remover.');
  }

  await pool.query('DELETE FROM usuario WHERE id_usuario = ?', [id]);
}
