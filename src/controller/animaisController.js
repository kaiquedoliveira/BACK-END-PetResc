const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Lista todos os animais ou com filtros
const listarAnimais = async (req, res) => {
  const { especie, porte, status, sexo } = req.query;

  try {
    const animais = await prisma.animal.findMany({
      where: {
        AND: [
          especie
            ? { especie: { contains: especie, mode: "insensitive" } }
            : {},
          porte ? { porte: { contains: porte, mode: "insensitive" } } : {},
          status
            ? { status: { equals: status } }
            : { status: { in: ["DISPONIVEL", "ENCONTRADO", "LAR_TEMPORARIO"] } },

          sexo ? { sexo: { equals: sexo } } : {},
        ],
      },
      include: {
        account: {
          select: {
            id: true,
            nome: true,
            email: true,
            telefone: true,
          },
        },
      },
    });
    res.json(animais);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao buscar animais" });
  }
};

const buscarAnimalPorId = async (req, res) => {
  const { id } = req.params;

  const animalId = parseInt(id);

  if (isNaN(animalId)) {
    return res.status(400).json({ error: "ID do animal inválido." });
  }

  try {
    const animal = await prisma.animal.findUnique({
      where: { id: animalId },
      include: {
        account: {
          select: {
            id: true,
            nome: true,
            email: true,
            telefone: true,
          },
        },
        ficha: true, // Inclui a ficha, se existir
      },
    });

    if (!animal)
      return res.status(404).json({ error: "Animal não encontrado." });

    res.json(animal);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao buscar animal" });
  }
};

const criarAnimal = async (req, res) => {
  const usuarioLogado = req.user;
  const files = req.files || {};

  // Desestruturando TUDO que vem do formulário (FormData)
  const {
    nome,
    especie,
    raca,
    porte,
    sexo,
    descricao,
    idade,
    cor,
    status,

    // Resgate / Localização
    data_resgate,
    local_estado,
    local_cidade,
    local_numero,
    local_atual,
    tinha_filhotes,
    tinha_coleira,
    motivo_nao_disponivel,

    // Saúde (Booleans em string "sim"/"nao")
    vermifugado,
    data_vermifugado,
    vacinado,
    vacinas_texto,
    castrado,
    data_castrado,
    testado_doencas,
    testes_texto,
    resultados_testes, // no front vem como 'testado', 'testes', 'resultados'

    // Comportamento / Extras
    observacoes, // no front vem como 'observacoes' (campo obs)
    cuidado,
    sociabilidade,
  } = req.body;

  if (!nome || !especie) {
    return res.status(400).json({ error: "Nome e espécie são obrigatórios." });
  }

  // Tratamento de Imagens (Principal e Resgate)
  const imagemPrincipalFile = files.imagem?.[0];
  const imagemResgateFile = files.imagem_resgate?.[0]; // Campo novo do form

  const photoURL = imagemPrincipalFile ? imagemPrincipalFile.path : null;
  const imagemResgateURL = imagemResgateFile ? imagemResgateFile.path : null;

  // Helpers para conversão de dados do FormData
  const parseBool = (val) => val === "sim" || val === "true";
  const parseDate = (val) => (val ? new Date(val) : null);
  const parseIntSafe = (val) => (val ? parseInt(val) : null);

  try {
    const novoAnimal = await prisma.animal.create({
      data: {
        // --- DADOS BÁSICOS (Model Animal) ---
        nome,
        especie,
        raca: raca || "SRD",
        porte: porte || null,
        sexo: sexo || null, // 'MACHO' ou 'FEMEA'
        descricao: descricao || null, // História
        idade: idade || "Não informada",
        corPredominante: cor || null,
        photoURL,
        status: status || "DISPONIVEL", // Status do select da ONG
        accountId: usuarioLogado.id,

        // --- DADOS DE RESGATE (Model Animal) ---
        data_resgate: parseDate(data_resgate),
        local_estado: local_estado || null,
        local_cidade: local_cidade || null,
        local_numero: local_numero || null,
        local_atual: local_atual || null,
        tinha_filhotes: parseBool(tinha_filhotes),
        tinha_coleira: parseBool(tinha_coleira),
        motivo_nao_disponivel: motivo_nao_disponivel || null,
        imagem_resgate_url: imagemResgateURL,

        // --- DADOS DE SAÚDE DIRETOS (Model Animal) ---
        // Seu schema tem esses campos direto no Animal, vamos preenchê-los
        vermifugado: parseBool(vermifugado),
        data_vermifugado: parseDate(data_vermifugado),

        vacinado: parseBool(vacinado),
        vacinas_texto: vacinas_texto || null,

        castrado: parseBool(castrado),
        data_castrado: parseDate(data_castrado),

        testado_doencas: parseBool(testado_doencas), // Front manda 'testado' mas formData append pode mudar nome
        testes_texto: testes_texto || null,
        resultados_testes: resultados_testes || null,

        cuidados_veterinarios: cuidado || null,
        sociabilidade: sociabilidade || null,

        // --- FICHA TÉCNICA VINCULADA (Model Ficha) ---
        // Salvamos aqui dados complementares ou duplicados para garantir a exibição
        ficha: {
          create: {
            status: status || "DISPONIVEL",
            temperamento: sociabilidade || "Não informado",
            saude: resultados_testes || "Não informado",
            vacinas: vacinas_texto || (parseBool(vacinado) ? "Sim" : "Não"),
            vermifugos: parseBool(vermifugado) ? "Sim" : "Não",
            castrado: parseBool(castrado),
            observacoes: observacoes || cuidado || null, // Junta obs e cuidados
            // Preenche outros campos obrigatórios da Ficha com defaults
            nome: nome,
            especie: especie,
          },
        },
      },
      include: { ficha: true }, // Retorna o animal já com a ficha criada
    });

    res.status(201).json(novoAnimal);
  } catch (err) {
    console.error("Erro ao cadastrar animal:", err);
    res.status(500).json({ error: "Erro interno ao salvar dados do animal." });
  }
};

