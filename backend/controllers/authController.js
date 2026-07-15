const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const UsuarioModel = require('../models/usuarioModel');
const { JWT_SECRET } = require('../middleware/auth');

const authController = {
  login(req, res) {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ sucesso: false, mensagem: 'Informe e-mail e senha.' });
    }

    const usuario = UsuarioModel.buscarPorEmail(email);
    if (!usuario) {
      return res.status(401).json({ sucesso: false, mensagem: 'E-mail ou senha inválidos.' });
    }

    const senhaValida = bcrypt.compareSync(senha, usuario.senha);
    if (!senhaValida) {
      return res.status(401).json({ sucesso: false, mensagem: 'E-mail ou senha inválidos.' });
    }

    const token = jwt.sign(
      { id: usuario.id, nome: usuario.nome, email: usuario.email },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    return res.json({
      sucesso: true,
      mensagem: 'Login realizado com sucesso.',
      token,
      usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email }
    });
  },

  perfil(req, res) {
    const usuario = UsuarioModel.buscarPorId(req.usuario.id);
    if (!usuario) {
      return res.status(404).json({ sucesso: false, mensagem: 'Usuário não encontrado.' });
    }
    return res.json({ sucesso: true, usuario });
  }
};

module.exports = authController;
