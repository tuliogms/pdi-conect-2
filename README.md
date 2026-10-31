# PDI Interativo

Aplicação web do **Plano de Desenvolvimento Individual (PDI)** colaborativo: o educando conta
sobre si, a equipe da escola contribui por área e o plano se consolida em um documento único,
pronto para imprimir.

Projeto ligado ao **ProfEi — Mestrado em Educação Inclusiva (UEMG)**.

## Para que serve

| Quem entra | O que faz |
| --- | --- |
| **Educando** | Responde as seis seções sobre si — texto, áudio, prancha de comunicação ou perguntas guiadas — e acompanha o próprio plano |
| **Professor** | Registra identificação, observações pedagógicas, potencialidades, barreiras, estratégias, adaptações, objetivos e acompanhamento |
| **Professor de AEE** | Registra necessidades específicas, recursos de acessibilidade, estratégias do AEE, habilidades em desenvolvimento e recomendações |
| **Família** | Conta rotina, interesses, comunicação, autonomia e expectativas; **autoriza (e pode revogar)** o compartilhamento com os profissionais de apoio |
| **Profissionais de Apoio** | Registram identificação profissional, observações, potencialidades, necessidades de apoio, recomendações e acompanhamento — lendo apenas o que a família autorizou |
| **Usuário Mestre** | Cadastra educandos e usuários, define permissões, adapta perguntas e pranchas, administra versões e imprime os consolidados |

Todas as áreas escrevem no **mesmo** PDI. O documento final mostra o que cada pessoa registrou,
com autor e data.

## Como rodar

```bash
pnpm install
cp .env.example .env.local     # DATABASE_URL é opcional para navegar
pnpm dev                       # http://localhost:3000
```

```bash
pnpm dev        # servidor de desenvolvimento
pnpm build      # build de produção (valida os tipos)
pnpm start      # serve o build
pnpm typecheck  # tsc --noEmit
pnpm test       # as quatro suítes automáticas (203 verificações)
pnpm test:banco # ponta a ponta contra o banco (precisa do dev + DATABASE_URL)
```

Para um banco local de desenvolvimento, sem instalar PostgreSQL:

```bash
pnpm add -D @electric-sql/pglite @electric-sql/pglite-socket
node scripts/banco-local.mjs          # Postgres em 127.0.0.1:5432, dados em ./.pdi-db
```

### Onde os dados ficam

O sistema começa **vazio**: nenhum educando, usuário ou resposta de exemplo.

- **Com `DATABASE_URL`**: configuração e respostas vão para o PostgreSQL e ficam iguais para
  toda a equipe.
- **Sem `DATABASE_URL`**: as rotas respondem `503` e o app grava no navegador (modo local). A
  barra lateral mostra em qual modo você está e nada se perde ao recarregar a página.

```bash
createdb pdi_conect
psql "postgresql://usuario:senha@localhost:5432/pdi_conect" -f db/init.sql
# depois aponte DATABASE_URL no .env.local e reinicie o pnpm dev
```

O `db/init.sql` cria apenas a estrutura (`pdi_workspaces`, `pdi_entries`, `pdi_config`) — nenhum
registro de exemplo. Se `DATABASE_URL` apontar para um banco sem essas tabelas, as rotas respondem
`503` com a mensagem do erro e o app continua funcionando no modo local.

> **No ambiente de preview deste projeto** já existe um banco Postgres local (PGlite falando o
> protocolo do Postgres) com as tabelas criadas e o `.env.local` apontando para ele — por isso a
> barra lateral mostra “Os dados estão sendo gravados no banco de dados”. Para produção/TCC, troque
> o `DATABASE_URL` por um Postgres de verdade (local, Supabase, Neon, RDS…).

### Primeiros passos (10 minutos)

1. Abra `/login` e entre como **Usuário Mestre**.
2. Cadastre o educando em **Educandos** e a equipe em **Usuários** (escolhendo o perfil e o
   educando vinculado). O sistema começa vazio: nada de exemplo é criado.
3. Em **Campos e formulários**, adapte as perguntas de cada área e as perguntas norteadoras do
   educando (a ordem vira a ordem do PDF).
4. Em **Pranchas de comunicação**, ajuste os símbolos usados nas respostas (cada um tem imagem e
   nome escrito).
