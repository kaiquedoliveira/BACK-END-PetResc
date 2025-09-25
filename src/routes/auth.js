const express = require("express");
const router = express.Router();
const { login, register, me } = require("../controller/authController");
const { authenticateToken } = require("../middlewares/authMiddleware");



// Login aberta
router.post("/login", (req, res) => {
  
  res.json({ message: "Login realizado com sucesso!" });
});

// Registro aberta
router.post("/register", (req, res) => {
  res.json({ message: "Usuário registrado com sucesso!" });
});

module.exports = router;               
router.get("/me", authenticateToken, me);     

module.exports = router;
