const CORES_STATUS = { 'Aberto': 'var(--status-aberto)', 'Em Atendimento': 'var(--status-atendimento)', 'Finalizado': 'var(--status-finalizado)' };
const CORES_PRIORIDADE = { 'Baixa': 'var(--prio-baixa)', 'Média': 'var(--prio-media)', 'Alta': 'var(--prio-alta)' };
const CORES_CATEGORIA = ['#3462E8', '#16815B', '#B9660A', '#7C3AED', '#C22C2C'];

function renderBarChart(dados, campoLabel, coresMap) {
  const max = Math.max(...dados.map(d => d.total), 1);
  return dados.map((d, i) => {
    const cor = typeof coresMap === 'function' ? coresMap(i) : (coresMap[d[campoLabel]] || 'var(--accent)');
    const largura = (d.total / max) * 100;
    return `
      <div class="bar-row">
        <div class="bar-label">${d[campoLabel]}</div>
        <div class="bar-track"><div class="bar-fill" style="width:${largura}%; background:${cor}"></div></div>
        <div class="bar-value">${d.total}</div>
      </div>
    `;
  }).join('');
}

async function carregarDashboard() {
  const container = document.getElementById('conteudo-dashboard');
  try {
    const dados = await Api.dashboard();

    container.innerHTML = `
      <div class="stat-grid">
        <div class="stat-card">
          <div class="label">Total de Chamados</div>
          <div class="value">${dados.total}</div>
          <div class="sub">Todos os chamados registrados</div>
        </div>
        <div class="stat-card accent-aberto">
          <div class="label">Abertos</div>
          <div class="value">${dados.abertos}</div>
          <div class="sub">Aguardando atendimento</div>
        </div>
        <div class="stat-card accent-atendimento">
          <div class="label">Em Atendimento</div>
          <div class="value">${dados.emAtendimento}</div>
          <div class="sub">Em andamento no momento</div>
        </div>
        <div class="stat-card accent-finalizado">
          <div class="label">Finalizados</div>
          <div class="value">${dados.finalizados}</div>
          <div class="sub">Concluídos com sucesso</div>
        </div>
      </div>

      <div class="charts-grid">
        <div class="chart-card">
          <h3>Chamados por Status</h3>
          ${dados.porStatus.length ? renderBarChart(dados.porStatus, 'status', CORES_STATUS) : '<p style="color:var(--text-faint); font-size:13px;">Sem dados ainda.</p>'}
        </div>
        <div class="chart-card">
          <h3>Chamados por Categoria</h3>
          ${dados.porCategoria.length ? renderBarChart(dados.porCategoria, 'categoria', (i) => CORES_CATEGORIA[i % CORES_CATEGORIA.length]) : '<p style="color:var(--text-faint); font-size:13px;">Sem dados ainda.</p>'}
        </div>
        <div class="chart-card">
          <h3>Chamados por Prioridade</h3>
          ${dados.porPrioridade.length ? renderBarChart(dados.porPrioridade, 'prioridade', CORES_PRIORIDADE) : '<p style="color:var(--text-faint); font-size:13px;">Sem dados ainda.</p>'}
        </div>
      </div>
    `;
  } catch (err) {
    container.innerHTML = `<div class="empty-state"><h3>Não foi possível carregar o dashboard</h3><p>${err.message}</p></div>`;
    mostrarToast(err.message, 'erro');
  }
}