5. Em **Permissões de acesso**, escolha quem pode visualizar, comentar ou editar cada área.
6. Em **Planos de PDI**, cada perfil entra na sua aba; a família registra a **autorização de
   compartilhamento** na aba Família. Em **PDI consolidado**, toque em **Gerar PDF**.
7. Antes de convidar as famílias, **Configurações → Apagar todos os dados** limpa o teste.

## Rotas

| Rota | Descrição |
| --- | --- |
| `/` | Abertura animada “Pingo Saltitante” e entrada no login |
| `/login` | Escolha do perfil de acesso |
| `/dashboard?perfil=<perfil>` | Área de cada pessoa (gestor vê o painel administrativo) |
| `/api/pdi?estudante=<uuid>` | `GET`/`POST` das respostas do PDI de um educando (o parâmetro mantém o nome histórico da API) |
| `/api/config` | `GET`/`POST` da configuração da escola |

O perfil é resolvido no servidor e aceita apelidos na URL (`aluno`, `AEE`, `mestre`,
`profissional da saude`…), normalizados em `lib/perfis.ts`.

## As abas, uma por uma

O PDI é uma **área por aba**. Quem entra vê a sua aba já aberta; o Usuário Mestre vê todas.

### Gestor (11 abas)

| Aba | O que tem |
| --- | --- |
| **Visão geral** | Educandos, usuários, convites pendentes, permissões e campos; atalhos e histórico de alterações |
| **Usuários** | Busca e filtros por perfil/status; cadastrar, editar, ativar/desativar e remover; vínculo com o educando; e-mail repetido barrado |
| **Educandos** | Cartões com turma, escola, equipe e progresso; cadastrar, editar, remover (com confirmação); atalho para abrir o PDI |
| **Planos de PDI** | Escolha do educando e o PDI completo em abas (Educando, Professor, AEE, Família, Profissionais de Apoio) |
| **PDI consolidado** | Documento único com a situação de cada área, o que o educando conta, as contribuições **com autor e data**, evolução, próximos passos e histórico de versões; **Gerar PDF** |
| **Versões do PDI** | Histórico de tudo o que foi salvo (educando, quando, autor, área e o que mudou), com **relatório em CSV** |
| **Permissões de acesso** | Matriz pessoa × área (Educando, Professor, AEE, Família, Profissionais de Apoio) com `Padrão / Editar / Comentar / Visualizar / Sem acesso` |
| **Campos e formulários** | Abas por área e por seção; adicionar, editar, **reordenar** (↑ ↓) e remover campos; tipo texto/lista/prancha; o que os outros perfis podem fazer; **perguntas norteadoras do educando** configuráveis |
| **Pranchas de comunicação** | Criar/renomear/remover pranchas, adicionar e remover símbolos (imagem + nome escrito) |
| **Acompanhamento** | Indicadores com gráfico, **registros descritivos por período**, próximos passos e relatório em CSV |
| **Configurações** | Identidade institucional (nome, escola, logo), onde os dados ficam, backup JSON, apagar tudo e histórico administrativo |

### Participante (7 abas)

| Aba | O que tem |
| --- | --- |
| **Início** | Saudação, situação do PDI, fluxo das áreas e próximos passos |
| **Meus alunos** (professor/AEE) | Cartões com situação do PDI, etapas concluídas, chips de potencialidades e busca |
| **Meu PDI** | As cinco abas de área; a pessoa cai na própria área (o educando nas seis seções, o professor nas oito, o AEE nas nove, a família nas dez, os profissionais de apoio nas seis) |
| **PDI consolidado** | O documento final, com **Gerar PDF** e o histórico de versões |
| **Acompanhamento** | Registros por período, evolução, gráfico e próximos passos, restritos aos educandos da pessoa |
| **Acessibilidade** | Leitura em voz alta, velocidade, ditado, alto contraste, botões grandes e instruções de TalkBack/VoiceOver |
| **Configurações** | Sua conta e vínculo, modo de armazenamento, backup |

### Dentro de cada área do PDI

- **Seções fixas**: o educando tem 6 seções (Meu perfil, Meus interesses, Como aprendo melhor,
  Facilidades e dificuldades, Meus objetivos, Meu desenvolvimento); o professor 8; o AEE 9; a
  família 10; os profissionais de apoio 6. A escola **não cria nem remove seções** — configura as
  perguntas dentro delas.
