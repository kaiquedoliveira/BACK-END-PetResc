const express = require('express');
const router = express.Router();

const usuariosController = require('../controller/usuariosController');
const adminController = require('../controller/adminController');
const relatoriosController = require('../controller/relatoriosController'); 

const { authorizeRole, authenticateToken } = require('../middlewares/authMiddleware');

router.use(authenticateToken);
router.use(authorizeRole(['ADMIN']));

router.get('/usuarios', usuariosController.listarUsuarios);

router.get('/pedidos-adocao', adminController.listarTodosPedidos);

router.get('/estatisticas', relatoriosController.obterEstatisticasGerais); 

module.exports = router;