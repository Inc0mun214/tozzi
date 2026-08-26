const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(express.json());

// Conexão PostgreSQL (Render/Neon ou local)
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/tozzi_db',
    ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

// Sanitização de preço monetário
const parsePreco = (val) => {
    if (typeof val === 'number') return val;
    if (typeof val === 'string') return parseFloat(val.replace(',', '.'));
    return 0.00;
};

// GET /api/produtos
app.get('/api/produtos', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM produtos ORDER BY id DESC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Erro ao buscar produtos', details: err.message });
    }
});

// GET /api/produtos/:id
app.get('/api/produtos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM produtos WHERE id = $1', [id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Produto não encontrado' });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Erro ao buscar produto' });
    }
});

// POST /api/produtos
app.post('/api/produtos', async (req, res) => {
    const { codigo_sku, nome, categoria, material, medidas, preco, imagem_url } = req.body;
    const precoSanitizado = parsePreco(preco);

    try {
        const result = await pool.query(
            `INSERT INTO produtos (codigo_sku, nome, categoria, material, medidas, preco, imagem_url)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [codigo_sku, nome, categoria, material, medidas, precoSanitizado, imagem_url]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(400).json({ error: 'Erro ao cadastrar produto', details: err.message });
    }
});

// PUT /api/produtos/:id
app.put('/api/produtos/:id', async (req, res) => {
    const { id } = req.params;
    const { codigo_sku, nome, categoria, material, medidas, preco, imagem_url } = req.body;
    const precoSanitizado = parsePreco(preco);

    try {
        const result = await pool.query(
            `UPDATE produtos 
             SET codigo_sku=$1, nome=$2, categoria=$3, material=$4, medidas=$5, preco=$6, imagem_url=$7, updated_at=CURRENT_TIMESTAMP
             WHERE id=$8 RETURNING *`,
            [codigo_sku, nome, categoria, material, medidas, precoSanitizado, imagem_url, id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Produto não encontrado' });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(400).json({ error: 'Erro ao atualizar produto', details: err.message });
    }
});

// DELETE /api/produtos/:id
app.delete('/api/produtos/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await pool.query('DELETE FROM produtos WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Produto não encontrado' });
        res.json({ message: 'Produto removido com sucesso' });
    } catch (err) {
        res.status(500).json({ error: 'Erro ao excluir produto' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));