const express = require('express');
const router = express.Router();
const larTemporarioController = require('../controller/larTemporarioController');
const { authenticateToken } = require('../middleware/authMiddleware');


router.get('/', authenticateToken,  larTemporarioController.getAll);
router.get('/:id', authenticateToken,  larTemporarioController.getById);
router.post('/', authenticateToken, larTemporarioController.create);
router.put('/:id', authenticateToken, larTemporarioController.updateStatus);
router.delete('/:id',authenticateToken,  larTemporarioController.remove);

module.exports = router;
