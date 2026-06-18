-- Migration: sincronização TV↔celular na Caça ao Tesouro
-- Adiciona o status 'aguardando_tv' ao CHECK constraint de tesouro_tentativas.
-- Execute este script no SQL Editor do Supabase (uma única vez).

ALTER TABLE tesouro_tentativas
  DROP CONSTRAINT IF EXISTS tesouro_tentativas_status_check;

ALTER TABLE tesouro_tentativas
  ADD CONSTRAINT tesouro_tentativas_status_check
  CHECK (status IN ('aguardando_tv','aguardando_resposta','respondida','correta','incorreta','expirada'));

ALTER TABLE tesouro_tentativas
  ALTER COLUMN status SET DEFAULT 'aguardando_tv';
