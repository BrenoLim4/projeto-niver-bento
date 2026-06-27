// Sequência de animação da Etapa 1 (ver ROADMAP.md, seção "Sistema de
// Animação"): Suspense → Baú → Revelação → Encerramento.

import { tocar } from './sons.js';

export const DURACOES = {
  suspense: 2500,
  bau: 2500,
  revelacao: 4000,
  revelacaoEspecial: 6500, // Tesouro/Lendário: mais tempo de celebração
  encerramento: 1200,
};

const TIMEOUT_IMAGEM = 3000; // espera extra (após suspense+bau) antes de revelar mesmo sem load

const CATEGORIA_LABEL = {
  comum: 'Comum',
  raro: 'Raro',
  lendario: 'Lendário',
};

const EMOJIS_CONFETE_LENDARIO = ['🌟', '⭐', '✨', '👑', '🏆', '🎉', '🎊', '💛'];

function aguardar(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function mostrarEtapa(etapas, etapaAtiva) {
  for (const [nome, el] of Object.entries(etapas)) {
    el.style.display = nome === etapaAtiva ? '' : 'none';
  }
}

// Inicia o carregamento da imagem do prêmio e resolve quando estiver pronta
// (load/error). Chamado no início da revelação, em paralelo com as etapas de
// Suspense + Baú, para que a imagem já esteja (ou quase) carregada quando for
// exibida.
function carregarImagem(src) {
  if (!src) return Promise.resolve();
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => resolve();
    img.src = src;
  });
}

function gerarConfeteLendario(container) {
  if (!container) return;
  container.innerHTML = '';
  for (let i = 0; i < 36; i++) {
    const span = document.createElement('span');
    span.className = 'revelacao-confete-item';
    span.textContent = EMOJIS_CONFETE_LENDARIO[Math.floor(Math.random() * EMOJIS_CONFETE_LENDARIO.length)];
    const dur = (2.2 + Math.random() * 2.4).toFixed(2);
    const delay = (Math.random() * 1.5).toFixed(2);
    const rot = ((Math.random() - 0.5) * 720).toFixed(0);
    span.style.cssText = [
      `left:${(Math.random() * 100).toFixed(1)}%`,
      `font-size:${(1 + Math.random() * 1.6).toFixed(2)}rem`,
      `--dur:${dur}s`,
      `--delay:${delay}s`,
      `--rot:${rot}deg`,
    ].join(';');
    container.appendChild(span);
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
  const ehLendario = !ehTesouro && evento.premio_categoria === 'lendario';
  elementos.container.classList.toggle('tv-evento--tesouro', ehTesouro);
  elementos.container.classList.toggle('tv-evento--lendario', ehLendario);

  for (const el of elementos.vencedor) el.textContent = evento.vencedor ?? '';

  const imagemSrc = evento.premio_imagem_url || '../assets/img/icons/estrela.svg';
  const imagemPronta = carregarImagem(imagemSrc); // inicia o carregamento já, em paralelo com Suspense + Baú

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

  // Garante que a imagem do prêmio já esteja carregada antes de revelar —
  // com um teto extra de segurança caso a URL nunca termine de carregar.
  await Promise.race([imagemPronta, aguardar(TIMEOUT_IMAGEM)]);

  // Etapa 3: Revelação
  elementos.revelacaoImagem.src = imagemSrc;
  elementos.revelacaoNome.textContent = evento.premio_nome ?? '';
  elementos.revelacaoCodigo.textContent = evento.premio_codigo ?? '';
  elementos.revelacaoCategoria.textContent = CATEGORIA_LABEL[evento.premio_categoria] ?? '';
  elementos.revelacaoCategoria.className = `badge badge-${evento.premio_categoria ?? 'comum'}`;
  mostrarEtapa(elementos.etapas, 'revelacao');
  if (ehLendario) gerarConfeteLendario(elementos.revelacaoConfete);
  tocar(ehTesouro ? 'tesouro' : 'vitoria');
  await aguardar(ehTesouro || ehLendario ? DURACOES.revelacaoEspecial : DURACOES.revelacao);

  // Etapa 4: Encerramento
  mostrarEtapa(elementos.etapas, 'encerramento');
  await aguardar(DURACOES.encerramento);

  elementos.container.style.display = 'none';
  elementos.container.classList.remove('tv-evento--tesouro', 'tv-evento--lendario');
  if (elementos.revelacaoConfete) elementos.revelacaoConfete.innerHTML = '';
}
