const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');

// GET /api/public/categories
router.get('/categories', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM categories ORDER BY name ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao carregar categorias.' });
  }
});

// GET /api/public/products
router.get('/products', async (req, res) => {
  const { category } = req.query;
  try {
    let query = `
      SELECT p.*, c.name as category_name 
      FROM products p
      LEFT JOIN categories c ON p.category_slug = c.slug
    `;
    const params = [];

    if (category && category !== 'all') {
      query += ` WHERE p.category_slug = $1`;
      params.push(category);
    }

    query += ` ORDER BY p.id DESC`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao carregar produtos.' });
  }
});

module.exports = router;