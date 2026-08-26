import { Campeonato, Inscricao, User } from '@prisma/client';
import { toDateOnly } from '../date-only';
import { CAMPEONATO_STATUS_LABEL } from '../constants/status-labels';
import {
  CampeonatoAtualResponseDto,
  InscricaoResumoDto,
} from '../dto/campeonato-atual-response.dto';
import { InscricaoResponseDto } from '../dto/inscricao-response.dto';
import { JogadorPrecompeonatoResponseDto } from '../dto/jogador-precompeonato-response.dto';

export function toCampeonatoAtualResponse(
  campeonato: Campeonato,
  extras?: {
    jaInscrito?: boolean;
    inscricao?: InscricaoResumoDto | null;
  },
): CampeonatoAtualResponseDto {
  return {
    id: campeonato.id,
    nome: campeonato.nome,
    status: CAMPEONATO_STATUS_LABEL[campeonato.status],
    statusCode: campeonato.status,
    edicao: campeonato.edicao,
    dataInicio: toDateOnly(campeonato.dataInicio),
    descricao: campeonato.descricao || null,
    bannerUrl: campeonato.bannerUrl || null,
    ...(extras?.jaInscrito !== undefined
      ? {
          jaInscrito: extras.jaInscrito,
          inscricao: extras.inscricao ?? null,
        }
      : {}),
  };
}

export function toInscricaoResumo(inscricao: Inscricao): InscricaoResumoDto {
  return {
    id: inscricao.id,
    discordNick: inscricao.discordNick,
    deckUrl: inscricao.deckUrl,
    deckNome: inscricao.deckNome,
    comandante: inscricao.comandante,
  };
}

export function toInscricaoResponse(
  inscricao: Inscricao & { user: Pick<User, 'nome' | 'nick'> },
): InscricaoResponseDto {
  return {
    id: inscricao.id,
    campeonatoId: inscricao.campeonatoId,
    email: inscricao.email,
    discordNick: inscricao.discordNick,
    deckUrl: inscricao.deckUrl,
    deckNome: inscricao.deckNome,
    comandante: inscricao.comandante,
    nome: inscricao.user.nome,
    nick: inscricao.user.nick,
  };
}

type MesaAlocacao = {
  mesa: { numeroMesa: number; rodada: { numero: number } };
};

export function toJogadorResponse(
  inscricao: Inscricao & {
    user: Pick<User, 'nome' | 'nick'>;
    mesas: MesaAlocacao[];
  },
): JogadorPrecompeonatoResponseDto {
  let rodadaAtual: number | null = null;
  let mesaAtual: number | null = null;

  for (const alocacao of inscricao.mesas) {
    const numeroRodada = alocacao.mesa.rodada.numero;
    if (rodadaAtual === null || numeroRodada > rodadaAtual) {
      rodadaAtual = numeroRodada;
      mesaAtual = alocacao.mesa.numeroMesa;
    }
  }

  return {
    id: inscricao.id,
    deckUrl: inscricao.deckUrl,
    deckNome: inscricao.deckNome,
    comandante: inscricao.comandante,
    nomeJogador: inscricao.user.nome,
    nick: inscricao.user.nick,
    discordNick: inscricao.discordNick,
    posicao: inscricao.posicao,
    rodadaAtual,
    mesaAtual,
    pontos: inscricao.pontos,
  };
}
