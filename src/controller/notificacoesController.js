const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const criarNotificacao = async (accountId, titulo, mensagem, tipo = 'GERAL') => {
    if (!accountId || !titulo || !mensagem) {
        // Loga o erro, mas não quebra a operação principal
        console.error("Dados incompletos para criar notificação.");
        return; 
    }

    try {
        await prisma.notificacao.create({
            data: {
                accountId,
                titulo,
                mensagem,
                tipo,
            },
        });
        
    } catch (error) {
        // A falha na notificação não deve parar o processo que a chamou
        console.error(`Falha ao criar notificação para Account ${accountId}:`, error);
    }
};



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
  criarNotificacao
};