const { test, expect } = require('@playwright/test');
const { ticketData } = require('../fixtures/ticketData');
const { loginViaApi, createTicketViaApi, deleteTicketViaApi } = require('../utils/apiClient');

test.describe('API - autenticacao', () => {
  test('CT-001 - POST /api/login retorna token para credenciais validas', async ({ request }) => {
    const response = await request.post('/api/login', {
      data: { email: 'admin@empresa.com', senha: '123456' }
    });
    const body = await response.json();

    expect(response.status()).toBe(200);
    expect(body.sucesso).toBe(true);
    expect(body.token).toBeTruthy();
    expect(body.usuario.email).toBe('admin@empresa.com');
  });

  test('CT-002 - POST /api/login rejeita senha invalida', async ({ request }) => {
    const response = await request.post('/api/login', {
      data: { email: 'admin@empresa.com', senha: 'senha-incorreta' }
    });
    const body = await response.json();

    expect(response.status()).toBe(401);
    expect(body.sucesso).toBe(false);
    expect(body.mensagem).toMatch(/E-mail ou senha/i);
  });

  test('CT-003 - rotas protegidas rejeitam requisicao sem token', async ({ request }) => {
    for (const route of ['/api/perfil', '/api/tickets', '/api/dashboard']) {
      const response = await request.get(route);
      const body = await response.json();

      expect(response.status(), route).toBe(401);
      expect(body.sucesso, route).toBe(false);
      expect(body.mensagem, route).toMatch(/Token nao informado|Token não informado/i);
    }
  });
});

test.describe('API - chamados', () => {
  let token;
  const createdIds = [];

  test.beforeAll(async ({ request }) => {
    const login = await loginViaApi(request);
    token = login.token;
  });

  test.afterAll(async ({ request }) => {
    for (const id of createdIds.reverse()) {
      await deleteTicketViaApi(request, token, id);
    }
  });

  test('CT-005/CT-011/CT-013/CT-015 - cria, consulta, atualiza, comenta e remove chamado', async ({ request }) => {
    const data = ticketData();
    const chamado = await createTicketViaApi(request, token, data);
    createdIds.push(chamado.id);

    expect(chamado.titulo).toBe(data.titulo);
    expect(chamado.status).toBe('Aberto');

    const detailResponse = await request.get(`/api/tickets/${chamado.id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const detail = await detailResponse.json();
    expect(detailResponse.status()).toBe(200);
    expect(detail.chamado.titulo).toBe(data.titulo);
    expect(detail.historico.some(item => item.alteracao === 'Chamado criado')).toBe(true);

    const updateResponse = await request.put(`/api/tickets/${chamado.id}`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { status: 'Em Atendimento', prioridade: 'Alta' }
    });
    const updated = await updateResponse.json();
    expect(updateResponse.status()).toBe(200);
    expect(updated.chamado.status).toBe('Em Atendimento');
    expect(updated.chamado.prioridade).toBe('Alta');

    const commentResponse = await request.post(`/api/tickets/${chamado.id}/comentarios`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { comentario: 'Comentario criado pela automacao.' }
    });
    const comment = await commentResponse.json();
    expect(commentResponse.status()).toBe(201);
    expect(comment.comentario.comentario).toBe('Comentario criado pela automacao.');

    const deleteResponse = await request.delete(`/api/tickets/${chamado.id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    expect(deleteResponse.status()).toBe(200);
    createdIds.pop();

    const notFound = await request.get(`/api/tickets/${chamado.id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    expect(notFound.status()).toBe(404);
  });

  test('CT-006 - validacao rejeita chamado com campos obrigatorios vazios', async ({ request }) => {
    const response = await request.post('/api/tickets', {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        titulo: '   ',
        descricao: '',
        categoria: '',
        prioridade: '',
        solicitante: '   '
      }
    });
    const body = await response.json();

    expect(response.status()).toBe(400);
    expect(body.sucesso).toBe(false);
    expect(body.erros.length).toBeGreaterThanOrEqual(5);
  });

  test('CT-012 - validacao rejeita status invalido na atualizacao', async ({ request }) => {
    const chamado = await createTicketViaApi(request, token, ticketData());
    createdIds.push(chamado.id);

    const response = await request.put(`/api/tickets/${chamado.id}`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { status: 'Cancelado' }
    });
    const body = await response.json();

    expect(response.status()).toBe(400);
    expect(body.mensagem).toMatch(/Status invalido|Status inválido/i);
  });
});

