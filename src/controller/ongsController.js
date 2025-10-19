const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = new PrismaClient();

// cadastro
const registerOng = async (req, res) => {
    const { email, password, name, cnpj, descricao, endereco } = req.body;

    if (!email || !password || !name || !cnpj) {
        return res.status(400).json({ error: 'Preencha todos os campos obrigatórios' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        const novaConta = await prisma.account.create({
            data: {
                email,
                password: hashedPassword,
                role: 'ONG',
                ong: { 
                    create: {
                        nome: name,
                        cnpj,
                        descricao,
                        endereco
                    }
                }
            },
            include: { 
                ong: true
            }
        });
        
        delete novaConta.password;

        res.status(201).json({ message: 'ONG cadastrada com sucesso!', account: novaConta });

    } catch (err) {
        console.error(err);
        if (err.code === 'P2002') { 
            return res.status(400).json({ error: 'Email ou CNPJ já está em uso.' });
        }
        res.status(500).json({ error: 'Erro ao cadastrar ONG' });
    }
};

// Atualizar ONG
const updateOng = async (req, res) => {
  const ongIdToUpdate = parseInt(req.params.id);

  const loggedInAccountId = req.account.id; 

  try {
    const ong = await prisma.ong.findUnique({ where: { id: ongIdToUpdate } });

    if (!ong) {
      return res.status(404).json({ error: 'ONG não encontrada' });
    }

    if (ong.id !== loggedInAccountId) {
      return res.status(403).json({ error: 'Acesso negado. Você não tem permissão para editar esta ONG.' });
    }

    const { name, descricao, endereco } = req.body;
    const updatedOng = await prisma.ong.update({
      where: { id: ongIdToUpdate },
      data: { name, descricao, endereco },
    });

    res.json({ message: 'ONG atualizada com sucesso!', ong: updatedOng });

  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar ONG' });
  }
};



// Login 
const loginOng = async (req, res) => {
  const { email, password } = req.body;

  try {
    const account = await prisma.account.findUnique({ where: { email } });
    if (!account || account.role !== 'ONG') return res.status(401).json({ error: 'Credenciais inválidas' });

    const validPassword = await bcrypt.compare(password, account.password);
    if (!validPassword) return res.status(401).json({ error: 'Credenciais inválidas' });

    const token = jwt.sign(
      { id: account.id, role: account.role },
      process.env.JWT_SECRET || 'segredo123',
      { expiresIn: '1d' }
    );

    res.json({ message: 'Login realizado com sucesso', token });
  } catch (err) {
    res.status(500).json({ error: 'Erro no login da ONG' });
  }
};

// 
const getAllOngs = async (req, res) => {
  try {
    const ongs = await prisma.ong.findMany({ include: { account: true } });
    res.json(ongs);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar ONGs' });
  }
};

// Buscar ONG por ID
const getOngById = async (req, res) => {
  const { id } = req.params;

  try {
    const ong = await prisma.ong.findUnique({
      where: { id: parseInt(id) },
      include: { account: true }
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

module.exports = {
  registerOng,
  loginOng,
  getAllOngs,
  getOngById,
  getAnimaisByOng,
  updateOng 
};
