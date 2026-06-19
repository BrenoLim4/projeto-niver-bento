// Corrida dos Tratores — Fase 13.
// Constante TRATORES compartilhada entre dashboard e TV.
// executarCorrida: animação com apresentação de competidores, comentários,
//                 avaria/turbo, reta final e confetes.

export const TRATORES = [
  { cor: 'vermelho', label: 'Trator Vermelho', imagem: '../assets/img/corrida/tratores/Bento_Trator_Vermelho.webp', corHex: '#C0392B' },
  { cor: 'azul',    label: 'Trator Azul',     imagem: '../assets/img/corrida/tratores/Bento_Trator_Azul.webp',     corHex: '#2980B9' },
  { cor: 'verde',   label: 'Trator Verde',    imagem: '../assets/img/corrida/tratores/Bento_Trator_verde.webp',    corHex: '#27AE60' },
  { cor: 'amarelo', label: 'Trator Amarelo',  imagem: '../assets/img/corrida/tratores/Bento_Trator_Amarelo.webp', corHex: '#F1C40F' },
];

const DURACAO_CORRIDA_MS = 22000;
let corridaState = null;

function rnd(min, max) { return min + Math.random() * (max - min); }
function aguardar(ms)  { return new Promise((r) => setTimeout(r, ms)); }

// Curva sino: 0 → 1 → 0 suavemente ao longo de [tStart, tEnd]
function bumpCurve(t, tStart, tEnd) {
  if (t <= tStart || t >= tEnd) return 0;
  return Math.sin(((t - tStart) / (tEnd - tStart)) * Math.PI);
}

// Som de motor — graceful failure se motor.mp3 não existir
const _audioMotor = (() => {
  try {
    const a = new Audio('../assets/audio/motor.mp3');
    a.preload = 'auto';
    return a;
  } catch (_) { return null; }
})();

function tocarMotor() {
  if (!_audioMotor) return;
  _audioMotor.currentTime = 0;
  _audioMotor.play().catch(() => {});
}

// ── Frases de narração da apresentação ──────────────────────────

const FRASES_APRESENTACAO = [
  '🚜 Direto dos campos da Fazendinha do Bento!',
  '🌾 Preparando os motores!',
  '🔥 Olha a máquina chegando!',
  '🏁 Será que teremos um campeão surpresa?',
  '🐄 A torcida da fazenda está animada!',
  '🎉 O público foi à loucura!',
  '⚙️ Motor afinado e pronto pra largar!',
  '🌟 Que máquina incrível!',
  '😤 Determinação total na pista!',
  '🥇 Só um vai cruzar a linha em primeiro!',
];

// ── Frases para comentários durante a corrida (A) ───────────────

const FRASES_LIDERANCA = [
  (n) => `🔥 ${n} na frente!`,
  (n) => `🐄 A vaquinha torce por ${n}!`,
  (n) => `🚜 ${n} pisa fundo no acelerador!`,
  (n) => `💨 ${n} deixou todos no pó!`,
  (n) => `🎉 ${n} abrindo vantagem!`,
  (n) => `🤠 ${n} domina a pista!`,
  (n) => `🌾 ${n} voando pela fazenda!`,
];

const FRASES_EMPATADO = [
  '📸 QUE FOTO FINISH!',
  '😱 Raça acirradíssima!',
  '🐔 A galinha não sabe para quem torcer!',
  '🏁 Tudo muito empatado!',
  '🤯 Emocionante demais!',
  '🌾 Igualzinho na pista da fazenda!',
];

const FRASES_AVARIA = [
  (n) => `⚠️ AVARIA! ${n} para na pista!`,
  (n) => `💨 Fumaça saindo do ${n}!`,
  (n) => `🔧 Mecânico! ${n} com problema!`,
  (n) => `😬 ${n} tá tremendo na pista!`,
  (n) => `🐓 Até a galinha corria mais que ${n} agora!`,
];

const FRASES_TURBO = [
  (n) => `⚡ TURBO! ${n} disparou!`,
  (n) => `🔥 ${n} pegou fogo!`,
  (n) => `🚀 ${n} com SUPERVELOCIDADE!`,
  (n) => `💫 ${n} voando na pista!`,
  (n) => `⚡ ${n} ativou o nitro da fazenda!`,
];

// ── Estado da corrida ────────────────────────────────────────────

