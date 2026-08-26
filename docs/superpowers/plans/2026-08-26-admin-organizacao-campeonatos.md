# Organização de campeonatos (admin) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Admin cria, edita, troca banner e avança o ciclo de status do campeonato no Nest; a home pública mostra nome, edição, descrição e banner do atual.

**Architecture:** Campos novos em `Campeonato`. CRUD e status ficam num `CampeonatoAdminService` no módulo `precompeonato` (o service atual já está grande). Banner em disco (`uploads/campeonatos/`), servido fora de `/api`. “Atual” continua `findFirst` por `createdAt` desc. Aba filha no admin + hero da home.

**Tech Stack:** NestJS 11, Prisma 7, Jest, Angular 21 (signals, Material), `FileInterceptor` (multer transitivo).

## Global Constraints

- Spec: `docs/superpowers/specs/2026-08-26-admin-organizacao-campeonatos-design.md`
- Um único campeonato com `status != ENCERRADO`
- Criar já nasce `INSCRICOES_ABERTAS`
- Iniciar **ou** primeiro sorteio → `EM_ANDAMENTO`
- Reabrir permitido com rodadas; novos inscritos nas próximas
- Finalizar: só confirmação, a partir de `INSCRICOES_ABERTAS` ou `EM_ANDAMENTO`
- `ENCERRADO` não edita, não muda status, não recebe banner
- Banner: JPEG/PNG/WebP, máx. 2 MB, path `/uploads/campeonatos/{id}{ext}`
- `inscricoesAbertasAte` e timer da home **não** entram
- Sem DELETE de campeonato
- Cwd dos testes Nest: `backend`. Front: raiz do repo

## File map

- Modify: `backend/prisma/schema.prisma` — `edicao`, `dataInicio`, `descricao`, `bannerUrl`
- Create: `backend/prisma/migrations/20260826220000_add_campeonato_campos_admin/migration.sql`
- Modify: `backend/prisma/seed.ts`
- Modify: `backend/precompeonato/dto/campeonato-atual-response.dto.ts`
- Modify: `backend/precompeonato/mappers/to-precompeonato-response.ts`
- Create: `backend/precompeonato/mappers/to-precompeonato-response.spec.ts`
- Create: `backend/precompeonato/dto/create-campeonato.dto.ts`
- Create: `backend/precompeonato/dto/update-campeonato.dto.ts`
- Create: `backend/precompeonato/dto/update-campeonato-status.dto.ts`
- Create: `backend/precompeonato/dto/campeonato-admin-response.dto.ts`
- Create: `backend/precompeonato/date-only.ts`
- Create: `backend/precompeonato/banner-storage.ts`
- Create: `backend/precompeonato/campeonato-admin.service.ts`
- Create: `backend/precompeonato/campeonato-admin.service.spec.ts`
- Modify: `backend/precompeonato/precompeonato.module.ts`
- Modify: `backend/precompeonato/precompeonato.controller.ts`
- Modify: `backend/main.ts` — `useStaticAssets`
- Modify: `backend/.gitignore`
- Create: `backend/uploads/campeonatos/.gitkeep`
- Modify: `src/app/core/config/api.config.ts` — `bannerSrc()`
- Modify: `src/app/core/admin/admin.models.ts`
- Modify: `src/app/core/admin/admin.service.ts`
- Create: `src/app/pages/admin/campeonato/admin-campeonatos.ts`
- Create: `src/app/pages/admin/campeonato/admin-campeonatos.html`
- Create: `src/app/pages/admin/campeonato/admin-campeonatos.scss`
- Modify: `src/app/pages/admin/campeonato/admin-campeonato.ts`
- Modify: `src/app/pages/admin/campeonato/admin-campeonato.html`
- Modify: `src/app/pages/precompeonato/precompeonato.ts`
- Modify: `src/app/pages/precompeonato/precompeonato.html`
- Modify: `src/app/pages/precompeonato/precompeonato.scss`

---

### Task 1: Schema, seed, mapper do GET atual

**Files:**
- Modify: `backend/prisma/schema.prisma`
- Create: `backend/prisma/migrations/20260826220000_add_campeonato_campos_admin/migration.sql`
- Modify: `backend/prisma/seed.ts`
- Modify: `backend/precompeonato/dto/campeonato-atual-response.dto.ts`
- Create: `backend/precompeonato/date-only.ts`
- Modify: `backend/precompeonato/mappers/to-precompeonato-response.ts`
- Test: `backend/precompeonato/mappers/to-precompeonato-response.spec.ts`

