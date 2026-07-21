const { test, expect } = require('@playwright/test');
const { ticketData } = require('../fixtures/ticketData');
const { loginViaApi, createTicketViaApi, deleteTicketViaApi } = require('../utils/apiClient');
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

test('CT-005 - formulario cria chamado e exibe os dados persistidos', async ({ page, request }) => {
  const form = new TicketFormPage(page);
  const detail = new TicketDetailPage(page);
  const data = ticketData({ categoria: 'Sistema', prioridade: 'Baixa' });
  let ticketId;

  try {
    await form.create(data);
    await expect(page).toHaveURL(/ticket-detail\.html\?id=\d+/);
    ticketId = new URL(page.url()).searchParams.get('id');

    await detail.expectTicket(data.titulo);
    await detail.expectStatus('Aberto');
    await detail.expectPriority('Baixa');
    await detail.expectHistory('Chamado criado');
  } finally {
    await deleteTicketViaApi(request, token, ticketId);
  }
});

test('CT-013 - detalhe atualiza status e prioridade do chamado', async ({ page, request }) => {
  const detail = new TicketDetailPage(page);
  const chamado = await createTicketViaApi(request, token, ticketData({ prioridade: 'Baixa' }));

  try {
    await detail.goto(chamado.id);

    const response = await detail.updateStatusAndPriority('Finalizado', 'Alta');

    expect(response.status()).toBe(200);
    await detail.expectUpdateSucceeded();
    await detail.expectStatus('Finalizado');
    await detail.expectPriority('Alta');
    await detail.expectHistory('Status alterado');
    await detail.expectHistory('Prioridade alterada');
  } finally {
    await deleteTicketViaApi(request, token, chamado.id);
  }
});

test('CT-015 - detalhe adiciona comentario e registra historico', async ({ page, request }) => {
  const detail = new TicketDetailPage(page);
  const chamado = await createTicketViaApi(request, token, ticketData());
  const comentario = `Comentario UI ${Date.now()}`;

  try {
    await detail.goto(chamado.id);

    const response = await detail.addComment(comentario);

    expect(response.status()).toBe(201);
    await detail.expectComment(comentario);
    await detail.expectHistory(/Coment.rio adicionado/i);
  } finally {
    await deleteTicketViaApi(request, token, chamado.id);
  }
});

test('CT-019 - listagem busca chamado pelo titulo', async ({ page, request }) => {
  const tickets = new TicketsPage(page);
  const data = ticketData();
  const chamado = await createTicketViaApi(request, token, data);

  try {
    await tickets.goto();

    await tickets.search(data.titulo);

    await tickets.expectTicketVisible(data.titulo);
  } finally {
    await deleteTicketViaApi(request, token, chamado.id);
  }
});

test('CT-021 - detalhe exclui chamado confirmado pelo usuario', async ({ page, request }) => {
  const detail = new TicketDetailPage(page);
  const chamado = await createTicketViaApi(request, token, ticketData());
  let removido = false;

  try {
    await detail.goto(chamado.id);

    const response = await detail.deleteTicket();
    removido = response.status() === 200;

    expect(response.status()).toBe(200);
    await expect(page).toHaveURL(/tickets\.html/);
  } finally {
    if (!removido) await deleteTicketViaApi(request, token, chamado.id);
  }
});

test('CT-024 - detalhe rejeita comentario contendo apenas espacos', async ({ page, request }) => {
  const detail = new TicketDetailPage(page);
  const chamado = await createTicketViaApi(request, token, ticketData());

  try {
    await detail.goto(chamado.id);

    await detail.submitEmptyComment();

    await detail.expectCommentRequiredError();
  } finally {
    await deleteTicketViaApi(request, token, chamado.id);
  }
});

