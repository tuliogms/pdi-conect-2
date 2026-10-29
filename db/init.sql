-- Estrutura mínima do banco usada por app/api/pdi/route.ts (Drizzle ORM).
-- As definições aqui espelham lib/db/schema.ts.
--
-- Uso:
--   createdb pdi_conect
--   psql "postgresql://usuario:senha@localhost:5432/pdi_conect" -f db/init.sql

create extension if not exists "pgcrypto";

create table if not exists pdi_workspaces (
  id uuid primary key default gen_random_uuid(),
  student_name text not null default 'João da Silva',
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
  author_name text not null default 'João da Silva',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pdi_entries_entry_key unique (workspace_id, area, section_key, author_name)
);

create index if not exists pdi_entries_workspace_idx on pdi_entries (workspace_id);

-- workspace fixo usado pela API nesta versão
insert into pdi_workspaces (id)
values ('00000000-0000-0000-0000-000000000001')
on conflict do nothing;
