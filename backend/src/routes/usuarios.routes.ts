// Rotas de cadastro, consulta, edição e exclusão de usuários.
import { Router } from 'express';
import { z } from 'zod';
import { authenticate, requireCargo } from '../auth';
import * as service from '../services/usuarios.service';

export const usuariosRouter = Router();
usuariosRouter.use(authenticate);

// O catálogo completo atende registros antigos. O cadastro oferece quatro cargos.
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
  cargo: z.enum(['gestor', 'comercial', 'producao', 'software']),
  time_id: z.number().int().positive().nullish(), // opcional
});

const atualizarSchema = z.object({
  nome: z.string().min(2).max(100).optional(),
  email: z.string().email().max(150).optional(),
  senha: z.string().min(6).max(72).optional(),
  cargo: z.enum(CARGOS).optional(),
  time_id: z.number().int().positive().nullable().optional(),
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

usuariosRouter.delete('/:id', requireCargo('superusuario', 'gestor'), async (req, res) => {
  const { id } = idParam.parse(req.params);
  await service.removerUsuario(id);
  res.status(204).send();
});
