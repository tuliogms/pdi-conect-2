# PDI Interativo — diagnóstico do projeto e correções

Data: 29/10/2026 · branch `arena/f20dd464-pdi-conect-2`

## 1. Como o projeto estava

Aplicação **Next.js 16.3 (App Router) + React 19 + Drizzle/PostgreSQL**, com CSS próprio
(`app/globals.css`, ~30 KB) e ícones Lucide. Antes das mudanças, o código somava **313 linhas**
de TypeScript em 9 arquivos e tinha três telas: `/` e `/login` (duas versões do login) e
`/dashboard`, além de uma rota de API `/api/pdi`.

Estado verificado inicialmente:

| Verificação           | Resultado                                              |
| --------------------- | ------------------------------------------------------ |
| `pnpm install`        | ok                                                     |
| `tsc --noEmit`        | ok (mas `next.config` ignorava erros no build)          |
| `next build`          | ok — compilando **sem** validação de tipos              |
| `/` e `/login`        | 200, mas com **conteúdos diferentes** entre si          |
| `/dashboard`          | 200, porém abria como "Estudante" e trocava no cliente  |
| `/api/pdi` (GET/POST) | **500** com stack trace e SQL na resposta               |
| Testes / lint         | inexistentes                                            |
| `.gitignore`          | **não existia**                                         |

## 2. Mapa do projeto depois das correções

```
app/
  page.tsx                 redireciona para /login
  login/page.tsx           tela de acesso única, 6 perfis
  dashboard/page.tsx       server component: resolve ?perfil
  dashboard/dashboard-app.tsx  UI do dashboard (client)
  api/pdi/route.ts         GET/POST do PDI com upsert atômico
  layout.tsx, globals.css
lib/
  perfis.ts                perfis canônicos, normalização e iniciais
  db/index.ts              pool preguiçoso + singleton
  db/schema.ts             pdi_workspaces / pdi_entries
components/ui/button.tsx   shadcn/ui
db/init.sql                DDL do PostgreSQL (não existia)
public/                    logos e ícones
pdi-pingo-saltitante.html  protótipo visual estático (288 KB, fora do app)
```

## 3. Erros corrigidos

### Rotas e fluxo

1. **Duas telas de login divergentes** (`app/page.tsx` e `app/login/page.tsx`): uma tinha 6
   perfis e a marca "ProfEi", a outra 4 perfis e "Rede inclusiva". Agora existe **uma** tela
   (`/login`) com os 6 perfis e `/` responde `307` → `/login`.
2. **Perfil trocado só no navegador**: o dashboard lia `?perfil` dentro de `useEffect`, então a
   tela renderizava "Estudante" (inclusive no HTML do servidor) e "piscava" para o perfil real.
   O perfil agora é resolvido no servidor (`app/dashboard/page.tsx`).
3. **Perfis não reconhecidos**: `Aluno`, `AEE`, `Profissional da saúde` dependiam de comparações
   frágeis com `if/else`. Criei `lib/perfis.ts` com normalização (acentos, caixa e apelidos:
   `aluno`, `aee`, `mestre`, `profissional da saude`...).
4. **Engrenagem de configurações não fazia nada** para quem não é "Usuário Mestre" (a seção não
   existia no menu e o conteúdo ignorava o estado). Agora o menu do participante tem
   "Visão geral" e "Configurações", com uma seção real.
5. **Não havia como sair** da área logada — adicionado botão "Sair" que volta ao `/login`.
6. **Avatar fixo em "JS"** para todos os perfis — as iniciais agora derivam do perfil (`UM`, `PA`, `E`).
7. **"Solicite acesso à escola" levava para outro login** (`/?perfil=Aluno`) — agora exibe a
   orientação de contato com a escola.

### API e banco

8. **`/api/pdi` devolvia 500 com stack trace, SQL e parâmetros** ao cliente quando faltava
   `DATABASE_URL` ou o banco estava fora. Agora responde `503` com
   `{"error":"Banco de dados não configurado neste ambiente."}` e mantém o detalhe apenas no log.
9. **Pool criado no import do módulo** (`new Pool(...)` no topo): qualquer carregamento do módulo
   sem banco estourava. O pool passou a ser criado sob demanda, com cache em `globalThis`
   (evita vazar conexões no hot reload) e `connectionTimeoutMillis`.
