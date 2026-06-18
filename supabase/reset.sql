-- ============================================================
-- Fazendinha do Bento — Reset (volta ao estado inicial)
-- ============================================================
-- Executa na ordem correta para respeitar as foreign keys:
--   1. Limpa eventos
--   2. Reseta QR codes (usado=false, evento_id=null)
--   3. Reseta prêmios para 'disponivel'
--   4. Reseta config para os valores padrão
--
-- Prêmios e QR codes cadastrados NÃO são removidos.
-- Fotos no Supabase Storage devem ser removidas manualmente
-- pelo painel do Supabase (bucket "fotos"), se desejado.
-- ============================================================

-- 1. Remove todos os eventos
delete from eventos;

-- 2. Reseta todos os QR codes para o estado inicial
update qr_codes
set usado = false,
    evento_id = null;

-- 3. Reseta todos os prêmios para disponível
update premios
set status    = 'disponivel',
    bloqueado = false;

-- 4. Reseta config para o estado inicial
update config
set modo_apresentacao = 'hall_da_fama',
    tesouro_status    = 'nao_encontrado',
    festa_ativa       = true
where id = 1;
