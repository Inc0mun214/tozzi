const pool = require('../config/db');
const bcrypt = require('bcryptjs');

exports.registrar = async (req, res) => {
  const { usuario, email, senha } = req.body;
  try {
    const saltRounds = 10;
    const senhaHash = await bcrypt.hash(senha, saltRounds);

    const query = `
      INSERT INTO usuarios (usuario, email, senha)
      VALUES ($1, $2, $3)
      RETURNING id, usuario, email
    `;
    const { rows } = await pool.query(query, [usuario, email, senhaHash]);

    res.status(201).json({ message: 'Usuário criado com sucesso!', user: rows[0] });
  } catch (err) {
    console.error('Erro ao registrar usuário:', err);
    res.status(500).json({ error: 'Erro ao cadastrar usuário' });
  }
};

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

    res.json({
      message: 'Login realizado com sucesso!',
      user: { id: user.id, usuario: user.usuario, email: user.email }
    });
  } catch (err) {
    console.error('Erro ao realizar login:', err);
    res.status(500).json({ error: 'Erro interno no login' });
  }
};