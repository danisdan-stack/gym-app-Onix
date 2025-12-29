// controllers/carnet.controller.ts
import { Request, Response } from 'express';
import { CarnetService } from '../services/carnet.service';
import * as fs from 'fs';
import * as path from 'path';

const carnetService = new CarnetService();

/**
 * @desc    Descargar carnet en PNG
 * @route   GET /api/carnets/descargar/:id
 * @access  Público
 */

export const descargarCarnetPNG = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { mes, año } = req.query;
    
    console.log(`📥 [Carnet] Solicitud de descarga - ID: ${id}, Mes: ${mes || 'actual'}, Año: ${año || 'actual'}`);
    
    // ------------------------------------------------------
    // 1. OBTENER CLIENTE DESDE BASE DE DATOS
    // ------------------------------------------------------
    // DESCOMENTA Y ADAPTA ESTA PARTE CON TU MODELO REAL:
    /*
    import Cliente from '../models/Cliente'; // Ajusta la ruta
    
    const cliente = await Cliente.findById(id);
    if (!cliente) {
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado'
      });
    }
    
    const datosCliente = {
      nombre: cliente.nombre,
      apellido: cliente.apellido,
      fecha_inscripcion: cliente.fecha_inscripcion
    };
    */
    
    // DATOS DE EJEMPLO (ELIMINA CUANDO USES EL MODELO REAL)
    const datosCliente = {
      nombre: 'TIPO',
      apellido: 'LETRA',
      fecha_inscripcion: new Date()
    };
    
    // ------------------------------------------------------
    // 2. DETERMINAR MES Y AÑO
    // ------------------------------------------------------
    const hoy = new Date();
    const mesNum = mes ? parseInt(mes as string) : hoy.getMonth() + 1;
    const añoNum = año ? parseInt(año as string) : hoy.getFullYear();
    
    // Validar mes válido
    if (mesNum < 1 || mesNum > 12) {
      return res.status(400).json({
        success: false,
        message: 'Mes inválido. Debe ser entre 1 y 12'
      });
    }
    
    // ------------------------------------------------------
    // 3. GENERAR EL CARNET
    // ------------------------------------------------------
    console.log(`🎨 [Carnet] Generando PNG para: ${datosCliente.nombre} ${datosCliente.apellido}, Mes: ${mesNum}, Año: ${añoNum}`);
    
    // Opción A: Si tienes el método generarCarnetBuffer en tu servicio
    try {
      const pngBuffer = await carnetService.generarCarnetBuffer(
        datosCliente,
        mesNum,
        añoNum
      );
      
      // ------------------------------------------------------
      // 4. ENVIAR RESPUESTA COMO DESCARGA
      // ------------------------------------------------------
      const nombreArchivo = `carnet-${datosCliente.nombre.toLowerCase()}-${datosCliente.apellido.toLowerCase()}-${mesNum}-${añoNum}.png`;
      
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo}"`);
      res.setHeader('Content-Length', pngBuffer.length);
      
      console.log(`✅ [Carnet] PNG generado correctamente: ${nombreArchivo} (${pngBuffer.length} bytes)`);
      res.send(pngBuffer);
      
    } catch (serviceError) {
      // Si no existe generarCarnetBuffer, usar el método existente
      console.log('⚠️ [Carnet] Usando método alternativo...');
      
      const resultado = await carnetService.generarCarnetPNG(
        datosCliente,
        mesNum,
        añoNum
      );
      
      if (!fs.existsSync(resultado.path)) {
        throw new Error(`Archivo no encontrado: ${resultado.path}`);
      }
      
      const pngBuffer = fs.readFileSync(resultado.path);
      const nombreArchivo = path.basename(resultado.path);
      
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo}"`);
      res.setHeader('Content-Length', pngBuffer.length);
      
      console.log(`✅ [Carnet] PNG descargado desde archivo: ${nombreArchivo}`);
      res.send(pngBuffer);
    }
    
  } catch (error: any) {
    console.error('❌ [Carnet] Error en descarga:', error);
    
    // Enviar error como JSON
    res.status(500).json({
      success: false,
      message: 'Error al generar el carnet PNG',
       error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * @desc    Ver carnet en el navegador (sin descargar)
 * @route   GET /api/carnets/ver/:id
 * @access  Público
 */
export const verCarnet = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { mes, año } = req.query;
    
    console.log(`👁️ [Carnet] Solicitud para ver - ID: ${id}`);
    
    // Datos de ejemplo
    const datosCliente = {
      nombre: 'TIPO',
      apellido: 'LETRA',
      fecha_inscripcion: new Date()
    };
    
    const hoy = new Date();
    const mesNum = mes ? parseInt(mes as string) : hoy.getMonth() + 1;
    const añoNum = año ? parseInt(año as string) : hoy.getFullYear();
    
    // Intentar usar generarCarnetBuffer
    try {
      const pngBuffer = await carnetService.generarCarnetBuffer(
        datosCliente,
        mesNum,
        añoNum
      );
      
      res.setHeader('Content-Type', 'image/png');
      res.send(pngBuffer);
      
    } catch {
      // Fallback al método existente
      const resultado = await carnetService.generarCarnetPNG(
        datosCliente,
        mesNum,
        añoNum
      );
      
      if (fs.existsSync(resultado.path)) {
        const pngBuffer = fs.readFileSync(resultado.path);
        res.setHeader('Content-Type', 'image/png');
        res.send(pngBuffer);
      } else {
        throw new Error('No se pudo generar la imagen');
      }
    }
    
  } catch (error) {
    console.error('❌ [Carnet] Error al ver carnet:', error);
    res.status(500).send('Error generando imagen del carnet');
  }
};

/**
 * @desc    Verificar estado del servicio de carnets
 * @route   GET /api/carnets/health
 * @access  Público
 */
export const healthCheck = (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Servicio de carnets funcionando',
    timestamp: new Date().toISOString(),
    endpoints: {
      descargar: 'GET /api/carnets/descargar/:id',
      ver: 'GET /api/carnets/ver/:id',
      health: 'GET /api/carnets/health'
    }
  });
};