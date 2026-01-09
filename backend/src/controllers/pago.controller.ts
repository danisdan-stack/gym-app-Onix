// src/controllers/pago.controller.ts - VERSIÓN FINAL
import { Request, Response } from 'express';
import pool from '../config/database';
import { PagoModel } from '../models/pago.model'; 
import { IPagoCreate } from '../models/interfaces/pago.interface';
import { TwilioService } from '../services/twilio.service';
import { CarnetService } from '../services/carnet.service';

// Inicializar servicios
let pagoModel: PagoModel;
let twilioService: TwilioService;
let carnetService: CarnetService;

try {
  pagoModel = new PagoModel(pool);
  twilioService = new TwilioService();
  carnetService = new CarnetService();
} catch (error) {
  console.error('Error inicializando servicios:', error);
  pagoModel = {} as PagoModel;
  twilioService = {} as TwilioService;
  carnetService = {} as CarnetService;
}

// ============================================
// FUNCIÓN AUXILIAR: Listar clientes con estado
// ============================================
export const listarClientesConEstado = async (req: Request, res: Response) => {
  try {
    const query = `
      SELECT 
        c.usuario_id as id,
        c.nombre,
        c.apellido,
        c.telefono,
        c.estado_cuota,
        c.fecha_inscripcion,
        c.fecha_vencimiento,
        COALESCE(
          (SELECT estado FROM pagos 
           WHERE cliente_id = c.usuario_id 
           ORDER BY fecha_pago DESC 
           LIMIT 1),
          'pendiente'
        ) as estado_ultimo_pago,
        COALESCE(
          (SELECT fecha_pago FROM pagos 
           WHERE cliente_id = c.usuario_id 
           ORDER BY fecha_pago DESC 
           LIMIT 1),
          c.fecha_inscripcion
        ) as fecha_ultimo_pago,
        (SELECT carnet_url FROM carnets 
         WHERE cliente_id = c.usuario_id 
         ORDER BY id DESC LIMIT 1) as carnet_url
      FROM cliente c
      JOIN usuario u ON c.usuario_id = u.id
      WHERE u.activo = true
      ORDER BY c.fecha_vencimiento ASC
    `;
    
    const result = await pool.query(query);
    
    // Enriquecer con días de retraso
    const clientesEnriquecidos = result.rows.map(cliente => {
      const fechaVencimiento = new Date(cliente.fecha_vencimiento);
      const hoy = new Date();
      const diferenciaMs = hoy.getTime() - fechaVencimiento.getTime();
      const diasRetraso = Math.max(0, Math.floor(diferenciaMs / (1000 * 60 * 60 * 24)));
      
      let estadoPago = 'al-dia';
      let estadoTexto = 'Al día';
      
      if (diasRetraso > 15) {
        estadoPago = 'retraso-severo';
        estadoTexto = `Retraso: ${diasRetraso} días`;
      } else if (diasRetraso > 0) {
        estadoPago = 'retraso-leve';
        estadoTexto = `Retraso: ${diasRetraso} días`;
      }
      
      // Enlace WhatsApp
      const mensajeWhatsApp = encodeURIComponent(`Hola ${cliente.nombre} ${cliente.apellido}, aquí tienes tu carnet del mes abonado. ¡Muchas gracias! 🏋️`);
      const whatsappLink = cliente.telefono 
        ? `https://wa.me/${cliente.telefono.replace(/\D/g, '')}?text=${mensajeWhatsApp}`
        : null;
      
      return {
        ...cliente,
        dias_retraso: diasRetraso,
        estado_pago: estadoPago,
        estado_texto: estadoTexto,
        whatsapp_link: whatsappLink,
        fecha_vencimiento_formatted: fechaVencimiento.toLocaleDateString('es-ES'),
        nombre_completo: `${cliente.nombre} ${cliente.apellido}`
      };
    });
    
    res.json({
      success: true,
      count: clientesEnriquecidos.length,
      data: clientesEnriquecidos
    });
  } catch (error: any) {
    console.error('Error listando clientes con estado:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo clientes'
    });
  }
};

