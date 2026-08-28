const bcrypt = require('bcrypt');
const { pool } = require('./src/config/db');

async function seedAdmin() {
  try {
    // Garante que a tabela 'admins' exista com o nome correto
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const username = 'admin';
    const rawPassword = 'adminpassword123';
    const hash = await bcrypt.hash(rawPassword, 10);

    await pool.query(
      `INSERT INTO admins (username, password_hash)
       VALUES ($1, $2)
       ON CONFLICT (username) 
       DO UPDATE SET password_hash = $2`,
      [username, hash]
    );

    console.log(`✅ Usuário '${username}' configurado com sucesso! Senha: ${rawPassword}`);
  } catch (err) {
    console.error('❌ Erro ao criar/resetar usuário admin:', err);
  } finally {
    await pool.end();
  }
}

seedAdmin();