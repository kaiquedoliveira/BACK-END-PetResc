const prisma = require('../lib/prisma');

//Listar Notificações do Usuário Logado
const listarNotificacoes = async (req, res) => {
  try {
    const notificacoes = await prisma.notificacao.findMany({
      where: {
        accountId: req.user.id, 
      },
      orderBy: {
        dataCriacao: 'desc',
      },
    });

    return res.status(200).json(notificacoes);

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao buscar notificações.' });
  }
};

const marcarComoLida = async (req, res) => {
  const { id } = req.params;

  try {
    const notificacao = await prisma.notificacao.findUnique({
      where: { id },
    });

    if (!notificacao) {
      return res.status(404).json({ error: 'Notificação não encontrada.' });
    }

    if (notificacao.accountId !== req.user.id) {
      return res.status(403).json({ error: 'Você não tem permissão para alterar esta notificação.' });
    }

    const notificacaoAtualizada = await prisma.notificacao.update({
      where: { id },
      data: { lida: true },
    });

    return res.status(200).json(notificacaoAtualizada);

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao marcar notificação como lida.' });
  }
};

module.exports = {
  listarNotificacoes,
  marcarComoLida,
};