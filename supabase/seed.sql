-- ============================================================
-- Fazendinha do Bento — Seed
-- ============================================================
-- Executar após schema.sql e migrações.
-- ATENÇÃO: limpa qr_codes, eventos, premios e config antes de
-- reinserir. Dados da caça ao tesouro (tesouro_participantes,
-- tesouro_animais, etc.) não são apagados.
-- ============================================================

-- ------------------------------------------------------------
-- Limpeza (ordem respeitando FK)
-- ------------------------------------------------------------
delete from qr_codes;
delete from eventos;
delete from premios;
delete from config;

-- ============================================================
-- Prêmios Comuns — 18 unidades
-- PC01-PC10 : paçoquita + bis + serenata
-- PC11-PC18 : moreninha + paçoquita
-- ============================================================
insert into premios (codigo, nome, descricao, imagem_url, categoria, status, elegivel_para, bloqueado, is_tesouro) values

  -- PC01-PC05 → pescaria (5 comuns)
  ('PC01', 'Kit Doce Fazendinha', 'Paçoquita + bis + serenata',
   'https://zbfomfbaywbrbaatglsc.supabase.co/storage/v1/object/public/premios/PC01%20-%20premio%20comum.png',
   'comum', 'disponivel', '["pescaria"]', false, false),
  ('PC02', 'Kit Doce Fazendinha', 'Paçoquita + bis + serenata',
   'https://zbfomfbaywbrbaatglsc.supabase.co/storage/v1/object/public/premios/PC01%20-%20premio%20comum.png',
   'comum', 'disponivel', '["pescaria"]', false, false),
  ('PC03', 'Kit Doce Fazendinha', 'Paçoquita + bis + serenata',
   'https://zbfomfbaywbrbaatglsc.supabase.co/storage/v1/object/public/premios/PC01%20-%20premio%20comum.png',
   'comum', 'disponivel', '["pescaria"]', false, false),
  ('PC04', 'Kit Doce Fazendinha', 'Paçoquita + bis + serenata',
   'https://zbfomfbaywbrbaatglsc.supabase.co/storage/v1/object/public/premios/PC01%20-%20premio%20comum.png',
   'comum', 'disponivel', '["pescaria"]', false, false),
  ('PC05', 'Kit Doce Fazendinha', 'Paçoquita + bis + serenata',
   'https://zbfomfbaywbrbaatglsc.supabase.co/storage/v1/object/public/premios/PC01%20-%20premio%20comum.png',
   'comum', 'disponivel', '["pescaria"]', false, false),

  -- PC06-PC08 → roleta (3 comuns)
  ('PC06', 'Kit Doce Fazendinha', 'Paçoquita + bis + serenata',
   'https://zbfomfbaywbrbaatglsc.supabase.co/storage/v1/object/public/premios/PC01%20-%20premio%20comum.png',
   'comum', 'disponivel', '["roleta"]', false, false),
  ('PC07', 'Kit Doce Fazendinha', 'Paçoquita + bis + serenata',
   'https://zbfomfbaywbrbaatglsc.supabase.co/storage/v1/object/public/premios/PC01%20-%20premio%20comum.png',
   'comum', 'disponivel', '["roleta"]', false, false),
  ('PC08', 'Kit Doce Fazendinha', 'Paçoquita + bis + serenata',
   'https://zbfomfbaywbrbaatglsc.supabase.co/storage/v1/object/public/premios/PC01%20-%20premio%20comum.png',
   'comum', 'disponivel', '["roleta"]', false, false),

  -- PC09-PC11 → corrida (3 comuns: 2 do tipo PC-01 + 1 do tipo PC-02)
  ('PC09', 'Kit Doce Fazendinha', 'Paçoquita + bis + serenata',
   'https://zbfomfbaywbrbaatglsc.supabase.co/storage/v1/object/public/premios/PC01%20-%20premio%20comum.png',
   'comum', 'disponivel', '["corrida"]', false, false),
  ('PC10', 'Kit Doce Fazendinha', 'Paçoquita + bis + serenata',
   'https://zbfomfbaywbrbaatglsc.supabase.co/storage/v1/object/public/premios/PC01%20-%20premio%20comum.png',
   'comum', 'disponivel', '["corrida"]', false, false),
  ('PC11', 'Kit Doce Moreninha', 'Moreninha + paçoquita',
   'https://zbfomfbaywbrbaatglsc.supabase.co/storage/v1/object/public/premios/PC02%20-%20premio%20comum.png',
   'comum', 'disponivel', '["corrida"]', false, false),

  -- PC12-PC16 → livre / desafios (5 comuns)
  ('PC12', 'Kit Doce Moreninha', 'Moreninha + paçoquita',
   'https://zbfomfbaywbrbaatglsc.supabase.co/storage/v1/object/public/premios/PC02%20-%20premio%20comum.png',
   'comum', 'disponivel', '["livre"]', false, false),
  ('PC13', 'Kit Doce Moreninha', 'Moreninha + paçoquita',
   'https://zbfomfbaywbrbaatglsc.supabase.co/storage/v1/object/public/premios/PC02%20-%20premio%20comum.png',
   'comum', 'disponivel', '["livre"]', false, false),
  ('PC14', 'Kit Doce Moreninha', 'Moreninha + paçoquita',
   'https://zbfomfbaywbrbaatglsc.supabase.co/storage/v1/object/public/premios/PC02%20-%20premio%20comum.png',
   'comum', 'disponivel', '["livre"]', false, false),
  ('PC15', 'Kit Doce Moreninha', 'Moreninha + paçoquita',
   'https://zbfomfbaywbrbaatglsc.supabase.co/storage/v1/object/public/premios/PC02%20-%20premio%20comum.png',
   'comum', 'disponivel', '["livre"]', false, false),
  ('PC16', 'Kit Doce Moreninha', 'Moreninha + paçoquita',
   'https://zbfomfbaywbrbaatglsc.supabase.co/storage/v1/object/public/premios/PC02%20-%20premio%20comum.png',
   'comum', 'disponivel', '["livre"]', false, false),

  -- PC17-PC18 → dança das cadeiras (2 comuns)
  ('PC17', 'Kit Doce Moreninha', 'Moreninha + paçoquita',
   'https://zbfomfbaywbrbaatglsc.supabase.co/storage/v1/object/public/premios/PC02%20-%20premio%20comum.png',
   'comum', 'disponivel', '["danca"]', false, false),
  ('PC18', 'Kit Doce Moreninha', 'Moreninha + paçoquita',
   'https://zbfomfbaywbrbaatglsc.supabase.co/storage/v1/object/public/premios/PC02%20-%20premio%20comum.png',
   'comum', 'disponivel', '["danca"]', false, false);

