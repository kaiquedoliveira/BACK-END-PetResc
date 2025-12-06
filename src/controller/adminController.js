const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 1. DASHBOARD: Estatísticas Gerais
const getDashboardStats = async (req, res) => {
    try {
        const [
            totalUsuarios,
            totalOngs,
            totalAdmins,
            totalAnimais,
            animaisDisponiveis,
            animaisAdotados,
            animaisEncontrados, // <--- NOVO
            pedidosPendentes,
            pedidosAprovados,
            totalDoacoes
        ] = await Promise.all([
            // Usuários
            prisma.account.count(),
            prisma.account.count({ where: { role: 'ONG' } }),
            prisma.account.count({ where: { role: 'ADMIN' } }),
            
            // Animais
            prisma.animal.count(),
            prisma.animal.count({ where: { status: 'DISPONIVEL' } }),
            prisma.animal.count({ where: { status: 'ADOTADO' } }),
            prisma.animal.count({ where: { status: 'ENCONTRADO' } }), // <--- CONTAGEM NOVA

            // Pedidos
            prisma.pedidoAdocao.count({ where: { status: 'PENDENTE' } }),
            prisma.pedidoAdocao.count({ where: { status: 'APROVADO' } }),

            // Financeiro
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
                encontrados: animaisEncontrados // <--- ENVIANDO PARA O FRONT
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

// ... Mantenha a função listarTodosPedidos aqui ...
const listarTodosPedidos = async (req, res) => {
    // (Código que já estava aqui)
    // ...
    // Só copiei a estrutura para lembrar de não apagar
    try {
        const pedidos = await prisma.pedidoAdocao.findMany({ /*...*/ });
        // ...
        res.json(pedidosFormatados);
    } catch (err) { /*...*/ }
};

const getRecentActivity = async (req, res) => {
    try {
        // Buscamos em paralelo as últimas ocorrências de cada tipo
        const [novosUsuarios, novosAnimais, adocoesRecentes] = await Promise.all([
            // 1. Últimos Usuários Cadastrados
            prisma.account.findMany({
                take: 3,
                orderBy: { createdAt: 'desc' },
                select: { id: true, nome: true, role: true, createdAt: true }
            }),
            // 2. Últimos Animais Registrados
            prisma.animal.findMany({
                take: 3,
                orderBy: { createdAt: 'desc' },
                select: { id: true, nome: true, createdAt: true }
            }),
            // 3. Últimas Adoções (Animais com status ADOTADO ordenados pela atualização)
            prisma.animal.findMany({
                where: { status: 'ADOTADO' },
                take: 3,
                orderBy: { updatedAt: 'desc' },
                select: { id: true, nome: true, updatedAt: true }
            })
        ]);

        // Padronizamos os dados para facilitar no Front
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
                texto: `Novo animal cadastrado: ${a.nome}`,
                data: a.createdAt,
                link: '/admin/pets'
            })),
            ...adocoesRecentes.map(a => ({
                id: `adoc-${a.id}`,
                tipo: 'ADOCAO',
                texto: `Adoção concluída: ${a.nome}`,
                data: a.updatedAt,
                link: '/admin/pedidos' // ou gerenciamento
            }))
        ];

        // Ordena tudo pela data (do mais recente para o mais antigo)
        activityList.sort((a, b) => new Date(b.data) - new Date(a.data));

        // Pega apenas os 5 ou 6 mais recentes para exibir no widget
        const ultimasAcoes = activityList.slice(0, 5);

        res.json(ultimasAcoes);

    } catch (err) {
        console.error("Erro activity admin:", err);
        res.status(500).json({ error: 'Erro ao carregar atividades.' });
    }
};

module.exports = {
    getDashboardStats,
    listarTodosPedidos,
    getRecentActivity
};