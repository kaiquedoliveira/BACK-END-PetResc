const express = require('express');
const router = express.Router();
const animaisController = require('../controller/animaisController');
const { authenticateToken } = require('../middlewares/authMiddleware');

router.get('/', animaisController.listarAnimais);
router.get('/:id', animaisController.buscarAnimalPorId);

router.use(authenticateToken);

router.post('/', animaisController.criarAnimal);
router.put('/:id', animaisController.atualizarAnimal);
router.delete('/:id', animaisController.deletarAnimal);
router.post('/:id/favoritar', animaisController.favoritarAnimal);
router.delete('/:id/desfavoritar', animaisController.desfavoritarAnimal);

module.exports = router;
