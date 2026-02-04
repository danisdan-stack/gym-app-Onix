import { Router } from 'express';
import { CarnetController } from '../controllers/carnet.controller';

const router = Router();
const controller = new CarnetController();

/**
 * Obtener carnet activo
 */
router.get('/:cliente_id', controller.obtenerCarnet.bind(controller));

/**
 * Regenerar carnet manual
 */
router.post('/regenerar', controller.regenerarCarnet.bind(controller));

export default router;
