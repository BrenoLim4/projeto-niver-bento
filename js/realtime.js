// Subscrições Supabase Realtime usadas pela TV e pelo Dashboard (ver
// ROADMAP.md, seção 6).
//
// - `eventos` (INSERT, status='pending') → TV adiciona o evento à fila local.
// - `eventos` (UPDATE → delivered/completed) → TV atualiza o Hall da Fama.
// - `eventos` (UPDATE → revealed/delivered/completed) → Dashboard atualiza
//   Entregas Pendentes.
// - `config` (UPDATE) → TV troca modo de apresentação e status do tesouro.

import { supabase } from './supabaseClient.js';

// Notifica `callback(evento)` para cada novo evento criado com status 'pending'.
export function subscribeNovosEventos(callback) {
  return supabase
    .channel('tv-eventos')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'eventos' }, (payload) => {
      if (payload.new.status === 'pending') callback(payload.new);
    })
    .subscribe();
}

// Notifica `callback(evento)` sempre que um evento entrar em `delivered`/`completed`
// (novo card no Hall da Fama).
export function subscribeHallDaFama(callback) {
  return supabase
    .channel('tv-hall')
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'eventos' }, (payload) => {
      if (['delivered', 'completed'].includes(payload.new.status)) callback(payload.new);
    })
    .subscribe();
}

// Notifica `callback(config)` sempre que a linha única de `config` for atualizada.
export function subscribeConfig(callback) {
  return supabase
    .channel('tv-config')
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'config' }, (payload) => {
      callback(payload.new);
    })
    .subscribe();
}

// Notifica `callback()` sempre que um evento entrar/saiir de Entregas
// Pendentes (revealed → delivered/completed), para o Dashboard recarregar
// as listas de `vw_entregas_pendentes` e "aguardando foto".
export function subscribeEntregasPendentes(callback) {
  return supabase
    .channel('dashboard-entregas')
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'eventos' }, (payload) => {
      if (['revealed', 'delivered', 'completed'].includes(payload.new.status)) callback();
    })
    .subscribe();
}

// Busca a configuração atual (linha única, id = 1).
export async function buscarConfigAtual() {
  const { data, error } = await supabase.from('config').select('*').eq('id', 1).single();
  if (error) throw error;
  return data;
}
