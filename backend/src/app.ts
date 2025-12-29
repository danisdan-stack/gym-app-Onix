import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import pagoRoutes from './routes/pago.routes';
import carnetRoutes from './routes/carnet.routes';
import entrenadorRoutes from './routes/entrenador.routes';
import authRoutes from './routes/auth.routes';
import clienteRoutes from './routes/cliente.routes';

// Cargar variables de entorno
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ======================
// MIDDLEWARES GLOBALES
// ======================
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 📁 SERVIR ARCHIVOS ESTÁTICOS (carnets PNG)
app.use('/storage', express.static(path.join(__dirname, '../storage')));

// ======================
// IMPORTAR TODAS LAS RUTAS
// ======================


// ======================
// REGISTRAR TODAS LAS RUTAS
// ======================
app.use('/api/auth', authRoutes);           // Login, registro
app.use('/api/clientes', clienteRoutes);    // Gestión de clientes
app.use('/api/pagos', pagoRoutes);          // Registrar pagos + generar carnets
app.use('/api/carnets', carnetRoutes);      // Descargar/ver carnets
app.use('/api/entrenadores', entrenadorRoutes); // Gestión entrenadores

// ======================
// RUTAS DE HEALTH CHECK (actualizadas)
// ======================
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: '🏋️‍♂️ Onix Gym Backend está funcionando correctamente',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    rutas_activas: {
      auth: '/api/auth',
      clientes: '/api/clientes',
      pagos: '/api/pagos',
      carnets: '/api/carnets',
      entrenadores: '/api/entrenadores'
    }
  });
});

app.get('/api/v1/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: '✅ API Onix Gym v1 funcionando',
    data: {
      server: 'Express.js',
      database: 'PostgreSQL',
      endpoints: {
        // Auth
        login: 'POST /api/auth/login',
        registro: 'POST /api/auth/register',
        
        // Clientes
        crear_cliente: 'POST /api/clientes',
        listar_clientes: 'GET /api/clientes',
        buscar_cliente: 'GET /api/clientes?buscar=nombre',
        
        // Pagos (LA MÁS IMPORTANTE)
        registrar_pago: 'POST /api/pagos',
        historial_pagos: 'GET /api/pagos/cliente/:id',
        
        // Carnets
        descargar_carnet: 'GET /api/carnets/descargar/:id',
        ver_carnet: 'GET /api/carnets/ver/:id',
        
        // Entrenadores
        listar_entrenadores: 'GET /api/entrenadores'
      },
      status: 'active'
    }
  });
});

// ======================
// RUTA DE BIENVENIDA (actualizada)
// ======================
app.get('/', (req, res) => {
  res.json({
    message: '🏋️‍♂️ Bienvenido a Onix Gym API',
    description: 'Sistema de gestión de gimnasio - Carnets automáticos',
    version: '1.0.0',
    author: 'Onix Gym',
    endpoints: {
      documentacion: '/health',
      api_detalle: '/api/v1/health',
      
      autenticacion: {
        login: 'POST /api/auth/login',
        registro: 'POST /api/auth/register',
        perfil: 'GET /api/auth/me'
      },
      
      gestion: {
        clientes: 'GET /api/clientes',
        pagos: 'POST /api/pagos',
        carnets: 'GET /api/carnets/descargar/:id',
        entrenadores: 'GET /api/entrenadores'
      }
    }
  });
});

// Resto del código igual (manejo de errores, 404, etc.)
// ======================
// RUTA DE BIENVENIDA
// ======================
app.get('/', (req, res) => {
  res.json({
    message: 'Bienvenido a Onix Gym API',
    endpoints: {
      health: '/health',
      api_health: '/api/v1/health',
      documentation: 'Coming soon...'
    },
    version: '1.0.0'
  });
});

// ======================
// MANEJO DE RUTAS NO ENCONTRADAS
// ======================
app.use('*', (req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Ruta no encontrada',
    path: req.originalUrl
  });
});

// ======================
// MANEJO DE ERRORES GLOBAL
// ======================
app.use((error: any, req: any, res: any, next: any) => {
  console.error('Error global:', error);
  res.status(500).json({
    status: 'error',
    message: 'Error interno del servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

// ======================
// INICIAR SERVIDOR
// ======================
app.listen(PORT, () => {
  console.log('🚀 ========================================');
  console.log('🏋️‍♂️ ONIX GYM BACKEND INICIADO CORRECTAMENTE');
  console.log('🚀 ========================================');
  console.log(`📍 Puerto: ${PORT}`);
  console.log(`🌍 Ambiente: ${process.env.NODE_ENV}`);
  console.log(`🕐 Hora: ${new Date().toLocaleString()}`);
  console.log('🔗 Endpoints disponibles:');
  console.log(`   📍 http://localhost:${PORT}`);
  console.log(`   ❤️  http://localhost:${PORT}/health`);
  console.log(`   ✅ http://localhost:${PORT}/api/v1/health`);
  console.log('🚀 ========================================');
});