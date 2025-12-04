const express = require('express');
const router = express.Router();
const animaisController = require('../controller/animaisController');
const { authenticateToken, authorizeRole } = require('../middlewares/authMiddleware');

const { uploadAnimal } = require("../config/multer");

// Rotas públicas
router.get('/', animaisController.listarAnimais);

// Gerenciamento
router.get('/gerenciar/lista', authenticateToken, authorizeRole(['ADMIN', 'ONG', 'PUBLICO']), animaisController.listarAnimaisParaGerenciamento);
router.get('/gerenciar/estatisticas/status', authenticateToken, authorizeRole('ONG'), animaisController.obterEstatisticasAnimaisPorStatus);

// Resto das rotas
router.use(authenticateToken);

router.get('/:id', animaisController.buscarAnimalPorId);

router.post('/:id/favoritar', animaisController.favoritarAnimal);
router.delete('/:id/desfavoritar', animaisController.desfavoritarAnimal);

// CRUD
router.post(
  '/',
  authorizeRole(['ONG', 'PUBLICO']),
  uploadAnimal.fields([
    { name: 'imagem', maxCount: 1 },
    { name: 'imagem_resgate', maxCount: 1 }
  ]),
  animaisController.criarAnimal
);

router.put('/:id', authorizeRole(['ADMIN', 'ONG', 'PUBLICO']), animaisController.atualizarAnimal);
router.delete('/:id', authorizeRole(['ADMIN', 'ONG', 'PUBLICO']), animaisController.deletarAnimal);

module.exports = router;
