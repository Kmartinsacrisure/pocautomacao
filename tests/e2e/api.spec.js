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

  test('CT-004 - POST /api/login rejeita credenciais ausentes', async ({ request }) => {
    const response = await request.post('/api/login', {
      data: { email: '', senha: '' }
    });
    const body = await response.json();

    expect(response.status()).toBe(400);
    expect(body.sucesso).toBe(false);
    expect(body.mensagem).toMatch(/Informe e-mail e senha/i);
  });

  test('CT-020 - rotas protegidas rejeitam token invalido', async ({ request }) => {
    const response = await request.get('/api/perfil', {
      headers: { Authorization: 'Bearer token-invalido' }
    });
    const body = await response.json();

    expect(response.status()).toBe(401);
    expect(body.sucesso).toBe(false);
    expect(body.mensagem).toMatch(/Sessão inválida|Sessao invalida/i);
  });
});

test.describe('API - chamados', () => {
  let token;

  test.beforeAll(async ({ request }) => {
    const login = await loginViaApi(request);
    token = login.token;
  });

  test('CT-005 - POST /api/tickets cria chamado com dados validos', async ({ request }) => {
    const data = ticketData();
    let chamado;

    try {
      chamado = await createTicketViaApi(request, token, data);

      expect(chamado.titulo).toBe(data.titulo);
      expect(chamado.descricao).toBe(data.descricao);
      expect(chamado.categoria).toBe(data.categoria);
      expect(chamado.prioridade).toBe(data.prioridade);
      expect(chamado.solicitante).toBe(data.solicitante);
      expect(chamado.status).toBe('Aberto');
    } finally {
      await deleteTicketViaApi(request, token, chamado?.id);
    }
  });

  test('CT-011 - GET /api/tickets/:id retorna chamado e historico de criacao', async ({ request }) => {
    const data = ticketData();
    const chamado = await createTicketViaApi(request, token, data);

    try {
      const response = await request.get(`/api/tickets/${chamado.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const body = await response.json();

      expect(response.status()).toBe(200);
      expect(body.chamado.titulo).toBe(data.titulo);
      expect(body.comentarios).toEqual([]);
      expect(body.historico).toEqual(expect.arrayContaining([
        expect.objectContaining({ alteracao: 'Chamado criado' })
      ]));
    } finally {
      await deleteTicketViaApi(request, token, chamado.id);
    }
  });

  test('CT-013 - PUT /api/tickets/:id atualiza status e registra historico', async ({ request }) => {
    const chamado = await createTicketViaApi(request, token, ticketData());

    try {
      const response = await request.put(`/api/tickets/${chamado.id}`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { status: 'Em Atendimento' }
      });
      const body = await response.json();

      expect(response.status()).toBe(200);
      expect(body.chamado.status).toBe('Em Atendimento');

      const detailResponse = await request.get(`/api/tickets/${chamado.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const detail = await detailResponse.json();
      expect(detail.historico).toEqual(expect.arrayContaining([
        expect.objectContaining({ alteracao: expect.stringMatching(/Status alterado.*Em Atendimento/) })
      ]));
    } finally {
      await deleteTicketViaApi(request, token, chamado.id);
    }
  });

  test('CT-015 - POST /api/tickets/:id/comentarios adiciona comentario e historico', async ({ request }) => {
    const chamado = await createTicketViaApi(request, token, ticketData());
    const texto = `Comentario atomico ${Date.now()}`;

    try {
      const response = await request.post(`/api/tickets/${chamado.id}/comentarios`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { comentario: texto }
      });
      const body = await response.json();

      expect(response.status()).toBe(201);
      expect(body.comentario.comentario).toBe(texto);

      const detailResponse = await request.get(`/api/tickets/${chamado.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const detail = await detailResponse.json();
      expect(detail.historico).toEqual(expect.arrayContaining([
        expect.objectContaining({ alteracao: 'Comentário adicionado' })
      ]));
    } finally {
      await deleteTicketViaApi(request, token, chamado.id);
    }
  });

  test('CT-021 - DELETE /api/tickets/:id remove o chamado', async ({ request }) => {
    const chamado = await createTicketViaApi(request, token, ticketData());
    let removido = false;

    try {
      const response = await request.delete(`/api/tickets/${chamado.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      removido = response.status() === 200;

      expect(response.status()).toBe(200);

      const detailResponse = await request.get(`/api/tickets/${chamado.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      expect(detailResponse.status()).toBe(404);
    } finally {
      if (!removido) await deleteTicketViaApi(request, token, chamado.id);
    }
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

    try {
      const response = await request.put(`/api/tickets/${chamado.id}`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { status: 'Cancelado' }
      });
      const body = await response.json();

      expect(response.status()).toBe(400);
      expect(body.mensagem).toMatch(/Status invalido|Status inválido/i);
    } finally {
      await deleteTicketViaApi(request, token, chamado.id);
    }
  });

  test('CT-022 - criacao rejeita categoria invalida com demais campos validos', async ({ request }) => {
    const response = await request.post('/api/tickets', {
      headers: { Authorization: `Bearer ${token}` },
      data: ticketData({ categoria: 'Categoria inexistente' })
    });
    const body = await response.json();

    expect(response.status()).toBe(400);
    expect(body.erros).toEqual([expect.stringMatching(/Categoria inválida/i)]);
  });

  test('CT-023 - atualizacao de chamado inexistente retorna 404', async ({ request }) => {
    const response = await request.put('/api/tickets/999999999', {
      headers: { Authorization: `Bearer ${token}` },
      data: { status: 'Finalizado' }
    });
    const body = await response.json();

    expect(response.status()).toBe(404);
    expect(body.mensagem).toMatch(/Chamado não encontrado/i);
  });

  test('CT-024 - comentario vazio ou com espacos e rejeitado', async ({ request }) => {
    const chamado = await createTicketViaApi(request, token, ticketData());

    try {
      const response = await request.post(`/api/tickets/${chamado.id}/comentarios`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { comentario: '   ' }
      });
      const body = await response.json();

      expect(response.status()).toBe(400);
      expect(body.mensagem).toMatch(/comentário não pode estar vazio/i);
    } finally {
      await deleteTicketViaApi(request, token, chamado.id);
    }
  });

  test('CT-025 - comentario em chamado inexistente retorna 404', async ({ request }) => {
    const response = await request.post('/api/tickets/999999999/comentarios', {
      headers: { Authorization: `Bearer ${token}` },
      data: { comentario: 'Comentario valido' }
    });
    const body = await response.json();

    expect(response.status()).toBe(404);
    expect(body.mensagem).toMatch(/Chamado não encontrado/i);
  });

  test('CT-026 - listagem busca chamado pelo titulo sem depender da ordem global', async ({ request }) => {
    const data = ticketData();
    const chamado = await createTicketViaApi(request, token, data);

    try {
      const response = await request.get(`/api/tickets?busca=${encodeURIComponent(data.titulo)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const body = await response.json();

      expect(response.status()).toBe(200);
      expect(body.dados).toHaveLength(1);
      expect(body.dados[0]).toEqual(expect.objectContaining({ id: chamado.id, titulo: data.titulo }));
    } finally {
      await deleteTicketViaApi(request, token, chamado.id);
    }
  });
});

