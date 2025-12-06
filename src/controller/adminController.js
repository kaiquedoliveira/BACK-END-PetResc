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
        const [novosUsuarios, novosAnimais, adocoesRecentes] = await Promise.all([
            // 1. Últimos Usuários (CORRIGIDO: Ordena por ID, pois não tem createdAt)
            prisma.account.findMany({
                take: 3,
                orderBy: { id: 'desc' }, 
                select: { id: true, nome: true, role: true } // Removido createdAt
            }),
            // 2. Últimos Animais (Mantém createdAt pois existe na tabela Animal)
            prisma.animal.findMany({
                take: 3,
                orderBy: { createdAt: 'desc' },
                select: { id: true, nome: true, createdAt: true }
            }),
            // 3. Últimas Adoções
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
                data: new Date(), // Data atual como fallback
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

        // Ordena
        activityList.sort((a, b) => new Date(b.data) - new Date(a.data));
        
        res.json(activityList.slice(0, 5));

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