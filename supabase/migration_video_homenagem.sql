-- ============================================================
-- Fazendinha do Bento — Migration: modo video_homenagem
-- ============================================================
-- Adiciona o novo valor 'video_homenagem' ao enum
-- modo_apresentacao_tv, usado pela coluna config.modo_apresentacao.
--
-- Executar no SQL Editor do Supabase.
-- ALTER TYPE ADD VALUE é idempotente com IF NOT EXISTS (PG 9.1+).
-- ============================================================

ALTER TYPE modo_apresentacao_tv ADD VALUE IF NOT EXISTS 'video_homenagem';
