const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const listarTodosPedidos = async (req, res) => {
    try {
        const pedidos = await prisma.pedidoAdocao.findMany({
            orderBy: {
                dataPedido: 'desc' 
            },
            include: {
                candidato: {
                    select: {
                        nome: true,
                        email: true,
                        telefone: true,
                        cpf: true,
                        // CORREÇÃO: Selecionando campos reais do seu schema
                        cidade: true,
                        estado: true
                    }
                },
                animal: {
                    select: {
                        nome: true,
                        photoURL: true, // Ajustado para bater com seu Schema (photoURL)
                        especie: true,
                        account: {
                            select: {
                                nome: true, // Nome do responsável/ONG
                                email: true,
                                ong: {
                                    select: { nome: true } // Nome Fantasia da ONG (se houver)
                                }
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
                local: `${pedido.candidato.cidade || 'N/A'} - ${pedido.candidato.estado || 'UF'}` // Formatação legível
            },
            animal: pedido.animal.nome,
            // Se for ONG, mostra o nome da ONG, senão mostra o nome da pessoa responsável
            responsavel: pedido.animal.account.ong?.nome || pedido.animal.account.nome
        }));

        res.json(pedidosFormatados);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao listar todos os pedidos.' });
    }
};
module.exports = {
    listarTodosPedidos
};