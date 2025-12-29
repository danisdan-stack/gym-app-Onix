// src/routes/pago.routes.ts - MODIFICADO
import { Router, Request, Response } from 'express';
import pool from '../config/database';
import { CarnetService } from '../services/carnet.service'; // <-- AÑADE

const router = Router();
const carnetService = new CarnetService(); // <-- INSTANCIA

// POST /api/pagos - Registra pago Y genera PNG del carnet
router.post('/', async (req: Request, res: Response) => {
  const client = await pool.connect();
  
  try {
    const { cliente_id, monto, mes, año, metodo = 'efectivo' } = req.body;
    
    console.log('🏋️  Generando carnet PNG para mes:', mes, año);
    
    // 1. VALIDAR (igual)
    if (!cliente_id || !monto || !mes || !año) {
      return res.status(400).json({
        success: false,
        message: 'Faltan datos: cliente_id, monto, mes (1-12), año'
      });
    }
    
    if (mes < 1 || mes > 12) {
      return res.status(400).json({
        success: false,
        message: 'Mes debe ser entre 1 y 12'
      });
    }
    
    await client.query('BEGIN');
    
    // 2. REGISTRAR PAGO EN SQL (igual)
    const pagoQuery = `
      INSERT INTO pagos 
      (cliente_id, monto, metodo, estado, periodo_mes, periodo_ano, fecha_pago)
      VALUES ($1, $2, $3, 'pagado', $4, $5, CURRENT_DATE)
      RETURNING id;
    `;
    
    const pagoResult = await client.query(pagoQuery, [
      cliente_id, monto, metodo, mes, año
    ]);
    
    const pagoId = pagoResult.rows[0].id;
    console.log('✅ Pago registrado ID:', pagoId);
    
    // 3. OBTENER DATOS DEL CLIENTE (igual)
    const clienteQuery = `
      SELECT nombre, apellido, telefono, fecha_inscripcion
      FROM cliente 
      WHERE usuario_id = $1;
    `;
    
    const clienteResult = await client.query(clienteQuery, [cliente_id]);
    
    if (clienteResult.rows.length === 0) {
      throw new Error(`Cliente ${cliente_id} no encontrado`);
    }
    
    const cliente = clienteResult.rows[0];
    console.log('👤 Cliente:', cliente.nombre, cliente.apellido);
    
    // 4. ACTUALIZAR ESTADO DEL CLIENTE (igual)
    await client.query(
      `UPDATE cliente 
       SET estado_cuota = 'activo', actualizado_en = CURRENT_TIMESTAMP
       WHERE usuario_id = $1`,
      [cliente_id]
    );
    
    // 5. ✅ USAR EL SERVICIO para generar carnet PNG
    const carnetPNG = await carnetService.generarCarnetPNG(cliente, mes, año);
    
    // 6. GUARDAR EN TABLA `carnets` (igual)
    const carnetUrl = carnetPNG.url; // <-- Usar URL del servicio
    
    // Buscar si ya existe carnet
    const carnetExistenteQuery = `
      SELECT id FROM carnets WHERE cliente_id = $1 AND activo = true;
    `;
    const carnetExistente = await client.query(carnetExistenteQuery, [cliente_id]);
    
    let carnetId;
    
    if (carnetExistente.rows.length > 0) {
      // Actualizar carnet existente
      const updateQuery = `
        UPDATE carnets 
        SET meses_pagados = $1, carnet_url = $2,
            fecha_ultima_actualizacion = CURRENT_TIMESTAMP
        WHERE cliente_id = $3
        RETURNING id;
      `;
      
      const mesesPagados = JSON.stringify([{ mes, año }]);
      const updateResult = await client.query(updateQuery, [
        mesesPagados, carnetUrl, cliente_id
      ]);
      
      carnetId = updateResult.rows[0].id;
    } else {
      // Crear nuevo carnet
      const insertQuery = `
        INSERT INTO carnets 
        (cliente_id, usuario_id, meses_pagados, carnet_url, activo, fecha_desde)
        VALUES ($1, 1, $2, $3, true, CURRENT_DATE)
        RETURNING id;
      `;
      
      const mesesPagados = JSON.stringify([{ mes, año }]);
      const insertResult = await client.query(insertQuery, [
        cliente_id, mesesPagados, carnetUrl
      ]);
      
      carnetId = insertResult.rows[0].id;
    }
    
    await client.query('COMMIT');
    
    // 7. RESPONDER (igual)
    const mesNombre = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 
                       'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'][mes - 1];
    
    res.status(201).json({
      success: true,
      message: `✅ Pago registrado y carnet generado para ${mesNombre} ${año}`,
      data: {
        pago: {
          id: pagoId,
          cliente_id,
          monto,
          mes,
          año,
          metodo
        },
        carnet: {
          id: carnetId,
          url: carnetUrl,
          descargar: `/api/carnets/descargar/${carnetId}`,
          ver: `http://localhost:3000${carnetUrl}`
        },
        cliente: {
          nombre: cliente.nombre,
          apellido: cliente.apellido,
          estado: 'activo'
        }
      }
    });
    
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('❌ Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error al procesar pago',
      error: error.message
    });
  } finally {
    client.release();
  }
});

export default router;