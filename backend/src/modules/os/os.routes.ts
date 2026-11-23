import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../../middlewares/auth';
import * as service from './os.service';

export const osRouter = Router();
osRouter.use(authenticate);

const STATUS = ['aberta', 'em andamento', 'concluida', 'teste', 'bloqueado', 'review'] as const;
const PRIORIDADE = ['baixa', 'media', 'alta', 'critica'] as const;

const idParam = z.object({ id: z.coerce.number().int().positive() });
const data = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use o formato YYYY-MM-DD');

const criarSchema = z.object({
  os_titulo: z.string().min(3).max(150),
  os_descricao: z.string().min(1),
  prioridade: z.enum(PRIORIDADE).optional(),
  data_limite: data,
  id_time_responsavel: z.number().int().positive(),
});

const editarSchema = z.object({
  os_titulo: z.string().min(3).max(150).optional(),
  os_descricao: z.string().min(1).optional(),
  os_status: z.enum(STATUS).optional(),
  prioridade: z.enum(PRIORIDADE).optional(),
  data_limite: data.optional(),
  id_time_responsavel: z.number().int().positive().optional(),
});

const listarSchema = z.object({
  status: z.enum(STATUS).optional(),
  prioridade: z.enum(PRIORIDADE).optional(),
  time_id: z.coerce.number().int().positive().optional(),
});

// GET /os?status=aberta&time_id=1&prioridade=alta
osRouter.get('/', async (req, res) => {
  res.json(await service.listarOS(listarSchema.parse(req.query)));
});

osRouter.get('/:id', async (req, res) => {
  const { id } = idParam.parse(req.params);
  res.json(await service.buscarOS(id));
});

// POST /os  (qualquer usuário autenticado pode abrir uma OS para um time)
osRouter.post('/', async (req, res) => {
  res.status(201).json(await service.criarOS(req.user!, criarSchema.parse(req.body)));
});

// PATCH /os/:id  (membros do time responsável; concluir só o líder)
osRouter.patch('/:id', async (req, res) => {
  const { id } = idParam.parse(req.params);
  res.json(await service.editarOS(req.user!, id, editarSchema.parse(req.body)));
});

// POST /os/:id/concluir  (somente o responsável/líder do time)
osRouter.post('/:id/concluir', async (req, res) => {
  const { id } = idParam.parse(req.params);
  res.json(await service.concluirOS(req.user!, id));
});
