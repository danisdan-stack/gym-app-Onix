/// src/routes/twilio.routes.ts - DESHABILITADO COMPLETAMENTE
import { Router } from 'express';
// import { TwilioService } from '../services/twilio.service'; // DESHABILITADO

const router = Router();
// const twilioService = new TwilioService(); // DESHABILITADO

// Ruta de estado - siempre responde que está deshabilitado
router.get('/status', async (req, res) => {
  try {
    console.log('⚠️  Ruta /api/twilio/status accedida (Twilio deshabilitado)');
    res.json({ 
      success: true, 
      conectado: false,
      message: '⚠️  Servicio Twilio deshabilitado temporalmente',
      detalle: 'Para habilitar, añade las credenciales en .env y descomenta las importaciones'
    });
  } catch (error: any) {
    res.status(500).json({ 
      success: false, 
      error: 'Servicio Twilio no disponible'
    });
  }
});

// Ruta de prueba - responde que está deshabilitada
router.post('/test', async (req, res) => {
  try {
    const { telefono } = req.body;
    
    console.log('⚠️  Ruta /api/twilio/test accedida (Twilio deshabilitado)');
    
    if (!telefono) {
      return res.status(400).json({ 
        success: false, 
        error: 'Número de teléfono requerido' 
      });
    }
    
    console.log(`📱  Mensaje de prueba que se enviaría a: ${telefono}`);
    console.log(`📝  Contenido: "✅ Prueba de Onix Gym - Twilio deshabilitado temporalmente"`);
    
    res.json({
      success: true,
      message: '⚠️  Servicio Twilio deshabilitado - Mensaje no enviado',
      data: {
        telefono_recibido: telefono,
        estado: 'twilio_deshabilitado',
        nota: 'Para habilitar, configura las credenciales en .env'
      }
    });
    
  } catch (error: any) {
    console.error('Error en test (deshabilitado):', error);
    res.status(500).json({
      success: false,
      error: 'Servicio Twilio no disponible'
    });
  }
});

// Ruta para mostrar instrucciones de configuración
router.get('/config', (req, res) => {
  res.json({
    success: true,
    message: 'Configuración de Twilio',
    instrucciones: [
      '1. Obtén Account SID y Auth Token desde twilio.com',
      '2. Añade al archivo .env:',
      '   TWILIO_ACCOUNT_SID=tu_account_sid',
      '   TWILIO_AUTH_TOKEN=tu_auth_token',
      '   TWILIO_PHONE_NUMBER=+1234567890',
      '3. Descomenta las importaciones en twilio.service.ts',
      '4. Descomenta las importaciones en twilio.routes.ts',
      '5. Recompila el proyecto: npm run build'
    ]
  });
});

export default router;