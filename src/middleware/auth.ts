import type { Request, Response, NextFunction } from 'express';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { adminAuth } from '../lib/firebase-admin.ts';
import { getOrCreateUser, PRIMARY_ADMIN_EMAIL } from '../db/users.ts';

export interface AuthRequest extends Request {
  user?: DecodedIdToken;
  adminActor?: string;
}

export function extractBearerToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return null;
  const token = header.slice('Bearer '.length).trim();
  return token.length > 0 ? token : null;
}

export const requireAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = extractBearerToken(req);
  if (!token) {
    res.status(401).json({ error: 'No autorizado: token faltante.' });
    return;
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    req.user = decodedToken;
    if (decodedToken.email) {
      await getOrCreateUser(decodedToken.uid, decodedToken.email);
    }
    next();
  } catch (error) {
    console.error('Error verifying Firebase ID token:', error);
    res.status(401).json({ error: 'No autorizado: token inválido.' });
  }
};

export function createAdminGuard(isValidSessionToken: (token: string) => boolean) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    const token = extractBearerToken(req);
    if (!token) {
      res.status(401).json({ error: 'Acceso restringido. Inicia sesión para continuar.' });
      return;
    }

    // 1. Accept verified server-issued admin session token (from /api/admin/login or /api/admin/setup)
    if (isValidSessionToken(token)) {
      req.adminActor = 'admin-panel';
      next();
      return;
    }

    // 2. Also accept a verified Firebase ID token belonging to the primary administrator
    try {
      const decodedToken = await adminAuth.verifyIdToken(token);
      const email = decodedToken.email?.trim().toLowerCase() ?? '';
      if (decodedToken.email_verified === true && email === PRIMARY_ADMIN_EMAIL) {
        req.user = decodedToken;
        req.adminActor = decodedToken.uid;
        await getOrCreateUser(decodedToken.uid, email);
        next();
        return;
      }
      res.status(403).json({ error: 'Esta cuenta no cuenta con permisos administrativos.' });
    } catch {
      res.status(401).json({ error: 'Sesión expirada o no autorizada. Vuelve a iniciar sesión.' });
    }
  };
}
