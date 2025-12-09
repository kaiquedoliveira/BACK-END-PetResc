
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcrypt');

// ADMIN: Lista todas as contas
const listarUsuarios = async (req, res) => {
    try {
        const contas = await prisma.account.findMany(); 
        contas.forEach(conta => delete conta.password);
        res.json(contas);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao listar contas' });
    }
};

// ADMIN: Cria uma conta
const criarUsuario = async (req, res) => {
    const { email, password, role, nome, cnpj, descricao, endereco, cpf, telefone } = req.body;

    if (!email || !password || !role || !nome || !cpf) {
        return res.status(400).json({ error: 'Preencha email, senha, role, nome e cpf' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const novaConta = await prisma.account.create({
            data: {
                email,
                password: hashedPassword,
                role,
                nome,
                cpf,
                telefone,
                ...(role === 'ONG' && { ong: { create: { nome, cnpj, descricao, endereco } } }),
                ...(role === 'ADMIN' && { admin: { create: { nome } } }),
                ...(role === 'PUBLICO' && { publico: { create: {} } }) // Cria um 'publico' vazio para a relação
            },
            include: { admin: true, ong: true, publico: true },
        });



        delete novaConta.password;
        res.status(201).json(novaConta);
    } catch (err) {
        console.error(err);
        if (err.code === 'P2002') {
            const field = err.meta.target.includes('email') ? 'Email' : 'CPF';
            return res.status(400).json({ error: `Este ${field} já está em uso.` });
        }
        res.status(500).json({ error: 'Erro ao criar conta' });
    }
};

// DELETE: Remove usuário
const deletarUsuario = async (req, res) => {
    const { id } = req.params;
    try {
        const usuarioId = parseInt(id);
        if (isNaN(usuarioId)) return res.status(400).json({ error: 'ID inválido' });

        const usuario = await prisma.account.findUnique({
            where: { id: usuarioId },
            include: { admin: true, ong: true, publico: true }
        });
        if (!usuario) return res.status(404).json({ error: 'Usuário não encontrado' });

        if (usuario.role === 'ADMIN') {
            const totalAdmins = await prisma.account.count({ where: { role: 'ADMIN' } });
            if (totalAdmins <= 1) return res.status(403).json({ error: 'Não é possível remover o último admin' });
        }

        if (usuario.admin) await prisma.admin.delete({ where: { id: usuario.admin.id } });
        if (usuario.ong) await prisma.ong.delete({ where: { id: usuario.ong.id } });
        if (usuario.publico) await prisma.publico.delete({ where: { id: usuario.publico.id } });
        await prisma.account.delete({ where: { id: usuarioId } });

        res.json({ message: 'Usuário removido com sucesso!' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao remover usuário' });
    }
};

const registrarVisualizacao = async (req, res) => {
  const { animalId } = req.body;
  const userId = req.user.id; 
  try {
    const usuario = await prisma.account.findUnique({
      where: { id: userId },
    });

    if (!usuario) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    let vistos = usuario.animaisVistosRecentemente || [];

    vistos = vistos.filter(id => id !== animalId);

    vistos.unshift(animalId);

    const novosVistos = vistos.slice(0, 10);

    await prisma.account.update({
      where: { id: userId },
      data: {
        animaisVistosRecentemente: novosVistos,
      },
    });

    return res.status(200).json({ message: 'Visualização registrada com sucesso.' });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Erro ao registrar visualização.' });
  }
};


// LOGADO: Obter usuário por ID
const obterUsuarioPorId = async (req, res) => {
    try {
        const userIdToView = parseInt(req.params.id);
        const loggedInUser = req.user;

        if (loggedInUser.role !== 'ADMIN' && loggedInUser.id !== userIdToView) {
            return res.status(403).json({ error: "Acesso negado" });
        }

        const account = await prisma.account.findUnique({
            where: { id: userIdToView },
            include: { admin: true, ong: true, publico: true }
        });

        if (!account) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        delete account.password;
        res.json(account);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao obter usuário.' });
    }
};


const obterUsuarioLogado = async (req, res) => {
  try {
    const account = await prisma.account.findUnique({
      where: { id: req.user.id },
      include: { admin: true, ong: true, publico: true }
    });

    if (!account) return res.status(404).json({ error: 'Usuário não encontrado' });

    delete account.password;
    res.json(account);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao obter usuário.' });
  }
};

const listarAnimaisDoUsuario = async (req, res) => {
    try {
        const userId = req.user.id; 

        const animais = await prisma.animal.findMany({
            where: {
                accountId: userId 
            },
            orderBy: {
                createdAt: 'desc' 
            }
        });

        res.json(animais);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao buscar animais do usuário.' });
    }
};

const listarPedidosDoUsuario = async (req, res) => {
    try {
        const userId = req.user.id;

        const pedidos = await prisma.pedidoAdocao.findMany({
            where: {
                candidatoId: userId 
            },
            include: {
                animal: {
                    include: {
                        account: {
                            select: {
                                email: true, 
                                telefone: true,
                                ong: {
                                    select: {
                                        nome: true,
                                        cidade: true,
                                        estado: true
                                    }
                                }
                            }
                        }
                    }
                }
            },
            orderBy: {
                dataPedido: 'desc'
            }
        });

        const pedidosFormatados = pedidos.map(pedido => ({
            id: pedido.id,
            status: pedido.status,
            dataPedido: pedido.dataPedido,
            animal: {
                id: pedido.animal.id,
                nome: pedido.animal.nome,
                foto: pedido.animal.photoURL,
                dono: {
                    nome: pedido.animal.account.ong?.nome || pedido.animal.account.nome, 
                    telefone: pedido.animal.account.telefone,
                    email: pedido.animal.account.email,
                    cidade: pedido.animal.account.ong?.cidade,
                    estado: pedido.animal.account.ong?.estado
                }
            }
        }));

        res.json(pedidosFormatados);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao buscar pedidos de adoção.' });
    }
};


const alterarSenha = async (req, res) => {
    const { senhaAntiga, novaSenha } = req.body;
    const userId = req.user.id; 

    if (!senhaAntiga || !novaSenha) {
        return res.status(400).json({ error: 'Por favor, informe a senha antiga e a nova senha.' });
    }

    if (novaSenha.length < 6) {
    return res.status(400).json({ error: 'A nova senha deve ter pelo menos 6 caracteres.' });
}

    try {
        const usuario = await prisma.account.findUnique({
            where: { id: userId }
        });

        if (!usuario) {
            return res.status(404).json({ error: 'Usuário não encontrado.' });
        }

        const senhaValida = await bcrypt.compare(senhaAntiga, usuario.password);

        if (!senhaValida) {
            return res.status(401).json({ error: 'A senha antiga está incorreta.' });
        }

        const novaSenhaHash = await bcrypt.hash(novaSenha, 10);

        await prisma.account.update({
            where: { id: userId },
            data: { password: novaSenhaHash }
        });

        res.json({ message: 'Senha alterada com sucesso!' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao alterar a senha.' });
    }
};
//  Atualizar usuário
const atualizarUsuario = async (req, res) => {
    try {
         const userIdToUpdate = parseInt(req.params.id);
         const loggedInUser = req.user; 
        
        const { nome, 
            telefone, 
            cep, 
            rua, 
            numero, 
            complemento, 
            bairro, 
            cidade, 
            estado } = req.body;

        if (loggedInUser.role !== 'ADMIN' && loggedInUser.id !== userIdToUpdate) {
           return res.status(403).json({ error: "Acesso negado" });
        }

        const dadosParaAtualizar = {};
        
        if (nome) dadosParaAtualizar.nome = nome;
        if (telefone) dadosParaAtualizar.telefone = telefone;
        if (cep) dadosParaAtualizar.cep = cep;
        if (rua) dadosParaAtualizar.rua = rua;
        if (numero) dadosParaAtualizar.numero = numero;
        if (complemento) dadosParaAtualizar.complemento = complemento;
        if (bairro) dadosParaAtualizar.bairro = bairro;
        if (cidade) dadosParaAtualizar.cidade = cidade;
        if (estado) dadosParaAtualizar.estado = estado;
        if (Object.keys(dadosParaAtualizar).length === 0) {
            return res.status(400).json({ error: 'Nenhum dado para atualizar foi fornecido.' });
        }

        const updatedAccount = await prisma.account.update({
         where: { id: userIdToUpdate },
       data: dadosParaAtualizar, // objeto dinâmico
      });

    delete updatedAccount.password;
     res.json({ message: "Usuário atualizado com sucesso", account: updatedAccount });
  } catch (err) {
        console.error(err);
        if (err.code === 'P2002') {
            return res.status(400).json({ error: 'Ocorreu um erro de conflito. Os dados podem já estar em uso.' });
        }
        res.status(500).json({ error: 'Erro ao atualizar usuário.' });
    }
};

const listarFavoritos = async (req, res) => {
    try {
        const userId = req.user.id;

        const favoritos = await prisma.favorito.findMany({
            where: {
                usuarioId: userId
            },
            include: {
                animal: {
                    include: {
                        account: {
                            select: { nome: true, telefone: true, email: true }
                        }
                    }
                }
            }
        });

        const animaisFavoritos = favoritos.map(fav => fav.animal);

        res.json(animaisFavoritos);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao buscar favoritos.' });
    }
};
module.exports = {
    listarUsuarios,
    criarUsuario,
    deletarUsuario,
    obterUsuarioPorId,
    atualizarUsuario,
    obterUsuarioLogado,
    listarAnimaisDoUsuario,
    listarPedidosDoUsuario,
    alterarSenha,
    listarFavoritos,
    registrarVisualizacao
};