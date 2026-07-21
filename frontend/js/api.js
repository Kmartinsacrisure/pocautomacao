// ===== Configuração base =====
const API_BASE = '/api';

// ===== Autenticação =====
const Auth = {
  getToken() { return localStorage.getItem('hd_token'); },
  getUsuario() {
    const raw = localStorage.getItem('hd_usuario');
    return raw ? JSON.parse(raw) : null;
  },
  salvarSessao(token, usuario) {
    localStorage.setItem('hd_token', token);
    localStorage.setItem('hd_usuario', JSON.stringify(usuario));
  },
  logout() {
    localStorage.removeItem('hd_token');
    localStorage.removeItem('hd_usuario');
    window.location.href = '/pages/login.html';
  },
  exigirLogin() {
    if (!this.getToken()) {
      window.location.href = '/pages/login.html';
    }
  },
  iniciais(nome) {
    if (!nome) return '?';
    const partes = nome.trim().split(' ');
    return (partes[0][0] + (partes[1] ? partes[1][0] : '')).toUpperCase();
  }
};

// ===== Requisição autenticada genérica =====
async function apiRequest(endpoint, { method = 'GET', body = null } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const token = Auth.getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let resposta;
  try {
    resposta = await fetch(`${API_BASE}${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : null
    });
  } catch (err) {
    throw new Error('Não foi possível conectar ao servidor. Verifique sua conexão.');
  }

  let dados;
  try {
    dados = await resposta.json();
  } catch {
    dados = {};
  }

  if (resposta.status === 401 && endpoint !== '/login') {
    Auth.logout();
    throw new Error('Sessão expirada. Faça login novamente.');
  }

  if (!resposta.ok || dados.sucesso === false) {
    const erro = new Error(dados.mensagem || 'Ocorreu um erro inesperado.');
    erro.detalhes = dados.erros || null;
    throw erro;
  }

  return dados;
}

const Api = {
  login: (email, senha) => apiRequest('/login', { method: 'POST', body: { email, senha } }),
  perfil: () => apiRequest('/perfil'),
  dashboard: () => apiRequest('/dashboard'),
  listarTickets: (params = {}) => {
    const query = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined));
    return apiRequest(`/tickets?${query.toString()}`);
  },
  buscarTicket: (id) => apiRequest(`/tickets/${id}`),
  criarTicket: (dados) => apiRequest('/tickets', { method: 'POST', body: dados }),
  atualizarTicket: (id, dados) => apiRequest(`/tickets/${id}`, { method: 'PUT', body: dados }),
  removerTicket: (id) => apiRequest(`/tickets/${id}`, { method: 'DELETE' }),
  comentar: (id, comentario) => apiRequest(`/tickets/${id}/comentarios`, { method: 'POST', body: { comentario } })
};

// ===== Toasts (mensagens de sucesso/erro) =====
function mostrarToast(mensagem, tipo = 'sucesso') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = `toast ${tipo}`;
  toast.textContent = mensagem;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

// ===== Helpers de formatação =====
function formatarData(isoString) {
  if (!isoString) return '-';
  const data = new Date(isoString.replace(' ', 'T') + 'Z');
  return data.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function slug(texto) {
  return texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-');
}

function ticketId(id) {
  return `#${String(id).padStart(4, '0')}`;
}
