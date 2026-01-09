// src/routes/cliente.routes.ts
import { Router } from 'express';
import { 
  registrarCliente, 
  listarClientes, 
  obtenerCliente,
  actualizarCliente ,
  registrarClienteRapido,
   listarClientesSimplificado, 
   listarClientesConCarnet,
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

router.post('/rapido', registrarClienteRapido);   

router.get('/simplificado/listar', listarClientesSimplificado);

router.get('/clientes-con-carnet', listarClientesConCarnet);

// GET /api/clientes/simplificado - Listar clientes simplificado
router.get('/simplificado', listarClientesSimplificado); // Cambiado

// GET /api/clientes/con-carnet - Listar clientes con carnet activo
router.get('/con-carnet', listarClientesConCarnet); // Cambiado

export default router;