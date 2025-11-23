const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { criarNotificacao } = require('../controller/notificacoesController');
const { sendEmail } = require('../services/emailService');

const criarPedido = async (req, res) => {
    const { animalId } = req.body;
    const candidatoId = req.user.id; 
    const usuarioLogado = req.user;

    if (!animalId) return res.status(400).json({ error: 'O ID do animal é obrigatório.' });

    try {
        const animal = await prisma.animal.findUnique({ 
            where: { id: animalId },
            include: { account: { select: { nome: true } } } 
        });
        
        if (!animal) return res.status(404).json({ error: 'Animal não encontrado.' });
        if (animal.status !== 'DISPONIVEL') return res.status(400).json({ error: 'Indisponível.' });

        const pedidoExistente = await prisma.pedidoAdocao.findFirst({
            where: { animalId: animalId, candidatoId: candidatoId },
        });
        if (pedidoExistente) return res.status(400).json({ error: 'Pedido já realizado.' });
        
        const novoPedido = await prisma.pedidoAdocao.create({
            data: { animalId, candidatoId },
            include: { animal: true },
        });

        const emailCandidato = (await prisma.account.findUnique({ where: { id: candidatoId } })).email;
        
        const assunto = `Pedido Recebido: ${animal.nome} 🐶`;
        const mensagem = `
            <h2>Olá, ${usuarioLogado.name}!</h2>
            <p>Recebemos seu interesse em adotar o(a) <strong>${animal.nome}</strong>.</p>
            <p><strong>Próximo Passo:</strong> A ONG/Responsável (${animal.account.nome}) irá entrar em contato com você via <strong>WhatsApp</strong> para uma breve conversa/entrevista.</p>
            <p>Fique atento ao seu telefone!</p>
        `;

        sendEmail(emailCandidato, assunto, mensagem);

        res.status(201).json(novoPedido);
    } catch (error) {
        console.error("Erro ao criar pedido:", error);
        res.status(500).json({ error: 'Erro interno.' });
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
        if (usuarioLogado.role !== 'ADMIN') {
            whereClause = {
                animal: {
                    accountId: usuarioLogado.id, 
                },
            };
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

    if (!['APROVADO', 'RECUSADO'].includes(status)) {
        return res.status(400).json({ error: "Status inválido. Use 'APROVADO' ou 'RECUSADO'." });
    }

    try {
        const pedido = await prisma.pedidoAdocao.findUnique({
            where: { id: parseInt(pedidoId) },
            include: { 
                animal: true, 
                candidato: { select: { email: true, nome: true } } 
            }
        });

        if (!pedido) {
            return res.status(404).json({ error: 'Pedido não encontrado.' });
        }

        if (role !== 'ADMIN' && pedido.animal.accountId !== gestorId) {
            return res.status(403).json({ error: 'Acesso negado. Você não tem permissão para gerenciar este pedido.' });
        }
        
        if (pedido.status !== 'PENDENTE') {
             return res.status(400).json({ error: `Este pedido já foi ${pedido.status.toLowerCase()}.` });
        }


        let mensagemNotificacao;
        let assuntoEmail;
        let corpoEmail;

        if (status === 'APROVADO') {
            await prisma.$transaction([
                prisma.pedidoAdocao.update({
                    where: { id: parseInt(pedidoId) },
                    data: { status: 'APROVADO' }
                }),
                prisma.animal.update({
                    where: { id: pedido.animalId },
                    data: { status: 'ADOTADO' } 
                })
            ]);

            mensagemNotificacao = `Parabéns! Seu pedido de adoção para ${pedido.animal.nome} foi APROVADO.`;
            
            assuntoEmail = `Adoção Aprovada: ${pedido.animal.nome} é seu! 🐾`;
            corpoEmail = `
                <h2>Parabéns, ${pedido.candidato.nome}!</h2>
                <p>Temos uma ótima notícia: Seu pedido de adoção para o animal <strong>${pedido.animal.nome}</strong> foi <strong>APROVADO</strong>!</p>
                <p>A ONG entrará em contato em breve pelo seu telefone para combinar a retirada.</p>
                <p>Obrigado por adotar!</p>
            `;
            
        } else { 
            await prisma.pedidoAdocao.update({
                where: { id: parseInt(pedidoId) },
                data: { status: 'RECUSADO' }
            });

            mensagemNotificacao = `Seu pedido de adoção para ${pedido.animal.nome} foi RECUSADO.`;
            
            assuntoEmail = `Atualização sobre a adoção de ${pedido.animal.nome}`;
            corpoEmail = `
                <h2>Olá, ${pedido.candidato.nome}.</h2>
                <p>Infelizmente, seu pedido de adoção para o animal <strong>${pedido.animal.nome}</strong> não pôde ser aprovado neste momento.</p>
                <p>Não desanime! Existem muitos outros animais na plataforma esperando por um lar.</p>
            `;
        }

        sendEmail(pedido.candidato.email, assuntoEmail, corpoEmail);

        await criarNotificacao(
            pedido.candidatoId,
            `Pedido de Adoção ${status}`,
            mensagemNotificacao,
            'ADOCAO'
        );
        
        res.status(200).json({ message: `Pedido ${status.toLowerCase()} com sucesso!` });

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