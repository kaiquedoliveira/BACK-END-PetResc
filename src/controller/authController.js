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
    const { nome, email, cnpj, password, telefone, descricao, endereco } = req.body;

    if (!nome || !email || !cnpj || !password) {
        return res.status(400).json({ error: "Nome da ONG, email, cnpj e senha são obrigatórios." });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        const novaContaOng = await prisma.account.create({
            data: {
                nome,
                email,
                telefone,
                password: hashedPassword,
                cpf: cnpj, 
                role: 'ONG',
                ong: {        
                    create: {
                        nome,
                        cnpj,
                        descricao,
                        endereco
                    }
                }
            },
            select: { id: true, nome: true, email: true, role: true, ong: true }
        });

        res.status(201).json(novaContaOng);
    } catch (err) {
        console.error("Erro ao criar conta de ONG:", err);
        if (err.code === 'P2002') {
            return res.status(400).json({ error: 'Email ou CNPJ já está em uso.' });
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