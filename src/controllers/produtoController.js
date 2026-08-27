const pool = require('../config/db');

exports.listarProdutos = async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM produtos ORDER BY id DESC');
    res.json(rows);
  } catch (err) {
    console.error('Erro ao buscar produtos:', err);
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
    console.error('Erro ao criar produto:', err);
    res.status(500).json({ error: 'Erro ao criar produto' });
  }
};

exports.atualizarProduto = async (req, res) => {
  const { id } = req.params;
  const { nome, categoria, preco, descricao, imagem } = req.body;
  try {
    const query = `
      UPDATE produtos
      SET nome = $1, categoria = $2, preco = $3, descricao = $4, imagem = $5
      WHERE id = $6 RETURNING *
    `;
    const { rows } = await pool.query(query, [nome, categoria, preco, descricao, imagem, id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error('Erro ao atualizar produto:', err);
    res.status(500).json({ error: 'Erro ao atualizar produto' });
  }
};

exports.deletarProduto = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM produtos WHERE id = $1', [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Produto não encontrado' });
    }

    res.json({ message: 'Produto deletado com sucesso' });
  } catch (err) {
    console.error('Erro ao deletar produto:', err);
    res.status(500).json({ error: 'Erro ao deletar produto' });
  }
};