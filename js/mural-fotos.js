// Mural de Fotos — upload de fotos/vídeos da festa para o bucket
// `fotos-bento` (Supabase Storage). A TV lê esse bucket automaticamente
// via Realtime (ver tv/index.html, Mural de Fotos e Vídeos).

import { supabase } from './supabaseClient.js';

const BUCKET = 'fotos-bento';
const EXT_IMAGEM = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'heic'];
const EXT_VIDEO = ['mp4', 'webm', 'mov', 'm4v'];
const MAX_IMAGEM_BYTES = 2 * 1024 * 1024;
const MAX_VIDEO_BYTES = 10 * 1024 * 1024;

const btnCamera = document.getElementById('btn-camera');
const btnGaleria = document.getElementById('btn-galeria');
const inputCamera = document.getElementById('input-camera');
const inputGaleria = document.getElementById('input-galeria');
const listaEnvios = document.getElementById('lista-envios');

function extensaoDe(nome) {
  const m = /\.([a-z0-9]+)$/i.exec(nome);
  return m ? m[1].toLowerCase() : '';
}

function tipoArquivo(file) {
  if (file.type.startsWith('image/')) return 'imagem';
  if (file.type.startsWith('video/')) return 'video';
  const ext = extensaoDe(file.name);
  if (EXT_IMAGEM.includes(ext)) return 'imagem';
  if (EXT_VIDEO.includes(ext)) return 'video';
  return null;
}

function formatarTamanho(bytes) {
  const mb = bytes / (1024 * 1024);
  if (mb >= 1) return `${mb.toFixed(1)} MB`;
  return `${Math.ceil(bytes / 1024)} KB`;
}

function validar(file, tipo) {
  if (!tipo) return 'Formato não suportado.';
  if (tipo === 'imagem' && file.size > MAX_IMAGEM_BYTES) {
    return `Imagem acima de 2 MB (${formatarTamanho(file.size)}).`;
  }
  if (tipo === 'video' && file.size > MAX_VIDEO_BYTES) {
    return `Vídeo acima de 10 MB (${formatarTamanho(file.size)}).`;
  }
  return null;
}

function gerarNomeArquivo(nomeOriginal) {
  const ext = extensaoDe(nomeOriginal) || 'bin';
  const id = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `${id}.${ext}`;
}

function definirStatus(statusEl, texto, variante) {
  statusEl.textContent = texto;
  statusEl.className = `envio-status envio-status--${variante}`;
}

function criarLinhaEnvio(file, tipo) {
  const div = document.createElement('div');
  div.className = 'card envio-item';

  const miniatura = tipo === 'video'
    ? '<div class="envio-miniatura envio-miniatura--video">🎬</div>'
    : `<img class="envio-miniatura" src="${URL.createObjectURL(file)}" alt="" />`;

  div.innerHTML = `
    ${miniatura}
    <div class="envio-info">
      <strong>${file.name}</strong>
      <p class="envio-status envio-status--pendente">${formatarTamanho(file.size)} — aguardando...</p>
    </div>
  `;

  listaEnvios.prepend(div);
  return div.querySelector('.envio-status');
}

async function enviarArquivo(file) {
  const listaVazia = listaEnvios.querySelector('.lista-vazia');
  if (listaVazia) listaVazia.remove();

  const tipo = tipoArquivo(file);
  const statusEl = criarLinhaEnvio(file, tipo ?? 'imagem');

  const erroValidacao = validar(file, tipo);
  if (erroValidacao) {
    definirStatus(statusEl, `❌ ${erroValidacao}`, 'erro');
    return;
  }

  definirStatus(statusEl, '⏳ Enviando...', 'enviando');

  const caminho = gerarNomeArquivo(file.name);
  const { error } = await supabase.storage.from(BUCKET).upload(caminho, file, {
    contentType: file.type || undefined,
    upsert: false,
  });

  if (error) {
    definirStatus(statusEl, `❌ Falha no envio: ${error.message}`, 'erro');
    return;
  }

  definirStatus(statusEl, '✅ Enviado — já está no Mural da TV', 'sucesso');
}

async function processarArquivos(files) {
  for (const file of Array.from(files)) {
    await enviarArquivo(file);
  }
}

btnCamera.addEventListener('click', () => inputCamera.click());
btnGaleria.addEventListener('click', () => inputGaleria.click());

inputCamera.addEventListener('change', () => {
  processarArquivos(inputCamera.files);
  inputCamera.value = '';
});

inputGaleria.addEventListener('change', () => {
  processarArquivos(inputGaleria.files);
  inputGaleria.value = '';
});
