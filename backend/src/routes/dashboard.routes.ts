// backend/routes/dashboard.routes.ts
import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller';

const router = Router();

router.get('/estadisticas', DashboardController.getStats);
router.get('/clientes-recientes', DashboardController.getRecentClients);
router.get('/pagos-pendientes', DashboardController.getPendingPayments);
router.get('/resumen', DashboardController.getFullDashboard);

export default router;