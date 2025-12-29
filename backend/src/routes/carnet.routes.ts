// src/routes/carnet.routes.ts
import { Router } from 'express';
import { 
  descargarCarnetPNG, 
  verCarnet,
  healthCheck 
} from '../controllers/carnet.controller'; // Ajusta la ruta

const router = Router();

// GET /api/carnets/descargar/:id
router.get('/descargar/:id', descargarCarnetPNG);

// GET /api/carnets/ver/:id
router.get('/ver/:id', verCarnet);

// GET /api/carnets/health
router.get('/health', healthCheck);

export default router;