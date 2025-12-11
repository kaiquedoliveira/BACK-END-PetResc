const express = require('express');
const router = express.Router();
const multer = require('multer');
const animaisController = require('../controller/animaisController');
const { authenticateToken, authorizeRole } = require('../middlewares/authMiddleware');
const  { uploadAnimal } = require('../config/multer');


const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);


// --- ROTAS PÚBLICAS SEM ID/PARÂMETRO (MAIS ESPECÍFICAS) ---

// 1. Rota de Listagem (Central de Adoção)
router.get('/', animaisController.listarAnimais); 

// Gerenciamento
router.get('/gerenciar/lista', authenticateToken, authorizeRole(['ADMIN', 'ONG', 'PUBLICO']), animaisController.listarAnimaisParaGerenciamento);

// 3. Estatísticas (DEVE vir antes de /:id)
router.get('/gerenciar/estatisticas/status', authenticateToken, authorizeRole('ONG'), animaisController.obterEstatisticasAnimaisPorStatus); 

// Rota da IA

router.post('/ia-descricao', animaisController.gerarDescricaoIA);

// --- A PARTIR DAQUI PRECISAM DE AUTENTICAÇÃO E/OU ID ---

router.use(authenticateToken); 


// 4. Rota de Busca por ID (/:id - Agora vem depois de todas as rotas específicas)
router.get('/:id', animaisController.buscarAnimalPorId);

router.post('/:id/favoritar', animaisController.favoritarAnimal);
router.delete('/:id/desfavoritar', animaisController.desfavoritarAnimal);


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
