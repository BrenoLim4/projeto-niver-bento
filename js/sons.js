// Módulo de áudio da TV (ver ROADMAP.md, seção 1.9).
//
// `desbloquear()` deve ser chamado durante a interação inicial (botão "Iniciar
// TV") para liberar o autoplay nos navegadores. `tocar(nome)` reproduz um dos
// efeitos pré-carregados a partir do início.

const ARQUIVOS = {
  suspense:      '../assets/audio/suspense.mp3',
  bau:           '../assets/audio/bau.mp3',
  vitoria:       '../assets/audio/vitoria.mp3',
  tesouro:       '../assets/audio/tesouro.mp3',
  roleta_giro:   '../assets/audio/roleta-girando.mp3',
  roleta_clique: '../assets/audio/roleta-clique.mp3',
  roleta_fim:    '../assets/audio/roleta-vencedor.mp3',
};

const audios = Object.fromEntries(
  Object.entries(ARQUIVOS).map(([nome, src]) => {
    const audio = new Audio(src);
    audio.preload = 'auto';
    return [nome, audio];
  })
);

export function desbloquear() {
  for (const audio of Object.values(audios)) {
    audio.play().then(() => audio.pause()).catch(() => {});
    audio.currentTime = 0;
  }
}

export function tocar(nome) {
  const audio = audios[nome];
  if (!audio) return;
  audio.currentTime = 0;
  audio.play().catch(() => {});
}

export function tocarLoop(nome) {
  const audio = audios[nome];
  if (!audio) return;
  audio.loop = true;
  audio.currentTime = 0;
  audio.play().catch(() => {});
}

export function pararSom(nome) {
  const audio = audios[nome];
  if (!audio) return;
  audio.pause();
  audio.currentTime = 0;
  audio.loop = false;
}
