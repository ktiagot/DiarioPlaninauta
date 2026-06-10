# Pendências — Diário Planinauta (novo-site)

## 1. Mapeamento de Dados: Real vs Pendente

### ✅ Dados disponíveis e funcionando

| Campo exibido | Origem | Tabela/coluna |
|---|---|---|
| Nome/Nickname | `/api/perfil/:email` | `membros.nickname` (fallback: `inscricoes.nome`) |
| Email | `/api/auth/me` | `sessoes.email` |
| Pronomes | `/api/perfil/:email` | `membros.pronomes` |
| Nome real | `/api/perfil/:email` | `membros.nome_real` |
| WhatsApp/Telefone | `/api/perfil/:email` | `membros.whatsapp` / `membros.telefone` |
| Discord | `/api/perfil/:email` | `membros.discord` |
| Cidade | `/api/perfil/:email` | `membros.cidade` |
| Formato favorito | `/api/perfil/:email` | `membros.formato_favorito` |
| Formatos jogados | `/api/perfil/:email` | `membros.formatos` (JSON) |
| Dias disponíveis | `/api/perfil/:email` | `membros.dias_disponiveis` |
| Horário | `/api/perfil/:email` | `membros.horario` |
| Avatar | `/api/perfil/:email` | `membros.avatar_url` |
| Bio | `/api/perfil/:email` | `membros.bio` |
| Campeonatos participados | `/api/perfil/:email` | `inscricoes` JOIN `campeonatos` |
| Total partidas / vitórias / winrate / pontos | `/api/perfil/:email` | `historico_partidas` |
| Melhores resultados (posição) | `/api/perfil/:email` | posição calculada por campeonato |
| Decks mais usados + winrate | `/api/perfil/:email` | `historico_partidas` JOIN `precons` |
| Badge "Apoiando há X meses" | `/api/apoia/meu-status` | calculado via `MIN(inscricoes.created_at)` |
| Apoiador ativo (sim/não) | `/api/apoia/meu-status` | API APOIA.se `isBacker` |
| É admin | `/api/auth/me` | `admins.email` |
| Minhas mesas | `/api/minhas-mesas` | `mesa_jogadores` + `mesas` + `rodadas` |
| Favoritos | tabela `favoritos` | `favoritos.email_de` / `email_para` |
| Pontos (saldo) | tabela `pontos` | SUM por email |
| Produtos da loja | tabela `loja_produtos` | nome, preco_pontos, estoque |

### ⚠️ Campos que existem na tabela mas precisam de UI para preenchimento

Os membros migrados via SQL já têm `nickname`, `discord` e `whatsapp` preenchidos (vieram de `inscricoes`). Os demais campos estão NULL e precisam que o usuário preencha:

- pronomes, nome_real, cidade, estado, formato_favorito, formatos, dias_disponiveis, horario, avatar_url, bio

**Falta:** Tela de "Editar Perfil" no frontend (formulário que faz PUT em `/api/perfil`). Não foi criada ainda.

---

## 2. Endpoints — TODOS IMPLEMENTADOS ✅

| Endpoint | Método | Status |
|---|---|---|
| `/api/jogadores` | GET | ✅ Lista membros com filtros (busca, cidade, formato, disponibilidade) |
| `/api/favoritos` | GET | ✅ Lista favoritos do usuário logado |
| `/api/favoritos/:email` | POST | ✅ Adicionar favorito |
| `/api/favoritos/:email` | DELETE | ✅ Remover favorito |
| `/api/pontos` | GET | ✅ Saldo (créditos - débitos) do usuário |
| `/api/pontos/historico` | GET | ✅ Últimas 50 transações |
| `/api/pontos/creditar` | POST | ✅ Admin credita pontos manualmente |
| `/api/loja/produtos` | GET | ✅ Lista todos os produtos |
| `/api/loja/resgatar` | POST | ✅ Resgate com validação de saldo e estoque |
| `/api/perfil` | PUT | ✅ Salva todos os campos da tabela membros |
| `/api/perfil/:email` | GET | ✅ Retorna perfil da tabela membros + stats + campeonatos + decks |
| `/api/apoia/meu-status` | GET | ✅ Retorna `meses_apoiando` calculado |

