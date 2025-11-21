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
                        endereco: true 
                    }
                },
                //  Traz dados do Animal
                animal: {
                    select: {
                        nome: true,
                        foto: true, // ou photoURL
                        especie: true,
                        // Traz dados do Dono do Animal 
                        account: {
                            select: {
                                nome: true, 
                                email: true,
                                ong: {
                                    select: { nome: true } 
                                }
                            }
                        }
                    }
                }
            }
        });

        // Formatando para o Frontend do Admin receber uma tabela limpa
        const pedidosFormatados = pedidos.map(pedido => ({
            id: pedido.id,
            status: pedido.status,
            data: pedido.dataPedido,
            candidato: {
                nome: pedido.candidato.nome,
                contato: pedido.candidato.telefone || pedido.candidato.email
            },
            animal: pedido.animal.nome,
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