10. **Corrida no POST**: o fluxo era `select` → `insert`/`update`, podendo duplicar registros.
    Agora é um `insert ... onConflictDoUpdate` sobre a chave única.
11. **JSON inválido no POST** gerava erro 500; agora retorna `400`.
12. **`pdi_entries.workspace_id` sem chave estrangeira** — adicionada FK com `on delete cascade`;
    `unique()` migrado para o formato em array (sem o aviso de depreciação do Drizzle).
13. **As tabelas nunca existiram em SQL** (não havia migrations nem `drizzle.config`), então a API
    não funcionaria nem com banco. Adicionado `db/init.sql` espelhando o schema.

### Configuração e infraestrutura

14. **`typescript.ignoreBuildErrors: true`** escondia erros de tipo no build. Removido — o
    `next build` agora executa `Running TypeScript` e passa.
15. **`.gitignore` ausente**: `node_modules/` e `.next/` podiam ser versionados. Criado (inclui
    `.env*`, com exceção de `.env.example`).
16. **`.env.example`** e **`db/init.sql`** criados; `package.json` renomeado de `my-project`
    para `pdi-conect` e ganhou o script `typecheck`.
17. **CSS inválido**: `color:#9bad a5` (cor inexistente, com espaço) em `.field-item svg:last-child`
    — corrigido para `#9bada5`.
18. **`viewport.colorScheme: 'light dark'` e `themeColor` preto** num app que só tem tema claro
    (o CSS declara `:root{color-scheme:light}`) — ajustado para `light` e `#f3f8f0`.
19. **`generator: 'v0.app'`** residual removido dos metadados.

### Acessibilidade e qualidade de código

20. Grupo de perfis do login virou `<fieldset>/<legend>`, com `aria-pressed` nos botões.
21. Menu mobile com `aria-expanded`/`aria-controls`, item atual com `aria-current="page"`,
    ícones decorativos com `aria-hidden`.
22. A tabela de usuários usava `role="table"`/`role="row"` sem células (ARIA inválida) — os
    papéis foram removidos e cada painel tem seu próprio título/`id`.
23. `select`s de filtro e permissões agora têm rótulos associados (`htmlFor`/`aria-label`).
24. **Timer do aviso sem limpeza** (`setTimeout` que atualizava estado após desmontar) — agora há
    `useRef` + `clearTimeout`/cleanup.
25. **Permissões só listavam professores**: família, AEE e saúde não podiam receber permissão.
    A lista passa a incluir todos os perfis, exceto "Usuário Mestre".
26. Removido o hack `usuarioId.includes('ana@')` que definia permissão padrão pelo e-mail; o
    padrão agora depende do perfil.
27. Busca de usuários ganhou estado vazio ("Nenhum usuário encontrado").
28. Tipagem: `any` substituído por tipos (`Usuario`, `NivelPermissao`, `SecaoAdmin`, props dos
    painéis) e o dashboard foi dividido em componentes legíveis.

## 4. Como validar

```bash
pnpm install
pnpm typecheck          # sem erros
pnpm build              # compila e valida tipos
pnpm dev

curl -i http://localhost:3000/            # 307 -> /login
curl -i "http://localhost:3000/dashboard?perfil=AEE"   # abre como Professor de AEE
curl -i http://localhost:3000/api/pdi      # 503 JSON limpo (sem banco)
```

Com um PostgreSQL configurado (`db/init.sql` + `DATABASE_URL`), `POST /api/pdi` grava e
`GET /api/pdi` devolve workspace e respostas.

## 5. Problemas encontrados que **não** foram alterados

| Item | Por que ficou como está |
| --- | --- |
| Sem autenticação real (qualquer e-mail/senha entra; perfil vem da URL) | Exige decisão de produto/back-end (provedor de identidade, sessão, hash de senha). |
| `app/globals.css` com ~101 seletores duplicados e classes órfãs (`topic-card`, `manager-modal`, `field-item`, `scale-row`...) | Enxugar muda o visual e exige revisão tela a tela. |
| `pdi-pingo-saltitante.html` (288 KB, com imagens em base64) na raiz | É protótipo de design; mover para `docs/` é decisão do time. |
| Sem ESLint e sem testes | Sugestão: `eslint-config-next` + Vitest/Playwright. |
| Sem migrations versionadas | `drizzle-kit` não está instalado; hoje o DDL é manual em `db/init.sql`. |
| `packageManager: pnpm@12.3.4` no `package.json` | Mantido por ser a versão declarada pelo projeto. |


