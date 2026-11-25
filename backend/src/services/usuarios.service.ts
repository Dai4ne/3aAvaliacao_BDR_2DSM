import bcrypt from 'bcryptjs';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { pool } from '../db';
import { AppError } from '../AppError';
import type { Cargo } from '../express';

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

export async function atualizarUsuario(id: number, data: Partial<NovoUsuario>) {
  const entries = Object.entries(data).filter(([, v]) => v !== undefined);
  if (!entries.length) throw new AppError(400, 'Nenhum campo para atualizar');
  const valores = await Promise.all(entries.map(([campo, valor]) =>
    campo === 'senha' ? bcrypt.hash(String(valor), 10) : valor));

  const [result] = await pool.query<ResultSetHeader>(
    `UPDATE usuario u SET ${entries.map(([k]) => `${k} = ?`).join(', ')} WHERE id_usuario = ?
     AND (? = 0 OR time_id <=> ? OR NOT EXISTS (SELECT 1 FROM \`time\` t WHERE t.responsavel_id = u.id_usuario))`,
    [...valores, id, data.time_id === undefined ? 0 : 1, data.time_id ?? null],
  );
  if (!result.affectedRows) {
    await buscarUsuario(id);
    throw new AppError(409, 'Troque o responsável do time antes de mover este usuário.');
  }
  return buscarUsuario(id);
}

export async function removerUsuario(id: number) {
  const [result] = await pool.execute<ResultSetHeader>(
    'DELETE FROM usuario WHERE id_usuario = ? AND NOT EXISTS (SELECT 1 FROM `time` WHERE responsavel_id = ?)',
    [id, id],
  );
  if (!result.affectedRows) {
    await buscarUsuario(id);
    throw new AppError(409, 'Usuário é responsável por um time. Troque o responsável antes de remover.');
  }
}