- **Respostas**: texto, **áudio gravado**, **prancha de comunicação** (símbolo → frase, seleção
  única ou múltipla) e ditado por voz. Toda pergunta tem “Ouvir” para leitor de tela e TTS.
- **Autoria**: cada resposta mostra quem escreveu e quando; comentários ficam separados da
  resposta e não a sobrescrevem.
- **Autorização da família**: a família autoriza (e pode revogar) o compartilhamento com os
  Profissionais de Apoio, escolhendo **quais áreas** liberar. É uma regra de acesso, não um aviso:
  sem autorização, o profissional só escreve na própria área.
- **Versões**: cada resposta salva entra no histórico do PDI com autor, data e área.

## Como o portfólio aparece no app

| Portfólio | Onde está |
| --- | --- |
| 1. Login com UEMG + ProfEi | `/login` (logos no cartão e na coluna verde) |
| 2. Fluxo educando → professor → AEE → família → apoio → consolidado | bloco **Como está o PDI** (Início), abas do PDI e *Situação de cada área* no consolidado |
| 3. Seis seções fixas do educando com Descritivo/Perguntas | **Meu PDI** → aba *Educando*; perguntas em **Campos e formulários** |
| 4. Acessibilidade (TTS, STT, áudio, contraste, botões grandes, pranchas) | aba **Acessibilidade**, botões “Ouvir”, “Dar ditado”, “Responder em áudio” e “Prancha de comunicação” |
| 5. Área do professor (8 seções) | aba *Professor* |
| 6. Área do AEE (9 seções) | aba *AEE* |
| 7. Área da família (10 seções + autorização) | aba *Família* |
| 8. Profissionais de Apoio (6 seções, com autorização) | aba *Profissionais de Apoio* |
| 9. Construção do PDI (juntar, revisar, versionar, relatório) | **PDI consolidado** + **Versões do PDI** |
| 10. Acompanhamento por período | **Acompanhamento** (registros, gráfico, relatório CSV) |
| 11. Usuário Mestre (painel, usuários, educandos, permissões, perguntas, pranchas, versões, histórico, configurações) | menu do gestor |
| Paleta `#4F8A5B #8FBC8F #CDE4C2 #E8F2E6 #F4C542 #F39237 #E94E1B #2E7D9A #5A4B8C #333333` | variáveis no topo de `app/globals.css` |

## Estrutura

```
app/
  page.tsx                     abertura animada (intro)
  login/page.tsx               tela de acesso
  dashboard/
    page.tsx                   server component: lê ?perfil
    dashboard-app.tsx          shell: sessão, menu lateral, educando em foco, Início e Configurações
    painel-admin.tsx           visão geral, usuários, educandos, planos, versões, permissões, campos,
                               pranchas e configurações
    area-participante.tsx      PDI em abas por área, seções fixas, áudio, pranchas e autorização
    meus-alunos.tsx            lista de alunos com status e potencialidades
    consolidado.tsx            documento do PDI + impressão/PDF
    acompanhamento.tsx         gráfico, registros de evolução e próximos passos
    acessibilidade.tsx         preferências (voz, ditado, contraste, botões grandes)
    fluxo.tsx                  etapas do PDI com status (texto + ícone + cor)
    cabecalho.tsx              cabeçalho das telas
    use-entradas.ts            leitura das respostas de um educando
  api/pdi/route.ts             respostas do PDI
  api/config/route.ts          configuração da escola
  layout.tsx, globals.css      layout e folha de estilo única
lib/
  perfis.ts                    perfis canônicos + normalização/iniciais
  pdi-tipos.ts                 tipos, seções fixas, áreas, pranchas, autorização e permissões
  dados.ts                     leitura/gravação (banco com fallback local), comentários, backup
  relatorio.ts                 planilha CSV das respostas (relatórios)
  fala.ts                      leitura em voz alta e ditado (Web Speech API)
  db/index.ts, db/schema.ts    Drizzle: pdi_workspaces, pdi_entries, pdi_config
components/intro-pingo.*       abertura animada
db/init.sql                    DDL do PostgreSQL (sem dados de exemplo)
scripts/banco-local.mjs        Postgres local (PGlite) para desenvolvimento
tests/                         suítes automáticas (ver abaixo)
ROTEIRO-DE-TESTE.md            passo a passo manual para a escola
RELATORIO.md                   o que foi feito e o que ainda depende de decisão
```

