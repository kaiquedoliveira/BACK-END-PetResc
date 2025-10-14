const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();


const criarPedido = async (req, res) => {
    const candidatoId = req.account.id;
    const { animalId } = req.body;

    if (!animalId) {
        return res.status(400).json({ error: 'O ID do animal é obrigatório.' });
    }

    try {
        const animal = await prisma.animal.findUnique({ where: { id: parseInt(animalId) } });

        if (!animal) {
            return res.status(404).json({ error: 'Animal não encontrado.' });
        }

        if (animal.status !== 'DISPONIVEL') {
            return res.status(400).json({ error: 'Este animal não está mais disponível para adoção.' });
        }

        if (animal.accountId === candidatoId) {
            return res.status(400).json({ error: 'Você não pode adotar seu próprio animal.' });
        }
        
        const pedidoExistente = await prisma.pedidoAdocao.findFirst({
            where: { animalId: parseInt(animalId), candidatoId: candidatoId }
        });

        if (pedidoExistente) {
            return res.status(409).json({ error: 'Você já se candidatou para adotar este animal.' });
        }

        const novoPedido = await prisma.pedidoAdocao.create({
            data: {
                animalId: parseInt(animalId),
                candidatoId: candidatoId,
            }
        });

        res.status(201).json(novoPedido);
    } catch (error) {
        console.error("Erro ao criar pedido de adoção:", error);
        res.status(500).json({ error: 'Ocorreu um erro no servidor.' });
    }
};

 
const listarPedidos = async (req, res) => {
    const usuarioLogado = req.account;
    
    try {
        let whereClause = {};

        if (usuarioLogado.role === 'ADMIN') {
        } else if (usuarioLogado.role === 'PUBLICO') {
            whereClause = { candidatoId: usuarioLogado.id };
        } else if (usuarioLogado.role === 'ONG') {
            whereClause = {
                animal: {
                    accountId: usuarioLogado.id
                }
            };
        } else {
            return res.status(403).json({ error: "Você não tem permissão para ver estes dados." });
        }

        const pedidos = await prisma.pedidoAdocao.findMany({
            where: whereClause,
            include: {
                animal: true,
                candidato: {    
                    select: {
                        id: true,
                        email: true,
                        publico: true,
                        ong: true
                    }
                }
            },
            orderBy: {
                dataPedido: 'desc' // Mostra os mais recentes primeiro
            }
        });

        res.status(200).json(pedidos);

    } catch (error) {
        console.error("Erro ao listar pedidos de adoção:", error);
        res.status(500).json({ error: 'Ocorreu um erro no servidor.' });
    }
};


module.exports = {
    criarPedido,
    listarPedidos
};