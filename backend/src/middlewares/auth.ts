import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AppError } from '../utils/AppError';
import type { AuthUser, Cargo } from '../types/express';

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) throw new AppError(401, 'Token não informado');

  try {
    const payload = jwt.verify(header.slice(7), env.jwtSecret) as AuthUser;
    req.user = { id: payload.id, cargo: payload.cargo };
    next();
  } catch {
    throw new AppError(401, 'Token inválido ou expirado');
  }
}

/** Restringe a rota a determinados cargos (ex.: requireCargo('gestor', 'superusuario')). */
export function requireCargo(...cargos: Cargo[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user || !cargos.includes(req.user.cargo)) {
      throw new AppError(403, 'Seu cargo não tem permissão para esta ação');
    }
    next();
  };
}
