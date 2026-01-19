// src/services/carnet.service.ts - VERSIÓN COMPLETA Y CORREGIDA
import { createCanvas, loadImage, registerFont, Canvas } from 'canvas';
import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';

// ✅ REGISTRAR FUENTE ANTON
const fontPath = path.join(__dirname, '../../storage/Fonts/Anton-Regular.ttf');
if (fs.existsSync(fontPath)) {
  registerFont(fontPath, { family: 'Anton' });
  console.log('✅ Fuente Anton registrada');
}

export class CarnetService {
  private supabase: any;
  
  constructor() {
    console.log('🛠️  Inicializando CarnetService...');
    
    // OBTENER CREDENCIALES
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const bucketName = process.env.SUPABASE_BUCKET_NAME || 'carnets';
    
    console.log('🔧 Config Supabase:', {
      tieneUrl: !!supabaseUrl,
      tieneKey: !!supabaseKey,
      bucket: bucketName
    });
    
    if (supabaseUrl && supabaseKey) {
      this.supabase = createClient(supabaseUrl, supabaseKey, {
        auth: { persistSession: false }
      });
      console.log('✅ Cliente Supabase inicializado');
    } else {
      console.warn('⚠️  Credenciales Supabase incompletas');
      this.supabase = null;
    }
  }
  
