function uniqueSuffix() {
  return `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

function ticketData(overrides = {}) {
  const suffix = uniqueSuffix();
  return {
    titulo: `Fluxo QA Playwright ${suffix}`,
    descricao: `Chamado criado pela automacao Playwright ${suffix}`,
    categoria: 'Sistema',
    prioridade: 'Baixa',
    solicitante: 'Automacao QA',
    ...overrides
  };
}

module.exports = { ticketData, uniqueSuffix };
