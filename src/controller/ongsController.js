const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = new PrismaClient();


// Atualizar ONG
const updateOng = async (req, res) => {
  const ongIdToUpdate = parseInt(req.params.id);
  const loggedInUser = req.user; 

  if (loggedInUser.role !== 'ADMIN' && loggedInUser.id !== ongIdToUpdate) {
        return res.status(403).json({ error: 'Acesso negado.' });
    }

   const { email, nome, telefone, cnpj, descricao, endereco } = req.body;

    try {
        // Usamos uma transação para garantir que ambas as atualizações ocorram
        const [updatedAccount, updatedOng] = await prisma.$transaction([
            prisma.account.update({
                where: { id: ongIdToUpdate },
                data: { email, nome, telefone }
            }),
            prisma.ong.update({
                where: { id: ongIdToUpdate },
                data: { nome, cnpj, descricao, endereco }
            })
        ]);

        delete updatedAccount.password;
        res.json({ message: 'ONG atualizada com sucesso!', account: updatedAccount, ong: updatedOng });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao atualizar ONG' });
    }
};




// Buscar ONG por ID
const getOngById = async (req, res) => {
  const { id } = req.params;

  try {
    const ong = await prisma.ong.findUnique({
      where: { id: parseInt(id) },
       include: {
       account: {
        select: {
            id: true,
            email: true,
            nome: true,
            telefone: true,
            role: true
        }
    }
}
    });

    if (!ong) return res.status(404).json({ error: 'ONG não encontrada' });
    res.json(ong);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar ONG' });
  }
};

// Buscar animais ONG
const getAnimaisByOng = async (req, res) => {
  const { id } = req.params;

  try {
     const animais = await prisma.animal.findMany({
      where: { accountId: parseInt(id) }, 
    });
    

    if (animais.length === 0) return res.status(404).json({ error: 'Nenhum animal encontrado para essa ONG' });
    res.json(animais);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar animais da ONG' });
  }
};

const getAllOngs = async (req, res) => {
  try {
    const ongs = await prisma.ong.findMany({ 
include: {
    account: {
        select: {
            id: true,
            email: true,
            nome: true,
            telefone: true,
            role: true
        }
      }

    }
 });

 res.json(ongs);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar ONGs' });
  }
};


const atualizarDadosOng = async (req, res) => {
    const { cnpj, descricao, nome} = req.body; 
    const userId = req.user.id; 

    // Apenas ONG pode usar esta rota
    if (req.user.role !== 'ONG') {
        return res.status(403).json({ error: 'Acesso negado. Apenas ONGs podem atualizar este perfil.' });
    }

    try {
        const dadosOngParaAtualizar = {};
        if (cnpj) dadosOngParaAtualizar.cnpj = cnpj;
        if (descricao) dadosOngParaAtualizar.descricao = descricao;
        if (nome) dadosOngParaAtualizar.nome = nomeFantasia; 

        if (Object.keys(dadosOngParaAtualizar).length === 0) {
            return res.status(400).json({ error: 'Nenhum dado de ONG para atualizar foi fornecido.' });
        }

        const updatedOng = await prisma.ong.update({
            where: { id: userId }, // O ID da ONG é o mesmo ID da Account
            data: dadosOngParaAtualizar,
            select: { nome: true, cnpj: true, descricao: true }
        });

        res.json({ message: "Dados da ONG atualizados com sucesso", ong: updatedOng });
        
    } catch (err) {
        console.error(err);
        if (err.code === 'P2002') {
             return res.status(400).json({ error: 'O CNPJ já está em uso por outra entidade.' });
        }
        res.status(500).json({ error: 'Erro ao atualizar dados da ONG.' });
    }
};
module.exports = {
  getAllOngs,
  getOngById,
  getAnimaisByOng,
  updateOng,
  atualizarDadosOng
};
