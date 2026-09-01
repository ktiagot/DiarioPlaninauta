import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface ParsedComandante {
  nome: string;
  colorIdentity: string;
  isPartner: boolean;
  isPrincipal: boolean;
}

interface ParsedPrecon {
  nome: string;
  setNome: string;
  ano: number;
  isPartnerDeck: boolean;
  deckUrl: string | null;
  comandantes: ParsedComandante[];
}

/** Entrada do índice DeckList.json do MTGJSON. */
interface DeckListItem {
  code: string;
  fileName: string;
  name: string;
  releaseDate: string;
  type: string;
  /** URL oficial da decklist (WotC/mtg.wiki). Usada como deckUrl. */
  source?: string;
}

const WUBRG_ORDER = ['W', 'U', 'B', 'R', 'G'];

/** Ordena e junta uma color identity em string canônica WUBRG. Ex: ["G","U"] -> "UG". */
function normalizeColorIdentity(ci: string[] | undefined): string {
  if (!ci || ci.length === 0) return '';
  return [...new Set(ci)]
    .filter((c) => WUBRG_ORDER.includes(c))
    .sort((a, b) => WUBRG_ORDER.indexOf(a) - WUBRG_ORDER.indexOf(b))
    .join('');
}
import { CreatePreconDto, UpdatePreconDto } from './dto/create-precon.dto';
import {
  PreconComandanteResponseDto,
  PreconListItemDto,
  PreconResponseDto,
} from './dto/precon-response.dto';
import {
  toComandanteResponse,
  toPreconListItem,
  toPreconResponse,
} from './mappers/to-precon-response';

const preconInclude = {
  comandantes: { orderBy: { ordem: 'asc' as const } },
};

const MTGJSON_BASE = 'https://mtgjson.com/api/v5';

