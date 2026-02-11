import bcrypt from 'bcryptjs';
import { PoolClient } from 'pg';
import pool from '../config/database';

import { ClienteModel } from '../models/Cliente.model';
import { CarnetService, CarnetData } from './carnet.service';
import { IClienteRegistroRequest } from '../models/interfaces/cliente.interface';

export class ClienteAltaService {

  private clienteModel = new ClienteModel(pool);
  private carnetService = new CarnetService();

  /**
   * Alta completa de cliente (usuario + cliente + pago + carnet)
   */
  async registrarAltaCompleta(
    payload: IClienteRegistroRequest,
    client: PoolClient
  ) {
    const { usuario, cliente, pago } = payload;

    // =========================
    // 1. VALIDACIONES
    // =========================
    if (!usuario?.username || !usuario?.email || !usuario?.password) {
      throw new Error('Datos de usuario incompletos');
    }

    if (!cliente?.nombre || !cliente?.apellido) {
      throw new Error('Nombre y apellido son obligatorios');
    }

    if (!pago?.monto || !pago?.mes || !pago?.ano) {
      throw new Error('Pago inicial incompleto');
    }

    if (pago.mes < 1 || pago.mes > 12) {
      throw new Error('Mes inválido');
    }

    // =========================
    // 2. CREAR USUARIO
    // =========================
    const passwordHash = await bcrypt.hash(usuario.password, 10);

    const usuarioResult = await client.query(
      `
      INSERT INTO usuario (username, email, password_hash, rol, activo)
      VALUES ($1, $2, $3, 'cliente', true)
      RETURNING id, username, email
      `,
      [usuario.username, usuario.email, passwordHash]
    );

    const usuarioCreado = usuarioResult.rows[0];

    // =========================
    // 3. FECHAS
    // =========================
    const fechaInscripcion = new Date();
    const fechaVencimiento = new Date(fechaInscripcion);
    fechaVencimiento.setDate(fechaVencimiento.getDate() + 30);

    // =========================
    // 4. CREAR CLIENTE
    // =========================
    const clienteCreado = await this.clienteModel.crear(
      {
        usuario_id: usuarioCreado.id,
        nombre: cliente.nombre,
        apellido: cliente.apellido,
        telefono: cliente.telefono,
        direccion: cliente.direccion,
        entrenador_id: cliente.entrenador_id,
        estado_cuota: 'activo',
        fecha_inscripcion: fechaInscripcion,
        fecha_vencimiento: fechaVencimiento
      },
      client
    );

    // =========================
    // 5. PAGO (si no existe)
    // =========================
    const pagoExistente = await client.query(
      `
      SELECT id
      FROM pagos
      WHERE cliente_id = $1
        AND periodo_mes = $2
        AND periodo_ano = $3
      `,
      [clienteCreado.usuario_id, pago.mes, pago.ano]
    );

    let pagoId: number;

    if (pagoExistente.rowCount === 0) {
      const pagoInsert = await client.query(
        `
        INSERT INTO pagos (
          cliente_id,
          monto,
          metodo,
          estado,
          periodo_mes,
          periodo_ano,
          fecha_pago,
          fecha_vencimiento
        )
        VALUES ($1, $2, $3, 'pagado', $4, $5, CURRENT_DATE, $6)
        RETURNING id
        `,
        [
          clienteCreado.usuario_id,
          pago.monto,
          pago.metodo || 'efectivo',
          pago.mes,
          pago.ano,
          fechaVencimiento
        ]
      );

      pagoId = pagoInsert.rows[0].id;
    } else {
      pagoId = pagoExistente.rows[0].id;
    }

    // =========================
    // 6. GENERAR CARNET
    // =========================
    const carnetData: CarnetData = {
      clienteId: clienteCreado.usuario_id,
      nombre: cliente.nombre,
      apellido: cliente.apellido,
      fechaPago: fechaInscripcion,
      mes: pago.mes,
      año: pago.ano
    };

    const carnet = await this.carnetService.generarCarnetPNG(carnetData);

    if (!carnet?.url) {
      throw new Error('No se pudo generar el carnet');
    }

    // =========================
    // 7. GUARDAR / ACTUALIZAR CARNET
    // =========================
    await client.query(
      `
      INSERT INTO carnets (
        cliente_id,
        usuario_id,
        meses_pagados,
        carnet_url,
        activo,
        fecha_desde
      )
      VALUES ($1, $2, $3, $4, true, CURRENT_DATE)
      ON CONFLICT (cliente_id)
      DO UPDATE SET
        carnet_url = EXCLUDED.carnet_url,
        meses_pagados = EXCLUDED.meses_pagados,
        activo = true,
        fecha_desde = CURRENT_DATE
      `,
      [
        clienteCreado.usuario_id,
        usuarioCreado.id,
        JSON.stringify([{ mes: pago.mes, ano: pago.ano }]),
        carnet.url
      ]
    );

    // =========================
    // 8. RESPUESTA
    // =========================
    return {
      usuario: usuarioCreado,
      cliente: clienteCreado,
      pago: {
        id: pagoId,
        monto: pago.monto,
        mes: pago.mes,
        ano: pago.ano
      },
      carnet: {
        url: carnet.url
      }
    };
  }
}
