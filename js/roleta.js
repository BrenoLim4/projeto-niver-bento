// Roleta da Fazenda (Fase 12)
// 8 animais em setores iguais de 45°. O resultado é determinístico: o
// vencedor é sorteado no dashboard antes da animação, e `calcularAngulo`
// devolve o ângulo exato que posiciona o setor vencedor no ponteiro.

import { tocar, tocarLoop, pararSom } from './sons.js';

export const ANIMAIS = [
  { key: 'vaca',     emoji: '🐄', nome: 'Vaca Mimosa',          cor: '#C8A46E', imgPath: '../assets/img/animais/bento_vaca.png' },
  { key: 'cavalo',   emoji: '🐴', nome: 'Cavalo Trovão',         cor: '#A0784B', imgPath: '../assets/img/animais/bento_cavalo.png' },
  { key: 'porco',    emoji: '🐷', nome: 'Porquinho Baconzinho',  cor: '#F4A7B9', imgPath: '../assets/img/animais/bento_porquinho.png' },
  { key: 'galinha',  emoji: '🐔', nome: 'Galinha Cocó',          cor: '#F2A64A', imgPath: '../assets/img/animais/bento_galinha.png' },
  { key: 'ovelha',   emoji: '🐑', nome: 'Ovelha Floquinha',      cor: '#D4D4D4', imgPath: '../assets/img/animais/bento_ovelha.png' },
  { key: 'cabra',    emoji: '🐐', nome: 'Cabrita Estrelinha',    cor: '#C8B89A', imgPath: '../assets/img/animais/bento_cabra.png' },
  { key: 'pato',     emoji: '🦆', nome: 'Patinho Pingo',         cor: '#5BB8F5', imgPath: '../assets/img/animais/bento_pato.png' },
  { key: 'pintinho', emoji: '🐣', nome: 'Pintinho Amarelinho',   cor: '#FFD700', imgPath: '../assets/img/animais/bento_pintinho.png' },
];

const _imgCache = {};

export function carregarImagens() {
  return Promise.all(
    ANIMAIS.map((animal) => {
      if (_imgCache[animal.key]) return Promise.resolve();
      return new Promise((resolve) => {
        const img = new Image();
        img.onload  = () => { _imgCache[animal.key] = img; resolve(); };
        img.onerror = resolve; // fallback para emoji se a imagem falhar
        img.src = animal.imgPath;
      });
    })
  );
}

const N     = ANIMAIS.length;          // 8
const SLICE = (2 * Math.PI) / N;       // π/4 (45°)

// Rotação inicial: setor 0 (vaca) centralizado no ponteiro (topo, −π/2).
export const ROTACAO_INICIAL = -SLICE / 2;

// Calcula o ângulo final (radianos) para que o setor do animal vencedor
// fique centralizado no ponteiro após 6 rotações completas no sentido horário.
export function calcularAngulo(animalKey) {
  const idx = Math.max(0, ANIMAIS.findIndex((a) => a.key === animalKey));
  // 6 rotações completas (drama) − offset do setor vencedor (horário)
  return ROTACAO_INICIAL + 6 * 2 * Math.PI - idx * SLICE;
}

