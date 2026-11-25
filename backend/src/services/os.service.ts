import { ResultSetHeader, RowDataPacket } from 'mysql2';
import type { PoolConnection } from 'mysql2/promise';
import { pool } from '../db';
import { AppError } from '../AppError';
import type { AuthUser } from '../express';

export interface NovaOS {
  os_titulo: string;
  os_descricao: string;
  prioridade?: 'baixa' | 'media' | 'alta' | 'critica';
  data_limite: string; // YYYY-MM-DD
  id_time_responsavel: number;
  id_usuario_responsavel?: number;
  anexos?: { nome: string; conteudo: string }[];
}

export interface EdicaoOS {
  os_titulo?: string;
  os_descricao?: string;
  os_status?: string;
  prioridade?: string;
  data_limite?: string;
  id_time_responsavel?: number;
  id_usuario_responsavel?: number | null;
}

const SELECT_OS = `
  SELECT o.os_id, o.os_titulo, o.os_descricao, o.os_status, o.prioridade,
         o.data_limite, o.data_criacao, o.id_criador, o.id_time_responsavel,
         o.id_usuario_responsavel, r.nome AS responsavel_nome, r.cargo AS responsavel_cargo,
         t.responsavel_id AS id_lider_time,
         c.nome AS criador_nome, t.nome_time AS time_nome
    FROM os o
    INNER JOIN usuario c ON c.id_usuario = o.id_criador
    INNER JOIN \`time\` t ON t.id_time = o.id_time_responsavel
    LEFT JOIN usuario r ON r.id_usuario = o.id_usuario_responsavel`;

async function buscarOuFalhar(id: number) {
  const [rows] = await pool.query<RowDataPacket[]>(`${SELECT_OS} WHERE o.os_id = ?`, [id]);
  if (!rows[0]) throw new AppError(404, 'OS não encontrada');
  return rows[0];
}

function ehGestao(user: AuthUser) {
  return user.cargo === 'gestor' || user.cargo === 'superusuario';
}

function recebeOS(user: AuthUser) {
  return user.cargo === 'producao' || user.cargo === 'software';
}

export async function buscarOS(user: AuthUser, id: number) {
  const os = await buscarOuFalhar(id);
  if (recebeOS(user)) {
    const porTime = os.id_usuario_responsavel === null || os.responsavel_cargo === 'comercial';
    const autorizado = os.id_usuario_responsavel === user.id
      || (porTime && await timeDoUsuario(user.id) === os.id_time_responsavel);
    if (!autorizado) throw new AppError(404, 'OS não encontrada');
  }
  return os;
}

