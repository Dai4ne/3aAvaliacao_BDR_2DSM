/**
 * Cria o primeiro superusuário (necessário para logar e cadastrar os demais).
 * Uso: npm run seed:admin -- email@altave.com.br SenhaForte123 "Nome do Admin"
 */
import bcrypt from 'bcryptjs';
import { pool } from '../config/db';

async function main() {
  const [email, senha, nome = 'Administrador'] = process.argv.slice(2);
  if (!email || !senha) {
    console.error('Uso: npm run seed:admin -- <email> <senha> [nome]');
    process.exit(1);
  }

  const hash = await bcrypt.hash(senha, 10);
  await pool.query(
    "INSERT INTO usuario (nome, email, senha, cargo) VALUES (?, ?, ?, 'superusuario')",
    [nome, email, hash],
  );
  console.log(`Superusuário ${email} criado.`);
  await pool.end();
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
