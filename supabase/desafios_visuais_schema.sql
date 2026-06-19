-- ============================================================
-- Fazendinha do Bento — Desafios Visuais Avulsos (Schema)
-- ============================================================
-- Executar no SQL Editor do Supabase APÓS tesouro_schema.sql.
-- Script idempotente: pode ser executado novamente sem erro.
--
-- Reutiliza a tabela tesouro_charadas para os desafios.
-- Cria apenas a tabela de tentativas avulsas.
-- ============================================================

-- ------------------------------------------------------------
-- Tabela: desafios_tentativas
-- Registra cada vez que um desafio visual é lançado de forma
-- independente (fora da Caça ao Tesouro).
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS desafios_tentativas (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  charada_id        uuid        NOT NULL REFERENCES tesouro_charadas(id),
  participante_nome text        NOT NULL,
  status            text        NOT NULL DEFAULT 'aguardando_tv'
                                CHECK (status IN ('aguardando_tv','aguardando_resposta','respondida')),
  resposta          text        CHECK (resposta IN ('A','B','C','D') OR resposta IS NULL),
  correta           boolean,
  created_at        timestamptz NOT NULL DEFAULT now()
);

-- Coluna opcional para associar um prêmio ao desafio (com premiação)
ALTER TABLE desafios_tentativas
  ADD COLUMN IF NOT EXISTS premio_id uuid REFERENCES premios(id);

-- Index para listar do mais recente
CREATE INDEX IF NOT EXISTS idx_desafios_tentativas_created
  ON desafios_tentativas(created_at DESC);

-- Realtime — sem isso o Supabase não envia eventos para a TV
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE desafios_tentativas;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- RLS: permissivo para evento presencial privado
ALTER TABLE desafios_tentativas ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'desafios_tentativas'
      AND policyname = 'desafios_tentativas_anon_all'
  ) THEN
    CREATE POLICY desafios_tentativas_anon_all
      ON desafios_tentativas
      FOR ALL
      TO anon
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;
