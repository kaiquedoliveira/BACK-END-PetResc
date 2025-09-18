const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const authorizeRole = require('../middleware/roleMiddleware');


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

router.get('/feed',
  authenticateToken,
  authorizeRole('PUBLICO', 'ONG', 'ADMIN'),
  (req, res) => {
    res.send('Conteúdo aberto a todos os cadastrados');
 }
);

module.exports = router;