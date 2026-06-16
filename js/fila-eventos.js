// Fila de eventos da TV (ver ROADMAP.md, seção 7).
//
// Fonte de verdade: `eventos.status`. A TV nunca interrompe uma animação em
// andamento; eventos pendentes entram em fila e são processados 1 a 1, em
// ordem de `created_at`.

import { supabase } from './supabaseClient.js';

const fila = [];
let processando = false;
let onProcessarEvento = null;

// Define o callback executado para cada evento processado.
// `onProcessarEvento(evento)` deve retornar uma Promise que resolve quando a
// animação/revelação terminar (a Fase 5 substitui o placeholder atual).
export function configurarFila({ onProcessarEvento: callback }) {
  onProcessarEvento = callback;
}

// Boot da TV: qualquer evento travado em 'processing' (TV recarregada no meio
// de uma animação) volta para 'pending'; monta a fila local com os pendentes.
export async function carregarFilaInicial() {
  await supabase.from('eventos').update({ status: 'pending' }).eq('status', 'processing');

  const { data, error } = await supabase
    .from('eventos')
    .select('*')
    .in('status', ['pending', 'processing'])
    .order('created_at', { ascending: true });

  if (error) throw error;

  fila.push(...(data ?? []));
  processarProximo();
}

// Re-sincroniza a fila após reconexão do Realtime: reseta processing→pending e
// injeta na fila local apenas eventos ainda não presentes (evita duplicatas).
export async function ressincronizarFila() {
  await supabase.from('eventos').update({ status: 'pending' }).eq('status', 'processing');

  const { data, error } = await supabase
    .from('eventos')
    .select('*')
    .in('status', ['pending', 'processing'])
    .order('created_at', { ascending: true });

  if (error) return;

  const idsNaFila = new Set(fila.map((e) => e.id));
  const novos = (data ?? []).filter((e) => !idsNaFila.has(e.id));
  if (novos.length > 0) fila.push(...novos);
  processarProximo();
}

// Novo evento recebido via Realtime ('INSERT', status='pending').
export function adicionarEvento(evento) {
  fila.push(evento);
  processarProximo();
}

export function estaProcessando() {
  return processando;
}

async function processarProximo() {
  if (processando || fila.length === 0 || !onProcessarEvento) return;

  processando = true;
  const evento = fila.shift();

  try {
    await supabase.from('eventos').update({ status: 'processing' }).eq('id', evento.id);
    await onProcessarEvento(evento);
    await supabase
      .from('eventos')
      .update({ status: 'revealed', revealed_at: new Date().toISOString() })
      .eq('id', evento.id);
  } finally {
    processando = false;
    processarProximo();
  }
}
