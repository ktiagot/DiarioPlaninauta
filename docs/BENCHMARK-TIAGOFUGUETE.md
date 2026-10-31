# Benchmark — tiagofuguete.com.br

Análise das features do site **Tiago Fuguete** (torneios/decks/conteúdo de Magic focado em Pauper no MTG Online) para avaliar o que faz sentido trazermos para o Diário Planinauta.

> **Como foi levantado:** o site é uma SPA; as features abaixo foram extraídas das **rotas do bundle de produção** (`/assets/index-*.js`) e dos metadados do site. Alguns comportamentos internos são inferência a partir do nome da rota — marcados com "(inferido)". Não tivemos acesso ao backend deles.
>
> **Stack deles (observada):** SPA com SSR-bootstrap, armazenamento em **AWS S3** (`fuguete-championship-management`), e **Ably** no bundle (websockets / tempo real). Nicho idêntico ao nosso (MTG + torneios + apoiadores/conteúdo).

---

## Mapa de rotas do site deles

**Público / conteúdo**
`/` · `/landing` · `/landing-page` (+ `/blog`, `/parceiros`, `/sobre-mim`) · `/sobre-mim` · `/parceiros` · `/galeria` · `/privacidade` · `/termos-de-uso`

**Conteúdo editorial**
`/artigos` (+ `/:id`, `/novo`, `/:id/editar`, `/pendentes`) · `/blog` (+ `/:id`, `/novo`, `/:id/editar`, `/pendentes`, `/blog-legado`) · `/posts` (+ `/:id`)

**Comunidade / social**
`/comunidade` (+ `/:id`) · `/times` (+ `/:id`, `/criar`, `/:id/editar`) · `/hall-da-fama`

**Competitivo**
`/ligas` (+ `/:id`, `/criar`, `/:id/editar`) · `/metagame` (+ `/breakdown`, `/:formato/:slug`) · `/decks` (+ `/criar`, `/decks-fuguete`) · `/editar-deck/:id`

**Ferramentas**
`/ferramentas` · `/ferramentas/calculadora-swiss` · `/ferramentas/contador-vida`

**Conta**
`/esqueci-senha` · `/reset-senha` · `/newsletter/descadastrar`

**Admin (dashboard)**
`/dashboard` · `/players` · `/permissoes` · `/bloqueios` · `/hall-da-fama` · `/newsletter` · `/parceiros` (+ `/cliques`) · `/anuncios` · `/anuncio-diario` · `/slides-home`

---

## Features encontradas vs. o que já temos

Legenda: ✅ já temos · 🟡 temos parcial · ❌ não temos

| # | Feature deles | Nós | Observação |
|---|---------------|-----|------------|
| 1 | **Ligas** (criar/editar/listar ligas competitivas) | 🟡 | Temos precompeonato (campeonato único). Eles têm múltiplas ligas paralelas com CRUD. |
| 2 | **Times** (criar/editar/perfil de time) | ❌ | Jogadores agrupados em times; competição por equipe. |
| 3 | **Metagame + breakdown** (distribuição de decks/arquétipos) | 🟡 | Temos "metagame" nas estatísticas (decks mais usados). Eles têm página dedicada por formato/arquétipo. |
| 4 | **Repositório de decks** (criar/editar deck, "decks fuguete") | 🟡 | Guardamos só o link do deck na inscrição. Eles têm deck como entidade navegável. |
| 5 | **Calculadora Swiss** (ferramenta de pareamento suíço) | 🟡 | Nosso sorteio suíço é interno do admin. Eles expõem como ferramenta pública. |
| 6 | **Contador de vida** (life counter para partidas) | ❌ | Ferramenta utilitária standalone. |
| 7 | **Hall da Fama** (campeões/destaques históricos) | ❌ | Vitrine de campeões de temporadas anteriores. |
| 8 | **Blog / Artigos** (com fluxo editorial: rascunho → pendente → publicado) | ❌ | CMS de conteúdo com moderação (`/pendentes`). |
| 9 | **Newsletter** (cadastro/descadastro + envio pelo admin) | ❌ | Captura de email + disparo de boletim. |
| 10 | **Parceiros** (listagem + rastreio de cliques) | ❌ | Vitrine de patrocinadores com métrica de cliques. |
| 11 | **Galeria** (fotos de eventos) | ❌ | Álbum de imagens da comunidade. |
| 12 | **Slides da home** (carrossel gerenciável pelo admin) | 🟡 | Temos banner de campeonato. Eles têm carrossel editável. |
| 13 | **Anúncios / Anúncio diário** (banners/avisos administrados) | 🟡 | Temos notificações. Eles têm anúncios na home + "anúncio do dia". |
| 14 | **Permissões** (papéis além de admin/usuário) | 🟡 | Temos só `isAdmin`. Eles têm gestão de permissões granular. |
| 15 | **Bloqueios** (banir/suspender usuários) | 🟡 | Temos suspender inscrição por campeonato. Eles têm bloqueio de conta. |
| 16 | **Perfil de jogador público rico** (`/comunidade/:id`) | ✅ | Já temos perfil público. |
| 17 | **Recuperação de senha** (esqueci/reset) | ❌ | Não temos fluxo de reset por email (login é por código/APOIA.se). |
| 18 | **Tempo real (Ably)** — pareamentos/placar ao vivo (inferido) | ❌ | Websockets para atualização ao vivo (ex.: chaveamento, resultados). |
| 19 | **Páginas legais** (privacidade, termos) | 🟡 | Temos links; eles têm páginas próprias. |
| 20 | **"Sobre mim" / landing de criador** | 🟡 | Temos landing; eles têm seção dedicada do criador + parceiros. |

