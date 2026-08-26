# Resultados da rodada (admin) — Design Spec

**Data:** 2026-08-26  
**Escopo:** Item 2 — validar reporte de 1º e 2º, mesas pendentes, posição + kills + empate + link, finalizar rodada (soma pontos).

Continua o item 1 ([pareamento](./2026-08-26-admin-pareamento-rodada-design.md)). Resultados e finalizar rodada, que ficaram fora daquela entrega, entram aqui.

## Ciclo de vida

Estados da mesa, nesta ordem:

1. **Sem reporte** — mesa sorteada; ninguém gravou `posicaoFinal`.
2. **Aguardando validação** — um jogador da mesa confirmou o resultado. Qualquer jogador daquela mesa ainda pode corrigir.
3. **Validada** — admin confirmou (ou lançou o resultado sozinho). Jogador não edita mais. Admin ainda corrige até finalizar a rodada.
4. **Rodada finalizada** — trava geral. Pontos somados nas inscrições e classificação recalculada.

Regras:

- Quem grava resultado: **jogador daquela mesa** ou **admin**. Qualquer outro usuário logado recebe 403.
- Admin numa mesa sem reporte: lança posição, kills, empate e link e **já valida**.
- Não existe “desvalidar” nesta entrega.
- Abrir/sortear a próxima rodada bloqueia se a anterior tiver mesa **não validada**.
- Re-sortear da rodada atual continua bloqueado se **qualquer** mesa já tiver reporte (`posicaoFinal` preenchido), mesmo ainda não validada.
- **Finalizar rodada** só habilita quando todas as mesas estão validadas.

Pontuação no finalizar (já implementada, sem mudança):

| Resultado | Pontos |
|---|---|
| 1º | 3 |
| 2º | 1 |
| 3º e 4º | 0 |
| Empate (jogadores marcados) | 1 cada |

## Banco

Em `MesaTorneio` (`mesas_torneio`):

- `validada` — `Boolean`, default `false`
- `validadaEm` — `DateTime?`

Significado:

- Mesa **com reporte**: todos os `MesaTorneioJogador.posicaoFinal` preenchidos.
- Mesa **validada**: `validada === true`.
- `pendente` nas listagens e no bloqueio da próxima rodada: `validada === false`.

Não se persiste o grafo “quem eliminou quem”; o back continua gravando só o **número** de kills por jogador.

## API

Rotas existentes, contrato estendido:

| Método | Rota | Auth | Efeito |
|---|---|---|---|
| GET | `/precompeonato/atual/rodada` | Logado | Inclui `validada`, `validadaEm` por mesa; `podeFinalizar` é true só com todas validadas e rodada não finalizada |
| POST | `/precompeonato/mesas/:mesaId/resultado` | Jogador da mesa **ou** admin | Grava `posicao`/`kills`/`empate`/`empatadosInscricaoIds`/`linkPartida`. Jogador: `validada=false`. Admin: `validada=true` e preenche `validadaEm` |
| POST | `/precompeonato/rodadas/:rodadaId/finalizar` | Admin | Exige todas as mesas **validadas**; soma pontos; marca rodada finalizada |

`GET /precompeonato/atual/rodadas` (admin): `mesa.pendente` passa a significar não validada.

Autorização do POST resultado:

| Situação | Resposta |
|---|---|
| Rodada já finalizada | 409 |
| Mesa validada e usuário não é admin | 409 |
| Usuário não está na mesa e não é admin | 403 |
| Admin corrige mesa validada, rodada ainda aberta | 200 |
| Empate com menos de 2 `empatadosInscricaoIds` | 400 |
| Payload sem todos os jogadores da mesa | 400 |
| Link inválido (sem protocolo) | 400 |

Concorrência: último write ganha. Se o admin validar enquanto o jogador ainda edita, a validação prevalece e o POST seguinte do jogador cai em 409.

## Front

Nova aba **Resultados** em `/admin/campeonato`, depois de Pareamento.

**Topo**

- Identificação da rodada em andamento (número, data) e contagem `X/Y mesas validadas`.
- Botão **Finalizar rodada**: só ativo com todas validadas e rodada ainda não fechada. Confirmação: “soma os pontos e trava os resultados”.
- Sem rodada sorteada: estado vazio apontando para a aba Pareamento.

**Três grupos**, reusando `app-mesa-card`:

1. Sem reporte
2. Aguardando validação (card já mostra 1º/2º, kills, empate, link)
3. Validadas (para o admin corrigir até finalizar)

Modo admin do card:

| Estado | Badge | Ação |
|---|---|---|
| Sem reporte | Pendente | **Lançar e validar** |
| Aguardando validação | Aguardando | **Validar resultado** (grava correções + valida) |
| Validada | Validada | **Salvar correção** (até a rodada finalizar) |
| Rodada finalizada | Finalizada | Somente leitura |

Página pública de mesas: jogador da mesa continua confirmando/editando enquanto `validada === false`. Depois, o card fica somente leitura. O **Finalizar rodada** que já existe nessa página para admin permanece (mesmo endpoint).

`AdminService.submitResultado` passa a enviar `empatadosInscricaoIds`.

## Erros na UI

Falha de API não remove o card. A mensagem do back vai para snackbar. O botão Finalizar não habilita com mesa pendente; se a lista estiver desatualizada e o POST retornar 409, recarrega a rodada.

## Testes

Back (specs Nest, mesmo estilo do sorteio):

- Jogador da mesa grava → `validada=false`; usuário de fora da mesa → 403.
- Jogador edita de novo enquanto não validou → 200.
- Admin lança mesa sem reporte → `validada=true`.
- Admin valida mesa reportada (com correção de 1º/2º) → `validada=true`.
- Jogador POST depois de validada → 409; admin POST depois de validada e antes de finalizar → 200.
- `podeFinalizar` só é true com todas validadas; finalizar com mesa pendente → 409.
- Finalizar soma pontos e trava; POST resultado depois → 409.
- Abrir/sortear próxima rodada bloqueia se houver mesa não validada.
- Re-sortear bloqueia se já existir `posicaoFinal`.

Front: sem suíte E2E nova. Verificação manual na aba Resultados (três grupos, validar, corrigir, finalizar, pontos em Inscritos).

## Fora de escopo

- Desvalidar mesa (devolver ao jogador).
- Abas Campeonatos, Precons, Emails.
- Persistir grafo de eliminações (quem matou quem).
- Editar/cancelar rodada aberta (já fora do item 1).
- Mudança na tabela de pontuação.
