import { Router } from 'express';
import { PagoController } from '../controllers/pago.controller';

const router = Router();
const controller = new PagoController();

/**
 * Registrar nuevo pago
 * NO crea clientes
 * NO genera carnet automáticamente
 */
router.post('/', controller.registrarPago.bind(controller));

export default router;
