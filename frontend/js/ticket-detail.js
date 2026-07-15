function idDaUrlDetalhe() {
  return new URLSearchParams(window.location.search).get('id');
}

async function carregarDetalhe() {
  const id = idDaUrlDetalhe();
  const container = document.getElementById('conteudo-detalhe');

  if (!id) {
    container.innerHTML = `<div class="empty-state"><h3>Chamado não informado</h3></div>`;
    return;
  }

  try {
    const { chamado, comentarios, historico } = await Api.buscarTicket(id);
    renderDetalhe(chamado, comentarios, historico);
  } catch (err) {
    container.innerHTML = `<div class="empty-state"><h3>Não foi possível carregar o chamado</h3><p>${err.message}</p></div>`;
    mostrarToast(err.message, 'erro');
  }
}

function renderDetalhe(c, comentarios, historico) {
  const container = document.getElementById('conteudo-detalhe');

  container.innerHTML = `
    <div class="topbar">
      <div>
        <div class="eyebrow"><a href="tickets.html" style="color:var(--text-muted);">← Voltar aos chamados</a></div>
        <h1>${ticketId(c.id)} · ${c.titulo}</h1>
      </div>
      <div style="display:flex; gap:8px;">
        <a href="ticket-form.html?id=${c.id}" class="btn btn-secondary">Editar</a>
        <button class="btn btn-danger" id="btn-excluir">Excluir</button>
      </div>
    </div>

    <div class="detail-grid">
      <div>
        <div class="card">
          <div class="detail-header">
            <div style="display:flex; gap:8px;">
              <span class="pill pill-status-${slug(c.status)}">${c.status}</span>
              <span class="pill pill-prio-${slug(c.prioridade)}">${c.prioridade}</span>
            </div>
          </div>
          <p class="detail-desc">${c.descricao}</p>
        </div>

        <div class="section-title">Comentários</div>
        <div class="card">
          <div class="comment-box" id="lista-comentarios">
            ${comentarios.length ? comentarios.map(comentarioHtml).join('') : '<p style="color:var(--text-faint); font-size:13px;">Nenhum comentário ainda.</p>'}
          </div>
          <form id="form-comentario">
            <div class="field" id="field-comentario" style="margin-bottom:10px;">
              <textarea id="novo-comentario" rows="3" placeholder="Escreva um comentário sobre este chamado..."></textarea>
              <div class="field-error" id="erro-comentario"></div>
            </div>
            <button type="submit" class="btn btn-primary" id="btn-comentar">Adicionar Comentário</button>
          </form>
        </div>

        <div class="section-title">Histórico de Alterações</div>
        <div class="card">
          <div class="timeline">
            ${historico.length ? historico.map(historicoHtml).join('') : '<p style="color:var(--text-faint); font-size:13px;">Sem alterações registradas.</p>'}
          </div>
        </div>
      </div>

      <div>
        <div class="card">
          <div class="section-title" style="margin-top:0;">Informações</div>
          <div class="info-list">
            <div class="row"><span class="k">Solicitante</span><span class="v">${c.solicitante}</span></div>
            <div class="row"><span class="k">Categoria</span><span class="v">${c.categoria}</span></div>
            <div class="row"><span class="k">Aberto em</span><span class="v">${formatarData(c.data_abertura)}</span></div>
            <div class="row"><span class="k">Atualizado em</span><span class="v">${formatarData(c.data_atualizacao)}</span></div>
          </div>

          <div class="section-title">Alterar Status</div>
          <div class="field">
            <select id="select-status">
              ${['Aberto', 'Em Atendimento', 'Finalizado'].map(s => `<option ${s === c.status ? 'selected' : ''}>${s}</option>`).join('')}
            </select>
          </div>

          <div class="section-title">Alterar Prioridade</div>
          <div class="field">
            <select id="select-prioridade">
              ${['Baixa', 'Média', 'Alta'].map(p => `<option ${p === c.prioridade ? 'selected' : ''}>${p}</option>`).join('')}
            </select>
          </div>

          <button class="btn btn-primary btn-block" id="btn-atualizar">Salvar Alterações</button>
        </div>
      </div>
    </div>
  `;

  document.getElementById('btn-atualizar').addEventListener('click', () => atualizarStatusPrioridade(c.id));
  document.getElementById('btn-excluir').addEventListener('click', () => excluirChamado(c.id));
  document.getElementById('form-comentario').addEventListener('submit', (e) => adicionarComentario(e, c.id));
}

function comentarioHtml(cm) {
  return `
    <div class="comment-item">
      <span class="author">${cm.usuario}</span><span class="when">${formatarData(cm.data)}</span>
      <div class="txt">${cm.comentario}</div>
    </div>
  `;
}

function historicoHtml(h) {
  return `
    <div class="timeline-item">
      <div class="timeline-dot"></div>
      <div class="timeline-body">
        <div class="txt">${h.alteracao} <strong>· ${h.usuario}</strong></div>
        <div class="meta">${formatarData(h.data)}</div>
      </div>
    </div>
  `;
}

async function atualizarStatusPrioridade(id) {
  const btn = document.getElementById('btn-atualizar');
  const status = document.getElementById('select-status').value;
  const prioridade = document.getElementById('select-prioridade').value;

  btn.disabled = true;
  btn.textContent = 'Salvando...';
  try {
    await Api.atualizarTicket(id, { status, prioridade });
    mostrarToast('Chamado atualizado com sucesso!', 'sucesso');
    carregarDetalhe();
  } catch (err) {
    mostrarToast(err.message, 'erro');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Salvar Alterações';
  }
}

async function excluirChamado(id) {
  if (!confirm('Tem certeza que deseja excluir este chamado? Esta ação não pode ser desfeita.')) return;
  try {
    await Api.removerTicket(id);
    mostrarToast('Chamado excluído com sucesso!', 'sucesso');
    setTimeout(() => window.location.href = 'tickets.html', 400);
  } catch (err) {
    mostrarToast(err.message, 'erro');
  }
}

async function adicionarComentario(e, id) {
  e.preventDefault();
  const textarea = document.getElementById('novo-comentario');
  const erroEl = document.getElementById('erro-comentario');
  const fieldEl = document.getElementById('field-comentario');
  const btn = document.getElementById('btn-comentar');

  erroEl.textContent = '';
  fieldEl.classList.remove('has-error');

  if (!textarea.value.trim()) {
    erroEl.textContent = 'Escreva algo antes de enviar.';
    fieldEl.classList.add('has-error');
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Enviando...';
  try {
    await Api.comentar(id, textarea.value.trim());
    mostrarToast('Comentário adicionado!', 'sucesso');
    carregarDetalhe();
  } catch (err) {
    mostrarToast(err.message, 'erro');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Adicionar Comentário';
  }
}
