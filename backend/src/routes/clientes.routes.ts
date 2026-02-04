import { Router } from 'express';
import { ClienteController } from '../controllers/cliente.controller';

const router = Router();
const controller = new ClienteController();

router.post('/alta', controller.altaCompleta.bind(controller));
router.get('/simplificado', controller.listarClientesSimplificado.bind(controller));
router.get('/con-carnet', controller.listarClientesConCarnet.bind(controller));

export default router;
