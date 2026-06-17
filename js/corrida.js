// Corrida dos Tratores — Fase 13.
// Constante TRATORES compartilhada entre dashboard e TV.
// executarCorrida: animação da corrida determinística para a TV.

export const TRATORES = [
  {
    cor: 'vermelho',
    label: 'Trator Vermelho',
    imagem: '../assets/img/corrida/tratores/Bento_Trator_Vermelho.webp',
    corHex: '#C0392B',
    offset: 0,
  },
  {
    cor: 'azul',
    label: 'Trator Azul',
    imagem: '../assets/img/corrida/tratores/Bento_Trator_Azul.webp',
    corHex: '#2980B9',
    offset: 1.3,
  },
  {
    cor: 'verde',
    label: 'Trator Verde',
    imagem: '../assets/img/corrida/tratores/Bento_Trator_verde.webp',
    corHex: '#27AE60',
    offset: 2.6,
  },
  {
    cor: 'amarelo',
    label: 'Trator Amarelo',
    imagem: '../assets/img/corrida/tratores/Bento_Trator_Amarelo.webp',
    corHex: '#F1C40F',
    offset: 3.9,
  },
];

const DURACAO_CORRIDA_MS = 22000;

function aguardar(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// Progresso de 0 a 1 para cada trator em função do tempo t (0-1).
// O vencedor recebe boost gradual após 65% do trajeto para assumir liderança
// com clareza. Os demais param entre 78–88% do trajeto.
function calcularProgresso(trator, vencedor, t) {
  const base = t * t * (3 - 2 * t); // smoothstep
  const jitter = Math.sin(t * 22 + trator.offset * 4.1) * 0.028 * Math.max(0, 1 - t * 1.4);

  if (trator.cor === vencedor) {
    const boost = t > 0.65 ? Math.pow((t - 0.65) / 0.35, 1.4) * 0.22 : 0;
    return Math.min(base + jitter + boost, 1.0);
  }
  const cap = 0.78 + trator.offset * 0.025;
  return Math.min((base + jitter) * cap, cap);
}

async function contarRegressiva(el) {
  for (const txt of ['3', '2', '1', 'VAI!']) {
    el.textContent = txt;
    el.classList.add('tv-corrida-contador--ativo');
    await aguardar(txt === 'VAI!' ? 700 : 900);
    el.classList.remove('tv-corrida-contador--ativo');
    await aguardar(180);
  }
}

// Executa a corrida completa na TV.
// elementos = { overlay, raias: {vermelho, azul, verde, amarelo}, contador, resultado }
// Resolve quando a animação terminar e o overlay for ocultado.
export async function executarCorrida(evento, elementos) {
  const { overlay, raias, contador, resultado } = elementos;
  const vencedor = evento.metadata?.trator_vencedor ?? TRATORES[0].cor;

  overlay.style.display = '';
  overlay.classList.remove('tv-corrida--saindo', 'tv-corrida--correndo');
  overlay.classList.add('tv-corrida--ativa');
  resultado.style.display = 'none';

  for (const t of TRATORES) {
    raias[t.cor]?.style.setProperty('--progresso', '0');
  }

  await contarRegressiva(contador);

  // Parallax só começa depois do VAI!
  overlay.classList.add('tv-corrida--correndo');

  // Corrida
  const inicio = performance.now();
  await new Promise((resolve) => {
    function frame(agora) {
      const t = Math.min((agora - inicio) / DURACAO_CORRIDA_MS, 1);
      for (const trator of TRATORES) {
        const raia = raias[trator.cor];
        if (!raia) continue;
        raia.style.setProperty('--progresso', calcularProgresso(trator, vencedor, t).toFixed(5));
      }
      if (t < 1) requestAnimationFrame(frame);
      else resolve();
    }
    requestAnimationFrame(frame);
  });

  // Resultado
  const info = TRATORES.find((t) => t.cor === vencedor);
  const nomeVencedor = evento.vencedor ?? info?.label ?? vencedor;
  resultado.innerHTML = `
    <img class="tv-corrida-resultado-img" src="${info?.imagem ?? ''}" alt="${info?.label ?? ''}" />
    <div class="tv-corrida-resultado-texto">
      <span class="tv-corrida-resultado-trofeu">🏆</span>
      <h2>${nomeVencedor}</h2>
      <p>${info?.label ?? ''}</p>
    </div>
  `;
  resultado.style.display = '';
  await aguardar(2800);

  overlay.classList.add('tv-corrida--saindo');
  await aguardar(600);
  overlay.style.display = 'none';
  overlay.classList.remove('tv-corrida--ativa', 'tv-corrida--saindo', 'tv-corrida--correndo');
}
