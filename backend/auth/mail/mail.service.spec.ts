import * as nodemailer from 'nodemailer';
import { MailService } from './mail.service';

jest.mock('nodemailer');

describe('MailService (transporte SMTP)', () => {
  const sendMail = jest.fn().mockResolvedValue(undefined);
  const createTransport = nodemailer.createTransport as jest.Mock;
  const envOriginal = { ...process.env };

  beforeEach(() => {
    createTransport.mockReset().mockReturnValue({ sendMail });
    sendMail.mockClear();
    process.env.SMTP_HOST = 'smtp.exemplo.com';
    process.env.SMTP_USER = 'no-reply@exemplo.com';
    process.env.SMTP_PASS = 'segredo';
  });

  afterAll(() => {
    process.env = envOriginal;
  });

  it('porta 465 usa TLS direto (secure: true)', async () => {
    process.env.SMTP_PORT = '465';
    await new MailService().sendResetSenhaCode('a@b.com', '123456');

    expect(createTransport).toHaveBeenCalledWith(
      expect.objectContaining({ host: 'smtp.exemplo.com', port: 465, secure: true }),
    );
  });

  it('porta 587 usa STARTTLS (secure: false)', async () => {
    process.env.SMTP_PORT = '587';
    await new MailService().sendResetSenhaCode('a@b.com', '123456');

    expect(createTransport).toHaveBeenCalledWith(
      expect.objectContaining({ port: 587, secure: false }),
    );
  });

  it('sem SMTP_PORT cai em 587 (não vira NaN) e define timeouts curtos', async () => {
    delete process.env.SMTP_PORT;
    await new MailService().sendResetSenhaCode('a@b.com', '123456');

    expect(createTransport).toHaveBeenCalledWith(
      expect.objectContaining({
        port: 587,
        secure: false,
        connectionTimeout: 10_000,
        greetingTimeout: 10_000,
      }),
    );
  });

  it('envia o código no corpo do e-mail para o destinatário', async () => {
    process.env.SMTP_PORT = '587';
    await new MailService().sendResetSenhaCode('usuario@email.com', '654321');

    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'usuario@email.com', html: expect.stringContaining('654321') }),
    );
  });
});