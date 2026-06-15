// Hall da Fama — tela padrão da TV (ver ROADMAP.md, FASE 6, e CLAUDE.md).
//
// Renderiza `vw_hall_da_fama` (ganhadores entregues) como um carrossel
// horizontal com até 3 cards visíveis, fotos como elemento principal de cada
// card, os contadores de `vw_estatisticas` e o status do Tesouro da Fazenda.
// Com mais de 3 ganhadores, a trilha desliza lentamente para a esquerda em
// loop contínuo. Atualiza via Realtime quando um evento entra em
// delivered/completed ou o tesouro é encontrado.

import { supabase } from './supabaseClient.js';
import { subscribeHallDaFama } from './realtime.js';

const CATEGORIA_LABEL = { comum: 'Comum', raro: 'Raro', lendario: 'Lendário' };

const ITENS_VISIVEIS = 3;
const SEGUNDOS_POR_ITEM = 6;

let elementos = null;
let ultimosDados = [];
let resizeTimeoutId = null;

function formatarDataHora(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

function obterGapPx() {
  const valor = getComputedStyle(document.documentElement).getPropertyValue('--espaco-lg');
  return parseFloat(valor) || 24;
}

function criarCardGanhador(item) {
  const div = document.createElement('div');
  div.className = 'hall-card';
  if (item.metadata?.is_tesouro === true) div.classList.add('hall-card--tesouro');

  const foto = item.foto_url || item.premio_imagem_url || '../assets/img/icons/estrela.svg';
  const categoria = item.premio_categoria ?? 'comum';

  div.innerHTML = `
    <div class="hall-card-foto">
      <img src="${foto}" alt="" />
    </div>
    <div class="hall-card-info">
      <strong class="hall-card-vencedor">${item.vencedor}</strong>
      <span class="hall-card-premio">${item.premio_nome ?? ''}</span>
      <span class="badge badge-${categoria}">${CATEGORIA_LABEL[categoria] ?? ''}</span>
      <span class="hall-card-data">${formatarDataHora(item.data_exibicao)}</span>
    </div>
  `;

  return div;
}

function criarMensagemVazia() {
  const p = document.createElement('p');
  p.className = 'hall-vazio';
  p.textContent = 'Nenhum prêmio entregue ainda. Em breve, novos ganhadores aqui!';
  return p;
}

// Monta a trilha do carrossel. Com até `ITENS_VISIVEIS` ganhadores, exibe os
// cards estáticos (sem deslizar). Com mais, duplica a lista para um loop
// contínuo e desliza a trilha lentamente para a esquerda.
function renderizarCarrossel(data) {
  const trilha = elementos.trilha;
  trilha.classList.remove('hall-trilha--deslizando');
  trilha.style.removeProperty('--hall-distancia');
  trilha.style.removeProperty('--hall-duracao');
  trilha.innerHTML = '';

  if (!data.length) {
    trilha.appendChild(criarMensagemVazia());
    return;
  }

  const gap = obterGapPx();
  const largura = elementos.grade.getBoundingClientRect().width;
  const larguraCard = (largura - gap * (ITENS_VISIVEIS - 1)) / ITENS_VISIVEIS;
  trilha.style.setProperty('--hall-largura-card', `${larguraCard}px`);

  const desliza = data.length > ITENS_VISIVEIS;
  const itens = desliza ? [...data, ...data] : data;
  itens.forEach((item) => trilha.appendChild(criarCardGanhador(item)));

  if (desliza) {
    const distancia = (larguraCard + gap) * data.length;
    const duracao = data.length * SEGUNDOS_POR_ITEM;
    trilha.style.setProperty('--hall-distancia', `-${distancia}px`);
    trilha.style.setProperty('--hall-duracao', `${duracao}s`);
    trilha.classList.add('hall-trilha--deslizando');
  }
}

async function carregarGanhadores() {
  const { data, error } = await supabase.from('vw_hall_da_fama').select('*').limit(15);
  if (error) { console.error('Erro ao carregar Hall da Fama:', error); return; }

  ultimosDados = data;
  renderizarCarrossel(data);
}

async function carregarEstatisticas() {
  const { data, error } = await supabase.from('vw_estatisticas').select('*').single();
  if (error) { console.error('Erro ao carregar estatísticas do Hall da Fama:', error); return; }

  elementos.totalDistribuidos.textContent = data.total_entregues;
  elementos.totalRaros.textContent = data.total_raros;
  elementos.totalLendarios.textContent = data.total_lendarios;
}

// Atualiza o destaque do Tesouro da Fazenda conforme `config.tesouro_status`.
export function atualizarTesouroStatus(status) {
  const encontrado = status === 'encontrado';
  elementos.tesouroContainer.classList.toggle('hall-tesouro--encontrado', encontrado);
  elementos.tesouroStatus.textContent = encontrado ? 'Encontrado!' : 'Ainda não encontrado';
}

// Inicializa o Hall da Fama: carrega dados, aplica o status do Tesouro e
// inscreve-se no Realtime para manter tudo atualizado automaticamente.
export function inicializarHallDaFama(els, configInicial) {
  elementos = els;

  atualizarTesouroStatus(configInicial?.tesouro_status ?? 'nao_encontrado');
  carregarGanhadores();
  carregarEstatisticas();

  subscribeHallDaFama(() => {
    carregarGanhadores();
    carregarEstatisticas();
  });

  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeoutId);
    resizeTimeoutId = setTimeout(() => renderizarCarrossel(ultimosDados), 200);
  });
}
