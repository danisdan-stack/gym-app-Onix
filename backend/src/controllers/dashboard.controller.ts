// backend/src/controllers/dashboard.controller.ts
import { Request, Response } from 'express';
import  pool from '../config/database';

export class DashboardController {
  // GET /api/v1/dashboard/estadisticas
  static async getStats(req: Request, res: Response) {
    try {
      const query = `
        SELECT 
        COUNT(*) as total_clientes,
        -- Todos los clientes son activos (sin ver estado_cuota)
        COUNT(*) as clientes_activos,
        0 as clientes_inactivos,
        0 as clientes_suspendidos,
        -- Solo mostrar vencidos por fecha
        COUNT(CASE WHEN fecha_vencimiento < CURRENT_DATE THEN 1 END) as clientes_vencidos
       FROM cliente
       WHERE fecha_inscripcion IS NOT NULL  -- Solo clientes reales
            `;
      
      const { rows } = await pool.query(query);
      res.json(rows[0]);
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // GET /api/v1/dashboard/clientes-recientes
  static async getRecentClients(req: Request, res: Response) {
    try {
      const limit = parseInt(req.query.limit as string) || 5;
      
      const query = `
        SELECT 
          c.*,
          u.email
        FROM cliente c
        INNER JOIN usuario u ON c.usuario_id = u.id
        ORDER BY c.creado_en DESC
        LIMIT $1
      `;
      
      const { rows } = await pool.query(query, [limit]);
      res.json(rows);
    } catch (error) {
      console.error('Error al obtener clientes recientes:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // GET /api/v1/dashboard/pagos-pendientes
  static async getPendingPayments(req: Request, res: Response) {
    try {
      const query = `
        SELECT 
          p.*,
          c.nombre as cliente_nombre,
          c.apellido as cliente_apellido,
          CASE 
            WHEN p.estado = 'pendiente' AND p.fecha_vencimiento < CURRENT_DATE 
            THEN CURRENT_DATE - p.fecha_vencimiento
            ELSE 0
          END as dias_vencido
        FROM pagos p
        INNER JOIN cliente c ON p.cliente_id = c.usuario_id
        WHERE p.estado IN ('pendiente', 'vencido')
        ORDER BY p.fecha_vencimiento ASC
      `;
      
      const { rows } = await pool.query(query);
      res.json(rows);
    } catch (error) {
      console.error('Error al obtener pagos pendientes:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // GET /api/v1/dashboard/resumen
  static async getFullDashboard(req: Request, res: Response) {
    try {
      const [stats, recentClients, pendingPayments] = await Promise.all([
        this.getStats(req, res).then(data => data),
        this.getRecentClients(req, res).then(data => data),
        this.getPendingPayments(req, res).then(data => data)
      ]);

      res.json({
        estadisticas: stats,
        clientesRecientes: recentClients,
        pagosPendientes: pendingPayments,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error al obtener dashboard completo:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
}