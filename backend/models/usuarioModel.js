const db = require('../database/init');

const UsuarioModel = {
  buscarPorEmail(email) {
    return db.prepare('SELECT * FROM usuarios WHERE email = ?').get(email);
  },
  buscarPorId(id) {
    return db.prepare('SELECT id, nome, email, criado_em FROM usuarios WHERE id = ?').get(id);
  },
  listar() {
    return db.prepare('SELECT id, nome, email, criado_em FROM usuarios').all();
  },
  criar({ nome, email, senha }) {
    const info = db.prepare('INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?)').run(nome, email, senha);
    return this.buscarPorId(info.lastInsertRowid);
  }
};

module.exports = UsuarioModel;
