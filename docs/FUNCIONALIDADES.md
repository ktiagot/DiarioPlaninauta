# Diário Planinauta — Funcionalidades do Portal

Documento descritivo das features e módulos do portal, com detalhes de como cada parte funciona.

---

## Visão Geral

O **Diário Planinauta** é o portal web exclusivo para apoiadores do canal de YouTube homônimo, focado em Magic: The Gathering (formato Commander). O portal centraliza torneios, comunidade, mesas casuais e recompensas em um único ambiente.

**Acesso:** Apenas apoiadores ativos no APOIA.se conseguem fazer login.

**URL:** diarioplaninauta.com.br

---

## Módulos

### 1. Autenticação e Acesso

| Item | Detalhe |
|---|---|
| Método de login | Código de 6 dígitos enviado por email |
| Validação | API APOIA.se (`isBacker = true`) |
| Sessão | Token com validade de 30 dias |
| Tiers APOIA.se | R$5, R$15, R$25, R$35, R$80 |
| Tier mínimo portal | Qualquer (R$5+) |
| Tier mínimo Precompeonato | R$15+ |
| Ex-apoiador | Perde acesso ao login, dados permanecem no banco |

**Fluxo:**
1. Usuário acessa o portal → cai na landing page
2. Clica em "Entrar" → tela de login
3. Digita email → recebe código de 6 dígitos
4. Insere código → sistema valida na API APOIA.se → cria sessão
5. Redireciona para `index.html` (Precompeonato)

**Páginas:** `landing.html`, `login.html`

---

### 2. Precompeonato (Campeonato)

Torneio multiplayer de Commander com decks pré-montados oficiais (Precons) da Wizards of the Coast.

#### 2.1 Página principal (`index.html`)

- Exibe o campeonato mais recente/ativo
- Card com banner, nome, edição, status (inscrições abertas / em andamento)
- Timer de contagem regressiva (para fim de inscrições ou próxima rodada)
- Notificação visual quando rodada está a menos de 2 dias
- Botões rápidos: inscrever, ver regras, tabela, rodada
- Resumo das 2 últimas rodadas

#### 2.2 Inscrição (`inscricao.html`)

- Só aparece formulário se:
  - Está logado
  - É apoiador tier R$15+
  - Campeonato com inscrições abertas
  - Ainda não está inscrito
- Campos: nome, discord, whatsapp (obrigatórios) + deck precon (busca por nome)
- Escolha de comandante (principal, secundário ou partner)
- Validação automática contra API APOIA.se

#### 2.3 Rodadas (`rodadas.html`)

- Lista todas as rodadas do campeonato ativo
- Cada rodada mostra suas mesas com jogadores, decks e resultados
- Expande/colapsa rodadas anteriores
- Badges visuais: finalizada, em andamento, empate

#### 2.4 Ranking (`ranking.html`)

- Tabela classificatória com: posição, nome, campeonatos, pontos, vitórias, win rate
- Filtro por campeonato específico ou geral (todos)
- Busca por nome de jogador
- Top 3
- Link para perfil público de cada jogador

#### 2.5 Regras (`regras.html`)

- Regulamento completo: plataforma, inscrições, listas, partidas, horários, pontuação
- Regras de conduta no Spelltable
- Sistema de classificação (semifinais + final)
- Premiações com detalhes

#### 2.6 Pontuação

| Posição | Pontos |
|---|---|
| 1º lugar | 3 pontos |
| 2º lugar | 1 ponto |
| 3º e 4º | 0 pontos |
| Empate (todos vivos ao fim do tempo) | 1 ponto cada |

---

### 3. Perfil do Membro (`perfil.html`)

Página pessoal do usuário logado com todas as informações relevantes.

#### 3.1 Dados exibidos

**Coluna esquerda:**
- Avatar (imagem de criatura lendária do MTG via Scryfall)
- Formatos que joga (tags)
- Badge "Apoiando há X meses"

**Coluna direita:**
- Nickname + pronomes
- Nome real + telefone (visibilidade controlada)
- Cidade, formato favorito, dias disponíveis, horário
- Stats: partidas, vitórias, win rate, pontos totais
- Melhores resultados (top 3 posições)
- Precompeonatos participados
- Decks mais usados (com win rate)

#### 3.2 Editar perfil (modal)

Campos editáveis:
- Nickname, nome real, pronomes
- Cidade, estado
- WhatsApp, Discord
- Formato favorito, formatos (múltiplos)
- Dias disponíveis, horário
- Bio
- Avatar (busca de criatura lendária via API Scryfall → `art_crop`)

#### 3.3 Avatar via Scryfall

- Campo de busca no modal de edição
- Consulta: `https://api.scryfall.com/cards/search?q=<termo>+type:legendary+type:creature&unique=art`
- Exibe até 8 miniaturas da `art_crop`
- Usuário clica para selecionar → salva URL no perfil

