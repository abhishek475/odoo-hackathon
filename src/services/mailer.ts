import nodemailer from 'nodemailer';
import type { Config } from '../config.js';
import { AppError } from '../lib/errors.js';

export interface Mailer { send(to: string, subject: string, html: string): Promise<void>; }
export function createMailer(config: Config): Mailer {
  const enabled = config.SMTP_HOST && config.EMAIL_FROM;
  const transport = enabled ? nodemailer.createTransport({
    host: config.SMTP_HOST, port: config.SMTP_PORT, secure: config.SMTP_SECURE,
    ...(config.SMTP_USER ? { auth: { user: config.SMTP_USER, pass: config.SMTP_PASS } } : {}),
    ...(config.SMTP_SECURE ? {} : { requireTLS: true }),
  }) : null;
  return { async send(to, subject, html) {
    if (!transport) throw new AppError(503, 'EMAIL_NOT_CONFIGURED', 'Configure SMTP_HOST and EMAIL_FROM on the server');
    try { await transport.sendMail({ from: config.EMAIL_FROM, to, subject, html }); }
    catch { throw new AppError(502, 'EMAIL_DELIVERY_FAILED', 'The mail provider did not accept this invoice'); }
  } };
}
