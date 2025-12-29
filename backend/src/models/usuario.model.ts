// src/models/Usuario.model.ts
import { Pool } from 'pg';
import { IUsuario } from './interfaces/usuario.interface';

export class UsuarioModel {
  constructor(private pool: Pool) {}

  async buscarPorEmail(email: string): Promise<IUsuario | null> {
    const query = 'SELECT * FROM usuario WHERE email = $1 AND activo = true';
    const result = await this.pool.query<IUsuario>(query, [email]);
    return result.rows[0] || null;
  }

  async buscarPorId(id: number): Promise<IUsuario | null> {
    const query = 'SELECT * FROM usuario WHERE id = $1';
    const result = await this.pool.query<IUsuario>(query, [id]);
    return result.rows[0] || null;
  }

  async crearAdmin(username: string, email: string, passwordHash: string): Promise<IUsuario> {
    const query = `
      INSERT INTO usuario (username, email, password_hash, rol)
      VALUES ($1, $2, $3, 'admin')
      RETURNING *;
    `;
    
    const result = await this.pool.query<IUsuario>(query, [username, email, passwordHash]);
    return result.rows[0];
  }
}