-- ============================================================
-- Prêmios Raros — 9 unidades
-- PR01-PR04 : barra de chocolate
-- PR05-PR06 : caixa de bis
-- PR07-PR09 : kit moreninha + serenata + paçoquita + bis
-- ============================================================
insert into premios (codigo, nome, descricao, imagem_url, categoria, status, elegivel_para, bloqueado, is_tesouro) values

  -- PR01-PR03 → pescaria (3 raros)
  ('PR01', 'Barra de Chocolate Fazendinha', 'Barra de chocolate',
   'https://zbfomfbaywbrbaatglsc.supabase.co/storage/v1/object/public/premios/PR01%20-%20Barra%20chocolate.png',
   'raro', 'disponivel', '["pescaria"]', false, false),
  ('PR02', 'Barra de Chocolate Fazendinha', 'Barra de chocolate',
   'https://zbfomfbaywbrbaatglsc.supabase.co/storage/v1/object/public/premios/PR01%20-%20Barra%20chocolate.png',
   'raro', 'disponivel', '["pescaria"]', false, false),
  ('PR03', 'Barra de Chocolate Fazendinha', 'Barra de chocolate',
   'https://zbfomfbaywbrbaatglsc.supabase.co/storage/v1/object/public/premios/PR01%20-%20Barra%20chocolate.png',
   'raro', 'disponivel', '["pescaria"]', false, false),

  -- PR04 → roleta (1 raro)
  ('PR04', 'Barra de Chocolate Fazendinha', 'Barra de chocolate',
   'https://zbfomfbaywbrbaatglsc.supabase.co/storage/v1/object/public/premios/PR01%20-%20Barra%20chocolate.png',
   'raro', 'disponivel', '["roleta"]', false, false),

  -- PR05 → corrida (1 raro)
  ('PR05', 'Caixa de Bis Fazendinha', 'Caixa de bis',
   'https://zbfomfbaywbrbaatglsc.supabase.co/storage/v1/object/public/premios/PR02%20-%20Caixa%20de%20bis.png',
   'raro', 'disponivel', '["corrida"]', false, false),

  -- PR06 → dança das cadeiras (1 raro)
  ('PR06', 'Caixa de Bis Fazendinha', 'Caixa de bis',
   'https://zbfomfbaywbrbaatglsc.supabase.co/storage/v1/object/public/premios/PR02%20-%20Caixa%20de%20bis.png',
   'raro', 'disponivel', '["danca"]', false, false),

  -- PR07-PR09 → livre / desafios (3 raros)
  ('PR07', 'Kit Doce Especial', 'Moreninha + serenata + paçoquita + bis',
   'https://zbfomfbaywbrbaatglsc.supabase.co/storage/v1/object/public/premios/PR03%20-%20kit.png',
   'raro', 'disponivel', '["livre"]', false, false),
  ('PR08', 'Kit Doce Especial', 'Moreninha + serenata + paçoquita + bis',
   'https://zbfomfbaywbrbaatglsc.supabase.co/storage/v1/object/public/premios/PR03%20-%20kit.png',
   'raro', 'disponivel', '["livre"]', false, false),
  ('PR09', 'Kit Doce Especial', 'Moreninha + serenata + paçoquita + bis',
   'https://zbfomfbaywbrbaatglsc.supabase.co/storage/v1/object/public/premios/PR03%20-%20kit.png',
   'raro', 'disponivel', '["livre"]', false, false);

