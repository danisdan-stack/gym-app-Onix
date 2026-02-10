import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';

import routes from './routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

/* ======================
   CORS
====================== */
const allowedOrigins = [
  'https://gym-app-onix-frontend.onrender.com',
  
  'http://localhost:8100',
  'http://localhost:4200',
  'http://localhost:3000'
];

app.use(cors({
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

app.options('*', cors());

/* ======================
   MIDDLEWARES
====================== */
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));



/* ======================
   STATIC FILES
====================== */
app.use('/storage', express.static(path.join(__dirname, '../storage')));

app.get('/test', (req, res) => {
  res.json({ ok: true });
});

/* ======================
   ROUTES
====================== */
app.use('/api', routes);

/* ======================
   HEALTH CHECK
====================== */
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Onix Gym Backend',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

/* ======================
   404
====================== */
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Ruta no encontrada',
    path: req.originalUrl
  });
});

/* ======================
   ERROR HANDLER
====================== */
app.use((err: any, req: any, res: any, next: any) => {
  console.error(err);
  res.status(500).json({
    error: 'Error interno',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

/* ======================
   START SERVER
====================== */
app.listen(PORT, () => {
  console.log('🏋️‍♂️ ONIX GYM BACKEND INICIADO');
  console.log(`📍 Puerto: ${PORT}`);
});