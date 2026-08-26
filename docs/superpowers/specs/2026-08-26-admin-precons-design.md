# Admin Precons — Design Spec

**Data:** 2026-08-26  
**Escopo:** Catálogo persistente de precons com CRUD admin, substituição do `PRECONS_MOCK`, vínculo FK às inscrições do Precompeonato e mesas casuais.

Continua a série de admin ([organização de campeonatos](./2026-08-26-admin-organizacao-campeonatos-design.md), [inscritos](./2026-08-26-admin-inscritos-design.md)).

## Decisões

- **Vínculo somente FK:** `Inscricao.preconId` + `Inscricao.preconComandanteId` — sem duplicar `deckNome`/`comandante` no banco.
- **Comandantes:** tabela `PreconComandante` (múltiplos por precon; jogador escolhe um na inscrição).
- **CRUD admin:** criar, listar, editar, banir/desbanir, excluir (409 se houver referências).
- **Mesas casuais:** `MesaJogador.preconId` + `preconComandanteId` opcionais ao criar mesa.

## Modelo de dados

```
Precon (id, nome, setNome, cores, ano, banido)
PreconComandante (id, preconId, comandante, ordem)

Inscricao: preconId, preconComandanteId (obrigatórios)
MesaJogador: preconId?, preconComandanteId? (opcionais)
```

Respostas da API continuam expondo `deckNome` e `comandante` derivados via JOIN (somente leitura).

## API

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/precons?busca=` | Público | Lista precons ativos |
| GET | `/precons/:id/comandantes` | Público | Comandantes do precon |
| GET | `/precons/admin` | Admin | Lista completa |
| POST | `/precons` | Admin | Cria precon + comandantes |
| PATCH | `/precons/:id` | Admin | Edita metadados/banido/comandantes |
| DELETE | `/precons/:id` | Admin | Remove se sem referências |

Inscrição: `POST /precompeonato/inscricoes` passa a exigir `preconId` e `preconComandanteId`.

Mesas: `POST /mesas` aceita `preconId` e `preconComandanteId` opcionais.

## Frontend

- Nova aba **Precons** em `/admin/campeonato` (`app-admin-precons`).
- Formulário de inscrição consome `GET /precons` e `GET /precons/:id/comandantes`.
- Mesões: seletor opcional de precon/comandante ao criar mesa.

## Migration

Migration `20260826230000_add_precons`:
- Cria tabelas e seed dos 5 precons do mock (Tarkir: Dragonstorm).
- Migra inscrições existentes por match de `deckNome`/`comandante`; cria precons legado para não mapeados.
- Remove colunas `deckNome` e `comandante` de `inscricoes`.

## Regras de integridade

- `banido=true` → não aparece em buscas públicas; inscrições existentes permanecem.
- DELETE com inscrições/mesas vinculadas → 409.
- Remover comandante em uso → 409.

## Fora de escopo

- Aba Emails (APOIA.se)
- Importação automática Scryfall/Wizards
