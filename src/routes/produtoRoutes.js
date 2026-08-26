const express = require('express');
const router = express.Router();
const produtoController = require('../controllers/produtoController');
const authMiddleware = require('../middlewares/authMiddleware');

// Rota pública (qualquer um pode listar)
router.get('/', produtoController.listarProdutos);

// Rotas protegidas por JWT (exigem o header 'Authorization: Bearer <TOKEN>')
router.post('/', authMiddleware, produtoController.criarProduto);
router.put('/:id', authMiddleware, produtoController.atualizarProduto);
router.delete('/:id', authMiddleware, produtoController.deletarProduto);

module.exports = router;