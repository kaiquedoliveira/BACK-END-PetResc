const express = require('express');
const router = express.Router();
const pedidosController = require('../controller/adocoesController');
const { authenticateToken, authorizeRole } = require('../middlewares/authMiddleware');


router.use(authenticateToken);

router.post('/', pedidosController.criarPedido);

router.get('/meus-pedidos', pedidosController.listarMeusPedidos);

// Rota para ONGs e Admins verem os pedidos

router.get('/gerenciar', authorizeRole(['ADMIN', 'ONG']), pedidosController.listarPedidosParaGerenciamento);

router.patch('/:id/status', authorizeRole(['ADMIN', 'ONG']), pedidosController.atualizarStatusPedido);



module.exports = router;