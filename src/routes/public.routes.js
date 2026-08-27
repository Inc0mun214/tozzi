import { Router } from 'express';
import { pool } from '../config/db.js';

const router = Router();

// Buscar todos os produtos com suporte a busca e filtro por categoria
router.get('/products', async (req, res) => {
  try {
    const { category, search } = req.query;
    let query = `
      SELECT p.*, c.name as category_name 
      FROM products p 
      LEFT JOIN categories c ON p.category_slug = c.slug 
      WHERE 1=1
    `;
    const params = [];

    if (category && category !== 'all') {
      params.push(category);
      query += ` AND p.category_slug = $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (p.name ILIKE $${params.length} OR p.description ILIKE $${params.length})`;
    }

    query += ` ORDER BY p.featured DESC, p.created_at DESC`;

    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error('Erro na consulta de produtos:', err);
    res.status(500).json({ error: 'Erro interno ao listar produtos.' });
  }
});

// Listar categorias
router.get('/categories', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM categories ORDER BY name ASC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Erro interno ao buscar categorias.' });
  }
});

export default router;