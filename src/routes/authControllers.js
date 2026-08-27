const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'chave_secreta_fallback';
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'admin123';

exports.login = async (req, res) => {
  const { usuario, senha } = req.body;

  try {
    // 1. Checagem por Credenciais de Ambiente (Admin do Sistema)
    if (usuario === ADMIN_USER) {
      // Se a senha de ambiente for texto puro ou hash, valida
      const senhaValida = senha === ADMIN_PASS || await bcrypt.compare(senha, ADMIN_PASS).catch(() => false);

      if (!senhaValida) {
        return res.status(401).json({ error: 'Usuário ou senha inválidos' });
      }

      const token = jwt.sign(
        { id: 1, usuario: ADMIN_USER, role: 'admin' },
        JWT_SECRET,
        { expiresIn: '8h' }
      );

      return res.json({
        message: 'Login de administrador realizado com sucesso!',
        user: { id: 1, usuario: ADMIN_USER, email: 'admin@tozzi.com' },
        token
      });
    }

    // 2. Checagem Secundária no Banco de Dados (Usuários Comuns)
    const { rows } = await pool.query('SELECT * FROM usuarios WHERE usuario = $1', [usuario]);

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Usuário ou senha inválidos' });
    }

    const user = rows[0];
    const senhaValida = await bcrypt.compare(senha, user.senha);

    if (!senhaValida) {
      return res.status(401).json({ error: 'Usuário ou senha inválidos' });
    }

    const token = jwt.sign(
      { id: user.id, usuario: user.usuario, role: 'user' },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      message: 'Login realizado com sucesso!',
      user: { id: user.id, usuario: user.usuario, email: user.email },
      token
    });
  } catch (err) {
    console.error('Erro ao realizar login:', err);
    res.status(500).json({ error: 'Erro interno no login' });
  }
};