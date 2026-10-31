import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { z } from 'zod';
import type { Dependencies } from '../types.js';
import { authenticate, admin, staff } from '../middleware.js';
import { audit, listResult, pagination, passwordInput } from '../lib/utils.js';
import { assert } from '../lib/errors.js';

const email = z.string().trim().email().max(254).transform(v => v.toLowerCase());
export function authRoutes(deps: Dependencies) {
  const router = Router();
  router.use((_req, res, next) => { res.setHeader('Cache-Control', 'no-store'); next(); });
  router.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 50, standardHeaders: 'draft-8', legacyHeaders: false,
    message: { error: { code: 'AUTH_RATE_LIMIT', message: 'Too many authentication requests; try again later' } } }));
  router.post('/signup', async (req, res) => {
    const input = z.object({ email, password: passwordInput, name: z.string().trim().min(1).max(120) }).strict().parse(req.body);
    res.status(201).json({ data: await deps.auth.signup(input.email, input.password, input.name) });
  });
  router.post('/login', async (req, res) => {
    const input = z.object({ email, password: z.string().min(1).max(200) }).strict().parse(req.body);
    res.json({ data: await deps.auth.login(input.email, input.password) });
  });
  router.post('/refresh', async (req, res) => {
    const { refreshToken } = z.object({ refreshToken: z.string().min(1).max(5000) }).strict().parse(req.body);
    res.json({ data: await deps.auth.refresh(refreshToken) });
  });
  router.post('/forgot-password', async (req, res) => {
    const input = z.object({ email }).strict().parse(req.body);
    await deps.auth.reset(input.email);
    res.status(202).json({ data: { message: 'If the account exists, password reset instructions will be sent.' } });
  });
  router.post('/logout', authenticate(deps), async (req, res) => {
    await deps.auth.logout(req.accessToken); res.status(204).end();
  });
  router.post('/password', authenticate(deps), async (req, res) => {
    const { password } = z.object({ password: passwordInput }).strict().parse(req.body);
    await deps.auth.password(req.accessToken, password); res.status(204).end();
  });
  return router;
}
export function userRoutes(deps: Dependencies) {
  const router = Router();
  router.get('/me', (req, res) => {
    const { id, email, name, role, active } = req.viewer;
    res.json({ data: { id, email, name, role, active } });
  });
  router.get('/customers', staff, async (req, res) => {
    const p = pagination(req);
    const query = z.object({ search: z.string().max(120).optional() }).parse(req.query);
    const where = { role: 'CUSTOMER' as const, active: true, ...(query.search ? { OR: [
      { name: { contains: query.search, mode: 'insensitive' as const } }, { email: { contains: query.search, mode: 'insensitive' as const } },
    ] } : {}) };
    const [data, total] = await Promise.all([
      deps.db.user.findMany({ where, select: { id: true, email: true, name: true }, skip: p.skip, take: p.take, orderBy: { email: 'asc' } }),
      deps.db.user.count({ where }),
    ]);
    res.json(listResult(data, total, p.page, p.pageSize));
  });
  router.post('/staff', admin, async (req, res) => {
    const input = z.object({ email, name: z.string().trim().min(1).max(120) }).strict().parse(req.body);
    const identity = await deps.auth.invite(input.email, input.name);
    const data = await deps.db.$transaction(async tx => {
      const existing = await tx.user.findUnique({ where: { id: identity.id } });
      assert(!existing || existing.role !== 'ADMIN', 409, 'ROLE_CONFLICT', 'An admin account cannot be changed through staff invitation');
      const user = await tx.user.upsert({ where: { id: identity.id }, create: { ...identity, role: 'STAFF' }, update: { name: input.name, role: 'STAFF' } });
      await audit(tx, req.viewer.id, 'staff.invite', 'User', user.id); return user;
    });
    res.status(201).json({ data: { id: data.id, email: data.email, name: data.name, role: data.role } });
  });
  return router;
}
