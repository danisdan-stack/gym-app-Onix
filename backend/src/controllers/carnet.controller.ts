import { Request, Response } from 'express';
import pool from '../config/database';
import { CarnetData, CarnetService } from '../services/carnet.service';

export class CarnetController {
  private carnetService = new CarnetService();

  async obtenerCarnet(req: Request, res: Response) {
    const { cliente_id } = req.params;

    const result = await pool.query(
      `
      SELECT * FROM carnets
      WHERE cliente_id = $1
      AND activo = true
      ORDER BY id DESC
      LIMIT 1
      `,
      [cliente_id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        ok: false,
        error: 'Carnet no encontrado'
      });
    }

    return res.json({
      ok: true,
      carnet: result.rows[0]
    });
  }

 async regenerarCarnet(req: Request, res: Response) {
  try {
    const { cliente_id, mes, ano } = req.body;

    // 1️⃣ Validaciones básicas
    if (!cliente_id || !mes || !ano) {
      return res.status(400).json({
        ok: false,
        error: 'cliente_id, mes y ano son obligatorios'
      });
    }

    // 2️⃣ Obtener datos del cliente
    const clienteResult = await pool.query(
      `
      SELECT u.id, c.nombre, c.apellido
      FROM cliente c
      JOIN usuario u ON u.id = c.usuario_id
      WHERE u.id = $1
      `,
      [cliente_id]
    );

    if (clienteResult.rowCount === 0) {
      return res.status(404).json({
        ok: false,
        error: 'Cliente no encontrado'
      });
    }

    const cliente = clienteResult.rows[0];

    // 3️⃣ Armar DTO CarnetData (CLAVE)
    const carnetData: CarnetData = {
      clienteId: cliente.id,
      nombre: cliente.nombre,
      apellido: cliente.apellido,
      fechaPago: new Date(), // o la fecha real del pago si la tenés
      mes: Number(mes),
      año: Number(ano)
    };

    // 4️⃣ Llamar al service (UN SOLO PARÁMETRO)
    const carnet = await this.carnetService.generarCarnetPNG(carnetData);

    // 5️⃣ Respuesta
    return res.json({
      ok: true,
      carnet_url: carnet.url
    });

  } catch (error: any) {
    console.error('❌ Error regenerarCarnet:', error);

    return res.status(500).json({
      ok: false,
      error: error.message || 'Error interno del servidor'
    });
  }
}

}
