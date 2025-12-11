const express = require('express');
const router = express.Router();

const { uploadCampanha } = require('../config/multer');
const campanhaController = require('../controller/campanhaController');
const { authenticateToken } = require('../middlewares/authMiddleware');

router.get('/', campanhaController.getAll);

router.put( '/:id',authenticateToken, uploadCampanha.single('imagem'),campanhaController.update);


router.get('/minhas', authenticateToken, campanhaController.listarMinhas);


router.get('/:id', campanhaController.getById);
router.post(
  '/',
  authenticateToken,
  uploadCampanha.single('imagem'),
  campanhaController.create
);

module.exports = router;
