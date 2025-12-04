const Campanha = require('../models/Campanha'); // Ajuste o caminho conforme onde criou o Model

const campanhasController = {
    
    // Função para criar uma nova campanha
    create: async (req, res) => {
        try {
            // 1. Pegar os dados do corpo da requisição (req.body)
            const { titulo, descricao, meta_financeira, data_limite, itens_descricao } = req.body;

            // 2. Pegar o arquivo da imagem (se houver) vindo do Multer
            const imagem = req.file ? req.file.filename : null;

            // 3. Pegar o ID do usuário autenticado (vindo do middleware de auth)
            // Geralmente req.userId ou req.user.id
            const usuarioCriador = req.userId; 

            if (!titulo || !meta_financeira || !data_limite) {
                return res.status(400).json({ message: "Preencha todos os campos obrigatórios." });
            }

            // 4. O front manda itens_descricao como JSON string, precisamos converter de volta para Array
            let itensParsed = [];
            if (itens_descricao) {
                try {
                    itensParsed = JSON.parse(itens_descricao);
                } catch (e) {
                    itensParsed = []; // Fallback caso falhe
                }
            }

            // 5. Criação do objeto
            const novaCampanha = new Campanha({
                titulo,
                descricao,
                meta_financeira,
                data_limite,
                itens_descricao: itensParsed,
                imagem,
                usuarioCriador
            });

            // 6. Salvar no banco
            await novaCampanha.save();

            return res.status(201).json({ 
                message: "Campanha criada com sucesso!", 
                campanha: novaCampanha 
            });

        } catch (error) {
            console.error("Erro ao criar campanha:", error);
            return res.status(500).json({ message: "Erro interno ao criar campanha." });
        }
    },

    getAll: async (req, res) => {
        try {
            const campanhas = await Campanha.find().populate('usuarioCriador', 'nome email');
            return res.json(campanhas);
        } catch (error) {
            return res.status(500).json({ message: "Erro ao buscar campanhas." });
        }
    }
};

module.exports = campanhasController;