// src/routes/cliente.routes.ts
import { Router } from 'express';
import { 
  registrarCliente, 
  listarClientes, 
  obtenerCliente,
  actualizarCliente 
} from '../controllers/cliente.controller';

const router = Router();

// POST /api/clientes - Registrar nuevo cliente (con usuario)
router.post('/', registrarCliente);

// GET /api/clientes - Listar todos los clientes
router.get('/', listarClientes);

// GET /api/clientes/:id - Obtener cliente por ID
router.get('/:id', obtenerCliente);

// PUT /api/clientes/:id - Actualizar cliente
router.put('/:id', actualizarCliente);

export default router;