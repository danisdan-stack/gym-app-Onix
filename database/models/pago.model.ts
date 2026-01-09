// database/models/pago.model.ts
export interface Pago {
  id: number;
  cliente_id: number;
  monto: number;
  fecha_pago: Date | null;
  fecha_vencimiento: Date;
  fecha_registro: Date;
  metodo: 'efectivo' | 'tarjeta' | 'transferencia' | 'otro';
  tipo_pago: 'normal' | 'anticipado' | 'tardio' | null;
  estado: 'pagado' | 'pendiente' | 'anulado' | 'vencido';
  periodo_mes: number | null;
  periodo_ano: number | null;
  comprobante_url: string | null;
  referencia: string | null;
  observaciones: string | null;
  creado_en: Date;
  actualizado_en: Date;
  // Datos del cliente (JOIN)
  cliente_nombre?: string;
  cliente_apellido?: string;
  cliente_email?: string;
  dias_vencido?: number;
}

export class PagoModel {
  // Obtener pagos con datos del cliente
  static async findAllWithClient(): Promise<Pago[]> {
    const query = `
      SELECT 
        p.*,
        c.nombre as cliente_nombre,
        c.apellido as cliente_apellido,
        u.email as cliente_email,
        CASE 
          WHEN p.estado = 'pendiente' AND p.fecha_vencimiento < CURRENT_DATE 
          THEN CURRENT_DATE - p.fecha_vencimiento
          ELSE 0
        END as dias_vencido
      FROM pagos p
      INNER JOIN cliente c ON p.cliente_id = c.usuario_id
      INNER JOIN usuario u ON c.usuario_id = u.id
      ORDER BY 
        CASE WHEN p.estado = 'pendiente' THEN 1 ELSE 2 END,
        p.fecha_vencimiento ASC
    `;
    const { rows } = await pool.query(query);
    return rows;
  }

  // Obtener pagos pendientes
  static async findPending(): Promise<Pago[]> {
    const query = `
      SELECT 
        p.*,
        c.nombre as cliente_nombre,
        c.apellido as cliente_apellido,
        u.email as cliente_email,
        CURRENT_DATE - p.fecha_vencimiento as dias_vencido
      FROM pagos p
      INNER JOIN cliente c ON p.cliente_id = c.usuario_id
      INNER JOIN usuario u ON c.usuario_id = u.id
      WHERE p.estado = 'pendiente'
        AND p.fecha_vencimiento >= CURRENT_DATE - INTERVAL '30 days'
      ORDER BY p.fecha_vencimiento ASC
    `;
    const { rows } = await pool.query(query);
    return rows;
  }

  // Obtener estadísticas de pagos para dashboard
  static async getDashboardStats(): Promise<any> {
    const query = `
      SELECT 
        COUNT(*) as total_pagos,
        SUM(CASE WHEN estado = 'pagado' THEN 1 ELSE 0 END) as pagos_pagados,
        SUM(CASE WHEN estado = 'pendiente' THEN 1 ELSE 0 END) as pagos_pendientes,
        SUM(CASE WHEN estado = 'vencido' THEN 1 ELSE 0 END) as pagos_vencidos,
        SUM(CASE WHEN estado = 'pagado' THEN monto ELSE 0 END) as ingresos_totales,
        SUM(CASE WHEN estado = 'pagado' AND fecha_pago >= DATE_TRUNC('month', CURRENT_DATE) 
          THEN monto ELSE 0 END) as ingresos_mensuales,
        SUM(CASE WHEN estado = 'pendiente' THEN monto ELSE 0 END) as pendiente_total
      FROM pagos
    `;
    const { rows } = await pool.query(query);
    return rows[0];
  }
}