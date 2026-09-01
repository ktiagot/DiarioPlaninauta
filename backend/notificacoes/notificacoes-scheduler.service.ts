import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { NotificacoesService } from './notificacoes.service';

@Injectable()
export class NotificacoesSchedulerService {
  private readonly logger = new Logger(NotificacoesSchedulerService.name);

  constructor(private readonly notificacoesService: NotificacoesService) {}

  // Todo dia às 03:00 (America/Sao_Paulo): apaga notificações com mais de 48h.
  @Cron('0 0 3 * * *', { timeZone: 'America/Sao_Paulo' })
  async handleLimpeza(): Promise<void> {
    try {
      const removidas = await this.notificacoesService.limparAntigas();
      if (removidas > 0) {
        this.logger.log(`Limpeza de notificações: ${removidas} removida(s) (>48h).`);
      }
    } catch (err) {
      this.logger.error('Falha na limpeza de notificações antigas.', err as Error);
    }
  }
}
