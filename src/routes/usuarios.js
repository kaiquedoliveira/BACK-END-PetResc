// routes/userRoutes.js - VERSÃO FINAL E CORRIGIDA ✅

const express = require('express');
const router = express.Router();
const userController = require('../controller/usuariosController');
const { authenticateToken } = require('../middlewares/authMiddleware');
const authorizeRole = require('../middlewares/roleMiddleware');

// PÚBLICA novo usuário se cadastrar como 'PUBLICO'.
router.post('/register', userController.registrarUsuarioPublico);

// ADMIN criar conta.
router.post('/', authenticateToken, authorizeRole("ADMIN"), userController.criarUsuario);

// ADMIN Listar 
router.get('/', authenticateToken, authorizeRole("ADMIN"), userController.listarUsuarios);

// usuário esteja logado.
router.get('/:id', authenticateToken, userController.obterUsuarioPorId);
router.put('/:id', authenticateToken, userController.atualizarUsuario);

// ADMIN Deletar
router.delete('/:id', authenticateToken, authorizeRole("ADMIN"), userController.deletarUsuario);

module.exports = router;