-- ============================================================
-- Fazendinha do Bento — Migration: modo galeria_fotos
-- ============================================================
-- Adiciona o novo valor 'galeria_fotos' ao enum
-- modo_apresentacao_tv, cria o bucket 'fotos-bento' (leitura
-- publica, escrita anon) e habilita Realtime em storage.objects
-- para que a TV receba novas fotos/videos automaticamente.
--
-- Executar no SQL Editor do Supabase.
-- ALTER TYPE ADD VALUE e idempotente com IF NOT EXISTS (PG 9.1+).
-- ============================================================

ALTER TYPE modo_apresentacao_tv ADD VALUE IF NOT EXISTS 'galeria_fotos';

insert into storage.buckets (id, name, public)
values ('fotos-bento', 'fotos-bento', true)
on conflict (id) do nothing;

drop policy if exists "fotos_bento_bucket_read" on storage.objects;
create policy "fotos_bento_bucket_read" on storage.objects for select using (bucket_id = 'fotos-bento');

drop policy if exists "fotos_bento_bucket_write" on storage.objects;
create policy "fotos_bento_bucket_write" on storage.objects for insert to anon with check (bucket_id = 'fotos-bento');

-- Realtime em storage.objects — permite que a TV receba novas
-- fotos/videos via postgres_changes sem precisar de polling.
do $$ begin
  alter publication supabase_realtime add table storage.objects;
exception when duplicate_object then null; end $$;
