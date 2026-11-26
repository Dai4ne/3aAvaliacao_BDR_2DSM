// Configura o Express e conecta as rotas da API aos seus endereços.
import cors from 'cors';
import express from 'express';
import { AppError } from './AppError';
import { errorHandler, notFound } from './errorHandler';
import { authRouter } from './routes/auth.routes';
import { osRouter } from './routes/os.routes';
import { timesRouter } from './routes/times.routes';
import { usuariosRouter } from './routes/usuarios.routes';

export const app = express();

// As origens autorizadas permitem que o navegador envie o cookie de sessão.
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

// Rota simples para verificar se a API está respondendo.
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Cada grupo de rotas recebe um prefixo próprio.
app.use('/auth', authRouter);
app.use('/usuarios', usuariosRouter);
app.use('/times', timesRouter);
app.use('/os', osRouter);

app.use(notFound);
app.use(errorHandler);
