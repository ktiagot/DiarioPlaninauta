import {

  Mesa,

  MesaApi,

  MesaAtualApi,

  MesaJogador,

  MesaJogadorApi,

  MesaJogadorAtualApi,

  Rodada,

  RodadaApi,

  RodadaAtualApi,

} from './rodadas.models';



function mapJogadorAtual(j: MesaJogadorAtualApi): MesaJogador {

  return {

    inscricaoId: j.inscricaoId,

    nome: j.nome,

    nickname: j.nickname,

    comandante: j.comandante,

    deckNome: j.deckNome,

    deckUrl: j.deckUrl ?? undefined,

    rankingCampeonato: j.rankingCampeonato ?? undefined,

    posicaoFinal: j.posicaoFinal ?? undefined,

    kills: j.kills,

  };

}



function mapMesaAtual(m: MesaAtualApi): Mesa {

  return {

    id: m.id,

    numeroMesa: m.numeroMesa,

    finalizada: m.finalizada,

    validada: m.validada === true,

    validadaEm: m.validadaEm ?? null,

    linkPartida: m.linkPartida ?? undefined,

    empate: m.empate,

    empatadosInscricaoIds: m.empatadosInscricaoIds ?? [],

    jogadores: (m.jogadores ?? []).map(mapJogadorAtual),

  };

}



export function mapRodadaAtual(r: RodadaAtualApi): Rodada {

  return {

    id: r.id,

    numero: r.numero,

    dataRodada: r.dataRodada,

    ativa: r.ativa,

    finalizada: r.finalizada,

    podeFinalizar: r.podeFinalizar,

    mesas: (r.mesas ?? []).map(mapMesaAtual),

  };

}



/** Legacy snake_case API — usado pelo fallback de inscricoes. */

function mapJogadorLegacy(j: MesaJogadorApi): MesaJogador {

  return {

    inscricaoId: String(j.inscricao_id ?? j.id ?? 0),

    nome: j.nome,

    nickname: j.nickname,

    comandante: j.comandante ?? j.comandante_principal,

    deckNome: j.deck_nome,

    deckUrl: j.deck_url,

    rankingCampeonato: j.ranking_campeonato ?? j.ranking,

    posicaoFinal: j.posicao_final,

    kills: j.kills,

  };

}



function mapMesaLegacy(m: MesaApi): Mesa {

  return {

    id: String(m.id),

    numeroMesa: m.numero_mesa,

    finalizada: m.finalizada,

    validada: m.finalizada,

    linkPartida: m.link_partida ?? m.link_jogo,

    vencedorId: m.vencedor_id != null ? String(m.vencedor_id) : undefined,

    segundoId: m.segundo_id != null ? String(m.segundo_id) : undefined,

    jogadores: (m.jogadores ?? []).map(mapJogadorLegacy),

  };

}



export function mapRodada(r: RodadaApi): Rodada {

  return {

    id: String(r.id),

    numero: r.numero,

    dataRodada: r.data_rodada,

    mesas: (r.mesas ?? []).map(mapMesaLegacy),

  };

}


