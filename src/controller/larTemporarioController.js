const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET padrao
const getAll = async (req, res) => {
 const usuarioLogado = req.user;

  try {
    let  whereClause = {};
    if ( usuarioLogado.role === 'PUBLICO') {
      whereClause = { usuarioId: usuarioLogado.id };
    } else if (usuarioLogado.role === 'ONG') {
      whereClause = { ongId: usuarioLogado.id };

    }
      const lares = await prisma.larTemporario.findMany({
      where: whereClause,
      include: { usuario: true, ong: true, animal: true }
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
      include: { usuario: true, ong: true, animal: true }
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
   const usuarioLogado = req.account; 
  const { animalId, ongId, ...formData } = req.body;


        try {
            const usuarioLogado = req.account; 
            const { animalId, ongId, ...formData } = req.body;  

           if (!formData.nomeCompleto || !formData.cpf) {
            return res.status(400).json({ error: 'Nome completo e CPF são obrigatórios.' });
        }
              let ongIdFinal;

              if (animalId) { 
                  const animal = await prisma.animal.findUnique({ where: { id: parseInt(animalId) } });
            
            if (!animal) {
                return res.status(404).json({ error: 'Animal especificado não foi encontrado.' });
            }

            ongIdFinal = animal.accountId; 
        } else if (ongId) {

           ongIdFinal = parseInt(ongId);
        } else {
            return res.status(400).json({ error: 'É necessário especificar um animalId ou uma ongId.' });
        }

           const novoLar = await prisma.larTemporario.create({
            data: {
                ...formData, 
                dataNascimento: new Date(formData.dataNascimento),
                
                usuarioId: usuarioLogado.id, 
                ongId: ongIdFinal, 
                animalId: animalId ? parseInt(animalId) : null,
            }
        });

        res.status(201).json(novoLar);
  
    res.status(201).json(novoLar);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao registrar interesse em lar temporário' });
  }
};

// PUT por id
const updateStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const usuarioLogado = req.account;
    try {
        const lar = await prisma.larTemporario.findUnique({ where: { id: parseInt(id) } });
        if (!lar) return res.status(404).json({ error: 'Registro não encontrado' });
        
        if (usuarioLogado.role !== 'ADMIN' && lar.ongId !== usuarioLogado.id) {
            return res.status(403).json({ error: 'Acesso negado. Permissão insuficiente.' });
        }
        
        const larAtualizado = await prisma.larTemporario.update({ where: { id: parseInt(id) }, data: { status } });
        res.json(larAtualizado);
    } catch (err) {
        res.status(500).json({ error: 'Erro ao atualizar status' });
    }
};

// DELETE por id
const remove = async (req, res) => {
    const { id } = req.params;
    const usuarioLogado = req.account; 
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