**Interfaces:**
- Consumes: model `Campeonato` existente
- Produces:
  - Campos Prisma: `edicao: string`, `dataInicio: DateTime @db.Date`, `descricao: string?`, `bannerUrl: string?`
  - `toDateOnly(d: Date): string` → `YYYY-MM-DD` via UTC (`getUTC*`)
  - `parseDateOnly(iso: string): Date` → `new Date(iso + 'T00:00:00.000Z')`
  - `CampeonatoAtualResponseDto` + `edicao`, `dataInicio` (string), `descricao: string | null`, `bannerUrl: string | null`
  - `toCampeonatoAtualResponse` devolve esses quatro campos sempre

- [ ] **Step 1: Write the failing mapper test**

```ts
import { CampeonatoStatus } from '@prisma/client';
import { toCampeonatoAtualResponse } from './to-precompeonato-response';

describe('toCampeonatoAtualResponse', () => {
  it('inclui edicao, dataInicio, descricao e bannerUrl', () => {
    const dto = toCampeonatoAtualResponse({
      id: 'c1',
      nome: 'Precompeonato #2',
      status: CampeonatoStatus.INSCRICOES_ABERTAS,
      inscricoesAbertasAte: null,
      edicao: '#2',
      dataInicio: new Date('2026-09-01T00:00:00.000Z'),
      descricao: 'Temporada 2',
      bannerUrl: '/uploads/campeonatos/c1.webp',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    expect(dto.edicao).toBe('#2');
    expect(dto.dataInicio).toBe('2026-09-01');
    expect(dto.descricao).toBe('Temporada 2');
    expect(dto.bannerUrl).toBe('/uploads/campeonatos/c1.webp');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run (cwd `backend`): `npm test -- --testPathPattern=to-precompeonato-response.spec`

Expected: FAIL — `edicao`/`dataInicio` não existem no DTO/mapper (e o objeto de teste nem compila contra o tipo Prisma atual).

- [ ] **Step 3: Schema + migration + seed + mapper**

Em `model Campeonato`:

```prisma
edicao     String
dataInicio DateTime  @db.Date
descricao  String?
bannerUrl  String?
```

`migration.sql`:

```sql
ALTER TABLE "campeonatos" ADD COLUMN "edicao" TEXT NOT NULL DEFAULT '#1';
ALTER TABLE "campeonatos" ADD COLUMN "dataInicio" DATE NOT NULL DEFAULT CURRENT_DATE;
ALTER TABLE "campeonatos" ADD COLUMN "descricao" TEXT;
ALTER TABLE "campeonatos" ADD COLUMN "bannerUrl" TEXT;
```

Seed, no `create`:

```ts
nome: 'Precompeonato #1',
edicao: '#1',
dataInicio: new Date('2026-01-01T00:00:00.000Z'),
status: CampeonatoStatus.INSCRICOES_ABERTAS,
```

`date-only.ts`:

```ts
export function toDateOnly(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseDateOnly(iso: string): Date {
  return new Date(`${iso}T00:00:00.000Z`);
}
```

Mapper: acrescentar os quatro campos; `dataInicio: toDateOnly(campeonato.dataInicio)`; `descricao`/`bannerUrl` como `null` se vazios.

DTO atual: quatro `@ApiProperty` / `@ApiPropertyOptional` nullable para descricao e banner.

Run: `npx prisma generate` (cwd `backend`).

- [ ] **Step 4: Run mapper test — expect PASS**

Run: `npm test -- --testPathPattern=to-precompeonato-response.spec`

- [ ] **Step 5: Commit**

```bash
git add backend/prisma/schema.prisma backend/prisma/migrations/20260826220000_add_campeonato_campos_admin backend/prisma/seed.ts backend/precompeonato/date-only.ts backend/precompeonato/dto/campeonato-atual-response.dto.ts backend/precompeonato/mappers/to-precompeonato-response.ts backend/precompeonato/mappers/to-precompeonato-response.spec.ts
git commit -m "feat: campos de edição, data, descrição e banner no campeonato"
```

---

### Task 2: Criar e listar (um não-encerrado)

**Files:**
- Create: `backend/precompeonato/dto/create-campeonato.dto.ts`
- Create: `backend/precompeonato/dto/campeonato-admin-response.dto.ts`
- Create: `backend/precompeonato/campeonato-admin.service.ts`
- Test: `backend/precompeonato/campeonato-admin.service.spec.ts`
- Modify: `backend/precompeonato/precompeonato.module.ts`

**Interfaces:**
- Consumes: `PrismaService`, `parseDateOnly`, `toDateOnly`, `CAMPEONATO_STATUS_LABEL`
- Produces:
  - `CampeonatoAdminResponseDto`: `{ id, nome, edicao, dataInicio: string, descricao: string | null, bannerUrl: string | null, status: string, statusCode: CampeonatoStatus, createdAt: string }`
  - `toAdminResponse(c: Campeonato): CampeonatoAdminResponseDto` (função no próprio service ou mapper)
  - `CampeonatoAdminService.list(): Promise<CampeonatoAdminResponseDto[]>` — `orderBy: { createdAt: 'desc' }`
  - `CampeonatoAdminService.create(dto: CreateCampeonatoDto): Promise<CampeonatoAdminResponseDto>`
  - `CreateCampeonatoDto`: `nome: string`, `edicao: string`, `dataInicio: string` (`@IsDateString()`), `descricao?: string`

- [ ] **Step 1: Write failing tests**

```ts
import { ConflictException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { CampeonatoStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CampeonatoAdminService } from './campeonato-admin.service';

function camp(over: Partial<{ id: string; status: CampeonatoStatus }> = {}) {
  return {
    id: over.id ?? 'c1',
    nome: 'Precompeonato #1',
    edicao: '#1',
    dataInicio: new Date('2026-09-01T00:00:00.000Z'),
    descricao: null,
    bannerUrl: null,
    status: over.status ?? CampeonatoStatus.INSCRICOES_ABERTAS,
    inscricoesAbertasAte: null,
    createdAt: new Date('2026-08-01T00:00:00.000Z'),
    updatedAt: new Date(),
  };
}

describe('CampeonatoAdminService create/list', () => {
  let service: CampeonatoAdminService;
  let prisma: {
    campeonato: { findFirst: jest.Mock; findMany: jest.Mock; create: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      campeonato: { findFirst: jest.fn(), findMany: jest.fn(), create: jest.fn() },
    };
    const module = await Test.createTestingModule({
      providers: [
        CampeonatoAdminService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get(CampeonatoAdminService);
  });

  it('create persiste edicao/dataInicio e nasce INSCRICOES_ABERTAS', async () => {
    prisma.campeonato.findFirst.mockResolvedValue(null);
    prisma.campeonato.create.mockResolvedValue(camp());

    const result = await service.create({
      nome: 'Precompeonato #1',
      edicao: '#1',
      dataInicio: '2026-09-01',
    });

    expect(prisma.campeonato.create).toHaveBeenCalledWith({
      data: {
        nome: 'Precompeonato #1',
        edicao: '#1',
        dataInicio: new Date('2026-09-01T00:00:00.000Z'),
        descricao: null,
        status: CampeonatoStatus.INSCRICOES_ABERTAS,
      },
    });
    expect(result.statusCode).toBe(CampeonatoStatus.INSCRICOES_ABERTAS);
    expect(result.dataInicio).toBe('2026-09-01');
  });

  it('create 409 se já existe INSCRICOES_ABERTAS', async () => {
    prisma.campeonato.findFirst.mockResolvedValue(camp({ status: CampeonatoStatus.INSCRICOES_ABERTAS }));
    await expect(
      service.create({ nome: 'X', edicao: '#2', dataInicio: '2026-10-01' }),
    ).rejects.toThrow(ConflictException);
    expect(prisma.campeonato.create).not.toHaveBeenCalled();
  });

  it('create 409 se já existe EM_ANDAMENTO', async () => {
    prisma.campeonato.findFirst.mockResolvedValue(camp({ status: CampeonatoStatus.EM_ANDAMENTO }));
    await expect(
      service.create({ nome: 'X', edicao: '#2', dataInicio: '2026-10-01' }),
    ).rejects.toThrow(ConflictException);
  });

  it('create ok quando o único existente está ENCERRADO', async () => {
    prisma.campeonato.findFirst.mockResolvedValue(null);
    prisma.campeonato.create.mockResolvedValue(camp({ id: 'c2' }));
    await expect(
      service.create({ nome: 'X', edicao: '#2', dataInicio: '2026-10-01' }),
    ).resolves.toMatchObject({ id: 'c2' });
  });

  it('list devolve createdAt desc', async () => {
    prisma.campeonato.findMany.mockResolvedValue([camp({ id: 'c2' }), camp({ id: 'c1' })]);
    const list = await service.list();
    expect(prisma.campeonato.findMany).toHaveBeenCalledWith({
      orderBy: { createdAt: 'desc' },
    });
    expect(list.map((c) => c.id)).toEqual(['c2', 'c1']);
  });
});
```

A checagem de “vivo” no create: `findFirst({ where: { status: { not: ENCERRADO } } })`. Se retornar registro → 409 `'Já existe um campeonato em andamento. Finalize-o antes de criar o próximo.'`. Se só há encerrados, `findFirst` com esse where devolve `null` — o teste “ok quando encerrado” mocka `null`.

- [ ] **Step 2: Run tests — expect FAIL**

Run: `npm test -- --testPathPattern=campeonato-admin.service.spec`

Expected: FAIL — `CampeonatoAdminService` não existe.

- [ ] **Step 3: Implement create/list**

`create-campeonato.dto.ts`: `@IsString()` + `@MinLength(1)` em `nome` e `edicao`; `@IsDateString()` em `dataInicio`; `@IsOptional()` `@IsString()` em `descricao`.

`toAdminResponse`: `status: CAMPEONATO_STATUS_LABEL[c.status]`, `createdAt: c.createdAt.toISOString()`, `dataInicio: toDateOnly(c.dataInicio)`, `descricao: c.descricao ?? null`, `bannerUrl: c.bannerUrl ?? null`.

Provider no `PrecompeonatoModule`.

- [ ] **Step 4: Run tests — expect PASS**

Run: `npm test -- --testPathPattern=campeonato-admin.service.spec`

- [ ] **Step 5: Commit**

```bash
git add backend/precompeonato/dto/create-campeonato.dto.ts backend/precompeonato/dto/campeonato-admin-response.dto.ts backend/precompeonato/campeonato-admin.service.ts backend/precompeonato/campeonato-admin.service.spec.ts backend/precompeonato/precompeonato.module.ts
git commit -m "feat: criar e listar campeonatos com regra de um ativo"
```

---

### Task 3: PATCH dados e PATCH status

**Files:**
- Create: `backend/precompeonato/dto/update-campeonato.dto.ts`
- Create: `backend/precompeonato/dto/update-campeonato-status.dto.ts`
- Modify: `backend/precompeonato/campeonato-admin.service.ts`
- Modify: `backend/precompeonato/campeonato-admin.service.spec.ts`

**Interfaces:**
- Consumes: `CampeonatoAdminService` da Task 2
- Produces:
  - `update(id: string, dto: UpdateCampeonatoDto): Promise<CampeonatoAdminResponseDto>`
  - `updateStatus(id: string, status: CampeonatoStatus): Promise<CampeonatoAdminResponseDto>`
  - `UpdateCampeonatoDto`: todos opcionais — `nome?`, `edicao?`, `dataInicio?`, `descricao?` (sem `status`, sem arquivo)
  - Transições:
    - `INSCRICOES_ABERTAS` → `EM_ANDAMENTO` | `ENCERRADO`
    - `EM_ANDAMENTO` → `INSCRICOES_ABERTAS` | `ENCERRADO`
    - `ENCERRADO` → nenhuma
  - 404 se id não existe; 409 se `ENCERRADO` no update de dados; 409 se transição inválida (`'Transição de status inválida.'`)

- [ ] **Step 1: Write failing tests** (acrescentar no spec da Task 2; expandir o mock `campeonato` com `findUnique` e `update`)

```ts
it('PATCH dados em aberto → 200', async () => {
  prisma.campeonato.findUnique.mockResolvedValue(camp());
  prisma.campeonato.update.mockResolvedValue({ ...camp(), nome: 'Novo' });
  const result = await service.update('c1', { nome: 'Novo' });
  expect(result.nome).toBe('Novo');
});

it('PATCH dados em ENCERRADO → 409', async () => {
  prisma.campeonato.findUnique.mockResolvedValue(camp({ status: CampeonatoStatus.ENCERRADO }));
  await expect(service.update('c1', { nome: 'X' })).rejects.toThrow(ConflictException);
});

it('INSCRICOES_ABERTAS → EM_ANDAMENTO', async () => {
  prisma.campeonato.findUnique.mockResolvedValue(camp());
  prisma.campeonato.update.mockResolvedValue(camp({ status: CampeonatoStatus.EM_ANDAMENTO }));
  const result = await service.updateStatus('c1', CampeonatoStatus.EM_ANDAMENTO);
  expect(result.statusCode).toBe(CampeonatoStatus.EM_ANDAMENTO);
});

it('EM_ANDAMENTO → INSCRICOES_ABERTAS (reabrir) mesmo sem checar rodadas', async () => {
  prisma.campeonato.findUnique.mockResolvedValue(camp({ status: CampeonatoStatus.EM_ANDAMENTO }));
  prisma.campeonato.update.mockResolvedValue(camp({ status: CampeonatoStatus.INSCRICOES_ABERTAS }));
  await expect(
    service.updateStatus('c1', CampeonatoStatus.INSCRICOES_ABERTAS),
  ).resolves.toMatchObject({ statusCode: CampeonatoStatus.INSCRICOES_ABERTAS });
});

it('finaliza a partir de INSCRICOES_ABERTAS e de EM_ANDAMENTO', async () => {
  prisma.campeonato.findUnique.mockResolvedValue(camp());
  prisma.campeonato.update.mockResolvedValue(camp({ status: CampeonatoStatus.ENCERRADO }));
  await expect(service.updateStatus('c1', CampeonatoStatus.ENCERRADO)).resolves.toMatchObject({
    statusCode: CampeonatoStatus.ENCERRADO,
  });

  prisma.campeonato.findUnique.mockResolvedValue(camp({ status: CampeonatoStatus.EM_ANDAMENTO }));
  await expect(service.updateStatus('c1', CampeonatoStatus.ENCERRADO)).resolves.toMatchObject({
    statusCode: CampeonatoStatus.ENCERRADO,
  });
});

it('ENCERRADO → qualquer status → 409', async () => {
  prisma.campeonato.findUnique.mockResolvedValue(camp({ status: CampeonatoStatus.ENCERRADO }));
  await expect(
    service.updateStatus('c1', CampeonatoStatus.INSCRICOES_ABERTAS),
  ).rejects.toThrow(ConflictException);
});

it('id inexistente → 404', async () => {
  prisma.campeonato.findUnique.mockResolvedValue(null);
  await expect(service.update('nope', { nome: 'X' })).rejects.toThrow(NotFoundException);
});
```

Não editar `sorteio.service.ts`. O `if (campeonato.status === CampeonatoStatus.INSCRICOES_ABERTAS)` dentro de `executeSorteio` permanece intacto.

- [ ] **Step 2: Run tests — expect FAIL**

Run: `npm test -- --testPathPattern=campeonato-admin.service.spec`

Expected: FAIL — `update` / `updateStatus` undefined.

- [ ] **Step 3: Implement**

```ts
const TRANSICOES: Record<CampeonatoStatus, CampeonatoStatus[]> = {
  INSCRICOES_ABERTAS: [CampeonatoStatus.EM_ANDAMENTO, CampeonatoStatus.ENCERRADO],
  EM_ANDAMENTO: [CampeonatoStatus.INSCRICOES_ABERTAS, CampeonatoStatus.ENCERRADO],
  ENCERRADO: [],
};
```

`findOrThrow(id)` → `findUnique` ou `NotFoundException('Campeonato não encontrado.')`.

`update`: se `status === ENCERRADO` → `ConflictException('Campeonato encerrado não pode ser editado.')`. Montar `data` só com campos definidos; `dataInicio` via `parseDateOnly`.

`updateStatus`: se `from === to` pode 409 também (não está na tabela). Se `!TRANSICOES[from].includes(to)` → 409.

- [ ] **Step 4: Run tests — expect PASS**

Run: `npm test -- --testPathPattern=campeonato-admin.service.spec`

- [ ] **Step 5: Commit**

```bash
git add backend/precompeonato/dto/update-campeonato.dto.ts backend/precompeonato/dto/update-campeonato-status.dto.ts backend/precompeonato/campeonato-admin.service.ts backend/precompeonato/campeonato-admin.service.spec.ts
git commit -m "feat: editar dados e ciclo de status do campeonato"
```

---

### Task 4: Banner + rotas HTTP + static files

**Files:**
- Create: `backend/precompeonato/banner-storage.ts`
- Create: `backend/precompeonato/banner-storage.spec.ts`
- Modify: `backend/precompeonato/campeonato-admin.service.ts`
- Modify: `backend/precompeonato/campeonato-admin.service.spec.ts`
- Modify: `backend/precompeonato/precompeonato.module.ts`
- Modify: `backend/precompeonato/precompeonato.controller.ts`
- Modify: `backend/main.ts`
- Modify: `backend/.gitignore`
- Create: `backend/uploads/campeonatos/.gitkeep`

**Interfaces:**
- Consumes: `CampeonatoAdminService` Tasks 2–3
- Produces:
  - `BannerStorage.save(campeonatoId: string, file: { mimetype: string; buffer: Buffer; size: number }): Promise<string>`
  - `CampeonatoAdminService.updateBanner(id: string, file: { mimetype: string; buffer: Buffer; size: number }): Promise<CampeonatoAdminResponseDto>`
  - MIME → ext: `image/jpeg`→`.jpg`, `image/png`→`.png`, `image/webp`→`.webp`
  - MIME inválido ou `size > 2 * 1024 * 1024` → `BadRequestException`
  - Encerrado → 409 (mesma mensagem de edição)
  - Path gravado: `/uploads/campeonatos/{id}{ext}`
  - Disco: `join(process.cwd(), 'uploads', 'campeonatos', id + ext)`; apagar as outras extensões do mesmo id antes de gravar
  - Rotas (todas `JwtAuthGuard`+`AdminGuard`, prefixo já é `precompeonato`):
    - `GET campeonatos` → `list()`
    - `POST campeonatos` → `create()` (201)
    - `PATCH campeonatos/:id` → `update()`
    - `PATCH campeonatos/:id/status` → `updateStatus(id, dto.status)`
    - `POST campeonatos/:id/banner` → `FileInterceptor('file')` + `updateBanner()`
  - `main.ts`: `NestFactory.create<NestExpressApplication>`; `app.useStaticAssets(join(__dirname, '..', 'uploads'), { prefix: '/uploads/' })` **depois** de `setGlobalPrefix('api')` (static fica fora de `/api`)

- [ ] **Step 1: Write failing banner tests**

Injetar `BannerStorage` mockado no spec:

```ts
const storage = { save: jest.fn() };

it('updateBanner grava path e recusa encerrado', async () => {
  prisma.campeonato.findUnique.mockResolvedValue(camp());
  storage.save.mockResolvedValue('/uploads/campeonatos/c1.webp');
  prisma.campeonato.update.mockResolvedValue({
    ...camp(),
    bannerUrl: '/uploads/campeonatos/c1.webp',
  });

  const file = { mimetype: 'image/webp', buffer: Buffer.from('x'), size: 10 };
  const result = await service.updateBanner('c1', file);
  expect(storage.save).toHaveBeenCalledWith('c1', file);
  expect(result.bannerUrl).toBe('/uploads/campeonatos/c1.webp');
});

it('updateBanner em ENCERRADO → 409 e não chama storage', async () => {
  prisma.campeonato.findUnique.mockResolvedValue(camp({ status: CampeonatoStatus.ENCERRADO }));
  await expect(
    service.updateBanner('c1', { mimetype: 'image/png', buffer: Buffer.from('x'), size: 10 }),
  ).rejects.toThrow(ConflictException);
  expect(storage.save).not.toHaveBeenCalled();
});
```

`banner-storage.spec.ts` (falha antes do `writeFile`, sem tocar disco):

```ts
it('rejeita MIME inválido e arquivo > 2MB', async () => {
  const s = new BannerStorage();
  await expect(
    s.save('c1', { mimetype: 'application/pdf', buffer: Buffer.from('x'), size: 10 }),
  ).rejects.toThrow(BadRequestException);
  await expect(
    s.save('c1', { mimetype: 'image/png', buffer: Buffer.alloc(1), size: 2 * 1024 * 1024 + 1 }),
  ).rejects.toThrow(BadRequestException);
});
```

- [ ] **Step 2: Run tests — expect FAIL**

Run: `npm test -- --testPathPattern=campeonato-admin.service.spec`

- [ ] **Step 3: Implement storage, service, controller, static, gitignore**

`.gitignore` do backend:

```
uploads/**
!uploads/campeonatos/
!uploads/campeonatos/.gitkeep
```

Controller: injetar `CampeonatoAdminService`. Banner:

```ts
@Post('campeonatos/:id/banner')
@UseGuards(JwtAuthGuard, AdminGuard)
@UseInterceptors(FileInterceptor('file'))
@ApiConsumes('multipart/form-data')
updateBanner(
  @Param('id') id: string,
  @UploadedFile() file?: { mimetype: string; buffer: Buffer; size: number },
) {
  if (!file) throw new BadRequestException('Envie o arquivo no campo file.');
  return this.campeonatoAdminService.updateBanner(id, file);
}
```

`UpdateCampeonatoStatusDto`: `@IsEnum(CampeonatoStatus) status`.

Registrar `CampeonatoAdminService` e `BannerStorage` no module.

- [ ] **Step 4: Run tests — expect PASS**

Run: `npm test -- --testPathPattern=campeonato-admin.service.spec`

Run: `npm test -- --testPathPattern=banner-storage.spec`

- [ ] **Step 5: Commit**

```bash
git add backend/precompeonato/banner-storage.ts backend/precompeonato/banner-storage.spec.ts backend/precompeonato/campeonato-admin.service.ts backend/precompeonato/campeonato-admin.service.spec.ts backend/precompeonato/precompeonato.module.ts backend/precompeonato/precompeonato.controller.ts backend/main.ts backend/.gitignore backend/uploads/campeonatos/.gitkeep
git commit -m "feat: upload de banner e rotas admin de campeonato"
```

---

### Task 5: Aba Campeonatos no admin

**Files:**
- Modify: `src/app/core/config/api.config.ts`
- Modify: `src/app/core/admin/admin.models.ts`
- Modify: `src/app/core/admin/admin.service.ts`
- Create: `src/app/pages/admin/campeonato/admin-campeonatos.ts`
- Create: `src/app/pages/admin/campeonato/admin-campeonatos.html`
- Create: `src/app/pages/admin/campeonato/admin-campeonatos.scss`
- Modify: `src/app/pages/admin/campeonato/admin-campeonato.ts`
- Modify: `src/app/pages/admin/campeonato/admin-campeonato.html`

**Interfaces:**
- Consumes: rotas da Task 4
- Produces:
  - `bannerSrc(path: string | null | undefined): string | null` em `api.config.ts`:
    - `null`/`''` → `null`
    - já `http` → devolve igual
    - localhost → `'http://localhost:3000' + path`
    - senão → `path` (mesmo host)
  - `CampeonatoAdmin`: `{ id, nome, edicao, dataInicio, descricao: string | null, bannerUrl: string | null, status, statusCode: 'INSCRICOES_ABERTAS' | 'EM_ANDAMENTO' | 'ENCERRADO', createdAt }`
  - `CreateCampeonatoPayload`: `{ nome, edicao, dataInicio, descricao?: string }`
  - `AdminService`: `listCampeonatos()`, `createCampeonato(payload)`, `updateCampeonato(id, payload)`, `updateCampeonatoStatus(id, status)`, `uploadCampeonatoBanner(id, file: File)`
  - `uploadCampeonatoBanner` usa `FormData` campo `file`, **sem** setar `Content-Type`
  - Componente `AdminCampeonatosComponent` (`app-admin-campeonatos`)
  - Aba **Campeonatos** depois de Inscritos; se a aba Resultados já existir no HTML, colocar depois dela
  - `podeCriar = !campeonatos.some(c => c.statusCode !== 'ENCERRADO')`

- [ ] **Step 1: Models + AdminService**

```ts
listCampeonatos(): Observable<CampeonatoAdmin[]> {
  return this.http.get<CampeonatoAdmin[]>(`${API_URL}/precompeonato/campeonatos`);
}
createCampeonato(payload: CreateCampeonatoPayload): Observable<CampeonatoAdmin> {
  return this.http.post<CampeonatoAdmin>(`${API_URL}/precompeonato/campeonatos`, payload);
}
updateCampeonato(id: string, payload: Partial<CreateCampeonatoPayload>): Observable<CampeonatoAdmin> {
  return this.http.patch<CampeonatoAdmin>(`${API_URL}/precompeonato/campeonatos/${id}`, payload);
}
updateCampeonatoStatus(id: string, status: CampeonatoAdmin['statusCode']): Observable<CampeonatoAdmin> {
  return this.http.patch<CampeonatoAdmin>(`${API_URL}/precompeonato/campeonatos/${id}/status`, { status });
}
uploadCampeonatoBanner(id: string, file: File): Observable<CampeonatoAdmin> {
  const body = new FormData();
  body.append('file', file);
  return this.http.post<CampeonatoAdmin>(`${API_URL}/precompeonato/campeonatos/${id}/banner`, body);
}
```

- [ ] **Step 2: Componente filho**

Signals: `campeonatos`, `loading`, `saving`, `formNome`, `formEdicao`, `formDataInicio`, `formDescricao`, `formBannerFile`.

`carregar()` → `listCampeonatos()`.

`criar()`: se `!podeCriar()` return; `createCampeonato` depois, se `formBannerFile()`, `uploadCampeonatoBanner`; snackbar; recarregar; limpar form.

Card não encerrado: inputs bound ao próprio item (cópia local no save) + botões:

- `INSCRICOES_ABERTAS` → **Iniciar** (`EM_ANDAMENTO`) e **Finalizar**
- `EM_ANDAMENTO` → **Reabrir inscrições** (`INSCRICOES_ABERTAS`) e **Finalizar**
- **Finalizar**: `confirm('Encerra o campeonato; só então será possível criar o próximo.')` antes do PATCH
- Encerrado: sem inputs, sem botões
- Erro HTTP: `snackBar.open(err?.error?.message || 'Erro.', 'Fechar', { duration: 5000 })`; no 409 de status, chamar `carregar()` de novo
- Preview do banner: `bannerSrc(c.bannerUrl)`

Reusar classes `.admin-section`, `.admin-section--card`, `.admin-alert--warn`, `.abrir-rodada-form` (import `../admin.scss` + o scss da aba pareamento se precisar). Form criar desabilitado + alerta “Finalize o campeonato atual para criar o próximo.” quando `!podeCriar()`.

- [ ] **Step 3: Encaixar a aba**

`admin-campeonato.ts` `imports: [..., AdminCampeonatosComponent]`.

No HTML, novo `mat-tab label="Campeonatos"` com `<app-admin-campeonatos />`.

- [ ] **Step 4: Build**

Run (cwd raiz `DiarioPlaninauta`): `npx ng build --configuration=development`

Expected: sucesso, sem erro de template no novo componente.

- [ ] **Step 5: Commit**

```bash
git add src/app/core/config/api.config.ts src/app/core/admin/admin.models.ts src/app/core/admin/admin.service.ts src/app/pages/admin/campeonato/admin-campeonatos.ts src/app/pages/admin/campeonato/admin-campeonatos.html src/app/pages/admin/campeonato/admin-campeonatos.scss src/app/pages/admin/campeonato/admin-campeonato.ts src/app/pages/admin/campeonato/admin-campeonato.html
git commit -m "feat: aba admin para criar, editar e ciclar campeonatos"
```

---

### Task 6: Home Precompeonato usa o campeonato atual

**Files:**
- Modify: `src/app/pages/precompeonato/precompeonato.ts`
- Modify: `src/app/pages/precompeonato/precompeonato.html`
- Modify: `src/app/pages/precompeonato/precompeonato.scss`

**Interfaces:**
- Consumes: `GET ${API_URL}/precompeonato/atual` → shape `CampeonatoAtualResponseDto` (campos da Task 1)
- Produces: hero com `nome`, `edicao`, `descricao`, `bannerSrc(bannerUrl)`; sem o título fixo “Commander League”
- 404: `campeonato` fica `null`, hero vazio (`Nenhum campeonato cadastrado.`), CTAs de inscrição/sorteio não disparam fluxo se `!campeonato`

- [ ] **Step 1: Fetch no componente**

Tipar localmente (não precisa de service novo):

```ts
interface CampeonatoAtual {
  id: string;
  nome: string;
  edicao: string;
  dataInicio: string;
  descricao: string | null;
  bannerUrl: string | null;
  status: string;
  statusCode: string;
}
```

`campeonato = signal<CampeonatoAtual | null>(null)`  
`campeonatoLoading = signal(true)`

Em `ngOnInit`, além do que já existe:

```ts
this.http.get<CampeonatoAtual>(`${API_URL}/precompeonato/atual`).subscribe({
  next: (c) => {
    this.campeonato.set(c);
    this.campeonatoLoading.set(false);
  },
  error: () => {
    this.campeonato.set(null);
    this.campeonatoLoading.set(false);
  },
});
```

Injetar `HttpClient`. `abrirInscricao()` retorna cedo se `campeonato()?.statusCode !== 'INSCRICOES_ABERTAS'` (a API já 409; isso evita o form órfão).

- [ ] **Step 2: Template do hero**

Substituir o `h1` “Commander League” e o subtítulo fixo:

```html
<section class="precompeonato-hero" aria-label="Campeonato">
  @if (campeonato(); as camp) {
    @if (bannerSrc(camp.bannerUrl); as src) {
      <img class="precompeonato-hero__banner" [src]="src" [alt]="camp.nome" />
    }
    <h1 class="precompeonato-hero__title">{{ camp.nome }}</h1>
    <p class="precompeonato-hero__subtitle">{{ camp.edicao }}</p>
    @if (camp.descricao) {
      <p class="precompeonato-hero__descricao">{{ camp.descricao }}</p>
    }
  } @else if (!campeonatoLoading()) {
    <h1 class="precompeonato-hero__title">Precompeonato</h1>
    <p class="precompeonato-hero__subtitle">Nenhum campeonato cadastrado.</p>
  }
  <!-- CTAs existentes permanecem -->
</section>
```

SCSS: `.precompeonato-hero__banner` max-width 100%, max-height 220px, object-fit cover, border-radius 12px.

Expor `bannerSrc` no componente: `protected readonly bannerSrc = bannerSrc;`

- [ ] **Step 3: Build**

Run: `npx ng build --configuration=development`

Expected: sucesso.

Verificação manual (não E2E): criar no admin com banner → home mostra nome/edição/arte; finalizar → home ainda mostra o encerrado; criar o próximo só depois; 404/banco vazio não quebra a página.

- [ ] **Step 4: Commit**

```bash
git add src/app/pages/precompeonato/precompeonato.ts src/app/pages/precompeonato/precompeonato.html src/app/pages/precompeonato/precompeonato.scss
git commit -m "feat: home do precompeonato exibe campeonato atual e banner"
```

---

## Spec coverage (self-review)

| Spec | Task |
|---|---|
| Campos `edicao`/`dataInicio`/`descricao`/`bannerUrl` + seed | 1 |
| `GET /atual` devolve os campos | 1 |
| Criar `INSCRICOES_ABERTAS` + 409 se vivo | 2 |
| Listar `createdAt` desc | 2 |
| Editar dados até encerrar | 3 |
| 4 transições de status + 409 inválido | 3 |
| Reabrir sem apagar rodadas (service não toca rodadas) | 3 |
| Finalizar dos dois status | 3 |
| Sorteio ainda promove status (`executeSorteio` intocado) | 3 |
| Banner MIME/size/path/overwrite + 409 encerrado | 4 |
| Rotas admin + static `/uploads` fora de `/api` | 4 |
| Aba admin criar/editar/ciclo/confirm | 5 |
| `bannerSrc` localhost vs prod | 5 |
| Home nome/edição/banner/descrição + 404 vazio | 6 |
| Sem timer, sem DELETE, sem S3 | (fora — nenhum task) |