---

# Rodada 2 — o sistema pronto para receber dados reais

Objetivo desta rodada: **remover todo conteúdo de exemplo e deixar as funções operando com
dados reais**, começando do zero.

## O que saiu

| Removido | Onde estava |
| --- | --- |
| Usuários fictícios (João da Silva, Ana Souza, Carla Mendes, Marcos Souza...) | `usuariosIniciais` no dashboard |
| Números inventados do resumo (24 usuários, 12 estudantes, 10 PDIs...) | `Overview` |
| Histórico de alterações falso (Carlos Souza, 28/09/2026) | `Overview` |
| “João da Silva” como estudante padrão de todas as telas | permissões, selects, schema e `db/init.sql` |
| “Novo usuário / novo@pdi.com” criado por um clique | botão “Cadastrar usuário” |
| Campos personalizados de exemplo (Necessidades..., Estratégias de AEE...) | “Campos e formulários” |
| Workspace fixo `00000000-...-0001` e autor padrão da API | `app/api/pdi/route.ts` e `db/init.sql` |
| Lista fixa “João da Silva” no seletor de estudante | “Permissões de acesso” |

## O que entrou no lugar

- **CRUD real de estudantes e usuários**: formulários com validação (nome, e-mail válido,
  e-mail duplicado), edição na própria lista, ativar/desativar e remoção com confirmação.
  Remover um estudante desvincula os usuários e limpa as permissões ligadas a ele.
- **Permissões por pessoa e por estudante**, agora ligadas aos cadastros reais (o padrão é
  “Editar” para o dono da área e “Visualizar” para os demais).
- **PDI preenchível**: os seis tópicos fixos do estudante + a contribuição de cada área
  colaborativa + campos personalizados criados pela administração. Cada seção é salva
  separadamente, mostra autor e data da última versão, tem contador de caracteres
  (limite 5.000) e fica somente leitura para quem não é dono da área.
- **Acompanhamento real**: quantas seções foram respondidas, última atualização e quem já
  contribuiu, por estudante.
- **Histórico real**: cada cadastro, alteração, remoção e permissão salva passa a ser
  registrado — a lista começa vazia.
- **Estados vazios** em todas as seções, dizendo o que fazer em vez de mostrar exemplo.
- **Exportação em JSON** de toda a configuração e das respostas (Configurações).
- **Indicador de persistência**: faixa no topo informa se está gravando no banco ou apenas
  neste navegador.

## Persistência em dois níveis

`lib/dados.ts` concentra a leitura/gravação:

| Situação | Comportamento |
| --- | --- |
| `DATABASE_URL` configurada | `POST /api/config` e `POST /api/pdi` gravam no PostgreSQL |
| Sem banco | as mesmas funções gravam no armazenamento local e a UI avisa “Modo local” |

Assim o sistema é utilizável imediatamente (sem infraestrutura) e passa a ser multiusuário
no momento em que o banco é configurado, sem mudar a interface.

## Mudanças de API e schema

- `GET /api/pdi?estudante=<uuid>` — antes não recebia parâmetro e usava um workspace fixo.
- `POST /api/pdi` — exige `estudante` (uuid), `authorName` e grava `studentName` real;
  limite de conteúdo passou de 500 para 5.000 caracteres.
- `GET/POST /api/config` — nova rota para a configuração administrativa (documento JSON,
  limite de 1 MB).
- `pdi_config` — nova tabela; `student_name` e `author_name` perderam o `default 'João da Silva'`.
- `lib/db/resposta.ts` — tratamento de erro de banco compartilhado pelas rotas e validação
  de uuid.

## Verificação desta rodada

| Checagem | Resultado |
| --- | --- |
| `pnpm typecheck` | sem erros |
| Lógica de dados (13 asserções em Node, simulando navegador) | grava/lê config, grava/lê respostas, upsert sem duplicar, PDIs isolados por estudante, JSON corrompido vira config vazia, normalização de estrutura parcial — **13/13** |
| `GET /api/pdi` sem parâmetro / uuid inválido | 400 com mensagem clara |
| `POST /api/pdi` sem autor | 400 “Informe quem está respondendo.” |
| `GET/POST /api/pdi` e `/api/config` sem banco | 503 e o app cai para o modo local |
| `/`, `/login`, `/dashboard?perfil=mestre` | 200 |
| Busca por dados fictícios no código | nenhuma ocorrência |

