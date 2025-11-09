const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs'); 
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

const JWT_SECRET = process.env.JWT_SECRET || 'pet123';
const JWT_RESET_SECRET = process.env.JWT_RESET_SECRET || 'pet_reset_secret_super_seguro';

let transporter = nodemailer.createTransport({
  service: 'gmail', 
  secure: false,
  auth: {
    user: 'petresc.company@gmail.com', 
    pass: 'shim xlzu koms bfkq',
  }      
});

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

    try {
        await transporter.sendMail({
          from: '"PetResc" <petresc.company@gmail.com>', 
          to: email, 
          subject: `Boas Vindas ao PetResc, ${nome}!`,
          html: `
            <h2>Que bom que se juntou à nós, ${nome}!</h2>
            <p>Desfrute de nossos recursos para encontrar seu novo melhor amigo.</p>
            <p>Agradecemos seu cadastro!</p>
          `,
        });
    } catch (emailErr) {
        console.error("AVISO: Conta criada, mas e-mail de boas-vindas falhou:", emailErr);
    }

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

    try {
        await transporter.sendMail({
          from: '"PetResc" <petresc.company@gmail.com>',
          to: email, 
          subject: `Boas Vindas ao PetResc, ${nomeOng}!`,
          html: `
            <h2>Que bom que se juntou à nós, ${nomeOng}!</h2>
            <p>Sua plataforma para conectar pets a novos lares.</p>
            <p>Agradecemos seu cadastro!</p>
          `,
        });
    } catch (emailErr) {
        console.error(`AVISO: Conta da ONG ${nomeOng} criada, mas e-mail de boas-vindas falhou:`, emailErr);
    }
    
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


exports.forgotPassword = async (req, res) => {
 const { email } = req.body;

 try {
  const account = await prisma.account.findUnique({
     where: { email },
     });

      if (!account) {
       return res.json({ message: "Se este e-mail estiver cadastrado, um link será enviado." });
     }

    const token = jwt.sign({ userId: account.id }, JWT_RESET_SECRET, { expiresIn: '15m' });

    const resetLink = `http://localhost:5173/redefinir-senha?token=${token}`;

   

    let info = await transporter.sendMail({
      from: '"PetResc" <petresc.senai@gmail.com>',
      to: email, 
      subject: 'Redefinição de Senha - PetResc',
      html: `
        <h2>Redefinição de Senha</h2>
        <p>Você solicitou a redefinição da sua senha. Clique no link abaixo para criar uma nova senha:</p>
        <a href="${resetLink}" target="_blank">Redefinir Senha</a>
        <p>Este link expira em 15 minutos.</p>
      `,
    });

    res.json({ message: "Se este e-mail estiver cadastrado, um link será enviado." });

  } catch (err) {
     console.error(err);
    res.status(500).json({ error: "Erro ao processar solicitação" });
  }
};

exports.resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ error: "Token e nova senha são obrigatórios" });
  }

  try {
    const payload = jwt.verify(token, JWT_RESET_SECRET);

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.account.update({
      where: { id: payload.userId },
      data: { password: hashedPassword },
    });

    res.json({ message: "Senha redefinida com sucesso!" });

  } catch (err) {
    if (err.name === 'TokenExpiredError' || err.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: "Token inválido ou expirado." });
    }
    console.error(err);
    res.status(500).json({ error: "Erro ao redefinir senha." });
  }
};

