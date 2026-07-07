# Diário Planinauta — Backend API

API NestJS do portal Diário Planinauta. Expõe autenticação, cadastro de usuários e integração com APOIA.se.

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

## Cadastro de usuário (`POST /api/users`)

Recebe os dados do formulário de cadastro do front Angular e persiste na tabela `User`.

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

- Valida campos obrigatórios e whitelist de formatos MTG
- Hash da senha com argon2
- Consulta APOIA.se para definir `isApoiadorAtivo`, `monthlyContribution` e `lastValidationAt`
- Retorna `201` com dados do usuário **sem** `passwordHash`
- E-mail duplicado retorna `409 Conflict`
- Falha na API APOIA.se retorna `503 Service Unavailable`

### Teste via curl

```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"teste@email.com\",\"senha\":\"senha12345\",\"nome\":\"João\",\"sobrenome\":\"Silva\",\"nick\":\"joaosilva\",\"telefone\":\"11999999999\",\"formatos\":[\"Commander\"],\"cidade\":\"São Paulo\"}"
```

## Scripts úteis

| Comando | Descrição |
|---------|-----------|
| `npm run start:dev` | Servidor com hot reload |
| `npm run build` | Compila TypeScript |
| `npm run prisma:migrate` | Aplica migrations pendentes |
| `npm run prisma:generate` | Regenera Prisma Client |
| `npm run prisma:studio` | UI para inspecionar o banco |

## Variáveis de ambiente

| Variável | Descrição |
|----------|-----------|
| `DATABASE_URL` | Connection string PostgreSQL |
| `JWT_SECRET` | Segredo para tokens JWT |
| `JWT_EXPIRES` | Expiração do access token (ex.: `15m`) |
| `FRONTEND_URL` | Origem CORS do front (ex.: `http://localhost:4200`) |
| `APOIASE_URL` | Base URL da API APOIA.se |
| `APOIASE_API_KEY` | Chave da API APOIA.se |
| `APOIASE_SECRET` | Bearer token APOIA.se |