// ============================================
// FUNCIÓN: Registrar pago desde página web
// ============================================
export const registrarPagoCliente = async (req: Request, res: Response) => {
  const client = await pool.connect();
  
  try {
    const { cliente_id, mes, año, monto = 24000, metodo = 'efectivo' } = req.body;
    
    // Validaciones
    if (!cliente_id || !mes || !año) {
      return res.status(400).json({
        success: false,
        message: 'Faltan datos: cliente_id, mes, año'
      });
    }
    
    if (mes < 1 || mes > 12) {
      return res.status(400).json({
        success: false,
        message: 'Mes debe ser entre 1 y 12'
      });
    }
    
    await client.query('BEGIN');
    
    // 1. Obtener datos del cliente
    const clienteQuery = `
      SELECT nombre, apellido, telefono, fecha_inscripcion, usuario_id
      FROM cliente WHERE usuario_id = $1
    `;
    const clienteResult = await client.query(clienteQuery, [cliente_id]);
    
    if (clienteResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
      });
    }
    
    const cliente = clienteResult.rows[0];
    
    // 2. Registrar el pago
    const pagoQuery = `
      INSERT INTO pagos 
      (cliente_id, monto, metodo, estado, periodo_mes, periodo_ano, fecha_pago, fecha_vencimiento)
      VALUES ($1, $2, $3, 'pagado', $4, $5, CURRENT_DATE, CURRENT_DATE + INTERVAL '1 month')
      RETURNING id, fecha_pago;
    `;
    
    const pagoResult = await client.query(pagoQuery, [
      cliente_id, monto, metodo, mes, año
    ]);
    
    const pago = pagoResult.rows[0];
    
    // 3. Actualizar cliente
    await client.query(
      `UPDATE cliente 
       SET fecha_vencimiento = CURRENT_DATE + INTERVAL '1 month',
           estado_cuota = 'activo',
           actualizado_en = CURRENT_TIMESTAMP
       WHERE usuario_id = $1`,
      [cliente_id]
    );
    
    // 4. Generar carnet
    const carnetPNG = await carnetService.generarCarnetPNG(cliente, mes, año);
    
    // 5. Guardar/actualizar carnet
    const carnetExistenteQuery = `
      SELECT id FROM carnets WHERE cliente_id = $1 AND activo = true;
    `;
    const carnetExistente = await client.query(carnetExistenteQuery, [cliente_id]);
    
    let carnetId;
    if (carnetExistente.rows.length > 0) {
      const updateQuery = `
        UPDATE carnets 
        SET meses_pagados = COALESCE(meses_pagados, '[]')::jsonb || $1::jsonb,
            carnet_url = $2,
            fecha_ultima_actualizacion = CURRENT_TIMESTAMP
        WHERE cliente_id = $3
        RETURNING id;
      `;
      
      const mesesPagados = JSON.stringify([{ mes, año }]);
      const updateResult = await client.query(updateQuery, [
        mesesPagados, carnetPNG.url, cliente_id
      ]);
      
      carnetId = updateResult.rows[0].id;
    } else {
      const insertQuery = `
        INSERT INTO carnets 
        (cliente_id, usuario_id, meses_pagados, carnet_url, activo, fecha_desde)
        VALUES ($1, $2, $3, $4, true, CURRENT_DATE)
        RETURNING id;
      `;
      
      const mesesPagados = JSON.stringify([{ mes, año }]);
      const insertResult = await client.query(insertQuery, [
        cliente_id, cliente_id, mesesPagados, carnetPNG.url
      ]);
      
      carnetId = insertResult.rows[0].id;
    }
    
    await client.query('COMMIT');
    
    // 6. Preparar respuesta
    const meses = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 
                   'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];
    const mesNombre = meses[mes - 1];
    
    // Enlace WhatsApp
    const mensajeWhatsApp = encodeURIComponent(`✅ *PAGO CONFIRMADO*\n\nHola ${cliente.nombre} ${cliente.apellido}\n\n🏋️ *Tu carnet del mes abonado está listo:*\n${carnetPNG.url}\n\n📅 *Mes:* ${mesNombre} ${año}\n💰 *Monto:* $${monto.toLocaleString()}\n\n¡Muchas gracias! 💪`);
    const whatsappLink = cliente.telefono 
      ? `https://wa.me/${cliente.telefono.replace(/\D/g, '')}?text=${mensajeWhatsApp}`
      : null;
    
    res.status(201).json({
      success: true,
      message: `✅ Pago registrado para ${cliente.nombre} ${cliente.apellido}`,
      data: {
        pago: {
          id: pago.id,
          fecha: pago.fecha_pago,
          monto,
          mes,
          año,
          mes_nombre: mesNombre
        },
        cliente: {
          id: cliente_id,
          nombre: cliente.nombre,
          apellido: cliente.apellido,
          telefono: cliente.telefono
        },
        carnet: {
          id: carnetId,
          url: carnetPNG.url,
          download_url: `/api/carnets/descargar/${carnetId}`
        },
        whatsapp_link: whatsappLink
      }
    });
    
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('Error registrando pago cliente:', error);
    res.status(500).json({
      success: false,
      message: 'Error al registrar pago',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    client.release();
  }
};

