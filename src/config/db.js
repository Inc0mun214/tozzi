import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pkg;

// Pool de conexão PostgreSQL
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('localhost') 
    ? { rejectUnauthorized: false } 
    : false
});

// Inicializador de tabelas
export async function initDb() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Tabela de Categorias
    await client.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        slug VARCHAR(100) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Tabela de Produtos
    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
        image_url TEXT,
        featured BOOLEAN DEFAULT FALSE,
        category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query('COMMIT');
    console.log('✅ Banco de dados PostgreSQL inicializado com sucesso.');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Erro ao inicializar tabelas no PostgreSQL:', error);
    throw error;
  } finally {
    client.release();
  }
}

export const query = (text, params) => pool.query(text, params);