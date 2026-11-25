import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { AppError } from './AppError';

export function notFound(_req: Request, res: Response) {
  res.status(404).json({ erro: 'Rota não encontrada' });
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.status).json({ erro: err.message });
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      erro: 'Dados inválidos',
      detalhes: err.issues.map((i) => ({ campo: i.path.join('.'), mensagem: i.message })),
    });
  }

  if ((err as { type?: string }).type === 'entity.too.large') {
    return res.status(413).json({ erro: 'O tamanho da solicitação excede o limite permitido' });
  }

  const code = (err as { code?: string }).code;
  if (code === 'ER_DUP_ENTRY') {
    return res.status(409).json({ erro: 'Registro duplicado (e-mail ou nome já em uso)' });
  }
  if (code === 'ER_NO_REFERENCED_ROW_2') {
    return res.status(400).json({ erro: 'Referência inválida (usuário ou time inexistente)' });
  }
  if (code === 'ER_ROW_IS_REFERENCED_2') {
    return res.status(409).json({ erro: 'Registro possui vínculos e não pode ser removido' });
  }

  console.error(err);
  res.status(500).json({ erro: 'Erro interno do servidor' });
}
