const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const criarPedido = async (req, res) => {
    const { animalId } = req.body;
    // O ID do candidato (o usuário logado) vem do nosso token JWT (adicionado pelo middleware)
    const candidatoId = req.user.id; 

    if (!animalId) {
        return res.status(400).json({ error: 'O ID do animal é obrigatório.' });
    }

    try {

        const animal = await prisma.animal.findUnique({ where: { id: animalId } });
        if (!animal) {
            return res.status(404).json({ error: 'Animal não encontrado.' });
        }
        if (animal.status !== 'DISPONIVEL') {
            return res.status(400).json({ error: 'Este animal não está mais disponível para adoção.' });
        }

        // Verificar se o usuário já não fez um pedido para este mesmo animal
        const pedidoExistente = await prisma.pedidoAdocao.findFirst({
            where: {
                animalId: animalId,
                candidatoId: candidatoId,
            },
        });
        if (pedidoExistente) {
            return res.status(400).json({ error: 'Você já enviou um pedido de adoção para este animal.' });
        }

        
        const novoPedido = await prisma.pedidoAdocao.create({
            data: {
                animalId: animalId,
                candidatoId: candidatoId,
                // O status padrão já é 'PENDENTE' (definido no schema.prisma)
            },
            include: { // Inclui os detalhes do animal na resposta
                animal: true,
            },
        });

        res.status(201).json(novoPedido);
    } catch (error) {
        console.error("Erro ao criar pedido de adoção:", error);
        res.status(500).json({ error: 'Erro interno ao processar o pedido de adoção.' });
    }
};


const listarMeusPedidos = async (req, res) => {
    const candidatoId = req.user.id;

    try {
        const meusPedidos = await prisma.pedidoAdocao.findMany({
            where: {
                candidatoId: candidatoId,
            },
            include: { 
                animal: true,
            },
            orderBy: {
                dataPedido: 'desc', 
            }
        });

        res.status(200).json(meusPedidos);
    } catch (error) {
        console.error("Erro ao listar meus pedidos:", error);
        res.status(500).json({ error: 'Erro interno ao buscar seus pedidos.' });
    }
};


const listarPedidosParaGerenciamento = async (req, res) => {
    // ... (lógica do whereClause continua a mesma)
    try {

        let whereClause = {};
        const pedidos = await prisma.pedidoAdocao.findMany({
            where: whereClause,
            include: {
                animal: true,
                // A CONSULTA FICOU MUITO MAIS SIMPLES!
                // Agora podemos pegar os dados diretamente do 'candidato' (Account)
                candidato: {
                    select: {
                        id: true,
                        email: true,
                        nome: true,  // <-- Direto do Account
                        telefone: true  // <-- Direto do Account
                    }
                }
            },
            orderBy: { dataPedido: 'desc' }
        });
        // Não precisamos mais do bloco de formatação!
        res.status(200).json(pedidos);
    } catch (error) {
        console.error("Erro ao listar pedidos para gerenciamento:", error);
        res.status(500).json({ error: 'Erro interno ao buscar pedidos.' });
    }
};

const atualizarStatusPedido = async (req, res) => {
    const { id: pedidoId } = req.params;
    const { status } = req.body; // O novo status: 'APROVADO' ou 'RECUSADO'
    const { id: gestorId, role } = req.user; // Gestor = Admin ou ONG

    if (!status || !['APROVADO', 'RECUSADO'].includes(status)) {
        return res.status(400).json({ error: "Status inválido. Use 'APROVADO' ou 'RECUSADO'." });
    }

    try {
        const pedido = await prisma.pedidoAdocao.findUnique({
            where: { id: parseInt(pedidoId) },
            include: { animal: true }
        });

        if (!pedido) {
            return res.status(404).json({ error: 'Pedido de adoção não encontrado.' });
        }

        // Apenas o Admin ou a ONG dona do animal podem alterar o status.
        if (role !== 'ADMIN' && pedido.animal.accountId !== gestorId) {
            return res.status(403).json({ error: 'Acesso negado. Você não tem permissão para gerenciar este pedido.' });
        }

        if (pedido.status !== 'PENDENTE') {
            return res.status(400).json({ error: `Este pedido já foi ${pedido.status.toLowerCase()}.`})
        }

        //  Mudar o status do PEDIDO.
        //  Mudar o status do ANIMAL para 'ADOTADO'.
        if (status === 'APROVADO') {
            const [pedidoAtualizado, animalAtualizado] = await prisma.$transaction([
                prisma.pedidoAdocao.update({
                    where: { id: parseInt(pedidoId) },
                    data: { status: 'APROVADO' }
                }),
                prisma.animal.update({
                    where: { id: pedido.animalId },
                    data: { status: 'ADOTADO' }
                })
            ]);
            res.status(200).json({ message: 'Pedido aprovado com sucesso!', pedido: pedidoAtualizado });
        } else { // 'RECUSADO', apenas atualizamos o pedido.
            const pedidoAtualizado = await prisma.pedidoAdocao.update({
                where: { id: parseInt(pedidoId) },
                data: { status: 'RECUSADO' }
            });
            res.status(200).json({ message: 'Pedido recusado.', pedido: pedidoAtualizado });
        }
    } catch (error) {
        console.error("Erro ao atualizar status do pedido:", error);
        res.status(500).json({ error: 'Erro interno ao atualizar o pedido.' });
    }
};

module.exports = {
    criarPedido,
    listarMeusPedidos,
    listarPedidosParaGerenciamento,
    atualizarStatusPedido
};