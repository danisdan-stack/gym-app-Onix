# DOCUMENTACIÓN TÉCNICA: CONEXIÓN FULL STACK GYMNASIO

/* 📋 DOCUMENTACIÓN TÉCNICA: CONEXIÓN FULL STACK GYMNASIO
###🏗️ ARQUITECTURA DEL SISTEMA
###Tecnologías Utilizadas:
Frontend: Ionic 7 + Angular 17 (Standalone Components)

Backend: Node.js + Express + TypeScript

Base de Datos: PostgreSQL 14+

Servidor: Localhost desarrollo

🔗 1. CONEXIÓN FRONTEND-BACKEND
1.1 Configuración Backend (Express/TypeScript)
Archivo: backend/src/app.ts
typescript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

// Configuración CORS crítica
app.use(cors({
  origin: 'http://localhost:8100', // Frontend Ionic
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Endpoint dashboard
app.use('/api/v1/dashboard', dashboardRoutes);
Endpoints implementados:
text
✅ GET  /api/v1/health              → Estado del servidor
✅ GET  /api/v1/dashboard/estadisticas → Estadísticas principales
✅ GET  /api/clientes               → Lista de clientes  
✅ POST /api/pagos                  → Registrar pagos
✅ GET  /api/carnets                → Gestión de carnets
1.2 Configuración Frontend (Angular/Ionic)
Archivo: frontend/src/app/app.config.ts
typescript
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(),          // ✅ Habilitar peticiones HTTP
    provideIonicAngular({})       // ✅ Proveer controladores Ionic
  ]
};
Servicio Dashboard: dashboard.service.ts
typescript
export class DashboardService {
  private apiUrl = `${environment.apiUrl}/dashboard`;

  constructor(private http: HttpClient) {}

  getDashboardStats(): Observable<any> {
    return this.http.get(`${this.apiUrl}/estadisticas`);
  }
}
Variables de entorno: environment.ts
typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api/v1'  // URL base del backend
};
🗄️ 2. CONFIGURACIÓN BASE DE DATOS POSTGRESQL
2.1 Estructura de Tablas
Migraciones implementadas:
sql
-- 001_create_usuario.sql
CREATE TABLE usuario (
    id SERIAL PRIMARY KEY,
    username VARCHAR(150) UNIQUE NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    rol VARCHAR(20) NOT NULL CHECK (rol IN ('admin', 'entrenador', 'cliente')),
    activo BOOLEAN DEFAULT TRUE
);

-- 002_create_cliente.sql  
CREATE TABLE cliente (
    usuario_id INTEGER PRIMARY KEY REFERENCES usuario(id),
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    estado_cuota VARCHAR(20) DEFAULT 'inactivo'
        CHECK (estado_cuota IN ('activo', 'inactivo', 'suspendido')),
    fecha_inscripcion DATE DEFAULT CURRENT_DATE,
    fecha_vencimiento DATE
);

-- 004_create_pagos.sql
CREATE TABLE pagos (
    id SERIAL PRIMARY KEY,
    cliente_id INTEGER NOT NULL REFERENCES cliente(usuario_id),
    monto DECIMAL(10,2) NOT NULL,
    estado VARCHAR(20) DEFAULT 'pendiente'
        CHECK (estado IN ('pagado', 'pendiente', 'anulado', 'vencido'))
);
2.2 Conexión a PostgreSQL
Archivo: backend/src/config/database.ts
typescript
import { Pool } from 'pg';

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'bd_gym',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres123',
  max: 20,
  idleTimeoutMillis: 30000
});

export { pool };
Variables de entorno (.env):
env
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=bd_gym
DB_USER=postgres
DB_PASSWORD=postgres123
JWT_SECRET=tu-super-secreto-jwt-aqui
2.3 Consultas Dashboard
Estadísticas principales:
sql
SELECT 
  COUNT(*) as total_clientes,
  SUM(CASE WHEN estado_cuota = 'activo' THEN 1 ELSE 0 END) as clientes_activos,
  SUM(CASE WHEN estado_cuota = 'inactivo' THEN 1 ELSE 0 END) as clientes_inactivos,
  SUM(CASE WHEN estado_cuota = 'suspendido' THEN 1 ELSE 0 END) as clientes_suspendidos,
  COUNT(CASE WHEN fecha_vencimiento < CURRENT_DATE THEN 1 END) as clientes_vencidos
FROM cliente;
🔄 3. FLUJO DE DATOS COMPLETO
3.1 Secuencia de peticiones:
text
1. Frontend (Ionic) → GET /api/v1/dashboard/estadisticas
2. Backend (Express) → Recibe petición
3. Backend → Consulta PostgreSQL
4. PostgreSQL → Retorna datos estadísticos
5. Backend → Formatea respuesta JSON
6. Frontend → Recibe y muestra datos en dashboard
3.2 Mapeo de datos Backend → Frontend:
typescript
// Backend response
{
  "total_clientes": 17,
  "clientes_activos": 10,
  "clientes_inactivos": 6,
  "clientes_suspendidos": 1,
  "clientes_vencidos": 0
}

// Frontend mapping
processRealData(data: any) {
  this.stats = {
    totalClientes: data.total_clientes,
    clientesActivos: data.clientes_activos,
    clientesInactivos: data.clientes_inactivos,
    clientesSuspendidos: data.clientes_suspendidos,
    clientesVencidos: data.clientes_vencidos
  };
}
🔧 4. CONFIGURACIÓN DE DESARROLLO
4.1 Comandos de ejecución:
bash
# Iniciar backend
cd backend
npm install
npm run dev

# Iniciar frontend
cd frontend
npm install
ionic serve

# Verificar conexión
curl http://localhost:3000/api/v1/health
4.2 Verificación de conexión:
powershell
# Script de prueba completo
Invoke-WebRequest -Uri "http://localhost:3000/api/v1/health" -UseBasicParsing
Invoke-RestMethod -Uri "http://localhost:3000/api/v1/dashboard/estadisticas" -UseBasicParsing
⚠️ 5. SOLUCIÓN DE PROBLEMAS COMUNES
Problema 1: Error CORS
typescript
// Solución: Verificar configuración CORS en backend
app.use(cors({
  origin: 'http://localhost:8100', // Exactamente este puerto
  credentials: true
}));
Problema 2: No provider for HttpClient
typescript
// Solución: Agregar en app.config.ts
providers: [
  provideHttpClient()  // ← Esta línea es crítica
]
Problema 3: No provider for ModalController
typescript
// Solución: Usar provideIonicAngular
providers: [
  provideIonicAngular({})  // ← Provee todos los controladores
]
Problema 4: Base de datos sin datos
sql
-- Activar clientes para pruebas
UPDATE cliente SET estado_cuota = 'activo' WHERE usuario_id <= 10;
📊 6. ESTRUCTURA DE ARCHIVOS
text
onix-gym/
├── backend/
│   ├── src/
│   │   ├── app.ts                  # Punto de entrada
│   │   ├── config/
│   │   │   └── database.ts         # Config PostgreSQL
│   │   ├── controllers/
│   │   │   └── dashboard.controller.ts
│   │   ├── routes/
│   │   │   └── dashboard.routes.ts
│   │   └── models/
│   ├── package.json
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── app.config.ts       # Config Angular
│   │   │   ├── app.component.ts
│   │   │   ├── core/
│   │   │   │   ├── services/
│   │   │   │   │   └── dashboard.service.ts
│   │   │   │   └── models/
│   │   │   └── modules/
│   │   │       └── admin/
│   │   │           └── dashboard/
│   │   │               └── dashboard.page.ts
│   │   └── environments/
│   │       └── environment.ts
│   └── ionic.config.json
└── database/
    └── migrations/                  # Scripts SQL
✅ 7. VERIFICACIÓN FINAL
Checklist de conexión exitosa:
Backend corriendo en http://localhost:3000

Frontend corriendo en http://localhost:8100

CORS configurado correctamente

HttpClient provisto en Angular

Base de datos PostgreSQL conectada

Endpoints respondiendo con datos reales

Dashboard mostrando estadísticas en tiempo real

Comando de verificación final:
powershell
# Debe mostrar datos reales de la base de datos
Invoke-RestMethod -Uri "http://localhost:3000/api/v1/dashboard/estadisticas" -UseBasicParsing*/
# [Contenido completo aquí...]
