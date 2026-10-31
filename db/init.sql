-- Estrutura do banco usada pelas rotas /api/pdi e /api/config (Drizzle ORM).
-- As definições aqui espelham lib/db/schema.ts.
--
-- Uso:
--   createdb pdi_conect
--   psql "postgresql://usuario:senha@localhost:5432/pdi_conect" -f db/init.sql
--
-- Nenhum dado de exemplo é inserido: o sistema começa vazio e é preenchido
-- pela própria aplicação.

-- gen_random_uuid() já vem no Postgres 13+. Em versões anteriores, rode antes:
--   create extension if not exists "pgcrypto";

-- Um workspace por estudante (o id do workspace é o id do estudante).
create table if not exists pdi_workspaces (
  id uuid primary key default gen_random_uuid(),
  student_name text not null,
  role_order jsonb not null default '["Aluno","Professor","Família","Profissional da saúde"]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists pdi_entries (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references pdi_workspaces (id) on delete cascade,
  area text not null,
  section_key text not null,
  content text not null default '',
  format text not null default 'descritivo',
  author_name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pdi_entries_entry_key unique (workspace_id, area, section_key, author_name)
);

create index if not exists pdi_entries_workspace_idx on pdi_entries (workspace_id);

-- Configuração administrativa: usuários, estudantes, permissões, campos e histórico.
create table if not exists pdi_config (
  id text primary key,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);
