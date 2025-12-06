const express = require('express');
const router = express.Router();
const adminController = require('../controller/adminController');
const { authenticateToken } = require('../middlewares/authMiddleware');

router.get('/stats', authenticateToken, adminController.getDashboardStats);

router.get('/pedidos', authenticateToken, adminController.listarTodosPedidos);

router.get('/activity', authenticateToken, adminController.getRecentActivity);

router.get('/animais', authenticateToken, adminController.listarTodosAnimais);

router.get('/ongs', authenticateToken, adminController.listarTodasOngs);

router.delete('/usuarios/:id', authenticateToken, adminController.deletarUsuario);

router.get('/ongs/:id', authenticateToken, adminController.obterDetalhesOng);

router.get('/ongs/:id/pets', authenticateToken, adminController.listarPetsDaOng);

module.exports = router;