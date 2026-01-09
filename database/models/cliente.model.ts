// database/models/cliente.model.ts
export interface Cliente {
  usuario_id: number;
  nombre: string;
  apellido: string;
  telefono: string;
  entrenador_id: number | null;
  estado_cuota: 'activo' | 'inactivo' | 'suspendido';
  fecha_inscripcion: Date;
  fecha_vencimiento: Date | null;
  direccion: string | null;
  creado_en: Date;
  actualizado_en: Date;
  // Datos del usuario (JOIN)
  email?: string;
  username?: string;
  rol?: string;
  activo?: boolean;
}

export class ClienteModel {
  // Obtener clientes con datos de usuario
  static async findAllWithUser(): Promise<Cliente[]> {
    const query = `
      SELECT 
        c.*,
        u.email,
        u.username,
        u.rol,
        u.activo,
        u.ultimo_login
      FROM cliente c
      INNER JOIN usuario u ON c.usuario_id = u.id
      ORDER BY c.creado_en DESC
    `;
    const { rows } = await pool.query(query);
    return rows;
  }

  // Obtener cliente por ID con datos de usuario
  static async findByIdWithUser(id: number): Promise<Cliente | null> {
    const query = `
      SELECT 
        c.*,
        u.email,
        u.username,
        u.rol,
        u.activo,
        u.ultimo_login
      FROM cliente c
      INNER JOIN usuario u ON c.usuario_id = u.id
      WHERE c.usuario_id = $1
    `;
    const { rows } = await pool.query(query, [id]);
    return rows[0] || null;
  }

  // Obtener estadísticas para dashboard
  static async getDashboardStats(): Promise<any> {
    const query = `
      SELECT 
        COUNT(*) as total_clientes,
        SUM(CASE WHEN estado_cuota = 'activo' THEN 1 ELSE 0 END) as clientes_activos,
        SUM(CASE WHEN estado_cuota = 'inactivo' THEN 1 ELSE 0 END) as clientes_inactivos,
        SUM(CASE WHEN estado_cuota = 'suspendido' THEN 1 ELSE 0 END) as clientes_suspendidos,
        COUNT(CASE WHEN fecha_vencimiento < CURRENT_DATE THEN 1 END) as clientes_vencidos
      FROM cliente
    `;
    const { rows } = await pool.query(query);
    return rows[0];
  }

  // Obtener clientes recientes
  static async findRecent(limit: number = 5): Promise<Cliente[]> {
    const query = `
      SELECT 
        c.*,
        u.email,
        u.username
      FROM cliente c
      INNER JOIN usuario u ON c.usuario_id = u.id
      ORDER BY c.creado_en DESC
      LIMIT $1
    `;
    const { rows } = await pool.query(query, [limit]);
    return rows;
  }
}