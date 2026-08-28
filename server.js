// server.js
const express = require('express');
const session = require('express-session');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { initDb } = require('./src/config/db');

const publicRoutes = require('./src/routes/public.routes');
const adminRoutes = require('./src/routes/admin.routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuração de Segurança com Helmet (Ajustado para liberar scripts externos como Tailwind e GSAP)
app.use(
  helmet({
    contentSecurityPolicy: false, // Desabilitado para permitir scripts/CDN externos como GSAP e Google Maps Iframe sem bloqueio
  })
);

// Limite de Requisições
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: 'Muitas requisições criadas deste IP, tente novamente mais tarde.' }
});
app.use(limiter);

// Middlewares de Parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuração de Sessão Segura
app.set('trust proxy', 1); // Importante para o Render (proxy reverso HTTPS)
app.use(
  session({
    name: 'tozzi_sid',
    secret: process.env.SESSION_SECRET || 'tozzi_secret_key_default_2026',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 // 24 horas
    }
  })
);

// Servir arquivos estáticos (Garante que a raiz encontre o index.html e assets)
app.use(express.static(path.join(__dirname, 'public')));

// Rotas da API
app.use('/api/public', publicRoutes);
app.use('/api/admin', adminRoutes);

// Rota Fallback para servir o index.html na raiz
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Inicialização do Servidor e Banco de Dados
async function startServer() {
  try {
    await initDb();
    console.log('✅ Banco de dados conectado e inicializado.');
    
    app.listen(PORT, () => {
      console.log(`🚀 Servidor rodando na porta ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Erro ao inicializar o servidor:', error);
    process.exit(1);
  }
}

startServer();