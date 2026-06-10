# Plano de Migração — React SPA

Documento técnico para migração futura do frontend de HTML/CSS/JS puro para React com arquitetura de micro frontend.

---

## 1. Por que migrar

| Problema atual | Solução com React |
|---|---|
| HTML duplicado (header/footer em 13 arquivos) | Componentes reutilizáveis |
| Estado de auth espalhado em cada JS | Context/hook `useAuth` centralizado |
| Fetch repetido em cada página | React Query com cache automático |
| Navegação com reload completo | React Router (SPA, transições instantâneas) |
| Dificuldade de criar features interativas (chat, drag-and-drop, edição inline) | Estado reativo nativo |
| CSS sem escopo (conflitos potenciais) | CSS Modules ou Tailwind |

---

## 2. Stack recomendada

| Camada | Tecnologia | Justificativa |
|---|---|---|
| Framework | React 18+ | Ecossistema maduro, comunidade grande |
| Build | Vite | Rápido, HMR instantâneo, ESM nativo |
| Roteamento | React Router v6 | SPA com rotas lazy-loaded |
| Estado global | Zustand ou Context API | Leve, sem boilerplate |
| Data fetching | TanStack Query (React Query) | Cache, refetch, loading states automáticos |
| Estilo | Tailwind CSS | Utility-first, design system rápido, dark mode nativo |
| Forms | React Hook Form | Performance, validação |
| HTTP | Axios ou fetch wrapper | Interceptors para auth token |
| Testes | Vitest + Testing Library | Rápido, integrado com Vite |

---

## 3. Arquitetura — Micro Frontend

### 3.1 Quando usar Micro Frontend

Micro frontend faz sentido quando o projeto crescer para:
- Múltiplos times trabalhando em paralelo
- Features que precisam de deploy independente
- Módulos com ciclos de vida diferentes (ex: loja com equipe própria)

### 3.2 Estrutura proposta

```
diarioplaninauta/
├── apps/
│   ├── shell/                 ← App principal (layout, auth, router)
│   │   ├── src/
│   │   │   ├── App.tsx
│   │   │   ├── layout/       (Header, Footer, Nav, MobileMenu)
│   │   │   ├── auth/         (AuthContext, ProtectedRoute, LoginPage)
│   │   │   └── router.tsx    (lazy imports dos remotes)
│   │   └── vite.config.ts
│   │
│   ├── precompeonato/         ← Módulo do campeonato
│   │   ├── src/
│   │   │   ├── pages/        (Index, Rodadas, Ranking, Regras, Inscricao)
│   │   │   ├── components/   (TimerCard, RodadaItem, MesaCard)
│   │   │   └── hooks/        (useCampeonato, useRodadas)
│   │   └── vite.config.ts
│   │
│   ├── comunidade/            ← Módulo da comunidade
│   │   ├── src/
│   │   │   ├── pages/        (Comunidade, PerfilPublico)
│   │   │   ├── components/   (PlayerCard, FilterBar, AvatarPicker)
│   │   │   └── hooks/        (useJogadores, useFavoritos)
│   │   └── vite.config.ts
│   │
│   ├── perfil/                ← Módulo do perfil
│   │   ├── src/
│   │   │   ├── pages/        (MeuPerfil, EditarPerfil)
│   │   │   ├── components/   (StatsGrid, MinhasMesas, FormatosTag)
│   │   │   └── hooks/        (usePerfil, useApoia)
│   │   └── vite.config.ts
│   │
│   ├── mesoes/                ← Módulo de mesas casuais
│   │   ├── src/
│   │   │   ├── pages/        (MesasCasuais)
│   │   │   ├── components/   (MesaCasualCard, CriarMesaModal)
│   │   │   └── hooks/        (useMesas)
│   │   └── vite.config.ts
│   │
│   ├── loja/                  ← Módulo da loja (futuro)
│   │   └── ...
│   │
│   └── admin/                 ← Módulo admin
│       ├── src/
│       │   ├── pages/        (Dashboard, Pareamento, Resultados, Campeonatos)
│       │   ├── components/   (AdminTabs, MesaPendente, InscritoCard)
│       │   └── hooks/        (useAdmin)
│       └── vite.config.ts
│
├── packages/
│   ├── ui/                    ← Design system compartilhado
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   ├── Avatar.tsx
│   │   └── index.ts
│   │
│   ├── api/                   ← Cliente HTTP compartilhado
│   │   ├── client.ts          (axios instance com interceptors)
│   │   ├── auth.ts            (login, logout, me)
│   │   ├── perfil.ts          (getPerfil, updatePerfil)
│   │   ├── jogadores.ts       (listJogadores, getContato)
│   │   ├── campeonatos.ts     (getCampeonatos, getRodadas...)
│   │   └── index.ts
│   │
│   └── shared/                ← Tipos, constantes, utils
│       ├── types.ts           (User, Membro, Campeonato, Mesa...)
│       ├── constants.ts       (TIERS, PAGINAS_PROTEGIDAS...)
│       └── utils.ts           (formatDate, calcMeses...)
│
├── package.json               (workspaces)
├── turbo.json                 (Turborepo config)
└── README.md
```

