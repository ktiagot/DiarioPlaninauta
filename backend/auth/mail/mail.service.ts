import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter() {
    const port = Number(process.env.SMTP_PORT) || 587;
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      // Porta 465 usa TLS desde o início da conexão (secure: true). Com secure: false nela, o
      // servidor espera o handshake TLS e o cliente espera o "greeting": "Greeting never received".
      // Nas demais (587), a conexão é aberta em texto e sobe para TLS via STARTTLS.
      secure: port === 465,
      // Sem isso o padrão é 30 s, e o usuário fica esperando a tela de "esqueci a senha".
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 20_000,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  /** Envia o código de 6 dígitos para redefinição de senha. */
  async sendResetSenhaCode(email: string, codigo: string) {
    await this.transporter().sendMail({
      from: `"Diário Planinauta" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Código para redefinir sua senha — Diário Planinauta',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;">
          <h2 style="margin-bottom:8px;">Redefinição de senha</h2>
          <p style="color:#555;margin-bottom:24px;">
            Use o código abaixo para redefinir sua senha. Ele expira em
            <strong>15 minutos</strong>.
          </p>
          <div style="font-size:2rem;font-weight:700;letter-spacing:0.4rem;
                      text-align:center;padding:16px;background:#f3f3f3;border-radius:8px;">
            ${codigo}
          </div>
          <p style="font-size:0.8rem;color:#999;margin-top:32px;">
            Se você não solicitou a redefinição, ignore este e-mail. Sua senha
            permanece inalterada.
          </p>
        </div>
      `,
    });
  }

  async sendMagicLink(email: string, token: string) {
    const transporter = this.transporter();

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
