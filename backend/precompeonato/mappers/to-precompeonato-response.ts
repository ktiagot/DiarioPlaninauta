import { Campeonato, Inscricao, Precon, PreconComandante, User } from '@prisma/client';

import { toDateOnly } from '../date-only';

import { CAMPEONATO_STATUS_LABEL } from '../constants/status-labels';

import {

  CampeonatoAtualResponseDto,

  InscricaoResumoDto,

} from '../dto/campeonato-atual-response.dto';

import { InscricaoResponseDto } from '../dto/inscricao-response.dto';

import { JogadorPrecompeonatoResponseDto } from '../dto/jogador-precompeonato-response.dto';
import { InscritoAdminResponseDto } from '../dto/inscrito-admin-response.dto';

import {

  comandanteFromInscricao,

  deckNomeFromInscricao,

} from '../../precons/mappers/to-precon-response';



type InscricaoComPrecon = Inscricao & {

  precon: Pick<Precon, 'nome'>;

  preconComandante: Pick<PreconComandante, 'comandante'>;

  preconComandante2?: Pick<PreconComandante, 'comandante'> | null;

};



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



export function toInscricaoResumo(inscricao: InscricaoComPrecon): InscricaoResumoDto {

  return {

    id: inscricao.id,

    discordNick: inscricao.discordNick,

    deckUrl: inscricao.deckUrl,

    deckNome: deckNomeFromInscricao(inscricao),

    comandante: comandanteFromInscricao(inscricao),

  };

}



export function toInscricaoResponse(

  inscricao: InscricaoComPrecon & { user: Pick<User, 'nome' | 'nick'> },

): InscricaoResponseDto {

  return {

    id: inscricao.id,

    campeonatoId: inscricao.campeonatoId,

    email: inscricao.email,

    discordNick: inscricao.discordNick,

    deckUrl: inscricao.deckUrl,

    deckNome: deckNomeFromInscricao(inscricao),

    comandante: comandanteFromInscricao(inscricao),

    nome: inscricao.user.nome,

    nick: inscricao.user.nick,

  };

}



type MesaAlocacao = {

  mesa: { numeroMesa: number; rodada: { numero: number } };

};



export function toJogadorResponse(

  inscricao: InscricaoComPrecon & {

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

    deckNome: deckNomeFromInscricao(inscricao),

    comandante: comandanteFromInscricao(inscricao),

    nomeJogador: inscricao.user.nome,

    nick: inscricao.user.nick,

    discordNick: inscricao.discordNick,

    posicao: inscricao.posicao,

    rodadaAtual,

    mesaAtual,

    pontos: inscricao.pontos,

  };

}



type MesaResultado = {

  posicaoFinal: number | null;

};



export function toInscritoAdminResponse(

  inscricao: InscricaoComPrecon & {

    user: Pick<User, 'nome' | 'nick'>;

    mesas: MesaResultado[];

  },

): InscritoAdminResponseDto {

  const vitorias = inscricao.mesas.filter((m) => m.posicaoFinal === 1).length;



  return {

    id: inscricao.id,

    nome: inscricao.user.nome,

    nick: inscricao.user.nick,

    email: inscricao.email,

    deckUrl: inscricao.deckUrl,

    deckNome: deckNomeFromInscricao(inscricao),

    comandante: comandanteFromInscricao(inscricao),

    pontos: inscricao.pontos,

    vitorias,

    posicao: inscricao.posicao,

    ativo: inscricao.ativo,

  };

}



export function sortInscritosAdmin(

  inscritos: InscritoAdminResponseDto[],

): InscritoAdminResponseDto[] {

  return [...inscritos].sort((a, b) => {

    if (a.ativo !== b.ativo) return a.ativo ? -1 : 1;

    if (a.posicao == null && b.posicao == null) {

      return b.pontos - a.pontos;

    }

    if (a.posicao == null) return 1;

    if (b.posicao == null) return -1;

    if (a.posicao !== b.posicao) return a.posicao - b.posicao;

    return b.pontos - a.pontos;

  });

}

