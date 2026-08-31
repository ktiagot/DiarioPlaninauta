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

const WUBRG_ORDER = ['W', 'U', 'B', 'R', 'G'];

/** Ordena e junta uma color identity em string canônica WUBRG. Ex: ["G","U"] -> "UG". */
function normalizeColorIdentity(ci: string[] | undefined): string {
  if (!ci || ci.length === 0) return '';
  return [...ci]
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
   * Sincroniza o catálogo de precons a partir do repositório público
   * Westly/CommanderPrecons (precons oficiais extraídos do Moxfield).
   * Upsert por (nome + setNome). Não remove precons existentes.
   */
  async sync(): Promise<{
    criados: number;
    atualizados: number;
    total: number;
    falhas: number;
  }> {
    const arquivos = await this.listarArquivosRepo();

    // Baixa e parseia em paralelo com concorrência limitada (evita rate limit e é rápido).
    const parsedList: ParsedPrecon[] = [];
    let falhas = 0;
    const CONCORRENCIA = 8;

    for (let i = 0; i < arquivos.length; i += CONCORRENCIA) {
      const lote = arquivos.slice(i, i + CONCORRENCIA);
      const resultados = await Promise.all(
        lote.map((path) =>
          this.baixarEParsear(path).catch(() => {
            this.logger.warn(`Falha ao baixar/parsear precon: ${path}`);
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
      `Sync precons: ${criados} criados, ${atualizados} atualizados, ${falhas} falhas de ${arquivos.length} arquivos.`,
    );

    return { criados, atualizados, total: parsedList.length, falhas };
  }

  private githubHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'User-Agent': 'diario-planinauta',
      Accept: 'application/vnd.github+json',
    };
    const token = process.env.GITHUB_TOKEN;
    if (token) headers.Authorization = `Bearer ${token}`;
    return headers;
  }

  private async fetchComRetry(url: string, tentativas = 3): Promise<Response> {
    let ultimoErro: unknown;
    for (let i = 0; i < tentativas; i++) {
      try {
        const res = await fetch(url, { headers: this.githubHeaders() });
        if (res.ok) return res;
        // 403/429 = rate limit; espera e tenta de novo.
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

  private async listarArquivosRepo(): Promise<string[]> {
    const url =
      'https://api.github.com/repos/Westly/CommanderPrecons/git/trees/main?recursive=1';
    let res: Response;
    try {
      res = await this.fetchComRetry(url);
    } catch {
      throw new BadRequestException('Não foi possível acessar a lista oficial de precons.');
    }
    const data = (await res.json()) as { tree?: { path: string; type: string }[] };
    return (data.tree ?? [])
      .filter((t) => t.type === 'blob' && t.path.startsWith('precon_json/') && t.path.endsWith('.json'))
      .map((t) => t.path);
  }

  private async baixarEParsear(path: string): Promise<ParsedPrecon | null> {
    const url = `https://raw.githubusercontent.com/Westly/CommanderPrecons/main/${encodeURI(path)}`;
    const res = await this.fetchComRetry(url);

    type MoxCard = {
      name?: string;
      set_name?: string;
      released_at?: string;
      type_line?: string;
      oracle_text?: string;
      color_identity?: string[];
    };
    const deck = (await res.json()) as {
      name?: string;
      publicUrl?: string;
      commanders?: Record<string, { card?: MoxCard }>;
      main?: MoxCard;
      mainboard?: Record<string, { card?: MoxCard }>;
    };

    const nome = this.limparNomePrecon(deck.name ?? '');
    if (!nome) return null;

    const deckUrl = deck.publicUrl?.trim() || null;

    // Comandante(s) principal(is) — do bloco commanders (fallback: main).
    const principaisCards = Object.values(deck.commanders ?? {})
      .map((c) => c.card)
      .filter((c): c is MoxCard => !!c?.name);
    if (principaisCards.length === 0 && deck.main?.name) {
      principaisCards.push(deck.main);
    }
    if (principaisCards.length === 0) return null;

    const primeira = principaisCards[0];
    const setNome = primeira.set_name?.trim() || 'Desconhecido';
    const ano = this.extrairAno(primeira.released_at);

    // Color identity do deck = a do comandante principal.
    const ciDeck = normalizeColorIdentity(primeira.color_identity);

    // Monta o mapa de comandantes elegíveis (dedup por nome).
    const porNome = new Map<string, ParsedComandante>();

    // 1) principais (marcados como principal, sempre elegíveis)
    for (const card of principaisCards) {
      const cardNome = card.name!.trim();
      porNome.set(cardNome.toLowerCase(), {
        nome: cardNome,
        colorIdentity: normalizeColorIdentity(card.color_identity),
        isPartner: /\bPartner\b/i.test(card.oracle_text ?? ''),
        isPrincipal: true,
      });
    }

    // 2) lendárias do mainboard com color identity EXATAMENTE igual à do deck
    for (const entry of Object.values(deck.mainboard ?? {})) {
      const card = entry.card;
      if (!card?.name || !card.type_line) continue;
      if (!/Legendary Creature/i.test(card.type_line)) continue;
      const ci = normalizeColorIdentity(card.color_identity);
      if (ci !== ciDeck) continue;

      const key = card.name.trim().toLowerCase();
      if (porNome.has(key)) continue;
      porNome.set(key, {
        nome: card.name.trim(),
        colorIdentity: ci,
        isPartner: /\bPartner\b/i.test(card.oracle_text ?? ''),
        isPrincipal: false,
      });
    }

    const comandantes = [...porNome.values()];
    // Deck de partner = 2+ comandantes com a mecânica Partner.
    const isPartnerDeck = comandantes.filter((c) => c.isPartner).length >= 2;

    return { nome, setNome, ano, isPartnerDeck, deckUrl, comandantes };
  }

  /** Remove o sufixo "(... Precon Decklist)" do nome do deck. */
  private limparNomePrecon(raw: string): string {
    return raw.replace(/\s*\([^)]*\)\s*$/, '').trim();
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
