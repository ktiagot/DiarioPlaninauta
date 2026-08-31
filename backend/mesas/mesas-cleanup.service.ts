import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { MesasService } from './mesas.service';

@Injectable()
export class MesasCleanupService {
  private readonly logger = new Logger(MesasCleanupService.name);

  constructor(private readonly mesasService: MesasService) {}

  // A cada 6 horas (00:00, 06:00, 12:00, 18:00 no fuso do processo).
  @Cron('0 0 */6 * * *', { timeZone: 'America/Sao_Paulo' })
  async handleLimpeza(): Promise<void> {
    try {
      const removidas = await this.mesasService.limparMesasExpiradas();
      if (removidas > 0) {
        this.logger.log(`Limpeza de mesas: ${removidas} mesa(s) removida(s).`);
      }
    } catch (err) {
      this.logger.error('Falha na limpeza automática de mesas.', err as Error);
    }
  }
}
