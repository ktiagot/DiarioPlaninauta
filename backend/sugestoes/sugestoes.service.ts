import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { CreateSugestaoDto } from './dto/create-sugestao.dto';

@Injectable()
export class SugestoesService {
  private readonly logger = new Logger(SugestoesService.name);

  private createTransporter() {
    const port = parseInt(process.env.SMTP_PORT || '465', 10);
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async enviar(dto: CreateSugestaoDto): Promise<void> {
    const transporter = this.createTransporter();

    const telefoneHtml = dto.telefone
      ? `<p><strong>Telefone/WhatsApp:</strong> ${dto.telefone}</p>`
      : '';

    await transporter.sendMail({
      from: `"Portal Planinauta" <${process.env.SMTP_USER}>`,
      to: 'contato@diarioplaninauta.com.br',
      subject: `[Sugestão Portal] ${dto.nome}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px 24px;">
          <h2 style="margin-bottom:16px;color:#F58220;">Nova Sugestão — Portal Planinauta</h2>
          <hr style="border:none;border-top:1px solid #ddd;margin:16px 0;" />
          <p><strong>Nome:</strong> ${dto.nome}</p>
          ${telefoneHtml}
          <p><strong>Mensagem:</strong></p>
          <p style="white-space:pre-wrap;background:#f5f5f5;padding:16px;border-radius:8px;">${dto.mensagem}</p>
          <hr style="border:none;border-top:1px solid #ddd;margin:24px 0;" />
          <p style="font-size:0.8rem;color:#999;">
            Enviado pelo formulário de sugestões do Portal Diário Planinauta.
          </p>
        </div>
      `,
    });

    this.logger.log(`Sugestão enviada por: ${dto.nome}`);
  }
}
