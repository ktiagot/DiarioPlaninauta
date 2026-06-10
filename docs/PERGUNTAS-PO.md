# Perguntas para o P.O. — Diário Planinauta

Documento com decisões pendentes sobre features e regras de negócio do portal.
Cada seção tem o contexto técnico atual e a pergunta para definição.

---

## 1. Tiers de Apoiador e Acesso

**Contexto:** A API do APOIA.se retorna `thisMonthPaidValue` (valor mensal pago). Conseguimos saber exatamente quanto cada pessoa paga. Isso permite criar níveis de acesso diferenciados.

**Perguntas:**

1.1. Quais são os tiers no APOIA.se? (Ex: R$5, R$15, R$35, R$50...)
R: 5, 15, 25, 35, 80

1.2. Qual o tier mínimo para ter acesso ao portal (login)?
- Qualquer apoiador ativo (`isBacker = true`)?
- Ou precisa ser a partir de determinado valor?
R: Qualquer apoiador

1.3. Qual tier dá acesso ao Precompeonato (inscrição no campeonato)?
R: 15

1.4. Existe um tier "premium" com benefícios extras no portal? Se sim, quais seriam os benefícios?
- Filtros da Comunidade desbloqueados?
- Mais pontos por atividade?
- Prioridade em mesas casuais?
- Badge diferenciada no perfil?
R: não

1.5. Um ex-apoiador (que cancelou) deve continuar tendo acesso ao portal? Ou perde tudo ao cancelar?
R: Perde acesso mas as informações ficam
---

## 2. Comunidade

**Contexto:** Página "Conhecer Jogadores" permite buscar membros por nome. Filtros (localidade, formato, disponibilidade, amigos) estão implementados mas marcados como 🔒.

**Perguntas:**

2.1. Os filtros devem ser abertos para todos ou exclusivos para algum tier?
R: Apenas apoiadores de qualquer tier

2.2. Quem aparece na lista de comunidade?
- Todos que fizeram login pelo menos uma vez?
- Apenas apoiadores ativos (pagos este mês)?
- Apenas quem preencheu o perfil?
R: Apenas apoiadores ativos

2.3. Informações de contato (WhatsApp, Discord) devem ser visíveis para outros membros? Ou apenas para "amigos" (favoritos mútuos)?
R: favoritos mútuos

2.4. O sistema de "favoritos" é bidirecional (tipo amizade que precisa aceitar) ou unidirecional (tipo seguir)?
R: Unidirecional, porém para as informações sensíveis (whats e discord) aparecerem tem que ser mútuo

2.5. Deve ter alguma funcionalidade de "convidar para mesa" direto da comunidade?
R: Não

---

## 3. Sistema de Pontos

**Contexto:** Tabelas de pontos e loja já existem no banco. Falta definir as regras de como os pontos são creditados.

**Perguntas:**
3.1. Quanto vale cada atividade?
- Jogar uma rodada do Precompeonato: ___ pontos
- Vencer uma rodada (1º lugar): ___ pontos
- 2º lugar: ___ pontos
- Participar de uma mesa casual: ___ pontos
- Preencher o perfil completo: ___ pontos (bônus único?)
- Apoiar por X meses consecutivos: ___ pontos
3.2. Os pontos expiram? (Ex: pontos não usados em 12 meses são perdidos)
3.3. Admin pode creditar/debitar pontos manualmente? (Já implementado, só confirmar.)
3.4. Os pontos devem ser retroativos? (Ex: dar pontos pelas rodadas do campeonato atual que já aconteceram)

R: Sistema de pontos por enquanto apenas ilustrativo
---

## 4. Loja de Pontos

**Contexto:** 5 produtos mockados no banco (sleeve, deckbox, camisa, crédito Citadel, marcador). Todos inativos. Sistema de resgate funciona (valida saldo, decrementa estoque, registra).

**Perguntas:**

4.1. Quais produtos reais vão estar na loja? Confirmar lista e preços em pontos.
4.2. O resgate é automático ou passa por aprovação do admin?
- Atual: cria registro com status "pendente" → admin aprova → muda para "entregue"
- Alternativa: resgate imediato sem aprovação
4.3. Quem paga o frete de produtos físicos? O resgate desconta pontos extras de frete, ou é responsabilidade do jogador separadamente?
4.4. Deve ter limite de resgates por pessoa/mês?
4.5. Quando ativar a loja? Junto com o lançamento do novo site ou em fase posterior?

R: Loja de pontos por enquanto apenas ilustrativo
---

## 5. Perfil

**Contexto:** Perfil tem campos de nickname, pronomes, cidade, formatos, disponibilidade, horário, decks, stats. Formulário de edição funcional.

**Perguntas:**

5.1. O perfil tem uma versão "pública" (quando outro membro vê pelo ranking/comunidade). O que deve ser visível publicamente vs. privado?
- Proposta atual: nome, pronomes, cidade, formatos, disponibilidade → público. Telefone e nome real → controlados por privacidade (privado/amigos/público).
R: proposta atual serve

5.2. Deve existir a opção de "perfil oculto" (não aparecer na comunidade)?
R: Não

5.3. Avatar: aceitar upload de imagem ou apenas URL externa? Upload exige armazenamento (storage).
R: Não, deverão ser imagens disponibilizadas de criaturas lendárias do magic the gathering, talvez usar api do scryfall pra isso, pra buscar por nome de carta, e usar a função da api do scryfall art_crop do Card Imagery