// ============================================
// FUNCIÓN: Registrar pago general (optimizada)
// ============================================
export const registrarPago = async (req: Request, res: Response) => {
  const client = await pool.connect();
  
  try {
    const pagoData: IPagoCreate = req.body;

    // Validaciones
    if (!pagoData.cliente_id || !pagoData.monto || !pagoData.metodo) {
      return res.status(400).json({
        success: false,
        message: 'cliente_id, monto y metodo son requeridos'
      });
    }

    const metodosValidos = ['efectivo', 'tarjeta', 'transferencia', 'otro'];
    if (!metodosValidos.includes(pagoData.metodo)) {
      return res.status(400).json({
        success: false,
        message: `Método inválido. Use: ${metodosValidos.join(', ')}`
      });
    }

    if (pagoData.monto <= 0) {
      return res.status(400).json({
        success: false,
        message: 'El monto debe ser mayor a 0'
      });
    }

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

    await client.query('BEGIN');

    // Registrar pago usando el modelo
    const pagoCreado = await pagoModel.registrar(pagoData);

    // Generar carnet si hay periodo
    let carnetInfo = null;
    
    if (pagoData.periodo_mes && pagoData.periodo_ano) {
      try {
        // Obtener datos del cliente para el carnet
        const clienteQuery = `
          SELECT nombre, apellido, telefono, fecha_inscripcion, usuario_id
          FROM cliente WHERE usuario_id = $1
        `;
        const clienteResult = await client.query(clienteQuery, [pagoData.cliente_id]);
        
        if (clienteResult.rows.length > 0) {
          const cliente = clienteResult.rows[0];
          const carnetPNG = await carnetService.generarCarnetPNG(
            cliente, 
            pagoData.periodo_mes, 
            pagoData.periodo_ano
          );
          
          // Guardar carnet
          const carnetExistenteQuery = `
            SELECT id FROM carnets WHERE cliente_id = $1 AND activo = true;
          `;
          const carnetExistente = await client.query(carnetExistenteQuery, [pagoData.cliente_id]);
          
          let carnetId;
          if (carnetExistente.rows.length > 0) {
            const updateQuery = `
              UPDATE carnets 
              SET meses_pagados = COALESCE(meses_pagados, '[]')::jsonb || $1::jsonb,
                  carnet_url = $2,
                  fecha_ultima_actualizacion = CURRENT_TIMESTAMP
              WHERE cliente_id = $3
              RETURNING id;
            `;
            
            const mesesPagados = JSON.stringify([{ 
              mes: pagoData.periodo_mes, 
              ano: pagoData.periodo_ano 
            }]);
            const updateResult = await client.query(updateQuery, [
              mesesPagados, carnetPNG.url, pagoData.cliente_id
            ]);
            
            carnetId = updateResult.rows[0].id;
          } else {
            const insertQuery = `
              INSERT INTO carnets 
              (cliente_id, usuario_id, meses_pagados, carnet_url, activo, fecha_desde)
              VALUES ($1, $2, $3, $4, true, CURRENT_DATE)
              RETURNING id;
            `;
            
            const mesesPagados = JSON.stringify([{ 
              mes: pagoData.periodo_mes, 
              ano: pagoData.periodo_ano 
            }]);
            const insertResult = await client.query(insertQuery, [
              pagoData.cliente_id, 
              pagoData.cliente_id, 
              mesesPagados, 
              carnetPNG.url
            ]);
            
            carnetId = insertResult.rows[0].id;
          }
          
          carnetInfo = {
            carnet_id: carnetId,
            carnet_url: carnetPNG.url,
            nuevo_carnet: carnetExistente.rows.length === 0
          };
        }
        
        // Actualizar estado del cliente
        if (pagoData.estado === 'pagado' || (pagoCreado && pagoCreado.estado === 'pagado')) {
          await client.query(
            `UPDATE cliente 
             SET estado_cuota = 'activo', 
                 fecha_vencimiento = COALESCE($1, CURRENT_DATE + INTERVAL '1 month'),
                 actualizado_en = CURRENT_TIMESTAMP
             WHERE usuario_id = $2`,
            [pagoData.fecha_vencimiento, pagoData.cliente_id]
          );
        }
      } catch (carnetError: any) {
        console.error('⚠️ Error procesando carnet:', carnetError.message);
      }
    }

    // Enviar WhatsApp en segundo plano
    if (pagoData.estado === 'pagado' || (pagoCreado && pagoCreado.estado === 'pagado')) {
      enviarNotificacionPago(
        pagoData.cliente_id,
        pagoData,
        carnetInfo?.carnet_url
      ).catch(error => {
        console.error('Error en notificación WhatsApp (background):', error);
      });
    }

    await client.query('COMMIT');

    // Responder
    res.status(201).json({
      success: true,
      message: 'Pago registrado exitosamente' + (carnetInfo ? ' y carnet actualizado' : ''),
      data: {
        pago: pagoCreado,
        carnet: carnetInfo,
        notificacion: {
          whatsapp: 'Enviando...'
        }
      }
    });

  } catch (error: any) {
    await client.query('ROLLBACK');
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
  } finally {
    client.release();
  }
};

