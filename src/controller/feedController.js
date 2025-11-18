const { PrismaClient, StatusAdocao } = require("@prisma/client");
const prisma = new PrismaClient();

const getFeed = async (req, res) => {
  console.log("--- LOG DEBUG FEED ---");
  console.log("Query Params recebidos:", req.query);

  const { especie, porte, sexo } = req.query;

  try {
    const whereClause = {
      
      // Lógica de filtros
      ...(especie && { especie: { contains: especie, mode: 'insensitive' } }),
      ...(porte && { porte: { contains: porte, mode: 'insensitive' } }),
      ...(sexo && { sexo: { equals: sexo } }),
    };

    console.log("Where Clause Gerada:", JSON.stringify(whereClause, null, 2));

    const animais = await prisma.animal.findMany({
      where: whereClause,
      include: {
        account: {
          select: {
            ong: {
              select: {
                id: true,
                nome: true,
                endereco: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    console.log(`Animais encontrados: ${animais.length}`);

    const feedFormatado = animais.map((animal) => {
      const ongInfo = animal.account?.ong || null;
      const { account, ...animalData } = animal;
      return {
        ...animalData,
        ong: ongInfo,
      };
    });

    res.json(feedFormatado);
  } catch (error) {
    console.error("ERRO CRÍTICO NO FEED:", error);
    // Isso vai te mostrar se o erro é de sintaxe do Prisma (ex: usar contains em Enum)
    res.status(500).json({ error: "Erro ao carregar feed de animais", details: error.message });
  }
};

module.exports = {
  getFeed,
};