function criarEstadoCorrida(vencedor) {
  const finaisLosers = [0.79, 0.87, 0.93].sort(() => Math.random() - 0.5);
  let li = 0;
  const finalPorCor = Object.fromEntries(
    TRATORES.map((t) => [t.cor, t.cor === vencedor ? 1.0 : finaisLosers[li++]])
  );

  const waypoints = {};
  TRATORES.forEach((t) => {
    const f  = finalPorCor[t.cor];
    const isW = t.cor === vencedor;
    const fr1 = rnd(0.12, 0.21);
    const fr2 = rnd(0.30, 0.45);
    const fr3 = rnd(0.49, 0.65);
    const fr4 = isW ? rnd(0.72, 0.90) : rnd(0.68, 0.87);
    waypoints[t.cor] = [
      [0.00, 0],
      [0.18, fr1 * f],
      [0.36, fr2 * f],
      [0.55, fr3 * f],
      [0.75, fr4 * f],
      [1.00, f],
    ];
  });

  const jitter = TRATORES.map(() => ({
    f1: rnd(3, 10),  f2: rnd(11, 19),
    p1: rnd(0, Math.PI * 2), p2: rnd(0, Math.PI * 2),
    a:  rnd(0.016, 0.035),
  }));

  const losers = TRATORES.filter((t) => t.cor !== vencedor).map((t) => t.cor);
  const avariaCor    = losers[Math.floor(Math.random() * losers.length)];
  const avariaTStart = rnd(0.22, 0.42);
  const avariaTEnd   = avariaTStart + rnd(0.06, 0.10);

  const candidatosTurbo = TRATORES.map((t) => t.cor).filter((c) => c !== avariaCor);
  const turboCor    = candidatosTurbo[Math.floor(Math.random() * candidatosTurbo.length)];
  const turboTStart = rnd(0.33, 0.58);
  const turboTEnd   = turboTStart + rnd(0.04, 0.07);

  return {
    finalPorCor, waypoints, jitter,
    eventos: {
      avaria: { cor: avariaCor, tStart: avariaTStart, tEnd: avariaTEnd },
      turbo:  { cor: turboCor,  tStart: turboTStart,  tEnd: turboTEnd  },
    },
  };
}

function interpolarWaypoints(pts, t) {
  for (let i = 0; i < pts.length - 1; i++) {
    const [t0, p0] = pts[i];
    const [t1, p1] = pts[i + 1];
    if (t <= t1) {
      const u = (t - t0) / (t1 - t0);
      return p0 + (p1 - p0) * u * u * (3 - 2 * u);
    }
  }
  return pts[pts.length - 1][1];
}

function calcularProgresso(trator, t, idx) {
  const base = interpolarWaypoints(corridaState.waypoints[trator.cor], t);
  const j    = corridaState.jitter[idx];
  const jVal = (
    Math.sin(t * j.f1 * Math.PI + j.p1) * 0.6 +
    Math.sin(t * j.f2 * Math.PI + j.p2) * 0.4
  ) * j.a * (1 - t * 0.5);

  const { avaria, turbo } = corridaState.eventos;
  let mod = 0;
  if (trator.cor === avaria.cor) mod -= bumpCurve(t, avaria.tStart, avaria.tEnd) * 0.07;
  if (trator.cor === turbo.cor)  mod += bumpCurve(t, turbo.tStart,  turbo.tEnd)  * 0.05;

  return Math.max(0, Math.min(base + jVal + mod, corridaState.finalPorCor[trator.cor]));
}

// ── Apresentação de competidores ─────────────────────────────────

function gerarParticulasApres(container, corHex) {
  if (!container) return;
  container.innerHTML = '';
  const EMOJIS = ['✨', '⭐', '🌟', '💫', '🔥', '🌾', '🎉'];
  for (let i = 0; i < 20; i++) {
    const span = document.createElement('span');
    span.textContent = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
    span.style.cssText = [
      `left: ${rnd(10, 90).toFixed(1)}%`,
      `top: ${rnd(30, 85).toFixed(1)}%`,
      `font-size: ${rnd(0.9, 2.2).toFixed(2)}rem`,
      `--dur: ${rnd(1.5, 3.2).toFixed(2)}s`,
      `--delay: ${rnd(0, 1.6).toFixed(2)}s`,
      `--dx: ${rnd(-80, 80).toFixed(0)}px`,
      `--rot: ${rnd(-60, 60).toFixed(0)}deg`,
    ].join(';');
    container.appendChild(span);
  }
}

// Strings de animação aplicadas inline a cada competidor (garantem restart)
const ANIM_TRATOR = [
  'apres-trator-entrar 0.9s cubic-bezier(0.22, 1, 0.36, 1) forwards',
  'apres-trator-balanco 2.8s ease-in-out 0.9s infinite',
].join(', ');
const ANIM_INFO = 'apres-info-entrar 0.7s 0.5s cubic-bezier(0.22, 1, 0.36, 1) both';