// Atualiza os dados de um animal

const atualizarAnimal = async (req, res) => {
  const { id } = req.params;
  const usuarioLogado = req.user;

  // Desestrutura os campos que precisam de tratamento especial
  const {
    nome,
    idade,
    data_resgate,
    data_vermifugado,
    dataCastrado,
    vermifugado,
    vacinado,
    castrado,
    testado,
    tinha_filhotes,
    tinha_coleira,
    ...dataRestante
  } = req.body;

  // dataToUpdate começa com todos os campos restantes
  let dataToUpdate = { ...dataRestante };

  // --- Lógica de Upload de Imagens para ATUALIZAÇÃO ---
  // Você precisará de lógica similar ao criarAnimal aqui, se o frontend permitir
  // a troca de fotos na atualização. Por enquanto, assumimos que as URLs existentes são mantidas.
  // ----------------------------------------------------

  try {
    const animal = await prisma.animal.findUnique({
      where: { id: parseInt(id) },
    });
    if (!animal)
      return res.status(404).json({ error: "Animal não encontrado." });

    if (
      animal.accountId !== usuarioLogado.id &&
      usuarioLogado.role !== "ADMIN"
    ) {
      return res.status(403).json({
        error: "Acesso negado. Você não tem permissão para editar este animal.",
      });
    }

    // --- CONVERSÃO DE TIPOS ---

    // 1. Strings para Int
    if (nome) dataToUpdate.nome = nome;
    if (idade) dataToUpdate.idade = idade;
    // 2. Strings ('sim'/'nao') para Boolean
    if (vermifugado !== undefined)
      dataToUpdate.vermifugado = vermifugado === "sim";
    if (vacinado !== undefined) dataToUpdate.vacinado = vacinado === "sim";
    if (castrado !== undefined) dataToUpdate.castrado = castrado === "sim";
    if (testado !== undefined) dataToUpdate.testado_doencas = testado === "sim";
    if (tinha_filhotes !== undefined)
      dataToUpdate.tinha_filhotes = tinha_filhotes === "sim";
    if (tinha_coleira !== undefined)
      dataToUpdate.tinha_coleira = tinha_coleira === "sim";

    // 3. Strings para Date
    if (data_resgate) dataToUpdate.data_resgate = new Date(data_resgate);
    if (data_vermifugado)
      dataToUpdate.data_vermifugado = new Date(data_vermifugado);
    if (dataCastrado) dataToUpdate.data_castrado = new Date(dataCastrado);

    // O campo 'cor' é mapeado para 'corPredominante' no schema
    if (dataToUpdate.cor) {
      dataToUpdate.corPredominante = dataToUpdate.cor;
      delete dataToUpdate.cor;
    }

    // --- FIM DA CONVERSÃO ---

    const animalAtualizado = await prisma.animal.update({
      where: { id: parseInt(id) },
      data: dataToUpdate,
    });

    res.json(animalAtualizado);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao atualizar animal." });
  }
};
// Deleta um animal
const deletarAnimal = async (req, res) => {
  const { id } = req.params;
  const usuarioLogado = req.user;

  try {
    const animal = await prisma.animal.findUnique({
      where: { id: parseInt(id) },
    });
    if (!animal)
      return res.status(404).json({ error: "Animal não encontrado." });

    if (
      animal.accountId !== usuarioLogado.id &&
      usuarioLogado.role !== "ADMIN"
    ) {
      return res
        .status(403)
        .json({ error: "Acesso negado. Você não pode deletar este animal." });
    }

    await prisma.animal.delete({ where: { id: parseInt(id) } });
    res.status(200).json({ message: "Animal removido com sucesso." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao deletar animal." });
  }
};

const favoritarAnimal = async (req, res) => {
  const animalId = parseInt(req.params.id);
  const usuarioId = req.user.id;

  try {
    const animal = await prisma.animal.findUnique({ where: { id: animalId } });
    if (!animal)
      return res.status(404).json({ error: "Animal não encontrado." });

    await prisma.favorito.create({
      data: {
        usuarioId,
        animalId,
      },
    });

    res.status(201).json({ message: "Animal adicionado aos favoritos!" });
  } catch (err) {
    if (err.code === "P2002") {
      return res.status(400).json({ error: "Você já favoritou este animal." });
    }
    console.error(err);
    res.status(500).json({ error: "Erro ao favoritar animal." });
  }
};

const desfavoritarAnimal = async (req, res) => {
  const animalId = parseInt(req.params.id);
  const usuarioId = req.user.id;

  try {
    await prisma.favorito.delete({
      where: {
        usuarioId_animalId: {
          usuarioId,
          animalId,
        },
      },
    });

    res.json({ message: "Animal removido dos favoritos." });
  } catch (err) {
    if (err.code === "P2025") {
      return res
        .status(404)
        .json({ error: "Este animal não estava nos seus favoritos." });
    }
    console.error(err);
    res.status(500).json({ error: "Erro ao desfavoritar." });
  }
};

const listarAnimaisParaGerenciamento = async (req, res) => {
  try {
    let whereClause = {};
    const usuarioLogado = req.user;

    if (usuarioLogado.role !== "ADMIN") {
      whereClause = { accountId: usuarioLogado.id };
    }

    const animais = await prisma.animal.findMany({
      where: whereClause,
      include: {
        account: {
          select: {
            id: true,
            nome: true,
            email: true,
            telefone: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(animais);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "Erro ao listar animais para gerenciamento." });
  }
};

const obterEstatisticasAnimaisPorStatus = async (req, res) => {
  const userId = req.user.id;

  if (req.user.role !== "ONG") {
    return res.status(403).json({ error: "Acesso negado. Apenas ONGs." });
  }

  try {
    const estatisticas = await prisma.animal.groupBy({
      by: ["status"],
      where: {
        accountId: userId, // Filtra apenas pelos animais da ONG logada
      },
      _ccount: {
        status: true,
      },
    });

    const resultadoFormatado = estatisticas.reduce((acc, current) => {
      acc[current.status] = current._count.status;
      return acc;
    }, {});

    res.json(resultadoFormatado);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao obter estatísticas de animais." });
  }
};

module.exports = {
  listarAnimais,
  buscarAnimalPorId,
  criarAnimal,
  atualizarAnimal,
  deletarAnimal,
  favoritarAnimal,
  desfavoritarAnimal,
  listarAnimaisParaGerenciamento,
  obterEstatisticasAnimaisPorStatus,
};
