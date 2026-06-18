-- ============================================================
-- Fazendinha do Bento — Caça ao Tesouro (Schema + Seeds)
-- ============================================================
-- Executar no SQL Editor do Supabase APÓS schema.sql e seed.sql.
-- Script idempotente: pode ser executado novamente sem erro.
--
-- RLS: policies permissivas para anon (leitura e escrita).
-- Decisão aceita conscientemente: evento privado, curto.
-- ============================================================

-- ------------------------------------------------------------
-- Novo valor no enum modo_apresentacao_tv
-- (ALTER TYPE ADD VALUE é idempotente com IF NOT EXISTS no PG 9.1+)
-- ------------------------------------------------------------
ALTER TYPE modo_apresentacao_tv ADD VALUE IF NOT EXISTS 'caca_tesouro';

-- ------------------------------------------------------------
-- Novas colunas na tabela config (idempotente)
-- ------------------------------------------------------------
ALTER TABLE config
  ADD COLUMN IF NOT EXISTS tesouro_min_animais int NOT NULL DEFAULT 3;

ALTER TABLE config
  ADD COLUMN IF NOT EXISTS tesouro_vencedor_participante_id uuid;

-- ------------------------------------------------------------
-- Tabela: tesouro_participantes
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tesouro_participantes (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome       text NOT NULL,
  foto_url   text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- Tabela: tesouro_animais
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tesouro_animais (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo     text UNIQUE NOT NULL,
  nome       text NOT NULL,
  emoji      text,
  imagem_url text,
  ativo      boolean NOT NULL DEFAULT true,
  ordem      int,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- Tabela: tesouro_participante_animais
-- Registra quais animais cada participante encontrou.
-- Um animal só pode ser encontrado por um único participante.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tesouro_participante_animais (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participante_id uuid NOT NULL REFERENCES tesouro_participantes(id),
  animal_id       uuid NOT NULL REFERENCES tesouro_animais(id),
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE(participante_id, animal_id)
);

CREATE INDEX IF NOT EXISTS idx_tpa_participante ON tesouro_participante_animais(participante_id);
CREATE INDEX IF NOT EXISTS idx_tpa_animal       ON tesouro_participante_animais(animal_id);

-- ------------------------------------------------------------
-- Tabela: tesouro_charadas
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tesouro_charadas (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pergunta        text NOT NULL,
  alternativa_a   text NOT NULL,
  alternativa_b   text NOT NULL,
  alternativa_c   text NOT NULL,
  alternativa_d   text NOT NULL,
  resposta_correta text NOT NULL CHECK (resposta_correta IN ('A','B','C','D')),
  ativo           boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- Tabela: tesouro_tentativas
-- Uma tentativa é criada quando um participante elegível
-- escaneia o QR-TESOURO e recebe a charada final.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tesouro_tentativas (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participante_id uuid NOT NULL REFERENCES tesouro_participantes(id),
  charada_id      uuid NOT NULL REFERENCES tesouro_charadas(id),
  status          text NOT NULL DEFAULT 'aguardando_resposta'
                  CHECK (status IN ('aguardando_resposta','respondida','correta','incorreta','expirada')),
  resposta        text CHECK (resposta IN ('A','B','C','D')),
  correta         boolean,
  cooldown_until  timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  answered_at     timestamptz
);

CREATE INDEX IF NOT EXISTS idx_tt_participante ON tesouro_tentativas(participante_id);
CREATE INDEX IF NOT EXISTS idx_tt_status       ON tesouro_tentativas(status);

-- ------------------------------------------------------------
-- Views
-- ------------------------------------------------------------

CREATE OR REPLACE VIEW vw_tesouro_ranking AS
SELECT
  p.id                                          AS participante_id,
  p.nome,
  p.foto_url,
  COUNT(pa.id)                                  AS total_animais_encontrados,
  (SELECT tesouro_min_animais FROM config WHERE id = 1) AS min_animais,
  COUNT(pa.id) >= (SELECT tesouro_min_animais FROM config WHERE id = 1) AS tesouro_desbloqueado,
  MAX(pa.created_at)                            AS ultima_atualizacao
FROM tesouro_participantes p
LEFT JOIN tesouro_participante_animais pa ON pa.participante_id = p.id
GROUP BY p.id, p.nome, p.foto_url
ORDER BY total_animais_encontrados DESC, ultima_atualizacao ASC;

CREATE OR REPLACE VIEW vw_tesouro_estatisticas AS
SELECT
  (SELECT COUNT(*) FROM tesouro_participantes)                            AS total_participantes,
  (SELECT COUNT(*) FROM tesouro_participante_animais)                     AS total_animais_encontrados,
  (
    SELECT COUNT(DISTINCT pa.participante_id)
    FROM tesouro_participante_animais pa
    GROUP BY pa.participante_id
    HAVING COUNT(pa.id) >= (SELECT tesouro_min_animais FROM config WHERE id = 1)
  )                                                                        AS total_desbloqueados,
  (SELECT tesouro_status  FROM config WHERE id = 1)                        AS tesouro_status,
  (
    SELECT tp.nome
    FROM tesouro_participantes tp
    INNER JOIN config c ON c.tesouro_vencedor_participante_id = tp.id
    WHERE c.id = 1
    LIMIT 1
  )                                                                        AS tesouro_vencedor;

-- ------------------------------------------------------------
-- Realtime
-- ------------------------------------------------------------
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE tesouro_tentativas;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE tesouro_participante_animais;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE tesouro_participantes;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ------------------------------------------------------------
-- RLS
-- ------------------------------------------------------------
ALTER TABLE tesouro_participantes         ENABLE ROW LEVEL SECURITY;
ALTER TABLE tesouro_animais               ENABLE ROW LEVEL SECURITY;
ALTER TABLE tesouro_participante_animais  ENABLE ROW LEVEL SECURITY;
ALTER TABLE tesouro_charadas              ENABLE ROW LEVEL SECURITY;
ALTER TABLE tesouro_tentativas            ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tesouro_participantes_anon"        ON tesouro_participantes;
DROP POLICY IF EXISTS "tesouro_animais_anon"              ON tesouro_animais;
DROP POLICY IF EXISTS "tesouro_participante_animais_anon" ON tesouro_participante_animais;
DROP POLICY IF EXISTS "tesouro_charadas_anon"             ON tesouro_charadas;
DROP POLICY IF EXISTS "tesouro_tentativas_anon"           ON tesouro_tentativas;

CREATE POLICY "tesouro_participantes_anon"        ON tesouro_participantes        FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "tesouro_animais_anon"              ON tesouro_animais              FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "tesouro_participante_animais_anon" ON tesouro_participante_animais FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "tesouro_charadas_anon"             ON tesouro_charadas             FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "tesouro_tentativas_anon"           ON tesouro_tentativas           FOR ALL TO anon USING (true) WITH CHECK (true);

-- ------------------------------------------------------------
-- Storage: bucket tesouro-participantes (fotos dos participantes)
-- Reutilizar bucket existente "fotos" não faz sentido aqui porque
-- os arquivos são de participantes da brincadeira, não de ganhadores
-- de premiação. Bucket separado mantém o isolamento.
-- ------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('tesouro-participantes', 'tesouro-participantes', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "tp_bucket_read"   ON storage.objects;
DROP POLICY IF EXISTS "tp_bucket_write"  ON storage.objects;
DROP POLICY IF EXISTS "tp_bucket_update" ON storage.objects;

CREATE POLICY "tp_bucket_read"   ON storage.objects FOR SELECT USING (bucket_id = 'tesouro-participantes');
CREATE POLICY "tp_bucket_write"  ON storage.objects FOR INSERT TO anon WITH CHECK (bucket_id = 'tesouro-participantes');
CREATE POLICY "tp_bucket_update" ON storage.objects FOR UPDATE TO anon USING (bucket_id = 'tesouro-participantes');

-- ------------------------------------------------------------
-- Seeds: 10 animais
-- ------------------------------------------------------------
INSERT INTO tesouro_animais (codigo, nome, emoji, ativo, ordem) VALUES
  ('ANIMAL-VACA',     'Vaca Mimosa',         '🐄', true,  1),
  ('ANIMAL-CAVALO',   'Cavalo Trovão',        '🐴', true,  2),
  ('ANIMAL-PORCO',    'Porquinho Baconzinho', '🐷', true,  3),
  ('ANIMAL-GALINHA',  'Galinha Cocó',         '🐔', true,  4),
  ('ANIMAL-OVELHA',   'Ovelha Floquinha',     '🐑', true,  5),
  ('ANIMAL-CABRA',    'Cabrita Estrelinha',   '🐐', true,  6),
  ('ANIMAL-PATO',     'Patinho Pingo',        '🦆', true,  7),
  ('ANIMAL-PINTINHO', 'Pintinho Amarelinho',  '🐣', true,  8),
  ('ANIMAL-CACHORRO', 'Cachorrinho Rex',      '🐕', true,  9),
  ('ANIMAL-GATO',     'Gatinho Mingau',       '🐱', true, 10)
ON CONFLICT (codigo) DO NOTHING;

-- ============================================================
-- Desafios Visuais — Migração
-- Executar APÓS o bloco acima (idempotente via IF NOT EXISTS
-- e WHERE NOT EXISTS nas seeds).
-- ============================================================

-- ------------------------------------------------------------
-- Novas colunas em tesouro_charadas
-- ------------------------------------------------------------
ALTER TABLE tesouro_charadas
  ADD COLUMN IF NOT EXISTS tipo text NOT NULL DEFAULT 'pergunta'
    CHECK (tipo IN (
      'pergunta',
      'memoria_posicao',
      'memoria_sequencia',
      'identificacao',
      'contagem',
      'visual'
    ));

-- payload_json: dados da sequência visual exibida na TV.
-- Estrutura mínima: { "itens": [...emojis], "tempo_exibicao": <ms> }
ALTER TABLE tesouro_charadas
  ADD COLUMN IF NOT EXISTS payload_json jsonb;

-- ------------------------------------------------------------
-- Seeds: 8 desafios visuais (80 % do pool)
-- WHERE NOT EXISTS evita duplicatas em re-execuções
-- ------------------------------------------------------------
INSERT INTO tesouro_charadas
  (pergunta, alternativa_a, alternativa_b, alternativa_c, alternativa_d,
   resposta_correta, ativo, tipo, payload_json)
SELECT s.pergunta, s.alt_a, s.alt_b, s.alt_c, s.alt_d,
       s.correta, true, s.tipo, s.payload
FROM (VALUES
  -- 1. Memória de posição: sequência de 5, pergunta a 3ª posição
  (
    'Qual símbolo estava na terceira posição?',
    '🐄 Vaca', '🚜 Trator', '🐔 Galinha', '🌽 Milho',
    'B'::text, 'memoria_posicao'::text,
    '{"itens":["🐄","🐷","🚜","🐔","🌽"],"tempo_exibicao":3000}'::jsonb
  ),
  -- 2. Memória de posição: sequência de 5, pergunta a 1ª posição
  (
    'Qual símbolo estava na primeira posição?',
    '🐔 Galinha', '🐄 Vaca', '🚜 Trator', '🦆 Pato',
    'C'::text, 'memoria_posicao'::text,
    '{"itens":["🚜","🐄","🐔","🐷","🦆"],"tempo_exibicao":3000}'::jsonb
  ),
  -- 3. Memória de sequência: 3 animais com →, pergunta o 2º
  (
    'Qual foi o segundo animal da sequência?',
    '🐔 Galinha', '🐄 Vaca', '🐷 Porco', '🌽 Milho',
    'C'::text, 'memoria_sequencia'::text,
    '{"itens":["🐔","🐷","🐄"],"tempo_exibicao":3000}'::jsonb
  ),
  -- 4. Memória de sequência: 4 símbolos com →, pergunta o último
  (
    'Qual símbolo apareceu por último?',
    '🌽 Milho', '🐄 Vaca', '🚜 Trator', '🦆 Pato',
    'D'::text, 'memoria_sequencia'::text,
    '{"itens":["🌽","🚜","🐄","🦆"],"tempo_exibicao":3000}'::jsonb
  ),
  -- 5. Identificação: 5 símbolos, pergunta qual NÃO apareceu
  (
    'Qual destes NÃO apareceu na tela?',
    '🐑 Ovelha', '🐄 Vaca', '🦆 Pato', '🐴 Cavalo',
    'A'::text, 'identificacao'::text,
    '{"itens":["🐄","🐷","🐴","🐔","🦆"],"tempo_exibicao":3000}'::jsonb
  ),
  -- 6. Contagem: quantas vacas aparecem entre 5 símbolos
  (
    'Quantas vacas apareceram?',
    '1', '2', '3', '4',
    'C'::text, 'contagem'::text,
    '{"itens":["🐄","🐄","🐔","🐷","🐄"],"tempo_exibicao":3000}'::jsonb
  ),
  -- 7. Memória de posição: cores de trator, pergunta o 2º
  (
    'Qual cor de trator estava na segunda posição?',
    'Vermelho 🔴', 'Azul 🔵', 'Verde 🟢', 'Amarelo 🟡',
    'B'::text, 'memoria_posicao'::text,
    '{"itens":["🔴","🔵","🟢","🟡"],"tempo_exibicao":3000}'::jsonb
  ),
  -- 8. Contagem: quantos patos aparecem entre 6 símbolos
  (
    'Quantos patos apareceram?',
    '2', '3', '4', '1',
    'B'::text, 'contagem'::text,
    '{"itens":["🦆","🐔","🦆","🐄","🦆","🐷"],"tempo_exibicao":3000}'::jsonb
  )
) AS s(pergunta, alt_a, alt_b, alt_c, alt_d, correta, tipo, payload)
WHERE NOT EXISTS (
  SELECT 1 FROM tesouro_charadas tc WHERE tc.pergunta = s.pergunta
);

-- Desativa qualquer charada tradicional existente (apenas desafios visuais são usados)
UPDATE tesouro_charadas SET ativo = false WHERE tipo = 'pergunta';
