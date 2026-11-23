import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { pool } from '../../config/db';
import { AppError } from '../../utils/AppError';
import type { AuthUser } from '../../types/express';

export interface NovaOS {
  os_titulo: string;
  os_descricao: string;
  prioridade?: 'baixa' | 'media' | 'alta' | 'critica';
  data_limite: string; // YYYY-MM-DD
  id_time_responsavel: number;
}

export interface EdicaoOS {
  os_titulo?: string;
  os_descricao?: string;
  os_status?: string;
  prioridade?: string;
  data_limite?: string;
  id_time_responsavel?: number;
}

const SELECT_OS = `
  SELECT o.os_id, o.os_titulo, o.os_descricao, o.os_status, o.prioridade,
         o.data_limite, o.data_criacao, o.id_criador, o.id_time_responsavel,
         c.nome AS criador_nome, t.nome_time AS time_nome
    FROM os o
    INNER JOIN usuario c ON c.id_usuario = o.id_criador
    INNER JOIN \`time\` t ON t.id_time = o.id_time_responsavel`;

async function buscarOuFalhar(id: number) {
  const [rows] = await pool.query<RowDataPacket[]>(`${SELECT_OS} WHERE o.os_id = ?`, [id]);
  if (!rows[0]) throw new AppError(404, 'OS não encontrada');
  return rows[0];
}

/** Lê do banco (não do token) para refletir mudanças de time em tempo real. */
async function timeDoUsuario(usuarioId: number): Promise<number | null> {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT time_id FROM usuario WHERE id_usuario = ?',
    [usuarioId],
  );
  if (!rows[0]) throw new AppError(401, 'Usuário não existe mais');
  return rows[0].time_id;
}

async function ehLider(usuarioId: number, timeId: number): Promise<boolean> {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT 1 FROM `time` WHERE id_time = ? AND responsavel_id = ?',
    [timeId, usuarioId],
  );
  return rows.length > 0;
}

export async function criarOS(user: AuthUser, data: NovaOS) {
  // Toda OS nasce 'aberta' e o criador é sempre o usuário autenticado
  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO os (os_titulo, os_descricao, prioridade, data_limite, id_criador, id_time_responsavel)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      data.os_titulo,
      data.os_descricao,
      data.prioridade ?? 'media',
      data.data_limite,
      user.id,
      data.id_time_responsavel,
    ],
  );
  return buscarOuFalhar(result.insertId);
}

export async function listarOS(filtros: { status?: string; time_id?: number; prioridade?: string }) {
  const where: string[] = [];
  const params: unknown[] = [];

  if (filtros.status) {
    where.push('o.os_status = ?');
    params.push(filtros.status);
  }
  if (filtros.time_id) {
    where.push('o.id_time_responsavel = ?');
    params.push(filtros.time_id);
  }
  if (filtros.prioridade) {
    where.push('o.prioridade = ?');
    params.push(filtros.prioridade);
  }

  const [rows] = await pool.query<RowDataPacket[]>(
    `${SELECT_OS} ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY o.data_limite ASC`,
    params,
  );
  return rows;
}

export const buscarOS = buscarOuFalhar;

/**
 * Regras de edição:
 *  - só membros do time responsável pela OS podem editar;
 *  - concluir (ou reabrir uma OS concluída) é exclusivo do líder do time.
 */
export async function editarOS(user: AuthUser, id: number, data: EdicaoOS) {
  const os = await buscarOuFalhar(id);

  const meuTime = await timeDoUsuario(user.id);
  if (meuTime !== os.id_time_responsavel) {
    throw new AppError(403, 'Apenas membros do time responsável podem editar esta OS');
  }

  const mudaStatus = data.os_status !== undefined && data.os_status !== os.os_status;
  const envolveConclusao = data.os_status === 'concluida' || os.os_status === 'concluida';

  if (mudaStatus && envolveConclusao && !(await ehLider(user.id, os.id_time_responsavel))) {
    throw new AppError(403, 'Apenas o responsável do time pode concluir ou reabrir uma OS');
  }

  const entries = Object.entries(data).filter(([, v]) => v !== undefined);
  if (!entries.length) throw new AppError(400, 'Nenhum campo para atualizar');

  await pool.query(
    `UPDATE os SET ${entries.map(([k]) => `${k} = ?`).join(', ')} WHERE os_id = ?`,
    [...entries.map(([, v]) => v), id],
  );
  return buscarOuFalhar(id);
}

export async function concluirOS(user: AuthUser, id: number) {
  const os = await buscarOuFalhar(id);

  if (!(await ehLider(user.id, os.id_time_responsavel))) {
    throw new AppError(403, 'Apenas o responsável do time pode concluir a OS');
  }
  if (os.os_status === 'concluida') throw new AppError(409, 'OS já está concluída');

  await pool.query("UPDATE os SET os_status = 'concluida' WHERE os_id = ?", [id]);
  return buscarOuFalhar(id);
}
