const { PrismaClient, StatusAdocao } = require("@prisma/client");
const prisma = new PrismaClient();

const getFeed = async (req, res) => {
  const { especie, porte, status, sexo } = req.query;

  try {
    const animais = await prisma.animal.findMany({
      where: {
        AND: [
          especie ? { especie: { contains: especie, mode: 'insensitive' } } : {},
          porte ? { porte: { contains: porte, mode: 'insensitive' } } : {},
          
          
          status 
            ? { status: { equals: status } } 
            : { status: { in: ['DISPONIVEL', 'ENCONTRADO'] } },

          sexo ? { sexo: { equals: sexo } } : {}
        ]
      },
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
      orderBy: { createdAt: 'desc' } 
    });
    res.json(animais);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar animais' });
  }
};

module.exports = {
  getFeed,
};