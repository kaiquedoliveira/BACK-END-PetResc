const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// CREATE
const criarReport = async (req, res) => {
    const usuarioId = req.account.id; 

    const { animalId, descricao, endereco } = req.body; 

    if (!descricao) {
        return res.status(400).json({ error: "O campo 'descricao' é obrigatório" });
    }

    try {
        const data = {
            descricao,
            usuario: { 
                connect: {
                    id: usuarioId
                }
            }
        };

        if (animalId) {
            data.animal = {
                connect: {
                    id: parseInt(animalId)
                }
            };
        } else if (!endereco) {
             return res.status(400).json({ error: "Para denúncias de animais não cadastrados, o endereço é obrigatório." });
        } else {
            data.endereco = endereco; // Salva o endereço na denúncia
        }

        const report = await prisma.report.create({ data });
        
        res.status(201).json({ message: "Denúncia registrada com sucesso", report });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erro ao registrar denúncia" });
    }
};

// Listardenuncias
const listarReports = async (req, res) => {
  try {
    const reports = await prisma.report.findMany({
      include: { animal: true, usuario: true }
    });
    res.json(reports);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao buscar denúncias" });
  }
};

// PUT
const atualizarReport = async (req, res) => {
  const { id } = req.params;
  const { descricao } = req.body;

  if (!descricao) return res.status(400).json({ error: "Descrição é obrigatória" });

  try {
    const report = await prisma.report.update({
      where: { id: parseInt(id) },
      data: { descricao }
    });
    res.json({ message: "Denúncia atualizada com sucesso", report });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao atualizar denúncia" });
  }
};

// DELETE
const apagarReport = async (req, res) => {
    const reportId = parseInt(req.params.id);
    const usuarioLogadoId = req.account.id;

    try {
        // Primeiro, busca a denúncia no banco
        const report = await prisma.report.findUnique({
            where: { id: reportId }
        });

        if (!report) {
            return res.status(404).json({ error: "Denúncia não encontrada" });
        }

        // VERIFICA SE O USUÁRIO LOGADO É O DONO DA DENÚNCIA
        if (report.usuarioId !== usuarioLogadoId) {
            return res.status(403).json({ error: "Acesso negado. Você não tem permissão para apagar esta denúncia." });
        }

        // Se passou na verificação, pode apagar
        await prisma.report.delete({ where: { id: reportId } });
        res.json({ message: "Denúncia apagada com sucesso" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Erro ao apagar denúncia" });
    }
};

module.exports = {
  criarReport,
  listarReports,
  atualizarReport,
  apagarReport
};
