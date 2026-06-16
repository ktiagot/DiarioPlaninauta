import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  async sendMagicLink(email: string, token: string) {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const link =
      `${process.env.FRONTEND_URL}/auth/callback?token=${token}`;

    await transporter.sendMail({
      from: `"Diário Planinauta" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Seu link de acesso — Diário Planinauta',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;">
          <h2 style="margin-bottom:8px;">Entrar no Diário Planinauta</h2>
          <p style="color:#555;margin-bottom:24px;">
            Clique no botão abaixo para acessar o portal.<br>
            O link expira em <strong>10 minutos</strong>.
          </p>
          <a href="${link}"
             style="display:inline-block;padding:12px 28px;background:#6200ea;color:#fff;
                    border-radius:6px;text-decoration:none;font-weight:600;font-size:1rem;">
            Acessar o portal
          </a>
          <p style="font-size:0.8rem;color:#999;margin-top:32px;">
            Se você não solicitou este acesso, ignore este e-mail.
          </p>
        </div>
      `,
    });
  }
}
