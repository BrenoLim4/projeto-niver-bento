import { supabase } from './supabaseClient.js';
import { subscribeEstatisticas as subscribeStats } from './realtime.js';

export async function buscarEstatisticas() {
  const { data, error } = await supabase.from('vw_estatisticas').select('*').single();
  if (error) throw error;
  return data;
}

function preencherEl(el, valor) {
  if (!el) return;
  const novo = String(valor ?? 0);
  if (el.textContent === novo) return;
  el.textContent = novo;
  el.classList.remove('stat-atualizado');
  void el.offsetWidth; // reflow para reiniciar a animação CSS
  el.classList.add('stat-atualizado');
}

export function renderizarEstatisticas(stats, els) {
  preencherEl(els.totalEventos,    stats.total_eventos);
  preencherEl(els.totalEntregues,  stats.total_entregues);
  preencherEl(els.totalAguardando, stats.total_aguardando_entrega);
  preencherEl(els.totalAndamento,  stats.total_em_andamento);
  preencherEl(els.totalComuns,     stats.total_comuns);
  preencherEl(els.totalRaros,      stats.total_raros);
  preencherEl(els.totalLendarios,  stats.total_lendarios);
}

export async function inicializarEstatisticas(els) {
  async function recarregar() {
    try {
      const stats = await buscarEstatisticas();
      renderizarEstatisticas(stats, els);
    } catch (err) {
      console.error('Erro ao carregar estatísticas:', err);
    }
  }

  await recarregar();
  subscribeStats(recarregar);
}
