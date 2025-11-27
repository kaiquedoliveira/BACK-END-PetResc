const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { criarNotificacao } = require('../controller/notificacoesController');
const { sendEmail } = require('../services/emailService');
const criarPedido = async (req, res) => {
  const { animalId, respostasFormulario } = req.body; 
  const candidatoId = req.user.id;

  if (!animalId || !respostasFormulario) {
    return res.status(400).json({ error: "Dados incompletos para o pedido." });
  }

  try {
    const animal = await prisma.animal.findUnique({ where: { id: parseInt(animalId) } });
    if (!animal) return res.status(404).json({ error: "Animal não encontrado." });

    if (animal.accountId === candidatoId) {
      return res.status(400).json({ error: "Você não pode adotar seu próprio animal." });
    }

    const pedidoExistente = await prisma.pedidoAdocao.findFirst({
        where: {
            animalId: parseInt(animalId),
            candidatoId: candidatoId,
            status: 'PENDENTE'
        }
    });

    if (pedidoExistente) {
        return res.status(400).json({ error: "Você já tem um pedido pendente para este animal." });
    }

    const novoPedido = await prisma.pedidoAdocao.create({
      data: {
        animalId: parseInt(animalId),
        candidatoId: candidatoId,
        status: 'PENDENTE',
        
        formulario: {
            create: {
                tipoMoradia: respostasFormulario.tipoMoradia,
                possuiQuintal: respostasFormulario.possuiQuintal === 'sim', // Tratamento de booleano se vier string
                quintalTelado: respostasFormulario.quintalTelado === 'sim',
                janelasTeladas: respostasFormulario.janelasTeladas === 'sim',
                moradiaPropria: respostasFormulario.moradiaPropria === 'sim',
                
                pessoasNaCasa: parseInt(respostasFormulario.pessoasNaCasa),
                todosConcordam: respostasFormulario.todosConcordam === 'sim',
                criancasEmCasa: respostasFormulario.criancasEmCasa === 'sim',
                alergias: respostasFormulario.alergias === 'sim',

                horasSozinho: parseInt(respostasFormulario.horasSozinho),
                rotinaPasseios: respostasFormulario.rotinaPasseios,
                quemCuidara: respostasFormulario.quemCuidara,

                possuiOutrosAnimais: respostasFormulario.possuiOutrosAnimais === 'sim',
                historicoAnimais: respostasFormulario.historicoAnimais,

                teveAnimaisAntes: respostasFormulario.teveAnimaisAntes === 'sim',
                temVeterinario: respostasFormulario.temVeterinario === 'sim',

                cienteCustos: respostasFormulario.cienteCustos === 'sim',

                motivoAdocao: respostasFormulario.motivoAdocao,
                observacoes: respostasFormulario.observacoes
            }
        }
      },
      include: {
        formulario: true 
      }
    });

    res.status(201).json({ message: "Pedido enviado com sucesso!", pedido: novoPedido });

  } catch (error) {
    console.error("Erro ao criar pedido de adoção:", error);
    res.status(500).json({ error: "Erro interno ao processar adoção." });
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