### 3.3 Tecnologia de federação

| Opção | Prós | Contras |
|---|---|---|
| **Vite Module Federation** | Nativo no Vite, SSR ready | Plugin menos maduro |
| **Webpack Module Federation** | Mais maduro, battle-tested | Precisa webpack |
| **Single-SPA** | Framework-agnostic | Complexo, mais boilerplate |
| **Monorepo sem federação** | Simples, um build | Sem deploy independente |

**Recomendação para fase 1:** Monorepo com Turborepo, sem federação. Deploy é um bundle único. Quando precisar deploys independentes, adicionar Module Federation.

---

## 4. Plano de migração em fases

### Fase 1 — Setup e Shell (1 semana)

- [ ] Criar monorepo com Vite + React + TypeScript
- [ ] Implementar `shell`: layout (Header, Footer, Nav com redes sociais)
- [ ] Implementar auth (Context, hook `useAuth`, ProtectedRoute)
- [ ] Implementar React Router com lazy loading
- [ ] Portar `landing.html` → `LandingPage.tsx`
- [ ] Portar `login.html` → `LoginPage.tsx`
- [ ] Configurar Tailwind com o design system atual (dark theme, laranja #F58220, glassmorphism)
- [ ] Portar `styles.css` → classes Tailwind + CSS global mínimo

### Fase 2 — Precompeonato (1 semana)

- [ ] Portar `index.html` → `PrecompeonatoPage.tsx`
- [ ] Componentes: `TimerCard`, `RodadaItem`, `ChampionshipCard`
- [ ] Portar `rodadas.html` → `RodadasPage.tsx`
- [ ] Portar `ranking.html` → `RankingPage.tsx`
- [ ] Portar `regras.html` → `RegrasPage.tsx`
- [ ] Portar `inscricao.html` → `InscricaoPage.tsx`
- [ ] Hook `useCampeonato` com React Query

### Fase 3 — Perfil + Comunidade (1 semana)

- [ ] Portar `perfil.html` → `PerfilPage.tsx`
- [ ] Componentes: `AvatarPicker` (Scryfall), `StatsGrid`, `EditarPerfilModal`
- [ ] Portar `comunidade.html` → `ComunidadePage.tsx`
- [ ] Componentes: `PlayerCard`, `FilterBar`
- [ ] Hook `useFavoritos` (toggle, verificar mútuo)
- [ ] Hook `useScryfall` (busca de cartas)

### Fase 4 — Mesões + Loja + Admin (1 semana)

- [ ] Portar `mesas-casuais.html` → `MesoesPage.tsx`
- [ ] Componentes: `MesaCard`, `CriarMesaModal`
- [ ] Portar `loja.html` → `LojaPage.tsx`
- [ ] Portar `admin.html` → `AdminPage.tsx` com sub-rotas
- [ ] Componentes: `AdminTabs`, `PareamentoForm`, `ResultadoForm`

### Fase 5 — Polish + Deploy (3-5 dias)

- [ ] Animações (Framer Motion ou CSS transitions)
- [ ] Loading skeletons
- [ ] Error boundaries
- [ ] PWA (service worker, offline basic)
- [ ] SEO (React Helmet para meta tags)
- [ ] Build + deploy na VPS (nginx servindo o build, proxy para API)
- [ ] Testes unitários dos hooks principais

---

## 5. Mapeamento de componentes

| HTML atual | Componente React |
|---|---|
| Header (em cada .html) | `<Header />` |
| Footer com redes sociais | `<Footer />` |
| Nav + mobile menu | `<Navigation />` + `<MobileMenu />` |
| Card glassmorphism | `<Card />` |
| Botões primário/secundário | `<Button variant="primary\|secondary" />` |
| Badge apoiador | `<Badge type="apoiador" meses={17} />` |
| Timer countdown | `<CountdownTimer target={date} />` |
| Player card (comunidade) | `<PlayerCard player={data} />` |
| Modal editar perfil | `<EditProfileModal />` |
| Avatar picker (Scryfall) | `<AvatarPicker onSelect={fn} />` |
| Tabs | `<Tabs items={[...]} />` |
| Filtros comunidade | `<FilterBar filters={[...]} onChange={fn} />` |
| Mesa casual card | `<MesaCasualCard mesa={data} />` |
| Rodada item | `<RodadaItem rodada={data} />` |
| Ranking table | `<RankingTable data={[...]} />` |
| Stats grid (perfil) | `<StatsGrid stats={data} />` |
| Notificação rodada | `<RodadaNotification />` |

---

## 6. Hooks customizados

```typescript
// Auth
useAuth()        → { user, isLogado, isAdmin, login, logout, loading }

// Perfil
usePerfil(email) → { perfil, stats, campeonatos, decks, loading }
useApoia()       → { apoiador, meses, valorMensal, loading }

// Comunidade
useJogadores(filtros) → { jogadores, loading, refetch }
useFavoritos()        → { favoritados, toggle, isMutuo }

// Campeonato
useCampeonato()    → { ativo, status, loading }
useRodadas()       → { rodadas, proximaRodada, loading }
useRanking(campId) → { ranking, loading }

// Mesas
useMesasCasuais(filtro) → { mesas, criar, entrar, sair, loading }

// Loja
usePontos()    → { saldo, historico, loading }
useProdutos()  → { produtos, resgatar, loading }

// Scryfall
useScryfall(termo) → { cards, loading }
```

---

## 7. Deploy com React

### Opção A — Build estático + Express (mínima mudança)

```bash
# Build
cd apps/shell && npm run build

# O Express serve o dist/ como estático
app.use(express.static('dist'));
app.get('*', (req, res) => res.sendFile('dist/index.html')); // SPA fallback
```

### Opção B — Nginx + API separada (recomendado para produção)

```nginx
server {
    listen 80;
    server_name diarioplaninauta.com.br;

    root /var/www/diarioplaninauta/dist;
    index index.html;

    # SPA: todas as rotas caem no index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API para o Node
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
    }
}
```

---

## 8. Quando iniciar a migração

**Gatilhos para começar:**
- Site atual validado em produção com usuários reais (pelo menos 1 campeonato completo)
- Necessidade de features interativas complexas (chat, drag-and-drop, real-time)
- Time cresceu e precisa de melhor organização de código
- Performance de navegação está incomodando (muitos reloads)

**Não migrar se:**
- O site atual atende bem os usuários
- Não há time/tempo dedicado para a migração
- As features novas ainda são simples (mais páginas de conteúdo)

---

## 9. Estimativa de esforço

| Fase | Esforço | Complexidade |
|---|---|---|
| Setup + Shell + Auth | 5-7 dias | Média |
| Precompeonato (5 páginas) | 5-7 dias | Média |
| Perfil + Comunidade | 5-7 dias | Alta (Scryfall, favoritos mútuos) |
| Mesões + Loja + Admin | 5-7 dias | Média |
| Polish + Deploy | 3-5 dias | Baixa |
| **Total** | **~4-5 semanas** | — |

Com 1 dev full-time. Com 2 devs, ~2-3 semanas.

---

## 10. Riscos

| Risco | Mitigação |
|---|---|
| Migração introduz bugs | Manter site atual funcionando em paralelo até validar |
| SEO prejudicado (SPA) | React Helmet + prerender para landing page |
| Performance pior (bundle grande) | Code splitting por rota (lazy loading) |
| Perda de funcionalidade durante migração | Migrar página por página, não tudo de uma vez |
| Backend não suporta SPA routing | Configurar fallback no Express/Nginx |
