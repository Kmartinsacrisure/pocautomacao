async function loginViaApi(request, credentials = {}) {
  const email = credentials.email || process.env.E2E_USER_EMAIL || 'admin@empresa.com';
  const senha = credentials.senha || process.env.E2E_USER_PASSWORD || '123456';

  const response = await request.post('/api/login', {
    data: { email, senha }
  });

  const body = await response.json();
  if (!response.ok()) {
    throw new Error(`Falha ao autenticar via API: ${response.status()} ${JSON.stringify(body)}`);
  }

  return body;
}

async function createTicketViaApi(request, token, data) {
  const response = await request.post('/api/tickets', {
    headers: { Authorization: `Bearer ${token}` },
    data
  });
  const body = await response.json();
  if (!response.ok()) {
    throw new Error(`Falha ao criar chamado via API: ${response.status()} ${JSON.stringify(body)}`);
  }
  return body.chamado;
}

async function deleteTicketViaApi(request, token, id) {
  if (!id) return;
  const response = await request.delete(`/api/tickets/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (![200, 404].includes(response.status())) {
    const body = await response.json().catch(() => ({}));
    throw new Error(`Falha ao remover chamado via API: ${response.status()} ${JSON.stringify(body)}`);
  }
}

module.exports = {
  loginViaApi,
  createTicketViaApi,
  deleteTicketViaApi
};
