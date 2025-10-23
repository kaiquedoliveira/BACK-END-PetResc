const express = require("express");
const router = express.Router();

const { register, registerOng, login, me } = require('../controller/authController');
const { authenticateToken } = require("../middlewares/authMiddleware");


router.post('/register', register);
router.post('/register-ong', registerOng);
router.post('/login', login);
router.get('/me', authenticateToken, me);
module.exports = router;