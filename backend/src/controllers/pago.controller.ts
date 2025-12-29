import { Request, Response } from 'express';
import pool from '../config/database';
import { PagoModel } from '../models/pago.model'; 
import { IPagoCreate } from '../models/interfaces/pago.interface';

const pagoModel = new PagoModel(pool);

// Stub temporal para carnet service
const generarCarnetImagen = async (data: any): Promise<string> => {
  // TODO: Reemplazar con tu implementación real
  console.log(`📄 Generando carnet para ${data.cliente.nombre} - Mes: ${data.mes}/${data.ano}`);
  return `/storage/carnets/carnet_${data.cliente.usuario_id}_${data.mes}_${data.ano}.png`;
};

async function procesarCarnet(clienteId: number, pagoId: number, mes: number, ano: number, monto: number) {
  // 1. Verificar si el cliente ya tiene un carnet activo
  const carnetExistente = await pool.query(
    `SELECT * FROM carnets 
     WHERE cliente_id = $1 AND activo = true`,
    [clienteId]
  );

  let carnetId: number;
  let mesesPagados: string[] = []; // ← Cambié a string[]

  if (carnetExistente.rows.length > 0) {
    // 2. Actualizar carnet existente
    carnetId = carnetExistente.rows[0].id;
    mesesPagados = carnetExistente.rows[0].meses_pagados || [];
    
    // Agregar mes a la lista si no está ya
    const mesAnoKey = `${ano}-${mes.toString().padStart(2, '0')}`;
    if (!mesesPagados.includes(mesAnoKey)) {
      mesesPagados.push(mesAnoKey);
      
      await pool.query(
        `UPDATE carnets 
         SET meses_pagados = $1::jsonb, fecha_ultima_actualizacion = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [JSON.stringify(mesesPagados), carnetId]
      );
    }
  } else {
    // 3. Crear nuevo carnet
    const fechaDesde = new Date(ano, mes - 1, 1);
    const fechaHasta = new Date(ano, mes, 0);
    
    mesesPagados = [`${ano}-${mes.toString().padStart(2, '0')}`];
    
    const nuevoCarnet = await pool.query(
      `INSERT INTO carnets 
       (cliente_id, usuario_id, meses_pagados, fecha_desde, fecha_hasta)
       VALUES ($1, $2, $3::jsonb, $4, $5)
       RETURNING id`,
      [clienteId, clienteId, JSON.stringify(mesesPagados), fechaDesde, fechaHasta]
    );
    
    carnetId = nuevoCarnet.rows[0].id;
  }

  // 4. Generar imagen del carnet
  const clienteResult = await pool.query(
    `SELECT c.*, u.email, u.username 
     FROM cliente c 
     JOIN usuario u ON c.usuario_id = u.id 
     WHERE c.usuario_id = $1`,
    [clienteId]
  );

  if (clienteResult.rows.length > 0) {
    const cliente = clienteResult.rows[0];
    
    const urlImagen = await generarCarnetImagen({
      cliente,
      mes,
      ano,
      monto,
      mesesPagados,
      carnetId
    });

    // 5. Actualizar URL en el carnet
    await pool.query(
      `UPDATE carnets 
       SET carnet_url = $1, fecha_ultima_actualizacion = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [urlImagen, carnetId]
    );

    return {
      carnet_id: carnetId,
      carnet_url: urlImagen,
      meses_pagados: mesesPagados,
      nuevo_carnet: carnetExistente.rows.length === 0
    };
  }

  return null;
}

// POST /api/pagos - Registrar nuevo pago
export const registrarPago = async (req: Request, res: Response) => {
  try {
    const pagoData: IPagoCreate = req.body;

    // Validaciones obligatorias
    if (!pagoData.cliente_id || !pagoData.monto || !pagoData.metodo) {
      return res.status(400).json({
        success: false,
        message: 'cliente_id, monto y metodo son requeridos'
      });
    }

    // Validar método de pago
    const metodosValidos = ['efectivo', 'tarjeta', 'transferencia', 'otro'];
    if (!metodosValidos.includes(pagoData.metodo)) {
      return res.status(400).json({
        success: false,
        message: `Método inválido. Use: ${metodosValidos.join(', ')}`
      });
    }

    // Validar monto positivo
    if (pagoData.monto <= 0) {
      return res.status(400).json({
        success: false,
        message: 'El monto debe ser mayor a 0'
      });
    }

    // Si tiene periodo, validar ambos campos
    if (pagoData.periodo_mes || pagoData.periodo_ano) {
      if (!pagoData.periodo_mes || !pagoData.periodo_ano) {
        return res.status(400).json({
          success: false,
          message: 'Si especifica periodo, ambos (mes y año) son requeridos'
        });
      }
      if (pagoData.periodo_mes < 1 || pagoData.periodo_mes > 12) {
        return res.status(400).json({
          success: false,
          message: 'periodo_mes debe estar entre 1 y 12'
        });
      }
    }

    // Registrar pago
    const pagoCreado = await pagoModel.registrar(pagoData);

    // Generar carnet
    let carnetInfo = null;
    
    if (pagoData.periodo_mes && pagoData.periodo_ano) {
      try {
        carnetInfo = await procesarCarnet(
          pagoData.cliente_id,
          pagoCreado.id,
          pagoData.periodo_mes,
          pagoData.periodo_ano,
          pagoData.monto
        );
        
        // Actualizar estado del cliente si el pago está pagado
        if (pagoData.estado === 'pagado' || pagoCreado.estado === 'pagado') {
          await pool.query(
            `UPDATE cliente 
             SET estado_cuota = 'activo', 
                 fecha_vencimiento = COALESCE($1, fecha_vencimiento),
                 actualizado_en = CURRENT_TIMESTAMP
             WHERE usuario_id = $2`,
            [pagoData.fecha_vencimiento, pagoData.cliente_id]
          );
        }
      } catch (carnetError) {
        console.error('⚠️ Error procesando carnet:', carnetError);
      }
    }

    // Responder
    res.status(201).json({
      success: true,
      message: 'Pago registrado exitosamente' + (carnetInfo ? ' y carnet actualizado' : ''),
      data: {
        pago: pagoCreado,
        carnet: carnetInfo
      }
    });

  } catch (error: any) {
    console.error('Error registrando pago:', error);
    
    if (error.code === '23505') {
      if (error.constraint === 'chk_periodo_unico') {
        return res.status(400).json({
          success: false,
          message: 'El cliente ya tiene un pago registrado para ese mes y año'
        });
      }
    }

    res.status(500).json({
      success: false,
      message: 'Error registrando pago',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ... resto de tus funciones (listarPagos, etc.)