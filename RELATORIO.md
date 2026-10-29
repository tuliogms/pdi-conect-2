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
| Dados do painel administrativo mockados (`usuariosIniciais`, números do resumo, histórico) | Precisa de modelagem de usuários/PDI antes de trocar por banco. |
| A UI do dashboard não consome `/api/pdi` | A API está pronta, mas ligar as telas é uma feature, não uma correção. |
| `app/globals.css` com ~101 seletores duplicados e classes órfãs (`topic-card`, `manager-modal`, `field-item`, `scale-row`...) | Enxugar muda o visual e exige revisão tela a tela. |
| `pdi-pingo-saltitante.html` (288 KB, com imagens em base64) na raiz | É protótipo de design; mover para `docs/` é decisão do time. |
| Sem ESLint e sem testes | Sugestão: `eslint-config-next` + Vitest/Playwright. |
| Sem migrations versionadas | `drizzle-kit` não está instalado; hoje o DDL é manual em `db/init.sql`. |
| `packageManager: pnpm@12.3.4` no `package.json` | Mantido por ser a versão declarada pelo projeto. |
