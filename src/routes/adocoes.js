const express = require('express');
const router = express.Router();
const adocoesController = require('../controller/adocoesController');
const { authenticateToken } = require('../middlewares/authMiddleware');

router.use(authenticateToken);

router.get('/', adocoesController.listarPedidos);

router.post('/', adocoesController.criarPedido);


module.exports = router;