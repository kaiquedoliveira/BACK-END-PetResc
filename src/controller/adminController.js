const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 1. DASHBOARD: Estatísticas Gerais
const getDashboardStats = async (req, res) => {
    try {
        const [
            totalUsuarios, totalOngs, totalAdmins,
            totalAnimais, animaisDisponiveis, animaisAdotados, animaisEncontrados,
            pedidosPendentes, pedidosAprovados,
            totalDoacoes
        ] = await Promise.all([
            prisma.account.count(),
            prisma.account.count({ where: { role: 'ONG' } }),
            prisma.account.count({ where: { role: 'ADMIN' } }),
            prisma.animal.count(),
            prisma.animal.count({ where: { status: 'DISPONIVEL' } }),
            prisma.animal.count({ where: { status: 'ADOTADO' } }),
            prisma.animal.count({ where: { status: 'ENCONTRADO' } }),
            prisma.pedidoAdocao.count({ where: { status: 'PENDENTE' } }),
            prisma.pedidoAdocao.count({ where: { status: 'APROVADO' } }),
            prisma.doacao.aggregate({ _sum: { valor: true } })
        ]);

        res.json({
            usuarios: {
                total: totalUsuarios,
                ongs: totalOngs,
                admins: totalAdmins,
                publico: totalUsuarios - (totalOngs + totalAdmins)
            },
            animais: {
                total: totalAnimais,
                disponiveis: animaisDisponiveis,
                adotados: animaisAdotados,
                encontrados: animaisEncontrados
            },
            pedidos: {
                pendentes: pedidosPendentes,
                aprovados: pedidosAprovados
            },
            financeiro: {
                totalArrecadado: totalDoacoes._sum.valor || 0
            }
        });
    } catch (err) {
        console.error("Erro dashboard admin:", err);
        res.status(500).json({ error: 'Erro ao carregar estatísticas.' });
    }
};

// 2. LISTAGEM: Todos os Pedidos de Adoção
const listarTodosPedidos = async (req, res) => {
    try {
        const pedidos = await prisma.pedidoAdocao.findMany({
            orderBy: { dataPedido: 'desc' },
            include: {
                candidato: {
                    select: {
                        nome: true, email: true, telefone: true, cpf: true, cidade: true, estado: true
                    }
                },
                animal: {
                    select: {
                        nome: true, photoURL: true, especie: true,
                        account: {
                            select: {
                                nome: true, email: true,
                                ong: { select: { nome: true } }
                            }
                        }
                    }
                }
            }
        });

        const pedidosFormatados = pedidos.map(pedido => ({
            id: pedido.id,
            status: pedido.status,
            data: pedido.dataPedido,
            candidato: {
                nome: pedido.candidato.nome,
                contato: pedido.candidato.telefone || pedido.candidato.email,
                local: `${pedido.candidato.cidade || 'N/A'} - ${pedido.candidato.estado || 'UF'}`
            },
            animal: pedido.animal.nome,
            responsavel: pedido.animal.account.ong?.nome || pedido.animal.account.nome
        }));

        res.json(pedidosFormatados);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao listar pedidos.' });
    }
};

// 3. ATIVIDADES RECENTES (Com createdAt)
const getRecentActivity = async (req, res) => {
    try {
        const [novosUsuarios, novosAnimais, adocoesRecentes] = await Promise.all([
            // Usuários (Ordenados por Data)
            prisma.account.findMany({
                take: 3,
                orderBy: { createdAt: 'desc' },
                select: { id: true, nome: true, role: true, createdAt: true }
            }),
            // Animais (Ordenados por Data)
            prisma.animal.findMany({
                take: 3,
                orderBy: { createdAt: 'desc' },
                select: { id: true, nome: true, createdAt: true }
            }),
            // Adoções
            prisma.animal.findMany({
                where: { status: 'ADOTADO' },
                take: 3,
                orderBy: { updatedAt: 'desc' },
                select: { id: true, nome: true, updatedAt: true }
            })
        ]);

        const activityList = [
            ...novosUsuarios.map(u => ({
                id: `usr-${u.id}`,
                tipo: 'USUARIO',
                texto: `Novo usuário: ${u.nome} (${u.role})`,
                data: u.createdAt,
                link: '/admin/usuarios'
            })),
            ...novosAnimais.map(a => ({
                id: `pet-${a.id}`,
                tipo: 'ANIMAL',
                texto: `Novo animal: ${a.nome}`,
                data: a.createdAt,
                link: `/animal/${a.id}`
            })),
            ...adocoesRecentes.map(a => ({
                id: `adoc-${a.id}`,
                tipo: 'ADOCAO',
                texto: `Adoção: ${a.nome}`,
                data: a.updatedAt,
                link: `/animal/${a.id}`
            }))
        ];

        activityList.sort((a, b) => new Date(b.data) - new Date(a.data));
        res.json(activityList.slice(0, 5));

    } catch (err) {
        console.error("Erro activity admin:", err);
        res.status(500).json({ error: 'Erro ao carregar atividades.' });
    }
};

