# Organização de campeonatos (admin) — Design Spec

**Data:** 2026-08-26  
**Escopo:** Item 3 — criar campeonato (nome, edição, data início, descrição, banner), ciclo de status, upload manual de arte (P.O. 6.4). Hoje o campeonato só nasce no `prisma:seed`.

Continua o item 2 ([resultados](./2026-08-26-admin-resultados-rodada-design.md)). Precons e Emails ficam fora.

## Ciclo de vida

Só pode existir **um** campeonato não-encerrado. Criar o próximo exige finalizar o atual.

1. Admin cria (nome, edição, data início; descrição e banner opcionais) → nasce `INSCRICOES_ABERTAS`.
2. Admin inicia **ou** o primeiro sorteio de mesas fecha as inscrições → `EM_ANDAMENTO`.
3. Admin pode reabrir inscrições enquanto não finalizou → volta a `INSCRICOES_ABERTAS`, mesmo com rodadas já existentes. Novos inscritos entram nas **próximas** rodadas.
4. Admin finaliza (só confirmação, sem checar rodada aberta) → `ENCERRADO`. Não volta. Não edita mais.
5. Encerrado, a home ainda mostra esse campeonato (último `createdAt`) até o admin criar o próximo.

Campos (nome, edição, descrição, data início, banner) editáveis enquanto o status não for `ENCERRADO`. Status **não** entra no PATCH de dados — só no PATCH de status (e no sorteio, no passo 2).

Transições permitidas:

| De | Para | Como |
|---|---|---|
| (criar) | `INSCRICOES_ABERTAS` | `POST /campeonatos` |
| `INSCRICOES_ABERTAS` | `EM_ANDAMENTO` | PATCH status **ou** primeiro sorteio |
| `EM_ANDAMENTO` | `INSCRICOES_ABERTAS` | PATCH status (reabrir) |
| `INSCRICOES_ABERTAS` | `ENCERRADO` | PATCH status (finalizar) |
| `EM_ANDAMENTO` | `ENCERRADO` | PATCH status (finalizar) |

Qualquer outra transição → 409. `ENCERRADO` não sai desse estado.

O sorteio **não muda** se o campeonato já estiver `EM_ANDAMENTO` ou `ENCERRADO` (encerrado continua bloqueado como hoje). Se o admin reabriu e depois sortear de novo, o sorteio volta o status para `EM_ANDAMENTO`.

## Banco

Em `Campeonato` (`campeonatos`):

- `edicao` — `String`, obrigatório
- `dataInicio` — `DateTime` (`@db.Date`), obrigatório
- `descricao` — `String?`
- `bannerUrl` — `String?` — path relativo do arquivo, ex. `/uploads/campeonatos/{id}.webp`

O enum `CampeonatoStatus` não muda. `inscricoesAbertasAte` permanece no schema **sem uso** nesta entrega.

A unicidade de “um não-encerrado” é regra de aplicação (409 no create), não índice único no banco: vários `ENCERRADO` são válidos.

Seed vazio continua criando `Precompeonato #1` com `edicao` e `dataInicio` preenchidos. Não cria se já existir qualquer campeonato.

## Arquivos

- Disco: `backend/uploads/campeonatos/{id}{ext}` (`jpg` / `png` / `webp`).
- Troca de banner **sobrescreve** o arquivo do mesmo id (apaga a extensão anterior se mudar o tipo).
- MIME aceitos: `image/jpeg`, `image/png`, `image/webp`. Máximo 2 MB. Outro tipo ou tamanho → 400.
- Pasta `backend/uploads/` no `.gitignore` (mantém `.gitkeep`).
- Nest serve a pasta na raiz HTTP, **fora** do prefixo `/api`, via `useStaticAssets` com prefixo `/uploads/`.
- `bannerUrl` gravado: `/uploads/campeonatos/{id}{ext}`.
- Front monta a URL absoluta: em localhost, `http://localhost:3000` + path; em produção (mesmo host no nginx), o path relativo basta.

## API

Rotas novas, no módulo `precompeonato` que já existe:

| Método | Rota | Auth | Efeito |
|---|---|---|---|
| GET | `/precompeonato/campeonatos` | Admin | Lista todos, `createdAt` desc |
| POST | `/precompeonato/campeonatos` | Admin | Cria em `INSCRICOES_ABERTAS`. Body JSON: `nome`, `edicao`, `dataInicio` (obrigatórios), `descricao` opcional |
| PATCH | `/precompeonato/campeonatos/:id` | Admin | Edita `nome` / `edicao` / `dataInicio` / `descricao`. Não aceita `status` nem arquivo |
| POST | `/precompeonato/campeonatos/:id/banner` | Admin | Multipart campo `file`. Grava arquivo e atualiza `bannerUrl` |
| PATCH | `/precompeonato/campeonatos/:id/status` | Admin | Body `{ status }`. Só as transições da tabela acima |

