const express = require('express');
const session = require('express-session');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { initDb } = require('./src/config/db');
const seedAdmin = require('./seed-admin'); // Importa o script de seed

const publicRoutes = require('./src/routes/public.routes');
const adminRoutes = require('./src/routes/admin.routes');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('trust proxy', 1);

app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: { error: 'Muitas requisições criadas deste IP, tente novamente mais tarde.' }
});
app.use(limiter);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    name: 'tozzi_sid',
    secret: process.env.SESSION_SECRET || 'tozzi_secret_key_prod_2026',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24
    }
  })
);

app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/public', publicRoutes);
app.use('/api/admin', adminRoutes);

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin', 'index.html'));
});

app.get('/admin/dashboard', (req, res) => {
  if (req.session && req.session.adminId) {
    return res.sendFile(path.join(__dirname, 'public', 'admin', 'dashboard.html'));
  }
  res.redirect('/admin');
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Inicialização Automática do Servidor, Banco e Usuário Admin
async function startServer() {
  try {
    await initDb();
    console.log('✅ Banco de dados PostgreSQL conectado e tabelas sincronizadas.');
    
    // Auto-executa o seed no start do servidor
    await seedAdmin();

    app.listen(PORT, () => console.log(`🚀 Servidor rodando na porta ${PORT}`));
  } catch (error) {
    console.error('❌ Erro crítico na inicialização:', error);
    process.exit(1);
  }
}

startServer();