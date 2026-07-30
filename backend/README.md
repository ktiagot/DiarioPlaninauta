# Diário Planinauta — Backend API

API NestJS do portal Diário Planinauta. Expõe autenticação, cadastro de usuários, mesas, precompeonato e integração com APOIA.se.

## Pré-requisitos

- Node.js 20+
- PostgreSQL 14+

## Configuração local

1. Copie o arquivo de ambiente:

```bash
cp .env.example .env
```

2. Ajuste `DATABASE_URL` no `.env`:

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/diarioplaninauta"
```

3. Crie o banco PostgreSQL (exemplo via `psql`):

```sql
CREATE DATABASE diarioplaninauta;
```

4. Instale dependências e aplique migrations:

```bash
npm install
npm run prisma:generate
npm run prisma:migrate
```

5. Inicie o servidor de desenvolvimento:

```bash
npm run start:dev
```

- API: `http://localhost:3000/api`
- Swagger: `http://localhost:3000/docs`

## Modelo de dados — hub `users`

A tabela física é `users` (modelo Prisma `User`). O `id` é UUID e serve de âncora para outras entidades.

Campos obrigatórios de cadastro: `email` (unique), `senha` → `passwordHash`, `nome`, `sobrenome`, `nick` (unique), `telefone`, `formatos`, `cidade`.

### Padrão de FK

```prisma
model ExemploEntidade {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([userId])
  @@map("exemplo_entidades")
}
```

No modelo `User`, adicione a relação inversa:

```prisma
exemplos ExemploEntidade[]
```

### Mesas

| Tabela | Papel |
|--------|--------|
| `mesas` | Nome, link da partida, flag `finalizada` |
| `mesa_jogadores` | FK `mesaId` + `userId` (UUID de `users`), posição e kills |
| `eliminacoes` | FK `mesaId` + `eliminadorUserId` / `eliminadoUserId` → `users` |

Criação de mesas e alocação de jogadores é **manual** nesta entrega (Prisma Studio). Não há `POST /mesas`.

#### Popular uma mesa (manual)

1. Cadastre usuários via `POST /api/users`
2. No Prisma Studio (`npm run prisma:studio`):
   - Crie um registro em `mesas` com `nome` (ex.: `"Mesa 1"`)
   - Crie 4 registros em `mesa_jogadores` com o `mesaId` e os `userId`s
3. Confira com `GET /api/mesas`

## Cadastro de usuário (`POST /api/users`)

Recebe os dados do formulário de cadastro do front Angular e persiste na tabela `users`.

### Payload

```json
{
  "email": "teste@email.com",
  "senha": "senha12345",
  "nome": "João",
  "sobrenome": "Silva",
  "nick": "joaosilva",
  "telefone": "11999999999",
  "formatos": ["Commander"],
  "cidade": "São Paulo"
}
```

### Comportamento

- Valida campos obrigatórios e whitelist de formatos MTG (`ValidationPipe` com `forbidNonWhitelisted`)
- Hash da senha com argon2
- Consulta APOIA.se para definir `isApoiadorAtivo`, `monthlyContribution` e `lastValidationAt`
- Retorna `201` com dados do usuário **sem** `passwordHash`
- E-mail ou nick duplicado retorna `409 Conflict`
- Payload inválido retorna `400 Bad Request`
- Falha na API APOIA.se retorna `503 Service Unavailable`

> Cadastro completo é a **única** forma de criar usuários. `POST /api/auth/request-login` só autentica contas já existentes.

### Teste via curl

```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"teste@email.com\",\"senha\":\"senha12345\",\"nome\":\"João\",\"sobrenome\":\"Silva\",\"nick\":\"joaosilva\",\"telefone\":\"11999999999\",\"formatos\":[\"Commander\"],\"cidade\":\"São Paulo\"}"
```

## Mesas

### `GET /api/mesas`

Lista todas as mesas com jogadores (dados de `users`) e eliminações.

```json
[
  {
    "id": "uuid",
    "nome": "Mesa 1",
    "quantidadeJogadores": 4,
    "linkPartida": null,
    "finalizada": false,
    "jogadores": [
      {
        "userId": "uuid",
        "nome": "João",
        "sobrenome": "Silva",
        "nick": "joaosilva",
        "posicaoFinal": null,
        "kills": 0
      }
    ],
    "eliminacoes": []
  }
]
```

### `PUT /api/mesas/:id/link`

Cadastra/atualiza o link da partida vinculado à mesa (sem finalizar).

```json
{
  "linkPartida": "https://spelltable.wizards.com/game/abc123"
}
```

- Mesa inexistente → `404`
- Mesa já finalizada → `409`
- Link sem protocolo (`http`/`https`) → `400`

```bash
curl -X PUT http://localhost:3000/api/mesas/MESA_UUID/link \
  -H "Content-Type: application/json" \
  -d "{\"linkPartida\":\"https://spelltable.wizards.com/game/abc123\"}"
```

### `POST /api/mesas/:id/resultado`

Salva link, posições, eliminações e marca a mesa como `finalizada`.

```json
{
  "linkPartida": "https://twitch.tv/exemplo",
  "jogadores": [
    { "userId": "uuid-1", "posicao": 1, "kills": 2 },
    { "userId": "uuid-2", "posicao": 2, "kills": 1 },
    { "userId": "uuid-3", "posicao": 3, "kills": 0 },
    { "userId": "uuid-4", "posicao": 4, "kills": 0 }
  ],
  "eliminacoes": [
    { "eliminadorUserId": "uuid-1", "eliminadoUserId": "uuid-4" },
    { "eliminadorUserId": "uuid-2", "eliminadoUserId": "uuid-3" },
    { "eliminadorUserId": "uuid-1", "eliminadoUserId": "uuid-2" }
  ]
}
```

