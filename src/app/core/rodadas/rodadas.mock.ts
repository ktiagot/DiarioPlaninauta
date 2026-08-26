import { Rodada } from './rodadas.models';

/** Mantido só para referência; a tela de mesas não usa mais mock. */
export const RODADA_MOCK: Rodada = {
  id: 'mock-rodada-1',
  numero: 1,
  dataRodada: '2025-06-24',
  mesas: [
    {
      id: 'mock-mesa-1',
      numeroMesa: 1,
      finalizada: false,
      validada: false,
      jogadores: [
        {
          inscricaoId: '1',
          nome: 'Priscila',
          nickname: 'PrihSlayer',
          comandante: 'Mirko',
          deckNome: 'Revenant Recon',
          rankingCampeonato: 12,
        },
      ],
    },
  ],
};
