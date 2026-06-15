// Entregas Pendentes — Etapa 2 do fluxo de premiação (ver ROADMAP.md, FASE 7).
//
// Lista `vw_entregas_pendentes` (status='revealed') e eventos `delivered`
// sem foto (upload anterior falhou). "Registrar Entrega" comprime e envia a
// foto para o bucket `fotos`, marca `eventos.status='delivered'/'completed'`,
// `premios.status='entregue'` e, se for o Tesouro, `config.tesouro_status=
// 'encontrado'`.

import { supabase } from './supabaseClient.js';
import { subscribeEntregasPendentes } from './realtime.js';

const CATEGORIA_LABEL = { comum: 'Comum', raro: 'Raro', lendario: 'Lendário' };

const MAX_DIMENSAO = 1280;
const QUALIDADE_JPEG = 0.8;

const listaPendentes = document.getElementById('lista-pendentes');
const listaSemFoto = document.getElementById('lista-sem-foto');

const modal = document.getElementById('modal-entrega');
const modalTitulo = document.getElementById('modal-titulo');
const previewPremio = document.getElementById('preview-premio');
const previewNome = document.getElementById('preview-nome');
const previewVencedor = document.getElementById('preview-vencedor');
const previewFoto = document.getElementById('preview-foto');
const erroEntrega = document.getElementById('erro-entrega');

const inputCamera = document.getElementById('input-camera');
const inputGaleria = document.getElementById('input-galeria');
const btnTirarFoto = document.getElementById('btn-tirar-foto');
const btnEnviarFoto = document.getElementById('btn-enviar-foto');
const btnCancelar = document.getElementById('btn-cancelar-entrega');
const btnConfirmar = document.getElementById('btn-confirmar-entrega');

let eventoAtual = null;
let modoReenvio = false;
let arquivoSelecionado = null;

// Reduz a foto para no máximo MAX_DIMENSAO px (lado maior) e converte para
// JPEG, evitando uploads grandes via celular.
function comprimirImagem(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      let { width, height } = img;

      if (width > height && width > MAX_DIMENSAO) {
        height = Math.round((height * MAX_DIMENSAO) / width);
        width = MAX_DIMENSAO;
      } else if (height > MAX_DIMENSAO) {
        width = Math.round((width * MAX_DIMENSAO) / height);
        height = MAX_DIMENSAO;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);

      canvas.toBlob((blob) => {
        URL.revokeObjectURL(url);
        if (blob) resolve(blob); else reject(new Error('Falha ao processar a imagem.'));
      }, 'image/jpeg', QUALIDADE_JPEG);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Não foi possível abrir a imagem.'));
    };

    img.src = url;
  });
}

function mostrarErro(mensagem) {
  erroEntrega.textContent = mensagem;
  erroEntrega.style.display = '';
}

function ocultarErro() {
  erroEntrega.style.display = 'none';
}

function selecionarArquivo(file) {
  if (!file) return;

  arquivoSelecionado = file;
  ocultarErro();

  const url = URL.createObjectURL(file);
  previewFoto.src = url;
  previewFoto.style.display = '';
}

function abrirModal(evento, reenvio) {
  eventoAtual = evento;
  modoReenvio = reenvio;
  arquivoSelecionado = null;

  modalTitulo.textContent = reenvio ? 'Reenviar Foto' : 'Registrar Entrega';
  previewPremio.src = evento.premio_imagem_url || '../assets/img/icons/estrela.svg';
  previewNome.textContent = `${evento.premio_nome ?? ''}${evento.premio_codigo ? ` (${evento.premio_codigo})` : ''}`;
  previewVencedor.textContent = `Ganhador: ${evento.vencedor}`;

  previewFoto.src = '';
  previewFoto.style.display = 'none';
  inputCamera.value = '';
  inputGaleria.value = '';
  ocultarErro();

  modal.style.display = 'flex';
}

function fecharModal() {
  modal.style.display = 'none';
  eventoAtual = null;
}

async function confirmarEntrega() {
  if (modoReenvio && !arquivoSelecionado) {
    mostrarErro('Selecione uma foto para reenviar.');
    return;
  }

  btnConfirmar.disabled = true;
  btnCancelar.disabled = true;
  ocultarErro();

  try {
    let fotoUrl = null;

    if (arquivoSelecionado) {
      const blob = await comprimirImagem(arquivoSelecionado);
      const caminho = `${eventoAtual.id}.jpg`;

      const { error: erroUpload } = await supabase.storage
        .from('fotos')
        .upload(caminho, blob, { contentType: 'image/jpeg', upsert: true });

      if (erroUpload) throw new Error(`Falha ao enviar foto: ${erroUpload.message}`);

      const { data: urlData } = supabase.storage.from('fotos').getPublicUrl(caminho);
      fotoUrl = urlData.publicUrl;
    }

    const agora = new Date().toISOString();
    const payload = modoReenvio
      ? { foto_url: fotoUrl, status: 'completed', completed_at: agora }
      : {
          status: fotoUrl ? 'completed' : 'delivered',
          delivered_at: agora,
          ...(fotoUrl ? { foto_url: fotoUrl, completed_at: agora } : {}),
        };

    const { error: erroEvento } = await supabase.from('eventos').update(payload).eq('id', eventoAtual.id);
    if (erroEvento) throw erroEvento;

    if (!modoReenvio) {
      const { error: erroPremio } = await supabase
        .from('premios')
        .update({ status: 'entregue' })
        .eq('id', eventoAtual.premio_id);
      if (erroPremio) throw erroPremio;

      if (eventoAtual.metadata?.is_tesouro === true) {
        const { error: erroTesouro } = await supabase
          .from('config')
          .update({ tesouro_status: 'encontrado' })
          .eq('id', 1);
        if (erroTesouro) throw erroTesouro;
      }
    }

    fecharModal();
    await carregarTudo();
  } catch (err) {
    mostrarErro(err.message);
  } finally {
    btnConfirmar.disabled = false;
    btnCancelar.disabled = false;
  }
}

