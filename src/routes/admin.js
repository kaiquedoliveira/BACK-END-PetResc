const express = require('express');
const router = express.Router();
const adminController = require('../controller/adminController');
const { authenticateToken } = require('../middlewares/authMiddleware');

// Dashboard (Stats)
router.get('/stats', authenticateToken, adminController.getDashboardStats);

// Pedidos
router.get('/pedidos', authenticateToken, adminController.listarTodosPedidos);

router.get('/activity', authenticateToken, adminController.getRecentActivity);

module.exports = router;