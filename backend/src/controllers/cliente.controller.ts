// src/controllers/cliente.controller.ts
import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import pool from '../config/database';
import { ClienteModel } from '../models/Cliente.model';
import { IClienteRegistroRequest } from '../models/interfaces/cliente.interface';
import { CarnetService } from '../services/carnet.service';

const clienteModel = new ClienteModel(pool);

export const registrarCliente = async (req: Request, res: Response) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const { usuario, cliente: clienteData }: IClienteRegistroRequest = req.body;

    // ✅ NUEVO: Agregar datos del pago al request
    const { monto, mes, ano, metodo = 'efectivo' } = req.body.pago || {};

    // Validaciones existentes + nuevas
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

    // ✅ NUEVO: Validar datos del pago inicial
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

    // 1. Crear usuario (existente)
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

    // 2. Crear cliente (existente) con estado ACTIVO desde el inicio
    const clienteCreado = await clienteModel.crear({
      usuario_id: usuarioCreado.id,
      nombre: clienteData.nombre,
      apellido: clienteData.apellido,
      telefono: clienteData.telefono,
      direccion: clienteData.direccion,
      entrenador_id: clienteData.entrenador_id,
      estado_cuota: 'activo', // ✅ ACTIVO desde el primer día
      fecha_inscripcion: clienteData.fecha_inscripcion || new Date(),
      fecha_vencimiento: clienteData.fecha_vencimiento || new Date(new Date().setMonth(new Date().getMonth() + 1))
    }, client);

    // ✅ NUEVO: 3. Registrar pago inicial
    const pagoQuery = `
  INSERT INTO pagos 
  (cliente_id, monto, metodo, estado, periodo_mes, periodo_ano, fecha_pago, fecha_vencimiento)
  VALUES ($1, $2, $3, 'pagado', $4, $5, CURRENT_DATE, CURRENT_DATE + INTERVAL '1 month')
  RETURNING id`;
  
    const pagoResult = await client.query(pagoQuery, [
      usuarioCreado.id,
      monto,
      metodo,
      mes,
      ano
    ]);
    
    const pagoId = pagoResult.rows[0].id;
    console.log('✅ Pago inicial registrado ID:', pagoId);

    // ✅ NUEVO: 4. Generar carnet con el mes pagado
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
    
    console.log('✅ Carnet generado:', carnetPNG.url);

    // ✅ NUEVO: 5. Guardar carnet en BD
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

    // ✅ NUEVO: Preparar respuesta con pago y carnet
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
          descargar: `/api/carnets/descargar/${carnetId}`,
          ver: `http://localhost:3000${carnetPNG.url}`
        }
      }
    });

  } catch (error: any) {
    await client.query('ROLLBACK');
    
    // Manejo de errores (tu código existente)
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

    // Validar que haya datos para actualizar
    if (!datosActualizar || Object.keys(datosActualizar).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No se proporcionaron datos para actualizar'
      });
    }

    // Validar estado_cuota si viene
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