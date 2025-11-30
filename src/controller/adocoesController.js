const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { sendEmail } = require('../services/emailService');

// Helper para converter string "sim"/"nao" em Boolean
const toBool = (value) => {
    if (typeof value === 'boolean') return value;
    return value === 'sim';
};

// Helper para converter string para Int com segurança
const toInt = (value) => {
    const parsed = parseInt(value);
    return isNaN(parsed) ? 0 : parsed;
};

// 1. CRIAR PEDIDO
const criarPedido = async (req, res) => {
  const { animalId, respostasFormulario } = req.body; 
  const candidatoId = req.user.id;

  if (!animalId || !respostasFormulario) {
    return res.status(400).json({ error: "Dados incompletos." });
  }

  try {
    const animal = await prisma.animal.findUnique({ where: { id: parseInt(animalId) } });
    if (!animal) return res.status(404).json({ error: "Animal não encontrado." });

    if (animal.accountId === candidatoId) {
      return res.status(400).json({ error: "Você não pode adotar seu próprio animal." });
    }

    const pedidoExistente = await prisma.pedidoAdocao.findFirst({
        where: { animalId: parseInt(animalId), candidatoId: candidatoId, status: 'PENDENTE' }
    });

    if (pedidoExistente) {
        return res.status(400).json({ error: "Já existe um pedido pendente." });
    }

    // CRIAÇÃO COM CONVERSÃO DE TIPOS
    const novoPedido = await prisma.pedidoAdocao.create({
      data: {
        animalId: parseInt(animalId),
        candidatoId: candidatoId,
        status: 'PENDENTE',
        
        formulario: {
            create: {
                tipoMoradia: respostasFormulario.tipoMoradia || "Não informado",
                
                // Convertendo Strings para Booleanos
                possuiQuintal: toBool(respostasFormulario.possuiQuintal),
                quintalTelado: toBool(respostasFormulario.quintalTelado),
                janelasTeladas: toBool(respostasFormulario.janelasTeladas),
                moradiaPropria: toBool(respostasFormulario.moradiaPropria),
                todosConcordam: toBool(respostasFormulario.todosConcordam),
                criancasEmCasa: toBool(respostasFormulario.criancasEmCasa),
                alergias: toBool(respostasFormulario.alergias),
                possuiOutrosAnimais: toBool(respostasFormulario.possuiOutrosAnimais),
                teveAnimaisAntes: toBool(respostasFormulario.teveAnimaisAntes),
                temVeterinario: toBool(respostasFormulario.temVeterinario),
                cienteCustos: toBool(respostasFormulario.cienteCustos),

                // Convertendo Strings para Int
                pessoasNaCasa: toInt(respostasFormulario.pessoasNaCasa),
                horasSozinho: toInt(respostasFormulario.horasSozinho),

                // Strings diretas
                rotinaPasseios: respostasFormulario.rotinaPasseios,
                quemCuidara: respostasFormulario.quemCuidara,
                historicoAnimais: respostasFormulario.historicoAnimais, // JSON String
                motivoAdocao: respostasFormulario.motivoAdocao,
                observacoes: respostasFormulario.observacoes
            }
        }
      },
      include: { formulario: true }
    });

    res.status(201).json({ message: "Pedido enviado!", pedido: novoPedido });

  } catch (error) {
    console.error("Erro criar pedido:", error);
    res.status(500).json({ error: "Erro interno." });
  }
};

// 2. MEUS PEDIDOS (Candidato)
const listarMeusPedidos = async (req, res) => {
    const candidatoId = req.user.id;
    try {
        const meusPedidos = await prisma.pedidoAdocao.findMany({
            where: { candidatoId: candidatoId },
            include: { 
                animal: {
                    include: {
                        // Inclui dados do dono do animal para contato
                        account: { select: { nome: true, telefone: true, email: true } }
                    }
                }
            },
            orderBy: { dataPedido: 'desc' }
        });
        res.status(200).json(meusPedidos);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar pedidos.' });
    }
};

// 3. LISTAR TODOS OS PEDIDOS (Geral do Dashboard)
const listarPedidosParaGerenciamento = async (req, res) => {
    const usuarioLogado = req.user;
    let whereClause = {};

    try {
        if (usuarioLogado.role !== 'ADMIN') {
            whereClause = { animal: { accountId: usuarioLogado.id } };
        }
        
        const pedidos = await prisma.pedidoAdocao.findMany({
            where: whereClause,
            include: {
                animal: { select: { id: true, nome: true, photoURL: true } },
                account: { select: { id: true, nome: true, email: true } } // Correção: 'account'
            },
            orderBy: { dataPedido: 'desc' }
        });
        res.status(200).json(pedidos);
    } catch (error) {
        res.status(500).json({ error: 'Erro interno.' });
    }
};

// 4. LISTAR PEDIDOS DE UM ANIMAL (Tela GerenciarAdocao)
const listarPedidosPorAnimal = async (req, res) => {
    const { animalId } = req.params;
    const userId = req.user.id;

    try {
        const animal = await prisma.animal.findUnique({ where: { id: parseInt(animalId) } });
        
        if (!animal) return res.status(404).json({ error: "Animal não encontrado" });
        
        // Permite se for ADMIN ou se for o DONO (ONG ou PUBLICO)
        if (req.user.role !== 'ADMIN' && animal.accountId !== userId) {
            return res.status(403).json({ error: "Sem permissão." });
        }

        const pedidos = await prisma.pedidoAdocao.findMany({
            where: { animalId: parseInt(animalId) },
            include: {
                formulario: true,
                // CORREÇÃO CRÍTICA: O nome da relação no schema é 'account'
                account: {      
                    select: { nome: true, email: true, telefone: true } 
                }
            },
            orderBy: { dataPedido: 'desc' }
        });

        res.status(200).json(pedidos);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erro ao buscar candidatos." });
    }
};

// 5. ATUALIZAR STATUS
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
                account: { select: { email: true, nome: true } } // Correção: 'account'
            }
        });

        if (!pedido) return res.status(404).json({ error: 'Pedido não encontrado.' });

        if (role !== 'ADMIN' && pedido.animal.accountId !== gestorId) {
            return res.status(403).json({ error: 'Acesso negado.' });
        }
        
        // Atualiza Pedido
        await prisma.pedidoAdocao.update({
            where: { id: parseInt(pedidoId) },
            data: { status }
        });

        // Se APROVADO, muda status do animal
        if (status === 'APROVADO') {
            await prisma.animal.update({
                where: { id: pedido.animalId },
                // Certifique-se de adicionar 'ADOTADO' no Enum do Schema, senão use 'ENCONTRADO'
                data: { status: 'ADOTADO' } 
            });
        }

        // Email (Assíncrono)
        const assunto = status === 'APROVADO' ? 'Adoção Aprovada! 🎉' : 'Atualização do Pedido';
        const msg = status === 'APROVADO' 
            ? `<p>Parabéns ${pedido.account.nome}, seu pedido foi aprovado!</p>`
            : `<p>Olá ${pedido.account.nome}, infelizmente seu pedido não foi aceito desta vez.</p>`;

        sendEmail(pedido.account.email, assunto, msg)
            .catch(e => console.error("Erro email:", e));
        
        res.status(200).json({ message: `Pedido ${status}!` });

    } catch (error) {
        console.error("Erro update status:", error);
        res.status(500).json({ error: 'Erro interno.' });
    }
};

module.exports = {
    criarPedido,
    listarMeusPedidos,
    listarPedidosParaGerenciamento,
    listarPedidosPorAnimal,
    atualizarStatusPedido
};
