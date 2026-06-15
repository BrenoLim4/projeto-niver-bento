// Sequência de animação da Etapa 1 (ver ROADMAP.md, seção "Sistema de
// Animação"): Suspense → Baú → Revelação → Encerramento.

import { tocar } from './sons.js';

export const DURACOES = {
  suspense: 2500,
  bau: 2500,
  revelacao: 4000,
  encerramento: 1200,
};

const CATEGORIA_LABEL = {
  comum: 'Comum',
  raro: 'Raro',
  lendario: 'Lendário',
};

function aguardar(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function mostrarEtapa(etapas, etapaAtiva) {
  for (const [nome, el] of Object.entries(etapas)) {
    el.style.display = nome === etapaAtiva ? '' : 'none';
  }
}

// Executa a sequência completa dentro dos `elementos` fornecidos e resolve
// quando a TV pode voltar ao Estado Normal.
//
// elementos = {
//   container, etapas: { suspense, bau, revelacao, encerramento },
//   vencedor: [elementos de texto],
//   revelacaoImagem, revelacaoNome, revelacaoCodigo, revelacaoCategoria,
// }
export async function executarRevelacao(evento, elementos) {
  const ehTesouro = evento.metadata?.is_tesouro === true;
  elementos.container.classList.toggle('tv-evento--tesouro', ehTesouro);

  for (const el of elementos.vencedor) el.textContent = evento.vencedor ?? '';

  // Etapa 1: Suspense
  mostrarEtapa(elementos.etapas, 'suspense');
  tocar('suspense');
  await aguardar(DURACOES.suspense);

  // Etapa 2: Baú (tremer/brilhar/partículas)
  mostrarEtapa(elementos.etapas, 'bau');
  elementos.container.classList.add('tv-evento--animando');
  tocar('bau');
  await aguardar(DURACOES.bau);
  elementos.container.classList.remove('tv-evento--animando');

  // Etapa 3: Revelação
  elementos.revelacaoImagem.src = evento.premio_imagem_url || '../assets/img/icons/estrela.svg';
  elementos.revelacaoNome.textContent = evento.premio_nome ?? '';
  elementos.revelacaoCodigo.textContent = evento.premio_codigo ?? '';
  elementos.revelacaoCategoria.textContent = CATEGORIA_LABEL[evento.premio_categoria] ?? '';
  elementos.revelacaoCategoria.className = `badge badge-${evento.premio_categoria ?? 'comum'}`;
  mostrarEtapa(elementos.etapas, 'revelacao');
  tocar(ehTesouro ? 'tesouro' : 'vitoria');
  await aguardar(DURACOES.revelacao);

  // Etapa 4: Encerramento
  mostrarEtapa(elementos.etapas, 'encerramento');
  await aguardar(DURACOES.encerramento);

  elementos.container.style.display = 'none';
  elementos.container.classList.remove('tv-evento--tesouro');
}
