const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'pet123';

exports.register = async (req, res) => {
    const { nome, email, cpf, password, telefone } = req.body;

    if (!nome || !email || !cpf || !password) {
        return res.status(400).json({ error: "Nome, email, cpf e senha são obrigatórios." });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        const novaConta = await prisma.account.create({
            data: {
                nome,
                email,
                cpf,
                telefone,
                password: hashedPassword,
                role: 'PUBLICO', 
                publico: {      
                    create: {} 
                }
            },
            select: { id: true, nome: true, email: true, role: true }
        });

        res.status(201).json(novaConta);
    } catch (err) {
        console.error("Erro ao criar conta PÚBLICA:", err);
        if (err.code === 'P2002') { 
            return res.status(400).json({ error: 'Email ou CPF já está em uso.' });
        }
        res.status(500).json({ error: 'Erro ao criar conta.' });
    }
};
exports.registerOng = async (req, res) => {
    const { 
      name, 
      cpf,
      nomeOng,
      cnpj,
      email,
      descricao,
      telefone,
      password,
      cep, rua, numero, complemento, bairro, cidade, estado
    } = req.body;

    if (!name || !email || !cnpj || !password || !nomeOng || !cpf) {
        return res.status(400).json({ error: "Dados essenciais (nome, email, cpf, cnpj, senha) são obrigatórios." });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        const novaContaOng = await prisma.account.create({
            data: {
                nome: name, 
                email,
                telefone,
                password: hashedPassword,
                cpf: cpf,      
                role: 'ONG',                
                ong: {         
                    create: {
                        nome: nomeOng,
                        cnpj,
                        descricao,
                        cep, rua, numero, complemento, bairro, cidade, estado
                    }
                }
            },
            select: { id: true, nome: true, email: true, role: true, ong: true }
        });

        res.status(201).json(novaContaOng);
    } catch (err) {
        console.error("Erro ao criar conta de ONG:", err);
        if (err.code === 'P2002') {
            return res.status(400).json({ error: 'Email, CPF ou CNPJ já está em uso.' });
        }
        res.status(500).json({ error: 'Erro ao criar conta de ONG.' });
    }
};

exports.login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const usuario = await prisma.account.findUnique({
            where: { email },
            include: { admin: true, ong: true, publico: true }
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
            include: { admin: true, ong: true, publico: true }
          });

        if (!usuario) return res.status(404).json({ error: 'Usuário não encontrado.' });

        const { password: _, ...usuarioSemSenha } = usuario;
        res.json(usuarioSemSenha);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao buscar dados do usuário.' });
    }
};