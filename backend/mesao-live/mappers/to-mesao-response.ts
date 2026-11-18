import { MesaoTipo, Prisma } from '@prisma/client';
import {
  MesaoInscricaoAdminDto,
  MesaoParticipanteDto,
  MesaoSessaoResponseDto,
} from '../dto/mesao-live-response.dto';

export const mesaoInclude = {
  inscricoes: {
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    include: { user: { select: { nick: true, nome: true, sobrenome: true } } },
  },
} satisfies Prisma.MesaoSessaoInclude;

export type MesaoSessaoComInscricoes = Prisma.MesaoSessaoGetPayload<{
  include: typeof mesaoInclude;
}>;

export function toMesaoSessaoResponse(
  s: MesaoSessaoComInscricoes,
  userId?: string,
): MesaoSessaoResponseDto {
  const porTipo = (tipo: MesaoTipo): MesaoParticipanteDto[] =>
    s.inscricoes
      .filter((i) => i.tipo === tipo)
      .map((i, idx) => ({ nick: i.user.nick, posicao: idx + 1 }));

  const minha = userId ? s.inscricoes.find((i) => i.userId === userId) : undefined;
  const posicaoMinha = minha
    ? s.inscricoes.filter((i) => i.tipo === minha.tipo).findIndex((i) => i.id === minha.id) + 1
    : 0;

  return {
    id: s.id,
    dataHora: s.dataHora.toISOString(),
    titulo: s.titulo,
    bracket: s.bracket,
    vagasJogador: s.vagasJogador,
    vagasSuplente: s.vagasSuplente,
    aberta: s.aberta,
    observacoes: s.observacoes,
    jogadores: porTipo('JOGADOR'),
    suplentes: porTipo('SUPLENTE'),
    minhaInscricao: minha
      ? { id: minha.id, tipo: minha.tipo, posicao: posicaoMinha }
      : null,
  };
}

export function toMesaoInscricoesAdmin(s: MesaoSessaoComInscricoes): MesaoInscricaoAdminDto[] {
  const contador: Record<MesaoTipo, number> = { JOGADOR: 0, SUPLENTE: 0 };
  return s.inscricoes.map((i) => ({
    id: i.id,
    userId: i.userId,
    nome: `${i.user.nome} ${i.user.sobrenome}`.trim(),
    nick: i.user.nick,
    tipo: i.tipo,
    posicao: ++contador[i.tipo],
    createdAt: i.createdAt.toISOString(),
  }));
}
