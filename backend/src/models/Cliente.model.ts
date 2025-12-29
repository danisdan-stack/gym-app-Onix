// src/models/Cliente.model.ts
import { Pool } from 'pg';
import { 
  ICliente, 
  IClienteCreate, 
  IClienteUpdate, 
  IFiltrosCliente 
} from './interfaces/cliente.interface';

export class ClienteModel {
  constructor(private pool: Pool) {}

 async crear(clienteData: IClienteCreate, dbClient?: any): Promise<ICliente> {
  const query = `
    INSERT INTO cliente 
    (usuario_id, nombre, apellido, telefono, direccion)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *;
  `;
  
  const values = [
    clienteData.usuario_id,
    clienteData.nombre,
    clienteData.apellido,
    clienteData.telefono || null,
    clienteData.direccion || null
  ];
  
  try {
    // ✅ Opción A: Usa try-catch para ambos casos
    if (dbClient) {
      // Si se pasa un cliente de transacción
      const result = await dbClient.query(query, values);
      return result.rows[0];
    } else {
      // Si no, usa el pool normal
      const result = await this.pool.query<ICliente>(query, values);
      return result.rows[0];
    }
  } catch (error) {
    console.error('Error en ClienteModel.crear:', error);
    throw error;
  }
}
  async buscarTodos(filtros: IFiltrosCliente = {}): Promise<ICliente[]> {
    let query = 'SELECT * FROM cliente WHERE 1=1';
    const valores: any[] = [];
    let contador = 1;
    
    if (filtros.buscar) {
      query += ` AND (nombre ILIKE $${contador} OR apellido ILIKE $${contador})`;
      valores.push(`%${filtros.buscar}%`);
      contador++;
    }
    
    query += ' ORDER BY nombre, apellido';
    const result = await this.pool.query<ICliente>(query, valores);
    return result.rows;
  }

  async buscarPorId(usuarioId: number): Promise<ICliente | null> {
    const query = 'SELECT * FROM cliente WHERE usuario_id = $1';
    const result = await this.pool.query<ICliente>(query, [usuarioId]);
    return result.rows[0] || null;
  }
  // Dentro de la clase ClienteModel, después de buscarPorId()

async actualizar(usuarioId: number, datos: IClienteUpdate): Promise<ICliente> {
  const campos = [];
  const valores = [];
  let contador = 1;

  // Construir SET dinámicamente
  if (datos.nombre !== undefined) {
    campos.push(`nombre = $${contador}`);
    valores.push(datos.nombre);
    contador++;
  }
  
  if (datos.apellido !== undefined) {
    campos.push(`apellido = $${contador}`);
    valores.push(datos.apellido);
    contador++;
  }
  
  if (datos.telefono !== undefined) {
    campos.push(`telefono = $${contador}`);
    valores.push(datos.telefono);
    contador++;
  }
  
  if (datos.direccion !== undefined) {
    campos.push(`direccion = $${contador}`);
    valores.push(datos.direccion);
    contador++;
  }
  
  if (datos.entrenador_id !== undefined) {
    campos.push(`entrenador_id = $${contador}`);
    valores.push(datos.entrenador_id);
    contador++;
  }
  
  if (datos.estado_cuota !== undefined) {
    campos.push(`estado_cuota = $${contador}`);
    valores.push(datos.estado_cuota);
    contador++;
  }
  
  if (datos.fecha_vencimiento !== undefined) {
    campos.push(`fecha_vencimiento = $${contador}`);
    valores.push(datos.fecha_vencimiento);
    contador++;
  }

  // Si no hay campos para actualizar
  if (campos.length === 0) {
    throw new Error('No se proporcionaron datos para actualizar');
  }

  // Agregar actualización de timestamp
  campos.push(`actualizado_en = CURRENT_TIMESTAMP`);
  
  const query = `
    UPDATE cliente 
    SET ${campos.join(', ')}
    WHERE usuario_id = $${contador}
    RETURNING *
  `;
  
  valores.push(usuarioId);
  
  const result = await this.pool.query<ICliente>(query, valores);
  
  if (result.rows.length === 0) {
    throw new Error('Cliente no encontrado');
  }
  
  return result.rows[0];
}
}