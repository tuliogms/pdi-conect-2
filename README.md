# PDI Interativo

Aplicação web do **Plano de Desenvolvimento Individual (PDI)** colaborativo, usada por estudantes,
famílias, professores, profissionais do AEE e da saúde para registrar e acompanhar o
desenvolvimento de um estudante de forma conjunta.

Projeto ligado ao **ProfEi — Mestrado em Educação Inclusiva (UEMG)**.

## Stack

| Camada      | Tecnologia                                            |
| ----------- | ----------------------------------------------------- |
| Framework   | Next.js 16.3 (App Router, Turbopack)                  |
| UI          | React 19 + CSS próprio em `app/globals.css`           |
| Ícones      | `lucide-react`                                        |
| Componentes | shadcn/ui (base-nova) + Base UI em `components/ui`     |
| Banco       | PostgreSQL + Drizzle ORM (`pg`)                       |
| Estilo      | Tailwind CSS v4 (apenas utilitários pontuais)         |
| Pacotes     | pnpm 12                                               |

## Como rodar

```bash
pnpm install
cp .env.example .env.local     # e preencha DATABASE_URL (opcional para navegar)
pnpm dev                       # http://localhost:3000
```

Scripts:

```bash
pnpm dev        # servidor de desenvolvimento
pnpm build      # build de produção (valida tipos)
pnpm start      # serve o build
pnpm typecheck  # tsc --noEmit
```

### Banco de dados (opcional)

Sem `DATABASE_URL` a navegação funciona normalmente; apenas `GET/POST /api/pdi` respondem
`503` com uma mensagem clara. Para habilitar a persistência:

```bash
createdb pdi_conect
psql "postgresql://usuario:senha@localhost:5432/pdi_conect" -f db/init.sql
# e aponte DATABASE_URL no .env.local
```

## Rotas

| Rota                              | Descrição                                                          |
| --------------------------------- | ------------------------------------------------------------------ |
| `/`                               | Redireciona para `/login`                                          |
| `/login`                          | Login com seleção de perfil (Estudante, Professor, AEE, Família, Saúde, Mestre) |
| `/dashboard?perfil=<perfil>`      | Área do usuário; `Usuário Mestre` vê o painel administrativo       |
| `/api/pdi`                        | `GET` carrega e `POST` salva as respostas do PDI (Drizzle/Postgres) |

O perfil é resolvido no servidor e aceita apelidos na URL (`aluno`, `AEE`, `mestre`,
`profissional da saude`...), normalizados em `lib/perfis.ts`.

## Estrutura

```
app/
  page.tsx              redireciona para /login
  login/page.tsx        tela de acesso
  dashboard/
    page.tsx            server component: lê ?perfil e resolve o perfil
    dashboard-app.tsx   UI do dashboard (client component)
  api/pdi/route.ts      API de leitura/gravação do PDI
  layout.tsx            layout raiz + metadados
  globals.css           estilos da aplicação
lib/
  perfis.ts             perfis canônicos + normalização/iniciais
  db/index.ts           pool e cliente Drizzle (criados sob demanda)
  db/schema.ts          tabelas pdi_workspaces e pdi_entries
db/init.sql             DDL inicial do PostgreSQL
components/ui/          componentes shadcn/ui
public/                 logos e ícones
pdi-pingo-saltitante.html   protótipo visual estático (referência de design)
```

## Limitações conhecidas

- Não há autenticação real: o login aceita qualquer e-mail/senha e o perfil vem da URL.
- Os dados do painel administrativo são mockados em memória (`usuariosIniciais`).
- A tela ainda não consome `/api/pdi`; a persistência existe na API mas não está ligada à UI.
- `app/globals.css` concentra versões antigas de estilos (seletores duplicados) e pode ser
  enxugado com segurança depois de uma revisão visual.
