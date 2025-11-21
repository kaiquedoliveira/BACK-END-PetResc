const notificacaoController = require('../notificacaoesController');
const { isAuthenticated } = require('../middlewares/authMiddleware');

routes.get('/notificacoes', isAuthenticated, notificacaoController.listarNotificacoes);
routes.patch('/notificacoes/:id/lida', isAuthenticated, notificacaoController.marcarComoLida);