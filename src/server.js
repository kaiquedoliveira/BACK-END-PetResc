const express = require("express");
const cors = require("cors");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const app = express();

const dotenv = require("dotenv").config();


app.use(cors());
app.use(express.json());

// Import de rotas
const authRoutes = require("./routes/auth");
const usuariosRoutes = require("./routes/usuarios");
const animaisRoutes = require("./routes/animais");
const doacoesRoutes = require("./routes/doacoes");
const larTemporarioRoutes = require("./routes/larTemporario");
const ongsRoutes = require("./routes/ongs");
const relatoriosRoutes = require("./routes/relatorios");
const feedRoutes = require("./routes/feed");
const adocoesRoutes = require("./routes/adocoes");
const adminRoutes = require('./routes/admin');
const notificacoesRoutes = require("./routes/notificacoes");
const favoritarRoutes = require('./routes/favoritar');



// Rotas principais
app.use("/api/auth", authRoutes);
app.use("/api/usuarios", usuariosRoutes);
app.use("/api/doacoes", doacoesRoutes);
app.use("/api/lares-Temporarios", larTemporarioRoutes);
app.use("/api/ongs", ongsRoutes);
app.use("/api/relatorios", relatoriosRoutes);
app.use("/api/feed", feedRoutes);
app.use('/api/pedidos-adocao', adocoesRoutes);
app.use('/uploads', express.static('uploads'));
app.use('/api/animais', animaisRoutes);
app.use('/api/notificacoes', notificacoesRoutes); 
app.use('/favoritar', favoritarRoutes); 

app.use('/api/admin', adminRoutes); 

app.use('/uploads', express.static('uploads'));


app.get("/api", (req, res) => {
  res.json({ message: "API rodando corretamente!" });
});


app.get("/", (req, res) => {
  res.json({ message: "API PetResc rodando corretamente!" });
});

app.use((err, req, res, next) => {
  console.error("UM ERRO OCORREU:", err.stack);
  res.status(500).json({
    error: "Ocorreu um erro inesperado no servidor. Tente novamente."
  });
});




const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {

  console.log(`Servidor rodando na porta ${PORT}`);

  console.log("Conexão com o banco de dados OK!");

  

  
});