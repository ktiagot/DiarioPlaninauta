import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';
import { ApoiaSeResponse } from './interfaces/apoiase-response.interface';

@Injectable()
export class ApoiaSeService {
  private readonly logger = new Logger(ApoiaSeService.name);

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {}

  async verify(email: string): Promise<ApoiaSeResponse> {
    if (this.isMockEnabled()) {
      this.logger.warn(
        `APOIASE_MOCK ativo — tratando ${email} como apoiador pago (R$15) sem chamar a API.`,
      );
      return {
        isBacker: true,
        isPaidThisMonth: true,
        thisMonthPaidValue: 15,
      };
    }

    const url =
      `${this.config.get('APOIASE_URL')}` +
      `/backers/charges/${encodeURIComponent(email)}`;

    try {
      const response = await firstValueFrom(
        this.http.get<ApoiaSeResponse>(url, {
          headers: {
            Accept: '*/*',
            'Content-Type': 'application/json',
            'x-api-key': this.config.get('APOIASE_API_KEY'),
            Authorization: `Bearer ${this.config.get('APOIASE_SECRET')}`,
          },
        }),
      );

      return response.data;
    } catch (err) {
      const axiosErr = err as AxiosError;
      const status = axiosErr.response?.status;

      this.logger.error(
        `APOIA.se retornou ${status ?? 'sem resposta'} para ${email}`,
        axiosErr.message,
      );

      if (status === 404) {
        // E-mail não encontrado na APOIA.se — não é apoiador
        return { isBacker: false, isPaidThisMonth: false };
      }

      if (status === 403) {
        this.logger.error(
          'Credenciais da APOIA.se inválidas. Verifique APOIASE_API_KEY e APOIASE_SECRET no .env',
        );
        throw new ServiceUnavailableException(
          'Serviço de verificação temporariamente indisponível.',
        );
      }

      throw new ServiceUnavailableException(
        'Não foi possível verificar o status no APOIA.se. Tente novamente.',
      );
    }
  }

  private isMockEnabled(): boolean {
    const value = this.config.get<string>('APOIASE_MOCK');
    return value === 'true' || value === '1';
  }
}