-- ============================================================
-- Prêmios Lendários — 5 unidades
-- PL01-PL03 : Xícara Fazendinha recheada (tipo PL-01)
-- PL04      : Pote Vaquinha recheado    (tipo PL-02)
-- PL05      : Squeezeer da fazendinha   (tipo PL-03 → corrida)
-- ============================================================
insert into premios (codigo, nome, descricao, imagem_url, categoria, status, elegivel_para, bloqueado, is_tesouro) values

  -- PL01 → pescaria (1 lendário)
  ('PL01', 'Xícara Fazendinha Recheada', 'Xícara fazendinha cheia de bis, serenata e paçoquita',
   'https://zbfomfbaywbrbaatglsc.supabase.co/storage/v1/object/public/premios/PL01%20-%20Xicara%20fazendinha%20recheada.png',
   'lendario', 'disponivel', '["pescaria"]', false, false),

  -- PL02 → roleta (1 lendário)
  ('PL02', 'Xícara Fazendinha Recheada', 'Xícara fazendinha cheia de bis, serenata e paçoquita',
   'https://zbfomfbaywbrbaatglsc.supabase.co/storage/v1/object/public/premios/PL01%20-%20Xicara%20fazendinha%20recheada.png',
   'lendario', 'disponivel', '["roleta"]', false, false),

  -- PL03-PL04 → livre / desafios (2 lendários)
  ('PL03', 'Xícara Fazendinha Recheada', 'Xícara fazendinha cheia de bis, serenata e paçoquita',
   'https://zbfomfbaywbrbaatglsc.supabase.co/storage/v1/object/public/premios/PL01%20-%20Xicara%20fazendinha%20recheada.png',
   'lendario', 'disponivel', '["livre"]', false, false),
  ('PL04', 'Pote Vaquinha Recheado', 'Pote vaquinha recheado com doces',
   'https://zbfomfbaywbrbaatglsc.supabase.co/storage/v1/object/public/premios/PL02%20-%20Pote%20vaqinha%20recheada.png',
   'lendario', 'disponivel', '["livre"]', false, false),

  -- PL05 → corrida (1 lendário — tipo PL-03, Squeezeer da fazendinha)
  ('PL05', 'Squeezeer da Fazendinha', 'Squeezeer trator temático da festa',
   'https://zbfomfbaywbrbaatglsc.supabase.co/storage/v1/object/public/premios/PL03%20-%20Squezeer%20trator.png',
   'lendario', 'disponivel', '["corrida"]', false, false);

-- ============================================================
-- Tesouro da Fazenda — 1 unidade (caça ao tesouro)
-- ============================================================
insert into premios (codigo, nome, descricao, imagem_url, categoria, status, elegivel_para, bloqueado, is_tesouro) values
  ('PT01', 'Tesouro da Fazenda',
   'Cesta completa: xícara fazendinha + pote vaquinha + caixa de bis',
   null,
   'lendario', 'disponivel', '[]', false, true);

-- ============================================================
-- Config
-- ============================================================
insert into config (id, modo_apresentacao, tesouro_status, pin_dashboard, festa_ativa)
values (1, 'hall_da_fama', 'nao_encontrado', '1234', true);

-- ============================================================
-- QR Codes da Pescaria — 9 peixes (grade 3×3)
-- Ordem: 5 comuns → 3 raros → 1 lendário
-- ============================================================
insert into qr_codes (codigo, tipo_qr, premio_id, usado)
select 'QR-PEIXE-01', 'fixo'::tipo_qr, id, false from premios where codigo = 'PC01';

insert into qr_codes (codigo, tipo_qr, premio_id, usado)
select 'QR-PEIXE-02', 'fixo'::tipo_qr, id, false from premios where codigo = 'PC02';

insert into qr_codes (codigo, tipo_qr, premio_id, usado)
select 'QR-PEIXE-03', 'fixo'::tipo_qr, id, false from premios where codigo = 'PC03';

insert into qr_codes (codigo, tipo_qr, premio_id, usado)
select 'QR-PEIXE-04', 'fixo'::tipo_qr, id, false from premios where codigo = 'PC04';

insert into qr_codes (codigo, tipo_qr, premio_id, usado)
select 'QR-PEIXE-05', 'fixo'::tipo_qr, id, false from premios where codigo = 'PC05';

insert into qr_codes (codigo, tipo_qr, premio_id, usado)
select 'QR-PEIXE-06', 'fixo'::tipo_qr, id, false from premios where codigo = 'PR01';

insert into qr_codes (codigo, tipo_qr, premio_id, usado)
select 'QR-PEIXE-07', 'fixo'::tipo_qr, id, false from premios where codigo = 'PR02';

insert into qr_codes (codigo, tipo_qr, premio_id, usado)
select 'QR-PEIXE-08', 'fixo'::tipo_qr, id, false from premios where codigo = 'PR03';

insert into qr_codes (codigo, tipo_qr, premio_id, usado)
select 'QR-PEIXE-09', 'fixo'::tipo_qr, id, false from premios where codigo = 'PL01';
