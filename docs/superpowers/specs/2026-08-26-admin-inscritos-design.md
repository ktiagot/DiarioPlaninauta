# Inscritos do campeonato (admin) — Design Spec

**Data:** 2026-08-26  
**Escopo:** Item 4 — lista completa de inscritos (nome, e-mail, deck, pontos, vitórias) e suspensão por campeonato (P.O. 11.2).

Continua o item 3 ([organização de campeonatos](./2026-08-26-admin-organizacao-campeonatos-design.md)). Precons e Emails ficam fora.

## Decisão de produto

O admin **não** gerencia perfil ou banimento global. Pode **suspender** alguém **deste campeonato** via `Inscricao.ativo = false`.

**Suspensão soft:**

- Some do ranking público, check-in e sorteios futuros.
- Mantém pontos, posição e mesas já jogadas.
- Admin pode **reativar** (`ativo = true`) na mesma inscrição.

## API

Rotas novas, módulo `precompeonato`, `JwtAuthGuard` + `AdminGuard`:

| Método | Rota | Efeito |
|---|---|---|
| GET | `/precompeonato/atual/inscritos/admin` | Lista **todos** os inscritos do campeonato atual (ativos e suspensos) |
| PATCH | `/precompeonato/inscricoes/:id/ativo` | Body `{ ativo: boolean }`. Suspende ou reativa |

`GET /precompeonato/atual/jogadores` (público) **não muda**: só `ativo: true`, sem e-mail.

### Resposta admin (`InscritoAdminResponseDto`)

`id`, `nome`, `nick`, `email`, `deckNome`, `deckUrl`, `comandante`, `pontos`, `vitorias`, `posicao`, `ativo`

- `vitorias`: mesas finalizadas com `posicaoFinal === 1` nesta inscrição.
- Ordenação: ativos primeiro; depois posição asc (nulls last); desempate por pontos desc.

### PATCH ativo

| Situação | HTTP |
|---|---|
| Id inexistente ou de outro campeonato | 404 |
| Campeonato `ENCERRADO` | 409 |
| Valor já igual | 200 (idempotente) |
| `ativo: false` | Remove check-ins da rodada aberta (sem mesas sorteadas) |
| Não autenticado | 401 |
| Não admin | 403 |

Não altera pontos, posição nem histórico de mesas.

## Sorteio

Em `executeSorteio`, check-ins de inscrições com `ativo: false` são ignorados (evita sortear suspenso após check-in e antes do sorteio).

## Front

Aba **Inscritos** em `/admin/campeonato`:

| Coluna | Fonte |
|---|---|
| # | `posicao` |
| Nome | `nome` (+ `nick` subtítulo) |
| E-mail | `email` |
| Deck | `deckNome` (link se `deckUrl`) |
| Pontos | `pontos` |
| Vitórias | `vitorias` |
| Status | badge Ativo / Suspenso |
| Ações | Suspender / Reativar |

- Confirmação ao suspender; reativar direto.
- Após toggle: recarrega lista e snapshot de pareamento.
- Título: `X ativos · Y suspensos`.
- Campeonato encerrado: ações desabilitadas.

## Testes

Back (Jest):

- Lista admin com ativos + suspensos, `email` e `vitorias`.
- Suspende → `ativo=false`, remove check-in pendente.
- Reativa → `ativo=true`.
- Campeonato encerrado → 409.
- Sorteio ignora check-in inativo.

Front: verificação manual na aba.

## Fora de escopo

- Banimento global / edição de perfil.
- Exclusão de inscrição.
- Notificação ao jogador.
- Audit log de suspensões.
- Busca/filtro na v1.
