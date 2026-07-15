const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { autenticar } = require('../middleware/auth');

router.post('/login', authController.login);
router.get('/perfil', autenticar, authController.perfil);

module.exports = router;
