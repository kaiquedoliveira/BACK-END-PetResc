const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const authorizeRole = require('../middleware/roleMiddleware');


// Rota exclusiva para admins
router.get(
  "/admin/dashboard",
  authMiddleware,            
  authorizeRole("ADMIN"),    
  (req, res) => {
    res.json({ message: "Bem-vindo ao painel do administrador!" });
  }
);


router.get('/relatorios', 
  authenticateToken,
  authorizeRole('ADMIN'),
  (req, res) => {
   res.send('Relatórios completos para Admin');
 }
);

router.get('/doacoes',
 authenticateToken,
  authorizeRole('ONG', 'ADMIN'),
  (req, res) => {
  res.send('Gestão de doações');
 }
);

router.get('/adocoes',
  authenticateToken,
  authorizeRole('PUBLICO', 'ONG', 'ADMIN'),
  (req, res) => {
    res.send('Conteúdo aberto a todos os cadastrados');
 }
);



router.get('/feed',
  authenticateToken,
  authorizeRole('PUBLICO', 'ONG', 'ADMIN'),
  (req, res) => {
    res.send('Conteúdo aberto a todos os cadastrados');
 }
);


module.exports = router;