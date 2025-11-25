const express = require('express');
const router = express.Router();
const animaisController = require('../controller/animaisController');
const { authenticateToken, authorizeRole } = require('../middlewares/authMiddleware'); 
const multer = require('multer');

const storage = require('../config/cloudinary'); 
const upload = multer({ storage: storage });

router.get('/', animaisController.listarAnimais);
router.get('/:id', animaisController.buscarAnimalPorId);

router.use(authenticateToken); 

router.post('/:id/favoritar', animaisController.favoritarAnimal); 
router.delete('/:id/desfavoritar', animaisController.desfavoritarAnimal);


router.post('/', authorizeRole(['ONG', 'PUBLICO']), upload.single('imagem'), animaisController.criarAnimal); 

router.put('/:id', authorizeRole(['ADMIN', 'ONG', 'PUBLICO']), animaisController.atualizarAnimal);
router.delete('/:id', authorizeRole(['ADMIN', 'ONG', 'PUBLICO']), animaisController.deletarAnimal);


router.get('/gerenciar/lista', authorizeRole(['ADMIN', 'ONG', 'PUBLICO']), animaisController.listarAnimaisParaGerenciamento);
router.get('/gerenciar/estatisticas/status', authorizeRole('ONG'), animaisController.obterEstatisticasAnimaisPorStatus); 

module.exports = router;