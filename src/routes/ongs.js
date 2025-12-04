const express = require('express');
const router = express.Router();
const ongController = require('../controller/ongsController');
const usuariosController = require('../controller/usuariosController');

const { authenticateToken, authorizeRole} = require('../middlewares/authMiddleware');



router.get('/', ongController.getAllOngs);
router.get('/:id', ongController.getOngById);
router.get('/:id/animais', ongController.getAnimaisByOng);

router.use(authenticateToken);

router.put('/:id',authorizeRole(['ADMIN', 'ONG']), ongController.updateOng); 


module.exports = router;