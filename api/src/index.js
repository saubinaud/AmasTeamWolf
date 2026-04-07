const express = require('express');
const cors = require('cors');

const asistenciaRoutes = require('./routes/asistencia');
const matriculaRoutes = require('./routes/matricula');
const perfilRoutes = require('./routes/perfil');
const vincularRoutes = require('./routes/vincular');
const graduacionRoutes = require('./routes/graduacion');
const leadershipRoutes = require('./routes/leadership');
const implementosRoutes = require('./routes/implementos');
const torneoRoutes = require('./routes/torneo');
const renovacionRoutes = require('./routes/renovacion');
const leadsRoutes = require('./routes/leads');
const qrRoutes = require('./routes/qr');
const contratosRoutes = require('./routes/contratos');

// Validate required environment variables
const REQUIRED_ENV = ['DB_HOST', 'DB_PASS', 'DB_NAME', 'DB_USER'];
const missing = REQUIRED_ENV.filter(k => !process.env[k]);
if (missing.length > 0) {
  console.warn(`[WARN] Missing env vars: ${missing.join(', ')} — using defaults where available`);
}

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors({
  origin: [
    'https://amasteamwolf.com',
    'https://www.amasteamwolf.com',
    'https://amas-api.s6hx3x.easypanel.host',
    'http://localhost:5173',
    'http://localhost:3000',
  ],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '15mb' }));

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/asistencia', asistenciaRoutes);
app.use('/api/matricula', matriculaRoutes);
app.use('/api/perfil', perfilRoutes);
app.use('/api/vincular', vincularRoutes);
app.use('/api/graduacion', graduacionRoutes);
app.use('/api/leadership', leadershipRoutes);
app.use('/api/implementos', implementosRoutes);
app.use('/api/torneo', torneoRoutes);
app.use('/api/renovacion', renovacionRoutes);
app.use('/api/leads', leadsRoutes);
app.use('/api/qr', qrRoutes);
app.use('/api/contratos', contratosRoutes);

// 404
app.use((_req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Error handler global
app.use((err, _req, res, _next) => {
  console.error('Error no manejado:', err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`AMAS API corriendo en puerto ${PORT}`);
});
