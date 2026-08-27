import { Router } from 'express';
import { query } from '../config/db.js';

const router = Router();

// GET /api/categories - Retorna todas as categorias cadastradas
router.get('/categories', async (req, res, next) => {
  try {
    const result = await query(
      'SELECT id, name, slug FROM categories ORDER BY name ASC'
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// GET /api/products - Lista produtos com filtro opcional por categoria ou busca
router.get('/products', async (req, res, next) => {
  try {
    const { category, search } = req.query;
    let sql = `
      SELECT p.id, p.name, p.description, p.price, p.image_url, p.featured,
             c.name AS category_name, c.slug AS category_slug
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (category && category !== 'all') {
      params.push(category);
      sql += ` AND c.slug = $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      sql += ` AND (p.name ILIKE $${params.length} OR p.description ILIKE $${params.length})`;
    }

    sql += ' ORDER BY p.featured DESC, p.id DESC';

    const result = await query(sql, params);
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// GET /api/products/:id - Retorna os detalhes de um produto específico
router.get('/products/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await query(
      `SELECT p.id, p.name, p.description, p.price, p.image_url, p.featured,
              c.name AS category_name, c.slug AS category_slug
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Produto não encontrado.' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

export default router;