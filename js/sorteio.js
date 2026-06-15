// Regras de sorteio e elegibilidade de prêmios (ver ROADMAP.md, seção 1.6).
//
// Pool de sorteio = prêmios que atendem todas as condições:
// - status = 'disponivel'
// - bloqueado = false
// - is_tesouro = false
// - elegivel_para vazio/null (universal) OU contém o tipo da brincadeira atual
//
// Reutilizado pelas telas de Pescaria, Jogo da Memória, Premiação Livre,
// Roleta e Corrida (Fases 9-13).

import { supabase } from './supabaseClient.js';

// Busca o pool de prêmios elegíveis para um tipo de brincadeira.
export async function buscarPoolElegivel(tipoBrincadeira) {
  const { data, error } = await supabase
    .from('premios')
    .select('*')
    .eq('status', 'disponivel')
    .eq('bloqueado', false)
    .eq('is_tesouro', false);

  if (error) throw error;

  return (data ?? []).filter((premio) => {
    const elegivel = premio.elegivel_para;
    return !elegivel || elegivel.length === 0 || elegivel.includes(tipoBrincadeira);
  });
}

// Sorteia um prêmio elegível para o tipo de brincadeira informado.
// Retorna `null` se o pool estiver vazio (a UI deve informar claramente,
// sem fallback automático para outra categoria).
export async function sortearPremio(tipoBrincadeira) {
  const pool = await buscarPoolElegivel(tipoBrincadeira);
  if (pool.length === 0) return null;

  const indice = Math.floor(Math.random() * pool.length);
  return pool[indice];
}

// Marca o prêmio sorteado/escolhido como 'reservado', impedindo que seja
// sorteado novamente antes de ser entregue.
export async function reservarPremio(premioId) {
  const { data, error } = await supabase
    .from('premios')
    .update({ status: 'reservado' })
    .eq('id', premioId)
    .select()
    .single();

  if (error) throw error;
  return data;
}
