import { pool } from './config/db';
import { env } from './config/env';
import { app } from './app';

async function main() {
  await pool.query('SELECT 1'); // falha cedo se o banco estiver fora do ar
  app.listen(env.port, () => {
    console.log(`Altave OS rodando em http://localhost:${env.port}`);
  });
}

main().catch((err) => {
  console.error('Falha ao iniciar:', err.message);
  process.exit(1);
});
