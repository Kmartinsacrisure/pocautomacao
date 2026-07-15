const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'helpdesk-poc-secret-key-troque-em-producao';

function autenticar(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ sucesso: false, mensagem: 'Token não informado. Faça login novamente.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.usuario = payload;
    next();
  } catch (err) {
    return res.status(401).json({ sucesso: false, mensagem: 'Sessão inválida ou expirada. Faça login novamente.' });
  }
}

module.exports = { autenticar, JWT_SECRET };
