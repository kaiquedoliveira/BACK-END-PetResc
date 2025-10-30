const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "pet123";

exports.register = async (req, res) => {
  // Esta linha está correta, o front-end envia 'nome'
  const { email, password, role, nome, cnpj, descricao, endereco, cpf } =
    req.body;

  try {
    const existingUser = await prisma.account.findUnique({ where: { email } });
    if (existingUser)
      return res.status(400).json({ error: "E-mail já cadastrado." });

    const hashedPassword = await bcrypt.hash(password, 10);

    const novaConta = await prisma.account.create({
      data: {
        email,
        password: hashedPassword,
        role,
        // 'admin' espera 'nome' (com 'e')
        ...(role === "ADMIN" && { admin: { create: { nome: nome } } }),

        // --- CORREÇÃO AQUI ---
        // O log de erro prova que 'ong' espera 'name' (com 'a')
        ...(role === "ONG" && {
          ong: { create: { name: nome, cnpj, descricao, endereco } },
        }),
        // --- FIM DA CORREÇÃO ---

        // 'publico' espera 'nome' (com 'e')
        ...(role === "PUBLICO" && {
          publico: { create: { nome: nome, cpf: cpf } },
        }),
      },
      include: { admin: true, ong: true, publico: true },
    });

    const { password: _, ...usuarioSemSenha } = novaConta;
    res.status(201).json(usuarioSemSenha);
  } catch (err) {
    console.error(err); // O erro 'Unknown argument' aparecerá aqui
    res.status(500).json({ error: "Erro ao criar conta." });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const usuario = await prisma.account.findUnique({
      where: { email },
      include: { admin: true, ong: true, publico: true },
    });

    if (!usuario)
      return res.status(401).json({ error: "E-mail ou senha inválidos." });

    const passwordMatch = await bcrypt.compare(password, usuario.password);
    if (!passwordMatch)
      return res.status(401).json({ error: "E-mail ou senha inválidos." });

    // --- CORREÇÃO BÔNUS NO LOGIN ---
    // Precisamos checar 'ong.name' (com 'a') e 'publico.nome' (com 'e')
    const nomeDoUsuario =
      usuario.publico?.nome ||
      usuario.ong?.name ||
      usuario.admin?.nome ||
      "Usuário";

    const token = jwt.sign(
      { id: usuario.id, role: usuario.role, nome: nomeDoUsuario }, // O token envia 'nome'
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    const { password: _, ...usuarioSemSenha } = usuario;
    res.json({ token, usuario: usuarioSemSenha });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao fazer login." });
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
