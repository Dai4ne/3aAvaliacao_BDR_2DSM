// Compartilha conexões com o MySQL entre as consultas da API.
import mysql from 'mysql2/promise';
import { env } from './env';

export const pool = mysql.createPool({
  ...env.db,
  waitForConnections: true,
  connectionLimit: 10,
  dateStrings: true, // DATE/DATETIME voltam como string, sem surpresas de fuso
});

// O MySQL usa o mesmo código quando falta uma procedure ou uma function.
export function rotinaAusente(erro: unknown) {
  return (erro as { code?: string } | null)?.code === 'ER_SP_DOES_NOT_EXIST';
}
