const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { sendEmail } = require('../services/emailService');

const toBool = (value) => {
    if (typeof value === 'boolean') return value;
    return value === 'sim';
};

const toInt = (value) => {
    const parsed = parseInt(value);
    return isNaN(parsed) ? 0 : parsed;
};

const criarPedido = async (req, res) => {
  const { animalId, respostasFormulario } = req.body; 
  const candidatoId = req.user.id;

  if (!animalId || !respostasFormulario) {
    return res.status(400).json({ error: "Dados incompletos." });
  }

  try {
    const animal = await prisma.animal.findUnique({ where: { id: parseInt(animalId) } });
    if (!animal) return res.status(404).json({ error: "Animal não encontrado." });

    if (animal.accountId === candidatoId) {
      return res.status(400).json({ error: "Você não pode adotar seu próprio animal." });
    }

    const pedidoExistente = await prisma.pedidoAdocao.findFirst({
        where: { animalId: parseInt(animalId), candidatoId: candidatoId, status: 'PENDENTE' }
    });

    if (pedidoExistente) {
        return res.status(400).json({ error: "Já existe um pedido pendente." });
    }

    const novoPedido = await prisma.pedidoAdocao.create({
      data: {
        animalId: parseInt(animalId),
        candidatoId: candidatoId,
        status: 'PENDENTE',
        
        formulario: {
            create: {
                tipoMoradia: respostasFormulario.tipoMoradia || "Não informado",
                
                possuiQuintal: toBool(respostasFormulario.possuiQuintal),
                quintalTelado: toBool(respostasFormulario.quintalTelado),
                janelasTeladas: toBool(respostasFormulario.janelasTeladas),
                moradiaPropria: toBool(respostasFormulario.moradiaPropria),
                todosConcordam: toBool(respostasFormulario.todosConcordam),
                criancasEmCasa: toBool(respostasFormulario.criancasEmCasa),
                alergias: toBool(respostasFormulario.alergias),
                possuiOutrosAnimais: toBool(respostasFormulario.possuiOutrosAnimais),
                teveAnimaisAntes: toBool(respostasFormulario.teveAnimaisAntes),
                temVeterinario: toBool(respostasFormulario.temVeterinario),
                cienteCustos: toBool(respostasFormulario.cienteCustos),

                pessoasNaCasa: toInt(respostasFormulario.pessoasNaCasa),
                horasSozinho: toInt(respostasFormulario.horasSozinho),

                rotinaPasseios: respostasFormulario.rotinaPasseios,
                quemCuidara: respostasFormulario.quemCuidara,
                historicoAnimais: respostasFormulario.historicoAnimais,
                motivoAdocao: respostasFormulario.motivoAdocao,
                observacoes: respostasFormulario.observacoes
            }
        }
      },
      include: { formulario: true }
    });

    res.status(201).json({ message: "Pedido enviado!", pedido: novoPedido });

  } catch (error) {
    console.error("Erro criar pedido:", error);
    res.status(500).json({ error: "Erro interno." });
  }
};

const listarMeusPedidos = async (req, res) => {
    const candidatoId = req.user.id;
    try {
        const meusPedidos = await prisma.pedidoAdocao.findMany({
            where: { candidatoId: candidatoId },
            include: { 
                animal: {
                    include: {
                        account: { select: { nome: true, telefone: true, email: true } }
                    }
                }
            },
            orderBy: { dataPedido: 'desc' }
        });
        res.status(200).json(meusPedidos);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar pedidos.' });
    }
};

const listarPedidosParaGerenciamento = await prisma.pedidoAdocao.findMany({
  where: { animalId: parseInt(animalId) },
  include: {
    formulario: {
      select: {
        id: true,
        tipoMoradia: true,
        possuiQuintal: true,
        quintalTelado: true,
        janelasTeladas: true,
        moradiaPropria: true,
        todosConcordam: true,
        criancasEmCasa: true,
        alergias: true,
        possuiOutrosAnimais: true,
        teveAnimaisAntes: true,
        temVeterinario: true,
        cienteCustos: true,
        pessoasNaCasa: true,
        horasSozinho: true,
        rotinaPasseios: true,
        quemCuidara: true,
        historicoAnimais: true,
        motivoAdocao: true,
        observacoes: true
      }
    },
    account: {      
      select: { 
        nome: true, 
        email: true, 
        telefone: true,
        cep: true,
        rua: true,
        numero: true,
        complemento: true,
        bairro: true,
        cidade: true,
        estado: true
      }
    }
  },
  orderBy: { dataPedido: 'desc' }
});

