import { Eliminacao, Mesa, MesaJogador, User } from '@prisma/client';
import { MesaResponseDto } from '../dto/mesa-response.dto';

type MesaJogadorComUser = MesaJogador & {
  user: Pick<User, 'id' | 'nome' | 'sobrenome' | 'nick'>;
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
    })),
    eliminacoes: mesa.eliminacoes.map((eliminacao) => ({
      eliminadorUserId: eliminacao.eliminadorUserId,
      eliminadoUserId: eliminacao.eliminadoUserId,
    })),
  };
}
