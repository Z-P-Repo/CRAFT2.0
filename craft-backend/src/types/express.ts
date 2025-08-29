import { Request, Response, NextFunction } from 'express';
import { IUser } from './index';

export interface AuthenticatedRequest extends Request {
  user: Omit<IUser, 'password'>;
}

export interface OptionalAuthRequest extends Request {
  user?: Omit<IUser, 'password'>;
}

export type AuthHandler = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => Promise<any>;

export type OptionalAuthHandler = (
  req: OptionalAuthRequest,
  res: Response,
  next: NextFunction
) => Promise<any>;

export type AuthMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => void | Promise<void>;