@Injectable()
export class PreconsService {
  private readonly logger = new Logger(PreconsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async search(busca?: string): Promise<PreconListItemDto[]> {
    const term = busca?.trim();
    const where = {
      banido: false,
      ...(term
        ? {
            OR: [
              { nome: { contains: term, mode: 'insensitive' as const } },
              { setNome: { contains: term, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const precons = await this.prisma.precon.findMany({
      where,
      orderBy: [{ ano: 'desc' }, { nome: 'asc' }],
    });

    return precons.map(toPreconListItem);
  }

  async listComandantes(preconId: string): Promise<PreconComandanteResponseDto[]> {
    const precon = await this.prisma.precon.findUnique({
      where: { id: preconId },
      include: { comandantes: { orderBy: { ordem: 'asc' } } },
    });

    if (!precon || precon.banido) {
      throw new NotFoundException('Precon não encontrado.');
    }

    return precon.comandantes.map(toComandanteResponse);
  }

  async listAdmin(): Promise<PreconResponseDto[]> {
    const precons = await this.prisma.precon.findMany({
      include: preconInclude,
      orderBy: [{ ano: 'desc' }, { nome: 'asc' }],
    });

    return precons.map(toPreconResponse);
  }

  async create(dto: CreatePreconDto): Promise<PreconResponseDto> {
    const comandantes = this.normalizeComandantes(dto.comandantes);

    const precon = await this.prisma.precon.create({
      data: {
        nome: dto.nome,
        setNome: dto.setNome,
        ano: dto.ano,
        comandantes: {
          create: comandantes.map((comandante, index) => ({
            comandante,
            ordem: index + 1,
          })),
        },
      },
      include: preconInclude,
    });

    return toPreconResponse(precon);
  }

  async update(id: string, dto: UpdatePreconDto): Promise<PreconResponseDto> {
    const existing = await this.prisma.precon.findUnique({
      where: { id },
      include: preconInclude,
    });

    if (!existing) {
      throw new NotFoundException('Precon não encontrado.');
    }

    if (dto.comandantes) {
      await this.syncComandantes(id, existing.comandantes, dto.comandantes);
    }

    const precon = await this.prisma.precon.update({
      where: { id },
      data: {
        ...(dto.nome !== undefined ? { nome: dto.nome } : {}),
        ...(dto.setNome !== undefined ? { setNome: dto.setNome } : {}),
        ...(dto.ano !== undefined ? { ano: dto.ano } : {}),
        ...(dto.banido !== undefined ? { banido: dto.banido } : {}),
      },
      include: preconInclude,
    });

    return toPreconResponse(precon);
  }

  async remove(id: string): Promise<void> {
    const existing = await this.prisma.precon.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Precon não encontrado.');
    }

    const [inscricoes, mesaJogadores] = await Promise.all([
      this.prisma.inscricao.count({ where: { preconId: id } }),
      this.prisma.mesaJogador.count({ where: { preconId: id } }),
    ]);

    if (inscricoes > 0 || mesaJogadores > 0) {
      throw new ConflictException(
        'Não é possível excluir: este precon está vinculado a inscrições ou mesas.',
      );
    }

    await this.prisma.precon.delete({ where: { id } });
  }

  async validateForInscricao(
    preconId: string,
    preconComandanteId: string,
    preconComandante2Id?: string | null,
  ): Promise<{ preconId: string; preconComandanteId: string; preconComandante2Id: string | null }> {
    const precon = await this.prisma.precon.findUnique({
      where: { id: preconId },
      include: { comandantes: true },
    });

    if (!precon) {
      throw new BadRequestException('Precon inválido.');
    }

    if (precon.banido) {
      throw new BadRequestException('Este precon não está disponível para inscrição.');
    }

    const comandante = precon.comandantes.find((c) => c.id === preconComandanteId);
    if (!comandante) {
      throw new BadRequestException('Comandante inválido para o precon selecionado.');
    }

    if (!preconComandante2Id) {
      return { preconId, preconComandanteId, preconComandante2Id: null };
    }

    // Segundo comandante (partner) — regras:
    if (preconComandante2Id === preconComandanteId) {
      throw new BadRequestException('Os dois comandantes devem ser diferentes.');
    }

    const comandante2 = precon.comandantes.find((c) => c.id === preconComandante2Id);
    if (!comandante2) {
      throw new BadRequestException('Segundo comandante inválido para o precon selecionado.');
    }

    if (!comandante.isPartner || !comandante2.isPartner) {
      throw new BadRequestException(
        'Só é possível usar dois comandantes se ambos tiverem a mecânica Partner.',
      );
    }

    return { preconId, preconComandanteId, preconComandante2Id };
  }

  async validateOptionalForMesa(
    preconId?: string,
    preconComandanteId?: string,
  ): Promise<{ preconId: string | null; preconComandanteId: string | null }> {
    if (!preconId && !preconComandanteId) {
      return { preconId: null, preconComandanteId: null };
    }

    if (!preconId || !preconComandanteId) {
      throw new BadRequestException('Informe precon e comandante juntos, ou deixe ambos vazios.');
    }

    await this.validateForInscricao(preconId, preconComandanteId);
    return { preconId, preconComandanteId };
  }

  /**
   * Sincroniza o catálogo de precons a partir do MTGJSON.
   * Fonte: DeckList.json (índice) + decks/<fileName>.json (deck individual).
   * Considera apenas decks do tipo "Commander Deck".
   * Upsert por (nome + setNome). Não remove precons existentes.
   */
  async sync(): Promise<{
    criados: number;
    atualizados: number;
    total: number;
    falhas: number;
  }> {
    const commanderDecks = await this.listarCommanderDecks();

    // Baixa e parseia em paralelo com concorrência limitada.
    const parsedList: ParsedPrecon[] = [];
    let falhas = 0;
    const CONCORRENCIA = 8;

    for (let i = 0; i < commanderDecks.length; i += CONCORRENCIA) {
      const lote = commanderDecks.slice(i, i + CONCORRENCIA);
      const resultados = await Promise.all(
        lote.map((item) =>
          this.baixarEParsear(item).catch(() => {
            this.logger.warn(`Falha ao baixar/parsear precon: ${item.fileName}`);
            return null;
          }),
        ),
      );
      for (const r of resultados) {
        if (r) parsedList.push(r);
        else falhas++;
      }
    }

    // Upserts sequenciais (Prisma não gosta de writes concorrentes na mesma conexão).
    let criados = 0;
    let atualizados = 0;

    for (const parsed of parsedList) {
      const existente = await this.prisma.precon.findFirst({
        where: { nome: parsed.nome, setNome: parsed.setNome },
        include: preconInclude,
      });

      if (existente) {
        await this.prisma.precon.update({
          where: { id: existente.id },
          data: { ano: parsed.ano, isPartnerDeck: parsed.isPartnerDeck, deckUrl: parsed.deckUrl },
        });
        await this.syncComandantesDetalhado(existente.id, existente.comandantes, parsed.comandantes);
        atualizados++;
      } else {
        await this.prisma.precon.create({
          data: {
            nome: parsed.nome,
            setNome: parsed.setNome,
            ano: parsed.ano,
            isPartnerDeck: parsed.isPartnerDeck,
            deckUrl: parsed.deckUrl,
            comandantes: {
              create: parsed.comandantes.map((c, index) => ({
                comandante: c.nome,
                ordem: index + 1,
                colorIdentity: c.colorIdentity,
                isPartner: c.isPartner,
                isPrincipal: c.isPrincipal,
              })),
            },
          },
        });
        criados++;
      }
    }

    this.logger.log(
      `Sync precons: ${criados} criados, ${atualizados} atualizados, ${falhas} falhas de ${commanderDecks.length} decks.`,
    );

    return { criados, atualizados, total: parsedList.length, falhas };
  }

  private async fetchComRetry(url: string, tentativas = 3): Promise<Response> {
    let ultimoErro: unknown;
    for (let i = 0; i < tentativas; i++) {
      try {
        const res = await fetch(url, { headers: { 'User-Agent': 'diario-planinauta' } });
        if (res.ok) return res;
        if (res.status === 403 || res.status === 429) {
          await this.delay(800 * (i + 1));
          continue;
        }
        ultimoErro = new Error(`HTTP ${res.status}`);
      } catch (err) {
        ultimoErro = err;
        await this.delay(500 * (i + 1));
      }
    }
    throw ultimoErro ?? new Error('Falha na requisição');
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /** Lê o índice DeckList.json e retorna apenas os Commander Decks. */
  private async listarCommanderDecks(): Promise<DeckListItem[]> {
    let res: Response;
    try {
      res = await this.fetchComRetry(`${MTGJSON_BASE}/DeckList.json`);
    } catch {
      throw new BadRequestException('Não foi possível acessar a lista oficial de precons (MTGJSON).');
    }
    const json = (await res.json()) as { data?: DeckListItem[] };
    return (json.data ?? []).filter((d) => d.type === 'Commander Deck');
  }

  private async baixarEParsear(item: DeckListItem): Promise<ParsedPrecon | null> {
    const url = `${MTGJSON_BASE}/decks/${encodeURIComponent(item.fileName)}.json`;
    const res = await this.fetchComRetry(url);

    type MtgCard = {
      name?: string;
      type?: string;
      types?: string[];
      supertypes?: string[];
      text?: string;
      keywords?: string[];
      colorIdentity?: string[];
      leadershipSkills?: { commander?: boolean };
    };
    const json = (await res.json()) as {
      data?: {
        commander?: MtgCard[];
        mainBoard?: MtgCard[];
      };
    };
    const deck = json.data;
    if (!deck) return null;

    const nome = item.name.trim();
    if (!nome) return null;

    const setNome = item.code?.trim() || 'Desconhecido';
    const ano = this.extrairAno(item.releaseDate);
    // O MTGJSON não tem página HTML por deck (mtgjson.com/decks/<x>/ dá 404).
    // Usa a URL oficial da decklist (WotC/mtg.wiki) vinda do índice.
    const src = item.source?.trim();
    const deckUrl = src && /^https?:\/\//i.test(src) ? src : null;

    // "Pareável": pode formar par com o principal (2 comandantes).
    // Cobre Partner / Partner—<tipo>, Friends forever, Doctor's companion,
    // "the Doctor" (parceiro dos companions) e Choose a Background.
    const isPartnerCard = (card: MtgCard): boolean => {
      const keywords = card.keywords ?? [];
      const text = card.text ?? '';
      const type = card.type ?? '';
      return (
        keywords.some((k) => /^partner\b/i.test(k)) ||
        keywords.some((k) => /friends forever/i.test(k)) ||
        keywords.some((k) => /doctor'?s companion/i.test(k)) ||
        keywords.some((k) => /choose a background/i.test(k)) ||
        /\bPartner\b/i.test(text) ||
        /friends forever/i.test(text) ||
        /doctor'?s companion/i.test(text) ||
        /can have two commanders if the other is the doctor/i.test(text) ||
        /\bTime Lord Doctor\b/i.test(type)
      );
    };

    const isLegendaryCreature = (card: MtgCard): boolean =>
      (card.supertypes ?? []).includes('Legendary') && (card.types ?? []).includes('Creature');

    // Dedup por nome (lowercase).
    const porNome = new Map<string, ParsedComandante>();

    // 1) comandante(s) principal(is) do bloco commander — sempre elegíveis.
    const principais = (deck.commander ?? []).filter((c): c is MtgCard => !!c?.name);
    for (const card of principais) {
      const key = card.name!.trim().toLowerCase();
      porNome.set(key, {
        nome: card.name!.trim(),
        colorIdentity: normalizeColorIdentity(card.colorIdentity),
        isPartner: isPartnerCard(card),
        isPrincipal: true,
      });
    }

    // CI base do deck = união das color identities de todos os principais (WUBRG).
    const ciDeck = normalizeColorIdentity(
      principais.flatMap((c) => c.colorIdentity ?? []),
    );

    // 2) demais lendárias do mainBoard elegíveis se:
    //    - forem partner/companion (formam par com o principal), OU
    //    - tiverem color identity EXATAMENTE igual à CI base do deck.
    for (const card of deck.mainBoard ?? []) {
      if (!card?.name) continue;
      if (!isLegendaryCreature(card)) continue;
      const ciCard = normalizeColorIdentity(card.colorIdentity);
      const elegivel = isPartnerCard(card) || ciCard === ciDeck;
      if (!elegivel) continue;
      const key = card.name.trim().toLowerCase();
      if (porNome.has(key)) continue;
      porNome.set(key, {
        nome: card.name.trim(),
        colorIdentity: ciCard,
        isPartner: isPartnerCard(card),
        isPrincipal: false,
      });
    }

    const comandantes = [...porNome.values()];
    if (comandantes.length === 0) return null;

    // Deck de partner = 2+ comandantes com a mecânica Partner.
    const isPartnerDeck = comandantes.filter((c) => c.isPartner).length >= 2;

    return { nome, setNome, ano, isPartnerDeck, deckUrl, comandantes };
  }

  private extrairAno(releasedAt?: string): number {
    const ano = releasedAt ? parseInt(releasedAt.slice(0, 4), 10) : NaN;
    return Number.isFinite(ano) && ano >= 1993 ? ano : new Date().getFullYear();
  }

  private normalizeComandantes(comandantes: string[]): string[] {
    const seen = new Set<string>();
    const result: string[] = [];

    for (const raw of comandantes) {
      const cmd = raw.trim();
      if (!cmd) continue;
      const key = cmd.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      result.push(cmd);
    }

    if (result.length === 0) {
      throw new BadRequestException('Informe ao menos um comandante.');
    }

    return result;
  }

  private async syncComandantes(
    preconId: string,
    existing: { id: string; comandante: string }[],
    incoming: string[],
  ): Promise<void> {
    const normalized = this.normalizeComandantes(incoming);
    const existingByName = new Map(
      existing.map((c) => [c.comandante.toLowerCase(), c]),
    );
    const incomingSet = new Set(normalized.map((c) => c.toLowerCase()));

    for (const cmd of existing) {
      if (!incomingSet.has(cmd.comandante.toLowerCase())) {
        const [inscricoes, mesaJogadores] = await Promise.all([
          this.prisma.inscricao.count({ where: { preconComandanteId: cmd.id } }),
          this.prisma.mesaJogador.count({ where: { preconComandanteId: cmd.id } }),
        ]);

        if (inscricoes > 0 || mesaJogadores > 0) {
          throw new ConflictException(
            `Não é possível remover o comandante "${cmd.comandante}": está em uso.`,
          );
        }

        await this.prisma.preconComandante.delete({ where: { id: cmd.id } });
      }
    }

    let ordem = 1;
    for (const comandante of normalized) {
      const found = existingByName.get(comandante.toLowerCase());
      if (found) {
        await this.prisma.preconComandante.update({
          where: { id: found.id },
          data: { ordem, comandante },
        });
      } else {
        await this.prisma.preconComandante.create({
          data: { preconId, comandante, ordem },
        });
      }
      ordem++;
    }
  }

  /**
   * Igual ao syncComandantes, mas preservando os metadados (colorIdentity,
   * isPartner, isPrincipal) vindos do sync. Não remove comandante em uso.
   */
  private async syncComandantesDetalhado(
    preconId: string,
    existing: { id: string; comandante: string }[],
    incoming: ParsedComandante[],
  ): Promise<void> {
    const existingByName = new Map(existing.map((c) => [c.comandante.toLowerCase(), c]));
    const incomingSet = new Set(incoming.map((c) => c.nome.toLowerCase()));

    for (const cmd of existing) {
      if (!incomingSet.has(cmd.comandante.toLowerCase())) {
        const [inscricoes, inscricoes2, mesaJogadores] = await Promise.all([
          this.prisma.inscricao.count({ where: { preconComandanteId: cmd.id } }),
          this.prisma.inscricao.count({ where: { preconComandante2Id: cmd.id } }),
          this.prisma.mesaJogador.count({ where: { preconComandanteId: cmd.id } }),
        ]);
        // Em uso: mantém (não remove para não quebrar histórico/inscrições).
        if (inscricoes > 0 || inscricoes2 > 0 || mesaJogadores > 0) continue;
        await this.prisma.preconComandante.delete({ where: { id: cmd.id } });
      }
    }

    let ordem = 1;
    for (const c of incoming) {
      const found = existingByName.get(c.nome.toLowerCase());
      const data = {
        comandante: c.nome,
        ordem,
        colorIdentity: c.colorIdentity,
        isPartner: c.isPartner,
        isPrincipal: c.isPrincipal,
      };
      if (found) {
        await this.prisma.preconComandante.update({ where: { id: found.id }, data });
      } else {
        await this.prisma.preconComandante.create({ data: { preconId, ...data } });
      }
      ordem++;
    }
  }
}
