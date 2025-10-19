const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'pet123';

exports.register = async (req, res) => {
  const { name: nome, email, cpf, password, telefone } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const novaConta = await prisma.account.create({
      data: {
        nome,
        email,
        cpf,
        password: hashedPassword,
        telefone,
        role: 'PUBLICO',
        publico: { create: {} }
      },
    });
    
    const { password: _, ...usuarioSemSenha } = novaConta;
    res.status(201).json(usuarioSemSenha);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao criar conta.' });
  }
};

exports.login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const usuario = await prisma.account.findUnique({
            where: { email },
            include: { admin: true, ong: true } 
        });

        if (!usuario) return res.status(401).json({ error: 'E-mail ou senha inválidos.' });

        const passwordMatch = await bcrypt.compare(password, usuario.password);
        if (!passwordMatch) return res.status(401).json({ error: 'E-mail ou senha inválidos.' });

        const token = jwt.sign(
            { id: usuario.id, role: usuario.role, name: usuario.nome }, 
            JWT_SECRET,
            { expiresIn: '7d' }
        );
        
        const { password: _, ...usuarioSemSenha } = usuario;
        res.json({ token, usuario: usuarioSemSenha });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao fazer login.' });
    }
};

exports.me = async (req, res) => {
    try {
        const usuario = await prisma.account.findUnique({
            where: { id: req.user.id },
            include: { ong: true, admin: true } 
        });

        if (!usuario) return res.status(404).json({ error: 'Usuário não encontrado.' });

        const { password: _, ...usuarioSemSenha } = usuario;
        res.json(usuarioSemSenha);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao buscar dados do usuário.' });
    }
};