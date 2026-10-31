import { ZodError } from 'zod';
import type { ErrorRequestHandler } from 'express';
import { Prisma } from '../generated/prisma/client.js';

export class AppError extends Error {
  constructor(public status: number, public code: string, message: string, public details?: unknown) { super(message); }
}
export const notFound = (entity = 'Record') => new AppError(404, 'NOT_FOUND', `${entity} not found`);
export function assert(condition: unknown, status: number, code: string, message: string): asserts condition {
  if (!condition) throw new AppError(status, code, message);
}
export const errorHandler: ErrorRequestHandler = (error: unknown, req, res, _next) => {
  if (res.headersSent) { _next(error); return; }
  if (error instanceof ZodError) {
    res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Check the request fields',
      details: error.issues.map(i => ({ field: i.path.join('.'), message: i.message })), requestId: req.requestId } });
    return;
  }
  if (error instanceof AppError) {
    res.status(error.status).json({ error: { code: error.code, message: error.message, details: error.details, requestId: req.requestId } });
    return;
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    const mapped: Record<string, [number, string, string]> = {
      P2002: [409, 'CONFLICT', 'A record with these unique values already exists'],
      P2003: [400, 'INVALID_REFERENCE', 'A referenced record is missing or still in use'],
      P2025: [404, 'NOT_FOUND', 'Record not found'],
      P2034: [409, 'RETRY_REQUEST', 'Concurrent update; retry the request'],
      P2004: [400, 'CONSTRAINT_ERROR', 'This operation violates a data constraint'],
    };
    const item = mapped[error.code];
    if (item) { res.status(item[0]).json({ error: { code: item[1], message: item[2], requestId: req.requestId } }); return; }
  }
  if (typeof error === 'object' && error && 'type' in error && error.type === 'entity.parse.failed') {
    res.status(400).json({ error: { code: 'INVALID_JSON', message: 'Request body must be valid JSON', requestId: req.requestId } }); return;
  }
  if (typeof error === 'object' && error && 'type' in error && error.type === 'entity.too.large') {
    res.status(413).json({ error: { code: 'BODY_TOO_LARGE', message: 'Request body exceeds 256 KB', requestId: req.requestId } }); return;
  }
  // Never log request bodies, authentication tokens, SQL parameters, or connection strings.
  console.error(JSON.stringify({ event: 'request_failed', requestId: req.requestId, name: error instanceof Error ? error.name : 'UnknownError' }));
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred', requestId: req.requestId } });
};
