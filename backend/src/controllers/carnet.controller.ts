// controllers/carnet.controller.ts - VERSIÓN CORREGIDA
import { Request, Response } from 'express';
import { CarnetService } from '../services/carnet.service';
import { createClient } from '@supabase/supabase-js';

// Configuración SUPABASE (igual que en otros lugares)
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const carnetService = new CarnetService();

export const descargarCarnetPNG = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { mes, año } = req.query;
    
    console.log(`📥 Descargar carnet para ID: ${id}`);
    
    // 1. VALIDAR QUE NO SEA "undefined"
    if (!id || id === 'undefined' || id === 'null') {
      console.error('❌ ID inválido recibido:', id);
      return res.status(400).send('ID de cliente no válido');
    }
    
    // 2. CONVERTIR A NÚMERO (usuario_id)
    const usuarioId = parseInt(id);
    
    if (isNaN(usuarioId)) {
      console.error('❌ ID no es número:', id);
      return res.status(400).send('ID debe ser un número');
    }
    
    console.log(`🔍 Buscando cliente con usuario_id: ${usuarioId}`);
    
    // 3. BUSCAR EN SUPABASE (TABLA 'cliente', campo 'usuario_id')
    const { data: cliente, error: clienteError } = await supabase
      .from('cliente')
      .select('nombre, apellido, fecha_inscripcion')
      .eq('usuario_id', usuarioId)  // ← ¡BUSCAR POR usuario_id!
      .single();
    
    if (clienteError || !cliente) {
      console.error('❌ Cliente no encontrado:', {
        usuario_id: usuarioId,
        error: clienteError?.message
      });
      
      // ❌ NO usar datos falsos - mejor error claro
      return res.status(404).json({
        success: false,
        message: 'Cliente no encontrado en la base de datos',
        suggestion: 'Verifica que el cliente esté registrado'
      });
    }
    
    console.log(`✅ Cliente REAL encontrado: ${cliente.nombre} ${cliente.apellido}`);
    
    // 4. BUSCAR ÚLTIMO PAGO para obtener mes/año
    const { data: ultimoPago } = await supabase
      .from('pagos')
      .select('periodo_mes, periodo_ano')
      .eq('cliente_id', usuarioId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    // 5. DETERMINAR MES/AÑO
    const hoy = new Date();
    const mesNum = mes ? parseInt(mes as string) : 
                   ultimoPago?.periodo_mes || hoy.getMonth() + 1;
    
    const añoNum = año ? parseInt(año as string) : 
                   ultimoPago?.periodo_ano || hoy.getFullYear();
    
    console.log(`📅 Periodo: ${mesNum}/${añoNum}`);
    
    // 6. GENERAR CARNET CON DATOS REALES
    console.log(`🎨 Generando para: ${cliente.nombre} ${cliente.apellido}`);
    
    const carnetBuffer = await carnetService.generarCarnetBuffer(
      {
        nombre: cliente.nombre,
        apellido: cliente.apellido,
        fecha_inscripcion: cliente.fecha_inscripcion || new Date(),
        id: usuarioId  // ← Pasar ID para el servicio si lo necesita
      },
      mesNum,
      añoNum
    );
    
    // 7. ENVIAR RESPUESTA
    const nombreArchivo = `carnet-${cliente.nombre}-${cliente.apellido}-${mesNum}-${añoNum}.png`;
    
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', `inline; filename="${nombreArchivo}"`);
    
    console.log(`✅ Enviando carnet: ${nombreArchivo}`);
    return res.send(carnetBuffer);
    
  } catch (error: any) {
    console.error('💥 Error crítico en descargarCarnetPNG:', error);
    
    // Error detallado pero seguro
    res.status(500).json({
      success: false,
      message: 'Error generando carnet',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      suggestion: 'Contacta al administrador del sistema'
    });
  }
};

// Opcional: mantener las otras funciones si las necesitas
export const healthCheck = (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Servicio de carnets funcionando',
    timestamp: new Date().toISOString(),
    config: {
      supabase: !!process.env.SUPABASE_URL,
      carnetService: true
    }
  });
};

export const verCarnet = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    console.log(`👀 Ver carnet para ID: ${id}`);
    
    // Redirigir al endpoint de descarga
    return res.redirect(`/api/carnets/descargar/${id}`);
    
  } catch (error: any) {
    console.error('Error en verCarnet:', error);
    res.status(500).json({
      success: false,
      message: 'Error accediendo al carnet'
    });
  }
};
// �ltimo cambio: 2026-01-19 18:22:53
