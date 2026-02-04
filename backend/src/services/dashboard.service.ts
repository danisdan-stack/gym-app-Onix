// backend/src/services/dashboard.service.ts
import pool from '../config/database';

export class DashboardService {

  static async getStats() {
    const query = `
      SELECT
        COUNT(*) AS total_clientes,
        COUNT(CASE WHEN fecha_vencimiento >= CURRENT_DATE THEN 1 END) AS clientes_activos,
        COUNT(CASE WHEN fecha_vencimiento < CURRENT_DATE THEN 1 END) AS clientes_vencidos
      FROM cliente
      WHERE fecha_inscripcion IS NOT NULL
    `;

    const { rows } = await pool.query(query);
    return rows[0];
  }

  static async getRecentClients(limit: number) {
    const query = `
      SELECT 
        c.nombre,
        c.apellido,
        c.fecha_inscripcion,
        u.email
      FROM cliente c
      INNER JOIN usuario u ON c.usuario_id = u.id
      ORDER BY c.creado_en DESC
      LIMIT $1
    `;

    const { rows } = await pool.query(query, [limit]);
    return rows;
  }

  static async getPendingPayments() {
    const query = `
      SELECT
        c.nombre,
        c.apellido,
        c.fecha_vencimiento,
        CURRENT_DATE - c.fecha_vencimiento AS dias_vencido
      FROM cliente c
      WHERE c.fecha_vencimiento < CURRENT_DATE
      ORDER BY c.fecha_vencimiento ASC
    `;

    const { rows } = await pool.query(query);
    return rows;
  }
static async getIngresosMensuales() {
const query = `
SELECT
periodo_mes AS mes,
periodo_ano AS ano,
SUM(monto) AS total
FROM pagos
WHERE estado = 'pagado'
GROUP BY periodo_ano, periodo_mes
ORDER BY periodo_ano DESC, periodo_mes DESC
`;


const { rows } = await pool.query(query);
return rows;
}
}
