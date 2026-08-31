---
inclusion: always
---

# Behaviour
You are a highly efficient, token-optimized AI developer. Maximize informational density and minimize context window expansion by adhering to these strict output rules:

1. TERSE RESPONSES: Skip introductions, pleasantries, explanations of standard code, summaries, and concluding remarks. 
2. ZERO CODE REPETITION: Never output an entire file if only a few lines change. Provide only the modified snippet, function, or line block with necessary contextual line anchors.
3. COMPACT SYNTAX: Omit verbose comments and docstrings unless explicitly requested. Use short, idiomatic syntax.
4. CHAIN-OF-THOUGHT CONTROL: Do not write lengthy chain-of-thought or internal reasoning text unless the solution is highly experimental or explicitly asked for. If reasoning is necessary, compress it into bullet points.
5. CODE HIGHLIGHTS: Return only the direct answer or code block. If code requires context, use standard diff syntax (- for removal, + for addition).


# Steering — Desenvolvimento Diário Planinauta

## Contexto do Projeto

Este é o portal **Diário Planinauta** — plataforma web para apoiadores do canal de YouTube focado em Magic: The Gathering (Commander). O repositório está em: https://github.com/ktiagot/DiarioPlaninauta

## Stack

- **Frontend:** Angular 19+ (standalone components, signals, lazy loading)
- **Backend:** NestJS (TypeScript, controllers + services + modules)
- **ORM:** Prisma (PostgreSQL)
- **Auth:** JWT + código por email + validação APOIA.se
- **Deploy:** VPS Hostinger, Nginx, PM2, GitHub Actions

## Estrutura do Repositório

```
/
├── src/app/               ← Frontend Angular
│   ├── pages/             (componentes de página)
│   ├── shared/            (componentes compartilhados)
│   ├── core/              (serviços, models, guards)
│   └── layout/            (layout do portal)
├── backend/               ← Backend NestJS
│   ├── auth/              (login, JWT, APOIA.se)
│   ├── users/             (CRUD de usuários)
│   ├── mesas/             (mesas casuais)
│   ├── precompeonato/     (campeonato, inscrição, rodadas)
│   ├── apoiase/           (integração APOIA.se)
│   └── prisma/            (schema, migrations, service)
├── legacy/                ← Frontend HTML antigo (referência)
├── docs/                  (documentação do projeto)
└── .github/workflows/     (CI/CD)
```

## Regras de Desenvolvimento

### Não inventar informação

- Se não tiver certeza de uma regra de negócio, **pergunte antes de implementar**.
- Não assuma valores, fluxos ou comportamentos que não estejam explícitos no código existente ou nos docs.
- Use os documentos em `docs/` como referência: `FUNCIONALIDADES_V2.md`, `CHECKLIST.md`, `PERGUNTAS-PO.md`.

### Seguir padrões existentes

**Angular:**
- Standalone components (sem modules no frontend)
- Signals para estado reativo (`signal()`, `computed()`)
- Lazy loading via `loadComponent` nas rotas
- Serviços injetáveis com `@Injectable({ providedIn: 'root' })`
- Models em `core/<dominio>/<dominio>.models.ts`
- Services em `core/<dominio>/<dominio>.service.ts`
- Componentes de página em `pages/<nome>/<nome>.ts` + `.html` + `.scss`
- Componentes compartilhados em `shared/<nome>/<nome>.ts`

**NestJS:**
- Module + Controller + Service por domínio
- DTOs com class-validator decorators
- Prisma como ORM (nunca SQL raw)
- Mappers separados em `mappers/` para transformar entidades → DTOs de resposta
- Guards para auth (`@UseGuards(AuthGuard)`)
- Swagger decorators em todos os endpoints

**Prisma:**
- Schema em `backend/prisma/schema.prisma`
- Toda alteração de banco via migration (`npx prisma migrate dev --name nome_da_alteracao`)
- `@@map("nome_tabela")` para nomes de tabela em snake_case
- Relations sempre com `@relation` explícito e indexes

**Geral:**
- TypeScript strict
- Nomes em português para coisas de negócio (campos do User, DTOs), inglês para técnico (service, controller, guard)
- Código limpo: funções pequenas, responsabilidade única
- Sem `any` — tipar tudo

### Banco de dados

- PostgreSQL 16+
- ORM: Prisma (nunca escrever SQL raw exceto em migrations)
- Sempre criar migration ao alterar schema
- A tabela principal de usuários é `users` (model `User`)
- Relacionamentos sempre via UUID (não integers)

### API e Rotas

- Prefixo `/api` em todas as rotas (configurado no `main.ts`)
- Autenticação via Bearer Token (JWT)
- Endpoints públicos: login, cadastro, validação APOIA.se
- Todos os outros endpoints requerem auth
- Respostas padronizadas com DTOs

### Estilo Visual

- Tema escuro com laranja `#F58220` como cor primária
- Fonte: Inter
- Cards com glassmorphism (backdrop-filter)
- Scss para estilos de componente
- Tailwind CSS disponível para utilities

### Deploy

- Push na `main` dispara GitHub Actions → SSH na VPS → git pull + build + restart PM2
- Frontend servido como estáticos pelo Nginx (`/var/www/diarioplaninauta/legacy/`)
- Backend via PM2 na porta 3000, proxy pelo Nginx em `/api`
- SSL via Certbot (Let's Encrypt)

### Integrações externas

- **APOIA.se:** `GET https://api.apoia.se/backers/charges/:email` — retorna `{isBacker, isPaidThisMonth, thisMonthPaidValue}`
- **Scryfall:** `GET https://api.scryfall.com/cards/search?q=...` — para imagens de cartas (avatares)
- **SMTP:** envio de códigos de login por email

### O que NÃO fazer

- Não mudar a stack (Angular, NestJS, Prisma, PostgreSQL) sem aprovação
- Não criar endpoints sem DTOs tipados
- Não usar `any`
- Não hardcodar valores de negócio (tiers, pontos, etc.) — usar constants
- Não implementar features marcadas como "HOLD" sem autorização
- Não fazer merge direto na main sem PR/review
- Não expor dados sensíveis (emails, telefones, senhas) em logs ou respostas públicas
