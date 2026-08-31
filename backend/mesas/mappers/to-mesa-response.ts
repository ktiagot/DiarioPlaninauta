import { Eliminacao, Mesa, MesaJogador, User } from '@prisma/client';
import { MesaResponseDto } from '../dto/mesa-response.dto';
import {
  comandanteFromInscricao,
  deckNomeFromInscricao,
} from '../../precons/mappers/to-precon-response';

type MesaJogadorComUser = MesaJogador & {
  user: Pick<User, 'id' | 'nome' | 'sobrenome' | 'nick'>;
  precon?: { nome: string } | null;
  preconComandante?: { comandante: string } | null;
};

type MesaComRelacoes = Mesa & {
  jogadores: MesaJogadorComUser[];
  eliminacoes: Eliminacao[];
};

export function toMesaResponse(
  mesa: MesaComRelacoes,
  viewerUserId?: string,
): MesaResponseDto {
  const souMembro =
    !!viewerUserId &&
    (mesa.criadorUserId === viewerUserId ||
      mesa.jogadores.some((j) => j.userId === viewerUserId));

  return {
    id: mesa.id,
    nome: mesa.nome,
    descricao: mesa.descricao,
    dataHora: mesa.dataHora.toISOString(),
    quantidadeJogadores: mesa.jogadores.length,
    // Link visível apenas para o dono e participantes da mesa.
    linkPartida: souMembro ? mesa.linkPartida : null,
    souMembro,
    finalizada: mesa.finalizada,
    criadorUserId: mesa.criadorUserId,
    jogadores: mesa.jogadores.map((jogador) => ({
      userId: jogador.userId,
      nome: jogador.user.nome,
      sobrenome: jogador.user.sobrenome,
      nick: jogador.user.nick,
      posicaoFinal: jogador.posicaoFinal,
      kills: jogador.kills,
      ...(jogador.precon && jogador.preconComandante
        ? {
            deckNome: deckNomeFromInscricao({
              precon: jogador.precon,
            }),
            comandante: comandanteFromInscricao({
              preconComandante: jogador.preconComandante,
            }),
          }
        : {}),
    })),
    eliminacoes: mesa.eliminacoes.map((eliminacao) => ({
      eliminadorUserId: eliminacao.eliminadorUserId,
      eliminadoUserId: eliminacao.eliminadoUserId,
    })),
  };
}
