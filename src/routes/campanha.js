const express = require('express');
const router = express.Router();

const upload = require('../config/multer');
const campanhaController = require('../controller/campanhaController');
const { authenticateToken } = require('../middlewares/authMiddleware');

router.get('/', campanhaController.getAll);

router.post('/', authenticateToken, upload.single('imagem'), campanhaController.create );

module.exports = router;
