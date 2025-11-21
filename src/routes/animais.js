const express = require('express');
const router = express.Router();
const animaisController = require('../controller/animaisController');
const { authenticateToken, authorizeRole } = require('../middlewares/authMiddleware'); 
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

//  (PUBLICO e ONG )
router.post('/:id/favoritar', animaisController.favoritarAnimal); 
router.delete('/:id/desfavoritar', animaisController.desfavoritarAnimal);

//  (ONG/ADMIN)
router.post('/', authorizeRole('ONG'), upload.single('imagem'), animaisController.criarAnimal); 
router.put('/:id', authorizeRole(['ADMIN', 'ONG']), animaisController.atualizarAnimal);
router.delete('/:id', authorizeRole(['ADMIN', 'ONG']), animaisController.deletarAnimal);

router.get('/gerenciar/lista', authorizeRole(['ADMIN', 'ONG']), animaisController.listarAnimaisParaGerenciamento);
router.get('/gerenciar/estatisticas/status', authorizeRole('ONG'), animaisController.obterEstatisticasAnimaisPorStatus); 

module.exports = router;