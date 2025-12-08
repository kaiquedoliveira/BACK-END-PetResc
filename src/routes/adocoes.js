const express = require('express');
const router = express.Router();
const pedidosController = require('../controller/adocoesController');
const { authenticateToken, authorizeRole } = require('../middlewares/authMiddleware');

router.use(authenticateToken);

router.post('/', pedidosController.criarPedido);
router.get('/meus-pedidos', pedidosController.listarMeusPedidos);


router.get('/formulario/:animalId',authorizeRole(['ADMIN', 'ONG', 'PUBLICO']),pedidosController.verificarFormulario);


router.get('/gerenciar', authorizeRole(['ADMIN', 'ONG', 'PUBLICO']), pedidosController.listarPedidosParaGerenciamento);

router.get('/animal/:animalId', authorizeRole(['ADMIN', 'ONG', 'PUBLICO']), pedidosController.listarPedidosPorAnimal);

router.patch('/:id/status', authorizeRole(['ADMIN', 'ONG', 'PUBLICO']), pedidosController.atualizarStatusPedido);

module.exports = router;