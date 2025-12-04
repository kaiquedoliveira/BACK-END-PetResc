const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 1. ADICIONAR AOS FAVORITOS
const adicionarFavorito = async (req, res) => {
    const { animalId } = req.params;
    const usuarioId = req.user.id;

    try {
        // Verifica se já existe para não duplicar (embora o banco barre)
        const existe = await prisma.favorito.findUnique({
            where: {
                usuarioId_animalId: { // Chave composta do Prisma
                    usuarioId: usuarioId,
                    animalId: parseInt(animalId)
                }
            }
        });

        if (existe) {
            return res.status(400).json({ message: "Já está nos favoritos." });
        }

        await prisma.favorito.create({
            data: {
                usuarioId: usuarioId,
                animalId: parseInt(animalId)
            }
        });

        res.status(201).json({ message: "Favoritado com sucesso!" });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erro ao favoritar." });
    }
};

// 2. REMOVER DOS FAVORITOS
const removerFavorito = async (req, res) => {
    const { animalId } = req.params;
    const usuarioId = req.user.id;

    try {
        await prisma.favorito.delete({
            where: {
                usuarioId_animalId: {
                    usuarioId: usuarioId,
                    animalId: parseInt(animalId)
                }
            }
        });

        res.status(200).json({ message: "Removido dos favoritos." });

    } catch (error) {
        // Se tentar deletar algo que não existe, o Prisma dá erro. Ignoramos ou avisamos.
        res.status(200).json({ message: "Já estava removido." });
    }
};

// 3. LISTAR MEUS FAVORITOS (Para a aba 'Salvos')
const listarMeusFavoritos = async (req, res) => {
    const usuarioId = req.user.id;

    try {
        const favoritos = await prisma.favorito.findMany({
            where: { usuarioId: usuarioId },
            include: {
                animal: true // Traz os dados do animal para exibir no card
            }
        });

        res.json(favoritos);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Erro ao buscar favoritos." });
    }
};

module.exports = { adicionarFavorito, removerFavorito, listarMeusFavoritos };