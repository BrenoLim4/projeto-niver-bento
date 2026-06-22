-- ============================================================
-- Fazendinha do Bento — Migration: modo caca_tesouro_qr
-- ============================================================
-- Adiciona o novo valor 'caca_tesouro_qr' ao enum
-- modo_apresentacao_tv, usado pela coluna config.modo_apresentacao.
--
-- Executar no SQL Editor do Supabase.
-- ALTER TYPE ADD VALUE é idempotente com IF NOT EXISTS (PG 9.1+).
-- ============================================================

ALTER TYPE modo_apresentacao_tv ADD VALUE IF NOT EXISTS 'caca_tesouro_qr';
