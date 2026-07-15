const { test, expect } = require('@playwright/test');
const { ticketData } = require('../fixtures/ticketData');
const { loginViaApi, deleteTicketViaApi } = require('../utils/apiClient');
const { TicketFormPage } = require('../pages/TicketFormPage');
const { TicketDetailPage } = require('../pages/TicketDetailPage');
const { TicketsPage } = require('../pages/TicketsPage');

let token;

test.beforeAll(async ({ request }) => {
  const login = await loginViaApi(request);
  token = login.token;
});

test('CT-006 - formulario de chamado exibe validacoes obrigatorias', async ({ page }) => {
  const form = new TicketFormPage(page);

  await form.gotoNew();
  await form.submitForm();

  await form.expectRequiredErrors();
});

test('CT-019 - fluxo completo: cria, comenta, atualiza, busca e exclui chamado', async ({ page, request }) => {
  const form = new TicketFormPage(page);
  const detail = new TicketDetailPage(page);
  const tickets = new TicketsPage(page);
  const data = ticketData({
    categoria: 'Sistema',
    prioridade: 'Baixa'
  });
  let ticketId;

  try {
    await form.create(data);
    await expect(page).toHaveURL(/ticket-detail\.html\?id=\d+/);
    ticketId = new URL(page.url()).searchParams.get('id');

    await detail.expectTicket(data.titulo);
    await detail.expectStatus('Aberto');
    await detail.expectPriority('Baixa');
    await detail.expectHistory('Chamado criado');

    await detail.addComment('Chamado validado pelo Playwright.');
    await detail.expectComment('Chamado validado pelo Playwright.');
    await detail.expectHistory(/Coment.rio adicionado/i);

    await detail.updateStatusAndPriority('Finalizado', 'Alta');
    await detail.expectStatus('Finalizado');
    await detail.expectPriority('Alta');
    await detail.expectHistory('Status alterado');
    await detail.expectHistory('Prioridade alterada');

    await tickets.goto();
    await tickets.search(data.titulo);
    await tickets.expectTicketVisible(data.titulo);
    await tickets.openTicketByTitle(data.titulo);

    await detail.expectTicket(data.titulo);
    await detail.deleteTicket();
    await expect(page).toHaveURL(/tickets\.html/);
    ticketId = null;
  } finally {
    await deleteTicketViaApi(request, token, ticketId);
  }
});

