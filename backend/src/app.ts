import cors from 'cors';
import express from 'express';
import { AppError } from './AppError';
import { errorHandler, notFound } from './errorHandler';
import { authRouter } from './routes/auth.routes';
import { osRouter } from './routes/os.routes';
import { timesRouter } from './routes/times.routes';
import { usuariosRouter } from './routes/usuarios.routes';

export const app = express();

const origensFrontend = ['http://localhost:5173', 'http://127.0.0.1:5173'];
if (process.env.FRONTEND_ORIGIN) origensFrontend.push(process.env.FRONTEND_ORIGIN);
app.use(cors({ origin: origensFrontend, credentials: true }));
app.use((req, _res, next) => {
  const origem = req.get('Origin');
  if (origem && !origensFrontend.includes(origem) && !['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    throw new AppError(403, 'Origem da solicitação não permitida');
  }
  next();
});
app.use('/os', express.json({ limit: '3mb' }));
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
