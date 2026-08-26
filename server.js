require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Servir os arquivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Conexão com o PostgreSQL do Render
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Obrigatório para conexões SSL no Render
  }
});

// Testar conexão com o banco
pool.connect((err, client, release) => {
  if (err) {
    return console.error('Erro ao conectar ao PostgreSQL do Render:', err.stack);
  }
  console.log('Conectado ao PostgreSQL com sucesso!');
  release();
});

// ==========================================
// ROTAS DA API DE PRODUTOS
// ==========================================

// GET: Listar todos os produtos (Usado no index.html e gestao.html)
app.get('/api/produtos', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM produtos ORDER BY id DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar produtos' });
  }
});

// POST: Criar novo produto (Usado no gestao.html)
app.post('/api/produtos', async (req, res) => {
  const { nome, categoria, preco, descricao, imagem } = req.body;
  try {
    const query = `
      INSERT INTO produtos (nome, categoria, preco, descricao, imagem)
      VALUES ($1, $2, $3, $4, $5) RETURNING *
    `;
    const values = [nome, categoria, preco, descricao, imagem];
    const { rows } = await pool.query(query, values);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao cadastrar produto' });
  }
});

// DELETE: Remover produto (Usado no gestao.html)
app.delete('/api/produtos/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM produtos WHERE id = $1', [id]);
    res.json({ message: 'Produto removido com sucesso' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao deletar produto' });
  }
});

// Fallback para SPA / Roteamento estático
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});