#### 3.4 Minhas Mesas

- Lista das mesas do campeonato atual em que o jogador está
- Mostra jogadores, decks, resultado e vencedor
- Destaca o próprio jogador com cor laranja

#### 3.5 Privacidade

| Campo | Visibilidade |
|---|---|
| Nickname, pronomes, cidade, formatos, disponibilidade | Público |
| Telefone, nome real | Controlado (privado / amigos / público) |
| WhatsApp, Discord | Apenas favoritos mútuos |
| Email | Nunca exposto publicamente |

---

### 4. Comunidade (`comunidade.html`)

Página para descobrir e conectar com outros membros.

#### 4.1 Lista de jogadores

- Exibe apenas apoiadores ativos (com inscrição ativa no banco)
- Card com: avatar, nickname, pronomes, cidade, dias, horário, formatos, badge meses
- Busca por texto (nome ou cidade)

#### 4.2 Filtros

- **Localidade:** dropdown com cidades dos membros
- **Formato:** dropdown com formatos jogados
- **Disponibilidade:** dropdown com dias da semana

Filtros populados dinamicamente com valores reais dos membros.

#### 4.3 Favoritos

- Sistema unidirecional (tipo "seguir")
- Ícone de coração para favoritar/desfavoritar
- Botão "Ver contato" aparece quando você favorita alguém
- Contato (WhatsApp/Discord) só é revelado se o favorito é **mútuo** (ambos se favoritaram)

#### 4.4 Endpoint de contato mútuo

```
GET /api/jogadores/:email/contato
```
- Verifica se existe registro em ambas as direções na tabela `favoritos`
- Se mútuo: retorna {whatsapp, discord}
- Se não: retorna {mutuo: false}

---

### 5. Mesões — Mesas Casuais (`mesas-casuais.html`)

Sistema para organizar partidas casuais de Commander online. Funciona como vitrine/anúncio de mesas.

#### 5.1 Funcionalidades

| Ação | Quem pode |
|---|---|
| Ver mesas | Qualquer logado |
| Criar mesa | Qualquer logado |
| Adicionar link do jogo | Criador da mesa |

#### 5.2 Dados de uma mesa

- Título (ex: "Mesa casual sexta à noite")
- Descrição (formato, regras especiais)
- Data e hora
- Máximo de jogadores (2-6, padrão 4)
- Status: aberta, cheia, finalizada, cancelada
- Link do jogo (Spelltable/Discord) — adicionado pelo criador, visível para todos
- Lista de jogadores com deck/link

#### 5.3 Filtros

- Todas
- Abertas (vagas disponíveis)

#### 5.4 Formato

- Qualquer formato (não precisa ser precon)
- Formato é indicado pelo criador no título/descrição
- Não geram pontos

---

### 6. Estatísticas (`estatisticas.html`)

Dados analíticos do metagame e performance individual.

#### 6.1 Tab — Estatísticas Gerais

- Números gerais: partidas jogadas, jogadores, decks diferentes, rodadas
- Metagame: decks mais usados (com imagem do Scryfall, vezes usado, win rate)
- Top decks por win rate
- Matchups mais comuns (deck A vs deck B)
- Filtro por campeonato

#### 6.2 Tab — Minhas Estatísticas

- Requer login
- Resumo: partidas, vitórias, win rate, pontos
- Meus decks usados
- Performance por deck (partidas, vitórias, pontos)
- Matchups contra (vs cada deck oponente)
- Histórico de partidas (rodada, deck, posição, oponentes)

---

### 7. Loja de Pontos (`loja.html`)

Sistema de recompensas por participação. **Status: em hold — apenas visual ilustrativo no lançamento.**

O sistema de pontos e loja está implementado tecnicamente (tabelas no banco, endpoints funcionais), mas não será ativado no lançamento inicial.

#### 7.1 Como ganhar pontos (em planejamento)

| Atividade | Pontos |
|---|---|
| Jogar uma rodada | +5 |
| Vencer (1º lugar) | +10 |
| 2º lugar | +3 |
| Mesa casual | +2 |
| Perfil completo | +5 (bônus único) |

*Valores sujeitos a alteração antes da ativação.*

#### 7.2 Loja

- Exibe saldo do usuário (0 pontos por enquanto)
- Produtos com preço em pontos (inativos)
- Resgate cria registro pendente → admin aprova
- Será ativada em fase posterior

---

### 8. Landing Page (`landing.html`)

Página pública (sem login) para atrair novos apoiadores.

