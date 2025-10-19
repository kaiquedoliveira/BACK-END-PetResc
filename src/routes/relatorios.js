const express = require('express');
const router = express.Router();
const relatorioController = require('../controller/relatoriosController');
const { authenticateToken, authorizeRole } = require('../middlewares/authMiddleware');


router.use(authenticateToken, authorizeRole('ADMIN'));
router.get('/animais', relatorioController.relatorioAnimais);
router.get('/doacoes', relatorioController.relatorioDoacoes);
router.get('/doacoes', relatorioController.relatorioDoacoes);

module.exports = router;