// ============================================
// FUNCIONES AUXILIARES EXISTENTES
// ============================================

async function enviarNotificacionPago(clienteId: number, pagoData: any, carnetUrl?: string): Promise<void> {
  try {
    if (!twilioService || !twilioService.enviarMensajeWhatsApp) {
      console.log('⚠️ TwilioService no disponible');
      return;
    }

    const clienteResult = await pool.query(
      `SELECT c.*, u.email 
       FROM cliente c 
       JOIN usuario u ON c.usuario_id = u.id 
       WHERE c.usuario_id = $1`,
      [clienteId]
    );

    if (clienteResult.rows.length === 0 || !clienteResult.rows[0].telefono) {
      console.log('⚠️ Cliente sin teléfono registrado, omitiendo WhatsApp');
      return;
    }

    const cliente = clienteResult.rows[0];
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                   'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const mesNombre = pagoData.periodo_mes ? meses[pagoData.periodo_mes - 1] : '';

    let mensaje = `¡Hola ${cliente.nombre}! 👋\n\n`;
    mensaje += `✅ *PAGO REGISTRADO EXITOSAMENTE*\n\n`;
    
    if (pagoData.periodo_mes && pagoData.periodo_ano) {
      mensaje += `📅 *Período:* ${mesNombre} ${pagoData.periodo_ano}\n`;
    }
    
    mensaje += `💰 *Monto:* $${pagoData.monto?.toLocaleString() || '0'}\n`;
    mensaje += `💳 *Método:* ${pagoData.metodo || 'No especificado'}\n`;
    mensaje += `📋 *Estado:* ${pagoData.estado || 'pagado'}\n\n`;
    
    if (carnetUrl) {
      const urlCompleta = `http://localhost:3000${carnetUrl}`;
      mensaje += `🎫 *Tu carnet actualizado:*\n`;
      mensaje += `${urlCompleta}\n\n`;
    }
    
    mensaje += `¡Gracias por tu pago puntual! 💪\n`;
    mensaje += `_Onix Gym Team_`;

    await twilioService.enviarMensajeWhatsApp(
      cliente.telefono,
      mensaje,
      carnetUrl ? `http://localhost:3000${carnetUrl}` : undefined
    );

    console.log(`✅ Notificación enviada a ${cliente.telefono}`);

  } catch (error: any) {
    console.error('⚠️ Error enviando notificación WhatsApp:', error.message);
  }
}

// ============================================
// FUNCIONES RESTANTES (mantener igual)
// ============================================

// [Mantén aquí las funciones existentes que ya tienes en tu archivo pago.controller.ts]
// - listarPagos
// - obtenerPago
// - actualizarPago
// - notificarProximosVencimientos
// - obtenerPagosPorCliente
// - enviarRecordatorioRenovacion
// [Cópialas exactamente como las tienes]

