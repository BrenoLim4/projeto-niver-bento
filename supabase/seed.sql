-- ============================================================
-- Fazendinha do Bento — Seed (FASE 2)
-- ============================================================
-- Executar depois de schema.sql. Idempotente via ON CONFLICT.
--
-- Mistura de categorias (comum/raro/lendario), variando
-- `elegivel_para` para exercitar as regras de sorteio da secao 1.6
-- do ROADMAP, alem de 1 premio com is_tesouro=true (Tesouro da
-- Fazenda, nunca entra em sorteio).
-- ============================================================

insert into premios (codigo, nome, descricao, categoria, status, elegivel_para, bloqueado, is_tesouro) values
  ('P-001', 'Adesivos da Fazendinha', 'Cartela de adesivos temáticos da festa', 'comum', 'disponivel', '[]', false, false),
  ('P-002', 'Pulseira do Bento', 'Pulseira de lembrança personalizada', 'comum', 'disponivel', '[]', false, false),
  ('P-003', 'Bexiga Personalizada', 'Bexiga com a arte da Fazendinha do Bento', 'comum', 'disponivel', '[]', false, false),
  ('P-004', 'Squeeze da Fazendinha', 'Garrafinha temática para os convidados', 'comum', 'disponivel', '["pescaria", "livre"]', false, false),
  ('P-005', 'Chaveiro Galinha', 'Chaveiro em formato de galinha', 'comum', 'disponivel', '["memoria"]', false, false),
  ('P-006', 'Tatuagem Temporária da Fazenda', 'Cartela de tatuagens temáticas', 'comum', 'disponivel', '[]', false, false),
  ('P-007', 'Pirulito Personalizado', 'Pirulito com etiqueta da festa', 'comum', 'disponivel', '["pescaria"]', false, false),
  ('P-008', 'Pochete da Fazendinha', 'Pochete temática para guardar os mimos', 'comum', 'disponivel', '[]', false, false),
  ('P-009', 'Cavalo de Pelúcia', 'Pelúcia de cavalo, mesmo modelo do pônei do Bento', 'raro', 'disponivel', '["roleta", "livre"]', false, false),
  ('P-010', 'Quebra-Cabeça da Fazenda', 'Quebra-cabeça com os animais da fazenda', 'raro', 'disponivel', '["memoria", "livre"]', false, false),
  ('P-011', 'Kit Pintura Fazendinha', 'Kit de pintura com temas de animais', 'raro', 'disponivel', '[]', false, false),
  ('P-012', 'Chapéu de Palha Mini', 'Réplica em miniatura do chapéu do Bento', 'raro', 'disponivel', '["corrida", "livre"]', false, false),
  ('P-013', 'Livro "O Dia do Bento na Fazenda"', 'Livro infantil ilustrado exclusivo da festa', 'raro', 'disponivel', '[]', false, false),
  ('P-014', 'Caneca Fazendinha do Bento', 'Caneca personalizada com a arte da festa', 'lendario', 'disponivel', '["pescaria"]', false, false),
  ('P-015', 'Kit Fazendinha Deluxe', 'Kit completo: pelúcia + livro + brinquedos da fazenda', 'lendario', 'disponivel', '[]', false, false),
  ('P-016', 'Tesouro da Fazenda', 'Prêmio especial e único, liberado apenas pelo organizador', 'lendario', 'disponivel', '[]', false, true)
on conflict (codigo) do nothing;

insert into config (id, modo_apresentacao, tesouro_status, pin_dashboard, festa_ativa)
values (1, 'hall_da_fama', 'nao_encontrado', '1234', true)
on conflict (id) do nothing;
