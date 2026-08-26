# Pareamento da rodada (admin) — Design Spec

**Data:** 2026-08-26  
**Escopo:** Item 1 — abrir rodada, check-in, sorteio suíço, listagem de rodadas/mesas.

## Ciclo de vida

1. Admin abre rodada (número + data) — só se não houver rodada em check-in e a anterior não tiver mesa pendente.
2. Jogadores e admin marcam check-in na rodada aberta (até o sorteio).
3. Admin sorteia mesas com quem fez check-in (mínimo 3).
4. Se nenhuma mesa tiver resultado, admin pode re-sortear com os mesmos check-ins.
5. Resultados e finalizar rodada ficam fora desta entrega (item 2).

Abrir rodada **não** altera status do campeonato para `EM_ANDAMENTO`; isso ocorre no sorteio.

## Banco

- `Rodada.dataRodada` (`Date`, NOT NULL) — backfill com `createdAt::date`.
- Oponentes: derivados de `mesa_torneio_jogadores` (sem `historico_oponentes`).

## API

| Método | Rota | Auth |
|---|---|---|
| POST | `/precompeonato/atual/rodadas` | Admin |
| GET | `/precompeonato/atual/rodadas` | Admin |
| PATCH | `/precompeonato/atual/checkin/admin` | Admin |
| POST | `/precompeonato/atual/re-sortear-mesas` | Admin |
| GET | `/precompeonato/atual/sorteio` | Admin (snapshot enriquecido) |
| POST | `/precompeonato/atual/sortear-mesas` | Admin (sem auto-criar rodada) |
| POST/DELETE | `/precompeonato/atual/checkin` | Jogador (exige rodada aberta) |

## Front

Aba **Pareamento** em `/admin/campeonato`: abrir rodada, check-in clicável, sortear/re-sortear, histórico read-only. Sem reportar resultado/finalizar nesta aba.

## Fora de escopo

Itens 2–6 da lista original; `historico_oponentes`; editar/cancelar rodada aberta.