// Función para enviar notificación de renovación pendiente
async function enviarRecordatorioRenovacion(clienteId: number, fechaVencimiento: Date): Promise<void> {
  try {
    if (!twilioService || !twilioService.enviarMensajeWhatsApp) {
      console.log('⚠️ TwilioService no disponible para recordatorios');
      return;
    }

    const clienteResult = await pool.query(
      `SELECT c.*, u.email 
       FROM cliente c 
       JOIN usuario u ON c.usuario_id = u.id 
       WHERE c.usuario_id = $1`,
      [clienteId]
    );

    if (clienteResult.rows.length === 0 || !clienteResult.rows[0].telefono) {
      return;
    }

    const cliente = clienteResult.rows[0];
    const fechaFormateada = fechaVencimiento.toLocaleDateString('es-ES');
    
    let mensaje = `¡Hola ${cliente.nombre}! 👋\n\n`;
    mensaje += `⏰ *RECORDATORIO DE RENOVACIÓN*\n\n`;
    mensaje += `Tu membresía vence el *${fechaFormateada}*\n`;
    mensaje += `Te recomendamos realizar el pago con anticipación para mantener tu acceso al gimnasio.\n\n`;
    mensaje += `💳 *Métodos de pago aceptados:*\n`;
    mensaje += `• Efectivo\n`;
    mensaje += `• Tarjeta débito/crédito\n`;
    mensaje += `• Transferencia bancaria\n\n`;
    mensaje += `¡No pierdas tus beneficios! 💪\n`;
    mensaje += `_Onix Gym Team_`;

    await twilioService.enviarMensajeWhatsApp(
      cliente.telefono,
      mensaje,
      undefined  
    );

    console.log(`✅ Recordatorio enviado a ${cliente.telefono}`);

  } catch (error: any) {
    console.error('⚠️ Error enviando recordatorio:', error.message);
  }
}

