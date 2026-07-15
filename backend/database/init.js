const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'helpdesk.sqlite');
const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function createSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      senha TEXT NOT NULL,
      criado_em TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS chamados (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      titulo TEXT NOT NULL,
      descricao TEXT NOT NULL,
      categoria TEXT NOT NULL CHECK (categoria IN ('Sistema','Infraestrutura','Rede','Banco de Dados','Outros')),
      prioridade TEXT NOT NULL CHECK (prioridade IN ('Baixa','Média','Alta')),
      status TEXT NOT NULL DEFAULT 'Aberto' CHECK (status IN ('Aberto','Em Atendimento','Finalizado')),
      solicitante TEXT NOT NULL,
      data_abertura TEXT DEFAULT (datetime('now')),
      data_atualizacao TEXT DEFAULT (datetime('now')),
      usuario_id INTEGER,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    );

    CREATE TABLE IF NOT EXISTS comentarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chamado_id INTEGER NOT NULL,
      comentario TEXT NOT NULL,
      usuario TEXT NOT NULL,
      data TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (chamado_id) REFERENCES chamados(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS historico (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chamado_id INTEGER NOT NULL,
      alteracao TEXT NOT NULL,
      usuario TEXT NOT NULL,
      data TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (chamado_id) REFERENCES chamados(id) ON DELETE CASCADE
    );
  `);
}

function seed() {
  const count = db.prepare('SELECT COUNT(*) AS total FROM usuarios').get().total;
  if (count === 0) {
    const senhaHash = bcrypt.hashSync('123456', 10);
    db.prepare('INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?)')
      .run('Administrador', 'admin@empresa.com', senhaHash);
    db.prepare('INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?)')
      .run('João Silva', 'joao@empresa.com', senhaHash);
    console.log('Usuários de exemplo criados (senha padrão: 123456)');
  }

  const ticketCount = db.prepare('SELECT COUNT(*) AS total FROM chamados').get().total;
  if (ticketCount === 0) {
    const exemplos = [
      ['Impressora não funciona', 'A impressora do 2º andar não liga.', 'Infraestrutura', 'Média', 'Aberto', 'Maria Souza'],
      ['Erro ao acessar sistema financeiro', 'Mensagem de erro 500 ao logar.', 'Sistema', 'Alta', 'Em Atendimento', 'Carlos Lima'],
      ['Solicitação de acesso à rede Wi-Fi', 'Novo colaborador precisa de acesso.', 'Rede', 'Baixa', 'Finalizado', 'Ana Paula'],
      ['Lentidão no banco de dados', 'Consultas demorando mais que o normal.', 'Banco de Dados', 'Alta', 'Aberto', 'Pedro Santos'],
      ['Dúvida sobre uso do sistema', 'Como gerar relatório mensal?', 'Outros', 'Baixa', 'Aberto', 'Fernanda Costa']
    ];
    const insert = db.prepare(`INSERT INTO chamados (titulo, descricao, categoria, prioridade, status, solicitante)
      VALUES (?, ?, ?, ?, ?, ?)`);
    exemplos.forEach(t => insert.run(...t));
    console.log('Chamados de exemplo criados');
  }
}

createSchema();
seed();

module.exports = db;
