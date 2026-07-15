const db = require('../database/init');

const ChamadoModel = {
  listar({ busca, status, prioridade, categoria, ordenarPor = 'data_abertura', ordem = 'DESC', pagina = 1, limite = 10 }) {
    const condicoes = [];
    const params = {};

    if (busca) {
      condicoes.push('titulo LIKE @busca');
      params.busca = `%${busca}%`;
    }
    if (status) {
      condicoes.push('status = @status');
      params.status = status;
    }
    if (prioridade) {
      condicoes.push('prioridade = @prioridade');
      params.prioridade = prioridade;
    }
    if (categoria) {
      condicoes.push('categoria = @categoria');
      params.categoria = categoria;
    }

    const where = condicoes.length ? `WHERE ${condicoes.join(' AND ')}` : '';

    const colunasPermitidas = ['data_abertura', 'data_atualizacao', 'titulo', 'prioridade', 'status'];
    const colunaOrdenacao = colunasPermitidas.includes(ordenarPor) ? ordenarPor : 'data_abertura';
    const direcao = ordem && ordem.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const total = db.prepare(`SELECT COUNT(*) AS total FROM chamados ${where}`).get(params).total;

    const offset = (Math.max(1, pagina) - 1) * limite;
    const dados = db.prepare(`
      SELECT * FROM chamados
      ${where}
      ORDER BY ${colunaOrdenacao} ${direcao}
      LIMIT @limite OFFSET @offset
    `).all({ ...params, limite: Number(limite), offset: Number(offset) });

    return {
      dados,
      paginacao: {
        total,
        pagina: Number(pagina),
        limite: Number(limite),
        totalPaginas: Math.ceil(total / limite) || 1
      }
    };
  },

  buscarPorId(id) {
    return db.prepare('SELECT * FROM chamados WHERE id = ?').get(id);
  },

  criar({ titulo, descricao, categoria, prioridade, solicitante, status = 'Aberto' }) {
    const info = db.prepare(`
      INSERT INTO chamados (titulo, descricao, categoria, prioridade, status, solicitante)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(titulo, descricao, categoria, prioridade, status, solicitante);
    return this.buscarPorId(info.lastInsertRowid);
  },

  atualizar(id, campos) {
    const atual = this.buscarPorId(id);
    if (!atual) return null;

    const permitidos = ['titulo', 'descricao', 'categoria', 'prioridade', 'status', 'solicitante'];
    const sets = [];
    const params = {};

    permitidos.forEach(campo => {
      if (campos[campo] !== undefined) {
        sets.push(`${campo} = @${campo}`);
        params[campo] = campos[campo];
      }
    });

    if (sets.length === 0) return atual;

    sets.push("data_atualizacao = datetime('now')");
    params.id = id;

    db.prepare(`UPDATE chamados SET ${sets.join(', ')} WHERE id = @id`).run(params);
    return this.buscarPorId(id);
  },

  remover(id) {
    const info = db.prepare('DELETE FROM chamados WHERE id = ?').run(id);
    return info.changes > 0;
  },

  estatisticas() {
    const total = db.prepare('SELECT COUNT(*) AS total FROM chamados').get().total;
    const porStatus = db.prepare('SELECT status, COUNT(*) AS total FROM chamados GROUP BY status').all();
    const porCategoria = db.prepare('SELECT categoria, COUNT(*) AS total FROM chamados GROUP BY categoria').all();
    const porPrioridade = db.prepare('SELECT prioridade, COUNT(*) AS total FROM chamados GROUP BY prioridade').all();

    const statusMap = { 'Aberto': 0, 'Em Atendimento': 0, 'Finalizado': 0 };
    porStatus.forEach(s => { statusMap[s.status] = s.total; });

    return {
      total,
      abertos: statusMap['Aberto'],
      emAtendimento: statusMap['Em Atendimento'],
      finalizados: statusMap['Finalizado'],
      porStatus,
      porCategoria,
      porPrioridade
    };
  }
};

module.exports = ChamadoModel;
