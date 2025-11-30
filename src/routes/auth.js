const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middlewares/authMiddleware");
const { register, registerOng, login, me, forgotPassword, resetPassword, atualizarPerfil, verifyCode} = require('../controller/authController');


router.post('/register', register);
router.post('/register-ong', registerOng);
router.post('/login', login);
router.get('/me', authenticateToken, me);
router.put('/me', authenticateToken, atualizarPerfil);
router.post('/forgot-password', forgotPassword); 
router.post('/verify-code', verifyCode);       
router.post('/reset-password', resetPassword);



module.exports = router;