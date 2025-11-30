const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { criarNotificacao } = require('../controller/notificacoesController'); // Se tiver
const { sendEmail } = require('../services/emailService');

// 1. CRIAR PEDIDO (Candidato -> Envia interesse)
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

    // Helper para converter "sim" em true
    const isSim = (val) => val === 'sim' || val === true;

    const novoPedido = await prisma.pedidoAdocao.create({
      data: {
        animalId: parseInt(animalId),
        candidatoId: candidatoId,
        status: 'PENDENTE',
        
        formulario: {
            create: {
                tipoMoradia: respostasFormulario.tipoMoradia || "Não informado",
                possuiQuintal: isSim(respostasFormulario.possuiQuintal),
                quintalTelado: isSim(respostasFormulario.quintalTelado),
                janelasTeladas: isSim(respostasFormulario.janelasTeladas),
                moradiaPropria: isSim(respostasFormulario.moradiaPropria),
                
                pessoasNaCasa: parseInt(respostasFormulario.pessoasNaCasa) || 1,
                todosConcordam: isSim(respostasFormulario.todosConcordam),
                criancasEmCasa: isSim(respostasFormulario.criancasEmCasa),
                alergias: isSim(respostasFormulario.alergias),

                horasSozinho: parseInt(respostasFormulario.horasSozinho) || 0,
                rotinaPasseios: respostasFormulario.rotinaPasseios,
                quemCuidara: respostasFormulario.quemCuidara,

                possuiOutrosAnimais: isSim(respostasFormulario.possuiOutrosAnimais),
                historicoAnimais: respostasFormulario.historicoAnimais, // String (JSON)

                teveAnimaisAntes: isSim(respostasFormulario.teveAnimaisAntes),
                temVeterinario: isSim(respostasFormulario.temVeterinario),

                cienteCustos: isSim(respostasFormulario.cienteCustos),

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

// 2. LISTAR MEUS PEDIDOS (Visão do Candidato)
const listarMeusPedidos = async (req, res) => {
    const candidatoId = req.user.id;

    try {
        const meusPedidos = await prisma.pedidoAdocao.findMany({
            where: { candidatoId: candidatoId },
            include: { 
                animal: {
                    include: {
                        account: { select: { nome: true, telefone: true, email: true } }
                    }
                }
            },
            orderBy: { dataPedido: 'desc' }
        });

        res.status(200).json(meusPedidos);
    } catch (error) {
        console.error("Erro ao listar meus pedidos:", error);
        res.status(500).json({ error: 'Erro interno ao buscar seus pedidos.' });
    }
};

// 3. LISTAR PEDIDOS PARA GERENCIAMENTO (Visão do Dono/ONG/Admin)
// Lista TODOS os pedidos que chegaram para os animais desse usuário
const listarPedidosParaGerenciamento = async (req, res) => {
    const usuarioLogado = req.user;
    let whereClause = {};

    try {
        // Se for ADMIN vê tudo. Se for ONG ou PUBLICO, vê só dos seus animais.
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
                animal: { select: { id: true, nome: true, photoURL: true } },
                candidato: { select: { id: true, nome: true, email: true } }
            },
            orderBy: { dataPedido: 'desc' }
        });
        res.status(200).json(pedidos);
    } catch (error) {
        console.error("Erro ao listar pedidos para gerenciamento:", error);
        res.status(500).json({ error: 'Erro interno ao buscar pedidos.' });
    }
};

// 4. LISTAR PEDIDOS DE UM ANIMAL ESPECÍFICO (Para a tela GerenciarAdocao)
const listarPedidosPorAnimal = async (req, res) => {
    const { animalId } = req.params;
    const userId = req.user.id;

    try {
        const animal = await prisma.animal.findUnique({ where: { id: parseInt(animalId) } });
        
        if (!animal) return res.status(404).json({ error: "Animal não encontrado" });
        
        // Verifica permissão: ADMIN ou DONO do animal (seja ONG ou PUBLICO)
        if (req.user.role !== 'ADMIN' && animal.accountId !== userId) {
            return res.status(403).json({ error: "Acesso negado. Você não é o responsável por este animal." });
        }

        const pedidos = await prisma.pedidoAdocao.findMany({
            where: { animalId: parseInt(animalId) },
            include: {
                formulario: true,
                candidato: {      
                    select: { nome: true, email: true, telefone: true } 
                },
                // Inclui dados do dono apenas para debug se precisar, mas o foco é o candidato
                account: { 
                    select: { nome: true } 
                }
            },
            orderBy: { dataPedido: 'desc' }
        });

        res.status(200).json(pedidos);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erro ao buscar pedidos do animal." });
    }
};

// 5. ATUALIZAR STATUS (Aprovar/Recusar)
const atualizarStatusPedido = async (req, res) => {
    const { id: pedidoId } = req.params;
    const { status } = req.body; 
    const { id: gestorId, role } = req.user; 

    if (!['APROVADO', 'RECUSADO'].includes(status)) {
        return res.status(400).json({ error: "Status inválido." });
    }

    try {
        const pedido = await prisma.pedidoAdocao.findUnique({
            where: { id: parseInt(pedidoId) },
            include: { 
                animal: true, 
                candidato: { select: { email: true, nome: true, id: true } } 
            }
        });

        if (!pedido) return res.status(404).json({ error: 'Pedido não encontrado.' });

        // Verifica permissão: ADMIN ou DONO do animal
        if (role !== 'ADMIN' && pedido.animal.accountId !== gestorId) {
            return res.status(403).json({ error: 'Acesso negado.' });
        }
        
        if (pedido.status !== 'PENDENTE') {
             return res.status(400).json({ error: `Este pedido já foi finalizado.` });
        }

        // Atualiza status do pedido
        await prisma.pedidoAdocao.update({
            where: { id: parseInt(pedidoId) },
            data: { status }
        });

        // Se APROVADO, atualiza o animal para ADOTADO
        if (status === 'APROVADO') {
            await prisma.animal.update({
                where: { id: pedido.animalId },
                data: { status: 'ADOTADO' } // Ajustado para Enum ou String do seu banco
            });
            // Opcional: Recusar automaticamente outros pedidos pendentes deste animal?
        }

        // --- ENVIO DE E-MAIL (Sem Await para não travar) ---
        const assuntoEmail = status === 'APROVADO' 
            ? `Adoção Aprovada: ${pedido.animal.nome} 🐾` 
            : `Atualização sobre a adoção de ${pedido.animal.nome}`;
            
        const corpoEmail = status === 'APROVADO'
            ? `<h2>Parabéns!</h2><p>Seu pedido para <strong>${pedido.animal.nome}</strong> foi aprovado!</p>`
            : `<h2>Olá.</h2><p>Infelizmente seu pedido para <strong>${pedido.animal.nome}</strong> não seguiu adiante.</p>`;

        sendEmail(pedido.candidato.email, assuntoEmail, corpoEmail)
            .catch(err => console.error("Erro ao enviar email de status:", err));

        // --- NOTIFICAÇÃO (Se tiver o sistema) ---
        /*
        await criarNotificacao(
            pedido.candidato.id,
            `Pedido ${status}`,
            `Seu pedido para ${pedido.animal.nome} foi ${status}.`,
            'ADOCAO'
        );
        */
        
        res.status(200).json({ message: `Pedido ${status} com sucesso!` });

    } catch (error) {
        console.error("Erro ao atualizar status:", error);
        res.status(500).json({ error: 'Erro interno ao atualizar.' });
    }
};

module.exports = {
    criarPedido,
    listarMeusPedidos,
    listarPedidosParaGerenciamento,
    listarPedidosPorAnimal,
    atualizarStatusPedido
};