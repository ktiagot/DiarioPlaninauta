import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { MesasService } from './mesas.service';
import { SorteioService } from '../precompeonato/sorteio/sorteio.service';

@Injectable()
export class MesasSchedulerService {
  private readonly logger = new Logger(MesasSchedulerService.name);

  constructor(
    private readonly mesasService: MesasService,
    private readonly sorteioService: SorteioService,
  ) {}

  // Todo dia às 08:00 (America/Sao_Paulo): avisa quem tem evento hoje.
  @Cron('0 0 8 * * *', { timeZone: 'America/Sao_Paulo' })
  async handleNotificacoesDoDia(): Promise<void> {
    try {
      const mesas = await this.mesasService.notificarMesasDeHoje();
      const rodadas = await this.sorteioService.notificarRodadasDeHoje();
      const total = mesas + rodadas;
      if (total > 0) {
        this.logger.log(
          `Notificações do dia: ${mesas} de mesa casual, ${rodadas} de rodada.`,
        );
      }
    } catch (err) {
      this.logger.error('Falha ao enviar notificações do dia.', err as Error);
    }
  }
}
