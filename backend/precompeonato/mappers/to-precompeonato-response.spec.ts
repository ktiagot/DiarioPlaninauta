import { CampeonatoStatus } from '@prisma/client';
import {
  sortInscritosAdmin,
  toCampeonatoAtualResponse,
  toInscritoAdminResponse,
} from './to-precompeonato-response';
describe('toCampeonatoAtualResponse', () => {
  it('inclui edicao, dataInicio, descricao e bannerUrl', () => {
    const dto = toCampeonatoAtualResponse({
      id: 'c1',
      nome: 'Precompeonato #2',
      status: CampeonatoStatus.INSCRICOES_ABERTAS,
      inscricoesAbertasAte: null,
      edicao: '#2',
      dataInicio: new Date('2026-09-01T00:00:00.000Z'),
      descricao: 'Temporada 2',
      bannerUrl: '/uploads/campeonatos/c1.webp',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    expect(dto.edicao).toBe('#2');
    expect(dto.dataInicio).toBe('2026-09-01');
    expect(dto.descricao).toBe('Temporada 2');
    expect(dto.bannerUrl).toBe('/uploads/campeonatos/c1.webp');
  });
});

describe('toInscritoAdminResponse / sortInscritosAdmin', () => {
  it('calcula vitorias e ordena ativos primeiro', () => {
    const dto = toInscritoAdminResponse({
      id: 'ins-1',
      campeonatoId: 'c1',
      userId: 'u1',
      email: 'a@email.com',
      discordNick: 'nick',
      deckUrl: null,
      preconId: 'precon-1',
      preconComandanteId: 'cmd-1',
      precon: { nome: 'Deck' },
      preconComandante: { comandante: 'Cmd' },
      aceiteTermos: true,
      aceiteTermosEm: new Date(),
      aceitePrivacidade: true,
      entrouDiscord: true,
      ativo: true,
      pontos: 6,
      posicao: 2,
      createdAt: new Date(),
      updatedAt: new Date(),
      user: { nome: 'João', nick: 'joao' },
      mesas: [{ posicaoFinal: 1 }, { posicaoFinal: 2 }],
    });

    expect(dto.vitorias).toBe(1);
    expect(dto.email).toBe('a@email.com');

    const sorted = sortInscritosAdmin([
      { ...dto, id: 'b', ativo: false, posicao: 1, pontos: 9 },
      dto,
    ]);

    expect(sorted[0].ativo).toBe(true);
    expect(sorted[1].ativo).toBe(false);
  });
});
