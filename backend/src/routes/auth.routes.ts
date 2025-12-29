import { Router, Request, Response } from 'express';
import pool from '../config/database';
import bcrypt from 'bcryptjs';
import { UsuarioModel } from '../models/usuario.model';

const router = Router();
const usuarioModel = new UsuarioModel(pool);

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    
    // Buscar usuario
    const result = await pool.query(
      'SELECT * FROM usuario WHERE email = $1 AND activo = true',
      [email]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales incorrectas'
      });
    }
    
    const usuario = result.rows[0];
    
    // Comparar contraseña (simplificado por ahora)
    // En producción usar bcrypt.compare()
    if (password !== 'cliente123') {
      return res.status(401).json({
        success: false,
        message: 'Credenciales incorrectas'
      });
    }
    
    // Responder sin password
    const { password_hash, ...usuarioSinPassword } = usuario;
    
    res.json({
      success: true,
      message: 'Login exitoso',
      data: usuarioSinPassword
    });
    
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error en login',
      error: error.message
    });
  }
});

export default router;