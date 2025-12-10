const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { sendEmail } = require("../services/emailService");

const JWT_SECRET = process.env.JWT_SECRET || "pet123";
const JWT_RESET_SECRET =
  process.env.JWT_RESET_SECRET || "pet_reset_secret_super_seguro";
const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

// ================================
// VALIDAÇÕES
// ================================
const validarEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

const validarCPF = (cpf) => {
  cpf = cpf.replace(/\D/g, "");
  if (cpf.length !== 11) return false;
  if (/^(\d)\1+$/.test(cpf)) return false;

  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(cpf[i]) * (10 - i);
  }

  let dig1 = 11 - (soma % 11);
  dig1 = dig1 > 9 ? 0 : dig1;
  if (dig1 !== parseInt(cpf[9])) return false;

  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(cpf[i]) * (11 - i);
  }

  let dig2 = 11 - (soma % 11);
  dig2 = dig2 > 9 ? 0 : dig2;

  return dig2 === parseInt(cpf[10]);
};

const validarCNPJ = (cnpj) => {
  cnpj = cnpj.replace(/[^\d]+/g, "");

  if (cnpj.length !== 14) return false;
  if (/^(\d)\1+$/.test(cnpj)) return false;

  let tamanho = cnpj.length - 2;
  let numeros = cnpj.substring(0, tamanho);
  let digitos = cnpj.substring(tamanho);
  let soma = 0;
  let pos = tamanho - 7;

  for (let i = tamanho; i >= 1; i--) {
    soma += numeros.charAt(tamanho - i) * pos--;
    if (pos < 2) pos = 9;
  }

  let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado != digitos.charAt(0)) return false;

  tamanho++;
  numeros = cnpj.substring(0, tamanho);
  soma = 0;
  pos = tamanho - 7;

  for (let i = tamanho; i >= 1; i--) {
    soma += numeros.charAt(tamanho - i) * pos--;
    if (pos < 2) pos = 9;
  }

  resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  return resultado == digitos.charAt(1);
};

/* ===========================================================
   REGISTRO DE USUÁRIO PÚBLICO
=========================================================== */
exports.register = async (req, res) => {
  const { nome, email, cpf, password, telefone } = req.body;

  if (!nome || !email || !cpf || !password) {
    return res
      .status(400)
      .json({ error: "Nome, email, cpf e senha são obrigatórios." });
  }

  if (!validarEmail(email)) {
    return res.status(400).json({ error: "E-mail inválido." });
  }

  if (!validarCPF(cpf)) {
    return res.status(400).json({ error: "CPF inválido." });
  }

  if (password.length < 6) {
    return res
      .status(400)
      .json({ error: "A senha deve ter pelo menos 6 caracteres." });
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
        role: "PUBLICO",
        publico: { create: {} },
      },
      select: { id: true, nome: true, email: true, role: true },
    });
  } catch (err) {
    console.error("Erro ao CRIAR conta PÚBLICA:", err);
    if (err.code === "P2002") {
      return res.status(400).json({ error: "Email ou CPF já está em uso." });
    }
    return res.status(500).json({ error: "Erro ao criar conta." });
  }

  const assunto = `Boas Vindas ao PetResc, ${nome}!`;
  const html = `
        <h2>Que bom que se juntou à nós, ${nome}!</h2>
        <p>Desfrute de nossos recursos para encontrar seu novo melhor amigo.</p>
        <p>Agradecemos seu cadastro!</p>
    `;

  sendEmail(email, assunto, html);

  res.status(201).json(novaConta);
};

