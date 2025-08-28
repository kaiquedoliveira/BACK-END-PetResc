const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();
const prisma = new PrismaClient(); 

// GET
router.get('/', async (req, res) => {
  try {
    const contas = await prisma.account.findMany({
      include: {
        admin: true,
        ong: true,
        publico: true,
      },
    });
    res.json(contas);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao listar contas' });
  }
});

// POST
router.post('/', async (req, res) => {
  const { email, password, role, nome, cnpj, descricao, endereco } = req.body;

  try {
    const novaConta = await prisma.account.create({
      data: {
        email,
        password,
        role,
        ...(role === 'ADMIN' && { admin: { create: { nome } } }),
        ...(role === 'ONG' && { ong: { create: { nome, cnpj, descricao, endereco } } }),
        ...(role === 'PUBLICO' && { publico: { create: { nome } } }),
      },
      include: { admin: true, ong: true, publico: true },
    });

    res.status(201).json(novaConta);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao criar conta' });
  }
});

module.exports = router;
