import { Prisma } from '@prisma/client';
import {
  AnaliseInscricaoAdminDto,
  AnaliseSessaoResponseDto,
} from '../dto/analise-response.dto';

export const analiseInclude = {
  inscricoes: {
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    include: { user: { select: { nick: true, nome: true, sobrenome: true } } },
  },
} satisfies Prisma.AnaliseSessaoInclude;

export type AnaliseSessaoComInscricoes = Prisma.AnaliseSessaoGetPayload<{
  include: typeof analiseInclude;
}>;

export function toAnaliseSessaoResponse(
  s: AnaliseSessaoComInscricoes,
  userId?: string,
): AnaliseSessaoResponseDto {
  const itens = s.inscricoes.map((i, idx) => ({
    i,
    posicao: idx + 1,
    listaEspera: idx + 1 > s.vagas,
  }));
  const minha = userId ? itens.find((x) => x.i.userId === userId) : undefined;

  return {
    id: s.id,
    dataHora: s.dataHora.toISOString(),
    titulo: s.titulo,
    vagas: s.vagas,
    aberta: s.aberta,
    observacoes: s.observacoes,
    confirmados: itens.filter((x) => !x.listaEspera).length,
    totalListaEspera: itens.filter((x) => x.listaEspera).length,
    minhaInscricao: minha
      ? {
          id: minha.i.id,
          commander: minha.i.commander,
          linkDeck: minha.i.linkDeck,
          bracket: minha.i.bracket,
          budget: minha.i.budget,
          objetivos: minha.i.objetivos,
          posicao: minha.posicao,
          listaEspera: minha.listaEspera,
        }
      : null,
    inscritos: itens.map((x) => ({
      nick: x.i.user.nick,
      commander: x.i.commander,
      posicao: x.posicao,
      listaEspera: x.listaEspera,
    })),
  };
}

export function toAnaliseInscricoesAdmin(
  s: AnaliseSessaoComInscricoes,
): AnaliseInscricaoAdminDto[] {
  return s.inscricoes.map((i, idx) => ({
    id: i.id,
    userId: i.userId,
    nome: `${i.user.nome} ${i.user.sobrenome}`.trim(),
    nick: i.user.nick,
    commander: i.commander,
    linkDeck: i.linkDeck,
    bracket: i.bracket,
    budget: i.budget,
    objetivos: i.objetivos,
    posicao: idx + 1,
    listaEspera: idx + 1 > s.vagas,
    createdAt: i.createdAt.toISOString(),
  }));
}
