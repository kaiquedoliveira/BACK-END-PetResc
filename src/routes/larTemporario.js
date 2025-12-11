const express = require('express');
const router = express.Router();
const larTemporarioController = require('../controller/larTemporarioController');
const { authenticateToken, authorizeRole } = require('../middlewares/authMiddleware');


router.use(authenticateToken);
router.get('/feed', authorizeRole(['ONG', 'ADMIN']), larTemporarioController.listarParaFeed);


router.get('/', larTemporarioController.getAll);
router.get('/:id', larTemporarioController.getById);
router.post('/', authorizeRole('PUBLICO'), larTemporarioController.create);
router.patch('/:id/status', authorizeRole(['ADMIN', 'ONG']), larTemporarioController.updateStatus);
router.delete('/:id', larTemporarioController.remove);



module.exports = router;
