const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

exports.create = async (req, res) => {
  try {
    const { titulo, descricao, meta_financeira, data_limite, itens_descricao } = req.body;
    
    // --- CORREÇÃO AQUI ---
    // O middleware de auth coloca os dados em req.user
    const userId = req.user.id; 

    if (!titulo || !meta_financeira || !data_limite) {
      return res.status(400).json({ message: "Campos obrigatórios inválidos" });
    }

    // 1. Busca a conta para saber se é uma ONG e pegar o ID da ONG
    const account = await prisma.account.findUnique({
        where: { id: userId },
        include: { ong: true }
    });

    if (!account) return res.status(404).json({ error: "Usuário não encontrado" });

    // Converter lista de itens (FormData envia string)
    let itensArray = [];
    try {
      itensArray = JSON.parse(itens_descricao || "[]");
    } catch (err) {
      console.warn("Itens inválidos, usando array vazio");
    }

    const imagemUrl = req.file ? req.file.path : null;

    // 2. Cria a campanha
    const campanha = await prisma.campanha.create({
      data: {
        titulo,
        descricao,
        metaFinanceira: parseFloat(meta_financeira),
        dataLimite: new Date(data_limite),
        itensDescricao: itensArray,
        imagemUrl,
        usuarioCriadorId: userId,
        // Se a conta tiver uma ONG associada, salva o ID dela
        ongId: account.ong ? account.ong.id : null 
      },
    });

    return res.status(201).json({
      message: "Campanha criada com sucesso!",
      campanha
    });

  } catch (error) {
    console.error("Erro ao criar campanha:", error);
    return res.status(500).json({ message: "Erro interno ao criar campanha." });
  }
};

exports.getAll = async (req, res) => {
  try {
    const campanhas = await prisma.campanha.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        usuarioCriador: {
          select: { nome: true, email: true }
        },
        ong: {
          select: { nome: true, cidade: true, estado: true } // Adicionei cidade/estado para exibir no front
        }
      }
    });

    return res.json(campanhas);

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Erro ao buscar campanhas." });
  }
};

exports.getById = async (req, res) => {
  const { id } = req.params;

  try {
    const campanha = await prisma.campanha.findUnique({
      where: { id: Number(id) },
      include: {
        ong: {
          select: {
            id: true,
            nome: true,
            cidade: true,
            estado: true
          }
        },
        usuarioCriador: {
          select: { nome: true, email: true }
        }
      }
    });

    if (!campanha) {
      return res.status(404).json({ message: "Campanha não encontrada." });
    }

    return res.json(campanha);

  } catch (error) {
    console.error("Erro no getById:", error);
    return res.status(500).json({ message: "Erro ao buscar campanha." });
  }
};

exports.listarMinhas = async (req, res) => {
  try {
    const usuarioId = req.user.id; // ID do usuário logado (do middleware)

    const minhasCampanhas = await prisma.campanha.findMany({
      where: {
        usuarioCriadorId: usuarioId
      },
      orderBy: { createdAt: "desc" }
    });

    return res.json(minhasCampanhas);

  } catch (error) {
    console.error("Erro ao listar minhas campanhas:", error);
    return res.status(500).json({ message: "Erro ao buscar campanhas." });
  }
};
