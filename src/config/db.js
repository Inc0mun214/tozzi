import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Configuração do Pool otimizado para PostgreSQL no Render
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Inicialização e automigração do Banco de Dados
export async function initDb() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Tabela de Categorias
    await client.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        slug VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(100) NOT NULL
      );
    `);

    // 2. Tabela de Produtos
    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        description TEXT,
        price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
        category_slug VARCHAR(50) REFERENCES categories(slug) ON UPDATE CASCADE ON DELETE RESTRICT,
        image_url VARCHAR(500),
        stock INT DEFAULT 0 CHECK (stock >= 0),
        featured BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 3. Tabela de Usuários Administrativos
    await client.query(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 4. Trigger de Atualização Automática do updated_at
    await client.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
         NEW.updated_at = CURRENT_TIMESTAMP;
         RETURN NEW;
      END;
      $$ language 'plpgsql';

      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_products') THEN
          CREATE TRIGGER set_updated_at_products
          BEFORE UPDATE ON products
          FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
        END IF;
      END
      $$;
    `);

    // 5. Seeds Iniciais com Trava de Segurança
    const { rows } = await client.query('SELECT COUNT(*) FROM products;');
    if (parseInt(rows[0].count, 10) === 0) {
      // Inserir categorias padrões de materiais elétricos
      await client.query(`
        INSERT INTO categories (slug, name) VALUES
          ('fios_e_cabos', 'Fios e Cabos'),
          ('iluminacao', 'Iluminação'),
          ('disjuntores_e_quadros', 'Disjuntores e Quadros'),
          ('ferramentas', 'Ferramentas Elétricas')
        ON CONFLICT (slug) DO NOTHING;
      `);

      // Inserir produtos de teste
      await client.query(`
        INSERT INTO products (name, description, price, category_slug, image_url, stock, featured) VALUES
          ('Cabo Flexível 2,5mm² 100m Antichama', 'Ideal para circuitos de tomadas residenciais. Marca aprovada pelo INMETRO.', 189.90, 'fios_e_cabos', 'https://images.unsplash.com/photo-1544724569-5f546fd6f2b5?auto=format&fit=crop&q=80&w=600', 50, true),
          ('Lâmpada LED Bulbo 9W Bivolt 6500K', 'Luz branca fria. Economia de até 85% de energia.', 8.50, 'iluminacao', 'https://images.unsplash.com/photo-1550985616-10810253b84d?auto=format&fit=crop&q=80&w=600', 200, true),
          ('Disjuntor Monopolar DIN 20A Stronge', 'Proteção essencial contra sobrecargas e curtos-circuitos em instalações.', 14.90, 'disjuntores_e_quadros', 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&q=80&w=600', 80, false),
          ('Alicate Decapador e Prensador Multifuncional', 'Ferramenta profissional para corte e decapagem de fios de 0.2 a 6.0mm².', 65.00, 'ferramentas', 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&q=80&w=600', 15, true);
      `);
    }

    await client.query('COMMIT');
    console.log('✅ Banco de dados inicializado com sucesso.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Erro durante a inicialização do Banco de Dados:', err);
    throw err;
  } finally {
    client.release();
  }
}