# Resultados da rodada (admin) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Admin valida (ou lança) resultados das mesas — posição, kills, empate, link — e finaliza a rodada somando pontos.

**Architecture:** Estender `MesaTorneio` com `validada`/`validadaEm`. O POST de resultado passa a receber o ator (jogador da mesa ou admin). Jogador grava sem validar; admin grava e valida. A aba Resultados reusa `app-mesa-card` em três grupos.

**Tech Stack:** NestJS 11, Prisma 7, Jest, Angular 21 (signals, Material).

## Global Constraints

- Spec: `docs/superpowers/specs/2026-08-26-admin-resultados-rodada-design.md`
- Pontos no finalizar: 1º=3, 2º=1, empate=1 (já existe)
- Não persistir grafo de eliminações
- Sem “desvalidar”
- `pendente` = `validada === false`
- Re-sortear bloqueia se qualquer `posicaoFinal` existir

## File map

- Modify: `backend/prisma/schema.prisma` — `validada`, `validadaEm`
- Create: `backend/prisma/migrations/20260826200000_add_mesa_torneio_validada/migration.sql`
- Modify: `backend/precompeonato/dto/rodada-atual.dto.ts`
- Modify: `backend/precompeonato/sorteio/sorteio.service.ts`
- Modify: `backend/precompeonato/precompeonato.controller.ts`
- Modify: `backend/precompeonato/sorteio/sorteio.service.spec.ts`
- Modify: `src/app/core/rodadas/rodadas.models.ts`, `rodadas.mapper.ts`
- Modify: `src/app/core/admin/admin.models.ts`, `admin.service.ts`
- Modify: `src/app/pages/mesas/mesa-card/mesa-card.ts`, `.html`
- Modify: `src/app/pages/mesas/mesas.ts`, `.html`
- Modify: `src/app/pages/admin/campeonato/admin-campeonato.ts`, `.html`, `.scss`

---

### Task 1: Schema + helpers + autorização do POST resultado

**Files:**
- Modify: `backend/prisma/schema.prisma`
- Create: `backend/prisma/migrations/20260826200000_add_mesa_torneio_validada/migration.sql`
- Modify: `backend/precompeonato/dto/rodada-atual.dto.ts`
- Modify: `backend/precompeonato/sorteio/sorteio.service.ts`
- Modify: `backend/precompeonato/precompeonato.controller.ts`
- Test: `backend/precompeonato/sorteio/sorteio.service.spec.ts`

**Interfaces:**
- Consumes: `SubmitTorneioMesaResultadoDto`, `AuthUser`
- Produces: `submitMesaResultado(mesaId, dto, actor: { id: string; isAdmin: boolean })`
- GET rodada mesa: `{ validada: boolean; validadaEm: string | null; finalizada: boolean }` onde `finalizada` = todos com `posicaoFinal`

- [ ] **Step 1: Write failing tests** for jogador 403 fora da mesa, jogador grava `validada=false`, admin lança `validada=true`, jogador 409 após validada, admin corrige após validada, `podeFinalizar` só com todas validadas, finalizar com pendente 409, `isPreviousRodadaComplete` usa `validada`.

- [ ] **Step 2: Run tests — expect FAIL**

Run: `npm test -- --testPathPattern=sorteio.service.spec` (cwd `backend`)

- [ ] **Step 3: Schema + implementation**

```prisma
validada  Boolean  @default(false)
validadaEm DateTime?
```

Backfill: `validada = true` só em mesas de rodada já `finalizada`.

- [ ] **Step 4: Run tests — expect PASS**

---

### Task 2: Angular models + mesa-card modo admin

**Files:**
- Modify: `src/app/core/rodadas/rodadas.models.ts`
- Modify: `src/app/core/rodadas/rodadas.mapper.ts`
- Modify: `src/app/core/admin/admin.models.ts`
- Modify: `src/app/core/admin/admin.service.ts`
- Modify: `src/app/pages/mesas/mesa-card/mesa-card.ts`
- Modify: `src/app/pages/mesas/mesa-card/mesa-card.html`
- Modify: `src/app/pages/mesas/mesas.ts`
- Modify: `src/app/pages/mesas/mesas.html`

**Interfaces:**
- `Mesa.validada: boolean`
- `Mesa.validadaEm?: string | null`
- `mesa-card` inputs: `modoAdmin`, `rodadaFinalizada`
- Somente leitura: rodada finalizada OU (`validada` e usuário não-admin)
- Botões admin: Lançar e validar / Validar resultado / Salvar correção
- `AdminService.submitResultado` envia `empatadosInscricaoIds`
- `podeFinalizar` na página pública usa `rodada.podeFinalizar`

---

### Task 3: Aba Resultados no admin

**Files:**
- Modify: `src/app/pages/admin/campeonato/admin-campeonato.ts`
- Modify: `src/app/pages/admin/campeonato/admin-campeonato.html`
- Modify: `src/app/pages/admin/campeonato/admin-campeonato.scss`

**Interfaces:**
- Consome `RodadasService.getRodadaAtual()` / `finalizarRodada()`
- Grupos: `!finalizada` (sem reporte), `finalizada && !validada`, `validada`
- Topo: `X/Y mesas validadas` + Finalizar (confirmação) só se `podeFinalizar`
- Cards: `<app-mesa-card [modoAdmin]="true" [rodadaFinalizada]="rodada.finalizada">`

- [ ] **Step: `ng build` sem erro**