async function apresentarCompetidores(apresEl, tratoresAtivos, nomes) {
  if (!apresEl || tratoresAtivos.length === 0) return;

  const imgEl        = apresEl.querySelector('.tv-corrida-apres-trator-img');
  const nomeTraEl    = apresEl.querySelector('.tv-corrida-apres-trator-nome');
  const participEl   = apresEl.querySelector('.tv-corrida-apres-participante');
  const particulasEl = apresEl.querySelector('.tv-corrida-apres-particulas');
  const bolhaEl      = apresEl.querySelector('.tv-corrida-apres-bolha');
  const infoEl       = apresEl.querySelector('.tv-corrida-apres-info');

  // Exibe overlay com fade-in
  apresEl.classList.remove('tv-corrida-apresentacao--saindo');
  apresEl.style.display = '';
  void apresEl.offsetWidth;
  apresEl.classList.add('tv-corrida-apresentacao--visivel');
  await aguardar(300);

  for (let i = 0; i < tratoresAtivos.length; i++) {
    const trator = tratoresAtivos[i];

    // Entre competidores: fade out do conteúdo
    if (i > 0) {
      apresEl.classList.add('tv-corrida-apres--transicao');
      await aguardar(340);
    }

    // Atualiza cor temática e conteúdo
    apresEl.style.setProperty('--cor-trator', trator.corHex);
    imgEl.src = trator.imagem;
    imgEl.alt = trator.label;
    nomeTraEl.textContent  = `🚜 ${trator.label.toUpperCase()}`;
    participEl.textContent = `👤 ${nomes[trator.cor]}`;
    gerarParticulasApres(particulasEl, trator.corHex);

    // Reinicia animações via inline style (garante restart independente do CSS)
    imgEl.style.animation  = 'none';
    if (infoEl) infoEl.style.animation = 'none';
    void apresEl.offsetWidth; // força reflow
    imgEl.style.animation  = ANIM_TRATOR;
    if (infoEl) infoEl.style.animation = ANIM_INFO;

    // Fade in do conteúdo
    apresEl.classList.remove('tv-corrida-apres--transicao');

    // Som de motor (falha silenciosamente se mp3 ausente)
    tocarMotor();

    // Bolha de narração
    if (bolhaEl) {
      const frase = FRASES_APRESENTACAO[Math.floor(Math.random() * FRASES_APRESENTACAO.length)];
      bolhaEl.textContent = frase;
      bolhaEl.classList.remove('tv-corrida-apres-bolha--visivel', 'tv-corrida-apres-bolha--saindo');
      bolhaEl.style.display = '';
      void bolhaEl.offsetWidth;
      bolhaEl.classList.add('tv-corrida-apres-bolha--visivel');
      setTimeout(() => {
        bolhaEl.classList.add('tv-corrida-apres-bolha--saindo');
        setTimeout(() => {
          bolhaEl.style.display = 'none';
          bolhaEl.classList.remove('tv-corrida-apres-bolha--visivel', 'tv-corrida-apres-bolha--saindo');
        }, 400);
      }, 2200);
    }

    // Permanece visível por 3.5 segundos
    await aguardar(3500);
  }

  // Encerra o overlay de apresentação
  imgEl.style.animation  = '';
  if (infoEl) infoEl.style.animation = '';
  apresEl.classList.remove('tv-corrida-apresentacao--visivel');
  apresEl.classList.add('tv-corrida-apresentacao--saindo');
  await aguardar(520);
  apresEl.style.display = 'none';
  apresEl.classList.remove('tv-corrida-apresentacao--saindo');
}

// ── A: Comentários esportivos ─────────────────────────────────────

let _comentarioTimeout = null;

function exibirComentario(el, texto) {
  if (!el) return;
  clearTimeout(_comentarioTimeout);
  el.textContent = texto;
  el.classList.remove('tv-corrida-comentario--saindo');
  el.style.display = '';
  void el.offsetWidth;
  el.classList.add('tv-corrida-comentario--visivel');
  _comentarioTimeout = setTimeout(() => {
    el.classList.add('tv-corrida-comentario--saindo');
    _comentarioTimeout = setTimeout(() => {
      el.style.display = 'none';
      el.classList.remove('tv-corrida-comentario--visivel', 'tv-corrida-comentario--saindo');
    }, 500);
  }, 2800);
}

