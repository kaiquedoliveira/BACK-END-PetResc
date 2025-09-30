const express = require("express");
const router = express.Router();

const { login, register, me } = require("../controller/authController");
const { authenticateToken } = require("../middlewares/authMiddleware");

router.post("/login", login);           
router.post("/register", register);     
router.get("/me", authenticateToken, me); 
module.exports = router;