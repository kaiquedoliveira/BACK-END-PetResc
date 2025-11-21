const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const obterEstatisticasGerais = async (req, res) => {
    try {
        // O Promise.all executa todas as contagens EM PARALELO (muito mais rápido)
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
            // Consultas de Usuários
            prisma.account.count(),
            prisma.account.count({ where: { role: 'ONG' } }),
            prisma.account.count({ where: { role: 'ADMIN' } }),
            
            // Consultas de Animais
            prisma.animal.count(),
            prisma.animal.count({ where: { status: 'DISPONIVEL' } }),
            prisma.animal.count({ where: { status: 'ADOTADO' } }),

            // Consultas de Pedidos de Adoção (KPI importante para o Admin)
            prisma.pedidoAdocao.count({ where: { status: 'PENDENTE' } }),
            prisma.pedidoAdocao.count({ where: { status: 'APROVADO' } }),

            // Consultas de Doações (Soma total)
            prisma.doacao.aggregate({ _sum: { valor: true } })
        ]);

        // Montamos o JSON de resposta organizado
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
                pendentes: pedidosPendentes, // Importante para saber o "trabalho acumulado"
                aprovados: pedidosAprovados
            },
            financeiro: {
                totalArrecadado: totalDoacoes._sum.valor || 0
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao carregar estatísticas do sistema.' });
    }
};

// Relatório animais 
const relatorioAnimais = async (req, res) => {
  try {
    const total = await prisma.animal.count();
   
const disponiveis = await prisma.animal.count({ where: { status: 'DISPONIVEL' } });
const adotados = await prisma.animal.count({ where: { status: 'ADOTADO' } });

    res.json({ total, disponiveis, adotados });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao gerar relatório de animais' });
  }
};

// Relatório doacoes
const relatorioDoacoes = async (req, res) => {
  try {
    const total = await prisma.doacao.count();
    const soma = await prisma.doacao.aggregate({
      _sum: { valor: true },
      _avg: { valor: true }
    });

    res.json({
      total,
      valor_total: soma._sum.valor || 0,
      media: soma._avg.valor || 0
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao gerar relatório de doações' });
  }
};

// Relatório usuarios
const relatorioUsuarios = async (req, res) => {
  try {
    const total = await prisma.account.count(); //consultando por account

    const admins = await prisma.account.count({ where: { role: 'ADMIN' } });
    const ongs = await prisma.account.count({ where: { role: 'ONG' } });
    const publicos = await prisma.account.count({ where: { role: 'PUBLICO' } });

    res.json({ total, admins, ongs, usuarios_publicos: publicos });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao gerar relatório de usuários' });
  }
};

module.exports = {
  relatorioAnimais,
  relatorioDoacoes,
  relatorioUsuarios,
  obterEstatisticasGerais
};