// ── B: Eventos visuais (avaria e turbo) ───────────────────────────

function aplicarEventoVisual(raias, cor, tipo, tStart, tEnd) {
  const raia = raias[cor];
  if (!raia) return;
  const duracaoMs = (tEnd - tStart) * DURACAO_CORRIDA_MS + 600;
  const classe = `tv-corrida-raia--${tipo}`;
  raia.classList.add(classe);
  setTimeout(() => raia.classList.remove(classe), duracaoMs);
}

// ── D: Banner Reta Final ──────────────────────────────────────────

function mostrarRetaFinal(el) {
  if (!el || el.dataset.mostrado) return;
  el.dataset.mostrado = '1';
  el.style.display = '';
  void el.offsetWidth;
  el.classList.add('tv-corrida-reta-final--visivel');
  setTimeout(() => {
    el.classList.remove('tv-corrida-reta-final--visivel');
    setTimeout(() => { el.style.display = 'none'; }, 600);
  }, 3200);
}

// ── E: Confetes ───────────────────────────────────────────────────

const CORES_CONFETE = ['#F2A64A', '#6F8C52', '#B63E3E', '#2980B9', '#F1C40F', '#fff', '#FF6B9D'];

function dispararConfetes(container) {
  if (!container) return;
  for (let i = 0; i < 70; i++) {
    const el = document.createElement('div');
    el.className = 'tv-corrida-confete';
    el.style.cssText = [
      `left: ${rnd(0, 100).toFixed(1)}%`,
      `background: ${CORES_CONFETE[Math.floor(Math.random() * CORES_CONFETE.length)]}`,
      `width: ${rnd(7, 17).toFixed(0)}px`,
      `height: ${rnd(7, 17).toFixed(0)}px`,
      `border-radius: ${Math.random() > 0.5 ? '50%' : '3px'}`,
      `--dur: ${rnd(1.2, 2.8).toFixed(2)}s`,
      `--delay: ${rnd(0, 0.9).toFixed(2)}s`,
      `--dx: ${rnd(-130, 130).toFixed(0)}px`,
      `--rot: ${rnd(-540, 540).toFixed(0)}deg`,
    ].join(';');
    container.appendChild(el);
  }
  setTimeout(() => container.querySelectorAll('.tv-corrida-confete').forEach((e) => e.remove()), 5000);
}

// ── Contagem regressiva ───────────────────────────────────────────

async function contarRegressiva(el) {
  for (const txt of ['3', '2', '1', 'VAI!']) {
    el.textContent = txt;
    el.classList.add('tv-corrida-contador--ativo');
    await aguardar(txt === 'VAI!' ? 700 : 900);
    el.classList.remove('tv-corrida-contador--ativo');
    await aguardar(180);
  }
}

// ── Execução principal ────────────────────────────────────────────

