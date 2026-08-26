const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'sua_chave_secreta_super_segura';

exports.login = async (req, res) => {
  const { usuario, senha } = req.body;
  try {
    const { rows } = await pool.query('SELECT * FROM usuarios WHERE usuario = $1', [usuario]);

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Usuário ou senha inválidos' });
    }

    const user = rows[0];
    const senhaValida = await bcrypt.compare(senha, user.senha);

    if (!senhaValida) {
      return res.status(401).json({ error: 'Usuário ou senha inválidos' });
    }

    // Gerar token JWT com expiração de 8 horas
    const token = jwt.sign(
      { id: user.id, usuario: user.usuario },
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