// 4. LISTAR TODOS OS ANIMAIS (ESSA ERA A QUE FALTAVA!)
const listarTodosAnimais = async (req, res) => {
    try {
        const animais = await prisma.animal.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                account: {
                    select: { nome: true, email: true, role: true }
                },
                _count: {
                    select: { 
                        pedidosAdocao: { where: { status: 'PENDENTE' } } 
                    }
                }
            }
        });

        const animaisFormatados = animais.map(pet => {
            let statusCalculado = pet.status;
            if (pet.status === 'DISPONIVEL' && pet._count.pedidosAdocao > 0) {
                statusCalculado = 'AGUARDANDO';
            }
            return { ...pet, statusReal: statusCalculado };
        });

        res.json(animaisFormatados);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao listar animais.' });
    }
};

const listarTodasOngs = async (req, res) => {
    try {
        const ongs = await prisma.account.findMany({
            where: { role: 'ONG' },
            include: {
                ong: true, // Traz dados específicos (CNPJ, Endereço)
                _count: {
                    select: { animals: true } // Conta quantos animais essa conta tem
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Formata para facilitar no front
        const ongsFormatadas = ongs.map(conta => ({
            id: conta.id,
            nome: conta.ong?.nome || conta.nome, // Preferência pelo Nome Fantasia
            email: conta.email,
            cnpj: conta.ong?.cnpj || "Não informado",
            localizacao: conta.ong?.cidade ? `${conta.ong.cidade}, ${conta.ong.estado}` : "Local não inf.",
            animaisAtivos: conta._count.animals,
            status: 'Ativa' // Por enquanto não temos bloqueio, então todas são ativas
        }));

        res.json(ongsFormatadas);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao listar ONGs.' });
    }
};

// 6. DELETAR USUÁRIO (Serve para ONG ou Pessoa)
const deletarUsuario = async (req, res) => {
    const { id } = req.params;
    try {
        // Deleta a conta (O Prisma deleta a entrada na tabela ONG automaticamente se tiver Cascade)
        await prisma.account.delete({
            where: { id: Number(id) }
        });
        res.json({ message: "Usuário excluído com sucesso." });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erro ao excluir usuário. Verifique se existem dependências." });
    }
};

const obterDetalhesOng = async (req, res) => {
    const { id } = req.params;
    try {
        const ong = await prisma.account.findUnique({
            where: { id: Number(id) },
            include: {
                ong: true, // Dados específicos (CNPJ, Descrição)
                _count: { select: { animals: true } } // Contagem de animais
            }
        });

        if (!ong) return res.status(404).json({ error: "ONG não encontrada." });

        // Formata para o front
        const dadosFormatados = {
            id: ong.id,
            nome: ong.ong?.nome || ong.nome,
            email: ong.email,
            telefone: ong.telefone,
            cnpj: ong.ong?.cnpj || "Não informado",
            descricao: ong.ong?.descricao || "Sem descrição.",
            endereco: ong.ong?.cidade ? `${ong.ong.rua}, ${ong.ong.numero} - ${ong.ong.bairro}, ${ong.ong.cidade}/${ong.ong.estado}` : "Endereço não cadastrado",
            totalAnimais: ong._count.animals
        };

        res.json(dadosFormatados);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erro ao buscar detalhes." });
    }
};

// 8. LISTAR PETS DE UMA ONG ESPECÍFICA
const listarPetsDaOng = async (req, res) => {
    const { id } = req.params;
    try {
        const pets = await prisma.animal.findMany({
            where: { accountId: Number(id) }, // Filtra pelo ID da ONG
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: { pedidosAdocao: { where: { status: 'PENDENTE' } } }
                }
            }
        });

        const petsFormatados = pets.map(pet => {
            let statusCalculado = pet.status;
            if (pet.status === 'DISPONIVEL' && pet._count.pedidosAdocao > 0) {
                statusCalculado = 'AGUARDANDO';
            }
            return { ...pet, statusReal: statusCalculado };
        });

        res.json(petsFormatados);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erro ao listar pets da ONG." });
    }
};

// --- EXPORTS OBRIGATÓRIOS ---
module.exports = {
    getDashboardStats,
    listarTodosPedidos,
    getRecentActivity,
    listarTodosAnimais,
    deletarUsuario,
    listarTodasOngs,
    listarPetsDaOng,
    obterDetalhesOng
};