// Rotas de login, consulta da sessão atual e logout.
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { RowDataPacket } from 'mysql2';
import { z } from 'zod';
import { pool } from '../db';
import { authenticate, encerrarSessao, iniciarSessao } from '../auth';
import { AppError } from '../AppError';
import { buscarUsuario } from '../services/usuarios.service';

export const authRouter = Router();

authRouter.get('/me', authenticate, async (req, res) => {
  res.json(await buscarUsuario(req.user!.id));
});

authRouter.post('/logout', (req, res) => {
  encerrarSessao(req, res);
  res.status(204).end();
});

const loginSchema = z.object({
  email: z.string().email(),
  senha: z.string().min(1),
});

// POST /auth/login
authRouter.post('/login', async (req, res) => {
  const { email, senha } = loginSchema.parse(req.body);

  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT id_usuario, nome, email, senha, cargo, time_id FROM usuario WHERE email = ?',
    [email],
  );
  const user = rows[0];

  // mesma mensagem para e-mail inexistente ou senha errada (não vaza qual deu errado)
  if (!user || !(await bcrypt.compare(senha, user.senha))) {
    throw new AppError(401, 'E-mail ou senha inválidos');
  }

  iniciarSessao(req, res, { id: user.id_usuario, cargo: user.cargo });

  res.json({
    usuario: {
      id_usuario: user.id_usuario,
      nome: user.nome,
      email: user.email,
      cargo: user.cargo,
      time_id: user.time_id,
    },
  });
});