## Pendências (conscientes)

| Item | Por quê |
| --- | --- |
| Modo local não sincroniza entre dispositivos | É o comportamento esperado sem banco; configurar `DATABASE_URL` resolve. |
| Sem migrations versionadas | `drizzle-kit` não faz parte das dependências; o DDL segue em `db/init.sql`. |


---

# Rodada 3 — adequação ao portfólio “PDI Participativo”

Referência: `Portfolio_PDI_Participativo_ABNT_.pdf` (14 páginas) e as telas
`01_tela_login` … `10_paleta_de_cores`. O objetivo foi **tirar do papel o que o
portfólio descreve e ainda não existia**, e deixar o app pronto para uso e teste.

## O que era só conceito no portfólio e agora funciona

| Portfólio | Antes | Agora |
| --- | --- | --- |
| Fluxo do PDI com status (seção 3) | não existia | `fluxo.tsx`: estudante → professor → família → saúde → consolidado, cada etapa com barra e status **texto + ícone + cor** |
| Área do estudante com “Descritivo \| Perguntas” (seção 3) | só texto corrido | cada um dos 6 tópicos alterna entre texto único e **perguntas norteadoras**, com progresso `n/6` e botão **Próximo** |
| Acessibilidade (seção 4) | só “aumentar texto” | **leitura em voz alta** (com play/pausar/parar e velocidade), **preenchimento por voz**, **alto contraste**, **botões/textos maiores** e nota de compatibilidade com TalkBack/VoiceOver |
| Área do professor com “Meus alunos” (seção 5) | lista inexistente | `meus-alunos.tsx`: busca, cards com situação do PDI e abertura do plano |
| Campos por área conforme o modelo (seções 5–7) | um campo livre por área | **campos de fábrica** do portfólio: observações pedagógicas, potencialidades (chips), dificuldades, estratégias, objetivos, evolução; rotina/interesses/dificuldades/estratégias/observações na família; observações/recomendações/encaminhamentos/acompanhamento na saúde |
| Campos configuráveis (seção 7) | adicionar e remover título | **adicionar, editar, remover, reordenar (↑ ↓)** e definir leitura para outros perfis (visualizar/comentar/sem acesso) |
| Permissões (seção 7) | gravadas, sem efeito na tela | passam a valer: **editar, comentar, visualizar, sem acesso**, aplicadas por área e por campo |
| Acompanhamento (seção 9) | tabela simples | **gráfico de evolução** por indicador (Leitura, Escrita, Interação social + indicadores próprios), registros com autor/data e **próximos passos** |
| PDI consolidado (seção 8) | não existia | `consolidado.tsx`: etapas, principais pontos, contribuições e acompanhamento, com **Gerar PDF** (impressão formatada) |

## Também nesta rodada

- **Identidade de uso**: sem login real, o dashboard permite escolher *qual
  cadastro* você está usando. É o que faz as permissões terem efeito prático e
  permite testar cada perfil sem criar contas.
- **Migração de dados**: a configuração antiga (`pdi.config.v1`, com
  `camposColaborativos`) é convertida para o novo formato sem perder cadastros —
  os campos antigos entram como extras da área.
- **Cadastros de teste**: botão em Configurações que cria 1 estudante + equipe
  vinculada (nunca respostas de exemplo) e botão para **apagar todos os dados**.
- **Estudantes por vínculo**: cada pessoa vê os estudantes ligados a ela; o gestor
  vê todos.
- **Acessibilidade persistente**: as preferências ficam salvas no navegador.

## Verificação desta rodada

| Checagem | Resultado |
| --- | --- |
| `pnpm typecheck` | sem erros |
| `pnpm build` | compila e valida tipos (6 rotas) |
| Testes de lógica em Node (31 asserções) | **31/31** — migração v1→v2, permissões efetivas (dono/admin/exceção/“Sem acesso”/“Comentar”), progresso por etapa, listas/chips, registros de evolução ordenados, próximos passos, preferências de acessibilidade, limpeza |
| Renderização real (SSR) com dados | rota temporária renderizou **todos os painéis** com dados fictícios e com dados vazios: nenhum erro, 124 KB de HTML (rota removida depois do teste) |
| Rotas `/`, `/login`, `/dashboard?perfil=mestre|professor|familia|AEE|estudante` | 200 |
| Busca por dados fictícios no código | nenhuma ocorrência |

