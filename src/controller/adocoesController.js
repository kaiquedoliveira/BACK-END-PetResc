const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { criarNotificacao } = require('../controller/notificacoesController');

const criarPedido = async (req, res) => {
    const { animalId } = req.body;
  
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
    const usuarioLogado = req.user;
    let whereClause = {};

    try {
        if (usuarioLogado.role === 'ONG') {
            whereClause = {
                animal: {
                    accountId: usuarioLogado.id,
                },
            };
        } else if (usuarioLogado.role === 'PUBLICO') {
          
            return res.status(403).json({ error: 'Acesso negado para esta listagem.' });
        }
        
        const pedidos = await prisma.pedidoAdocao.findMany({
            where: whereClause,
            include: {
                animal: {
                    include: {
                        account: {
                            select: { nome: true, email: true, telefone: true }
                        }
                    }
                },
                candidato: {
                    select: {
                        id: true,
                        email: true,
                        nome: true,  
                        telefone: true,
                    }
                }
            },
            orderBy: { dataPedido: 'desc' }
        });
        res.status(200).json(pedidos);
    } catch (error) {
        console.error("Erro ao listar pedidos para gerenciamento:", error);
        res.status(500).json({ error: 'Erro interno ao buscar pedidos.' });
    }
};

const atualizarStatusPedido = async (req, res) => {
    const { id: pedidoId } = req.params;
    const { status } = req.body; 
    const { id: gestorId, role } = req.user; 


    try {
        const pedido = await prisma.pedidoAdocao.findUnique({
            where: { id: parseInt(pedidoId) },
            include: { animal: true, candidato: true } 
        });

        if (!pedido) { /* ... */ }

        
        let pedidoAtualizado;
        let mensagemNotificacao;

        if (status === 'APROVADO') {
            const [pAtualizado, aAtualizado] = await prisma.$transaction([
                prisma.pedidoAdocao.update({
                    where: { id: parseInt(pedidoId) },
                    data: { status: 'APROVADO' }
                }),
                prisma.animal.update({
                    where: { id: pedido.animalId },
                    data: { status: 'ADOTADO' }
                })
            ]);
            pedidoAtualizado = pAtualizado;
            mensagemNotificacao = `Parabéns! Seu pedido de adoção para ${pedido.animal.nome} foi APROVADO. Entre em contato com a ONG para os próximos passos.`;
            
        } else { 
            pedidoAtualizado = await prisma.pedidoAdocao.update({
                where: { id: parseInt(pedidoId) },
                data: { status: 'RECUSADO' }
            });
            mensagemNotificacao = `Seu pedido de adoção para ${pedido.animal.nome} foi RECUSADO. Não desista! Há muitos outros animais precisando de um lar.`;
        }

        await criarNotificacao(
            pedido.candidatoId,
            `Pedido de Adoção ${status}`,
            mensagemNotificacao,
            'ADOCAO'
        );
        
        const acaoMsg = status === 'APROVADO' ? 'aprovado com sucesso!' : 'recusado.';
        res.status(200).json({ message: `Pedido ${acaoMsg}`, pedido: pedidoAtualizado });

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