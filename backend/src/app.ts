import cors from 'cors';
import express from 'express';
import { errorHandler, notFound } from './middlewares/errorHandler';
import { authRouter } from './modules/auth/auth.routes';
import { osRouter } from './modules/os/os.routes';
import { timesRouter } from './modules/times/times.routes';
import { usuariosRouter } from './modules/usuarios/usuarios.routes';

export const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/auth', authRouter);
app.use('/usuarios', usuariosRouter);
app.use('/times', timesRouter);
app.use('/os', osRouter);

app.use(notFound);
app.use(errorHandler);
