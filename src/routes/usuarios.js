const express = require('express');
const router = express.Router();
const userController = require('../controller/usuariosController');
const { authenticateToken, authorizeRole } = require('../middlewares/authMiddleware');



router.post('/', authenticateToken, authorizeRole("ADMIN"), userController.criarUsuario);
router.get('/', authenticateToken, authorizeRole("ADMIN"), userController.listarUsuarios);
router.get('/:id', authenticateToken, userController.obterUsuarioPorId);
router.put('/:id', authenticateToken, userController.atualizarUsuario);
router.delete('/:id', authenticateToken, authorizeRole("ADMIN"), userController.deletarUsuario);


module.exports = router;