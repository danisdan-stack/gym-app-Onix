import { Request, Response } from 'express';
import pool from '../config/database';
import { ClienteAltaService } from '../services/clienteAlta.service';

export class ClienteController {
  private altaService = new ClienteAltaService();

  async altaCompleta(req: Request, res: Response) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const resultado = await this.altaService.registrarAltaCompleta(
        req.body,
        client
      );

      await client.query('COMMIT');

      return res.status(201).json({
        ok: true,
        message: 'Cliente creado correctamente',
        data: resultado
      });

    } catch (error: any) {
      await client.query('ROLLBACK');

      return res.status(400).json({
        ok: false,
        error: error.message
      });

    } finally {
      client.release();
    }
  }
}

export const listarClientesConCarnet = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT 
        c.id,
        c.nombre,
        c.apellido,
        c.estado_cuota,
        ca.url as carnet_url
      FROM cliente c
      LEFT JOIN carnets ca ON ca.cliente_id = c.id
      ORDER BY c.apellido
    `);

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Error listando clientes con carnet'
    });
  }
};

export const listarClientesSimplificado = async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT 
        id,
        nombre,
        apellido,
        estado_cuota
      FROM cliente
      ORDER BY apellido
    `);

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Error listando clientes'
    });
  }
};
