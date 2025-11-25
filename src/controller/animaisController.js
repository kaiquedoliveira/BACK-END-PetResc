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

const buscarAnimalPorId = async (req, res) => {
  const { id } = req.params;

  const animalId = parseInt(id);

  if (isNaN(animalId)) {
    return res.status(400).json({ error: 'ID do animal inválido.' });
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
                telefone: true
            }
        },
        ficha: true 
      }
    });

    if (!animal) return res.status(404).json({ error: 'Animal não encontrado.' });

    res.json(animal);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar animal' });
  }
};

const criarAnimal = async (req, res) => {
    const { 
        nome, especie, raca, porte, sexo, cor, descricao, 
        
        // ... (resto da desestruturação do req.body) ...
        idade, cuidado, sociabilidade,
        status, local_estado, local_cidade, local_numero, tinha_filhotes, tinha_coleira,
        motivo_nao_disponivel, local_atual, data_resgate, observacoes, 
        vermifugado, data_vermifugado, vacinado, txtVacinado, castrado, dataCastrado,
        testado, txtTestado, resultados
    } = req.body;

    const usuarioLogado = req.user; 
    const isOng = usuarioLogado.role === 'ONG';

    const files = req.files;
    const imagemPrincipalFile = files?.imagem?.[0];
    const imagemResgateFile = files?.imagem_resgate?.[0]; 

    if (!nome || !especie) {
        return res.status(400).json({ error: 'Nome e espécie são obrigatórios.' });
    }

    if (!imagemPrincipalFile) {
        return res.status(400).json({ error: 'A foto principal do animal é obrigatória.' });
    }

    // Lógica para obter a URL da imagem... (presumindo que está correta)
    const photoURL = `${req.protocol}://${req.get('host')}/uploads/animais/${imagemPrincipalFile.filename}`;
    let imagemResgateURL = null;

    if (imagemResgateFile) {
        imagemResgateURL = `${req.protocol}://${req.get('host')}/uploads/animais/${imagemResgateFile.filename}`;
    }

    try {
        const dataToCreate = {
            // --- CAMPOS BASE ---
            nome,
            especie,
            raca: raca || null,
            porte: porte || null,
            sexo: sexo || null,
            // ⭐️ CORREÇÃO AQUI: Mapeando 'cor' do Front para 'corPredominante' do Prisma
            corPredominante: cor || null, 
            descricao: descricao || null, 
            photoURL: photoURL, 
            accountId: usuarioLogado.id, 
            
            // --- LÓGICA CONDICIONAL ---
            ...(isOng ? {
                status: status || 'DISPONIVEL', 
                idade: idade ? parseInt(idade) : null, 
                
                // Detalhes do Resgate
                data_resgate: data_resgate ? new Date(data_resgate) : null,
                local_estado, 
                local_cidade, 
                local_numero,
                tinha_filhotes: tinha_filhotes === 'sim',
                tinha_coleira: tinha_coleira === 'sim',
                motivo_nao_disponivel,
                local_atual,
                imagem_resgate_url: imagemResgateURL,
                cuidados_veterinarios: observacoes || null, 
                
                // Detalhes da Saúde
                vermifugado: vermifugado === 'sim',
                data_vermifugado: vermifugado === 'sim' && data_vermifugado ? new Date(data_vermifugado) : null,
                vacinado: vacinado === 'sim',
                vacinas_texto: vacinado === 'sim' ? txtVacinado : null,
                castrado: castrado === 'sim',
                data_castrado: castrado === 'sim' && dataCastrado ? new Date(dataCastrado) : null,
                testado_doencas: testado === 'sim',
                testes_texto: testado === 'sim' ? txtTestado : null,
                resultados_testes: testado === 'sim' ? resultados : null,
                
            } : { 
                status: 'ENCONTRADO', 
                idade: isNaN(parseInt(idade)) ? null : parseInt(idade),
                cuidados_veterinarios: cuidado || null, 
                sociabilidade: sociabilidade || null,
            }),
        };

        const novoAnimal = await prisma.animal.create({
            data: dataToCreate,
        });

        res.status(201).json(novoAnimal);
    } catch (err) {
        console.error('Erro detalhado:', err);
        res.status(500).json({ error: 'Erro ao cadastrar animal.' });
    }
};

const atualizarAnimal = async (req, res) => {
    const { id } = req.params;
    const usuarioLogado = req.user;
    const { nome, data_resgate, dataCastrado, data_vermifugado, ...dataRestante } = req.body;
    let dataToUpdate = { ...dataRestante };

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

        if (dataToUpdate.castrado) dataToUpdate.castrado = dataToUpdate.castrado === 'sim';

        if (data_resgate) dataToUpdate.data_resgate = new Date(data_resgate);
        if (dataCastrado) dataToUpdate.data_castrado = new Date(dataCastrado);
        if (data_vermifugado) dataToUpdate.data_vermifugado = new Date(data_vermifugado);


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
        const usuarioLogado = req.user;

        if (usuarioLogado.role !== 'ADMIN') {
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
