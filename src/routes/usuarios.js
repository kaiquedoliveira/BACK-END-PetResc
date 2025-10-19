const express = require('express');
const router = express.Router();
const userController = require('../controller/usuariosController');
const { authenticateToken } = require('../middlewares/authMiddleware');
const authorizeRole = require('../middlewares/roleMiddleware');

router.post('/register', userController.registrarUsuarioPublico);

router.post('/', authenticateToken, authorizeRole("ADMIN"), userController.criarUsuario);
router.get('/', authenticateToken, authorizeRole("ADMIN"), userController.listarUsuarios);
router.get('/:id', authenticateToken, userController.obterUsuarioPorId);
router.put('/:id', authenticateToken, userController.atualizarUsuario);
router.delete('/:id', authenticateToken, authorizeRole("ADMIN"), userController.deletarUsuario);


module.exports = router;