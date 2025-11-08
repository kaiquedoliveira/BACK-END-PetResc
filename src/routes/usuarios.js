const express = require('express');
const router = express.Router();
const {
  listarUsuarios,
  criarUsuario,
  deletarUsuario,
  obterUsuarioPorId,
  atualizarUsuario,
  obterUsuarioLogado
} = require('../controller/usuariosController');

const { authenticateToken, authorizeRole } = require('../middlewares/authMiddleware');

router.get('/me', authenticateToken, obterUsuarioLogado); 
router.post('/', authenticateToken, authorizeRole("ADMIN"), criarUsuario);
router.get('/', authenticateToken, authorizeRole("ADMIN"), listarUsuarios);
router.get('/:id', authenticateToken, obterUsuarioPorId);
router.put('/:id', authenticateToken, atualizarUsuario);
router.delete('/:id', authenticateToken, authorizeRole("ADMIN"), deletarUsuario);

module.exports = router;
