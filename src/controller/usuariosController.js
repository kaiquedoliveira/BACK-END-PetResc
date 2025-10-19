// src/controller/usuariosController.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcrypt');

// ADMIN: Lista todas as contas
const listarUsuarios = async (req, res) => {
    try {
        const contas = await prisma.account.findMany(); 
        contas.forEach(conta => delete conta.password);
        res.json(contas);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao listar contas' });
    }
};

// ADMIN: Cria uma conta
const criarUsuario = async (req, res) => {
    const { email, password, role, nome, cnpj, descricao, endereco, cpf, telefone } = req.body;

    if (!email || !password || !role || !nome || !cpf) {
        return res.status(400).json({ error: 'Preencha email, senha, role, nome e cpf' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const novaConta = await prisma.account.create({
            data: {
                email,
                password: hashedPassword,
                role,
                nome,
                cpf,
                telefone,
                ...(role === 'ONG' && { ong: { create: { nome, cnpj, descricao, endereco } } }),
                ...(role === 'ADMIN' && { admin: { create: { nome } } }),
                ...(role === 'PUBLICO' && { publico: { create: {} } }) // Cria um 'publico' vazio para a relação
            },
            include: { admin: true, ong: true, publico: true },
        });



        delete novaConta.password;
        res.status(201).json(novaConta);
    } catch (err) {
        console.error(err);
        if (err.code === 'P2002') {
            const field = err.meta.target.includes('email') ? 'Email' : 'CPF';
            return res.status(400).json({ error: `Este ${field} já está em uso.` });
        }
        res.status(500).json({ error: 'Erro ao criar conta' });
    }
};

// DELETE: Remove usuário
const deletarUsuario = async (req, res) => {
    const { id } = req.params;
    try {
        const usuarioId = parseInt(id);
        if (isNaN(usuarioId)) return res.status(400).json({ error: 'ID inválido' });

        const usuario = await prisma.account.findUnique({
            where: { id: usuarioId },
            include: { admin: true, ong: true, publico: true }
        });
        if (!usuario) return res.status(404).json({ error: 'Usuário não encontrado' });

        if (usuario.role === 'ADMIN') {
            const totalAdmins = await prisma.account.count({ where: { role: 'ADMIN' } });
            if (totalAdmins <= 1) return res.status(403).json({ error: 'Não é possível remover o último admin' });
        }

        if (usuario.admin) await prisma.admin.delete({ where: { id: usuario.admin.id } });
        if (usuario.ong) await prisma.ong.delete({ where: { id: usuario.ong.id } });
        if (usuario.publico) await prisma.publico.delete({ where: { id: usuario.publico.id } });
        await prisma.account.delete({ where: { id: usuarioId } });

        res.json({ message: 'Usuário removido com sucesso!' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao remover usuário' });
    }
};

// LOGADO: Obter usuário por ID
const obterUsuarioPorId = async (req, res) => {
    try {
        const userIdToView = parseInt(req.params.id);
        const loggedInUser = req.user;

        if (loggedInUser.role !== 'ADMIN' && loggedInUser.id !== userIdToView) {
            return res.status(403).json({ error: "Acesso negado" });
        }

        const account = await prisma.account.findUnique({
            where: { id: userIdToView },
            include: { admin: true, ong: true, publico: true }
        });

        if (!account) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        delete account.password;
        res.json(account);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao obter usuário.' });
    }
};

// LOGADO: Atualizar usuário
const atualizarUsuario = async (req, res) => {
    try {
        const userIdToUpdate = parseInt(req.params.id);
        const loggedInUser = req.user; 
        const { nome, email, telefone, cpf } = req.body;

        if (loggedInUser.role !== 'ADMIN' && loggedInUser.id !== userIdToUpdate) {
            return res.status(403).json({ error: "Acesso negado" });
        }

        const updatedAccount = await prisma.account.update({
            where: { id: userIdToUpdate },
            data: { // Passamos um objeto com os campos a serem atualizados
                email: email,
                nome: nome,
                telefone: telefone,
                cpf: cpf
            },
        });

        delete updatedAccount.password;
        res.json({ message: "Usuário atualizado com sucesso", account: updatedAccount });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao atualizar usuário.' });
    }
};
module.exports = {
    listarUsuarios,
    criarUsuario,
    deletarUsuario,
    obterUsuarioPorId,
    atualizarUsuario
};