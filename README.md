# PDI Interativo

Aplicação web do **Plano de Desenvolvimento Individual (PDI)** colaborativo: o estudante conta
sobre si, a equipe da escola contribui por área e o plano se consolida em um documento único,
pronto para imprimir.

Projeto ligado ao **ProfEi — Mestrado em Educação Inclusiva (UEMG)**.

## Para que serve

| Quem entra | O que faz |
| --- | --- |
| **Estudante** | Responde seis tópicos sobre si — como texto corrido ou por perguntas guiadas — e acompanha o próprio plano |
| **Professor (e AEE)** | Vê a lista de alunos com o andamento de cada PDI e registra observações, potencialidades e estratégias — conforme as permissões de cada estudante |
| **Família** | Conta a rotina de casa, interesses e o que funciona |
| **Profissional da Saúde** | Registra observações, recomendações e encaminhamentos |
| **Usuário Mestre** | Cadastra estudantes e usuários, define permissões, adapta as perguntas e imprime os consolidados |

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
pnpm test       # as quatro suítes automáticas
pnpm test:banco # ponta a ponta contra o banco (precisa do dev + DATABASE_URL)
```

### Onde os dados ficam

O sistema começa **vazio**: nenhum estudante, usuário ou resposta de exemplo.

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
2. Cadastre o estudante em **Estudantes** e a equipe em **Usuários** (escolhendo o perfil e o
   estudante vinculado). O sistema começa vazio: nada de exemplo é criado.
3. Em **Campos e formulários**, adapte as perguntas de cada área (a ordem vira a ordem do PDF).
4. Em **Permissões de acesso**, escolha quem pode visualizar, comentar ou editar cada área.
5. Em **Planos de PDI**, preencha com cada perfil; em **PDI consolidado**, toque em **Gerar PDF**.
6. Antes de convidar as famílias, **Configurações → Apagar todos os dados** limpa o teste.

## Rotas

| Rota | Descrição |
| --- | --- |
| `/` | Abertura animada “Pingo Saltitante” e entrada no login |
| `/login` | Escolha do perfil de acesso |
| `/dashboard?perfil=<perfil>` | Área de cada pessoa (gestor vê o painel administrativo) |
| `/api/pdi?estudante=<uuid>` | `GET`/`POST` das respostas do PDI de um estudante |
| `/api/config` | `GET`/`POST` da configuração da escola |

O perfil é resolvido no servidor e aceita apelidos na URL (`aluno`, `AEE`, `mestre`,
`profissional da saude`…), normalizados em `lib/perfis.ts`.

## As abas, uma por uma

### Gestor (9 abas)

| Aba | O que tem |
| --- | --- |
| **Visão geral** | Estudantes, usuários ativos, convites pendentes, PDIs completos; tabela com o andamento de cada PDI, pendências (“aguardando acesso”, “estudante sem equipe”), atalhos e histórico de alterações |
| **Usuários** | Busca e filtros por perfil/status; cadastrar, editar, ativar/desativar e remover; vínculo com o estudante; validação de e-mail repetido |
| **Estudantes** | Cartões com turma, escola, equipe e progresso; cadastrar, editar, remover (com confirmação); atalho para abrir o PDI |
| **Planos de PDI** | Escolha do estudante e o PDI completo, com as quatro áreas editáveis |
| **PDI consolidado** | Documento único com etapas, o que o estudante conta, contribuições da equipe, evolução e próximos passos; **Gerar PDF** |
| **Permissões de acesso** | Matriz pessoa × área (Estudante, Professor, Família, Saúde) com `Padrão / Editar / Comentar / Visualizar / Sem acesso`, marcação do que foi definido à mão e botão para voltar ao padrão |
| **Campos e formulários** | Abas por área; adicionar, editar, **reordenar** (↑ ↓) e remover campos; tipo texto/lista; o que os outros perfis podem fazer; restaurar padrão |
| **Acompanhamento** | Indicadores (Leitura, Escrita, Interação social…) com último valor e média, gráfico de evolução, registro de observações, próximos passos e inclusão/remoção de indicadores |
| **Configurações** | Conta, onde os dados ficam, backup JSON, planilha CSV, apagar tudo, guia rápido e sobre |

### Participante (6 ou 7 abas, conforme o perfil)

| Aba | O que tem |
| --- | --- |
| **Início** | Saudação, indicadores do PDI, fluxo das cinco etapas, próximos passos da equipe, últimas atualizações |
| **Meus alunos** (professor/AEE) | Cartões com situação do PDI, etapas concluídas, chips de potencialidades e busca |
| **Meu PDI** (estudante) | Seis tópicos fixos; alternância **Descritivo | Perguntas** por tópico; leitura em voz alta, ditado, contador de caracteres e comentários da equipe |
| **PDI do estudante** (equipe) | Seis tópicos do estudante e as três áreas da equipe (Professor, Família, Saúde) com o nível de acesso de cada uma; área própria editável, demais em leitura ou comentário |
| **PDI consolidado** | O documento final, com **Gerar PDF** |
| **Acompanhamento** | Mesmo painel do gestor, restrito aos estudantes da pessoa |
| **Acessibilidade** | Leitura em voz alta, velocidade, ditado, alto contraste, botões grandes e instruções de TalkBack/VoiceOver (o botão da barra superior aumenta o texto) |
| **Configurações** | Sua conta e vínculo, modo de armazenamento, backup |

## Como o portfólio aparece no app

| Portfólio | Onde está |
| --- | --- |
| 1. Login com UEMG + ProfEi | `/login` (logos no cartão e na coluna verde) |
| 2. Fluxo estudante → professor → família → saúde → consolidado | bloco **Como está o PDI** (Início) e seção *Etapas do PDI* no consolidado |
| 3. Seis tópicos fixos com Descritivo/Perguntas | **Meu PDI** → área *Estudante* |
| 4. Acessibilidade (TTS, STT, velocidade, contraste, botões grandes) | aba **Acessibilidade** + botão na barra superior (aumenta o texto) |
| 5. Área do professor (lista, status, chips) | **Meus alunos** + seção *Área do Professor* |
| 6. Área da família | seção *Área da Família* |
| 7. Área da saúde e campos configuráveis | seção *Área da Saúde* + **Campos e formulários** |
| 8. Acompanhamento com gráfico e próximos passos | **Acompanhamento** |
| 9. PDI consolidado com Gerar PDF | **PDI consolidado** |
| Paleta `#4F8A5B #8FBC8F #CDE4C2 #E8F2E6 #F4C542 #F39237 #E94E1B #2E7D9A #5A4B8C #333333` | variáveis no topo de `app/globals.css` |

