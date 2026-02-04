import { Request, Response } from 'express';
import pool from '../config/database';
import { PagoService } from '../services/pagosService';
import { PagoModel } from '../models/pago.model';
import { ClienteAltaService } from '../services/clienteAlta.service';
import { CarnetService } from '../services/carnet.service';
import { WhatsAppService } from '../services/whatsapp.service';

// Instancias
const pagoModel = new PagoModel(pool);
const clienteAltaService = new ClienteAltaService();
const carnetService = new CarnetService();
const whatsappService = new WhatsAppService();

const pagoService = new PagoService(
  pagoModel,
  clienteAltaService,
  carnetService
);

export class PagoController {

  async registrarPago(req: Request, res: Response) {
    const { cliente_id, monto, metodo, mes, ano } = req.body;
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // 1️⃣ Registrar pago
      const pago = await pagoService.registrarPago({
        cliente_id,
        monto,
        metodo: metodo || 'efectivo',
        periodo_mes: mes,
        periodo_ano: ano,
        fecha_pago: undefined,
        fecha_vencimiento: undefined
      }, client);

      // 2️⃣ Obtener datos del cliente
      const clienteRes = await client.query(
        `
        SELECT nombre, apellido, telefono
        FROM cliente
        WHERE usuario_id = $1
        `,
        [cliente_id]
      );

      if (clienteRes.rowCount === 0) {
        throw new Error('Cliente no encontrado');
      }

      const cliente = clienteRes.rows[0];

      // 3️⃣ Generar carnet del pago recién hecho
      const carnet = await carnetService.generarSiCorresponde(
        cliente_id,
        client
      );

      // 4️⃣ Generar link de WhatsApp
      const wppLink = whatsappService.generarLinkCarnet({
        telefono: cliente.telefono,
        nombre: cliente.nombre,
        apellido: cliente.apellido,
        mes,
        ano,
        carnetUrl: carnet.url
      });

      await client.query('COMMIT');

      return res.status(201).json({
        ok: true,
        pago,
        carnet,
        whatsapp: wppLink
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
