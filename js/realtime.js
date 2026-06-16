// Subscrições Supabase Realtime usadas pela TV e pelo Dashboard (ver
// ROADMAP.md, seção 6).
//
// - `eventos` (INSERT, status='pending') → TV adiciona o evento à fila local.
// - `eventos` (UPDATE → delivered/completed) → TV atualiza o Hall da Fama.
// - `eventos` (UPDATE → revealed/delivered/completed) → Dashboard atualiza
//   Entregas Pendentes.
// - `config` (UPDATE) → TV troca modo de apresentação e status do tesouro.
//
// Reconexão (FASE 8): `subscribeNovosEventos` e `subscribeConfig` aceitam
// `{ onStatus, onReconectar }` opcionais. `onStatus('conectado'|'desconectado')`
// alimenta o indicador visual da TV. `onReconectar()` é disparado somente quando
// o canal volta ao ar após uma queda anterior (não na conexão inicial).

import { supabase } from './supabaseClient.js';

// Notifica `callback(evento)` para cada novo evento criado com status 'pending'.
// `onStatus(status)` recebe 'conectado'|'desconectado' para controle de UI.
// `onReconectar()` é chamado quando o canal volta ao ar após ter caído.
export function subscribeNovosEventos(callback, { onStatus, onReconectar } = {}) {
  let jaConectou = false;
  let conectado = false;

  return supabase
    .channel('tv-eventos')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'eventos' }, (payload) => {
      if (payload.new.status === 'pending') callback(payload.new);
    })
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        const reconectando = jaConectou && !conectado;
        jaConectou = true;
        conectado = true;
        onStatus?.('conectado');
        if (reconectando) onReconectar?.();
      } else if (['CHANNEL_ERROR', 'TIMED_OUT', 'CLOSED'].includes(status)) {
        conectado = false;
        onStatus?.('desconectado');
      }
    });
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
// `onReconectar()` é chamado quando o canal volta ao ar após ter caído.
export function subscribeConfig(callback, { onReconectar } = {}) {
  let jaConectou = false;
  let conectado = false;

  return supabase
    .channel('tv-config')
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'config' }, (payload) => {
      callback(payload.new);
    })
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        const reconectando = jaConectou && !conectado;
        jaConectou = true;
        conectado = true;
        if (reconectando) onReconectar?.();
      } else if (['CHANNEL_ERROR', 'TIMED_OUT', 'CLOSED'].includes(status)) {
        conectado = false;
      }
    });
}

// Canal de Broadcast para notificar a TV de novos eventos de forma imediata e
// confiável, sem depender de políticas RLS do postgres_changes.
const CANAL_BROADCAST = 'fazendinha-tv';

export function subscribeBroadcastEvento(callback) {
  return supabase
    .channel(CANAL_BROADCAST)
    .on('broadcast', { event: 'novo_evento' }, ({ payload }) => {
      callback(payload);
    })
    .subscribe();
}

export function criarCanalBroadcast() {
  const canal = supabase.channel(CANAL_BROADCAST);
  canal.subscribe();
  return canal;
}

// Notifica `callback()` sempre que um evento entrar/sair de Entregas
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
