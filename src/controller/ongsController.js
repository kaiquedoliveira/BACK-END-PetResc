const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = new PrismaClient();
const axios = require('axios');


async function getCoordinatesFromAddress(endereco) {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(endereco)}&limit=1`;

    try {
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'PetRescApp/1.0 (seuemail@exemplo.com)' // Coloque um nome qualquer aqui
            }
        });

        if (response.data.length > 0) {
            const { lat, lon } = response.data[0];
            return { latitude: parseFloat(lat), longitude: parseFloat(lon) };
        }
        return null;
    } catch (error) {
        console.error("Erro no Nominatim:", error.message);
        return null;
    }
}

// Atualizar ONG

const updateOng = async (req, res) => {
    const ongIdToUpdate = parseInt(req.params.id);
    const loggedInUser = req.user;

    if (loggedInUser.role !== 'ADMIN' && loggedInUser.id !== ongIdToUpdate) {
        return res.status(403).json({ error: 'Acesso negado.' });
    }

    const { email, nome, telefone, cnpj, descricao, endereco } = req.body;

    // 1. Preparamos o objeto com os dados básicos da ONG
    let dadosOngParaSalvar = { nome, cnpj, descricao, endereco };

    // 2. Lógica de Geocoding
    if (endereco) {
        const coords = await getCoordinatesFromAddress(endereco);
        if (coords) {
            // Adicionamos as coordenadas ao objeto que será salvo
            dadosOngParaSalvar.latitude = coords.latitude;
            dadosOngParaSalvar.longitude = coords.longitude;
        }
    }

    try {
        const [updatedAccount, updatedOng] = await prisma.$transaction([
            prisma.account.update({
                where: { id: ongIdToUpdate },
                data: { email, nome, telefone }
            }),
            prisma.ong.update({
                where: { id: ongIdToUpdate },
                data: dadosOngParaSalvar // <--- 3. AQUI usamos o objeto com as coordenadas
            })
        ]);

        delete updatedAccount.password;
        res.json({ message: 'ONG atualizada com sucesso!', account: updatedAccount, ong: updatedOng });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao atualizar ONG' });
    }
};

// Buscar ONG por ID
const getOngById = async (req, res) => {
  const { id } = req.params;

  try {
    const ong = await prisma.ong.findUnique({
      where: { id: parseInt(id) },
       include: {
       account: {
        select: {
            id: true,
            email: true,
            nome: true,
            telefone: true,
            role: true
        }
    }
}
    });

    if (!ong) return res.status(404).json({ error: 'ONG não encontrada' });
    res.json(ong);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar ONG' });
  }
};

// Buscar animais ONG
const getAnimaisByOng = async (req, res) => {
  const { id } = req.params;

  try {
     const animais = await prisma.animal.findMany({
      where: { accountId: parseInt(id) }, 
    });
    

    if (animais.length === 0) return res.status(404).json({ error: 'Nenhum animal encontrado para essa ONG' });
    res.json(animais);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar animais da ONG' });
  }
};

const getAllOngs = async (req, res) => {
  try {
    const ongs = await prisma.ong.findMany({ 
include: {
    account: {
        select: {
            id: true,
            email: true,
            nome: true,
            telefone: true,
            role: true
        }
      }

    }
 });

 res.json(ongs);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar ONGs' });
  }
};


const getOngsProximas = async (req, res) => {
    const { lat, lng, raioKm } = req.query;

    if (!lat || !lng) {
        return res.status(400).json({ error: 'Latitude e Longitude são obrigatórias.' });
    }

    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);
    const distanceKm = parseFloat(raioKm) || 10; 

    try {
       
        const ongs = await prisma.$queryRaw`
            SELECT 
                o.id, 
                o.nome, 
                o.descricao, 
                o.latitude, 
                o.longitude,
                (6371 * acos(
                    cos(radians(${userLat})) * cos(radians(o.latitude)) * cos(radians(o.longitude) - radians(${userLng})) + 
                    sin(radians(${userLat})) * sin(radians(o.latitude))
                )) AS distancia
            FROM "Ong" o
            WHERE o.latitude IS NOT NULL AND o.longitude IS NOT NULL
            HAVING distancia < ${distanceKm}
            ORDER BY distancia ASC
        `;

        
        
        res.json(ongs);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erro ao buscar ONGs próximas' });
    }
};

module.exports = {
  getAllOngs,
  getOngById,
  getAnimaisByOng,
  updateOng,
  getOngsProximas
};
