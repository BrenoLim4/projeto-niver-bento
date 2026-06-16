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
const DURACAO_ENTRADA_MS = 3200;

let elementos = null;
let ultimosDados = [];
let resizeTimeoutId = null;
let obterModo = null;

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

const POSICOES_ESTRELAS = [
  { t: '-5%',  l: '15%',  s: 8,  d: 0.10 },
  { t: '-5%',  l: '65%',  s: 6,  d: 0.40 },
  { t:  '3%',  l: '43%',  s: 13, d: 0.05 },
  { t: '12%',  l: '-9%',  s: 10, d: 0.20 },
  { t: '12%',  l:'109%',  s: 7,  d: 0.50 },
  { t: '38%',  l:'-11%',  s: 6,  d: 0.70 },
  { t: '38%',  l:'111%',  s: 9,  d: 0.30 },
  { t: '62%',  l: '-8%',  s: 8,  d: 0.90 },
  { t: '62%',  l:'108%',  s: 6,  d: 0.60 },
  { t: '85%',  l: '43%',  s: 10, d: 0.25 },
  { t: '92%',  l: '20%',  s: 9,  d: 0.35 },
  { t: '92%',  l: '65%',  s: 6,  d: 0.55 },
];

function criarDestaqueEntrada(item, larguraCard) {
  return new Promise((resolve) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'hall-destaque-wrapper';

    const cartao = document.createElement('div');
    cartao.className = 'hall-destaque-cartao';
    cartao.style.setProperty('--hall-largura-card', `${larguraCard}px`);

    const glow = document.createElement('div');
    glow.className = 'hall-destaque-glow';
    cartao.appendChild(glow);

    for (let i = 1; i <= 3; i++) {
      const anel = document.createElement('div');
      anel.className = `hall-destaque-anel hall-destaque-anel--${i}`;
      cartao.appendChild(anel);
    }

    POSICOES_ESTRELAS.forEach(({ t, l, s, d }) => {
      const e = document.createElement('div');
      e.className = 'hall-destaque-estrela';
      e.style.cssText = `top:${t};left:${l};width:${s}px;height:${s}px;animation-delay:${d}s`;
      cartao.appendChild(e);
    });

    const card = criarCardGanhador(item);
    cartao.appendChild(card);
    wrapper.appendChild(cartao);

    const img = card.querySelector('.hall-card-foto img');
    if (!img || img.complete) { resolve(wrapper); return; }

    const tid = setTimeout(() => {
      img.onload = img.onerror = null;
      resolve(wrapper);
    }, 2500);

    img.onload = img.onerror = () => {
      clearTimeout(tid);
      img.onload = img.onerror = null;
      resolve(wrapper);
    };
  });
}

// Monta a trilha do carrossel. Com até `ITENS_VISIVEIS` ganhadores, exibe os
// cards estáticos (sem deslizar). Com mais, duplica a lista para um loop
// contínuo e desliza a trilha lentamente para a esquerda.
// `animarPrimeiro`: exibe o primeiro ganhador em destaque centralizado com
// efeitos de entrada; o carrossel inicia após a animação terminar.
function renderizarCarrossel(data, animarPrimeiro = false) {
  const trilha = elementos.trilha;
  trilha.classList.remove('hall-trilha--deslizando');
  trilha.style.removeProperty('--hall-distancia');
  trilha.style.removeProperty('--hall-duracao');
  trilha.innerHTML = '';
  elementos.grade.querySelector('.hall-destaque-wrapper')?.remove();
  document.querySelector('.hall-destaque-wrapper--overlay')?.remove();

  if (!data.length) {
    trilha.appendChild(criarMensagemVazia());
    return;
  }

  const gap = obterGapPx();
  const largura = elementos.grade.getBoundingClientRect().width;
  const larguraCard = largura > 0
    ? (largura - gap * (ITENS_VISIVEIS - 1)) / ITENS_VISIVEIS
    : Math.min(Math.max(280, window.innerWidth * 0.22), 440);
  trilha.style.setProperty('--hall-largura-card', `${larguraCard}px`);

  const desliza = data.length > ITENS_VISIVEIS;

  function iniciarCarrossel() {
    if (!desliza) return;
    const distancia = (larguraCard + gap) * data.length;
    const duracao = data.length * SEGUNDOS_POR_ITEM;
    trilha.style.setProperty('--hall-distancia', `-${distancia}px`);
    trilha.style.setProperty('--hall-duracao', `${duracao}s`);
    trilha.classList.add('hall-trilha--deslizando');
  }

  function reconstruirTrilha() {
    trilha.innerHTML = '';
    const itens = desliza ? [...data, ...data] : data;
    itens.forEach((item) => trilha.appendChild(criarCardGanhador(item)));
    iniciarCarrossel();
  }

  if (animarPrimeiro && data.length) {
    data.slice(1).forEach((item) => trilha.appendChild(criarCardGanhador(item)));

    const ehHall = !obterModo || obterModo() === 'hall_da_fama';

    criarDestaqueEntrada(data[0], larguraCard).then((destaque) => {
      if (ehHall) {
        elementos.grade.appendChild(destaque);
        elementos.grade.classList.add('hall-destaque-ativo');
        setTimeout(() => {
          elementos.grade.classList.remove('hall-destaque-ativo');
          destaque.remove();
          reconstruirTrilha();
        }, DURACAO_ENTRADA_MS);
      } else {
        // Overlay fixo sobre o modo atual (pescaria, corrida, etc.)
        const overlayLargura = Math.min(Math.max(280, window.innerWidth * 0.22), 440);
        destaque.querySelector('.hall-destaque-cartao')
          ?.style.setProperty('--hall-largura-card', `${overlayLargura}px`);
        destaque.classList.add('hall-destaque-wrapper--overlay');
        document.querySelector('.tela-tv')?.appendChild(destaque);
        setTimeout(() => {
          destaque.remove();
          reconstruirTrilha();
        }, DURACAO_ENTRADA_MS);
      }
    });
  } else {
    const itens = desliza ? [...data, ...data] : data;
    itens.forEach((item) => trilha.appendChild(criarCardGanhador(item)));
    iniciarCarrossel();
  }
}

async function carregarGanhadores(animarPrimeiro = false) {
  const { data, error } = await supabase.from('vw_hall_da_fama').select('*').limit(15);
  if (error) { console.error('Erro ao carregar Hall da Fama:', error); return; }

  ultimosDados = data;
  renderizarCarrossel(data, animarPrimeiro);
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
export function inicializarHallDaFama(els, configInicial, { getModo } = {}) {
  elementos = els;
  obterModo = getModo ?? null;

  atualizarTesouroStatus(configInicial?.tesouro_status ?? 'nao_encontrado');
  carregarGanhadores();
  carregarEstatisticas();

  subscribeHallDaFama(() => {
    carregarGanhadores(true);
    carregarEstatisticas();
  });

  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeoutId);
    resizeTimeoutId = setTimeout(() => renderizarCarrossel(ultimosDados), 200);
  });
}
