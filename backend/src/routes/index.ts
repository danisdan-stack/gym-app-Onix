// src/routes/auth.routes.ts
import { Router } from 'express';
import pool from '../config/database';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = Router();

// POST /api/auth/login - Iniciar sesión
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // 1. Buscar usuario en PostgreSQL
    const query = `
      SELECT * FROM usuario 
      WHERE email = $1 AND activo = true;
    `;
    
    const result = await pool.query(query, [email]);
    const usuario = result.rows[0];
    
    if (!usuario) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales incorrectas'
      });
    }
    
    // 2. Verificar contraseña
    const passwordValido = await bcrypt.compare(password, usuario.password_hash);
    
    if (!passwordValido) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales incorrectas'
      });
    }
    
    // 3. Actualizar último login en SQL
    await pool.query(
      'UPDATE usuario SET ultimo_login = NOW() WHERE id = $1',
      [usuario.id]
    );
    
    // 4. Generar token JWT
    const token = jwt.sign(
      { 
        id: usuario.id, 
        email: usuario.email,
        rol: usuario.rol 
      },
      process.env.JWT_SECRET || 'secret_gym',
      { expiresIn: '24h' }
    );
    
    // 5. Responder (sin password)
    const { password_hash, ...usuarioSinPassword } = usuario;
    
    res.json({
      success: true,
      message: 'Login exitoso',
      data: {
        usuario: usuarioSinPassword,
        token
      }
    });
    
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error en login',
      error: error.message
    });
  }
});

// GET /api/auth/me - Ver mi perfil
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token no proporcionado'
      });
    }
    
    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_gym') as any;
    
    // Buscar usuario en SQL
    const query = 'SELECT id, username, email, rol, activo FROM usuario WHERE id = $1';
    const result = await pool.query(query, [decoded.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
    
  } catch (error: any) {
    res.status(401).json({
      success: false,
      message: 'Token inválido',
      error: error.message
    });
  }
});

export default router;