export async function executarCorrida(evento, elementos) {
  const { overlay, raias, contador, resultado } = elementos;
  const vencedor       = evento.metadata?.trator_vencedor ?? TRATORES[0].cor;
  const participantes  = evento.metadata?.participantes ?? {};

  const nomes = Object.fromEntries(TRATORES.map((t) => [t.cor, participantes[t.cor] || t.label]));

  corridaState = criarEstadoCorrida(vencedor);

  overlay.style.display = '';
  overlay.classList.remove('tv-corrida--saindo', 'tv-corrida--correndo');
  overlay.classList.add('tv-corrida--ativa');
  resultado.style.display = 'none';

  // Referências aos elementos extras
  const apresEl      = overlay.querySelector('.tv-corrida-apresentacao');
  const comentarioEl = overlay.querySelector('.tv-corrida-comentario');
  const retaFinalEl  = overlay.querySelector('.tv-corrida-reta-final');

  // Reset
  if (comentarioEl) {
    clearTimeout(_comentarioTimeout);
    comentarioEl.style.display = 'none';
    comentarioEl.classList.remove('tv-corrida-comentario--visivel', 'tv-corrida-comentario--saindo');
  }
  if (retaFinalEl) {
    retaFinalEl.style.display = 'none';
    retaFinalEl.classList.remove('tv-corrida-reta-final--visivel');
    delete retaFinalEl.dataset.mostrado;
  }

  TRATORES.forEach((t) => {
    raias[t.cor]?.style.setProperty('--progresso', '0');
    raias[t.cor]?.classList.remove('tv-corrida-raia--avaria', 'tv-corrida-raia--turbo');
  });

  // ── Apresentação de competidores ─────────────────────────────
  // Mostra apenas tratores que têm participante nomeado
  const tratoresAtivos = TRATORES.filter((t) => participantes[t.cor]);
  await apresentarCompetidores(apresEl, tratoresAtivos, nomes);

  // ── Contagem regressiva ───────────────────────────────────────
  await contarRegressiva(contador);
  overlay.classList.add('tv-corrida--correndo');

  // ── Loop da corrida ───────────────────────────────────────────
  const { eventos } = corridaState;
  let liderAtual        = null;
  let retaFinalMostrada = false;
  let eventosDisp       = { avaria: false, turbo: false };
  let ultimoComentT     = -0.15;

  const inicio = performance.now();
  await new Promise((resolve) => {
    function frame(agora) {
      const t = Math.min((agora - inicio) / DURACAO_CORRIDA_MS, 1);

      let liderCor    = null;
      let liderProg   = -1;
      let segundoProg = -1;

      TRATORES.forEach((trator, idx) => {
        const raia = raias[trator.cor];
        if (!raia) return;
        const prog = calcularProgresso(trator, t, idx);
        raia.style.setProperty('--progresso', prog.toFixed(5));
        if (prog > liderProg) {
          segundoProg = liderProg;
          liderProg   = prog;
          liderCor    = trator.cor;
        } else if (prog > segundoProg) {
          segundoProg = prog;
        }
      });

      // B: Avaria
      if (!eventosDisp.avaria && t >= eventos.avaria.tStart) {
        eventosDisp.avaria = true;
        aplicarEventoVisual(raias, eventos.avaria.cor, 'avaria', eventos.avaria.tStart, eventos.avaria.tEnd);
        const pick = FRASES_AVARIA[Math.floor(Math.random() * FRASES_AVARIA.length)];
        exibirComentario(comentarioEl, pick(nomes[eventos.avaria.cor]));
        ultimoComentT = t;
      }

      // B: Turbo
      if (!eventosDisp.turbo && t >= eventos.turbo.tStart) {
        eventosDisp.turbo = true;
        aplicarEventoVisual(raias, eventos.turbo.cor, 'turbo', eventos.turbo.tStart, eventos.turbo.tEnd);
        const pick = FRASES_TURBO[Math.floor(Math.random() * FRASES_TURBO.length)];
        exibirComentario(comentarioEl, pick(nomes[eventos.turbo.cor]));
        ultimoComentT = t;
      }

      // A: Comentário por troca de liderança
      if (liderCor && liderCor !== liderAtual && t > 0.06 && (t - ultimoComentT) > 0.08) {
        liderAtual = liderCor;
        const diff = liderProg - segundoProg;
        if (diff < 0.045) {
          const pick = FRASES_EMPATADO[Math.floor(Math.random() * FRASES_EMPATADO.length)];
          exibirComentario(comentarioEl, pick);
        } else {
          const pick = FRASES_LIDERANCA[Math.floor(Math.random() * FRASES_LIDERANCA.length)];
          exibirComentario(comentarioEl, pick(nomes[liderCor]));
        }
        ultimoComentT = t;
      } else if (liderCor) {
        liderAtual = liderCor;
      }

      // D: Reta Final
      if (!retaFinalMostrada && liderProg >= 0.78) {
        retaFinalMostrada = true;
        clearTimeout(_comentarioTimeout);
        if (comentarioEl) comentarioEl.style.display = 'none';
        mostrarRetaFinal(retaFinalEl);
      }

      if (t < 1) requestAnimationFrame(frame);
      else resolve();
    }
    requestAnimationFrame(frame);
  });

  // E: Resultado com confetes
  const info = TRATORES.find((t) => t.cor === vencedor);
  const nomeVencedor = evento.vencedor ?? info?.label ?? vencedor;
  resultado.innerHTML = `
    <div class="tv-corrida-resultado-confetes"></div>
    <img class="tv-corrida-resultado-img" src="${info?.imagem ?? ''}" alt="${info?.label ?? ''}" />
    <div class="tv-corrida-resultado-texto">
      <span class="tv-corrida-resultado-trofeu">🏆</span>
      <h2>${nomeVencedor}</h2>
      <p>${info?.label ?? ''}</p>
    </div>
  `;
  resultado.style.display = '';
  dispararConfetes(resultado.querySelector('.tv-corrida-resultado-confetes'));

  await aguardar(4000);

  overlay.classList.add('tv-corrida--saindo');
  await aguardar(600);
  overlay.style.display = 'none';
  overlay.classList.remove('tv-corrida--ativa', 'tv-corrida--saindo', 'tv-corrida--correndo');
}
