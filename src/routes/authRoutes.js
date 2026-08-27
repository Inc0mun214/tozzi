const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'chave_secreta_fallback';
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'admin123';

// POST: Rota de Login
router.post('/login', async (req, res) => {
  const { usuario, senha } = req.body;

  try {
    if (usuario === ADMIN_USER && senha === ADMIN_PASS) {
      const token = jwt.sign(
        { id: 1, usuario: ADMIN_USER, role: 'admin' },
        JWT_SECRET,
        { expiresIn: '8h' }
      );

      return res.json({
        message: 'Login realizado com sucesso!',
        user: { id: 1, usuario: ADMIN_USER },
        token
      });
    }

    res.status(401).json({ error: 'Usuário ou senha inválidos' });
  } catch (err) {
    console.error('Erro no login:', err);
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
});

module.exports = router;