export const listarPagos = async (req: Request, res: Response) => {
  try {
    const { cliente_id, mes, ano, estado, metodo } = req.query;

    let query = `
      SELECT 
        p.*,
        c.nombre as cliente_nombre,
        c.apellido as cliente_apellido,
        c.telefono as cliente_telefono
      FROM pagos p
      LEFT JOIN cliente c ON p.cliente_id = c.usuario_id
      WHERE 1=1
    `;
    
    const params: any[] = [];
    let paramIndex = 1;

    if (cliente_id) {
      query += ` AND p.cliente_id = $${paramIndex}`;
      params.push(parseInt(cliente_id as string));
      paramIndex++;
    }

    if (mes) {
      query += ` AND p.periodo_mes = $${paramIndex}`;
      params.push(parseInt(mes as string));
      paramIndex++;
    }

    if (ano) {
      query += ` AND p.periodo_ano = $${paramIndex}`;
      params.push(parseInt(ano as string));
      paramIndex++;
    }

    if (estado) {
      query += ` AND p.estado = $${paramIndex}`;
      params.push(estado);
      paramIndex++;
    }

    if (metodo) {
      query += ` AND p.metodo = $${paramIndex}`;
      params.push(metodo);
      paramIndex++;
    }

    query += ` ORDER BY p.fecha_pago DESC, p.id DESC`;

    const result = await pool.query(query, params);
    const pagos = result.rows;

    res.json({
      success: true,
      count: pagos.length,
      data: pagos
    });

  } catch (error: any) {
    console.error('Error listando pagos:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo pagos',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const obtenerPago = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const pagoId = parseInt(id);

    if (isNaN(pagoId)) {
      return res.status(400).json({
        success: false,
        message: 'ID inválido'
      });
    }

    const query = `
      SELECT 
        p.*,
        c.nombre as cliente_nombre,
        c.apellido as cliente_apellido,
        c.telefono as cliente_telefono,
        u.email as cliente_email
      FROM pagos p
      LEFT JOIN cliente c ON p.cliente_id = c.usuario_id
      LEFT JOIN usuario u ON c.usuario_id = u.id
      WHERE p.id = $1
    `;

    const result = await pool.query(query, [pagoId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Pago no encontrado'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });

  } catch (error: any) {
    console.error('Error obteniendo pago:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo pago'
    });
  }
};

export const actualizarPago = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const pagoId = parseInt(id);
    const datosActualizar = req.body;

    if (isNaN(pagoId)) {
      return res.status(400).json({
        success: false,
        message: 'ID inválido'
      });
    }

    if (datosActualizar.estado && 
        !['pendiente', 'pagado', 'cancelado'].includes(datosActualizar.estado)) {
      return res.status(400).json({
        success: false,
        message: 'Estado debe ser: pendiente, pagado o cancelado'
      });
    }

    if (datosActualizar.monto && datosActualizar.monto <= 0) {
      return res.status(400).json({
        success: false,
        message: 'El monto debe ser mayor a 0'
      });
    }

    const campos: string[] = [];
    const valores: any[] = [];
    let paramIndex = 1;

    if (datosActualizar.monto !== undefined) {
      campos.push(`monto = $${paramIndex}`);
      valores.push(datosActualizar.monto);
      paramIndex++;
    }

    if (datosActualizar.metodo !== undefined) {
      campos.push(`metodo = $${paramIndex}`);
      valores.push(datosActualizar.metodo);
      paramIndex++;
    }

    if (datosActualizar.estado !== undefined) {
      campos.push(`estado = $${paramIndex}`);
      valores.push(datosActualizar.estado);
      paramIndex++;
    }

    if (datosActualizar.periodo_mes !== undefined) {
      campos.push(`periodo_mes = $${paramIndex}`);
      valores.push(datosActualizar.periodo_mes);
      paramIndex++;
    }

    if (datosActualizar.periodo_ano !== undefined) {
      campos.push(`periodo_ano = $${paramIndex}`);
      valores.push(datosActualizar.periodo_ano);
      paramIndex++;
    }

    if (datosActualizar.fecha_pago !== undefined) {
      campos.push(`fecha_pago = $${paramIndex}`);
      valores.push(datosActualizar.fecha_pago);
      paramIndex++;
    }

    campos.push(`actualizado_en = CURRENT_TIMESTAMP`);

    if (campos.length === 1) {
      return res.status(400).json({
        success: false,
        message: 'No se proporcionaron datos para actualizar'
      });
    }

    valores.push(pagoId);

    const query = `
      UPDATE pagos 
      SET ${campos.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await pool.query(query, valores);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Pago no encontrado'
      });
    }

    const pagoActualizado = result.rows[0];

    if (datosActualizar.estado === 'pagado') {
      enviarNotificacionPago(
        pagoActualizado.cliente_id,
        pagoActualizado
      ).catch(error => {
        console.error('Error en notificación WhatsApp (background):', error);
      });
    }

    res.json({
      success: true,
      message: 'Pago actualizado exitosamente',
      data: pagoActualizado
    });

  } catch (error: any) {
    console.error('Error actualizando pago:', error);
    
    if (error.code === '23505') {
      return res.status(400).json({
        success: false,
        message: 'Ya existe un pago para este período'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error actualizando pago'
    });
  }
};

export const notificarProximosVencimientos = async (req: Request, res: Response) => {
  try {
    const query = `
      SELECT 
        c.usuario_id,
        c.nombre,
        c.apellido,
        c.telefono,
        c.fecha_vencimiento,
        EXTRACT(DAY FROM (c.fecha_vencimiento - CURRENT_DATE)) as dias_restantes
      FROM cliente c
      WHERE c.estado_cuota = 'activo'
        AND c.fecha_vencimiento >= CURRENT_DATE
        AND c.fecha_vencimiento <= CURRENT_DATE + INTERVAL '3 days'
        AND c.telefono IS NOT NULL
      ORDER BY c.fecha_vencimiento ASC
    `;

    const result = await pool.query(query);
    const clientes = result.rows;
    
    let notificacionesEnviadas = 0;
    let errores: Array<{cliente: string, telefono: string, error: string}> = [];

    for (const cliente of clientes) {
      try {
        await enviarRecordatorioRenovacion(
          cliente.usuario_id,
          cliente.fecha_vencimiento
        );
        notificacionesEnviadas++;
      } catch (error: any) {
        errores.push({
          cliente: `${cliente.nombre} ${cliente.apellido}`,
          telefono: cliente.telefono,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      message: `Notificaciones de vencimiento procesadas`,
      data: {
        total_clientes: clientes.length,
        notificaciones_enviadas: notificacionesEnviadas,
        errores: errores.length > 0 ? errores : undefined
      }
    });

  } catch (error: any) {
    console.error('Error notificando vencimientos:', error);
    res.status(500).json({
      success: false,
      message: 'Error procesando notificaciones'
    });
  }
};

export const obtenerPagosPorCliente = async (req: Request, res: Response) => {
  try {
    const { clienteId } = req.params;
    const idCliente = parseInt(clienteId);

    if (isNaN(idCliente)) {
      return res.status(400).json({
        success: false,
        message: 'ID de cliente inválido'
      });
    }

    const query = `
      SELECT 
        p.*,
        TO_CHAR(p.fecha_pago, 'DD/MM/YYYY') as fecha_pago_formateada,
        TO_CHAR(p.fecha_vencimiento, 'DD/MM/YYYY') as fecha_vencimiento_formateada
      FROM pagos p
      WHERE p.cliente_id = $1
      ORDER BY p.fecha_pago DESC
    `;

    const result = await pool.query(query, [idCliente]);

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });

  } catch (error: any) {
    console.error('Error obteniendo pagos por cliente:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo pagos del cliente'
    });
  }
};