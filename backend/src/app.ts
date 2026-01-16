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
import pool from './config/database'; 

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
// CONFIGURACIÓN CORS CORREGIDA
// ======================

// Lista de orígenes permitidos
const allowedOrigins = [
  'https://gym-app-frontend-a7jl.onrender.com', // FRONTEND en Render
  'https://gym-app-n77p.onrender.com',          // BACKEND en Render
  'http://localhost:8100',                      // Ionic local
  'http://localhost:4200',                      // Angular local
  'http://localhost:3000'                       // Backend local
];

// Opciones de CORS
const corsOptions = {
  origin: function (origin, callback) {
    // Permite solicitudes sin origen (como mobile apps, curl, postman, etc.)
    if (!origin) {
      return callback(null, true);
    }
    
    // Verificar si el origen está en la lista blanca
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log(`⚠️  Origen bloqueado por CORS: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'Accept', 
    'Origin', 
    'X-Requested-With',
    'X-Access-Token'
  ],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400 // 24 horas para cache de preflight
};

// Aplicar CORS globalmente
app.use(cors(corsOptions));

// IMPORTANTE: Manejar solicitudes OPTIONS (preflight) para todas las rutas
app.options('*', cors(corsOptions));

// ======================
// MIDDLEWARES GLOBALES
// ======================
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 📁 SERVIR ARCHIVOS ESTÁTICOS (carnets PNG)
app.use('/storage', express.static(path.join(__dirname, '../storage')));

// ======================
// DIAGNÓSTICO DE BASE DE DATOS
// ======================
app.get('/api/db-test', async (req, res) => {
  console.log('🔍 Testing DB connection from endpoint...');
  
  try {
    // 1. Verificar si pool está definido
    if (!pool) {
      return res.status(500).json({ error: 'Pool no inicializado' });
    }
    
    // 2. Probar conexión básica
    const timeResult = await pool.query('SELECT NOW() as current_time');
    console.log('✅ SELECT NOW() funcionó');
    
    // 3. Verificar tabla clientes
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'clientes' 
        AND table_schema = 'public'
      ) as table_exists
    `);
    
    const tableExists = tableCheck.rows[0].table_exists;
    console.log('✅ Tabla clientes existe:', tableExists);
    
    // 4. Si existe, contar registros
    let count = 0;
    if (tableExists) {
      const countResult = await pool.query('SELECT COUNT(*) FROM clientes');
      count = parseInt(countResult.rows[0].count);
      console.log('✅ Total clientes:', count);
    }
    
    res.json({
      status: 'success',
      database: {
        connected: true,
        current_time: timeResult.rows[0].current_time,
        table_exists: tableExists,
        client_count: count
      },
      environment: {
        node_env: process.env.NODE_ENV,
        database_url_configured: !!process.env.DATABASE_URL
      }
    });
    
  } catch (error: any) {
    console.error('❌ DB Error:', error.message);
    console.error('Error code:', error.code);
    
    res.status(500).json({
      status: 'error',
      error: error.message,
      code: error.code,
      stack: process.env.NODE_ENV === 'production' ? undefined : error.stack,
      suggestion: 'Verificar conexión SSL a Supabase'
    });
  }
});

// Endpoint de diagnóstico profundo
app.get('/api/debug-clientes', async (req, res) => {
  console.log('🔍 DEBUG /api/clientes iniciando...');
  
  try {
    // 1. Verificar pool
    console.log('1. ✅ Pool disponible:', !!pool);
    
    // 2. Verificar conexión básica
    const test1 = await pool.query('SELECT 1 as test');
    console.log('2. ✅ SELECT 1 OK:', test1.rows[0]);
    
    // 3. Verificar si tabla cliente existe
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'cliente'
      ) as table_exists
    `);
    
    const tableExists = tableCheck.rows[0].table_exists;
    console.log('3. ✅ Tabla "cliente" existe:', tableExists);
    
    if (!tableExists) {
      return res.json({
        success: false,
        error: 'Tabla "cliente" no existe en la base de datos',
        solution: 'Ejecuta CREATE TABLE cliente (...) en Supabase'
      });
    }
    
    // 4. Ver estructura de la tabla
    const structure = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'cliente'
      ORDER BY ordinal_position
    `);
    
    console.log('4. ✅ Estructura tabla:');
    structure.rows.forEach(col => {
      console.log(`   - ${col.column_name} (${col.data_type})`);
    });
    
    // 5. Intentar SELECT simple
    const sampleData = await pool.query('SELECT * FROM cliente LIMIT 5');
    console.log('5. ✅ Datos de ejemplo:', sampleData.rows);
    
    res.json({
      success: true,
      table_exists: tableExists,
      table_structure: structure.rows,
      sample_data: sampleData.rows,
      total_records: sampleData.rowCount
    });
    
  } catch (error: any) {
    console.error('❌ DEBUG ERROR:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      code: error.code,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});
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

// Header adicional para evitar advertencias
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
  console.log('🌐 CORS Configurado para:');
  allowedOrigins.forEach(origin => console.log(`   ✅ ${origin}`));
  console.log('🚀 ========================================');
});