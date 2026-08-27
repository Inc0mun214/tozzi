const express = require('express');
const path = require('path');
const cors = require('cors');

// Importação das rotas da pasta src/
const produtoRoutes = require('./src/routes/produtoRoutes');
const authRoutes = require('./src/routes/authRoutes');

const app = express();
const port = process.env.PORT || 3000;

// Middlewares globais
app.use(cors());
app.use(express.json());

// 1. Servir a pasta 'public' para a raiz (index.html, imagens, assets)
app.use(express.static(path.join(__dirname, 'public')));

// 2. Servir a subpasta 'public/admin' para arquivos estáticos em /admin
app.use('/admin', express.static(path.join(__dirname, 'public', 'admin')));

// 3. Rotas explícitas para as páginas HTML do Admin
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin', 'admin.html'));
});

app.get('/admin/admin.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin', 'admin.html'));
});

app.get('/admin/gestao', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin', 'gestao.html'));
});

app.get('/admin/gestao.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin', 'gestao.html'));
});

// ==========================================
// ROTAS DA API (MÓDULOS SRC)
// ==========================================
app.use('/api/produtos', produtoRoutes);
app.use('/api/auth', authRoutes);

// ==========================================
// ROTA CURINGA PARA HOME / SPA
// (Deve ser obrigatoriamente a última rota GET)
// ==========================================
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Inicialização do servidor
app.listen(port, () => {
  console.log(`Servidor rodando com sucesso na porta ${port}`);
});