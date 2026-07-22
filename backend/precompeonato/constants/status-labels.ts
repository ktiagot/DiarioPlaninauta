import { CampeonatoStatus } from '@prisma/client';

export const CAMPEONATO_STATUS_LABEL: Record<CampeonatoStatus, string> = {
  [CampeonatoStatus.INSCRICOES_ABERTAS]: 'Inscrições abertas',
  [CampeonatoStatus.EM_ANDAMENTO]: 'Em andamento',
  [CampeonatoStatus.ENCERRADO]: 'Encerrado',
};
