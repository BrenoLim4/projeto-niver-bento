// CRUD de prêmios (dashboard/premios.html) — ver ROADMAP.md, FASE 3.

import { supabase } from './supabaseClient.js';

const lista = document.getElementById('lista-premios');
const modal = document.getElementById('modal-premio');
const modalTitulo = document.getElementById('modal-titulo');
const form = document.getElementById('form-premio');
const btnNovo = document.getElementById('btn-novo');
const btnCancelar = document.getElementById('btn-cancelar');

const CATEGORIA_LABEL = { comum: 'Comum', raro: 'Raro', lendario: 'Lendário' };
const STATUS_LABEL = { disponivel: 'Disponível', reservado: 'Reservado', entregue: 'Entregue' };
const ELEGIVEL_LABEL = { pescaria: 'Pescaria', memoria: 'Memória', roleta: 'Roleta', corrida: 'Corrida', livre: 'Livre' };

let editandoId = null;

function abrirModal(premio = null) {
  form.reset();
  form.querySelectorAll('input[type="checkbox"]').forEach((cb) => { cb.checked = false; });

  if (premio) {
    editandoId = premio.id;
    modalTitulo.textContent = `Editar Prêmio — ${premio.codigo}`;
    document.getElementById('f-codigo').value = premio.codigo;
    document.getElementById('f-nome').value = premio.nome;
    document.getElementById('f-descricao').value = premio.descricao ?? '';
    document.getElementById('f-imagem').value = premio.imagem_url ?? '';
    document.getElementById('f-categoria').value = premio.categoria;
    document.getElementById('f-status').value = premio.status;

    (premio.elegivel_para ?? []).forEach((tipo) => {
      const cb = form.querySelector(`input[type="checkbox"][value="${tipo}"]`);
      if (cb) cb.checked = true;
    });

    document.getElementById('f-bloqueado').checked = !!premio.bloqueado;
    document.getElementById('f-tesouro').checked = !!premio.is_tesouro;
  } else {
    editandoId = null;
    modalTitulo.textContent = 'Novo Prêmio';
  }

  modal.style.display = 'flex';
}

function fecharModal() {
  modal.style.display = 'none';
  editandoId = null;
}

btnNovo.addEventListener('click', () => abrirModal());
btnCancelar.addEventListener('click', fecharModal);
modal.addEventListener('click', (event) => {
  if (event.target === modal) fecharModal();
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const elegivelPara = Array.from(
    form.querySelectorAll('.elegivel-opcoes input[type="checkbox"]:checked')
  ).map((cb) => cb.value);

  const payload = {
    codigo: document.getElementById('f-codigo').value.trim(),
    nome: document.getElementById('f-nome').value.trim(),
    descricao: document.getElementById('f-descricao').value.trim() || null,
    imagem_url: document.getElementById('f-imagem').value.trim() || null,
    categoria: document.getElementById('f-categoria').value,
    status: document.getElementById('f-status').value,
    elegivel_para: elegivelPara,
    bloqueado: document.getElementById('f-bloqueado').checked,
    is_tesouro: document.getElementById('f-tesouro').checked,
  };

  const btnSalvar = form.querySelector('button[type="submit"]');
  btnSalvar.disabled = true;

  try {
    if (payload.is_tesouro) {
      // Garante que exista apenas 1 prêmio marcado como Tesouro da Fazenda.
      let query = supabase.from('premios').update({ is_tesouro: false }).eq('is_tesouro', true);
      if (editandoId) query = query.neq('id', editandoId);
      const { error: erroTesouro } = await query;
      if (erroTesouro) throw erroTesouro;
    }

    if (editandoId) {
      const { error } = await supabase.from('premios').update(payload).eq('id', editandoId);
      if (error) throw error;
    } else {
      const { error } = await supabase.from('premios').insert(payload);
      if (error) throw error;
    }

    fecharModal();
    await carregarPremios();
  } catch (err) {
    alert(`Erro ao salvar prêmio: ${err.message}`);
  } finally {
    btnSalvar.disabled = false;
  }
});

async function excluirPremio(id, codigo) {
  if (!confirm(`Excluir o prêmio ${codigo}? Esta ação não pode ser desfeita.`)) return;

  const { error } = await supabase.from('premios').delete().eq('id', id);
  if (error) {
    alert(`Erro ao excluir: ${error.message}`);
    return;
  }

  await carregarPremios();
}

function renderPremio(premio) {
  const elegivel = (premio.elegivel_para ?? []).length
    ? premio.elegivel_para.map((tipo) => ELEGIVEL_LABEL[tipo] ?? tipo).join(', ')
    : 'Universal';

  const div = document.createElement('div');
  div.className = 'card';
  div.innerHTML = `
    <div class="flex justificar-entre itens-centro">
      <strong>${premio.codigo} — ${premio.nome}</strong>
      ${premio.is_tesouro ? '<span title="Tesouro da Fazenda">🏆</span>' : ''}
    </div>
    <div class="flex gap-sm" style="flex-wrap: wrap; margin: var(--espaco-sm) 0;">
      <span class="badge badge-${premio.categoria}">${CATEGORIA_LABEL[premio.categoria]}</span>
      <span class="badge badge-${premio.status}">${STATUS_LABEL[premio.status]}</span>
      ${premio.bloqueado ? '<span class="badge badge-bloqueado">Bloqueado</span>' : ''}
    </div>
    <p class="premio-elegivel">Elegível: ${elegivel}</p>
    <div class="flex gap-sm">
      <button type="button" class="botao botao-secundario" data-acao="editar">Editar</button>
      <button type="button" class="botao botao-perigo" data-acao="excluir">Excluir</button>
    </div>
  `;

  div.querySelector('[data-acao="editar"]').addEventListener('click', () => abrirModal(premio));
  div.querySelector('[data-acao="excluir"]').addEventListener('click', () => excluirPremio(premio.id, premio.codigo));

  return div;
}

async function carregarPremios() {
  const { data, error } = await supabase.from('premios').select('*').order('codigo');

  if (error) {
    lista.innerHTML = `<p>Erro ao carregar prêmios: ${error.message}</p>`;
    return;
  }

  lista.innerHTML = '';
  if (!data.length) {
    lista.innerHTML = '<p>Nenhum prêmio cadastrado.</p>';
    return;
  }

  data.forEach((premio) => lista.appendChild(renderPremio(premio)));
}

carregarPremios();

supabase
  .channel('premios-dashboard')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'premios' }, carregarPremios)
  .subscribe();
