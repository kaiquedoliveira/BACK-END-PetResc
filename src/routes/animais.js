const express = require('express');
const router = express.Router();
const animaisController = require('../controller/animaisController');
const { authenticateToken } = require('../middlewares/authMiddleware');

const multer = require('multer');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

router.get('/', animaisController.listarAnimais);
router.get('/:id', animaisController.buscarAnimalPorId);
router.use(authenticateToken);
router.post('/', upload.single('imagem'), animaisController.criarAnimal);
router.put('/:id', animaisController.atualizarAnimal);
router.delete('/:id', animaisController.deletarAnimal);
router.post('/:id/favoritar', animaisController.favoritarAnimal);
router.delete('/:id/desfavoritar', animaisController.desfavoritarAnimal);

module.exports = router;