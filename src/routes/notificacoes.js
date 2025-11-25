const express = require('express');
const router = express.Router();
const notificacaoController = require('../controller/notificacoesController');
const { authenticateToken } = require('../middlewares/authMiddleware');

router.use(authenticateToken);

router.get('/', notificacaoController.listarNotificacoes);

router.patch('/:id/lida', notificacaoController.marcarComoLida);

module.exports = router;