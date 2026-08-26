const pool = require('../config/db');

exports.listarProdutos = async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM produtos ORDER BY id DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar produtos' });
  }
};

exports.criarProduto = async (req, res) => {
  const { nome, categoria, preco, descricao, imagem } = req.body;
  try {
    const query = `
      INSERT INTO produtos (nome, categoria, preco, descricao, imagem)
      VALUES ($1, $2, $3, $4, $5) RETURNING *
    `;
    const { rows } = await pool.query(query, [nome, categoria, preco, descricao, imagem]);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao salvar produto' });
  }
};