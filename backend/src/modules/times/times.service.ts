import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { pool } from '../../config/db';
import { AppError } from '../../utils/AppError';

export interface NovoTime {
  nome_time: string;
  email_time?: string | null;
  departamento: string;
  usuario_ids: number[]; // mínimo 1: time não nasce vazio
  responsavel_id?: number; // se omitido, o primeiro usuário vira responsável
}

/**
 * Regra: um time só é criado com pelo menos 1 usuário vinculado.
 * Tudo em transação: se qualquer passo falhar, nada é gravado.
 */
export async function criarTime(data: NovoTime) {
  const ids = [...new Set(data.usuario_ids)];
  const responsavelId = data.responsavel_id ?? ids[0];

  if (!ids.includes(responsavelId)) {
    throw new AppError(400, 'O responsável precisa estar entre os usuários do time');
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [users] = await conn.query<RowDataPacket[]>(
      'SELECT id_usuario, time_id FROM usuario WHERE id_usuario IN (?) FOR UPDATE',
      [ids],
    );
    if (users.length !== ids.length) throw new AppError(400, 'Algum usuário informado não existe');
    if (users.some((u) => u.time_id !== null)) {
      throw new AppError(409, 'Algum usuário informado já pertence a outro time');
    }

    const [result] = await conn.query<ResultSetHeader>(
      'INSERT INTO `time` (nome_time, email_time, departamento, responsavel_id) VALUES (?, ?, ?, ?)',
      [data.nome_time, data.email_time ?? null, data.departamento, responsavelId],
    );

    await conn.query('UPDATE usuario SET time_id = ? WHERE id_usuario IN (?)', [result.insertId, ids]);

    await conn.commit();
    return buscarTime(result.insertId);
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

export async function listarTimes() {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT t.id_time, t.nome_time, t.email_time, t.departamento, t.responsavel_id,
            r.nome AS responsavel_nome, COUNT(u.id_usuario) AS total_membros
       FROM \`time\` t
       LEFT JOIN usuario r ON r.id_usuario = t.responsavel_id
       LEFT JOIN usuario u ON u.time_id = t.id_time
      GROUP BY t.id_time, r.nome
      ORDER BY t.nome_time`,
  );
  return rows;
}

export async function buscarTime(id: number) {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT t.id_time, t.nome_time, t.email_time, t.departamento, t.responsavel_id,
            r.nome AS responsavel_nome
       FROM \`time\` t
       LEFT JOIN usuario r ON r.id_usuario = t.responsavel_id
      WHERE t.id_time = ?`,
    [id],
  );
  if (!rows[0]) throw new AppError(404, 'Time não encontrado');

  const [membros] = await pool.query<RowDataPacket[]>(
    'SELECT id_usuario, nome, email, cargo FROM usuario WHERE time_id = ? ORDER BY nome',
    [id],
  );
  const time = rows[0] as { responsavel_id: number | null } & Record<string, unknown>;
  return { ...time, membros: membros as RowDataPacket[] };
}

export async function atualizarTime(
  id: number,
  data: { nome_time?: string; email_time?: string | null; departamento?: string },
) {
  await buscarTime(id);
  const entries = Object.entries(data).filter(([, v]) => v !== undefined);
  if (!entries.length) throw new AppError(400, 'Nenhum campo para atualizar');

  await pool.query(
    `UPDATE \`time\` SET ${entries.map(([k]) => `${k} = ?`).join(', ')} WHERE id_time = ?`,
    [...entries.map(([, v]) => v), id],
  );
  return buscarTime(id);
}

export async function adicionarMembro(timeId: number, usuarioId: number) {
  await buscarTime(timeId);

  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT time_id FROM usuario WHERE id_usuario = ?',
    [usuarioId],
  );
  if (!rows[0]) throw new AppError(404, 'Usuário não encontrado');
  if (rows[0].time_id !== null) throw new AppError(409, 'Usuário já pertence a um time');

  await pool.query('UPDATE usuario SET time_id = ? WHERE id_usuario = ?', [timeId, usuarioId]);
  return buscarTime(timeId);
}

export async function removerMembro(timeId: number, usuarioId: number) {
  const time = await buscarTime(timeId);

  if (!time.membros.some((m: RowDataPacket) => m.id_usuario === usuarioId)) {
    throw new AppError(404, 'Usuário não é membro deste time');
  }
  if (time.responsavel_id === usuarioId) {
    throw new AppError(409, 'Não é possível remover o responsável. Defina outro responsável antes.');
  }

  await pool.query('UPDATE usuario SET time_id = NULL WHERE id_usuario = ?', [usuarioId]);
  return buscarTime(timeId);
}

export async function trocarResponsavel(timeId: number, usuarioId: number) {
  const time = await buscarTime(timeId);

  if (!time.membros.some((m: RowDataPacket) => m.id_usuario === usuarioId)) {
    throw new AppError(400, 'O novo responsável precisa ser membro do time');
  }

  await pool.query('UPDATE `time` SET responsavel_id = ? WHERE id_time = ?', [usuarioId, timeId]);
  return buscarTime(timeId);
}