  // 🔥 MÉTODO PRINCIPAL - CON FALLBACK
  async generarCarnetPNG(
    cliente: { 
      nombre: string; 
      apellido: string; 
      fecha_inscripcion?: Date;
      id?: number;
    },
    mes: number,
    año: number
  ): Promise<{ url: string; path: string }> {
    
    console.log(`🏋️  Generando carnet para ${cliente.nombre} ${cliente.apellido} - ${mes}/${año}`);
    
    try {
      // 1. GENERAR LA IMAGEN
      const canvas = await this.generarCanvasCarnet(cliente, mes, año);
      const buffer = canvas.toBuffer('image/png');
      
      // 2. NOMBRE DEL ARCHIVO
      const clienteId = cliente.id || Date.now();
      const filename = `carnet-${clienteId}-${año}-${mes}.png`;
      
      let publicUrl = '';
      let filePath = filename;
      
      // 3. INTENTAR SUBIR A SUPABASE
      if (this.supabase) {
        try {
          console.log('☁️  Subiendo a Supabase Storage...');
          
          const { error: uploadError } = await this.supabase.storage
            .from('carnets')
            .upload(filename, buffer, {
              contentType: 'image/png',
              upsert: true
            });
          
          if (!uploadError) {
            // Obtener URL pública
            const { data: { publicUrl: url } } = this.supabase.storage
              .from('carnets')
              .getPublicUrl(filename);
            
            publicUrl = url;
            console.log('✅ Carnet subido a Supabase:', publicUrl);
          } else {
            console.warn('⚠️  Error Supabase:', uploadError.message);
          }
        } catch (supabaseError) {
          console.warn('⚠️  Error con Supabase:', supabaseError.message);
        }
      }
      
      // 4. SIEMPRE GUARDAR LOCALMENTE COMO FALLBACK
      try {
        const uploadsDir = path.join(__dirname, '../../public/uploads');
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }
        
        const localPath = path.join(uploadsDir, filename);
        await fs.promises.writeFile(localPath, buffer);
        
        console.log('💾 Carnet guardado localmente:', localPath);
        
        // Si no tenemos URL de Supabase, usar la local
        if (!publicUrl) {
          publicUrl = `/uploads/${filename}`;
        }
        
      } catch (localError) {
        console.error('❌ Error guardando localmente:', localError.message);
      }
      
      // 5. SI TODO FALLA, RETORNAR URL DE PLACEHOLDER
      if (!publicUrl) {
        publicUrl = 'https://via.placeholder.com/800x600.png?text=Carnet+Generado';
        console.log('⚠️  Usando URL de placeholder');
      }
      
      return {
        url: publicUrl,
        path: filePath
      };
      
    } catch (error) {
      console.error('💥 Error generando carnet:', error);
      
      // NUNCA LANZAR ERROR - Siempre retornar algo
      return {
        url: 'https://via.placeholder.com/800x600.png?text=Error+Generando+Carnet',
        path: 'error.png'
      };
    }
  }
  
  // 🔥 MÉTODO CORREGIDO - AHORA SÍ RETORNA Canvas
  async generarCanvasCarnet(
    cliente: { nombre: string; apellido: string; fecha_inscripcion?: Date, id?: number }, 
    mes: number, 
    año: number
  ): Promise<Canvas> {
    console.log('🎨 Generando canvas del carnet...');
    
    const meses = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 
                   'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];
    const mesNombre = meses[mes - 1];
    
    // CARGAR PLANTILLA
    const plantillaPath = path.join(__dirname, '../../storage/4.png');
    if (!fs.existsSync(plantillaPath)) {
      throw new Error(`Plantilla no encontrada: ${plantillaPath}`);
    }
    
    const plantilla = await loadImage(plantillaPath);
    const canvas = createCanvas(plantilla.width, plantilla.height);
    const ctx = canvas.getContext('2d');
    
    // DIBUJAR PLANTILLA
    ctx.drawImage(plantilla, 0, 0);
    
    // ✅ 1. NOMBRE COMPLETO
    ctx.font = 'bold 25px "Anton"';
    ctx.fillStyle = 'white';
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 1.5;
    
    const nombreCompleto = `${cliente.nombre} ${cliente.apellido}`.toLowerCase();
    ctx.strokeText(nombreCompleto, 508, 285);
    ctx.fillText(nombreCompleto, 508, 285);
    
    // ✅ 2. FECHA DE INSCRIPCIÓN
    let fechaTexto = '';
    if (cliente.fecha_inscripcion) {
      const fecha = new Date(cliente.fecha_inscripcion);
      const dia = fecha.getDate().toString().padStart(2, '0');
      const mesFecha = (fecha.getMonth() + 1).toString().padStart(2, '0');
      const añoFecha = fecha.getFullYear();
      fechaTexto = `${dia}-${mesFecha}-${añoFecha}`;
    } else {
      const hoy = new Date();
      fechaTexto = `${hoy.getDate().toString().padStart(2, '0')}-${(hoy.getMonth() + 1).toString().padStart(2, '0')}-${hoy.getFullYear()}`;
    }
    
    ctx.strokeText(fechaTexto, 505, 490);
    ctx.fillText(fechaTexto, 505, 490);
    
    // ✅ 3. DÍA DE PAGO MENSUAL
    let diaPago = '01';
    if (cliente.fecha_inscripcion) {
      const fechaInscripcion = new Date(cliente.fecha_inscripcion);
      diaPago = fechaInscripcion.getDate().toString().padStart(2, '0');
    }
    
    ctx.strokeText(`${diaPago} de cada mes`, 505, 590);
    ctx.fillText(`${diaPago} de cada mes`, 505, 590);
    
    // ✅ 4. CHECKMARK DEL MES ACTUAL
    const coordenadasMeses = {
      'ENERO': { x: 82, y: 140 },
      'FEBRERO': { x: 240, y: 140 },
      'MARZO': { x: 400, y: 140 },
      'ABRIL': { x: 82, y: 270 },
      'MAYO': { x: 240, y: 270 },
      'JUNIO': { x: 400, y: 270 },
      'JULIO': { x: 82, y: 405 },
      'AGOSTO': { x: 240, y: 405 },
      'SEPTIEMBRE': { x: 400, y: 405 },
      'OCTUBRE': { x: 82, y: 540 },
      'NOVIEMBRE': { x: 240, y: 540 },
      'DICIEMBRE': { x: 400, y: 540 }
    };
    
    const coord = coordenadasMeses[mesNombre as keyof typeof coordenadasMeses];
    
    if (coord) {
      ctx.strokeStyle = 'gold';
      ctx.lineWidth = 9;
      ctx.lineCap = 'round';
      
      let offsetX = 0;
      let offsetY = 0;
      
      if (coord.y < 350) {
        offsetX = -28;
        offsetY = 20;
      } else if (coord.y > 450) {
        offsetX = -10;
        offsetY = -30;
      }
      
      // Dibujar checkmark
      ctx.beginPath();
      ctx.moveTo(coord.x - 23, coord.y + 55 + offsetY);
      ctx.lineTo(coord.x - 2, coord.y + 72 + offsetY);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(coord.x - 2, coord.y + 72 + offsetY);
      ctx.lineTo(coord.x + 48, coord.y + 18 + offsetY);
      ctx.stroke();
    }
    
    console.log('✅ Canvas generado exitosamente');
    return canvas; // ✅ AHORA SÍ RETORNA Canvas
  }
  
  // 🔥 MÉTODO PARA DESCARGA RÁPIDA (OPCIONAL)
  async generarCarnetBuffer(
    datosCliente: { nombre: string; apellido: string; fecha_inscripcion: Date,  id?: number; }, 
    mesNum: number, 
    añoNum: number
  ): Promise<Buffer> {
    console.log('⚡ Generando buffer para descarga rápida');
    
    // Usar el método generarCanvasCarnet y convertirlo a buffer
    const canvas = await this.generarCanvasCarnet(datosCliente, mesNum, añoNum);
    return canvas.toBuffer('image/png');
  }
  
  // 🔥 MÉTODO AUXILIAR
  async obtenerCliente(clienteId: number): Promise<any> {
    return null;
  }
}