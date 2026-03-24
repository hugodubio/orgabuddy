-- Correr no Supabase Dashboard → SQL Editor

create table if not exists tasks (
  id bigserial primary key,
  text text not null,
  projects jsonb not null default '[]',
  priority text not null,
  reason text,
  type text default 'tarefa',
  done boolean default false,
  source text default 'manual',
  source_email_id text,
  links jsonb not null default '[]',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists notes (
  date text primary key,
  content text default '',
  updated_at timestamptz default now()
);

create table if not exists projects (
  id text primary key,
  label text not null,
  color_bg text not null,
  color_text text not null,
  dot_color text not null,
  created_at timestamptz default now()
);

-- Desativar RLS (app pessoal, acesso via anon key)
alter table tasks disable row level security;
alter table notes disable row level security;
alter table projects disable row level security;

-- Projetos por defeito
insert into projects (id, label, color_bg, color_text, dot_color) values
  ('arroz',    'Arroz',       '#dbeafe', '#1e40af', '#3b82f6'),
  ('mystic',   'Mystic Fyah', '#d1fae5', '#065f46', '#10b981'),
  ('estudio',  'Estúdio',     '#ede9fe', '#5b21b6', '#8b5cf6'),
  ('subciety', 'Subciety',    '#ffedd5', '#9a3412', '#f97316'),
  ('vida',     'Vida',        '#fce7f3', '#9d174d', '#ec4899')
on conflict (id) do nothing;
