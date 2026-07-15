const express = require("express");
const cors = require("cors");
const path = require("path");

require("./database/init"); // garante criação/seed do banco ao subir o servidor

const authRoutes = require("./routes/authRoutes");
const ticketRoutes = require("./routes/ticketRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API
app.use("/api", authRoutes); // POST /api/login | GET /api/perfil
app.use("/api/tickets", ticketRoutes); // CRUD de chamados
app.use("/api/dashboard", dashboardRoutes); // GET /api/dashboard

// Frontend estático
app.use(express.static(path.join(__dirname, "..", "frontend")));
app.get("/", (req, res) => {
  res.redirect("/pages/login.html");
});

// 404 para rotas de API não encontradas
app.use("/api", (req, res) => {
  res.status(404).json({ sucesso: false, mensagem: "Rota não encontrada." });
});

// Tratamento de erros genérico
app.use((err, req, res, next) => {
  console.error(err);
  res
    .status(500)
    .json({ sucesso: false, mensagem: "Erro interno do servidor." });
});

app.listen(PORT, () => {
  console.log(`✅ Servidor Help Desk rodando em http://localhost:${PORT}`);
  console.log(`   Login padrão: admin@empresa.com / 123456`);
});
