import { Router } from 'express';
import { ClienteController ,listarClientesConCarnet,
  listarClientesSimplificado} from '../controllers/cliente.controller';

const router = Router();
const controller = new ClienteController();

/**
 * Alta completa:
 * - usuario
 * - cliente
 * - pago
 * - carnet
 */
router.post('/alta', controller.altaCompleta.bind(controller));
router.get('/con-carnet', listarClientesConCarnet);
router.get('/simplificado', listarClientesSimplificado);

export default router;
