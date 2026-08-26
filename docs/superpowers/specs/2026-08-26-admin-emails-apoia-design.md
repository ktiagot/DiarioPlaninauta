# Admin — E-mails / APOIA.se / Jogadores — Design Spec

**Data:** 2026-08-26  
**Escopo:** Listar todos os usuários cadastrados no portal e verificar status na API APOIA.se (individual ou em lote), persistindo flags no banco. UI em Admin > Comunidade.

Continua os itens anteriores de admin (pareamento, resultados, campeonatos, inscritos). Precons ficam fora.

## Decisão de produto

O admin precisa auditar quem está cadastrado no portal e cruzar com a APOIA.se — funcionalidade que existia no legacy (`admin.html` aba Emails) e ainda não tinha sido migrada para Nest + Angular.

| Decisão | Escolha |
|---|---|
| Persistência | Verificação atualiza `isApoiadorAtivo`, `isExApoiador`, `lastValidationAt`, `monthlyContribution`, `apoiandoDesde` |
| Critério "ativo" | `isBacker && isPaidThisMonth` — mesma regra do login |
| UI | Seção em **Admin > Comunidade**, abaixo dos KPIs e gráficos |

## API

Rotas no módulo `comunidade`, guards `JwtAuthGuard` + `AdminGuard`:

| Método | Rota | Efeito |
|---|---|---|
| GET | `/comunidade/admin/jogadores` | Lista todos os usuários, ordenados por `nome` |
| POST | `/comunidade/admin/apoia/verificar/:email` | Consulta APOIA.se + sincroniza banco |

Sem endpoint batch no servidor na v1 — o front faz loop com delay de 250 ms (~4 req/s).

### Resposta listagem (`JogadorAdminResponseDto`)

`id`, `email`, `nome`, `nick`, `isApoiadorAtivo`, `isExApoiador`, `lastValidationAt`, `monthlyContribution`

### Resposta verificação (`VerificarApoiaResponseDto`)

`email`, `ativo`, `isBacker`, `isPaidThisMonth`, `thisMonthPaidValue`, `apiIndisponivel`

Regras de sincronização:

- `ativo = isBacker && isPaidThisMonth`
- `isExApoiador = !isBacker`
- `apoiandoDesde` preenchido na primeira vez que `ativo` for true
- Erro da API APOIA.se (403/5xx): `apiIndisponivel: true`, banco **inalterado**
- E-mail inexistente no banco: 404

## Front

Seção **Jogadores do sistema** em `/admin/comunidade`:

| Coluna | Fonte |
|---|---|
| Nome | `nome` (+ `nick` subtítulo) |
| E-mail | `email` |
| Status | badge: Apoiador ativo / Ex-apoiador / Inativo / API indisponível |
| Última verificação | `lastValidationAt` ou "—" |
| Ação | botão "Verificar" |

- Cabeçalho com contador e botão **Verificar todos na APOIA.se**
- Rate limit client-side: 250 ms entre verificações em lote
- Após verificação: recarrega lista para refletir flags do banco

## Testes

Back (Jest): listagem, sync ativo, ex-apoiador, backer sem pagamento, API indisponível, `apoiandoDesde` preservado.

Front: verificação manual na seção Comunidade admin.

## Fora de escopo (v1)

- Busca/filtro na tabela
- Endpoint batch server-side
- Remoção de e-mails
- Precons
- Audit log de verificações