## Estrutura

```
app/
  page.tsx                     abertura animada (intro)
  login/page.tsx               tela de acesso
  dashboard/
    page.tsx                   server component: lê ?perfil
    dashboard-app.tsx          shell: sessão, menu lateral, estudante em foco, Início e Configurações
    painel-admin.tsx           visão geral, usuários, estudantes, planos, permissões, campos, configurações
    area-participante.tsx      PDI do estudante: 6 tópicos + áreas da equipe + campo de resposta
    meus-alunos.tsx            lista de alunos com status e potencialidades
    consolidado.tsx            documento do PDI + impressão/PDF
    acompanhamento.tsx         gráfico, registros de evolução e próximos passos
    acessibilidade.tsx         preferências (voz, ditado, contraste, botões grandes)
    fluxo.tsx                  etapas do PDI com status (texto + ícone + cor)
    cabecalho.tsx              cabeçalho das telas
    use-entradas.ts            leitura das respostas de um estudante
  api/pdi/route.ts             respostas do PDI
  api/config/route.ts          configuração da escola
  layout.tsx, globals.css      layout e folha de estilo única
lib/
  perfis.ts                    perfis canônicos + normalização/iniciais
  pdi-tipos.ts                 tipos, tópicos, áreas, campos e regras de permissão
  dados.ts                     leitura/gravação (banco com fallback local), comentários, backup
  relatorio.ts                 planilha CSV das respostas
  fala.ts                      leitura em voz alta e ditado (Web Speech API)
  db/index.ts, db/schema.ts    Drizzle: pdi_workspaces, pdi_entries, pdi_config
components/intro-pingo.*       abertura animada
db/init.sql                    DDL do PostgreSQL (sem dados de exemplo)
tests/                         suítes automáticas (ver abaixo)
ROTEIRO-DE-TESTE.md            passo a passo manual para a escola
RELATORIO.md                   o que foi feito e o que ainda depende de decisão
```

## Testes

```bash
pnpm test          # 159 verificações (50 + 14 + 62 + 33)
pnpm test:logic    # camada de dados, sem navegador
pnpm test:styles   # regras de CSS (menu, contraste, impressão)
pnpm test:ui       # navegação real dos componentes (jsdom + React)
pnpm test:fluxos   # preencher, salvar, cadastrar, permissões e campos
pnpm test:banco    # interface → API → Postgres, com o servidor rodando
```

`pnpm test:banco` só faz sentido com `pnpm dev` no ar e `DATABASE_URL` válido: ele monta a
interface, cadastra um estudante pela tela e confere que o registro chegou ao banco. É a prova
de ponta a ponta da integração; as outras quatro suítes rodam sozinhas, sem servidor.

| Suíte | Arquivo | Cobre |
| --- | --- | --- |
| Lógica | `tests/logic.mjs` | migração v1→v2, base vazia e sem exemplos, modo local sem API, permissões efetivas (`Sem acesso`/`Comentar` vencem o padrão), progresso por tópico e por área, respostas em branco, listas/chips, evolução ordenada, próximos passos, comentários, backup (exportar/importar/validar), planilha CSV, acessibilidade, limpeza |
| Estilos | `tests/styles.mjs` | **nenhuma regra esconde o menu lateral fora da impressão**, `.sidebar.open` entra na tela, camada de fechar, botão de menu, foco visível, alto contraste, botões grandes, status com texto ao lado do ícone, `@media print` |
| Interface | `tests/ui.mjs` | as 9 abas do gestor e as 7 do participante com conteúdo próprio, menu em tela estreita (abrir, navegar, fechar, clique fora, `Esc`, `aria-expanded`), atalho Acessibilidade, Meus alunos → PDI, leitura/escrita por área, controles de acessibilidade e console sem erros |
| Fluxos | `tests/fluxos.mjs` | estudante escreve e salva (Descritivo e Perguntas), professor salva campo e comentário, listas viram chips, cadastro de estudante e usuário (com e-mail repetido barrado), permissão alterada, campo criado e reordenado, evolução registrada, próximos passos no consolidado, preferências salvas |

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
