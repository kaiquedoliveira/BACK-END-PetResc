const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs'); 
const jwt = require('jsonwebtoken');
const { sendEmail } = require('../services/emailService');

const JWT_SECRET = process.env.JWT_SECRET || 'pet123';
const JWT_RESET_SECRET = process.env.JWT_RESET_SECRET || 'pet_reset_secret_super_seguro';
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';



exports.register = async (req, res) => {
    const { nome, email, cpf, password, telefone } = req.body;

    if (!nome || !email || !cpf || !password) {
        return res.status(400).json({ error: "Nome, email, cpf e senha são obrigatórios." });
    }

    let novaConta; 

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        novaConta = await prisma.account.create({
            data: {
                nome,
                email,
                cpf,
                telefone,
                password: hashedPassword,
                role: 'PUBLICO', 
                publico: { create: {} }
            },
            select: { id: true, nome: true, email: true, role: true }
        });

    } catch (err) {
        console.error("Erro ao CRIAR conta PÚBLICA:", err);
        if (err.code === 'P2002') { 
            return res.status(400).json({ error: 'Email ou CPF já está em uso.' });
        }
        return res.status(500).json({ error: 'Erro ao criar conta.' });
    }

    const assunto = `Boas Vindas ao PetResc, ${nome}!`;
    const html = `
        <h2>Que bom que se juntou à nós, ${nome}!</h2>
        <p>Desfrute de nossos recursos para encontrar seu novo melhor amigo.</p>
        <p>Agradecemos seu cadastro!</p>
    `;
    
    // Não usamos await para não travar a resposta do servidor se o email demorar
    sendEmail(email, assunto, html);

    res.status(201).json(novaConta);
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

    let novaContaOng; 

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        novaContaOng = await prisma.account.create({
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

    } catch (err) {
        console.error("Erro ao CRIAR conta de ONG:", err);
        if (err.code === 'P2002') {
            return res.status(400).json({ error: 'Email, CPF ou CNPJ já está em uso.' });
        }
        return res.status(500).json({ error: 'Erro ao criar conta de ONG.' });
    }

    const assunto = `Boas Vindas ao PetResc, ${nomeOng}!`;
    const html = `
        <h2>Que bom que se juntou à nós, ${nomeOng}!</h2>
        <p>Sua plataforma para conectar pets a novos lares.</p>
        <p>Agradecemos seu cadastro!</p>
    `;
    sendEmail(email, assunto, html);
    
    res.status(201).json(novaContaOng);
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



exports.atualizarPerfil = async (req, res) => {
    
    const { nome, telefone, password, currentPassword } = req.body; 
    const userId = req.user.id;

    try {
        const usuario = await prisma.account.findUnique({ where: { id: userId } });
        if (!usuario) return res.status(404).json({ error: "Usuário não encontrado" });

        const dadosParaAtualizar = {};

        if (nome) dadosParaAtualizar.nome = nome;
        if (telefone) dadosParaAtualizar.telefone = telefone;

        if (password && password.trim() !== "") {
            if (!currentPassword) {
                return res.status(400).json({ error: "Para alterar a senha, informe sua senha atual." });
            }

            const senhaBate = await bcrypt.compare(currentPassword, usuario.password);
            if (!senhaBate) {
                return res.status(401).json({ error: "A senha atual está incorreta." });
            }

            dadosParaAtualizar.password = await bcrypt.hash(password, 10);
        }

        const usuarioAtualizado = await prisma.account.update({
            where: { id: userId },
            data: dadosParaAtualizar,
            select: { id: true, nome: true, email: true, telefone: true, role: true }
        });

        res.json({ message: "Dados atualizados com sucesso!", user: usuarioAtualizado });

    } catch (err) {
        console.error("Erro ao atualizar perfil:", err);
        res.status(500).json({ error: "Erro interno ao atualizar." });
    }
};



const generateOTP = () => {
    return Math.floor(1000 + Math.random() * 9000).toString();
};

exports.forgotPassword = async (req, res) => {
    const { email } = req.body;

    try {
        const account = await prisma.account.findUnique({ where: { email } });

        if (!account) {
            // Retorna sucesso fake para segurança (não revelar emails cadastrados)
            return res.json({ message: "Código enviado se o e-mail existir." });
        }

        // Gera o código de 4 dígitos
        const otp = generateOTP();
        
        // Define validade (15 minutos)
        const expiry = new Date();
        expiry.setMinutes(expiry.getMinutes() + 15);

        // Salva no banco (usando os campos que você já criou)
        // Se você usou 'resetToken' no schema, vamos salvar o OTP lá.
        // Se ainda não criou, crie: resetToken String?, resetTokenExpiry DateTime?
        await prisma.account.update({
            where: { id: account.id },
            data: {
                resetToken: otp, 
                resetTokenExpiry: expiry
            }
        });

        const assunto = 'Código de Recuperação - PetResc';
        const html = `
            <div style="font-family: Arial, sans-serif; text-align: center;">
                <h2>Recuperação de Senha</h2>
                <p>Use o código abaixo para redefinir sua senha:</p>
                <h1 style="background: #f4f4f4; padding: 10px; display: inline-block; letter-spacing: 5px;">${otp}</h1>
                <p>Este código expira em 15 minutos.</p>
                <p>Se não foi você, ignore este e-mail.</p>
            </div>
        `;

     
        await sendEmail(email, assunto, html);

        res.json({ message: "Código enviado!" });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erro ao processar solicitação" });
    }
};

exports.verifyCode = async (req, res) => {
    const { email, code } = req.body;

    try {
        const account = await prisma.account.findFirst({
            where: {
                email: email,
                resetToken: code,
                resetTokenExpiry: { gt: new Date() } // Verifica se não expirou
            }
        });

        if (!account) {
            return res.status(400).json({ error: "Código inválido ou expirado." });
        }

        res.json({ message: "Código válido!" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erro ao verificar código." });
    }
};

exports.resetPassword = async (req, res) => {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
        return res.status(400).json({ error: "Dados incompletos." });
    }

    try {
        const account = await prisma.account.findFirst({
            where: {
                email: email,
                resetToken: code,
                resetTokenExpiry: { gt: new Date() }
            }
        });

        if (!account) {
            return res.status(400).json({ error: "Código inválido ou expirado." });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await prisma.account.update({
            where: { id: account.id },
            data: {
                password: hashedPassword,
                resetToken: null,       // Limpa o código usado
                resetTokenExpiry: null
            },
        });

        res.json({ message: "Senha redefinida com sucesso!" });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erro ao redefinir senha." });
    }
};