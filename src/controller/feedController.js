const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const getFeed = async (req, res) => {
  const { especie, porte, status, sexo } = req.query;

  try {
    const filtros = {
      AND: [
        especie ? { especie: { contains: especie, mode: 'insensitive' } } : {},
        porte ? { porte: { contains: porte, mode: 'insensitive' } } : {},
        sexo ? { sexo: { equals: sexo } } : {},

        // 🔥 REGRA FINAL DO FEED 🔥
        status
          ? { status: { equals: status.toUpperCase() } }
          : { status: { in: ['DISPONIVEL', 'PERDIDO', 'ENCONTRADO'] } }
      ]
    };

    const animais = await prisma.animal.findMany({
      where: filtros,
      include: {
        account: {
          select: {
            id: true,
            nome: true,
            email: true,
            telefone: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    res.json(animais);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao buscar animais" });
  }
};

module.exports = { getFeed };
