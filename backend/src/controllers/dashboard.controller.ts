// backend/src/controllers/dashboard.controller.ts
import { Request, Response } from 'express';
import { DashboardService } from '../services/dashboard.service';

export class DashboardController {
  

  static async getStats(req: Request, res: Response) {
    try {
      const stats = await DashboardService.getStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  static async getRecentClients(req: Request, res: Response) {
    try {
      const limit = Number(req.query.limit) || 5;
      const clients = await DashboardService.getRecentClients(limit);
      res.json(clients);
    } catch (error) {
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  static async getPendingPayments(req: Request, res: Response) {
    try {
      const payments = await DashboardService.getPendingPayments();
      res.json(payments);
    } catch (error) {
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  static async getFullDashboard(req: Request, res: Response) {
    try {
      const [stats, recentClients, pendingPayments] = await Promise.all([
        DashboardService.getStats(),
        DashboardService.getRecentClients(5),
        DashboardService.getPendingPayments()
      ]);

      res.json({
        estadisticas: stats,
        clientesRecientes: recentClients,
        pagosPendientes: pendingPayments,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
  


  static async getIngresosMensuales(req: Request, res: Response) {
try {
const ingresos = await DashboardService.getIngresosMensuales();
res.json({ ingresos });
} catch (error) {
console.error(error);
res.status(500).json({ error: 'Error al obtener ingresos mensuales' });
    }
  }
}
