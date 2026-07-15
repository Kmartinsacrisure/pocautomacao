const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { autenticar } = require('../middleware/auth');

router.get('/', autenticar, dashboardController.resumo);

module.exports = router;
