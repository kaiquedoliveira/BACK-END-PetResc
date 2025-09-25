// Rota de ONG - CORRETO ✅
const express = require('express');
const router = express.Router();
const ongController = require('../controller/ongsController');
const { authenticateToken } = require('../middlewares/authMiddleware');

// Rotas PÚBLICAS
router.post('/register', ongController.registerOng);
router.post('/login', ongController.loginOng);

router.use(authenticateToken);

// Rotas PROTEGIDAS
router.get('/', ongController.getAllOngs);
router.get('/:id', ongController.getOngById);
router.get('/:id/animais', ongController.getAnimaisByOng);
router.put('/:id', ongController.updateOng); 


module.exports = router;