// Desenha a roleta em `canvas` com o ângulo de rotação informado (radianos).
// Chamado tanto para o modo ambiente (1×, CSS gira o elemento) quanto para
// a animação do evento (a cada frame via requestAnimationFrame).
export function desenharRoleta(canvas, anguloRotacao) {
  const ctx = canvas.getContext('2d');
  const w   = canvas.width;
  const h   = canvas.height;
  const cx  = w / 2;
  const cy  = h / 2;
  const r   = Math.min(cx, cy) * 0.9;

  ctx.clearRect(0, 0, w, h);

  ANIMAIS.forEach((animal, i) => {
    const start = anguloRotacao + i * SLICE - Math.PI / 2;
    const end   = start + SLICE;
    const mid   = start + SLICE / 2;

    // Setor
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, start, end);
    ctx.closePath();
    ctx.fillStyle   = animal.cor;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.75)';
    ctx.lineWidth   = 3;
    ctx.stroke();

    // Imagem (ou emoji de fallback) centralizada no setor
    const ex  = cx + Math.cos(mid) * r * 0.65;
    const ey  = cy + Math.sin(mid) * r * 0.65;
    const img = _imgCache[animal.key];
    if (img) {
      const size = r * 0.30;
      ctx.save();
      ctx.translate(ex, ey);
      ctx.drawImage(img, -size / 2, -size / 2, size, size);
      ctx.restore();
    } else {
      ctx.font         = `${Math.round(r * 0.16)}px serif`;
      ctx.textAlign    = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(animal.emoji, ex, ey);
    }
  });

  // Aro externo
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.strokeStyle = '#8B5A2B';
  ctx.lineWidth   = 8;
  ctx.stroke();

  // Cubo central (hub)
  const hr   = r * 0.08;
  const grad = ctx.createRadialGradient(cx - hr * 0.3, cy - hr * 0.3, 0, cx, cy, hr);
  grad.addColorStop(0, '#FFD700');
  grad.addColorStop(1, '#F2A64A');
  ctx.beginPath();
  ctx.arc(cx, cy, hr, 0, Math.PI * 2);
  ctx.fillStyle   = grad;
  ctx.fill();
  ctx.strokeStyle = '#8B5A2B';
  ctx.lineWidth   = 3;
  ctx.stroke();
}

// Executa a animação de giro da roleta na TV para um evento do tipo 'roleta'.
// Retorna uma Promise que resolve quando o overlay é ocultado (antes de
// executarRevelacao ser chamado pelo fluxo normal).
export async function executarRoleta(evento, elementos) {
  const { overlay, canvas, resultado, resultadoAnimal, resultadoVencedor } = elementos;

  const animalKey  = evento.metadata?.animal_vencedor ?? ANIMAIS[0].key;
  const animal     = ANIMAIS.find((a) => a.key === animalKey) ?? ANIMAIS[0];
  const finalAngle = calcularAngulo(animalKey);
  const delta      = finalAngle - ROTACAO_INICIAL;
  const DURACAO    = 5500; // ms

  await carregarImagens();

  // Mostra overlay com fade-in
  overlay.style.display = 'flex';
  await new Promise((r) => requestAnimationFrame(r));
  overlay.classList.add('tv-roleta--ativa');
  resultado.style.display = 'none';

  // Estado inicial
  desenharRoleta(canvas, ROTACAO_INICIAL);

  // Som de giro em loop
  tocarLoop('roleta_giro');

  // Animação ease-out quartic: rápida no início, desacelera suavemente
  const inicio = performance.now();
  let sectorsShown = 0;
  let lastClickTime = 0;

  await new Promise((resolve) => {
    function frame(agora) {
      const t      = Math.min((agora - inicio) / DURACAO, 1);
      const ease   = 1 - Math.pow(1 - t, 4);
      const angulo = ROTACAO_INICIAL + ease * delta;

      desenharRoleta(canvas, angulo);

      // Click por setor cruzado (throttled a 80 ms mínimo entre cliques)
      const total = Math.floor((angulo - ROTACAO_INICIAL) / SLICE);
      if (total > sectorsShown && agora - lastClickTime >= 80) {
        tocar('roleta_clique');
        sectorsShown  = total;
        lastClickTime = agora;
      }

      if (t < 1) {
        requestAnimationFrame(frame);
      } else {
        desenharRoleta(canvas, finalAngle);
        resolve();
      }
    }
    requestAnimationFrame(frame);
  });

  // Para o giro e toca o som de vencedor
  pararSom('roleta_giro');
  tocar('roleta_fim');

  // Exibe resultado
  resultadoAnimal.innerHTML     = `<img src="${animal.imgPath}" alt="${animal.nome}" style="height:2.2em;vertical-align:middle;object-fit:contain;"> ${animal.nome}`;
  resultadoVencedor.textContent = evento.vencedor ?? '';
  resultado.style.display       = 'flex';

  await new Promise((r) => setTimeout(r, 3500));

  // Fade-out
  overlay.classList.add('tv-roleta--saindo');
  overlay.classList.remove('tv-roleta--ativa');
  await new Promise((r) => setTimeout(r, 600));
  overlay.style.display = 'none';
  overlay.classList.remove('tv-roleta--saindo');
  resultado.style.display = 'none';
}
