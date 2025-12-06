const express = require('express');
const router = express.Router();

const { uploadCampanha } = require('../config/multer');
const campanhaController = require('../controller/campanhaController');
const { authenticateToken } = require('../middlewares/authMiddleware');

// Todas as campanhas
router.get('/', campanhaController.getAll);

// Campanha por ID (ID é string)
router.get('/:id', campanhaController.getById);

router.get('/minhas', campanhaController.listarMinhas);

// Criar campanha
router.post(
  '/',
  authenticateToken,
  uploadCampanha.single('imagem'),
  campanhaController.create
);

module.exports = router;
