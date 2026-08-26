const express = require('express');
const path = require('path');
const cors = require('cors');

const produtoRoutes = require('./src/routes/produtoRoutes');
const authRoutes = require('./src/routes/authRoutes');

const app = express();
const port = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Servir arquivos estáticos da pasta 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Rotas da API
app.use('/api/produtos', produtoRoutes);
app.use('/api/auth', authRoutes);

// Rotas para páginas estáticas de administração
app.get('/admin/gestao', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin', 'gestao.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin', 'admin.html'));
});

// Rota Curinga para SPA / Home (deve ser a última rota GET)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Inicialização do servidor
app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});