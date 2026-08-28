const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { pool } = require('../config/db');

// Middleware de Autenticação
function requireAuth(req, res, next) {
  if (req.session && req.session.adminId) {
    return next();
  }
  return res.status(401).json({ error: 'Acesso não autorizado. Faça login.' });
}

// POST /api/admin/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM admins WHERE username = $1', [username]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Usuário ou senha inválidos.' });
    }

    const admin = result.rows[0];
    const match = await bcrypt.compare(password, admin.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Usuário ou senha inválidos.' });
    }

    req.session.adminId = admin.id;
    req.session.adminUser = admin.username;
    res.json({ message: 'Login realizado com sucesso.', user: admin.username });
  } catch (err) {
    res.status(500).json({ error: 'Erro interno ao realizar login.' });
  }
});

// POST /api/admin/logout
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ error: 'Erro ao encerrar sessão.' });
    res.clearCookie('tozzi_sid');
    res.json({ message: 'Sessão encerrada com sucesso.' });
  });
});

// GET /api/admin/check-auth
router.get('/check-auth', (req, res) => {
  if (req.session && req.session.adminId) {
    return res.json({ authenticated: true, user: req.session.adminUser });
  }
  res.json({ authenticated: false });
});

// GET /api/admin/products
router.get('/products', requireAuth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar produtos.' });
  }
});

// POST /api/admin/products
router.post('/products', requireAuth, async (req, res) => {
  const { name, description, price, category_slug, image_url, stock, featured } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO products (name, description, price, category_slug, image_url, stock, featured)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [name, description, price || 0, category_slug || 'geral', image_url, stock || 0, featured || false]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao cadastrar produto.' });
  }
});

// PUT /api/admin/products/:id
router.put('/products/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { name, description, price, category_slug, image_url, stock, featured } = req.body;
  try {
    const result = await pool.query(
      `UPDATE products 
       SET name=$1, description=$2, price=$3, category_slug=$4, image_url=$5, stock=$6, featured=$7
       WHERE id=$8 RETURNING *`,
      [name, description, price, category_slug, image_url, stock, featured, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Produto não encontrado.' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar produto.' });
  }
});

// DELETE /api/admin/products/:id
router.delete('/products/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM products WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Produto não encontrado.' });
    res.json({ message: 'Produto removido com sucesso.' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao remover produto.' });
  }
});

module.exports = router;