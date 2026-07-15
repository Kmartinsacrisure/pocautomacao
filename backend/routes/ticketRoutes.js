const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');
const { autenticar } = require('../middleware/auth');

router.use(autenticar);

router.get('/', ticketController.listar);
router.get('/:id', ticketController.buscarPorId);
router.post('/', ticketController.criar);
router.put('/:id', ticketController.atualizar);
router.delete('/:id', ticketController.remover);
router.post('/:id/comentarios', ticketController.adicionarComentario);

module.exports = router;
