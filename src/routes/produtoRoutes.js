const express = require('express');
const router = express.Router();
const produtoController = require('../controllers/produtoController');

// Se estiver usando o middleware de autenticação opcionalmente:
// const authMiddleware = require('../middlewares/authMiddleware');

router.get('/', produtoController.listarProdutos);
router.post('/', produtoController.criarProduto);
router.put('/:id', produtoController.atualizarProduto);
router.delete('/:id', produtoController.deletarProduto);

module.exports = router;