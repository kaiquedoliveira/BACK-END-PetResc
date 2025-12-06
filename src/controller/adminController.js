const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 1. DASHBOARD: Estatísticas Gerais (Unificado)
const getDashboardStats = async (req, res) => {
    try {
        // Executa todas as contagens em paralelo para performance máxima
        const [
            totalUsuarios,
            totalOngs,
            totalAdmins,
            totalAnimais,
            animaisDisponiveis,
            animaisAdotados,
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

            // Pedidos
            prisma.pedidoAdocao.count({ where: { status: 'PENDENTE' } }),
            prisma.pedidoAdocao.count({ where: { status: 'APROVADO' } }),

            // Financeiro (Soma)
            prisma.doacao.aggregate({ _sum: { valor: true } })
        ]);

        // Retorna JSON estruturado
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
                adotados: animaisAdotados
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
                        nome: true,
                        email: true,
                        telefone: true,
                        cpf: true,
                        cidade: true,
                        estado: true
                    }
                },
                animal: {
                    select: {
                        nome: true,
                        photoURL: true,
                        especie: true,
                        account: {
                            select: {
                                nome: true,
                                email: true,
                                ong: { select: { nome: true } }
                            }
                        }
                    }
                }
            }
        });

        // Formatação para facilitar o uso no Front
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

module.exports = {
    getDashboardStats,
    listarTodosPedidos
};