## O que ainda depende de decisão (não é defeito)

| Item | Por quê |
| --- | --- |
| Login com senha real / login institucional | Precisa de provedor de identidade e sessão no servidor. Hoje o perfil vem da URL e o cadastro é escolhido na tela. |
| Notificações e e-mails | Fora do escopo do protótipo; exigiria serviço de envio. |
| Migrations versionadas | `drizzle-kit` não está nas dependências; o DDL segue em `db/init.sql`. |
| Nome do produto | O portfólio chama de **PDI Participativo**; o app está como **PDI Interativo** (nome usado na abertura e no login). Troca é uma constante, se for a decisão. |

## Rodada 4 — menu em tela estreita e suíte de testes

### O defeito relatado

> "não consigo entrar nas abas"

**Causa:** a folha de estilo tinha

```css
@media (max-width: 640px) { .sidebar { display: none } }
```

Essa regra vencia o `.sidebar.open` (mesma especificidade, declarada depois), então o
botão de menu até mudava o estado do React, mas a barra lateral continuava com
`display:none`. Em celular e no painel de preview (que é estreito) nenhuma aba abria.

### Correção

| Antes | Agora |
| --- | --- |
| `display:none` abaixo de 640px | barra lateral **off-canvas**: `transform: translateX(-105%)` + `visibility:hidden` abaixo de 850px |
| `.sidebar.open` só mudava `left` | `.sidebar.open` traz `translateX(0)`, `visibility:visible` e `display:flex` (fora da impressão) |
| fechar só pelo X | clique na camada escura (`.menu-scrim`), `Esc`, e o menu fecha sozinho depois de navegar |
| rolagem do fundo continuava | corpo travado enquanto o menu está aberto |
| botão de menu 36px | 40×40 com ícone de 22px; itens de menu com no mínimo 46px de altura |

### Testes automáticos

Antes não havia suíte; a verificação era manual. Agora `pnpm test` roda **87 verificações**:

| Suíte | Verificações | Destaque |
| --- | --- | --- |
| `tests/logic.mjs` | 32 | migração v1→v2, permissões efetivas, progresso por tópico, evolução, acessibilidade, limpeza |
| `tests/styles.mjs` | 14 | falha se qualquer regra esconder `.sidebar` fora de `@media print` (guarda a regressão) |
| `tests/ui.mjs` | 41 | abas do gestor (9) e do participante (7), menu estreito (abrir/navegar/fechar/tocar fora/Esc/`aria-expanded`), "Meus alunos" → PDI, edição por área, interruptores de acessibilidade, console limpo |

Os testes de interface montam os componentes reais em jsdom (React do projeto), compilados
com esbuild para `node_modules/.cache/pdi-tests` — nada de artefato de build no repositório.

### Verificação

| Checagem | Resultado |
| --- | --- |
| `pnpm typecheck` | sem erros |
| `pnpm build` | 6 rotas |
| `pnpm test` | **87/87** (32 + 14 + 41) |
| Rotas no servidor de desenvolvimento | `/`, `/login` e `/dashboard` nos 5 perfis: 200 |
| Assets com `Host` de preview (`*.e2b.app`) | todos 200 |
| CSS servido em produção | contém `.sidebar.open` com `translateX(0)` e `visibility:visible`; nenhum `display:none` em `.sidebar` |

> Aviso de hidratação que aparece no console é gerado por uma extensão do Chrome
> (`crxlauncher` injeta atributos na tag `<html>`), não pelo app.

## Rodada 5 — volta à interface original, sem exemplos e com o banco validado

### O pedido

> "ficou horrível, o que eu queria era só tirar os exemplos e deixar o app utilizável com os
> bancos de dados e etc"

A rodada anterior tinha reescrito a interface por conta própria (`app/dashboard/secoes/*`,
design system novo). Foi **erro de escopo**: o pedido era apagar os dados de exemplo e deixar o
aplicativo funcionando com o banco — não trocar o app.

### O que foi feito

