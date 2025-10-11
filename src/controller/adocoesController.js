const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Cria um novo pedido de adoção.
 * Um usuário logado se candidata para adotar um animal.
 */
const criarPedido = async (req, res) => {
    // O ID do usuário vem do token (é o candidato)
    const candidatoId = req.account.id;
    // O ID do animal vem do corpo da requisição
    const { animalId } = req.body;

    if (!animalId) {
        return res.status(400).json({ error: 'O ID do animal é obrigatório.' });
    }

    try {
        // --- Validações de Segurança e Lógica ---
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
        // --- Fim das Validações ---

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

/**
 * Lista os pedidos de adoção com base no perfil do usuário logado.
 */
const listarPedidos = async (req, res) => {
    const usuarioLogado = req.account;
    
    try {
        let whereClause = {};

        // Regras de permissão
        if (usuarioLogado.role === 'ADMIN') {
            // Admin vê tudo. whereClause fica vazio.
        } else if (usuarioLogado.role === 'PUBLICO') {
            // Usuário PUBLICO só vê os pedidos que ele mesmo fez.
            whereClause = { candidatoId: usuarioLogado.id };
        } else if (usuarioLogado.role === 'ONG') {
            // ONG só vê pedidos para os animais que pertencem a ela.
            whereClause = {
                animal: {
                    accountId: usuarioLogado.id
                }
            };
        } else {
            // Caso algum outro role seja criado no futuro, não terá acesso por padrão.
            return res.status(403).json({ error: "Você não tem permissão para ver estes dados." });
        }

        const pedidos = await prisma.pedidoAdocao.findMany({
            where: whereClause,
            include: {
                animal: true, // Inclui os dados do animal no retorno
                candidato: {    // Inclui os dados do candidato (sem a senha)
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