---

## O que vale a pena considerar (recomendação)

Agrupei por esforço × valor para o nosso contexto (comunidade de apoiadores + precompeonato de Commander).

### 🟢 Alto valor, baixo/médio esforço — fortes candidatos
- **Hall da Fama (#7).** Fecha o ciclo do campeonato: ao encerrar, registra o campeão. Reaproveita dados que já temos (posição/pontos). Dá sensação de história e engajamento. *Esforço: baixo.*
- **Recuperação de senha (#17).** Hoje quem cadastrou senha não tem como recuperar sozinho. Já temos SMTP e código por email no login — é reaproveitar o mesmo mecanismo. *Esforço: baixo. Lacuna real de UX.*
- **Deck como entidade (#4) + Metagame dedicado (#3).** Já guardamos o deck/comandante por inscrição. Dá para montar uma página de metagame mais rica (arquétipos, cores, comandantes mais jogados) sem muita coisa nova no backend. *Esforço: médio.*
- **Slides/anúncios gerenciáveis na home (#12/#13).** Você já tem o conceito de banner e de promo no perfil. Um carrossel/aviso editável pelo admin ajuda a comunicar eventos. *Esforço: médio.*

### 🟡 Valor médio — avaliar conforme a estratégia
- **Blog / Artigos com moderação (#8).** É um CMS inteiro (editor, rascunho, fila de pendentes, publicação). Alto valor se o canal quiser publicar conteúdo no portal, mas é um módulo grande. Alternativa barata: só linkar o conteúdo do YouTube/externo. *Esforço: alto.*
- **Newsletter (#9).** Captura de email + disparo. Você já tem os emails dos apoiadores; o disparo em massa exige cuidado (provedor de email, opt-out — a rota `/newsletter/descadastrar` deles mostra que trataram LGPD). *Esforço: médio-alto.*
- **Parceiros com cliques (#10).** Útil se houver patrocinadores. O rastreio de cliques é simples. *Esforço: baixo-médio, mas depende de ter parceiros.*
- **Times (#2) / Ligas múltiplas (#1).** Muda o modelo competitivo (hoje é campeonato individual único). Só faz sentido se você quiser competição por equipe ou várias ligas em paralelo. *Esforço: alto, mudança de domínio.*

### 🔵 Ferramentas utilitárias — nice-to-have
- **Contador de vida (#6).** Útil para quem joga presencial, mas o seu foco é MTG Online (onde o cliente já conta vida). Baixa prioridade pro seu caso.
- **Calculadora Swiss pública (#5).** Já temos o pareamento suíço internamente. Expor como ferramenta pública é marginal.
- **Galeria (#11).** Simples, mas baixo impacto sem um fluxo de fotos ativo.

### ⚪ Já coberto ou não aplicável
- Tempo real via Ably (#18): interessante para placar/chaveamento ao vivo, mas é infraestrutura nova (websockets). Avaliar só se houver demanda de "ao vivo".
- Permissões granulares (#14) e bloqueios de conta (#15): hoje `isAdmin` + suspensão por campeonato cobrem o essencial do seu tamanho.

---

## Sugestão de priorização (se topar seguir)
1. **Recuperação de senha** — tapa um buraco de UX real, esforço baixo.
2. **Hall da Fama** — engajamento alto reaproveitando dados existentes.
3. **Metagame/decks mais rico** — valoriza o que já coletamos nas inscrições.
4. **Slides/anúncios na home** — melhora a comunicação de eventos.
5. (Depois, conforme estratégia de conteúdo) Blog/Newsletter.

> Nada aqui foi implementado — é só o levantamento para você decidir o que entra no roadmap. Me diz quais itens topa e eu detalho o escopo de cada um antes de mexer em código.