| Item | Situação |
| --- | --- |
| Interface | **voltou a ser a original**: `dashboard-app.tsx`, `painel-admin.tsx`, `area-participante.tsx`, `consolidado.tsx`, `acompanhamento.tsx`, `meus-alunos.tsx`, `acessibilidade.tsx`, `cabecalho.tsx`, `fluxo.tsx`, `use-entradas.ts` e a folha de estilo que o app já usava |
| Correção da Rodada 4 | mantida (menu off-canvas em tela estreita, camada para fechar, `Esc`, `aria-expanded`) |
| Dados de exemplo | **removidos**: o cartão “Ambiente de teste → Criar cadastros de teste” saiu das Configurações e `lib/dados-teste.ts` foi apagado. O sistema abre sem estudante, sem usuário e sem resposta |
| Limpeza | a função `configuracaoLimpa()` (botão **Apagar todos os dados**) foi para `lib/pdi-tipos.ts` e continua funcionando |
| Banco de dados | Postgres (PGlite com protocolo de rede) criado no ambiente, tabelas do `db/init.sql` aplicadas, `.env.local` com `DATABASE_URL`; `GET/POST /api/config` e `GET/POST /api/pdi` respondem **200** e o dado volta na leitura seguinte |
| `db/init.sql` | deixou de exigir a extensão `pgcrypto` (o `gen_random_uuid()` é nativo no Postgres 13+) |
| Suítes de teste | reescritas para a interface atual: `tests/massa.mjs` monta os cadastros usados só nos testes — o app não embute dado nenhum |

### Verificação

| Checagem | Resultado |
| --- | --- |
| `pnpm typecheck` | sem erros |
| `pnpm build` | 6 rotas (`/`, `/login`, `/dashboard`, `/api/config`, `/api/pdi`, `_not-found`) |
| `pnpm test` | **159/159** — lógica 50, estilos 14, interface 62, fluxos 33 |
| `/api/config` com banco | `GET` 200 (`{"config":null}`), `POST` 200, leitura seguinte devolve o documento |
| `/api/pdi` com banco | `GET` 200 (`entries: []`), `POST` 200, leitura seguinte devolve a resposta e o workspace |
| Banco depois do teste | limpo (`pdi_config`, `pdi_workspaces` e `pdi_entries` em 0 registros) |
| Rotas `/`, `/login`, `/dashboard` nos perfis | 200 com `Host` de preview (`*.e2b.app`) |

O que as suítes provam na prática:

- **Interface**: as 9 abas do gestor e as 7 do participante abrem com conteúdo próprio; o menu
  funciona em tela estreita (abrir, navegar, fechar, clique fora, `Esc`) e o botão Acessibilidade
  da barra superior aumenta o texto.
- **Fluxos**: estudante escreve e salva em Descritivo e em Perguntas; professor grava o campo da
  própria área e comenta a da família; gestor cadastra estudante e usuário, muda permissão, cria
  campo; evolução gera o gráfico e os próximos passos são gravados.
- **Dados**: migração v1→v2, base vazia, permissões efetivas, backup ida e volta, CSV com acentos.

### O que ainda depende de decisão (não é defeito)

| Item | Por quê |
| --- | --- |
| Login com senha real / institucional | Precisa de provedor de identidade e sessão no servidor; hoje o perfil vem da URL e o cadastro é escolhido na barra lateral |
| Nome do produto | O portfólio chama de **PDI Participativo**; o app está como **PDI Interativo** (abertura, login e documentos) |
| Notificações por e-mail | Exigiria serviço de envio; o app avisa dentro da própria tela |
| Migrations versionadas | `drizzle-kit` não está nas dependências; o DDL segue em `db/init.sql` |
| Banco do preview | É um Postgres de desenvolvimento (PGlite) com dados apenas da sessão; para uso real troque `DATABASE_URL` por um Postgres permanente |

## Rodada 6 — as oito áreas do PDI, como a especificação pediu

### O pedido

A especificação completa do aplicativo (oito abas = oito áreas do PDI), com respostas em áudio,
pranchas de comunicação, autorização técnica da família e histórico de versões. Escopo escolhido:
**tudo**; abas = **áreas dentro do PDI**; nomes = **educando** e **Profissionais de Apoio** em
todas as telas, relatórios e PDF.

### O que entrou