/* ===========================================================
   REGISTRO DE ONG
=========================================================== */
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
    cep,
    rua,
    numero,
    complemento,
    bairro,
    cidade,
    estado,
  } = req.body;

  if (!name || !email || !cnpj || !password || !nomeOng || !cpf) {
    return res.status(400).json({
      error:
        "Dados essenciais (nome, email, cpf, cnpj, senha) são obrigatórios.",
    });
  }

  if (!validarEmail(email)) {
    return res.status(400).json({ error: "E-mail inválido." });
  }

  if (!validarCPF(cpf)) {
    return res.status(400).json({ error: "CPF inválido." });
  }

  if (!validarCNPJ(cnpj)) {
    return res.status(400).json({ error: "CNPJ inválido." });
  }

  if (password.length < 6) {
    return res
      .status(400)
      .json({ error: "A senha deve ter pelo menos 6 caracteres." });
  }

  let novaContaOng;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    // CORREÇÃO: Limpa o CNPJ para salvar apenas números no banco
    const cnpjLimpo = cnpj.replace(/\D/g, "");

    novaContaOng = await prisma.account.create({
      data: {
        nome: name,
        email,
        telefone,
        password: hashedPassword,
        cpf,
        role: "ONG",
        ong: {
          create: {
            nome: nomeOng,
            cnpj: cnpjLimpo, // Salva limpo
            descricao,
            cep,
            rua,
            numero,
            complemento,
            bairro,
            cidade,
            estado,
          },
        },
      },
      select: { id: true, nome: true, email: true, role: true, ong: true },
    });
  } catch (err) {
    console.error("Erro ao CRIAR conta de ONG:", err);
    if (err.code === "P2002") {
      return res
        .status(400)
        .json({ error: "Email, CPF ou CNPJ já está em uso." });
    }
    return res.status(500).json({ error: "Erro ao criar conta de ONG." });
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

/* ===========================================================
   LOGIN (Corrigido para aceitar Formatado e Limpo)
=========================================================== */
exports.login = async (req, res) => {
  const { email, password } = req.body;

  console.log("Tentativa de login com:", email);

  try {
    let usuario = null;

    // 1. Tenta buscar usuário COMUM por email
    usuario = await prisma.account.findUnique({
      where: { email: email },
      include: { admin: true, ong: true, publico: true },
    });

    // 2. Se não achou, assume que pode ser uma ONG (CNPJ)
    if (!usuario) {
      const loginLimpo = email.replace(/\D/g, "");

      if (loginLimpo.length > 0) {
        // TENTA 1: Busca pelo CNPJ limpo (apenas números)
        let ongEncontrada = await prisma.ong.findFirst({
          where: { cnpj: loginLimpo },
          select: { id: true },
        });

        // TENTA 2: Se não achou limpo, tenta buscar formatado (para contas antigas)
        if (!ongEncontrada) {
          // Formata: XX.XXX.XXX/0001-XX
          const cnpjFormatado = loginLimpo.replace(
            /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
            "$1.$2.$3/$4-$5"
          );
          console.log("Tentando buscar ONG formatada:", cnpjFormatado);

          ongEncontrada = await prisma.ong.findFirst({
            where: { cnpj: cnpjFormatado },
            select: { id: true },
          });
        }

        if (ongEncontrada) {
          // Ong.id == Account.id, busca a conta principal
          usuario = await prisma.account.findUnique({
            where: { id: ongEncontrada.id },
            include: { admin: true, ong: true, publico: true },
          });
        }
      }
    }

    if (!usuario) {
      console.log("Usuário não encontrado.");
      return res.status(401).json({ error: "Login ou senha inválidos." });
    }

    const passwordMatch = await bcrypt.compare(password, usuario.password);
    if (!passwordMatch) {
      console.log("Senha inválida.");
      return res.status(401).json({ error: "Login ou senha inválidos." });
    }

    // Gera o token
    const token = jwt.sign(
      { id: usuario.id, role: usuario.role, name: usuario.nome },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    const { password: _, ...usuarioSemSenha } = usuario;

    if (usuario.role === "ONG" && usuario.ong) {
      usuarioSemSenha.nomeOng = usuario.ong.nome; 
    }
    
    res.json({ token, usuario: usuarioSemSenha });
  } catch (err) {
    console.error("Erro no login:", err);
    res.status(500).json({ error: "Erro interno ao fazer login." });
  }
};

exports.me = async (req, res) => {
  try {
    const usuario = await prisma.account.findUnique({
      where: { id: req.user.id },
      include: { admin: true, ong: true, publico: true },
    });

    if (!usuario)
      return res.status(404).json({ error: "Usuário não encontrado." });

    const { password: _, ...usuarioSemSenha } = usuario;
    res.json(usuarioSemSenha);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao buscar dados do usuário." });
  }
};

exports.atualizarPerfil = async (req, res) => {
  const { nome, telefone, password, currentPassword } = req.body;
  const userId = req.user.id;

  try {
    const usuario = await prisma.account.findUnique({ where: { id: userId } });
    if (!usuario)
      return res.status(404).json({ error: "Usuário não encontrado" });

    const dadosParaAtualizar = {};

    if (nome) dadosParaAtualizar.nome = nome;
    if (telefone) dadosParaAtualizar.telefone = telefone;

    if (password && password.trim() !== "") {
      if (password.length < 6) {
        return res
          .status(400)
          .json({ error: "A nova senha deve ter pelo menos 6 caracteres." });
      }

      if (!currentPassword) {
        return res
          .status(400)
          .json({ error: "Para alterar a senha, informe sua senha atual." });
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
      select: { id: true, nome: true, email: true, telefone: true, role: true },
    });

    res.json({
      message: "Dados atualizados com sucesso!",
      user: usuarioAtualizado,
    });
  } catch (err) {
    console.error("Erro ao atualizar perfil:", err);
    res.status(500).json({ error: "Erro interno ao atualizar." });
  }
};

const generateOTP = () => Math.floor(1000 + Math.random() * 9000).toString();

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const account = await prisma.account.findUnique({ where: { email } });

    if (!account) {
      return res.json({ message: "Código enviado se o e-mail existir." });
    }

    const otp = generateOTP();

    const expiry = new Date();
    expiry.setMinutes(expiry.getMinutes() + 15);

    await prisma.account.update({
      where: { id: account.id },
      data: {
        resetToken: otp,
        resetTokenExpiry: expiry,
      },
    });

    const assunto = "Código de Recuperação - PetResc";
    const html = `
            <div style="font-family: Arial, sans-serif; text-align: center;">
                <h2>Recuperação de Senha</h2>
                <p>Use o código abaixo para redefinir sua senha:</p>
                <h1 style="background: #f4f4f4; padding: 10px; display: inline-block; letter-spacing: 5px;">
                    ${otp}
                </h1>
                <p>Este código expira em 15 minutos.</p>
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
        email,
        resetToken: code,
        resetTokenExpiry: { gt: new Date() },
      },
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

  if (newPassword.length < 6) {
    return res
      .status(400)
      .json({ error: "A nova senha deve ter pelo menos 6 caracteres." });
  }

  try {
    const account = await prisma.account.findFirst({
      where: {
        email,
        resetToken: code,
        resetTokenExpiry: { gt: new Date() },
      },
    });

    if (!account) {
      return res.status(400).json({ error: "Código inválido ou expirado." });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.account.update({
      where: { id: account.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    res.json({ message: "Senha redefinida com sucesso!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao redefinir senha." });
  }
};

exports.loginOng = async (req, res) => {
    const { cnpj, password } = req.body;

    try {
        // 1. Busca a conta que tem uma ONG associada com esse CNPJ
        // Precisamos buscar na tabela Account onde a relação 'ong' tem esse CNPJ
        const ongEncontrada = await prisma.ong.findUnique({
            where: { cnpj },
            include: { account: true } // Traz a conta associada
        });

        if (!ongEncontrada || !ongEncontrada.account) {
            return res.status(401).json({ error: 'CNPJ ou senha inválidos.' });
        }

        const usuario = ongEncontrada.account;

        // 2. Verifica a senha na conta principal
        const passwordMatch = await bcrypt.compare(password, usuario.password); 
        if (!passwordMatch) return res.status(401).json({ error: 'CNPJ ou senha inválidos.' });

        // 3. Gera o Token
        const token = jwt.sign(
            { id: usuario.id, role: usuario.role, name: usuario.nome }, 
            JWT_SECRET,
            { expiresIn: '7d' }
        );
        
        // 4. Retorna (incluindo dados da ONG para facilitar o front)
        const { password: _, ...usuarioSemSenha } = usuario;
        // Adicionamos os dados da ONG no retorno do usuário para o front já ter acesso direto
        usuarioSemSenha.ong = ongEncontrada; 

        res.json({ token, usuario: usuarioSemSenha });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao fazer login da ONG.' });
    }
};
