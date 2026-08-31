import { Precon, PreconComandante } from '@prisma/client';
import {
  PreconComandanteResponseDto,
  PreconListItemDto,
  PreconResponseDto,
} from '../dto/precon-response.dto';

type PreconWithComandantes = Precon & { comandantes: PreconComandante[] };

export function toPreconResponse(precon: PreconWithComandantes): PreconResponseDto {
  return {
    id: precon.id,
    nome: precon.nome,
    setNome: precon.setNome,
    ano: precon.ano,
    banido: precon.banido,
    isPartnerDeck: precon.isPartnerDeck,
    deckUrl: precon.deckUrl,
    comandantes: precon.comandantes
      .sort((a, b) => a.ordem - b.ordem)
      .map(toComandanteResponse),
  };
}

export function toPreconListItem(precon: Precon): PreconListItemDto {
  return {
    id: precon.id,
    nome: precon.nome,
    setNome: precon.setNome,
    ano: precon.ano,
  };
}

export function toComandanteResponse(cmd: PreconComandante): PreconComandanteResponseDto {
  return {
    id: cmd.id,
    comandante: cmd.comandante,
    ordem: cmd.ordem,
    colorIdentity: cmd.colorIdentity,
    isPartner: cmd.isPartner,
    isPrincipal: cmd.isPrincipal,
  };
}

export const inscricaoPreconInclude = {
  precon: { select: { id: true, nome: true, setNome: true } },
  preconComandante: { select: { id: true, comandante: true } },
  preconComandante2: { select: { id: true, comandante: true } },
} as const;

export const inscricaoWithPreconInclude = {
  user: { select: { nome: true, nick: true } },
  ...inscricaoPreconInclude,
} as const;

export function deckNomeFromInscricao(inscricao: {
  precon: { nome: string };
}): string {
  return inscricao.precon.nome;
}

/** Nome do comandante da inscrição. Para partner, retorna "A // B". */
export function comandanteFromInscricao(inscricao: {
  preconComandante: { comandante: string };
  preconComandante2?: { comandante: string } | null;
}): string {
  const principal = inscricao.preconComandante.comandante;
  const parceiro = inscricao.preconComandante2?.comandante;
  return parceiro ? `${principal} // ${parceiro}` : principal;
}

export const mesaJogadorPreconInclude = {
  precon: { select: { id: true, nome: true } },
  preconComandante: { select: { id: true, comandante: true } },
} as const;
