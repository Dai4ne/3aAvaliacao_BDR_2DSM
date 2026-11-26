// Valida os dados recebidos pelas rotas de ordens de serviço e anexos.
import { Router } from 'express';
import { z } from 'zod';
import { authenticate, requireCargo } from '../auth';
import { AppError } from '../AppError';
import * as service from '../services/os.service';

export const osRouter = Router();
osRouter.use(authenticate);

const STATUS = ['aberta', 'em andamento', 'concluida', 'teste', 'bloqueado', 'review'] as const;
const PRIORIDADE = ['baixa', 'media', 'alta', 'critica'] as const;

const idParam = z.object({ id: z.coerce.number().int().positive() });
const data = z.string().date();
// Limita o total de anexos e valida o conteúdo em Base64.
const tamanhoMaximoAnexos = 2 * 1024 * 1024;
const anexos = z.array(z.object({
  nome: z.string().min(1).max(255),
  conteudo: z.string().max(4 * Math.ceil(tamanhoMaximoAnexos / 3)).base64(),
})).max(10).refine(
  (arquivos) => arquivos.reduce((total, arquivo) => total + Buffer.byteLength(arquivo.conteudo, 'base64'), 0)
    <= tamanhoMaximoAnexos,
  'Os anexos devem somar no máximo 2 MB',
);

// A criação exige os dados da solicitação. Na edição, os campos são opcionais.
const criarSchema = z.object({
  os_titulo: z.string().trim().min(3).max(150),
  os_descricao: z.string().trim().min(1).refine((texto) => Buffer.byteLength(texto, 'utf8') <= 65535),
  prioridade: z.enum(PRIORIDADE).optional(),
  data_limite: data,
  id_time_responsavel: z.number().int().positive(),
  id_usuario_responsavel: z.number().int().positive().optional(),
  anexos: anexos.optional(),
});

const editarSchema = z.object({
  os_titulo: z.string().min(3).max(150).optional(),
  os_descricao: z.string().min(1).optional(),
  os_status: z.enum(STATUS).optional(),
  prioridade: z.enum(PRIORIDADE).optional(),
  data_limite: data.optional(),
  id_time_responsavel: z.number().int().positive().optional(),
  id_usuario_responsavel: z.number().int().positive().nullable().optional(),
});

const listarSchema = z.object({
  status: z.enum(STATUS).optional(),
  prioridade: z.enum(PRIORIDADE).optional(),
  time_id: z.coerce.number().int().positive().optional(),
  inicio: data.optional(),
  fim: data.optional(),
});

// GET /os?status=aberta&time_id=1&prioridade=alta&inicio=2026-11-01&fim=2026-11-30
osRouter.get('/', async (req, res) => {
  const filtros = listarSchema.parse(req.query);
  if (filtros.inicio && filtros.fim && filtros.inicio > filtros.fim) {
    throw new AppError(400, 'O prazo inicial não pode ser posterior ao final');
  }
  res.json(await service.listarOS(req.user!, filtros));
});

osRouter.get('/:id', async (req, res) => {
  const { id } = idParam.parse(req.params);
  res.json(await service.buscarOS(req.user!, id));
});

osRouter.get('/:id/anexos', async (req, res) => {
  const { id } = idParam.parse(req.params);
  res.json(await service.listarAnexos(req.user!, id));
});

osRouter.get('/:id/anexos/:anexoId', async (req, res) => {
  const { id, anexoId } = idParam.extend({ anexoId: z.coerce.number().int().positive() }).parse(req.params);
  res.json(await service.buscarAnexo(req.user!, id, anexoId));
});

osRouter.post('/', requireCargo('superusuario', 'gestor', 'comercial'), async (req, res) => {
  res.status(201).json(await service.criarOS(req.user!, criarSchema.parse(req.body)));
});

osRouter.patch('/:id', async (req, res) => {
  const { id } = idParam.parse(req.params);
  res.json(await service.editarOS(req.user!, id, editarSchema.parse(req.body)));
});

osRouter.delete('/:id', async (req, res) => {
  const { id } = idParam.parse(req.params);
  await service.removerOS(req.user!, id);
  res.status(204).end();
});

osRouter.post('/:id/concluir', async (req, res) => {
  const { id } = idParam.parse(req.params);
  res.json(await service.concluirOS(req.user!, id));
});
