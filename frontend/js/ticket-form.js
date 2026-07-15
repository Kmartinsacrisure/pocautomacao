function idDaUrl() {
  return new URLSearchParams(window.location.search).get('id');
}

function limparErrosForm() {
  ['titulo', 'descricao', 'categoria', 'prioridade', 'solicitante'].forEach(campo => {
    const fieldEl = document.getElementById(`field-${campo}`);
    if (fieldEl) fieldEl.classList.remove('has-error');
    const erroEl = document.getElementById(`erro-${campo}`);
    if (erroEl) erroEl.textContent = '';
  });
}

function marcarErroForm(campo, mensagem) {
  const fieldEl = document.getElementById(`field-${campo}`);
  if (fieldEl) fieldEl.classList.add('has-error');
  const erroEl = document.getElementById(`erro-${campo}`);
  if (erroEl) erroEl.textContent = mensagem;
}

function validarFormulario(dados) {
  let valido = true;
  if (!dados.titulo.trim()) { marcarErroForm('titulo', 'O título é obrigatório.'); valido = false; }
  if (!dados.descricao.trim()) { marcarErroForm('descricao', 'A descrição é obrigatória.'); valido = false; }
  if (!dados.categoria) { marcarErroForm('categoria', 'Selecione uma categoria.'); valido = false; }
  if (!dados.prioridade) { marcarErroForm('prioridade', 'Selecione uma prioridade.'); valido = false; }
  if (!dados.solicitante.trim()) { marcarErroForm('solicitante', 'Informe o solicitante.'); valido = false; }
  return valido;
}

async function iniciarFormulario() {
  const id = idDaUrl();
  const form = document.getElementById('form-chamado');
  const btnSalvar = document.getElementById('btn-salvar');

  if (id) {
    document.getElementById('titulo-pagina').textContent = `Editar chamado ${ticketId(id)}`;
    btnSalvar.textContent = 'Salvar Alterações';
    document.getElementById('field-status-wrap').style.display = 'block';

    try {
      const { chamado } = await Api.buscarTicket(id);
      document.getElementById('titulo').value = chamado.titulo;
      document.getElementById('descricao').value = chamado.descricao;
      document.getElementById('categoria').value = chamado.categoria;
      document.getElementById('prioridade').value = chamado.prioridade;
      document.getElementById('solicitante').value = chamado.solicitante;
      document.getElementById('status').value = chamado.status;
    } catch (err) {
      mostrarToast(err.message, 'erro');
    }
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    limparErrosForm();

    const dados = {
      titulo: document.getElementById('titulo').value,
      descricao: document.getElementById('descricao').value,
      categoria: document.getElementById('categoria').value,
      prioridade: document.getElementById('prioridade').value,
      solicitante: document.getElementById('solicitante').value
    };
    if (id) dados.status = document.getElementById('status').value;

    if (!validarFormulario(dados)) return;

    btnSalvar.disabled = true;
    btnSalvar.textContent = 'Salvando...';

    try {
      if (id) {
        await Api.atualizarTicket(id, dados);
        mostrarToast('Chamado atualizado com sucesso!', 'sucesso');
        setTimeout(() => window.location.href = `ticket-detail.html?id=${id}`, 400);
      } else {
        const resposta = await Api.criarTicket(dados);
        mostrarToast('Chamado aberto com sucesso!', 'sucesso');
        setTimeout(() => window.location.href = `ticket-detail.html?id=${resposta.chamado.id}`, 400);
      }
    } catch (err) {
      mostrarToast(err.message, 'erro');
      if (err.detalhes) {
        err.detalhes.forEach(msg => {
          if (msg.includes('Título')) marcarErroForm('titulo', msg);
          if (msg.includes('Descrição')) marcarErroForm('descricao', msg);
          if (msg.includes('Categoria')) marcarErroForm('categoria', msg);
          if (msg.includes('Prioridade')) marcarErroForm('prioridade', msg);
          if (msg.includes('Solicitante')) marcarErroForm('solicitante', msg);
        });
      }
      btnSalvar.disabled = false;
      btnSalvar.textContent = id ? 'Salvar Alterações' : 'Abrir Chamado';
    }
  });
}
