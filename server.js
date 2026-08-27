import express from 'express';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import { pool, initDb } from './src/config/db.js';
import publicRoutes from './src/routes/public.routes.js';
import adminRoutes from './src/routes/admin.routes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const PgStore = connectPgSimple(session);

// Mandatory for Render Reverse Proxy
app.set('trust proxy', 1);

// Hardening de Segurança via Helmet
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com", "https://cdnjs.cloudflare.com"],
        fontSrc: ["'self'", "https://cdnjs.cloudflare.com"],
        imgSrc: ["'self'", "data:", "https://images.unsplash.com", "https://*.unsplash.com"],
        connectSrc: ["'self'"],
        frameAncestors: ["'none'"],
        objectSrc: ["'none'"],
      },
    },
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuração de Sessão Segura persistida em PostgreSQL
app.use(
  session({
    store: new PgStore({
      pool: pool,
      tableName: 'user_sessions',
      createTableIfMissing: true,
    }),
    secret: process.env.SESSION_SECRET || 'tozzi_secret_key_cerquilho_default',
    resave: false,
    saveUninitialized: false,
    name: 'tozzi_sid',
    cookie: {
      maxAge: 8 * 60 * 60 * 1000, // 8 Horas
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    },
  })
);

// Rotas Estáticas
app.use(express.static(path.join(__dirname, 'public')));

// Atribuição das Rotas de API
app.use('/api', publicRoutes);
app.use('/api/admin', adminRoutes);

// Fallback do SPA Administrative e Public Routing
app.get('/admin/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin', 'index.html'));
});

// Handler Global de Erro
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Ocorreu um erro interno no servidor.' });
});

// Inicialização com tratamento do DB
async function bootstrap() {
  try {
    await initDb();
    app.listen(PORT, () => {
      console.log(`🚀 Servidor Tozzi Materiais Elétricos rodando na porta ${PORT}`);
    });
  } catch (err) {
    console.error('Falha crítica ao iniciar servidor:', err);
    process.exit(1);
  }
}

bootstrap();