- Logo grande + tagline "A maior comunidade de card games do Brasil"
- O que é o Diário Planinauta (descrição do canal/comunidade)
- Benefícios de apoiar (6 cards: Precompeonato, Mesões, Comunidade, Commander ao Vivo, Análise de Deck, Papo Planinauta)
- Como funciona (3 passos: apoiar → login → acessar)
- CTA primário: "Quero Apoiar" → APOIA.se
- CTA secundário: "Já sou apoiador" → login

---

### 9. Admin (`admin.html`)

Painel restrito para administradores do campeonato. **Status: funcional, mas em revisão para o novo portal.**

#### 9.1 Tabs

| Tab | Funções |
|---|---|
| **Pareamento** | Gerar nova rodada, ver rodadas existentes, ver mesas |
| **Resultados** | Reportar 1º e 2º lugar de cada mesa |
| **Campeonatos** | Criar campeonato, mudar status (inscrições → em andamento → finalizado) |
| **Inscritos** | Ver lista completa de inscrições ativas |
| **Precons** | Cadastrar novos decks precon |
| **Emails** | Verificar apoiadores na API APOIA.se |

#### 9.2 Pareamento inteligente

- Usa algoritmo suíço adaptado para multiplayer (4 jogadores por mesa)
- Evita repetir oponentes (consulta `historico_oponentes`)
- Bloqueia geração se há mesas pendentes na rodada anterior

#### 9.3 Acesso

- Requer login + flag `is_admin = true`
- Admin definido na tabela `admins` do banco

---

### 10. Notificações

Sistema simples de avisos no portal.

#### 10.1 Notificação de rodada (implementado)

- Banner visual no `index.html`
- Aparece automaticamente quando próxima rodada está a menos de 2 dias
- Texto dinâmico: "Próxima rodada começa em X horas/dias!"
- Desaparece quando passa a data

#### 10.2 Futuro (não implementado)

- Notificação de resultado publicado
- Notificação de favorito mútuo
- Sistema de push notifications

---

## Integrações Externas

| Serviço | Uso | Endpoint |
|---|---|---|
| **APOIA.se** | Validar apoiador, verificar tier (valor pago) | `GET /backers/charges/:email` |
| **Scryfall** | Imagens de cartas (avatares, metagame) | `GET /cards/search` |
| **SMTP (Gmail)** | Enviar códigos de login por email | Nodemailer |

---

## Banco de Dados — Tabelas

| Tabela | Propósito |
|---|---|
| `membros` | Perfil estendido (nickname, cidade, formatos, disponibilidade...) |
| `inscricoes` | Inscrições em campeonatos (nome, deck, pontos, vitórias) |
| `campeonatos` | Campeonatos com status e datas |
| `rodadas` | Rodadas com data e campeonato |
| `mesas` | Mesas de cada rodada com vencedor |
| `mesa_jogadores` | Jogadores de cada mesa |
| `historico_partidas` | Detalhes de cada partida (posição, pontos, oponentes) |
| `historico_oponentes` | Quem enfrentou quem (para pareamento) |
| `precons` | Catálogo de decks precon |
| `precon_comandantes` | Comandantes de cada precon |
| `mesas_casuais` | Mesas casuais (título, data, link) |
| `mesa_casual_jogadores` | Participantes das mesas casuais |
| `favoritos` | Favoritos entre membros |
| `pontos` | Créditos/débitos de pontos |
| `loja_produtos` | Produtos da loja |
| `loja_resgates` | Resgates realizados |
| `admins` | Emails de administradores |
| `sessoes` | Tokens de sessão ativos |
| `codigos_verificacao` | Códigos de login temporários |

---

## Redes Sociais

| Plataforma | Link |
|---|---|
| YouTube | https://www.youtube.com/channel/UC75XFc_jbPOJXoaXcUFOCEg |
| Twitch | https://www.twitch.tv/diarioplaninauta |
| Instagram | https://www.instagram.com/diarioplaninauta/ |
| APOIA.se | https://apoia.se/diarioplaninauta |

---

## Arquitetura

```
┌─────────────────────────────────────────────────────┐
│                     NGINX                            │
│         diarioplaninauta.com.br (porta 80/443)      │
├──────────────────────┬──────────────────────────────┤
│                      │                              │
│   /api/*             │   tudo mais (/, *.html, etc) │
│   ↓                  │   ↓                          │
│   Node.js Express    │   Arquivos estáticos         │
│   (porta 3000)       │   /var/www/diarioplaninauta/ │
│   Backend (API)      │   Frontend (HTML/CSS/JS)     │
│                      │                              │
└──────────────────────┴──────────────────────────────┘
                       │
                       ↓
              ┌─────────────────┐
              │    MySQL 8      │
              │  (mesmo servidor│
              │   ou RDS)       │
              └─────────────────┘
```

**Repos:**
- `diarioplaninauta-frontend` → pasta `novo-site/`
- `diarioplaninauta-api` → pasta `backend/`
