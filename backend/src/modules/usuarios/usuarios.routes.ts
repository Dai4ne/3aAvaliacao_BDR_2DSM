import { Router } from 'express';
import { z } from 'zod';
import { authenticate, requireCargo } from '../../middlewares/auth';
import * as service from './usuarios.service';

export const usuariosRouter = Router();
usuariosRouter.use(authenticate);

const CARGOS = [
  'superusuario',
  'gestor',
  'comercial',
  'suporte',
  'producao',
  'software',
  'implantacao',
  'monitoramento',
] as const;

const idParam = z.object({ id: z.coerce.number().int().positive() });

const criarSchema = z.object({
  nome: z.string().min(2).max(100),
  email: z.string().email().max(150),
  senha: z.string().min(6).max(72),
  cargo: z.enum(CARGOS),
  time_id: z.number().int().positive().nullish(), // opcional
});

const atualizarSchema = z.object({
  nome: z.string().min(2).max(100).optional(),
  cargo: z.enum(CARGOS).optional(),
});

const listarSchema = z.object({
  time_id: z.coerce.number().int().positive().optional(),
  sem_time: z.enum(['true', 'false']).optional(),
});

// GET /usuarios?time_id=1  |  GET /usuarios?sem_time=true
usuariosRouter.get('/', async (req, res) => {
  const q = listarSchema.parse(req.query);
  res.json(await service.listarUsuarios({ time_id: q.time_id, semTime: q.sem_time === 'true' }));
});

usuariosRouter.get('/:id', async (req, res) => {
  const { id } = idParam.parse(req.params);
  res.json(await service.buscarUsuario(id));
});

// POST /usuarios  (somente superusuário/gestor)
usuariosRouter.post('/', requireCargo('superusuario', 'gestor'), async (req, res) => {
  const data = criarSchema.parse(req.body);
  res.status(201).json(await service.criarUsuario(data));
});

usuariosRouter.patch('/:id', requireCargo('superusuario', 'gestor'), async (req, res) => {
  const { id } = idParam.parse(req.params);
  res.json(await service.atualizarUsuario(id, atualizarSchema.parse(req.body)));
});

usuariosRouter.delete('/:id', requireCargo('superusuario'), async (req, res) => {
  const { id } = idParam.parse(req.params);
  await service.removerUsuario(id);
  res.status(204).send();
});
