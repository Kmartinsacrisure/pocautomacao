const ChamadoModel = require('../models/chamadoModel');

const dashboardController = {
  resumo(req, res) {
    const estatisticas = ChamadoModel.estatisticas();
    return res.json({ sucesso: true, ...estatisticas });
  }
};

module.exports = dashboardController;
