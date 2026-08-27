import { Router } from 'express';
import bcrypt from 'bcrypt';
import rateLimit from 'express-rate-limit';
import { pool } from '../config/db.js';

const router = Router();

// Middleware de Autenticação Protegida
export const requireAuth = (req, res, next) => {
  if (req.session && req.session.admin) {
    return next();
  }
  return res.status(401).json({ error: 'Sessão inválida ou expirada. Faça login novamente.' });
};

// Rate Limiter Rígido para Login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 3,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Muitas tentativas incorretas. Login bloqueado por 15 minutos.',
      retryAfterMinutes: 15
    });
  }
});

// POST /api/admin/login
router.post('/login', loginLimiter, async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Usuário e senha são obrigatórios.' });
  }

  try {
    // Anti-Enumeration: Consulta Genérica com Prepared Statement
    const { rows } = await pool.query('SELECT * FROM admin_users WHERE username = $1', [username]);
    const user = rows[0];

    let passwordValid = false;
    if (user) {
      passwordValid = await bcrypt.compare(password, user.password_hash);
    }

    if (!user || !passwordValid) {
      return res.status(401).json({ error: 'Usuário ou senha incorretos.' });
    }

    // Criação da Sessão do Usuário
    req.session.admin = {
      id: user.id,
      username: user.username
    };

    res.json({ message: 'Autenticado com sucesso!', username: user.username });
  } catch (err) {
    console.error('Erro no login:', err);
    res.status(500).json({ error: 'Erro interno no servidor.' });
  }
});

// POST /api/admin/logout
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ error: 'Erro ao encerrar sessão.' });
    res.clearCookie('connect.sid');
    res.json({ message: 'Sessão encerrada com sucesso.' });
  });
});

// GET /api/admin/check
router.get('/check', (req, res) => {
  if (req.session && req.session.admin) {
    return res.json({ authenticated: true, user: req.session.admin });
  }
  res.json({ authenticated: false });
});

// --- CRUD DE PRODUTOS ---

// Listar todos os produtos (Painel)
router.get('/products', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM products ORDER BY id DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar produtos.' });
  }
});

// Criar novo produto
router.post('/products', requireAuth, async (req, res) => {
  const { name, description, price, category_slug, image_url, stock, featured } = req.body;

  try {
    const query = `
      INSERT INTO products (name, description, price, category_slug, image_url, stock, featured)
      VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *;
    `;
    const values = [name, description, parseFloat(price), category_slug, image_url, parseInt(stock, 10), !!featured];
    const { rows } = await pool.query(query, values);
    
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao cadastrar produto.' });
  }
});

// Atualizar produto
router.put('/products/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { name, description, price, category_slug, image_url, stock, featured } = req.body;

  try {
    const query = `
      UPDATE products 
      SET name = $1, description = $2, price = $3, category_slug = $4, image_url = $5, stock = $6, featured = $7
      WHERE id = $8 RETURNING *;
    `;
    const values = [name, description, parseFloat(price), category_slug, image_url, parseInt(stock, 10), !!featured, id];
    const { rows } = await pool.query(query, values);

    if (rows.length === 0) return res.status(404).json({ error: 'Produto não encontrado.' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar produto.' });
  }
});

// Excluir produto
router.delete('/products/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  try {
    const { rowCount } = await pool.query('DELETE FROM products WHERE id = $1', [id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Produto não encontrado.' });
    res.json({ message: 'Produto removido com sucesso.' });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao excluir produto.' });
  }
});

export default router;