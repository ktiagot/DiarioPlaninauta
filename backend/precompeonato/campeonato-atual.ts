import { Campeonato, CampeonatoStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

/** Status que contam como campeonato "aberto" (só um por vez). */
export const STATUS_CAMPEONATO_ABERTO: CampeonatoStatus[] = [
  CampeonatoStatus.INSCRICOES_ABERTAS,
  CampeonatoStatus.EM_ANDAMENTO,
];

/**
 * Campeonato "atual": o aberto (inscrições abertas ou em andamento), se houver.
 * Sem aberto, cai no mais recente (no modo público, ignorando rascunhos).
 * Assim, criar um rascunho do próximo campeonato não desloca o atual.
 */
export async function findCampeonatoAtual(
  prisma: Pick<PrismaService, 'campeonato'>,
  opts: { publico?: boolean } = {},
): Promise<Campeonato | null> {
  const aberto = await prisma.campeonato.findFirst({
    where: { status: { in: STATUS_CAMPEONATO_ABERTO } },
    orderBy: { createdAt: 'desc' },
  });
  if (aberto) return aberto;

  return prisma.campeonato.findFirst({
    where: opts.publico ? { status: { not: CampeonatoStatus.RASCUNHO } } : undefined,
    orderBy: { createdAt: 'desc' },
  });
}