5.4. Campos obrigatórios para participar do Precompeonato: o que o jogador DEVE preencher antes de se inscrever?
- Nome? Discord? Cidade?
R: Nome, discord e whatsapp

---

## 6. Precompeonato

**Contexto:** Sistema completo: inscrição, pareamento, rodadas, resultados, ranking, regras. Tudo funcional e migrado.

**Perguntas:**

6.1. A página do Precompeonato no novo site deve mostrar todos os campeonatos passados (histórico)? Ou apenas o campeonato ativo/mais recente?
R: sempre o mais recente atual, o passado fica em estatísticas pra consultar

6.2. Deve ter uma seção de "Hall da Fama" (campeões de cada edição)?
R: Por enquanto não

6.3. Inscrição: manter o fluxo de "escolher deck precon" na hora da inscrição? Ou permitir que o jogador mude de deck até o início da rodada 1?
R: apenas precon

6.4. O banner/arte do campeonato é fornecido manualmente (upload pelo admin) ou gerado automaticamente?
R: fornecido manualmente

---

## 7. Mesões (Mesas Casuais)

**Contexto:** Sistema funciona: criar mesa, entrar, sair, link do jogo, cancelar. Protegido para logados.

**Perguntas:**

7.1. Mesas casuais geram pontos? Se sim, como confirmar que a mesa realmente aconteceu?
- Auto-confirmação pelo criador?
- Todos os jogadores precisam confirmar?
R: não geram pontos

7.2. Deve existir um sistema de "convite" (convidar alguém para sua mesa)?
R: deve só disponibilizar um link no cadastro da mesa pra ficar visível pra quem entrou na mesa

7.3. Limite de mesas que uma pessoa pode criar por semana?
R: sem limite

7.4. Mesas casuais aceitam qualquer formato (não só precon)?
R: sim, mas não tem informação que precise especificar, o usuário geralmente vai usar no nome

---

## 8. Página Inicial / Login

**Contexto:** Atualmente, quem não está logado cai direto no `login.html`. O portal é fechado (só apoiadores).

**Perguntas:**

8.1. Deve existir uma "landing page" pública (antes do login) explicando o que é o Diário Planinauta e convidando a apoiar? Ou o login com "Vem pro apoia.se!" é suficiente?
R: podemos fazer uma landing page na verdade, e com botão pra login no header e no final da página, a landing page pode ser sobre o apoia-se e como funciona

8.2. Após login, para onde redirecionar?
- Atualmente: vai para `index.html` (Precompeonato)
- Alternativa: ir para o perfil? Para um "dashboard" com resumo?
R: index.html mesmo

8.3. Sessão expira em quantos dias? (Atualmente: 7 dias)
R: 30 dias

---

## 9. Notificações e Comunicação

**Contexto:** Não existe sistema de notificações no site. Comunicação é feita por Discord e WhatsApp.

**Perguntas:**

9.1. Quer um sistema de notificações no site? (Ex: "Nova rodada disponível", "Resultado da sua mesa foi publicado", "Alguém te favoritou")
R: Sim, por enquanto apenas de rodadas

9.2. Quer integração com Discord (bot que posta resultados automaticamente)?
R: Por enquanto não

9.3. Email de lembrete quando a rodada está chegando?
R: Por enquanto não

---

## 10. Conteúdo e Marca

**Perguntas:**

10.1. O nome do portal é definitivamente "Diário Planinauta"? O domínio será diferente de `precompeonato.com.br`?
R: Sim, será Diário Planinauta e o site diarioplaninauta.com.br

10.2. Precisa de link para o canal do YouTube em algum lugar do portal?
R: sim, deixe um ícone de redes sociais para os seguintes portais:
https://www.youtube.com/channel/UC75XFc_jbPOJXoaXcUFOCEg
https://www.twitch.tv/diarioplaninauta
https://www.instagram.com/diarioplaninauta/

10.3. Seção de "últimos vídeos" ou integração com YouTube na home?
R: não

10.4. O footer lateral (texto rotacionado) deve permanecer ou prefere footer convencional na base?
R: Convencional

---

## 11. Admin

**Contexto:** Painel admin com: pareamento de rodadas, resultados, gerenciar campeonatos, inscritos, precons, emails.

**Perguntas:**

11.1. O admin precisa poder gerenciar a Loja (ativar/desativar produtos, ajustar preços)?
R: loja pausada por enquanto

11.2. O admin precisa ver/gerenciar perfis de membros? (Ex: banir alguém, editar dados)
R: pode suspender alguém de um campeonato

11.3. Dashboard do admin com métricas? (Quantos membros ativos, quantos pagaram este mês, saldo total de pontos na plataforma)
R: sim

---

## Resumo de Decisões Imediatas (bloqueantes para lançamento)

| # | Decisão | Impacto |
|---|---|---|
| 1.2 | Tier mínimo de acesso | Define quem entra no portal |
| 2.2 | Quem aparece na comunidade | Define a query de listagem |
| 3.1 | Tabela de pontos por atividade | Define quando creditar |
| 4.5 | Quando ativar a loja | Define se lança junto ou depois |
| 5.1 | Visibilidade do perfil público | Define o que expor na API |
| 8.1 | Landing page ou direto pro login | Define a primeira impressão |
| 10.1 | Domínio final | Deploy e configurações |
