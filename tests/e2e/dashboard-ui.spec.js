const { test, expect } = require('@playwright/test');
const { DashboardPage } = require('../pages/DashboardPage');
const { ticketData } = require('../fixtures/ticketData');
const { loginViaApi, createTicketViaApi, deleteTicketViaApi } = require('../utils/apiClient');

test('CT-016/CT-017 - dashboard carrega cards e reflete criacao de chamado', async ({ page, request }) => {
  const dashboard = new DashboardPage(page);
  const login = await loginViaApi(request);
  let ticketId;

  await dashboard.goto();
  await dashboard.expectLoaded();
  const totalBefore = await dashboard.metricValue('Total de Chamados');

  try {
    const chamado = await createTicketViaApi(request, login.token, ticketData({ prioridade: 'Alta' }));
    ticketId = chamado.id;

    await dashboard.goto();
    await dashboard.expectLoaded();
    const totalAfter = await dashboard.metricValue('Total de Chamados');

    expect(totalAfter).toBe(totalBefore + 1);
  } finally {
    await deleteTicketViaApi(request, login.token, ticketId);
  }
});

