const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { criarNotificacao } = require('../controller/notificacoesController');
const { sendEmail } = require('../services/emailService');

//
// GET ALL
//
const getAll = async (req, res) => {
  const usuarioLogado = req.user;

  try {
    let whereClause = {};

    if (usuarioLogado.role === 'PUBLICO') {
      // O público só vê suas próprias solicitações
      whereClause = { usuarioId: usuarioLogado.id };

    } else if (usuarioLogado.role === 'ONG') {
      // ONG vê:
      // - Todos pendentes
      // - Os que ela mesma aprovou
      whereClause = {
        OR: [
          { status: 'PENDENTE' },
          { aprovadoPorId: usuarioLogado.id }
        ]
      };
    }

    const lares = await prisma.larTemporario.findMany({
      where: whereClause,
      include: {
        usuario: {
          select: { id: true, nome: true, email: true, telefone: true }
        },
        aprovadoPor: {
          select: { id: true, nome: true }
        }
      }
    });

    res.json(lares);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar lares temporários' });
  }
};

//
// GET BY ID
//
const getById = async (req, res) => {
  const { id } = req.params;

  try {
    const lar = await prisma.larTemporario.findUnique({
      where: { id: parseInt(id) },
      include: {
        usuario: {
          select: { id: true, nome: true, email: true, telefone: true }
        },
        aprovadoPor: {
          select: { id: true, nome: true }
        }
      }
    });

    if (!lar) {
      return res.status(404).json({ error: 'Registro não encontrado' });
    }

    res.json(lar);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar lar temporário' });
  }
};

//
// CREATE
//
const create = async (req, res) => {
  try {
    const usuarioLogado = req.user;

    const {
      nomeCompleto,
      cpf,
      email,
      telefone,

      endereco,

      tipoMoradia,
      quintal,
      porteAnimal,
      tipoAnimal,

      outrosAnimais,
      administraMedicamentos,

      levarVeterinario,
      arcarCustos,
      ajudaSuprimentos,

      periodoDisponibilidade,

      declaroVerdade,
      declaroLido
    } = req.body;

    const novoLar = await prisma.larTemporario.create({
      data: {
        usuarioId: usuarioLogado.id,

        nomeCompleto,
        cpf,
        email,
        telefone,

        endereco: endereco ?? {},

        tipoMoradia,
        quintal: !!quintal,
        porteAnimal,
        tipoAnimal,

        outrosAnimais: !!outrosAnimais,
        administraMedicamentos: !!administraMedicamentos,

        levarVeterinario: !!levarVeterinario,
        arcarCustos: !!arcarCustos,
        ajudaSuprimentos: !!ajudaSuprimentos,

        periodoDisponibilidade,

        declaroVerdade: !!declaroVerdade,
        declaroLido: !!declaroLido
      }
    });

    return res.status(201).json(novoLar);

  } catch (error) {
    console.error("ERRO AO CRIAR LAR TEMPORÁRIO:", error);
    return res.status(500).json({ error: "Erro ao registrar lar temporário" });
  }
};

//
// UPDATE STATUS
//
const updateStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const usuarioLogado = req.user;

  if (!['APROVADO', 'REJEITADO'].includes(status)) {
    return res.status(400).json({ error: 'Status inválido. Use APROVADO ou REJEITADO.' });
  }

  try {
    const lar = await prisma.larTemporario.findUnique({
      where: { id: parseInt(id) },
      include: { usuario: true }
    });

    if (!lar) return res.status(404).json({ error: 'Registro não encontrado' });

    if (usuarioLogado.role !== 'ONG' && usuarioLogado.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Apenas ONGs ou ADMIN podem aprovar/rejeitar.' });
    }

    const larAtualizado = await prisma.larTemporario.update({
      where: { id: parseInt(id) },
      data: {
        status,
        aprovadoPorId: usuarioLogado.id
      }
    });

    // Notificação
    const acao = status === 'APROVADO' ? 'aprovado' : 'rejeitado';
    const mensagem = `Seu pedido de lar temporário foi ${acao}.`;

    await criarNotificacao(
      lar.usuarioId,
      `Status do Lar Temporário: ${status}`,
      mensagem,
      'LAR_TEMPORARIO'
    );

    // E-mail
    const htmlEmail = `
        <h2>Olá, ${lar.usuario.nome}.</h2>
        <p>O status da sua candidatura de Lar Temporário foi atualizado para: <strong>${status}</strong>.</p>
        <p>Acesse o sistema para mais detalhes.</p>
    `;

    sendEmail(lar.usuario.email, `Atualização do Lar Temporário: ${status}`, htmlEmail);

    res.json(larAtualizado);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao atualizar status' });
  }
};

//
// DELETE
//
const remove = async (req, res) => {
  const { id } = req.params;
  const usuarioLogado = req.user;

  try {
    const lar = await prisma.larTemporario.findUnique({
      where: { id: parseInt(id) }
    });

    if (!lar) return res.status(404).json({ error: 'Registro não encontrado' });

    // Quem pode deletar?
    const pode =
      usuarioLogado.role === 'ADMIN' ||
      lar.usuarioId === usuarioLogado.id ||
      lar.aprovadoPorId === usuarioLogado.id;

    if (!pode) {
      return res.status(403).json({ error: 'Acesso negado.' });
    }

    await prisma.larTemporario.delete({
      where: { id: parseInt(id) }
    });

    res.status(204).send();

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao cancelar lar temporário' });
  }
};

module.exports = {
  getAll,
  getById,
  create,
  updateStatus,
  remove
};
