// src/models/Pago.model.ts
import { Pool } from 'pg';
import { IPago, IPagoCreate } from './interfaces/pago.interface';

export class PagoModel {
  listar(filtros: { cliente_id: number | undefined; estado: "pagado" | "pendiente" | "anulado" | "vencido"; periodo_mes: number | undefined; periodo_ano: number | undefined; metodo: "efectivo" | "tarjeta" | "transferencia" | "otro"; fecha_desde: Date | undefined; fecha_hasta: Date | undefined; }) {
      throw new Error('Method not implemented.');
  }
  obtenerPorId(pagoId: number) {
      throw new Error('Method not implemented.');
  }
  actualizar(pagoId: number, datos: any) {
      throw new Error('Method not implemented.');
  }
  constructor(private pool: Pool) {}

  // En models/pago.model.ts
async registrar(pagoData: IPagoCreate): Promise<any> {
  const query = `
    INSERT INTO pagos (
      cliente_id, monto, metodo, estado,
      periodo_mes, periodo_ano,
      fecha_pago, fecha_vencimiento,  -- ← Agregados
      created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *`;

  const values = [
    pagoData.cliente_id,
    pagoData.monto,
    pagoData.metodo,
    pagoData.estado || 'pagado',  // ← Valor por defecto si no viene
    pagoData.periodo_mes || null,
    pagoData.periodo_ano || null,
    pagoData.fecha_pago || new Date(),  // ← Fecha actual por defecto
    pagoData.fecha_vencimiento || 
      new Date(new Date().setMonth(new Date().getMonth() + 1)),  // ← 1 mes después
    new Date()  // created_at
  ];

  const result = await this.pool.query(query, values);
  return result.rows[0];
}
  async obtenerPorCliente(clienteId: number): Promise<IPago[]> {
    const query = `
      SELECT * FROM pagos 
      WHERE cliente_id = $1 
      ORDER BY periodo_ano DESC, periodo_mes DESC
    `;
    const result = await this.pool.query<IPago>(query, [clienteId]);
    return result.rows;
  }
}