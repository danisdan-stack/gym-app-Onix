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
import dashboardRoutes from './routes/dashboard.routes';
// import twilioRoutes from './routes/twilio.routes'; // DESHABILITADO
// Importar los controladores que necesitas
import { 
  listarClientesConCarnet, 
  listarClientesSimplificado 
} from './controllers/cliente.controller';

// Cargar variables de entorno
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ======================
// MIDDLEWARES GLOBALES
// ======================
app.use(helmet());

// Configurar CORS correctamente (solo una vez)
app.use(cors({
  origin: ['http://localhost:8100', 'http://localhost:4200'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 📁 SERVIR ARCHIVOS ESTÁTICOS (carnets PNG)
app.use('/storage', express.static(path.join(__dirname, '../storage')));

// ======================
// REGISTRAR TODAS LAS RUTAS
// ======================
app.use('/api/auth', authRoutes);           // Login, registro
app.use('/api/clientes', clienteRoutes);    // Gestión de clientes
app.use('/api/pagos', pagoRoutes);          // Registrar pagos + generar carnets
app.use('/api/carnets', carnetRoutes);      // Descargar/ver carnets
app.use('/api/entrenadores', entrenadorRoutes); // Gestión entrenadores
app.use('/api/v1/dashboard', dashboardRoutes);

// ======================
// RUTAS ESPECIALES (AGREGADAS)
// ======================
app.get('/api/clientes-con-carnet', listarClientesConCarnet);
app.get('/api/clientes-simplificado', listarClientesSimplificado);

// Ruta para favicon (evita error 404)
app.get('/favicon.ico', (req, res) => {
  res.status(204).end(); // No Content
});

// COMENTAR O ELIMINAR ESTA LÍNEA:
// app.use('/api/twilio', twilioRoutes);

// ======================
// RUTAS DE HEALTH CHECK
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
      'clientes-con-carnet': '/api/clientes-con-carnet', // Agregado
      'clientes-simplificado': '/api/clientes-simplificado', // Agregado
      pagos: '/api/pagos',
      carnets: '/api/carnets',
      entrenadores: '/api/entrenadores',
      dashboard: '/api/v1/dashboard'
      // twilio: '/api/twilio' // REMOVER
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
        'clientes-con-carnet': 'GET /api/clientes-con-carnet', // Agregado
        'clientes-simplificado': 'GET /api/clientes-simplificado', // Agregado
        buscar_cliente: 'GET /api/clientes?buscar=nombre',
        
        // Pagos
        registrar_pago: 'POST /api/pagos',
        historial_pagos: 'GET /api/pagos/cliente/:id',
        
        // Carnets
        descargar_carnet: 'GET /api/carnets/descargar/:id',
        ver_carnet: 'GET /api/carnets/ver/:id',
        
        // Entrenadores
        listar_entrenadores: 'GET /api/entrenadores'
        
        // Twilio deshabilitado
        // twilio: 'GET /api/twilio/status - DESHABILITADO'
      },
      status: 'active',
      servicios: {
        twilio: 'deshabilitado'
      }
    }
  });
});

// ======================
// RUTA DE BIENVENIDA (solo una, eliminado el duplicado)
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
        'clientes-con-carnet': 'GET /api/clientes-con-carnet',
        'clientes-simplificado': 'GET /api/clientes-simplificado',
        pagos: 'POST /api/pagos',
        carnets: 'GET /api/carnets/descargar/:id',
        entrenadores: 'GET /api/entrenadores',
        dashboard: 'GET /api/v1/dashboard/estadisticas'
      },
      
      servicios: {
        twilio: 'DESHABILITADO - Configura credenciales para habilitar'
      }
    }
  });
});

// ======================
// MANEJO DE RUTAS NO ENCONTRADAS
// ======================
app.use('*', (req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Ruta no encontrada',
    path: req.originalUrl,
    sugerencias: [
      '/api/clientes',
      '/api/clientes-con-carnet',
      '/api/clientes-simplificado',
      '/api/pagos',
      '/health',
      '/api/v1/health'
    ]
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

app.use((req, res, next) => {
  res.setHeader('ngrok-skip-browser-warning', 'true');
  next();
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
  console.log(`   👥 http://localhost:${PORT}/api/clientes`);
  console.log(`   🎫 http://localhost:${PORT}/api/clientes-con-carnet`);
  console.log(`   📋 http://localhost:${PORT}/api/clientes-simplificado`);
  console.log(`   ⚠️  /api/twilio - DESHABILITADO`);
  console.log('🚀 ========================================');
});