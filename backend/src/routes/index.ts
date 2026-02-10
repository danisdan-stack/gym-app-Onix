import { Router } from 'express';
import clientesRoutes from './clientes.routes';
import pagosRoutes from './pagos.routes';
import carnetsRoutes from './carnets.routes';
import dashboardRoutes from './dashboard.routes';
const router = Router();

router.use('/clientes', clientesRoutes);
router.use('/pagos', pagosRoutes);
router.use('/carnets', carnetsRoutes);
router.use('/dashboard', dashboardRoutes);
export default router;
