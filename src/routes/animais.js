const express = require('express');
const router = express.Router();
const animaisController = require('../controller/animaisController');
const { authenticateToken, authorizeRole } = require('../middlewares/authMiddleware');

const { GoogleGenerativeAI } = require("@google/generative-ai");
const storage = require('../config/cloudinary'); 
const upload = multer({ storage: storage });
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);


// --- ROTAS PÚBLICAS SEM ID/PARÂMETRO (MAIS ESPECÍFICAS) ---

// 1. Rota de Listagem (Central de Adoção)
router.get('/', animaisController.listarAnimais); 

// Gerenciamento
router.get('/gerenciar/lista', authenticateToken, authorizeRole(['ADMIN', 'ONG', 'PUBLICO']), animaisController.listarAnimaisParaGerenciamento);

// 3. Estatísticas (DEVE vir antes de /:id)
router.get('/gerenciar/estatisticas/status', authenticateToken, authorizeRole('ONG'), animaisController.obterEstatisticasAnimaisPorStatus); 


// --- A PARTIR DAQUI PRECISAM DE AUTENTICAÇÃO E/OU ID ---

router.use(authenticateToken); 

// Rota da IA

router.post("/ia-descricao", async (req, res) => {
  try {
    const { nome, especie, caracteristicas } = req.body;

    if (!nome || !especie) {
      return res.status(400).json({ error: "Nome e espécie são obrigatórios." });
    }

    console.log(`🤖 Gemini gerando para: ${nome}`);

    // Configura o modelo
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Crie uma descrição curta (máx 200 caracteres), emocionante e apelativa para adoção de um ${especie} chamado ${nome}. Características: ${caracteristicas}.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const texto = response.text();

    return res.json({ texto });

  } catch (error) {
    console.error("Erro Gemini:", error);
    return res.status(500).json({ error: "Erro ao gerar descrição." });
  }
});

// 4. Rota de Busca por ID (/:id - Agora vem depois de todas as rotas específicas)
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