async function validarResponsavel(
  conn: PoolConnection, user: AuthUser, usuarioId: number | null,
) {
  if (usuarioId === null) {
    if (user.cargo === 'comercial') throw new AppError(400, 'Selecione uma pessoa do Comercial');
    return;
  }
  const [rows] = await conn.execute<RowDataPacket[]>(
    'SELECT cargo FROM usuario WHERE id_usuario = ? FOR UPDATE', [usuarioId],
  );
  const pessoa = rows[0];
  if (pessoa?.cargo !== 'comercial') {
    throw new AppError(400, 'A pessoa responsável pela OS precisa ser do Comercial');
  }
}

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
  const conn = await pool.getConnection();
  let id: number;
  try {
    await conn.beginTransaction();
    await validarResponsavel(conn, user, data.id_usuario_responsavel ?? null);
    const [result] = await conn.execute<ResultSetHeader>(
      `INSERT INTO os (os_titulo, os_descricao, prioridade, data_limite, id_criador, id_time_responsavel, id_usuario_responsavel)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        data.os_titulo,
        data.os_descricao,
        data.prioridade ?? 'media',
        data.data_limite,
        user.id,
        data.id_time_responsavel,
        data.id_usuario_responsavel ?? null,
      ],
    );
    id = result.insertId;
    for (const anexo of data.anexos ?? []) {
      await conn.execute('INSERT INTO os_anexo (os_id, nome, conteudo) VALUES (?, ?, ?)', [
        id, anexo.nome, Buffer.from(anexo.conteudo, 'base64'),
      ]);
    }
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
  return buscarOuFalhar(id);
}

export async function listarAnexos(user: AuthUser, osId: number) {
  await buscarOS(user, osId);
  const [rows] = await pool.execute<RowDataPacket[]>(
    'SELECT id_anexo, nome FROM os_anexo WHERE os_id = ? ORDER BY id_anexo',
    [osId],
  );
  return rows;
}

export async function buscarAnexo(user: AuthUser, osId: number, anexoId: number) {
  await buscarOS(user, osId);
  const [rows] = await pool.execute<RowDataPacket[]>(
    'SELECT id_anexo, nome, conteudo FROM os_anexo WHERE os_id = ? AND id_anexo = ?',
    [osId, anexoId],
  );
  const anexo = rows[0];
  if (!anexo) throw new AppError(404, 'Anexo não encontrado');
  return { ...anexo, conteudo: (anexo.conteudo as Buffer).toString('base64') };
}

export async function listarOS(user: AuthUser, filtros: { status?: string; time_id?: number; prioridade?: string }) {
  const where: string[] = [];
  const params: unknown[] = [];
  if (recebeOS(user)) {
    where.push(`(o.id_usuario_responsavel = ? OR
      ((o.id_usuario_responsavel IS NULL OR r.cargo = 'comercial') AND o.id_time_responsavel = ?))`);
    params.push(user.id, await timeDoUsuario(user.id));
  }

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

export async function editarOS(user: AuthUser, id: number, data: EdicaoOS) {
  const os = await buscarOS(user, id);
  const entries = Object.entries(data).filter(([, v]) => v !== undefined);
  if (!entries.length) throw new AppError(400, 'Nenhum campo para atualizar');
  const mudaDestino = data.id_time_responsavel !== undefined || data.id_usuario_responsavel !== undefined;
  const comercial = user.cargo === 'comercial' && os.id_criador === user.id;

  if (mudaDestino && !ehGestao(user) && !comercial) {
    throw new AppError(403, 'Você não pode encaminhar esta OS');
  }
  if (!ehGestao(user) && !comercial && await timeDoUsuario(user.id) !== os.id_time_responsavel) {
    throw new AppError(403, 'Apenas membros do time responsável podem editar esta OS');
  }

  const mudaStatus = data.os_status !== undefined && data.os_status !== os.os_status;
  const envolveConclusao = data.os_status === 'concluida' || os.os_status === 'concluida';

  if (mudaStatus && envolveConclusao && !ehGestao(user) && !(await ehLider(user.id, os.id_time_responsavel))) {
    throw new AppError(403, 'Apenas o responsável do time pode concluir ou reabrir uma OS');
  }

  const sql = `UPDATE os SET ${entries.map(([k]) => `${k} = ?`).join(', ')} WHERE os_id = ?`;
  const valores = [...entries.map(([, v]) => v), id];
  if (data.id_usuario_responsavel !== undefined) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      await validarResponsavel(conn, user, data.id_usuario_responsavel);
      await conn.query(sql, valores);
      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  } else {
    await pool.query(sql, valores);
  }
  return buscarOuFalhar(id);
}

export async function concluirOS(user: AuthUser, id: number) {
  const os = await buscarOS(user, id);

  if (!ehGestao(user) && !(await ehLider(user.id, os.id_time_responsavel))) {
    throw new AppError(403, 'Apenas o responsável do time pode concluir a OS');
  }
  if (os.os_status === 'concluida') throw new AppError(409, 'OS já está concluída');

  await pool.query("UPDATE os SET os_status = 'concluida' WHERE os_id = ?", [id]);
  return buscarOuFalhar(id);
}

export async function removerOS(user: AuthUser, id: number) {
  const os = await buscarOS(user, id);
  if (!ehGestao(user) && !(user.cargo === 'comercial' && os.id_criador === user.id)) {
    throw new AppError(403, 'Você não pode excluir esta OS');
  }
  const [result] = await pool.execute<ResultSetHeader>('DELETE FROM os WHERE os_id = ?', [id]);
  if (!result.affectedRows) throw new AppError(404, 'OS não encontrada');
}
