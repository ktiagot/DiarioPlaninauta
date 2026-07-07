import {
  Mesa,
  MesaApi,
  MesaJogador,
  MesaJogadorApi,
  Rodada,
  RodadaApi,
} from './rodadas.models';

function mapJogador(j: MesaJogadorApi): MesaJogador {
  return {
    inscricaoId: j.inscricao_id ?? j.id ?? 0,
    nome: j.nome,
    nickname: j.nickname,
    comandante: j.comandante ?? j.comandante_principal,
    deckNome: j.deck_nome,
    deckUrl: j.deck_url,
    rankingCampeonato: j.ranking_campeonato ?? j.ranking,
    posicaoFinal: j.posicao_final,
  };
}

function sortJogadoresPorResultado(mesa: MesaApi, jogadores: MesaJogador[]): MesaJogador[] {
  if (!mesa.finalizada || !mesa.vencedor_id) {
    return jogadores;
  }

  const byId = new Map(jogadores.map((j) => [j.inscricaoId, j]));
  const ordenados: MesaJogador[] = [];

  const vencedor = byId.get(mesa.vencedor_id);
  if (vencedor) ordenados.push(vencedor);

  if (mesa.segundo_id) {
    const segundo = byId.get(mesa.segundo_id);
    if (segundo) ordenados.push(segundo);
  }

  for (const j of jogadores) {
    if (!ordenados.includes(j)) {
      ordenados.push(j);
    }
  }

  return ordenados;
}

function mapMesa(m: MesaApi): Mesa {
  const jogadores = (m.jogadores ?? []).map(mapJogador);

  return {
    id: m.id,
    numeroMesa: m.numero_mesa,
    finalizada: m.finalizada,
    linkPartida: m.link_partida ?? m.link_jogo,
    vencedorId: m.vencedor_id,
    segundoId: m.segundo_id,
    jogadores: sortJogadoresPorResultado(m, jogadores),
  };
}

export function mapRodada(r: RodadaApi): Rodada {
  return {
    id: r.id,
    numero: r.numero,
    dataRodada: r.data_rodada,
    mesas: (r.mesas ?? []).map(mapMesa),
  };
}
