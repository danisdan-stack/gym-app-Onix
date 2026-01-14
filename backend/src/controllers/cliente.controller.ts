// src/controllers/cliente.controller.ts
import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import pool from '../config/database';
import { ClienteModel } from '../models/Cliente.model';
import { IClienteRegistroRequest } from '../models/interfaces/cliente.interface';
import { CarnetService } from '../services/carnet.service';
import { TwilioService } from '../services/twilio.service';

const clienteModel = new ClienteModel(pool);

export const registrarCliente = async (req: Request, res: Response) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const { usuario, cliente: clienteData }: IClienteRegistroRequest = req.body;
    const { monto, mes, ano, metodo = 'efectivo' } = req.body.pago || {};

    // Validaciones
    if (!usuario?.username || !usuario?.email || !usuario?.password) {
      return res.status(400).json({
        success: false,
        message: 'Datos de usuario incompletos'
      });
    }

    if (!clienteData?.nombre || !clienteData?.apellido) {
      return res.status(400).json({
        success: false,
        message: 'Nombre y apellido son requeridos'
      });
    }

    if (!monto || !mes || !ano) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere pago inicial: monto, mes y año'
      });
    }

    if (mes < 1 || mes > 12) {
      return res.status(400).json({
        success: false,
        message: 'Mes debe estar entre 1 y 12'
      });
    }

    // 1. Crear usuario
    const hashedPassword = await bcrypt.hash(usuario.password, 10);
    
    const usuarioQuery = `
      INSERT INTO usuario (
        username, email, password_hash, rol, activo
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING id, username, email, rol`;
    
    const usuarioResult = await client.query(usuarioQuery, [
      usuario.username,
      usuario.email,
      hashedPassword,
      'cliente',
      true
    ]);
    
    const usuarioCreado = usuarioResult.rows[0];

    // ============================================
    // FECHAS - 1 MES EXACTO DESDE INSCRIPCIÓN
    // ============================================
    const hoy = new Date();
    const fechaVencimiento = new Date(hoy);
    fechaVencimiento.setDate(fechaVencimiento.getDate() + 31); // 30 DÍAS EXACTOS

    console.log('📅 FECHAS CLIENTE NORMAL:');
    console.log('  Inscripción:', hoy.toLocaleDateString());
    console.log('  Vencimiento:', fechaVencimiento.toLocaleDateString(), '(1 mes exacto)');

    // 2. Crear cliente
    const clienteCreado = await clienteModel.crear({
      usuario_id: usuarioCreado.id,
      nombre: clienteData.nombre,
      apellido: clienteData.apellido,
      telefono: clienteData.telefono,
      direccion: clienteData.direccion,
      entrenador_id: clienteData.entrenador_id,
      estado_cuota: 'activo',
      fecha_inscripcion: hoy,
      fecha_vencimiento: fechaVencimiento  // ← 1 MES EXACTO
    }, client);

    // 3. Registrar pago inicial
    const pagoQuery = `
      INSERT INTO pagos 
      (cliente_id, monto, metodo, estado, periodo_mes, periodo_ano, fecha_pago, fecha_vencimiento)
      VALUES ($1, $2, $3, 'pagado', $4, $5, CURRENT_DATE, $6)
      RETURNING id`;
    
    const pagoResult = await client.query(pagoQuery, [
      usuarioCreado.id,
      monto,
      metodo,
      mes,
      ano,
      fechaVencimiento.toISOString().split('T')[0]  // MISMA FECHA
    ]);
    
    const pagoId = pagoResult.rows[0].id;

    // 4. Generar carnet
    const carnetService = new CarnetService();
    const carnetPNG = await carnetService.generarCarnetPNG(
      {
        nombre: clienteData.nombre,
        apellido: clienteData.apellido,
        fecha_inscripcion: new Date() 
      },
      mes,
      ano
    );

    // 5. Guardar carnet
    const mesesPagados = [{ mes, ano }];
    
    const carnetQuery = `
      INSERT INTO carnets 
      (cliente_id, usuario_id, meses_pagados, carnet_url, activo, fecha_desde)
      VALUES ($1, $2, $3, $4, true, CURRENT_DATE)
      RETURNING id`;
    
    const carnetResult = await client.query(carnetQuery, [
      usuarioCreado.id,
      usuarioCreado.id,
      JSON.stringify(mesesPagados),
      carnetPNG.url
    ]);
    
    const carnetId = carnetResult.rows[0].id;

    await client.query('COMMIT');

    // Preparar respuesta
    const meses = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 
                   'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];
    const mesNombre = meses[mes - 1];

    res.status(201).json({
      success: true,
      message: `✅ Cliente registrado con pago y carnet para ${mesNombre} ${ano}`,
      data: {
        usuario: usuarioCreado,
        cliente: clienteCreado,
        pago_inicial: {
          id: pagoId,
          monto,
          mes,
          ano,
          metodo
        },
        carnet: {
          id: carnetId,
          url: carnetPNG.url,
          descargar: `/api/carnets/descargar/${carnetId}`
        }
      }
    });

  } catch (error: any) {
    await client.query('ROLLBACK');
    
    if (error.code === '23505') {
      const mensaje = error.constraint.includes('email') 
        ? 'El email ya está registrado'
        : 'El nombre de usuario ya está en uso';
      
      return res.status(400).json({
        success: false,
        message: mensaje
      });
    }
    
    console.error('Error registrando cliente:', error);
    res.status(500).json({
      success: false,
      message: 'Error al registrar cliente',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    client.release();
  }
};

export const listarClientes = async (req: Request, res: Response) => {
  try {
    const { buscar, estado_cuota, entrenador_id } = req.query;
    
    const filtros = {
      buscar: buscar as string,
      estado_cuota: estado_cuota as 'activo' | 'inactivo' | 'suspendido' | 'todos',
      entrenador_id: entrenador_id ? parseInt(entrenador_id as string) : undefined
    };

    const clientes = await clienteModel.buscarTodos(filtros);
    
    res.json({
      success: true,
      count: clientes.length,
      data: clientes
    });
  } catch (error: any) {
    console.error('Error listando clientes:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo clientes',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const obtenerCliente = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const usuarioId = parseInt(id);

    if (isNaN(usuarioId)) {
      return res.status(400).json({
        success: false,
        message: 'ID inválido'
      });
    }

    const cliente = await clienteModel.buscarPorId(usuarioId);
    
    if (!cliente) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
      });
    }

    res.json({
      success: true,
      data: cliente
    });
  } catch (error: any) {
    console.error('Error obteniendo cliente:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo cliente',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const actualizarCliente = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const usuarioId = parseInt(id);
    const datosActualizar = req.body;

    if (isNaN(usuarioId)) {
      return res.status(400).json({
        success: false,
        message: 'ID inválido'
      });
    }

    if (!datosActualizar || Object.keys(datosActualizar).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No se proporcionaron datos para actualizar'
      });
    }

    if (datosActualizar.estado_cuota && 
        !['activo', 'inactivo', 'suspendido'].includes(datosActualizar.estado_cuota)) {
      return res.status(400).json({
        success: false,
        message: 'estado_cuota debe ser: activo, inactivo o suspendido'
      });
    }

    const clienteActualizado = await clienteModel.actualizar(usuarioId, datosActualizar);
    
    res.json({
      success: true,
      message: 'Cliente actualizado exitosamente',
      data: clienteActualizado
    });

  } catch (error: any) {
    console.error('Error actualizando cliente:', error);
    
    if (error.message === 'Cliente no encontrado') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    
    if (error.message === 'No se proporcionaron datos para actualizar') {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error actualizando cliente',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ============================================
// ✅ FUNCIÓN: REGISTRO RÁPIDO CORREGIDO
// ============================================
export const registrarClienteRapido = async (req: Request, res: Response) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const { nombre, apellido, celular } = req.body;

    if (!nombre || !apellido || !celular) {
      return res.status(400).json({
        success: false,
        message: 'Nombre, apellido y celular son requeridos'
      });
    }

    const celularRegex = /^[0-9]{10}$/;
    if (!celularRegex.test(celular)) {
      return res.status(400).json({
        success: false,
        message: 'Celular debe tener 10 dígitos'
      });
    }

    // ============================================
    // GENERAR DATOS AUTOMÁTICAMENTE
    // ============================================
    const email = `${nombre.toLowerCase()}.${apellido.toLowerCase()}${celular.substring(6)}@gym.com`;
    const username = `${nombre.toLowerCase()}${apellido.substring(0, 3).toLowerCase()}${Date.now().toString().substr(-4)}`;
    const password = 'cliente' + celular.substring(6);
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const hoy = new Date(); // ← USAR 'hoy' aquí también
    const mesActual = hoy.getMonth() + 1;
    const añoActual = hoy.getFullYear();
    const monto = 24000.00;
    const metodo = 'efectivo';

    // ============================================
    // 1. CREAR USUARIO
    // ============================================
    const usuarioQuery = `
      INSERT INTO usuario (
        username, email, password_hash, rol, activo
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING id, username, email, rol`;
    
    const usuarioResult = await client.query(usuarioQuery, [
      username,
      email,
      hashedPassword,
      'cliente',
      true
    ]);
    
    const usuarioCreado = usuarioResult.rows[0];

    // ============================================
    // FECHAS - 1 MES EXACTO DESDE INSCRIPCIÓN
    // ============================================
    const fechaVencimiento = new Date(hoy);
   fechaVencimiento.setDate(fechaVencimiento.getDate() + 31); // ← 30 DÍAS EXACTOS

    console.log('📅 FECHAS CLIENTE RÁPIDO:');
    console.log('  Inscripción:', hoy.toLocaleDateString());
    console.log('  Vencimiento:', fechaVencimiento.toLocaleDateString(), '(1 mes exacto)');
    console.log('  Diferencia días:', 
      Math.round((fechaVencimiento.getTime() - hoy.getTime()) / (1000 * 3600 * 24)));

    // ============================================
    // 2. CREAR CLIENTE
    // ============================================
    const clienteCreado = await clienteModel.crear({
      usuario_id: usuarioCreado.id,
      nombre: nombre,
      apellido: apellido,
      telefono: celular,
      estado_cuota: 'activo',
      fecha_inscripcion: hoy,
      fecha_vencimiento: fechaVencimiento  // ← 1 MES EXACTO
    }, client);

    // ============================================
    // 3. REGISTRAR PAGO INICIAL
    // ============================================
    const pagoQuery = `
      INSERT INTO pagos 
      (
        cliente_id, 
        monto, 
        metodo, 
        fecha_vencimiento,
        estado,
        tipo_pago,
        periodo_mes, 
        periodo_ano
      )
      VALUES ($1, $2, $3, $4, 'pagado', 'normal', $5, $6)
      RETURNING id`;

    const pagoResult = await client.query(pagoQuery, [
      usuarioCreado.id,
      monto,
      metodo,
      fechaVencimiento.toISOString().split('T')[0],  // MISMA FECHA
      mesActual,
      añoActual
    ]);

    const pagoId = pagoResult.rows[0].id;

    // ============================================
    // 4. GENERAR CARNET
    // ============================================
    const carnetService = new CarnetService();
    const carnetPNG = await carnetService.generarCarnetPNG(
      {
        nombre: nombre,
        apellido: apellido,
        fecha_inscripcion: hoy
      },
      mesActual,
      añoActual
    );

    // ============================================
    // 5. GUARDAR CARNET
    // ============================================
    const mesesPagados = [{ mes: mesActual, ano: añoActual }];
    
    const carnetQuery = `
      INSERT INTO carnets 
      (cliente_id, usuario_id, meses_pagados, carnet_url, activo, fecha_desde)
      VALUES ($1, $2, $3, $4, true, CURRENT_DATE)
      RETURNING id`;
    
    const carnetResult = await client.query(carnetQuery, [
      usuarioCreado.id,
      usuarioCreado.id,
      JSON.stringify(mesesPagados),
      carnetPNG.url
    ]);
    
    const carnetId = carnetResult.rows[0].id;

    // ============================================
    // 6. ENVIAR WHATSAPP
    // ============================================
    console.log('📱 Enviando carnet por WhatsApp a:', celular);

    let whatsappEnviado = false;
    let whatsappError: string | null = null;
    let whatsappSid: string | null = null;
    let urlCompletaCarnet = '';

    try {
      const twilioService = new TwilioService();
      let urlCarnetLimpia = carnetPNG.url.trim();
      if (!urlCarnetLimpia.startsWith('/')) {
        urlCarnetLimpia = '/' + urlCarnetLimpia;
      }
      urlCompletaCarnet = `https://woodrow-opprobrious-hypercarnally.ngrok-free.dev${urlCarnetLimpia}`;
      
      console.log('🔗 URL para WhatsApp:', urlCompletaCarnet);
      
      const resultado = await twilioService.enviarCarnetBienvenida(
        { id: usuarioCreado.id, nombre, apellido, telefono: celular },
        urlCompletaCarnet
      );
      
      whatsappEnviado = resultado.status !== 'failed';
      whatsappSid = resultado.sid;
      whatsappError = resultado.error || null;
      
      if (whatsappEnviado) {
        console.log('✅ WhatsApp enviado. SID:', whatsappSid);
      } else {
        console.warn('⚠️ WhatsApp falló:', whatsappError);
      }
      
    } catch (error: any) {
      console.warn('⚠️ Error procesando WhatsApp:', error.message);
      whatsappError = error.message;
    }

    await client.query('COMMIT');

    // ============================================
    // 7. PREPARAR RESPUESTA
    // ============================================
    const meses = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 
                   'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];
    const mesNombre = meses[mesActual - 1];
    
    res.status(201).json({
      success: true,
      message: `✅ Cliente registrado con pago de $${monto.toLocaleString()}`,
      data: {
        id: usuarioCreado.id,
        nombre,
        apellido,
        celular,
         estado_cuota: 'activo',
    fecha_vencimiento: fechaVencimiento.toISOString().split('T')[0],
    fecha_inscripcion: hoy.toISOString().split('T')[0],
        pago: {
          id: pagoId,
          monto,
          monto_formateado: `$${monto.toLocaleString()}`,
          mes: mesActual,
          mes_nombre: mesNombre,
          ano: añoActual,
          metodo
         
        },
        
        carnet: {
          id: carnetId,
          url: carnetPNG.url,
          direct_url: urlCompletaCarnet,
          download_url: `/api/carnets/descargar/${carnetId}`
        },
        
        whatsapp: {
          enviado: whatsappEnviado,
          sid: whatsappSid,
          error: whatsappError
        }
      }
    });

  } catch (error: any) {
    await client.query('ROLLBACK');
    
    if (error.code === '23505') {
      const mensaje = error.constraint.includes('telefono')
        ? 'El celular ya está registrado'
        : 'Error de duplicado en la base de datos';
      
      return res.status(400).json({
        success: false,
        message: mensaje
      });
    }
    
    console.error('Error registrando cliente rápido:', error);
    res.status(500).json({
      success: false,
      message: 'Error al registrar cliente',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    client.release();
  }
};

export const listarClientesSimplificado = async (req: Request, res: Response) => {
  try {
    const query = `
      SELECT 
        c.usuario_id as id,
        c.nombre,
        c.apellido,
        c.telefono,
        c.estado_cuota,
        TO_CHAR(c.fecha_inscripcion, 'DD/MM/YYYY') as fecha_inscripcion,
        TO_CHAR(c.fecha_vencimiento, 'DD/MM/YYYY') as fecha_vencimiento,
        (SELECT carnet_url FROM carnets WHERE cliente_id = c.usuario_id ORDER BY id DESC LIMIT 1) as carnet_url
      FROM cliente c
      JOIN usuario u ON c.usuario_id = u.id
      WHERE u.activo = true
      ORDER BY c.fecha_inscripcion DESC
    `;
    
    const result = await pool.query(query);
    
    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (error: any) {
    console.error('Error listando clientes simplificado:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo clientes'
    });
  }
};

export const listarClientesConCarnet = async (req: Request, res: Response) => {
  try {
    const query = `
      SELECT 
        c.usuario_id,
        c.nombre,
        c.apellido,
        c.telefono,
        c.estado_cuota,
        TO_CHAR(c.fecha_inscripcion, 'DD/MM/YYYY') as fecha_inscripcion,
        TO_CHAR(c.fecha_vencimiento, 'DD/MM/YYYY') as fecha_vencimiento,
        ct.carnet_url
      FROM cliente c
      LEFT JOIN carnets ct ON c.usuario_id = ct.cliente_id
      ORDER BY c.fecha_inscripcion DESC
    `;
    
    const result = await pool.query(query);
    
    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (error: any) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo clientes con carnet'
    });
  }
};