const listarPedidosPorAnimal = async (req, res) => {
    const { animalId } = req.params;
    const userId = req.user.id;

    try {
        const animal = await prisma.animal.findUnique({ where: { id: parseInt(animalId) } });
        
        if (!animal) return res.status(404).json({ error: "Animal não encontrado" });
        
        if (req.user.role !== 'ADMIN' && animal.accountId !== userId) {
            return res.status(403).json({ error: "Sem permissão." });
        }

        const pedidos = await prisma.pedidoAdocao.findMany({
            where: { animalId: parseInt(animalId) },
            include: {
                // FORMULÁRIO COMPLETO
                formulario: {
                    select: {
                        id: true,
                        tipoMoradia: true,
                        possuiQuintal: true,
                        quintalTelado: true,
                        janelasTeladas: true,
                        moradiaPropria: true,
                        todosConcordam: true,
                        criancasEmCasa: true,
                        alergias: true,
                        possuiOutrosAnimais: true,
                        teveAnimaisAntes: true,
                        temVeterinario: true,
                        cienteCustos: true,
                        pessoasNaCasa: true,
                        horasSozinho: true,
                        rotinaPasseios: true,
                        quemCuidara: true,
                        historicoAnimais: true,
                        motivoAdocao: true,
                        observacoes: true,

                        // CAMPOS DE ENDEREÇO
                        cep: true,
                        rua: true,
                        numero: true,
                        complemento: true,
                        bairro: true,
                        cidade: true,
                        estado: true
                    }
                },

                // Dados do usuário (candidato)
                account: {      
                    select: { 
                      nome: true, 
                      email: true, 
                      telefone: true,
                      cep: true,
                     rua: true,
                     numero: true,
                     complemento: true,
                     bairro: true,
                     cidade: true,
                     estado: true

                    }
                }
            },
            orderBy: { dataPedido: 'desc' }
        });

        res.status(200).json(pedidos);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erro ao buscar candidatos." });
    }
};
// 5. ATUALIZAR STATUS
const atualizarStatusPedido = async (req, res) => {
    const { id: pedidoId } = req.params;
    const { status } = req.body; 
    const { id: gestorId, role } = req.user; 

    if (!['APROVADO', 'RECUSADO'].includes(status)) {
        return res.status(400).json({ error: "Status inválido." });
    }

    try {
        const pedido = await prisma.pedidoAdocao.findUnique({
            where: { id: parseInt(pedidoId) },
            include: { 
                animal: true, 
                account: { select: { email: true, nome: true } } // Correção: 'account'
            }
        });

        if (!pedido) return res.status(404).json({ error: 'Pedido não encontrado.' });

        if (role !== 'ADMIN' && pedido.animal.accountId !== gestorId) {
            return res.status(403).json({ error: 'Acesso negado.' });
        }
        
        // Atualiza Pedido
        await prisma.pedidoAdocao.update({
            where: { id: parseInt(pedidoId) },
            data: { status }
        });

        // Se APROVADO, muda status do animal
        if (status === 'APROVADO') {
            await prisma.animal.update({
                where: { id: pedido.animalId },
                // Certifique-se de adicionar 'ADOTADO' no Enum do Schema, senão use 'ENCONTRADO'
                data: { status: 'ADOTADO' } 
            });
        }

        // Email (Assíncrono)
        const assunto = status === 'APROVADO' ? 'Adoção Aprovada! 🎉' : 'Atualização do Pedido';
        const msg = status === 'APROVADO' 
            ? `<p>Parabéns ${pedido.account.nome}, seu pedido foi aprovado!</p>`
            : `<p>Olá ${pedido.account.nome}, infelizmente seu pedido não foi aceito desta vez.</p>`;

        sendEmail(pedido.account.email, assunto, msg)
            .catch(e => console.error("Erro email:", e));
        
        res.status(200).json({ message: `Pedido ${status}!` });

    } catch (error) {
        console.error("Erro update status:", error);
        res.status(500).json({ error: 'Erro interno.' });
    }
};

module.exports = {
    criarPedido,
    listarMeusPedidos,
    listarPedidosParaGerenciamento,
    listarPedidosPorAnimal,
    atualizarStatusPedido
};
