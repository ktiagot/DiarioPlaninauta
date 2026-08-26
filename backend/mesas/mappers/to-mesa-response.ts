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

export function toMesaResponse(mesa: MesaComRelacoes): MesaResponseDto {
  return {
    id: mesa.id,
    nome: mesa.nome,
    quantidadeJogadores: mesa.jogadores.length,
    linkPartida: mesa.linkPartida,
    finalizada: mesa.finalizada,
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