function renderPendente(evento) {
  const div = document.createElement('div');
  div.className = 'card entrega-item';

  const imagem = evento.premio_imagem_url || '../assets/img/icons/estrela.svg';
  const categoria = evento.premio_categoria ?? 'comum';

  div.innerHTML = `
    <img class="entrega-imagem" src="${imagem}" alt="" />
    <div class="entrega-info">
      <strong>${evento.vencedor}</strong>
      <p>${evento.premio_nome ?? ''}${evento.premio_codigo ? ` (${evento.premio_codigo})` : ''}</p>
      <div class="entrega-badges">
        <span class="badge badge-${categoria}">${CATEGORIA_LABEL[categoria] ?? ''}</span>
        ${evento.metadata?.is_tesouro === true ? '<span title="Tesouro da Fazenda">🏆</span>' : ''}
      </div>
    </div>
    <button type="button" class="botao botao-primario entrega-acao" data-acao="entregar">Registrar Entrega</button>
  `;

  div.querySelector('[data-acao="entregar"]').addEventListener('click', () => abrirModal(evento, false));
  return div;
}

function renderSemFoto(evento) {
  const div = document.createElement('div');
  div.className = 'card entrega-item';

  const imagem = evento.premio_imagem_url || '../assets/img/icons/estrela.svg';
  const categoria = evento.premio_categoria ?? 'comum';

  div.innerHTML = `
    <img class="entrega-imagem" src="${imagem}" alt="" />
    <div class="entrega-info">
      <strong>${evento.vencedor}</strong>
      <p>${evento.premio_nome ?? ''}${evento.premio_codigo ? ` (${evento.premio_codigo})` : ''}</p>
      <div class="entrega-badges">
        <span class="badge badge-${categoria}">${CATEGORIA_LABEL[categoria] ?? ''}</span>
        ${evento.metadata?.is_tesouro === true ? '<span title="Tesouro da Fazenda">🏆</span>' : ''}
      </div>
    </div>
    <button type="button" class="botao botao-secundario entrega-acao" data-acao="reenviar">Enviar Foto</button>
  `;

  div.querySelector('[data-acao="reenviar"]').addEventListener('click', () => abrirModal(evento, true));
  return div;
}

async function carregarPendentes() {
  const { data, error } = await supabase.from('vw_entregas_pendentes').select('*');

  if (error) {
    listaPendentes.innerHTML = `<p>Erro ao carregar entregas pendentes: ${error.message}</p>`;
    return;
  }

  listaPendentes.innerHTML = '';
  if (!data.length) {
    listaPendentes.innerHTML = '<p class="lista-vazia">Nenhuma entrega pendente.</p>';
    return;
  }

  data.forEach((evento) => listaPendentes.appendChild(renderPendente(evento)));
}

async function carregarSemFoto() {
  const { data, error } = await supabase
    .from('eventos')
    .select('*')
    .eq('status', 'delivered')
    .is('foto_url', null)
    .order('delivered_at', { ascending: true });

  if (error) {
    listaSemFoto.innerHTML = `<p>Erro ao carregar entregas sem foto: ${error.message}</p>`;
    return;
  }

  listaSemFoto.innerHTML = '';
  if (!data.length) {
    listaSemFoto.innerHTML = '<p class="lista-vazia">Nenhuma foto pendente de reenvio.</p>';
    return;
  }

  data.forEach((evento) => listaSemFoto.appendChild(renderSemFoto(evento)));
}

async function carregarTudo() {
  await Promise.all([carregarPendentes(), carregarSemFoto()]);
}

btnTirarFoto.addEventListener('click', () => inputCamera.click());
btnEnviarFoto.addEventListener('click', () => inputGaleria.click());
inputCamera.addEventListener('change', () => selecionarArquivo(inputCamera.files[0]));
inputGaleria.addEventListener('change', () => selecionarArquivo(inputGaleria.files[0]));

btnCancelar.addEventListener('click', fecharModal);
btnConfirmar.addEventListener('click', confirmarEntrega);
modal.addEventListener('click', (event) => {
  if (event.target === modal) fecharModal();
});

carregarTudo();
subscribeEntregasPendentes(carregarTudo);