> Ajuste os `userId`s para os jogadores reais da mesa. `kills` deve ser igual à quantidade de eliminações em que o jogador é `eliminador`.

### Comportamento do resultado

- Mesa inexistente → `404`
- Mesa já finalizada → `409`
- Jogadores do payload devem ser exatamente os alocados; posições `1..N` únicas
- `eliminacoes.length === N - 1`; eliminado único; kills coerentes com o eliminador
- Payload inválido → `400`

```bash
curl http://localhost:3000/api/mesas

curl -X POST http://localhost:3000/api/mesas/MESA_UUID/resultado \
  -H "Content-Type: application/json" \
  -d "{\"linkPartida\":\"https://twitch.tv/exemplo\",\"jogadores\":[...],\"eliminacoes\":[...]}"
```

## Precompeonato

Tabelas compartilhadas com FK para `users` e `campeonatos` (não há DDL físico por edição).

| Tabela | Papel |
|--------|--------|
| `campeonatos` | Nome, status (`INSCRICOES_ABERTAS` / `EM_ANDAMENTO` / `ENCERRADO`) |
| `inscricoes` | FK `campeonatoId` + `userId`, deck, comandante, termos, pontos, posição |
| `rodadas` | Rodadas do torneio (por campeonato) |
| `mesas_torneio` | Mesas de uma rodada (separadas das mesas casuais) |
| `mesa_torneio_jogadores` | Alocação inscrição ↔ mesa |

Seed mínimo: `npm run prisma:seed` cria `Precompeonato #1` com status `INSCRICOES_ABERTAS` se ainda não existir campeonato.

### `GET /api/precompeonato/atual`

Retorna o campeonato mais recente (`createdAt` desc) com label de status para o front.

```json
{
  "id": "uuid",
  "nome": "Precompeonato #1",
  "status": "Inscrições abertas",
  "statusCode": "INSCRICOES_ABERTAS"
}
```

Query opcional `?email=` adiciona `jaInscrito` e `inscricao` (resumo).

- Sem campeonato → `404`

```bash
curl "http://localhost:3000/api/precompeonato/atual"
curl "http://localhost:3000/api/precompeonato/atual?email=teste@email.com"
```

### `POST /api/precompeonato/inscricoes`

Inscreve o usuário no campeonato atual (somente com status `INSCRICOES_ABERTAS`).

```json
{
  "discordNick": "usuario#1234",
  "email": "teste@email.com",
  "deckNome": "Precon Atraxa",
  "comandante": "Atraxa, Praetors' Voice",
  "aceiteTermos": true,
  "aceitePrivacidade": true,
  "entrouDiscord": true
}
```

- Usuário inexistente → `404`
- Qualquer dos três aceites em `false` → `400`
- Inscrições fechadas ou já inscrito → `409`
- Append do nome do campeonato em `User.preCampeonatos` se ainda não estiver na lista

```bash
curl -X POST http://localhost:3000/api/precompeonato/inscricoes \
  -H "Content-Type: application/json" \
  -d "{\"discordNick\":\"usuario#1234\",\"email\":\"teste@email.com\",\"deckNome\":\"Precon Atraxa\",\"comandante\":\"Atraxa, Praetors' Voice\",\"aceiteTermos\":true,\"aceitePrivacidade\":true,\"entrouDiscord\":true}"
```

### `GET /api/precompeonato/atual/jogadores`

Lista inscritos ativos do campeonato atual (qualquer status). Campos: deck, comandante, nome/nick, posição, rodada/mesa atuais e pontos.

```json
[
  {
    "id": "uuid",
    "deckUrl": "https://moxfield.com/decks/abc123",
    "deckNome": "Precon Atraxa",
    "comandante": "Atraxa, Praetors' Voice",
    "nomeJogador": "João",
    "nick": "joaosilva",
    "posicao": 1,
    "rodadaAtual": 2,
    "mesaAtual": 3,
    "pontos": 6
  }
]
```

Ordenação: `posicao` asc (nulls last), depois `pontos` desc. Sem alocação em mesa → `rodadaAtual` / `mesaAtual` = `null`.

```bash
curl http://localhost:3000/api/precompeonato/atual/jogadores
```

## Scripts úteis

| Comando | Descrição |
|---------|-----------|
| `npm run start:dev` | Servidor com hot reload |
| `npm run build` | Compila TypeScript |
| `npm run prisma:migrate` | Aplica migrations pendentes |
| `npm run prisma:generate` | Regenera Prisma Client |
| `npm run prisma:seed` | Seed (campeonato inicial) |
| `npm run prisma:studio` | UI para inspecionar o banco |

## Variáveis de ambiente

| Variável | Descrição |
|----------|-----------|
| `DATABASE_URL` | Connection string PostgreSQL |
| `JWT_SECRET` | Segredo para tokens JWT |
| `JWT_EXPIRES` | Expiração do access token (ex.: `15m`) |
| `FRONTEND_URL` | Origem CORS do front (ex.: `http://localhost:4200`) |
| `APOIASE_MOCK` | `true` em local: simula apoiador ativo sem chamar a API |
| `APOIASE_URL` | Base URL da API APOIA.se |
| `APOIASE_API_KEY` | Chave da API APOIA.se |
| `APOIASE_SECRET` | Bearer token APOIA.se |
