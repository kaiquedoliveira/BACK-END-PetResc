const express = require('express');
const router = express.Router();
const ongController = require('../controller/ongsController');
const { authenticateToken, authorizeRole} = require('../middlewares/authMiddleware');

// Rota para buscar todas as ONGs
router.get('/', ongController.getAllOngs);

// --- IMPORTANTE: A rota /proximas TEM QUE vir antes de /:id ---
// Se vier depois, o express acha que "proximas" é um ID e quebra.
router.get('/proximas', ongController.getOngsProximas); 

// Rotas que usam ID
router.get('/:id', ongController.getOngById);
router.get('/:id/animais', ongController.getAnimaisByOng);

// Rotas protegidas (Login necessário)
router.use(authenticateToken);

router.put('/:id', authorizeRole(['ADMIN', 'ONG']), ongController.updateOng); 

module.exports = router;