// controllers/carnet.controller.ts - VERSIÓN FINAL
import { Request, Response } from 'express';
import { CarnetService } from '../services/carnet.service';
import pool from '../config/database';

const carnetService = new CarnetService();

export const descargarCarnetPNG = async (req: Request, res: Response) => {
  console.log('🎬 ===== INICIO GENERACIÓN CARNET =====');
  
  try {
    const { id } = req.params;
    console.log(`📱 ID solicitado: ${id}`);
    
    const usuarioId = parseInt(id);
    console.log(`🔢 ID parseado: ${usuarioId}`);
    
    // 1. BUSCAR CLIENTE
    console.log(`🔍 Buscando cliente usuario_id=${usuarioId}...`);
    
    const clienteResult = await pool.query(
      'SELECT * FROM cliente WHERE usuario_id = $1',
      [usuarioId]
    );
    
    console.log(`📊 Clientes encontrados: ${clienteResult.rowCount}`);
    
    if (clienteResult.rowCount === 0) {
      console.log('❌ CLIENTE NO ENCONTRADO - 404');
      return res.status(404).json({ 
        success: false,
        error: 'Cliente no encontrado'
      });
    }
    
    const cliente = clienteResult.rows[0];
    console.log(`✅ Cliente encontrado:`, {
      id: cliente.id,
      nombre: cliente.nombre,
      apellido: cliente.apellido,
      usuario_id: cliente.usuario_id,
      estado_cuota: cliente.estado_cuota
    });
    
    // 2. VERIFICAR MEMBRESÍA
    console.log(`🔍 Verificando membresía para cliente_id=${cliente.id}...`);
    
    const membresiaResult = await pool.query(
      `SELECT * FROM membresias WHERE cliente_id = $1 AND estado = 'activa'`,
      [cliente.id]
    );
    
    console.log(`📊 Membresías activas: ${membresiaResult.rowCount}`);
    
    if (membresiaResult.rowCount === 0) {
      console.log('⚠️  SIN MEMBRESÍA ACTIVA - 400');
      return res.status(400).json({
        success: false,
        error: 'No tiene membresía activa'
      });
    }
    
    const membresia = membresiaResult.rows[0];
    console.log(`✅ Membresía activa:`, {
      id: membresia.id,
      fecha_inicio: membresia.fecha_inicio,
      fecha_fin: membresia.fecha_fin
    });
    
    // 3. GENERAR FECHAS
    const hoy = new Date();
    const mes = hoy.getMonth() + 1;
    const año = hoy.getFullYear();
    
    console.log(`📅 Fecha actual: ${hoy.toISOString()}`);
    console.log(`📆 Mes/Año: ${mes}/${año}`);
    
    // 4. LLAMAR A CARNET SERVICE
    console.log(`🎨 Llamando a carnetService.generarCarnetPNG()...`);
    
    const datosCarnet = {
      nombre: cliente.nombre,
      apellido: cliente.apellido,
      fecha_inscripcion: cliente.fecha_inscripcion || hoy,
      id: cliente.usuario_id
    };
    
    console.log(`📋 Datos enviados:`, datosCarnet);
    
    const carnetInfo = await carnetService.generarCarnetPNG(
      datosCarnet,
      mes,
      año
    );
    
    console.log(`📤 Resultado carnetService:`, {
      success: carnetInfo.success,
      url: carnetInfo.url,
      error: carnetInfo.error || 'Ninguno'
    });
    
    if (!carnetInfo.success) {
      console.log('❌ CARNET SERVICE FALLÓ - 500');
      return res.status(500).json({
        success: false,
        error: 'Error al generar carnet',
        detalle: carnetInfo.error
      });
    }
    
    // 5. GENERAR BUFFER
    console.log(`🖼️ Generando buffer para respuesta...`);
    
    const carnetBuffer = await carnetService.generarCarnetBuffer(
      datosCarnet,
      mes,
      año
    );
    
    console.log(`📦 Buffer generado: ${carnetBuffer.length} bytes`);
    
    // 6. ENVIAR RESPUESTA
    console.log(`📤 Enviando respuesta con imagen PNG...`);
    
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', `inline; filename="carnet-${cliente.nombre}-${cliente.apellido}.png"`);
    
    if (carnetInfo.url) {
      res.setHeader('X-Carnet-URL', carnetInfo.url);
    }
    
    console.log('✅ CARNET ENVIADO EXITOSAMENTE');
    console.log('🎬 ===== FIN GENERACIÓN =====\n');
    
    return res.send(carnetBuffer);
    
  } catch (error: any) {
    console.error('💥 ERROR GENERAL:', error);
    console.error('🔍 Stack:', error.stack);
    console.log('🎬 ===== FIN CON ERROR =====\n');
    
    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      detalle: error.message
    });
  }
};

// Elimina estas funciones si no las necesitas:
// - verificarCarnet (usa Supabase)
// - La instancia de Supabase al inicio

export const healthCheck = (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Servicio de carnets funcionando',
    timestamp: new Date().toISOString()
  });
};

export const verCarnet = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    return res.redirect(`/api/carnets/descargar/${id}`);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error accediendo al carnet'
    });
  }
};