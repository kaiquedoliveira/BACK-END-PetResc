const express = require('express');
const router = express.Router();
const usuariosController = require('../controller/usuariosController');
const { authenticateToken, authorizeRole } = require('../middlewares/authMiddleware');

router.use(authenticateToken);

router.get('/me', usuariosController.obterUsuarioLogado);
router.get('/me/animais', usuariosController.listarAnimaisDoUsuario);
router.get('/me/pedidos-adocao', usuariosController.listarPedidosDoUsuario);
router.put('/me/alterar-senha', usuariosController.alterarSenha);
router.get('/me/favoritos', usuariosController.listarFavoritos);

router.post('/', authorizeRole("ADMIN"), usuariosController.criarUsuario);
router.get('/', authorizeRole("ADMIN"), usuariosController.listarUsuarios);
router.delete('/:id', authorizeRole("ADMIN"), usuariosController.deletarUsuario);

router.get('/:id', usuariosController.obterUsuarioPorId);
router.put('/:id', usuariosController.atualizarUsuario);
router.put('/registrar-visualizacao', authenticateToken, usuariosController.registrarVisualizacao);

module.exports = router;