| Área | Seções fixas | Antes → agora |
| --- | --- | --- |
| **Educando** | 6 | já eram as seis seções do portfólio; agora com **áudio**, **prancha de comunicação** e **perguntas norteadoras configuráveis** |
| **Professor** | 8 | 6 campos → 8 seções (identificação, observações pedagógicas, potencialidades, dificuldades e barreiras, estratégias, adaptações e recursos, objetivos, acompanhamento) |
| **Professor de AEE** | 9 | **área nova** (não existia): necessidades específicas, recursos de acessibilidade, estratégias do AEE, potencialidades, habilidades em desenvolvimento, adaptações e recomendações, acompanhamento, observações |
| **Família** | 10 | 5 campos → 10 seções, incluindo comunicação, autonomia, expectativas e **autorização de compartilhamento com revogação** |
| **Profissionais de Apoio** | 6 | era “Profissional da Saúde” com 4 campos; agora 6 seções + **acesso só ao que a família autorizou** (regra no código, não aviso) |
| **Construção do PDI** | — | o consolidado agora mostra a situação de cada área, mantém a autoria de cada contribuição e o **histórico de versões** |
| **Acompanhamento** | — | além do gráfico: **registros descritivos por período** (objetivos, estratégias, progressos, dificuldades, o que funcionou, o que muda, novos objetivos) e relatório CSV |
| **Usuário Mestre** | — | 11 abas: entram **Versões do PDI** e **Pranchas de comunicação**; Configurações ganha **identidade institucional** (nome, escola, logo) |

Nomes: `estudante` → **educando** e `Profissional da Saúde` → **Profissionais de Apoio** em telas,
relatórios, CSV e PDF. Os apelidos antigos continuam aceitos na URL e na migração (`saude` → `apoio`,
`estudante` → `Educando`), para não perder cadastro nem resposta já gravada.

### Como funciona a autorização da família

1. Na aba **Família → Autorização de compartilhamento**, a família marca que autoriza e escolhe
   **quais áreas** liberar; fica registrado o nome de quem autorizou e a data.
2. `acessoNaArea()` (em `lib/pdi-tipos.ts`) aplica a regra: se o perfil é Profissional de Apoio e a
   área não está liberada, o retorno é `Sem acesso` — a área nem aparece como aba.
3. A revogação grava a data e o motivo, fecha o acesso na hora e continua no histórico.

### Pranchas, áudio e acessibilidade

- **Prancha de comunicação**: categorias com símbolos (emoji ou imagem própria) e **nome escrito
  embaixo**; seleção única (“Um símbolo”) ou múltipla (“Vários símbolos”) montando **símbolo →
  frase**; “Ouvir” e “Usar esta frase” (a frase entra na resposta).
- **Resposta em áudio**: gravação com `MediaRecorder`, guardada junto da resposta e com botão de
  remover; quando o navegador não oferece microfone, o botão não aparece.
- **Leitura em voz alta** continua em todas as perguntas; ditado por voz (STT) segue disponível.
- Cada campo mostra **quem escreveu e quando**; comentários são entradas separadas e não
  sobrescrevem a resposta.

### Verificação

| Checagem | Resultado |
| --- | --- |
| `pnpm typecheck` | sem erros |
| `pnpm build` | 6 rotas (`/`, `/login`, `/dashboard`, `/api/config`, `/api/pdi`, `_not-found`) |
| `pnpm test` | **203/203** — lógica 76, estilos 14, interface 80, fluxos 33 |
| `pnpm test:banco` | **5/5** — interface → API → Postgres com o servidor no ar |
| Banco depois do teste | limpo (`pdi_config`, `pdi_workspaces` e `pdi_entries` em 0 registros) |

O que as suítes novas provam:

- **Autorização**: sem autorização o profissional de apoio vê **só** a própria área; com autorização
  vê apenas a área liberada; revogar fecha de novo (testes de lógica e de interface).
- **Prancha**: os símbolos aparecem com nome escrito, dois símbolos montam uma frase e a frase
  entra na resposta.
- **Seções**: 6/8/9/10/6, com todos os campos agrupados e nenhum campo solto.
- **Migração**: configuração antiga com `saude` vira `apoio` (campos, permissões e autorização).

### Ainda depende de decisão (não é defeito)

| Item | Por quê |
| --- | --- |
| Login com senha real / institucional | Precisa de provedor de identidade e sessão no servidor |
| Nome do produto | O portfólio chama de **PDI Participativo**; o app segue como **PDI Interativo** (agora configurável em Configurações → Identidade institucional) |
| Imagens reais nos símbolos | As pranchas usam emoji + nome escrito; o Mestre pode trocar por imagens próprias (a estrutura `imagem` já existe) |
| Banco do preview | É um Postgres de desenvolvimento (PGlite); para uso real troque `DATABASE_URL` |
