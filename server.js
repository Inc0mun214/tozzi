const express = require('express');
const { Pool } = require('pg');
const path = require('path');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

// Configuração do banco PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

// Middlewares
app.use(cors());
app.use(express.json());

// Servir arquivos estáticos da pasta 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Rotas explícitas para as páginas de administração
app.get('/admin/gestao', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin', 'gestao.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin', 'admin.html'));
});

// ==========================================
// ROTAS DA API DE PRODUTOS (CRUD COMPLETO)
// ==========================================

// GET: Listar todos os produtos
app.get('/api/produtos', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM produtos ORDER BY id DESC');
    res.json(rows);
  } catch (err) {
    console.error('Erro ao buscar produtos:', err);
    res.status(500).json({ error: 'Erro no servidor ao buscar produtos' });
  }
});

// POST: Criar novo produto
app.post('/api/produtos', async (req, res) => {
  const { nome, categoria, preco, descricao, imagem } = req.body;
  try {
    const query = `
      INSERT INTO produtos (nome, categoria, preco, descricao, imagem)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const values = [nome, categoria, preco, descricao, imagem];
    const { rows } = await pool.query(query, values);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Erro ao salvar produto:', err);
    res.status(500).json({ error: 'Erro ao salvar produto no banco' });
  }
});

// PUT: Atualizar produto existente (CRUD Fix)
app.put('/api/produtos/:id', async (req, res) => {
  const { id } = req.params;
  const { nome, categoria, preco, descricao, imagem } = req.body;
  try {
    const query = `
      UPDATE produtos
      SET nome = $1, categoria = $2, preco = $3, descricao = $4, imagem = $5
      WHERE id = $6
      RETURNING *
    `;
    const values = [nome, categoria, preco, descricao, imagem, id];
    const { rows } = await pool.query(query, values);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error('Erro ao atualizar produto:', err);
    res.status(500).json({ error: 'Erro ao atualizar produto no banco' });
  }
});

// DELETE: Remover produto por ID
app.delete('/api/produtos/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM produtos WHERE id = $1', [id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    res.json({ message: 'Produto deletado com sucesso' });
  } catch (err) {
    console.error('Erro ao deletar produto:', err);
    res.status(500).json({ error: 'Erro ao remover produto do banco' });
  }
});

// Rota Curinga para SPA / Home
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


const bcrypt = require('bcryptjs');

// ==========================================
// ROTAS DE AUTENTICAÇÃO (LOGIN & REGISTRO)
// ==========================================

// POST: Registrar Novo Usuário (Com Hashing)
app.post('/api/auth/register', async (req, res) => {
  const { usuario, email, senha } = req.body;
  try {
    // 1. Gerar Salt e Hash da senha (10 rounds)
    const saltRounds = 10;
    const senhaHash = await bcrypt.hash(senha, saltRounds);

    // 2. Salvar no PostgreSQL
    const query = `
      INSERT INTO usuarios (usuario, email, senha)
      VALUES ($1, $2, $3)
      RETURNING id, usuario, email
    `;
    const { rows } = await pool.query(query, [usuario, email, senhaHash]);

    res.status(201).json({ message: 'Usuário criado com sucesso!', user: rows[0] });
  } catch (err) {
    console.error('Erro ao registrar usuário:', err);
    res.status(500).json({ error: 'Erro ao cadastrar usuário' });
  }
});

// POST: Login Seguro (Comparação de Hash)
app.post('/api/auth/login', async (req, res) => {
  const { usuario, senha } = req.body;
  try {
    // 1. Buscar usuário no banco
    const { rows } = await pool.query('SELECT * FROM usuarios WHERE usuario = $1', [usuario]);

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Usuário ou senha inválidos' });
    }

    const user = rows[0];

    // 2. Comparar a senha digitada com o Hash salvo no banco
    const senhaValida = await bcrypt.compare(senha, user.senha);

    if (!senhaValida) {
      return res.status(401).json({ error: 'Usuário ou senha inválidos' });
    }

    // 3. Sucesso (Aqui você pode futuramente retornar um token JWT)
    res.json({
      message: 'Login realizado com sucesso!',
      user: { id: user.id, usuario: user.usuario, email: user.email }
    });
  } catch (err) {
    console.error('Erro ao realizar login:', err);
    res.status(500).json({ error: 'Erro interno no login' });
  }
});

// Inicialização do Servidor
app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});