## Testes

```bash
pnpm test          # 203 verificações (76 + 14 + 80 + 33)
pnpm test:logic    # camada de dados, sem navegador
pnpm test:styles   # regras de CSS (menu, contraste, impressão)
pnpm test:ui       # navegação real dos componentes (jsdom + React)
pnpm test:fluxos   # preencher, salvar, cadastrar, permissões e campos
pnpm test:banco    # interface → API → Postgres, com o servidor rodando
```

`pnpm test:banco` só faz sentido com `pnpm dev` no ar e `DATABASE_URL` válido: ele monta a
interface, cadastra um educando pela tela e confere que o registro chegou ao banco. É a prova
de ponta a ponta da integração; as outras quatro suítes rodam sozinhas, sem servidor.

| Suíte | Arquivo | Cobre |
| --- | --- | --- |
| Lógica | `tests/logic.mjs` | migração v1→v2 e `saude` → `apoio`, base vazia e sem exemplos, modo local sem API, permissões efetivas, **autorização da família** (liberar, limitar por área e revogar), seções fixas de cada área (6/8/9/10/6), agrupamento de campos por seção, perguntas do educando configuráveis, pranchas padrão, versões do PDI, progresso, respostas em branco, listas/chips, evolução, próximos passos, comentários, backup, planilha CSV, acessibilidade, limpeza |
| Estilos | `tests/styles.mjs` | **nenhuma regra esconde o menu lateral fora da impressão**, `.sidebar.open` entra na tela, camada de fechar, botão de menu, foco visível, alto contraste, botões grandes, status com texto ao lado do ícone, `@media print` |
| Interface | `tests/ui.mjs` | as 11 abas do gestor e as 7 do participante com conteúdo próprio, menu em tela estreita (abrir, navegar, fechar, clique fora, `Esc`, `aria-expanded`), Meus alunos → PDI, abas por área com o perfil caindo na própria área, leitura/escrita por área, **prancha de comunicação** (símbolos com nome escrito, composição símbolo → frase), **autorização da família** (sem autorização o apoio não vê áreas; com autorização vê só a liberada; revogar fecha), controles de acessibilidade e console sem erros |
| Fluxos | `tests/fluxos.mjs` | educando escreve e salva (Descritivo e Perguntas), professor salva campo na própria aba e comenta a da família, listas viram chips, cadastro de educando e usuário (com e-mail repetido barrado), permissão alterada, campo criado e reordenado, evolução registrada, próximos passos, preferências salvas |

Os testes de interface montam os componentes reais em jsdom, com o React do projeto; `next/navigation`
e `next/link` são substituídos por mocks em `tests/mocks/`. `tests/massa.mjs` cria os cadastros
usados só nos testes — o aplicativo não traz nenhum dado de exemplo.
`tests/build.mjs` compila tudo com esbuild para `node_modules/.cache/pdi-tests`, fora do
repositório — nenhum artefato de build entra no Git.

> O teste de CSS existe por causa de um defeito real: em telas estreitas, um
> `@media (max-width: 640px) { .sidebar { display: none } }` vencia o `.sidebar.open` e deixava
> as abas inalcançáveis no celular. O menu atual é off-canvas com `transform` + `visibility`;
> não reintroduza `display:none` para `.sidebar` fora de `@media print`.

## Limitações conhecidas

- **Não há autenticação real**: o login aceita qualquer e-mail/senha e o perfil vem da URL. Para
  compensar, a barra lateral permite escolher **qual cadastro você está usando** e as permissões
  valem para ele. Falta apenas trocar esse seletor por um provedor de identidade.
- O modo local grava no navegador daquele aparelho: não sincroniza entre pessoas. Para uso
  colaborativo, configure `DATABASE_URL`.
- Leitura em voz alta e ditado dependem da Web Speech API; quando o navegador não oferece, a tela
  avisa e desativa o controle em vez de falhar em silêncio.
- O PDF usa a impressão do navegador (“Salvar como PDF”) em vez de gerar o arquivo no servidor —
  funciona em qualquer aparelho e mantém a fonte e o layout do documento.
