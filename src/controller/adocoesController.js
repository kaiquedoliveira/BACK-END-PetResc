const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.criar = async (req, res) => {
  const { animalId } = req.body;
  const usuarioLogado = req.account; 

  if (!animalId) {
    return res.status(400).json({ error: 'O ID do animal é obrigatório.' });
  }

  try {
    // Garante que o usuário logado é quem está fazendo o pedido
    const novoPedido = await prisma.adocao.create({
      data: {
        usuarioId: usuarioLogado.id, 
        animalId: parseInt(animalId),
        status: 'EM_ANALISE'
      },
      include: { 
        usuario: { select: { publico: true } }, 
        animal: { include: { ong: true } }
      }
    });

    res.status(201).json(novoPedido);
  } catch (err) {
    if (err.code === 'P2003') {
        return res.status(404).json({ error: 'Animal não encontrado.' });
    }
    console.error(err);
    res.status(500).json({ error: 'Erro ao solicitar adoção.' });
  }
};

exports.listarTodos = async (req, res) => {
  const usuarioLogado = req.account;

  try {
    let whereClause = {};

    if (usuarioLogado.role === 'ONG') {
      const ong = await prisma.ong.findUnique({ where: { accountId: usuarioLogado.id } });
      if (!ong) return res.status(403).json({ error: 'Perfil de ONG não encontrado.' });
      
      // Filtra para mostrar apenas adoções de animais pertencentes a esta ONG
      whereClause = { animal: { ongId: ong.id } };

    } else if (usuarioLogado.role === 'PUBLICO') {
      return res.status(403).json({ error: 'Acesso negado. Use a rota /adocoes/meus-pedidos para ver suas solicitações.' });
    }
    // Se for ADMIN, whereClause continua vazio {}, trazendo tudo.

    const adocoes = await prisma.adocao.findMany({
      where: whereClause,
      include: { 
        usuario: { select: { publico: true } }, 
        animal: { include: { ong: true } }
      }
    });
    res.json(adocoes);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar pedidos de adoção.' });
  }
};

// Lista os pedidos de adoção feitos pelo próprio usuário.
 
exports.listarMinhasAdocoes = async (req, res) => {
    const usuarioLogado = req.account;
    try {
        const adocoes = await prisma.adocao.findMany({
            where: { usuarioId: usuarioLogado.id },
            include: {
                animal: { include: { ong: true } }
            }
        });
        res.json(adocoes);
    } catch (err) {
        res.status(500).json({ error: 'Erro ao buscar seus pedidos de adoção.' });
    }
};



exports.listarPorId = async (req, res) => {
  const { id } = req.params;
  const usuarioLogado = req.account;

  try {
    const adocao = await prisma.adocao.findUnique({
      where: { id: parseInt(id) },
      include: { 
        usuario: { select: { publico: true } }, 
        animal: { include: { ong: true } }
      }
    });

    if (!adocao) {
      return res.status(404).json({ error: 'Pedido de adoção não encontrado.' });
    }

    let temPermissao = false;
    if (usuarioLogado.role === 'ADMIN' || adocao.usuarioId === usuarioLogado.id) {
        temPermissao = true;
    } else if (usuarioLogado.role === 'ONG') {
        const ong = await prisma.ong.findUnique({ where: { accountId: usuarioLogado.id } });
        if (ong && adocao.animal.ongId === ong.id) {
            temPermissao = true;
        }
    }
    
    if (!temPermissao) {
        return res.status(403).json({ error: 'Acesso negado.' });
    }

    res.json(adocao);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar pedido de adoção.' });
  }
};


 //Atualiza o status de um pedido (APROVADO, REJEITADO).
 
exports.atualizar = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const usuarioLogado = req.account;

  const statusValidos = ['EM_ANALISE', 'APROVADO', 'REJEITADO'];
  if (!status || !statusValidos.includes(status)) {
    return res.status(400).json({ error: 'Status inválido. Valores permitidos: EM_ANALISE, APROVADO, REJEITADO.' });
  }

  try {
    const adocao = await prisma.adocao.findUnique({
        where: { id: parseInt(id) },
        include: { animal: true }
    });

    if (!adocao) return res.status(404).json({ error: 'Pedido de adoção não encontrado.' });
    
    // Apenas ADMIN ou a ONG dona do animal podem mudar o status.
    let temPermissao = false;
    if (usuarioLogado.role === 'ADMIN') {
        temPermissao = true;
    } else if (usuarioLogado.role === 'ONG') {
        const ong = await prisma.ong.findUnique({ where: { accountId: usuarioLogado.id } });
        if (ong && adocao.animal.ongId === ong.id) {
            temPermissao = true;
        }
    }

    if (!temPermissao) {
        return res.status(403).json({ error: 'Acesso negado. Apenas a ONG responsável ou um administrador podem alterar o status.' });
    }

    const pedidoAtualizado = await prisma.adocao.update({
      where: { id: parseInt(id) },
      data: { status },
      include: { usuario: { select: { publico: true } }, animal: true }
    });

    res.json(pedidoAtualizado);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar pedido de adoção.' });
  }
};


exports.deletar = async (req, res) => {
  const { id } = req.params;
  const usuarioLogado = req.account;
  try {
    const adocao = await prisma.adocao.findUnique({
        where: { id: parseInt(id) },
        include: { animal: true }
    });
    
    if (!adocao) return res.status(404).json({ error: 'Pedido de adoção não encontrado.' });
    
    let temPermissao = false;
    if (usuarioLogado.role === 'ADMIN' || adocao.usuarioId === usuarioLogado.id) {
        temPermissao = true;
    } else if (usuarioLogado.role === 'ONG') {
        const ong = await prisma.ong.findUnique({ where: { accountId: usuarioLogado.id } });
        if (ong && adocao.animal.ongId === ong.id) {
            temPermissao = true;
        }
    }

    if (!temPermissao) {
        return res.status(403).json({ error: 'Acesso negado.' });
    }

    await prisma.adocao.delete({ where: { id: parseInt(id) } });
    res.status(200).json({ message: 'Pedido de adoção cancelado com sucesso.' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao cancelar pedido de adoção.' });
  }
};