const express = require('express');
const router = express.Router();
const pedidosController = require('../controller/adocoesController');

const { authenticateToken, authorizeRole } = require('../middlewares/authMiddleware');


router.use(authenticateToken);

router.post('/', pedidosController.criarPedido);

router.get('/meus-pedidos', pedidosController.listarMeusPedidos);

router.get('/gerenciar', authorizeRole(['ADMIN', 'ONG', 'PUBLICO']), pedidosController.listarPedidosParaGerenciamento);

router.patch('/:id/status', authorizeRole(['ADMIN', 'ONG', 'PUBLICO']), pedidosController.atualizarStatusPedido);



module.exports = router;