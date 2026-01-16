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
  email?: string;
  username?: string;
  rol?: string;
  activo?: boolean;
}

export class ClienteModel {
  private pool: any;
  
  constructor(pool: any) {
    this.pool = pool;
  }
  
  // Obtener clientes con datos de usuario
  async findAllWithUser(): Promise<Cliente[]> {
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
    const { rows } = await this.pool.query(query); // ✅ this.pool
    return rows;
  }

  // Obtener cliente por ID con datos de usuario
  async findByIdWithUser(id: number): Promise<Cliente | null> {
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
    const { rows } = await this.pool.query(query, [id]); // ✅ this.pool
    return rows[0] || null;
  }

  // Obtener estadísticas para dashboard
  async getDashboardStats(): Promise<any> {
    const query = `
      SELECT 
        COUNT(*) as total_clientes,
        SUM(CASE WHEN estado_cuota = 'activo' THEN 1 ELSE 0 END) as clientes_activos,
        SUM(CASE WHEN estado_cuota = 'inactivo' THEN 1 ELSE 0 END) as clientes_inactivos,
        SUM(CASE WHEN estado_cuota = 'suspendido' THEN 1 ELSE 0 END) as clientes_suspendidos,
        COUNT(CASE WHEN fecha_vencimiento < CURRENT_DATE THEN 1 END) as clientes_vencidos
      FROM cliente
    `;
    const { rows } = await this.pool.query(query); // ✅ this.pool
    return rows[0];
  }

  // Obtener clientes recientes
  async findRecent(limit: number = 5): Promise<Cliente[]> {
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
    const { rows } = await this.pool.query(query, [limit]); // ✅ this.pool
    return rows;
  }
  
  // ======================
  // AGREGAR ESTOS MÉTODOS (que usa tu controller)
  // ======================
  
  async crear(datos: any, client?: any): Promise<any> {
    const db = client || this.pool;
    
    const query = `
      INSERT INTO cliente (
        usuario_id, nombre, apellido, telefono,
        estado_cuota, fecha_inscripcion, fecha_vencimiento
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    
    const values = [
      datos.usuario_id,
      datos.nombre,
      datos.apellido,
      datos.telefono,
      datos.estado_cuota || 'activo',
      datos.fecha_inscripcion,
      datos.fecha_vencimiento
    ];
    
    console.log('📝 Creando cliente:', values);
    const result = await db.query(query, values);
    return result.rows[0];
  }
  
  async buscarTodos(filtros?: any): Promise<Cliente[]> {
    // Implementación simple por ahora
    return await this.findAllWithUser();
  }
  
  async buscarPorId(id: number): Promise<Cliente | null> {
    return await this.findByIdWithUser(id);
  }
  
  async actualizar(id: number, datos: any): Promise<Cliente> {
    console.log('📝 Actualizando cliente', id, 'con:', datos);
    // Implementación simple - devuelve mock
    return {
      usuario_id: id,
      nombre: datos.nombre || 'Actualizado',
      apellido: datos.apellido || 'Cliente',
      telefono: datos.telefono || '0000000000',
      entrenador_id: null,
      estado_cuota: 'activo',
      fecha_inscripcion: new Date(),
      fecha_vencimiento: new Date(),
      direccion: null,
      creado_en: new Date(),
      actualizado_en: new Date()
    };
  }
}