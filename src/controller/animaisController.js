const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Lista todos os animais ou com filtros
const listarAnimais = async (req, res) => {
  const { especie, porte, status, sexo } = req.query;

  try {
    const animais = await prisma.animal.findMany({
      where: {
        AND: [
          especie ? { especie: { contains: especie, mode: 'insensitive' } } : {},
          porte ? { porte: { contains: porte, mode: 'insensitive' } } : {},
          status ? { status: { equals: status } } : { status: 'DISPONIVEL' },
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
}
    });
    res.json(animais);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar animais' });
  }
};

// Busca um animal específico pelo ID
const buscarAnimalPorId = async (req, res) => {
  const { id } = req.params;

  try {
    const animal = await prisma.animal.findUnique({
      where: { id: parseInt(id) },
      include: {
    account: {
        select: { 
            id: true,
            nome: true,
            email: true,
            telefone: true
        }
    }
}
    });

    if (!animal) return res.status(404).json({ error: 'Animal não encontrado.' });

    res.json(animal);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar animal' });
  }
};

// Cria um novo animal
const criarAnimal = async (req, res) => {
  const { nome, especie, raca, idade, status, porte, sexo, descricao, } = req.body;
  const usuarioLogado = req.user;
  
   const file = req.file;

  if (!nome || !especie) {
    return res.status(400).json({ error: 'Nome e espécie são obrigatórios.' });
  }

  if (!file) {
    return res.status(400).json({ error: 'A imagem é obrigatória.' });
  }


  const photoURL = `${req.protocol}://${req.get('host')}/uploads/${file.filename}`;

  try {
    const novoAnimal = await prisma.animal.create({
      data: {
        nome,
        especie,
        raca,
        idade: idade ? parseInt(idade) : null,
        status: status || 'DISPONIVEL', 
        porte,
        sexo: sexo, 
        descricao: descricao, 
        photoURL: photoURL, 
        accountId: usuarioLogado.id    
      },
    });

    res.status(201).json(novoAnimal);
  } catch (err) {
    console.error('Erro detalhado:', err);
    res.status(500).json({ error: 'Erro ao cadastrar animal.' });
  }
};



// Atualiza os dados de um animal
const atualizarAnimal = async (req, res) => {
    const { id } = req.params;
    const usuarioLogado = req.user;
    const { nome, ...dataToUpdate } = req.body;


    try {
        const animal = await prisma.animal.findUnique({ where: { id: parseInt(id) } });
        if (!animal) return res.status(404).json({ error: 'Animal não encontrado.' });

        if (animal.accountId !== usuarioLogado.id && usuarioLogado.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Acesso negado. Você não tem permissão para editar este animal.' });
        }
          if (nome) {
            dataToUpdate.nome = nome;
        }

        if (dataToUpdate.idade) dataToUpdate.idade = parseInt(dataToUpdate.idade);

         const animalAtualizado = await prisma.animal.update({
           where: { id: parseInt(id) },
           data: dataToUpdate,
      });
        res.json(animalAtualizado);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao atualizar animal.' });
    }
};
// Deleta um animal
const deletarAnimal = async (req, res) => {
    const { id } = req.params;
    const usuarioLogado = req.user;

    try {
        const animal = await prisma.animal.findUnique({ where: { id: parseInt(id) } });
        if (!animal) return res.status(404).json({ error: 'Animal não encontrado.' });

        if (animal.accountId !== usuarioLogado.id && usuarioLogado.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Acesso negado. Você não pode deletar este animal.' });
        }

        await prisma.animal.delete({ where: { id: parseInt(id) } });
        res.status(200).json({ message: 'Animal removido com sucesso.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao deletar animal.' });
    }
};


const favoritarAnimal = async (req, res) => {
    const animalId = parseInt(req.params.id);
    const usuarioId = req.user.id;

    try {
        const animal = await prisma.animal.findUnique({ where: { id: animalId } });
        if (!animal) return res.status(404).json({ error: 'Animal não encontrado.' });

        await prisma.favorito.create({
            data: {
                usuarioId,
                animalId
            }
        });

        res.status(201).json({ message: 'Animal adicionado aos favoritos!' });
    } catch (err) {
        if (err.code === 'P2002') {
            return res.status(400).json({ error: 'Você já favoritou este animal.' });
        }
        console.error(err);
        res.status(500).json({ error: 'Erro ao favoritar animal.' });
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
                    animalId
                }
            }
        });

        res.json({ message: 'Animal removido dos favoritos.' });
    } catch (err) {
        if (err.code === 'P2025') {
             return res.status(404).json({ error: 'Este animal não estava nos seus favoritos.' });
        }
        console.error(err);
        res.status(500).json({ error: 'Erro ao desfavoritar.' });
    }
};

const listarAnimaisParaGerenciamento = async (req, res) => {
    try {
        let whereClause = {};
        if (req.user.role === 'ONG') {
            whereClause = { accountId: req.user.id };
        }
        
        const animais = await prisma.animal.findMany({
            where: whereClause,
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
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao listar animais para gerenciamento.' });
    }
};

const obterEstatisticasAnimaisPorStatus = async (req, res) => {
    const userId = req.user.id; 

    if (req.user.role !== 'ONG') {
        return res.status(403).json({ error: 'Acesso negado. Apenas ONGs.' });
    }

    try {
        const estatisticas = await prisma.animal.groupBy({
            by: ['status'],
            where: {
                accountId: userId, // Filtra apenas pelos animais da ONG logada
            },
            _count: {
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
        res.status(500).json({ error: 'Erro ao obter estatísticas de animais.' });
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
  obterEstatisticasAnimaisPorStatus
};
