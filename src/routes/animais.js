const express = require('express');
const router = express.Router();
const animaisController = require('../controller/animaisController');
const { authenticateToken } = require('../middlewares/authMiddleware');
const authorizeRole = require('../middlewares/roleMiddleware');

// Rotas públicas (não precisa estar logado)
router.get('/', animaisController.listarAnimais);
router.get('/:id', animaisController.buscarAnimalPorId);

// Rotas que precisam de autenticação
router.use(authenticateToken);

// Criar animal → qualquer usuário logado (PUBLICO, ONG, ADMIN)
router.post('/', animaisController.criarAnimal);

// Atualizar animal → validação de permissão no controller
router.put('/:id', animaisController.atualizarAnimal);

// Deletar animal → validação de permissão no controller
router.delete('/:id', animaisController.deletarAnimal);

module.exports = router;
