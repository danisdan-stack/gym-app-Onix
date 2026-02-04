import { Router } from 'express';
import clientesRoutes from './clientes.routes';
import pagosRoutes from './pagos.routes';
import carnetsRoutes from './carnets.routes';

const router = Router();

router.use('/clientes', clientesRoutes);
router.use('/pagos', pagosRoutes);
router.use('/carnets', carnetsRoutes);

export default router;
