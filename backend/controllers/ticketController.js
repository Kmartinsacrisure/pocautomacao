const ChamadoModel = require('../models/chamadoModel');
const { ComentarioModel, HistoricoModel } = require('../models/comentarioModel');

const CATEGORIAS = ['Sistema', 'Infraestrutura', 'Rede', 'Banco de Dados', 'Outros'];
const PRIORIDADES = ['Baixa', 'Média', 'Alta'];
const STATUS = ['Aberto', 'Em Atendimento', 'Finalizado'];

function validarCamposObrigatorios({ titulo, descricao, categoria, prioridade, solicitante }) {
  const erros = [];
  if (!titulo || !titulo.trim()) erros.push('Título é obrigatório.');
  if (!descricao || !descricao.trim()) erros.push('Descrição é obrigatória.');
  if (!solicitante || !solicitante.trim()) erros.push('Solicitante é obrigatório.');
  if (!categoria || !CATEGORIAS.includes(categoria)) erros.push(`Categoria inválida. Use: ${CATEGORIAS.join(', ')}.`);
  if (!prioridade || !PRIORIDADES.includes(prioridade)) erros.push(`Prioridade inválida. Use: ${PRIORIDADES.join(', ')}.`);
  return erros;
}

const ticketController = {
  listar(req, res) {
    const { busca, status, prioridade, categoria, ordenarPor, ordem, pagina, limite } = req.query;

    const resultado = ChamadoModel.listar({
      busca,
      status,
      prioridade,
      categoria,
      ordenarPor,
      ordem,
      pagina: pagina ? Number(pagina) : 1,
      limite: limite ? Number(limite) : 10
    });

    return res.json({ sucesso: true, ...resultado });
  },

  buscarPorId(req, res) {
    const chamado = ChamadoModel.buscarPorId(req.params.id);
    if (!chamado) {
      return res.status(404).json({ sucesso: false, mensagem: 'Chamado não encontrado.' });
    }
    const comentarios = ComentarioModel.listarPorChamado(chamado.id);
    const historico = HistoricoModel.listarPorChamado(chamado.id);
    return res.json({ sucesso: true, chamado, comentarios, historico });
  },

  criar(req, res) {
    const erros = validarCamposObrigatorios(req.body);
    if (erros.length) {
      return res.status(400).json({ sucesso: false, mensagem: 'Existem campos inválidos.', erros });
    }

    const chamado = ChamadoModel.criar(req.body);
    HistoricoModel.registrar({
      chamadoId: chamado.id,
      alteracao: 'Chamado criado',
      usuario: req.usuario ? req.usuario.nome : 'Sistema'
    });

    return res.status(201).json({ sucesso: true, mensagem: 'Chamado criado com sucesso.', chamado });
  },

  atualizar(req, res) {
    const chamadoExistente = ChamadoModel.buscarPorId(req.params.id);
    if (!chamadoExistente) {
      return res.status(404).json({ sucesso: false, mensagem: 'Chamado não encontrado.' });
    }

    const { status, prioridade, categoria } = req.body;
    if (status && !STATUS.includes(status)) {
      return res.status(400).json({ sucesso: false, mensagem: `Status inválido. Use: ${STATUS.join(', ')}.` });
    }
    if (prioridade && !PRIORIDADES.includes(prioridade)) {
      return res.status(400).json({ sucesso: false, mensagem: `Prioridade inválida. Use: ${PRIORIDADES.join(', ')}.` });
    }
    if (categoria && !CATEGORIAS.includes(categoria)) {
      return res.status(400).json({ sucesso: false, mensagem: `Categoria inválida. Use: ${CATEGORIAS.join(', ')}.` });
    }

    const alteracoes = [];
    if (status && status !== chamadoExistente.status) alteracoes.push(`Status alterado de "${chamadoExistente.status}" para "${status}"`);
    if (prioridade && prioridade !== chamadoExistente.prioridade) alteracoes.push(`Prioridade alterada de "${chamadoExistente.prioridade}" para "${prioridade}"`);

    const chamado = ChamadoModel.atualizar(req.params.id, req.body);

    const usuarioNome = req.usuario ? req.usuario.nome : 'Sistema';
    if (alteracoes.length) {
      alteracoes.forEach(alteracao => HistoricoModel.registrar({ chamadoId: chamado.id, alteracao, usuario: usuarioNome }));
    } else {
      HistoricoModel.registrar({ chamadoId: chamado.id, alteracao: 'Chamado atualizado', usuario: usuarioNome });
    }

    return res.json({ sucesso: true, mensagem: 'Chamado atualizado com sucesso.', chamado });
  },

  remover(req, res) {
    const removido = ChamadoModel.remover(req.params.id);
    if (!removido) {
      return res.status(404).json({ sucesso: false, mensagem: 'Chamado não encontrado.' });
    }
    return res.json({ sucesso: true, mensagem: 'Chamado removido com sucesso.' });
  },

  adicionarComentario(req, res) {
    const chamado = ChamadoModel.buscarPorId(req.params.id);
    if (!chamado) {
      return res.status(404).json({ sucesso: false, mensagem: 'Chamado não encontrado.' });
    }

    const { comentario } = req.body;
    if (!comentario || !comentario.trim()) {
      return res.status(400).json({ sucesso: false, mensagem: 'O comentário não pode estar vazio.' });
    }

    const usuarioNome = req.usuario ? req.usuario.nome : 'Anônimo';
    const novoComentario = ComentarioModel.criar({ chamadoId: chamado.id, comentario, usuario: usuarioNome });
    HistoricoModel.registrar({ chamadoId: chamado.id, alteracao: 'Comentário adicionado', usuario: usuarioNome });

    return res.status(201).json({ sucesso: true, mensagem: 'Comentário adicionado com sucesso.', comentario: novoComentario });
  }
};

module.exports = ticketController;
