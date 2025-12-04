const express = require('express');
const router = express.Router();

const upload = require('../config/multer'); // AGORA usando Cloudinary
const campanhasController = require('../controllers/campanhasController');
const authMiddleware = require('../middlewares/auth');

// Rotas
router.get('/', campanhasController.getAll);

// Aqui criamos a campanha com upload para o Cloudinary
router.post(
  '/',
  authMiddleware,
  upload.single('imagem'),
  campanhasController.create
);

module.exports = router;
