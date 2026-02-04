import bcrypt from 'bcryptjs';
import { PoolClient } from 'pg';
import pool from '../config/database';

import { ClienteModel } from '../models/Cliente.model';
import { CarnetService, CarnetData } from './carnet.service';
import { IClienteRegistroRequest } from '../models/interfaces/cliente.interface';

export class ClienteAltaService {
  obtenerPorId(cliente_id: any, client: any) {
    throw new Error('Method not implemented.');
  }
  actualizarEstado(cliente_id: number, arg1: string, fechaVencimiento: Date, client: PoolClient) {
      throw new Error('Method not implemented.');
  }
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
    // 1. VALIDACIONES DE NEGOCIO
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
    // 2. VERIFICAR PERÍODO DUPLICADO
    // =========================
    const existePago = await client.query(
      `
      SELECT 1 
      FROM pagos 
      WHERE cliente_id = (
        SELECT id FROM usuario WHERE email = $1
      )
      AND periodo_mes = $2
      AND periodo_ano = $3
      `,
      [usuario.email, pago.mes, pago.ano]
    );

    if (existePago.rowCount > 0) {
      throw new Error('El período ya está abonado');
    }

    // =========================
    // 3. CREAR USUARIO
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
    // 4. GENERAR FECHAS
    // =========================
    const fechaInscripcion = new Date();
    const fechaVencimiento = new Date(fechaInscripcion);
    fechaVencimiento.setDate(fechaVencimiento.getDate() + 30); // 30 días después

    // =========================
    // 5. CREAR CLIENTE
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
    // 6. REGISTRAR PAGO
    // =========================
    const pagoResult = await client.query(
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
        usuarioCreado.id,
        pago.monto,
        pago.metodo || 'efectivo',
        pago.mes,
        pago.ano,
        fechaVencimiento
      ]
    );

    const pagoId = pagoResult.rows[0].id;

    // =========================
    // 7. GENERAR CARNET (versión moderna)
    // =========================
    const carnetData: CarnetData = {
      clienteId: usuarioCreado.id,
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
    // 8. GUARDAR CARNET
    // =========================
    const carnetResult = await client.query(
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
      RETURNING id
      `,
      [
        usuarioCreado.id,
        usuarioCreado.id,
        JSON.stringify([{ mes: pago.mes, ano: pago.ano }]),
        carnet.url
      ]
    );

    const carnetId = carnetResult.rows[0].id;

    // =========================
    // 9. RESPUESTA FINAL
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
        id: carnetId,
        url: carnet.url
      }
    };
  }

  /**
   * Actualiza estado del cliente según pago o vencimiento
   * Regla:
   * - activo: más de 7 días para vencimiento
   * - por vencer: faltan 7 días o menos
   * - inactivo: pasaron 7 días del vencimiento
   */
  async actualizarEstadoSegunVencimiento(
    clienteId: number,
    client: PoolClient
  ): Promise<'activo' | 'por vencer' | 'inactivo'> {
    const { rows } = await client.query(
      `SELECT fecha_vencimiento, estado_cuota
       FROM cliente
       WHERE usuario_id = $1`,
      [clienteId]
    );

    if (rows.length === 0) return 'activo';

    const fechaVencimiento: Date = rows[0].fecha_vencimiento;
    const hoy = new Date();
    const diffMs = fechaVencimiento.getTime() - hoy.getTime();
    const diffDias = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    let nuevoEstado: 'activo' | 'por vencer' | 'inactivo' = 'activo';

    if (diffDias < 0 && diffDias <= -7) {
      nuevoEstado = 'inactivo';
    } else if (diffDias >= 0 && diffDias <= 7) {
      nuevoEstado = 'por vencer';
    } else {
      nuevoEstado = 'activo';
    }

    if (rows[0].estado_cuota !== nuevoEstado) {
      await client.query(
        `UPDATE cliente
         SET estado_cuota = $1
         WHERE usuario_id = $2`,
        [nuevoEstado, clienteId]
      );
    }

    return nuevoEstado;
  }

  /**
   * Actualiza manualmente estado del cliente
   */
  async actualizarEstadoCliente(
    clienteId: number,
    estado: 'activo' | 'inactivo',
    fechaVencimiento: Date,
    client: PoolClient
  ) {
    await client.query(
      `
      UPDATE cliente
      SET estado_cuota = $1,
          fecha_vencimiento = $2
      WHERE usuario_id = $3`,
      [estado, fechaVencimiento, clienteId]
    );
  }
}
