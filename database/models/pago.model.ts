// database/models/pago.model.ts
export interface Pago {
  id: number;
  cliente_id: number;
  monto: number;
  metodo_pago: string;
  fecha_pago: Date;
  creado_en: Date;
}

export class PagoModel {
  private pool: any;

  constructor(pool: any) {
    this.pool = pool;
  }

  // ======================
  // Crear un pago
  // ======================
  async crear(datos: {
    cliente_id: number;
    monto: number;
    metodo_pago: string;
    fecha_pago?: Date;
  }): Promise<Pago> {

    const query = `
      INSERT INTO pago (
        cliente_id,
        monto,
        metodo_pago,
        fecha_pago
      ) VALUES ($1, $2, $3, $4)
      RETURNING *
    `;

    const values = [
      datos.cliente_id,
      datos.monto,
      datos.metodo_pago,
      datos.fecha_pago || new Date()
    ];

    console.log('💰 Registrando pago:', values);

    const { rows } = await this.pool.query(query, values);
    return rows[0];
  }

  // ======================
  // Obtener pagos por cliente
  // ======================
  async buscarPorCliente(cliente_id: number): Promise<Pago[]> {
    const query = `
      SELECT *
      FROM pago
      WHERE cliente_id = $1
      ORDER BY fecha_pago DESC
    `;

    const { rows } = await this.pool.query(query, [cliente_id]);
    return rows;
  }

  // ======================
  // Obtener pagos recientes
  // ======================
  async buscarRecientes(limit: number = 10): Promise<Pago[]> {
    const query = `
      SELECT *
      FROM pago
      ORDER BY fecha_pago DESC
      LIMIT $1
    `;

    const { rows } = await this.pool.query(query, [limit]);
    return rows;
  }

  // ======================
  // Obtener total pagado por cliente
  // ======================
  async totalPagadoPorCliente(cliente_id: number): Promise<number> {
    const query = `
      SELECT COALESCE(SUM(monto), 0) as total
      FROM pago
      WHERE cliente_id = $1
    `;

    const { rows } = await this.pool.query(query, [cliente_id]);
    return Number(rows[0].total);
  }
}
