const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middlewares/authMiddleware");
const { register, registerOng, login, me, forgotPassword, resetPassword } = require('../controller/authController');


router.post('/register', register);
router.post('/register-ong', registerOng);
router.post('/login', login);
router.get('/me', authenticateToken, me);

router.post('/forgot-password', forgotPassword);

router.post('/reset-password', resetPassword);


module.exports = router;