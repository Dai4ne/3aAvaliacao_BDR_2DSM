// Rotas de times, vínculos de membros e troca de responsável.
import { Router } from 'express';
import { z } from 'zod';
import { authenticate, requireCargo } from '../auth';
import * as service from '../services/times.service';

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

// A edição de vínculos envia a lista de membros junto com o responsável.
const atualizarSchema = z.object({
  nome_time: z.string().min(2).max(100).optional(),
  email_time: z.string().email().max(150).nullable().optional(),
  departamento: z.string().min(2).max(100).optional(),
  usuario_ids: z.array(z.number().int().positive()).min(1).optional(),
  responsavel_id: z.number().int().positive().optional(),
}).refine(
  (data) => (data.usuario_ids === undefined) === (data.responsavel_id === undefined),
  'Informe os membros e o responsável juntos',
);

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

timesRouter.delete('/:id', gestao, async (req, res) => {
  const { id } = idParam.parse(req.params);
  await service.removerTime(id);
  res.status(204).end();
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
