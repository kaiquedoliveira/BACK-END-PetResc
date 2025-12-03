const express = require('express');
const router = express.Router();
const favoritosController = require('../controller/favoritarController');
const { authenticateToken } = require('../middlewares/authMiddleware');

router.use(authenticateToken); // Tudo aqui precisa de login

// Rotas
router.get('/meus', favoritosController.listarMeusFavoritos); // GET /favoritos/meus
router.post('/:animalId', favoritosController.adicionarFavorito); // POST /favoritos/123
router.delete('/:animalId', favoritosController.removerFavorito); // DELETE /favoritos/123

module.exports = router;