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

exports.update = async (req, res) => {
  const { id } = req.params;
  const campaignId = Number(id);

  if (isNaN(campaignId)) {
    return res.status(400).json({ message: "ID inválido." });
  }

  try {
    const userId = req.user.id;

    // 1. Busca a campanha
    const campanha = await prisma.campanha.findUnique({
      where: { id: campaignId }
    });

    if (!campanha) {
      return res.status(404).json({ message: "Campanha não encontrada." });
    }

    // 2. Permissão (criador ou ONG associada ao user)
    const account = await prisma.account.findUnique({
      where: { id: userId },
      include: { ong: true }
    });

    const userIsOngOwner = account?.ong?.id && campanha.ongId === account.ong.id;
    const userIsCreator = campanha.usuarioCriadorId === userId;

    if (!userIsCreator && !userIsOngOwner) {
      return res.status(403).json({ message: "Sem autorização para editar esta campanha." });
    }

    // 3. Dados enviados
    const {
      titulo,
      descricao,
      meta_financeira,
      data_limite,
      itens_descricao
    } = req.body;

    let itensArray = campanha.itensDescricao; // mantém os antigos se não mandar novos

    if (itens_descricao) {
      try {
        itensArray = JSON.parse(itens_descricao);
      } catch {
        console.warn("Itens inválidos, ignorando.");
      }
    }

    // 4. Trata imagem (opcional)
    const imagemUrl = req.file ? req.file.path : campanha.imagemUrl;

    // 5. Monta objeto de atualização
    const dataToUpdate = {};

    if (titulo) dataToUpdate.titulo = titulo;
    if (descricao) dataToUpdate.descricao = descricao;
    if (meta_financeira) dataToUpdate.metaFinanceira = parseFloat(meta_financeira);
    if (data_limite) dataToUpdate.dataLimite = new Date(data_limite);
    if (itensArray) dataToUpdate.itensDescricao = itensArray;
    if (imagemUrl) dataToUpdate.imagemUrl = imagemUrl;

    // 6. Atualiza
    const updated = await prisma.campanha.update({
      where: { id: campaignId },
      data: dataToUpdate
    });

    return res.json({
      message: "Campanha atualizada com sucesso!",
      campanha: updated
    });

  } catch (error) {
    console.error("Erro ao atualizar campanha:", error);
    return res.status(500).json({ message: "Erro interno ao atualizar campanha." });
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

  // Validação: Se não for número, rejeita antes de chamar o Prisma
  const campanhaId = Number(id);
  if (isNaN(campanhaId)) {
      return res.status(400).json({ message: "ID inválido." });
  }

  try {
    const campanha = await prisma.campanha.findUnique({
      where: { id: campanhaId }, // Usa a variável convertida
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
