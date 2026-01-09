// src/routes/pago.routes.ts - SOLO RUTAS
import { Router } from 'express';
import { 
  registrarPago, 
  listarPagos,
  obtenerPago,
  actualizarPago,
  notificarProximosVencimientos,
  obtenerPagosPorCliente,
  listarClientesConEstado,
  registrarPagoCliente
} from '../controllers/pago.controller';

const router = Router();

// POST /api/pagos - Registro general
router.post('/', registrarPago);

// POST /api/pagos/cliente - Registro específico desde página web
router.post('/cliente', registrarPagoCliente);

// GET /api/pagos/clientes - Lista clientes con estado de pago
router.get('/clientes', listarClientesConEstado);

// GET /api/pagos - Lista pagos
router.get('/', listarPagos);

// GET /api/pagos/notificar-vencimientos
router.get('/notificar-vencimientos', notificarProximosVencimientos);

// Rutas por ID
router.get('/:id', obtenerPago);
router.put('/:id', actualizarPago);

// Rutas por cliente
router.get('/cliente/:clienteId', obtenerPagosPorCliente);

export default router;