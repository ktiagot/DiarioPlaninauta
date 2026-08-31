import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ComunidadeService } from './comunidade.service';

@Injectable()
export class ComunidadeSchedulerService {
  private readonly logger = new Logger(ComunidadeSchedulerService.name);

  constructor(private readonly comunidadeService: ComunidadeService) {}

  // Todo domingo às 04:00 (America/Sao_Paulo): revalida apoiadores no APOIA.se.
  @Cron('0 0 4 * * 0', { timeZone: 'America/Sao_Paulo' })
  async handleSincronizacaoSemanal(): Promise<void> {
    this.logger.log('Iniciando revalidação semanal de apoiadores no APOIA.se...');
    try {
      const resumo = await this.comunidadeService.sincronizarTodosApoiadores();
      this.logger.log(
        `Revalidação concluída: ${resumo.total} verificados, ` +
          `${resumo.ativos} ativos, ${resumo.inativados} inativados, ${resumo.falhas} falha(s).`,
      );
    } catch (err) {
      this.logger.error('Falha na revalidação semanal de apoiadores.', err as Error);
    }
  }
}