`GET /precompeonato/atual` (público, já existe) passa a incluir `edicao`, `dataInicio`, `descricao`, `bannerUrl`. Inscrição no atual continua 409 se `status !== INSCRICOES_ABERTAS`.

Criar com banner: `POST` JSON e, se houver arquivo, `POST` do banner em seguida. Editar dados não reenvia o arquivo.

Respostas de erro:

| Situação | HTTP |
|---|---|
| POST criar com outro registro `status != ENCERRADO` | 409 |
| PATCH dados / POST banner / PATCH status em `ENCERRADO` | 409 |
| Transição de status fora da tabela | 409 |
| Body sem `nome` / `edicao` / `dataInicio` no create | 400 |
| Arquivo com MIME inválido ou > 2 MB | 400 |
| Id inexistente | 404 |
| Não autenticado | 401 |
| Autenticado e não admin | 403 |

`findCampeonatoAtual` **não muda**: `findFirst` por `createdAt` desc. Depois de finalizar, o encerrado continua “atual” até nascer outro.

## Front

Nova aba **Campeonatos** em `/admin/campeonato`, depois de Inscritos (depois de Resultados, se essa aba já existir). Componente filho (`AdminCampeonatosComponent`), no padrão do Dashboard.

**Criar**

- Campos: nome, edição, data início, descrição, arquivo de banner.
- Se já existir um não-encerrado: form desabilitado e texto “Finalize o campeonato atual para criar o próximo”.

**Lista** (mais recente primeiro)

- Card: nome, edição, data início, descrição, miniatura do banner, badge de status.
- Não encerrado: formulário de edição dos campos; input para trocar banner; botões **Iniciar** (se `INSCRICOES_ABERTAS`) ou **Reabrir inscrições** (se `EM_ANDAMENTO`); **Finalizar** com confirmação (“encerra o campeonato; só então será possível criar o próximo”).
- Encerrado: somente leitura.

Falha de API não remove o card. Mensagem do back vai para snackbar. Botões de status só habilitam na transição válida; se a lista estiver desatualizada e o PATCH retornar 409, recarrega a lista.

**Home Precompeonato**

- Passa a chamar `GET /precompeonato/atual`.
- Título = `nome`; subtítulo = `edicao`; banner se `bannerUrl`; descrição se houver.
- Some o título fixo “Commander League”.
- 404 (nenhum campeonato no banco): estado vazio, página não quebra. CTAs de inscrição/sorteio não tentam operar sem campeonato.

`AdminService` ganha list/create/patch/banner/status. Sem suíte E2E nova.

## Testes

Back (specs Nest, mesmo estilo do sorteio):

- Create ok em banco vazio ou só com encerrados; 409 se já houver `INSCRICOES_ABERTAS` ou `EM_ANDAMENTO`.
- Create persiste `edicao` e `dataInicio`; `status` inicial `INSCRICOES_ABERTAS`.
- PATCH dados em aberto / em andamento → 200; em encerrado → 409.
- PATCH status: as quatro transições da tabela → 200; qualquer outra (incl. encerrado → qualquer) → 409.
- Reabrir com rodadas já persistidas → 200 e as rodadas permanecem.
- Finalizar a partir de `INSCRICOES_ABERTAS` e de `EM_ANDAMENTO` → 200.
- Primeiro sorteio continua promovendo `INSCRICOES_ABERTAS` → `EM_ANDAMENTO` (regressão).
- POST banner troca o arquivo e `bannerUrl`; MIME inválido / oversized → 400; encerrado → 409.
- `GET /atual` inclui `edicao`, `dataInicio`, `descricao`, `bannerUrl`.
- Não-admin nas rotas novas → 403.

Front: verificação manual na aba (criar, banner, iniciar, reabrir, editar, finalizar, criar o próximo) e na home (nome, edição, banner, 404 vazio).

## Fora de escopo

- Timer da home e uso de `inscricoesAbertasAte`.
- Excluir campeonato.
- Desfazer finalizar.
- Storage S3 / URL colada no lugar do upload.
- Módulo Nest `campeonatos` separado.
- Abas Precons e Emails.
- Auto-fechar inscrições por data.
- Mudança na regra de “atual” (continuar último `createdAt`, não “primeiro não-encerrado”).
