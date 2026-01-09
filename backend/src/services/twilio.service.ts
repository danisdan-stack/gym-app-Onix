// src/services/twilio.service.ts - VERSIÓN COMPLETA Y FUNCIONAL
import twilio from 'twilio';

// Interface para la respuesta de Twilio
export interface TwilioMessageResponse {
  sid: string;
  status: string;
  to: string;
  from: string;
  body?: string;
  error?: string;
}

export class TwilioService {
  enviarMensajeWhatsApp(telefono: any, mensaje: string, p0: string | undefined) {
    throw new Error('Method not implemented.');
  }
  private client: any;
  private fromNumber: string;

  constructor() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    this.fromNumber = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886';

    if (!accountSid || !authToken) {
      console.error('❌ ERROR: Credenciales de Twilio faltantes');
      console.log('Account SID:', accountSid ? '✓' : '✗');
      console.log('Auth Token:', authToken ? '✓' : '✗');
      throw new Error('Twilio credentials not found in .env');
    }

    console.log('✅ Twilio configurado correctamente');
    this.client = twilio(accountSid, authToken);
  }

  /**
   * Enviar carnet de BIENVENIDA para NUEVO cliente
   */
  async enviarCarnetBienvenida(
    cliente: { id: any; nombre: string; apellido: string; telefono: string }, 
    urlCarnet: string
  ): Promise<TwilioMessageResponse> {
    try {
      const telefonoFormateado = this.formatearTelefono(cliente.telefono);
      
      const mensaje = `🎉 *¡BIENVENIDO/A A ONIX GYM, ${cliente.nombre.toUpperCase()}!*\n\n` +
                     `✅ Tu carnet digital ha sido generado\n` +
                     `📱 Válido por: 15 días\n` +
                     `🔗 *Mira la imagen de arriba* 👆\n\n` +
                     `¡Nos vemos en el gym! 💪`;
      
      console.log(`📤 Enviando WhatsApp a: ${telefonoFormateado}`);
      console.log(`🖼️ URL imagen: ${urlCarnet}`);
      
      const resultado = await this.client.messages.create({
        from: this.fromNumber,
        to: `whatsapp:${telefonoFormateado}`,
        body: mensaje,
        mediaUrl: [urlCarnet] // ← ¡IMAGEN COMO MOSAICO!
      });
      
      console.log(`✅ WhatsApp enviado. SID: ${resultado.sid}`);
      
      return {
        sid: resultado.sid,
        status: resultado.status,
        to: resultado.to,
        from: resultado.from,
        body: resultado.body
      };
      
    } catch (error: any) {
      console.error('❌ Error enviando bienvenida por WhatsApp:', error.message);
      
      // Retornar error estructurado
      return {
        sid: 'error-' + Date.now(),
        status: 'failed',
        to: cliente.telefono,
        from: this.fromNumber,
        error: error.message
      };
    }
  }

  /**
   * Enviar carnet de RENOVACIÓN para pago mensual
   */
  async enviarCarnetRenovacion(
    cliente: { id: any; nombre: string; apellido: string; telefono: string },
    pago: { id: any; monto: number; fecha_vencimiento: string; periodo_mes?: number; periodo_ano?: number },
    urlCarnet: string
  ): Promise<TwilioMessageResponse> {
    try {
      const telefonoFormateado = this.formatearTelefono(cliente.telefono);
      
      const fechaVencimiento = new Date(pago.fecha_vencimiento);
      const fechaFormateada = fechaVencimiento.toLocaleDateString('es-ES');
      
      const mensaje = `🔄 *RENOVACIÓN EXITOSA - ONIX GYM*\n\n` +
                     `¡Hola ${cliente.nombre}!\n\n` +
                     `✅ Pago de $${pago.monto.toLocaleString()} registrado\n` +
                     `📅 Válido hasta: ${fechaFormateada}\n` +
                     `🔗 *Tu NUEVO carnet arriba* 👆\n\n` +
                     `¡Gracias por renovar! 💪`;
      
      console.log(`📤 Enviando renovación a: ${telefonoFormateado}`);
      
      const resultado = await this.client.messages.create({
        from: this.fromNumber,
        to: `whatsapp:${telefonoFormateado}`,
        body: mensaje,
        mediaUrl: [urlCarnet]
      });
      
      console.log(`✅ Renovación enviada. SID: ${resultado.sid}`);
      
      return {
        sid: resultado.sid,
        status: resultado.status,
        to: resultado.to,
        from: resultado.from,
        body: resultado.body
      };
      
    } catch (error: any) {
      console.error('❌ Error enviando renovación por WhatsApp:', error.message);
      
      return {
        sid: 'error-' + Date.now(),
        status: 'failed',
        to: cliente.telefono,
        from: this.fromNumber,
        error: error.message
      };
    }
  }

  /**
   * Enviar mensaje simple de prueba
   */
  async enviarMensajePrueba(telefonoDestino: string): Promise<TwilioMessageResponse> {
    try {
      const telefonoFormateado = this.formatearTelefono(telefonoDestino);
      
      console.log('📤 Enviando mensaje de prueba a:', telefonoFormateado);
      
      const mensaje = await this.client.messages.create({
        from: this.fromNumber,
        to: `whatsapp:${telefonoFormateado}`,
        body: '🏋️‍♂️ ¡Hola desde Onix Gym! Esta es una prueba del sistema.'
      });

      console.log('✅ Mensaje enviado. SID:', mensaje.sid);
      
      return {
        sid: mensaje.sid,
        status: mensaje.status,
        to: mensaje.to,
        from: mensaje.from,
        body: mensaje.body
      };

    } catch (error: any) {
      console.error('❌ Error enviando mensaje:', error.message);
      
      return {
        sid: 'error-' + Date.now(),
        status: 'failed',
        to: telefonoDestino,
        from: this.fromNumber,
        error: error.message
      };
    }
  }

  /**
   * Método genérico para enviar carnet (alternativa)
   */
  async enviarCarnet(
    telefonoDestino: string, 
    urlImagen: string, 
    cliente: { nombre: string; apellido?: string }
  ): Promise<TwilioMessageResponse> {
    try {
      const telefonoFormateado = this.formatearTelefono(telefonoDestino);
      
      console.log('🖼️ Enviando carnet a:', telefonoFormateado);
      
      const mensaje = await this.client.messages.create({
        from: this.fromNumber,
        to: `whatsapp:${telefonoFormateado}`,
        body: this.generarMensajeCarnet(cliente),
        mediaUrl: [urlImagen]
      });

      console.log('✅ Carnet enviado. SID:', mensaje.sid);
      
      return {
        sid: mensaje.sid,
        status: mensaje.status,
        to: mensaje.to,
        from: mensaje.from,
        body: mensaje.body
      };

    } catch (error: any) {
      console.error('❌ Error enviando carnet:', error.message);
      
      // Fallback: enviar solo texto
      try {
        const fallbackMensaje = await this.client.messages.create({
          from: this.fromNumber,
          to: `whatsapp:${this.formatearTelefono(telefonoDestino)}`,
          body: `${this.generarMensajeCarnet(cliente)}\n\n🔗 ${urlImagen}`
        });
        
        return {
          sid: fallbackMensaje.sid,
          status: fallbackMensaje.status,
          to: fallbackMensaje.to,
          from: fallbackMensaje.from,
          body: fallbackMensaje.body
        };
      } catch (fallbackError: any) {
        return {
          sid: 'error-' + Date.now(),
          status: 'failed',
          to: telefonoDestino,
          from: this.fromNumber,
          error: fallbackError.message
        };
      }
    }
  }

  /**
   * Generar mensaje genérico para carnet
   */
  private generarMensajeCarnet(cliente: { nombre: string; apellido?: string }): string {
    return `🏋️‍♂️ *ONIX GYM - CARNET DIGITAL*\n\n` +
           `¡Hola ${cliente.nombre}! 👋\n\n` +
           `✅ Tu carnet ha sido generado\n` +
           `📅 Fecha: ${new Date().toLocaleDateString('es-ES')}\n\n` +
           `*Mira la imagen arriba* 👆\n\n` +
           `¡Bienvenido/a! 💪`;
  }

  /**
   * Formatear número de teléfono
   */
  private formatearTelefono(telefono: string): string {
    let numeros = telefono.replace(/\D/g, '');
    
    // Si es número argentino (10 dígitos), agregar código de país
    if (numeros.length === 10 && !numeros.startsWith('54')) {
      numeros = '54' + numeros;
    }
    
    return numeros;
  }

  /**
   * Verificar conexión con Twilio
   */
  async verificarConexion(): Promise<boolean> {
    try {
      await this.client.api.accounts(process.env.TWILIO_ACCOUNT_SID).fetch();
      console.log('✅ Twilio conectado correctamente');
      return true;
    } catch (error) {
      console.error('❌ Error conectando a Twilio:', error);
      return false;
    }
  }
}