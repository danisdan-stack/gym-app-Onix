import dotenv from 'dotenv';
dotenv.config(); // Esto carga las variables de .env

import { createCanvas, loadImage, registerFont, Canvas, 
  CanvasRenderingContext2D } from 'canvas';
import * as fs from 'fs';
import * as path from 'path';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { PoolClient } from 'pg';


/* ======================================================
   REGISTRO DE FUENTE
====================================================== */
const fontPath = path.join(__dirname, '../../storage/Fonts/Anton-Regular.ttf');
if (fs.existsSync(fontPath)) {
  registerFont(fontPath, { family: 'Anton' });
  console.log('✅ Fuente Anton registrada');
} else {
  console.warn('⚠️ Fuente Anton no encontrada:', fontPath);
}

/* ======================================================
   INTERFAZ ESTRICTA
====================================================== */
export interface CarnetData {
  clienteId: number;
  nombre: string;
  apellido: string;
  fechaPago: Date;
  mes: number; // 1–12
  año: number;
}

/* ======================================================
   SERVICIO
====================================================== */
export class CarnetService {
  obtenerUltimoPorCliente(cliente_id: any, client: any) {
    throw new Error('Method not implemented.');
  }
  private supabase: SupabaseClient;
  private bucket: string;

  constructor() {
    console.log('🛠️ Inicializando CarnetService');

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    this.bucket = process.env.SUPABASE_BUCKET_NAME || 'carnets';

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('CarnetService: credenciales de Supabase faltantes');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false }
    });

    console.log('✅ Supabase listo | bucket:', this.bucket);
  }

  /* ======================================================
     MÉTODO PRINCIPAL (YA TIPADO)
  ====================================================== */
async generarCarnetPNG(data: CarnetData): Promise<{ url: string; path: string }> {
    this.validarDatos(data);

    const canvas = await this.generarCanvas(data);
    const buffer = canvas.toBuffer('image/png');

    const filename = this.generarNombreArchivo(data);

    console.log('📤 Subiendo carnet:', filename);

    const { error } = await this.supabase.storage
      .from(this.bucket)
      .upload(filename, buffer, {
        contentType: 'image/png',
        upsert: true
      });

    if (error) {
      throw new Error(`Supabase upload error: ${error.message}`);
    }

    const { data: publicData } = this.supabase.storage
  .from(this.bucket)
  .getPublicUrl(filename);

return {
  url: publicData.publicUrl,
  path: filename
};
  }

  async generarSiCorresponde(
  cliente_id: number,
  client: PoolClient
): Promise<{ url: string; path: string }> {

  // 1️⃣ Obtener cliente
  const clienteResult = await client.query(
    `SELECT id, nombre, apellido
     FROM clientes
     WHERE id = $1`,
    [cliente_id]
  );

  if (clienteResult.rowCount === 0) {
    throw new Error('Cliente no encontrado para generar carnet');
  }

  const cliente = clienteResult.rows[0];

  // 2️⃣ Obtener último pago (el recién registrado)
  const pagoResult = await client.query(
    `SELECT fecha_pago, periodo_mes, periodo_ano
     FROM pagos
     WHERE cliente_id = $1
     ORDER BY fecha_pago DESC
     LIMIT 1`,
    [cliente_id]
  );

  if (pagoResult.rowCount === 0) {
    throw new Error('No hay pagos para generar carnet');
  }

  const pago = pagoResult.rows[0];

  // 3️⃣ Armar data del carnet
  const carnetData: CarnetData = {
    clienteId: cliente.id,
    nombre: cliente.nombre,
    apellido: cliente.apellido,
    fechaPago: pago.fecha_pago,
    mes: pago.periodo_mes,
    año: pago.periodo_ano
  };

  // 4️⃣ Generar carnet PNG
  const carnet = await this.generarCarnetPNG(carnetData);

  // 5️⃣ Devolver carnet generado
  return carnet;
}


  /* ======================================================
     VALIDACIONES
  ====================================================== */
  private validarDatos(data: CarnetData) {
    if (!data.clienteId || data.clienteId <= 0) {
      throw new Error('CarnetService: clienteId inválido');
    }
    if (!data.nombre || !data.apellido) {
      throw new Error('CarnetService: nombre o apellido faltante');
    }
    if (data.mes < 1 || data.mes > 12) {
      throw new Error('CarnetService: mes inválido');
    }
    if (!data.año || data.año < 2020) {
      throw new Error('CarnetService: año inválido');
    }
  }

  /* ======================================================
     CANVAS
  ====================================================== */
  private async generarCanvas(data: CarnetData): Promise<Canvas> {
    const plantillaPath = path.join(__dirname, '../../storage/4.png');
    if (!fs.existsSync(plantillaPath)) {
      throw new Error('Plantilla de carnet no encontrada');
    }

    const plantilla = await loadImage(plantillaPath);
    const canvas = createCanvas(plantilla.width, plantilla.height);
    const ctx = canvas.getContext('2d');

    ctx.drawImage(plantilla, 0, 0);

    ctx.font = 'bold 25px "Anton"';
    ctx.fillStyle = 'white';
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 1.5;

    const nombreCompleto = `${data.nombre} ${data.apellido}`.toUpperCase();

    ctx.strokeText(nombreCompleto, 508, 285);
    ctx.fillText(nombreCompleto, 508, 285);

    const fecha = data.fechaPago;
    const fechaTexto =
      `${fecha.getDate().toString().padStart(2, '0')}-` +
      `${(fecha.getMonth() + 1).toString().padStart(2, '0')}-` +
      `${fecha.getFullYear()}`;

    ctx.strokeText(fechaTexto, 505, 490);
    ctx.fillText(fechaTexto, 505, 490);

    this.marcarMes(ctx, data.mes);

    return canvas;
  }

  /* ======================================================
     CHECK DEL MES
  ====================================================== */
  private marcarMes(ctx: CanvasRenderingContext2D, mes: number) {
    const coords: Record<number, { x: number; y: number }> = {
      1: { x: 82, y: 140 },
      2: { x: 240, y: 140 },
      3: { x: 400, y: 140 },
      4: { x: 82, y: 270 },
      5: { x: 240, y: 270 },
      6: { x: 400, y: 270 },
      7: { x: 82, y: 405 },
      8: { x: 240, y: 405 },
      9: { x: 400, y: 405 },
      10: { x: 82, y: 540 },
      11: { x: 240, y: 540 },
      12: { x: 400, y: 540 }
    };

    const c = coords[mes];
    if (!c) return;

    ctx.strokeStyle = 'gold';
    ctx.lineWidth = 9;
    ctx.lineCap = 'round';

    ctx.beginPath();
    ctx.moveTo(c.x - 20, c.y + 60);
    ctx.lineTo(c.x - 2, c.y + 75);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(c.x - 2, c.y + 75);
    ctx.lineTo(c.x + 48, c.y + 25);
    ctx.stroke();
  }

  /* ======================================================
     NOMBRE DE ARCHIVO
  ====================================================== */
  private generarNombreArchivo(data: CarnetData): string {
    const nombre = data.nombre.trim().replace(/\s+/g, '_');
    const apellido = data.apellido.trim().replace(/\s+/g, '_');

    return `carnet_${apellido}_${nombre}_${data.año}_${data.mes}.png`;
  }
}
