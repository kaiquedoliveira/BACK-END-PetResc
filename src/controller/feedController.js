const { PrismaClient, StatusAdocao } = require("@prisma/client");
const prisma = new PrismaClient();

const getFeed = async (req, res) => {
  const { especie, porte, sexo } = req.query;

  console.log("--- NOVA REQUISICAO FEED ---");
  console.log("1. Filtros Recebidos do Front:", { especie, porte, sexo });

  try {
    const whereClause = {
      status: StatusAdocao.DISPONIVEL,
      ...(especie && { especie: { contains: especie, mode: "insensitive" } }),
      ...(porte && { porte: { contains: porte, mode: "insensitive" } }),
      ...(sexo && { sexo: { equals: sexo, mode: "insensitive" } }),
    };

    console.log("2. Where Clause Gerada:", JSON.stringify(whereClause, null, 2));

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

    console.log(`3. Animais encontrados no banco: ${animais.length}`);

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
    console.error("ERRO FATAL no Feed:", error);
    res.status(500).json({ error: "Erro ao carregar feed de animais" });
  }
};

module.exports = { getFeed };
