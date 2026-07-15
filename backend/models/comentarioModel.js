const db = require('../database/init');

const ComentarioModel = {
  listarPorChamado(chamadoId) {
    return db.prepare('SELECT * FROM comentarios WHERE chamado_id = ? ORDER BY data DESC').all(chamadoId);
  },
  criar({ chamadoId, comentario, usuario }) {
    const info = db.prepare(`
      INSERT INTO comentarios (chamado_id, comentario, usuario) VALUES (?, ?, ?)
    `).run(chamadoId, comentario, usuario);
    return db.prepare('SELECT * FROM comentarios WHERE id = ?').get(info.lastInsertRowid);
  }
};

const HistoricoModel = {
  listarPorChamado(chamadoId) {
    return db.prepare('SELECT * FROM historico WHERE chamado_id = ? ORDER BY data DESC').all(chamadoId);
  },
  registrar({ chamadoId, alteracao, usuario }) {
    db.prepare(`
      INSERT INTO historico (chamado_id, alteracao, usuario) VALUES (?, ?, ?)
    `).run(chamadoId, alteracao, usuario);
  }
};

module.exports = { ComentarioModel, HistoricoModel };
