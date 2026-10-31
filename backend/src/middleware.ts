import type { RequestHandler } from 'express';
import type { Dependencies } from './types.js';
import type { Role } from './generated/prisma/client.js';
import { AppError, assert } from './lib/errors.js';

export function authenticate(deps: Dependencies): RequestHandler {
  return async (req, _res, next) => {
    const match = /^Bearer ([^\s]+)$/i.exec(req.header('Authorization') || '');
    if (!match?.[1]) throw new AppError(401, 'UNAUTHENTICATED', 'Send Authorization: Bearer <access_token>');
    const identity = await deps.auth.verify(match[1]);
    // Application role is always read from our protected DB table, never user_metadata or the request.
    const existing = await deps.db.user.findUnique({ where: { id: identity.id } });
    const user = existing
      ? existing.email === identity.email ? existing : await deps.db.user.update({ where: { id: identity.id }, data: { email: identity.email } })
      : await deps.db.user.upsert({
      where: { id: identity.id },
      create: { ...identity, role: 'CUSTOMER' },
      update: { email: identity.email },
      });
    assert(user.active, 403, 'ACCOUNT_DISABLED', 'This account is disabled');
    req.viewer = user;
    req.accessToken = match[1];
    next();
  };
}
export const roles = (...allowed: Role[]): RequestHandler => (req, _res, next) => {
  assert(allowed.includes(req.viewer.role), 403, 'FORBIDDEN', 'Your role cannot perform this action'); next();
};
export const staff = roles('ADMIN', 'STAFF');
export const admin = roles('ADMIN');
export function ownership(viewer: { role: Role; id: string }) {
  return viewer.role === 'CUSTOMER' ? { customerId: viewer.id } : {};
}
