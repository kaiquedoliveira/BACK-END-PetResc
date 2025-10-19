const { PrismaClient, StatusAdocao } = require("@prisma/client");
const prisma = new PrismaClient();

// GET padrão
const getFeed = async (req, res) => {

  const { especie, porte, sexo } = req.query;
  try {
    const whereClause = {
      status: StatusAdocao.DISPONIVEL, // Sempre buscamos apenas animais disponíveis
      ...(especie && { especie: { contains: especie, mode: 'insensitive' } }),
      ...(porte && { porte: { contains: porte, mode: 'insensitive' } }),
      ...(sexo && { sexo: { equals: sexo } }),
    }; 
      const animais = await prisma.animal.findMany({
      where: whereClause,

      include: {
        account: {
          select: {
            // Apenas os dados da ONG nos interessam para o feed
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

    const feedFormatado = animais.map(animal => {
      const ongInfo = animal.account?.ong || null;

      const { account, ...animalData } = animal;
      return {
        ...animalData,
        ong: ongInfo,
      };
    });

    res.json(feedFormatado);
  } catch (error) {
    console.error("Erro ao carregar feed:", error);
    res.status(500).json({ error: "Erro ao carregar feed de animais" });
  }
};

module.exports = {
  getFeed,
};