import bcrypt from 'bcrypt';
import { query, pool } from './src/config/db.js';

async function seedAdmin() {
  try {
    // Garante que a tabela exista
    await query(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const username = 'admin';
    const rawPassword = 'adminpassword123'; // Define a senha de acesso aqui
    const hash = await bcrypt.hash(rawPassword, 10);

    await query(
      `INSERT INTO admin_users (username, password_hash)
       VALUES ($1, $2)
       ON CONFLICT (username) 
       DO UPDATE SET password_hash = $2`,
      [username, hash]
    );

    console.log(`✅ Usuário '${username}' configurado com sucesso! Senha: ${rawPassword}`);
  } catch (err) {
    console.error('❌ Erro ao criar/resetar usuário admin:', err);
  } finally {
    pool.end();
  }
}

seedAdmin();