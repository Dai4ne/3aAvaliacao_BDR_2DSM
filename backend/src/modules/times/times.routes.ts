import { Router } from 'express';
import { z } from 'zod';
import { authenticate, requireCargo } from '../../middlewares/auth';
import * as service from './times.service';

export const timesRouter = Router();
timesRouter.use(authenticate);

const idParam = z.object({ id: z.coerce.number().int().positive() });
const membroParam = z.object({
  id: z.coerce.number().int().positive(),
  usuarioId: z.coerce.number().int().positive(),
});
const usuarioBody = z.object({ usuario_id: z.number().int().positive() });

const criarSchema = z.object({
  nome_time: z.string().min(2).max(100),
  email_time: z.string().email().max(150).nullish(),
  departamento: z.string().min(2).max(100),
  usuario_ids: z.array(z.number().int().positive()).min(1, 'Informe pelo menos 1 usuário'),
  responsavel_id: z.number().int().positive().optional(),
});

const atualizarSchema = z.object({
  nome_time: z.string().min(2).max(100).optional(),
  email_time: z.string().email().max(150).nullable().optional(),
  departamento: z.string().min(2).max(100).optional(),
});

const gestao = requireCargo('superusuario', 'gestor');

timesRouter.get('/', async (_req, res) => {
  res.json(await service.listarTimes());
});

timesRouter.get('/:id', async (req, res) => {
  const { id } = idParam.parse(req.params);
  res.json(await service.buscarTime(id));
});

// POST /times  -> exige usuario_ids com pelo menos 1 usuário
timesRouter.post('/', gestao, async (req, res) => {
  res.status(201).json(await service.criarTime(criarSchema.parse(req.body)));
});

timesRouter.patch('/:id', gestao, async (req, res) => {
  const { id } = idParam.parse(req.params);
  res.json(await service.atualizarTime(id, atualizarSchema.parse(req.body)));
});

// POST /times/:id/membros  { usuario_id }
timesRouter.post('/:id/membros', gestao, async (req, res) => {
  const { id } = idParam.parse(req.params);
  const { usuario_id } = usuarioBody.parse(req.body);
  res.json(await service.adicionarMembro(id, usuario_id));
});

// DELETE /times/:id/membros/:usuarioId
timesRouter.delete('/:id/membros/:usuarioId', gestao, async (req, res) => {
  const { id, usuarioId } = membroParam.parse(req.params);
  res.json(await service.removerMembro(id, usuarioId));
});

// PUT /times/:id/responsavel  { usuario_id }
timesRouter.put('/:id/responsavel', gestao, async (req, res) => {
  const { id } = idParam.parse(req.params);
  const { usuario_id } = usuarioBody.parse(req.body);
  res.json(await service.trocarResponsavel(id, usuario_id));
});
