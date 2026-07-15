let estadoListagem = { busca: '', status: '', prioridade: '', ordenarPor: 'data_abertura', ordem: 'DESC', pagina: 1, limite: 8 };
let debounceBusca = null;

function statusClass(status) { return `pill-status-${slug(status)}`; }
function prioClass(prioridade) { return `pill-prio-${slug(prioridade)}`; }

async function carregarListagem() {
  const container = document.getElementById('lista-chamados');
  const paginacaoEl = document.getElementById('paginacao-chamados');
  container.innerHTML = '<div class="spinner"></div>';
  paginacaoEl.innerHTML = '';

  try {
    const resposta = await Api.listarTickets(estadoListagem);
    const { dados, paginacao } = resposta;

    if (dados.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <h3>Nenhum chamado encontrado</h3>
          <p>Tente ajustar os filtros ou <a href="ticket-form.html" style="color:var(--accent); font-weight:600;">abra um novo chamado</a>.</p>
        </div>`;
      return;
    }

    container.innerHTML = `<div class="ticket-list">${dados.map(chamadoStubHtml).join('')}</div>`;
    renderPaginacao(paginacao);
  } catch (err) {
    container.innerHTML = `<div class="empty-state"><h3>Erro ao carregar chamados</h3><p>${err.message}</p></div>`;
    mostrarToast(err.message, 'erro');
  }
}

function chamadoStubHtml(c) {
  return `
    <a class="ticket-stub" href="ticket-detail.html?id=${c.id}">
      <div class="stub-num mono">${ticketId(c.id)}</div>
      <div class="stub-info">
        <div class="title">${c.titulo}</div>
        <div class="meta">
          <span>${c.solicitante}</span>
          <span>·</span>
          <span>${c.categoria}</span>
        </div>
      </div>
      <span class="pill ${statusClass(c.status)}">${c.status}</span>
      <span class="pill ${prioClass(c.prioridade)}">${c.prioridade}</span>
      <div class="stub-date">${formatarData(c.data_abertura).split(' ')[0]}</div>
    </a>
  `;
}

function renderPaginacao(paginacao) {
  const el = document.getElementById('paginacao-chamados');
  if (paginacao.totalPaginas <= 1) { el.innerHTML = ''; return; }

  let botoes = `<button ${paginacao.pagina === 1 ? 'disabled' : ''} onclick="irParaPagina(${paginacao.pagina - 1})">‹</button>`;
  for (let p = 1; p <= paginacao.totalPaginas; p++) {
    botoes += `<button class="${p === paginacao.pagina ? 'active' : ''}" onclick="irParaPagina(${p})">${p}</button>`;
  }
  botoes += `<button ${paginacao.pagina === paginacao.totalPaginas ? 'disabled' : ''} onclick="irParaPagina(${paginacao.pagina + 1})">›</button>`;

  el.innerHTML = `<div class="pagination">${botoes}</div>`;
}

function irParaPagina(p) {
  estadoListagem.pagina = p;
  carregarListagem();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function iniciarListagem() {
  carregarListagem();

  document.getElementById('filtro-busca').addEventListener('input', (e) => {
    clearTimeout(debounceBusca);
    debounceBusca = setTimeout(() => {
      estadoListagem.busca = e.target.value.trim();
      estadoListagem.pagina = 1;
      carregarListagem();
    }, 350);
  });

  document.getElementById('filtro-status').addEventListener('change', (e) => {
    estadoListagem.status = e.target.value;
    estadoListagem.pagina = 1;
    carregarListagem();
  });

  document.getElementById('filtro-prioridade').addEventListener('change', (e) => {
    estadoListagem.prioridade = e.target.value;
    estadoListagem.pagina = 1;
    carregarListagem();
  });

  document.getElementById('filtro-ordenar').addEventListener('change', (e) => {
    const [campo, ordem] = e.target.value.split('-');
    estadoListagem.ordenarPor = campo;
    estadoListagem.ordem = ordem;
    carregarListagem();
  });
}