---

## 3. Dúvidas de Regras de Negócio

1. **Filtros da Comunidade** — estão marcados como `🔒` no Figma. Qual critério para desbloquear? Opções:
   - Todos têm acesso (filtros abertos)
   - Apenas apoiadores com X meses
   - Apenas tier premium no APOIA.se

2. **Sistema de pontos** — Como ganhar pontos?
   - Sugestão: +5 por rodada jogada, +10 por vitória, +2 por mesa casual participada
   - Pontos expiram? Têm validade?
   - Admin pode creditar manualmente?

3. **Loja de Pontos** — Produtos estão cadastrados mas inativos (`ativo = 0`). Quando ativar? Resgate é aprovado automaticamente ou passa por admin?

4. **Perfil público vs privado** — Ao acessar perfil de outro jogador via ranking, o que mostrar?
   - `visibilidade_telefone` e `visibilidade_nome_real` controlam isso (valores: privado/amigos/publico)
   - Endpoint GET já retorna tudo — preciso filtrar no backend ou frontend?

5. **Comunidade** — Exibir apenas apoiadores ativos (`isBacker = true`) ou todos com registro em `membros`?

---

## 4. Páginas/Features do Frontend

| Feature | Arquivo | Status |
|---|---|---|
| Formulário "Editar Perfil" | `perfil.html` + `perfil.js` | ✅ Modal funcional com PUT /api/perfil |
| Comunidade com dados reais | `comunidade.js` | ✅ Busca de /api/jogadores + favoritos |
| Loja funcional | `loja.html` | ✅ Busca produtos, exibe saldo, resgate funcional |
| Upload de avatar | `perfil.html` | ⚠️ Campo aceita URL — upload direto não implementado |

---

## 5. Assets Necessários

| Asset | Onde | Status |
|---|---|---|
| `background.png` | Body background | ✅ Já existe |
| Logo LP SVG final | Header | ⚠️ Usando placeholder "LP" em quadrado |
| Favicon `.ico` ou `.svg` | `<link rel="icon">` | ❌ Falta |
| Banner campeonato | `index.html` card principal | ⚠️ Placeholder colorido |
| Fotos dos prêmios | `index.html` prizes-row | ⚠️ Emojis como placeholder |
| Banner LigaFest | `perfil.html` | ⚠️ Placeholder dashed |

---

## 6. Resumo: o que funciona AGORA

- ✅ Login (email + código via apoia.se)
- ✅ Perfil completo: nome, pronomes, cidade, formatos, dias, horário — busca da tabela `membros`
- ✅ Perfil: stats reais (partidas, vitórias, WR, pontos)
- ✅ Perfil: campeonatos participados + posição + decks mais usados
- ✅ Perfil: badge "Apoiando há X meses"
- ✅ Perfil: formulário "Editar Perfil" (modal com PUT /api/perfil)
- ✅ Perfil: minhas mesas do campeonato atual
- ✅ Index: timer, campeonato ativo, últimas rodadas
- ✅ Estatísticas: gerais + individuais
- ✅ Rodadas + ranking + inscrição + mesas casuais + regras
- ✅ Comunidade: lista real de jogadores com busca + favoritos
- ✅ Loja: exibe saldo, busca produtos, resgate funcional
- ✅ Todos os endpoints do portal implementados no server.js
- ✅ Tabelas novas no banco: membros, favoritos, pontos, loja_produtos, loja_resgates
- ⚠️ Loja: produtos cadastrados como inativos — ativar quando definir regras de pontos
- ⚠️ Upload de avatar: aceita URL no campo, não tem upload de arquivo
