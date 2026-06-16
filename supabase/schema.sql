-- ============================================================
-- Fazendinha do Bento — Schema (FASE 2)
-- ============================================================
-- Modelagem conforme ROADMAP.md, secao 3 ("Modelagem do Supabase").
-- Executar no SQL Editor do projeto Supabase. Script idempotente:
-- pode ser executado novamente sem gerar erro.
--
-- RLS: habilitado em todas as tabelas, com policies permissivas para
-- a role `anon` (leitura e escrita). Decisao aceita conscientemente:
-- evento privado, baixo risco. `config.pin_dashboard` e uma trava de
-- UX, nao um mecanismo de seguranca.
-- ============================================================

create extension if not exists pgcrypto;

-- ------------------------------------------------------------
-- Enums
-- ------------------------------------------------------------
do $$ begin
  create type categoria_premio as enum ('comum', 'raro', 'lendario');
exception when duplicate_object then null; end $$;

do $$ begin
  create type status_premio as enum ('disponivel', 'reservado', 'entregue');
exception when duplicate_object then null; end $$;

do $$ begin
  create type tipo_evento as enum ('pescaria', 'memoria', 'roleta', 'corrida', 'livre');
exception when duplicate_object then null; end $$;

do $$ begin
  create type status_evento as enum ('pending', 'processing', 'revealed', 'delivered', 'completed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type tipo_qr as enum ('fixo', 'aleatorio');
exception when duplicate_object then null; end $$;

do $$ begin
  create type modo_apresentacao_tv as enum ('hall_da_fama', 'corrida_animais', 'roleta_fazenda', 'estatisticas');
exception when duplicate_object then null; end $$;

do $$ begin
  create type tesouro_status_enum as enum ('nao_encontrado', 'encontrado');
exception when duplicate_object then null; end $$;

-- ------------------------------------------------------------
-- Tabela: premios
-- ------------------------------------------------------------
create table if not exists premios (
  id uuid primary key default gen_random_uuid(),
  codigo text unique not null,
  nome text not null,
  descricao text,
  imagem_url text,
  categoria categoria_premio not null,
  status status_premio not null default 'disponivel',
  elegivel_para jsonb not null default '[]'::jsonb,
  bloqueado boolean not null default false,
  is_tesouro boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_premios_status on premios (status);
create index if not exists idx_premios_is_tesouro on premios (is_tesouro);

-- ------------------------------------------------------------
-- Tabela: eventos
-- ------------------------------------------------------------
create table if not exists eventos (
  id uuid primary key default gen_random_uuid(),
  tipo tipo_evento not null,
  premio_id uuid references premios(id),
  premio_codigo text,
  premio_nome text,
  premio_imagem_url text,
  premio_categoria categoria_premio,
  vencedor text not null,
  status status_evento not null default 'pending',
  foto_url text,
  metadata jsonb,
  created_at timestamptz not null default now(),
  revealed_at timestamptz,
  delivered_at timestamptz,
  completed_at timestamptz
);

create index if not exists idx_eventos_status on eventos (status);
create index if not exists idx_eventos_created_at on eventos (created_at);

-- ------------------------------------------------------------
-- Tabela: qr_codes
-- ------------------------------------------------------------
create table if not exists qr_codes (
  id uuid primary key default gen_random_uuid(),
  codigo text unique not null,
  tipo_qr tipo_qr not null,
  premio_id uuid references premios(id),
  usado boolean not null default false,
  evento_id uuid references eventos(id),
  created_at timestamptz not null default now(),
  constraint qr_codes_premio_fixo_check check (
    (tipo_qr = 'fixo' and premio_id is not null) or
    (tipo_qr = 'aleatorio' and premio_id is null)
  )
);

create index if not exists idx_qr_codes_usado on qr_codes (usado);

-- ------------------------------------------------------------
-- Tabela: config (linha unica)
-- ------------------------------------------------------------
create table if not exists config (
  id int primary key default 1,
  modo_apresentacao modo_apresentacao_tv not null default 'hall_da_fama',
  tesouro_status tesouro_status_enum not null default 'nao_encontrado',
  pin_dashboard text not null default '1234',
  festa_ativa boolean not null default true,
  constraint config_singleton check (id = 1)
);

-- ------------------------------------------------------------
-- Views
-- ------------------------------------------------------------

-- Hall da Fama: somente eventos entregues/concluidos, usando o
-- snapshot do premio (preserva historico mesmo se o premio mudar).
create or replace view vw_hall_da_fama as
select
  id,
  tipo,
  premio_id,
  premio_codigo,
  premio_nome,
  premio_imagem_url,
  premio_categoria,
  vencedor,
  status,
  foto_url,
  metadata,
  created_at,
  revealed_at,
  delivered_at,
  completed_at,
  coalesce(completed_at, delivered_at) as data_exibicao
from eventos
where status in ('delivered', 'completed')
order by coalesce(completed_at, delivered_at) desc;

-- Entregas Pendentes: eventos revelados, aguardando a Etapa 2.
create or replace view vw_entregas_pendentes as
select
  id,
  tipo,
  premio_id,
  premio_codigo,
  premio_nome,
  premio_imagem_url,
  premio_categoria,
  vencedor,
  metadata,
  created_at,
  revealed_at
from eventos
where status = 'revealed'
order by revealed_at asc;

-- Estatisticas gerais (linha unica).
create or replace view vw_estatisticas as
select
  (select count(*) from eventos) as total_eventos,
  (select count(*) from eventos where status in ('delivered', 'completed')) as total_entregues,
  (select count(*) from eventos where status in ('pending', 'processing')) as total_em_andamento,
  (select count(*) from eventos where status = 'revealed') as total_aguardando_entrega,
  (select count(*) from eventos where status in ('delivered', 'completed') and premio_categoria = 'comum') as total_comuns,
  (select count(*) from eventos where status in ('delivered', 'completed') and premio_categoria = 'raro') as total_raros,
  (select count(*) from eventos where status in ('delivered', 'completed') and premio_categoria = 'lendario') as total_lendarios;

-- ------------------------------------------------------------
-- Realtime — publica INSERT/UPDATE de `eventos` e `config` para
-- que a TV receba `postgres_changes` (ver ROADMAP.md, secao 6).
-- Sem isso, o Supabase Realtime nao envia nenhuma alteracao.
-- ------------------------------------------------------------
do $$ begin
  alter publication supabase_realtime add table eventos;
exception when duplicate_object then null; end $$;

do $$ begin
  alter publication supabase_realtime add table config;
exception when duplicate_object then null; end $$;

do $$ begin
  alter publication supabase_realtime add table qr_codes;
exception when duplicate_object then null; end $$;

-- ------------------------------------------------------------
-- RLS — policies permissivas para anon (leitura e escrita)
-- ------------------------------------------------------------
alter table premios enable row level security;
alter table eventos enable row level security;
alter table qr_codes enable row level security;
alter table config enable row level security;

drop policy if exists "premios_anon_all" on premios;
create policy "premios_anon_all" on premios for all to anon using (true) with check (true);

drop policy if exists "eventos_anon_all" on eventos;
create policy "eventos_anon_all" on eventos for all to anon using (true) with check (true);

drop policy if exists "qr_codes_anon_all" on qr_codes;
create policy "qr_codes_anon_all" on qr_codes for all to anon using (true) with check (true);

drop policy if exists "config_anon_all" on config;
create policy "config_anon_all" on config for all to anon using (true) with check (true);

-- ------------------------------------------------------------
-- Storage: buckets `premios` (imagens dos premios) e
-- `fotos` (fotos dos ganhadores) — leitura publica, escrita anon.
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('premios', 'premios', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('fotos', 'fotos', true)
on conflict (id) do nothing;

drop policy if exists "premios_bucket_read" on storage.objects;
create policy "premios_bucket_read" on storage.objects for select using (bucket_id = 'premios');

drop policy if exists "premios_bucket_write" on storage.objects;
create policy "premios_bucket_write" on storage.objects for insert to anon with check (bucket_id = 'premios');

drop policy if exists "premios_bucket_update" on storage.objects;
create policy "premios_bucket_update" on storage.objects for update to anon using (bucket_id = 'premios');

drop policy if exists "fotos_bucket_read" on storage.objects;
create policy "fotos_bucket_read" on storage.objects for select using (bucket_id = 'fotos');

drop policy if exists "fotos_bucket_write" on storage.objects;
create policy "fotos_bucket_write" on storage.objects for insert to anon with check (bucket_id = 'fotos');

drop policy if exists "fotos_bucket_update" on storage.objects;
create policy "fotos_bucket_update" on storage.objects for update to anon using (bucket_id = 'fotos');
