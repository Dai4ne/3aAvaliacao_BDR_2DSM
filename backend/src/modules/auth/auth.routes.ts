import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { RowDataPacket } from 'mysql2';
import { z } from 'zod';
import { pool } from '../../config/db';
import { env } from '../../config/env';
import { AppError } from '../../utils/AppError';

export const authRouter = Router();

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

  const token = jwt.sign({ id: user.id_usuario, cargo: user.cargo }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn as SignOptions['expiresIn'],
  });

  res.json({
    token,
    usuario: {
      id_usuario: user.id_usuario,
      nome: user.nome,
      email: user.email,
      cargo: user.cargo,
      time_id: user.time_id,
    },
  });
});
