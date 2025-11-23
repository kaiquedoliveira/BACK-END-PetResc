const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { criarNotificacao } = require('../controller/notificacoesController');
 const { sendEmail } = require('../services/emailService');

// GET padrao
const getAll = async (req, res) => {
 const usuarioLogado = req.user;

  try {
    let  whereClause = {};
    if ( usuarioLogado.role === 'PUBLICO') {
      whereClause = { usuarioId: usuarioLogado.id }; // Público vê só os seus
    } else if (usuarioLogado.role === 'ONG') {
      whereClause = { ongId: usuarioLogado.id }; // ONG vê só os dela
    }
      const lares = await prisma.larTemporario.findMany({
      where: whereClause,
      include: {
    animal: true, 
    usuario: { 
        select: { id: true, nome: true, email: true, telefone: true }
    },
    ong: { 
        select: { id: true, nome: true }
    }
}
    });
    res.json(lares);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar lares temporários' });
  }
};

// GET larTemporario id
const getById = async (req, res) => {
  const { id } = req.params;
  try {
    const lar = await prisma.larTemporario.findUnique({
      where: { id: parseInt(id) },
     include: {
    animal: true, 
    usuario: { 
        select: { id: true, nome: true, email: true, telefone: true }
    },
    ong: { 
        select: { id: true, nome: true }
    }
}
    });
    if (!lar) {
      return res.status(404).json({ error: 'Registro não encontrado' });
    }
    res.json(lar);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar lar temporário' });
  }
};

// POST 
const create = async (req, res) => {
    const usuarioLogado = req.user;
    const { animalId, ongId, ...dadosDoFormulario } = req.body;

    try {
        // Usamos o ID do crachá (token) para pegar todos os dados do Account no banco.
        const fullUserAccount = await prisma.account.findUnique({
            where: { id: usuarioLogado.id },
        });

        if (!fullUserAccount) {
            return res.status(404).json({ error: 'Conta de usuário não encontrada.' });
        }

        if (!dadosDoFormulario.periodoDisponibilidade) {
            return res.status(400).json({ error: 'O período de disponibilidade é obrigatório.' });
        }

        let ongIdFinal;
        if (animalId) {
            const animal = await prisma.animal.findUnique({ where: { id: parseInt(animalId) } });
            if (!animal) return res.status(404).json({ error: 'Animal não encontrado.' });
            ongIdFinal = animal.accountId;
        } else if (ongId) {
            ongIdFinal = parseInt(ongId);
        } else {
            return res.status(400).json({ error: 'É necessário especificar um animalId ou uma ongId.' });
        }
        
        const novoLar = await prisma.larTemporario.create({
            data: {
                ...dadosDoFormulario, 
                dataNascimento: new Date(dadosDoFormulario.dataNascimento),
                usuarioId: usuarioLogado.id,
                ongId: ongIdFinal,
                animalId: animalId ? parseInt(animalId) : null,
                nomeCompleto: fullUserAccount.nome,
                cpf: fullUserAccount.cpf,
                email: fullUserAccount.email,
                telefone: fullUserAccount.telefone,
            }
        });
        res.status(201).json(novoLar);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao registrar interesse em lar temporário' });
    }
};
// PUT por id
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
            include: { usuario: true, animal: true } 
        });
        
        if (!lar) return res.status(404).json({ error: 'Registro não encontrado' });
        
        if (usuarioLogado.role !== 'ADMIN' && lar.ongId !== usuarioLogado.id) {
            return res.status(403).json({ error: 'Acesso negado. Permissão insuficiente.' });
        }
        
        const larAtualizado = await prisma.larTemporario.update({ 
            where: { id: parseInt(id) }, 
            data: { 
                status,
                aprovadoPorId: usuarioLogado.id
            } 
        });

        const acao = status === 'APROVADO' ? 'aprovado' : 'rejeitado';
        const animalNome = lar.animal?.nome || 'o animal';
        
        const titulo = `Status do Lar Temporário: ${status}`;
        const mensagem = `Seu pedido de lar temporário para ${animalNome} foi ${acao}.`;
        await criarNotificacao(lar.usuarioId, titulo, mensagem, 'LAR_TEMPORARIO'); 
        
        const assuntoEmail = `Atualização Lar Temporário: ${status}`;
        const htmlEmail = `
            <h2>Olá, ${lar.usuario.nome}.</h2>
            <p>O status da sua candidatura de Lar Temporário para <strong>${animalNome}</strong> foi atualizado para: <strong>${status}</strong>.</p>
            <p>Acesse o aplicativo para mais detalhes.</p>
        `;
        
        sendEmail(lar.usuario.email, assuntoEmail, htmlEmail);
        
        res.json(larAtualizado);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao atualizar status' });
    }
};
// DELETE por id
const remove = async (req, res) => {
    const { id } = req.params;
    const usuarioLogado = req.user; 
    try {
        const lar = await prisma.larTemporario.findUnique({ where: { id: parseInt(id) } });
        if (!lar) return res.status(404).json({ error: 'Registro não encontrado' });

        if (usuarioLogado.role !== 'ADMIN' && lar.usuarioId !== usuarioLogado.id && lar.ongId !== usuarioLogado.id) {
             return res.status(403).json({ error: 'Acesso negado.' });
        }

        await prisma.larTemporario.delete({ where: { id: parseInt(id) } });
        res.status(204).send();
    } catch (err) {
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