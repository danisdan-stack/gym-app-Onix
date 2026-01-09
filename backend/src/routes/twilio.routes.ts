// src/routes/twilio.routes.ts
import { Router } from 'express';
import { TwilioService } from '../services/twilio.service';

const router = Router();
const twilioService = new TwilioService();

router.get('/status', async (req, res) => {
  try {
    const conectado = await twilioService.verificarConexion();
    res.json({ 
      success: true, 
      conectado,
      message: conectado ? '✅ Twilio conectado' : '❌ Error en conexión'
    });
  } catch (error: any) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

router.post('/test', async (req, res) => {
  try {
    const { telefono } = req.body;
    
    if (!telefono) {
      return res.status(400).json({ 
        success: false, 
        error: 'Número de teléfono requerido' 
      });
    }
    
    console.log('📱 Probando Twilio con:', telefono);
    
    const resultado = await twilioService.enviarMensajePrueba(telefono);
    
    res.json({
      success: true,
      message: '✅ Mensaje enviado',
      data: {
        sid: resultado.sid,
        to: resultado.to,
        status: resultado.status
      }
    });
    
  } catch (error: any) {
    console.error('Error en test:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;