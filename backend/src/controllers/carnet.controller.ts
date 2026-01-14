// controllers/carnet.controller.ts - VERSIÓN COMPLETA
import { Request, Response } from 'express';
import { CarnetService } from '../services/carnet.service';
import * as fs from 'fs';
import * as path from 'path';
import { Pool } from 'pg';
import { ClienteModel } from '../models/Cliente.model';

// Configuración EXACTA de tu PostgreSQL
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'bd_gym',          // ← NOMBRE CORRECTO
  user: 'postgres',
  password: 'postgres123'      // ← CONTRASEÑA CORRECTA
});

const clienteModel = new ClienteModel(pool);
const carnetService = new CarnetService();

export const descargarCarnetPNG = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { mes, año } = req.query;
    
    console.log(`📥 Descargar carnet para ID: ${id}`);
    
    // 1. DATOS POR DEFECTO (SIEMPRE DEFINIDOS)
    let datosCliente = {
      nombre: 'Cliente',
      apellido: id.toString(),
      fecha_inscripcion: new Date()
    };
    
    // 2. INTENTAR OBTENER DE DB
    try {
      const usuarioId = parseInt(id);
      
      if (!isNaN(usuarioId)) {
        console.log(`🔍 Buscando cliente ID: ${usuarioId}`);
        const cliente = await clienteModel.buscarPorId(usuarioId);
        
        if (cliente) {
          console.log(`✅ Cliente REAL: ${cliente.nombre} ${cliente.apellido}`);
          // REASIGNAR con datos reales
          datosCliente = {
            nombre: cliente.nombre,
            apellido: cliente.apellido,
            fecha_inscripcion: cliente.fecha_inscripcion || new Date()
          };
        }
      }
    } catch (dbError: any) {
      console.error('❌ Error DB:', dbError.message);
      // Mantiene datos por defecto
    }
    
    // 3. Mes y año
    const hoy = new Date();
    const mesNum = mes ? parseInt(mes as string) : hoy.getMonth() + 1;
    const añoNum = año ? parseInt(año as string) : hoy.getFullYear();
    
    // 4. Generar carnet (datosCliente SIEMPRE está definido)
    console.log(`🎨 Generando para: ${datosCliente.nombre} ${datosCliente.apellido}`);
    
    try {
      const pngBuffer = await carnetService.generarCarnetBuffer(
        datosCliente, // ← ESTÁ DEFINIDO
        mesNum,
        añoNum
      );
      
      const nombreArchivo = `carnet-${datosCliente.nombre}-${datosCliente.apellido}-${mesNum}-${añoNum}.png`;
      
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo}"`);
      
      console.log(`✅ Enviando: ${nombreArchivo}`);
      return res.send(pngBuffer);
      
    } catch (error) {
      // Fallback
      const resultado = await carnetService.generarCarnetPNG(
        datosCliente, // ← ESTÁ DEFINIDO
        mesNum,
        añoNum
      );
      
      if (fs.existsSync(resultado.path)) {
        const pngBuffer = fs.readFileSync(resultado.path);
        res.setHeader('Content-Type', 'image/png');
        return res.send(pngBuffer);
      }
    }
    
  } catch (error: any) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generando carnet'
    });
  }
};

// Las funciones verCarnet y healthCheck quedan IGUAL a tu versión anterior
export const verCarnet = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const datosCliente = {
      nombre: 'Cliente',
      apellido: id.toString(),
      fecha_inscripcion: new Date()
    };
    
    const resultado = await carnetService.generarCarnetPNG(
      datosCliente,
      1,
      2024
    );
    
    if (fs.existsSync(resultado.path)) {
      const pngBuffer = fs.readFileSync(resultado.path);
      res.setHeader('Content-Type', 'image/png');
      return res.send(pngBuffer);
    } else {
      res.status(404).send('No encontrado');
    }
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Error');
  }
};

export const healthCheck = (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Servicio de carnets funcionando',
    timestamp: new Date().toISOString()
  });
};