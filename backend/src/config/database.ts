import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

console.log('=========================================');
console.log('🏋️‍♂️ ONIX GYM - Conexión FINAL');
console.log('=========================================');

const poolConfig = {
  host: 'aws-0-us-west-2.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  user: 'postgres.shkzfvmxawargmdssrsr',
  password: 'OnixGym2024Secure',
  ssl: {
    rejectUnauthorized: false,
    requestCert: true,
    agent: false
  },
  max: 2, // ← ¡IMPORTANTE! Solo 2 conexiones
  connectionTimeoutMillis: 15000, // 15 segundos máximo
  query_timeout: 10000 // Timeout para queries
};

console.log('🔧 Conexión directa al puerto 6543');
console.log(`   ${poolConfig.user}@${poolConfig.host}:${poolConfig.port}`);

const pool = new Pool(poolConfig);

// Manejo de errores mejorado
pool.on('error', (err) => {
  console.error('💥 Error en pool:', err.message);
});

// Test DIRECTO
const testConnection = async () => {
  console.log('\n🔌 Autenticando...');
  
  let client;
  try {
    // Conectar con timeout
    client = await pool.connect();
    console.log('✅ ¡AUTENTICACIÓN EXITOSA!');
    
    // Query ULTRA rápida
    const start = Date.now();
    const result = await client.query({
      text: 'SELECT NOW() as hora',
      timeout: 3000 // Solo 3 segundos
    });
    const elapsed = Date.now() - start;
    
    console.log(`🕐 Hora servidor: ${result.rows[0].hora}`);
    console.log(`⚡ Tiempo respuesta: ${elapsed}ms`);
    
    client.release();
    
    console.log('\n🎉 ¡ONIX GYM CONECTADO!');
    console.log('=========================================\n');
    
  } catch (error: any) {
    console.error('\n💥 Error en autenticación:', error.message);
    
    if (error.message.includes('timeout')) {
      console.error('\n🔍 El Session Pooler acepta conexión pero no autentica');
      console.error('💡 Causa: Plan Free saturado en autenticación');
    }
    
    if (client) client.release();
  }
};

// Esperar 3 segundos y testear
setTimeout(testConnection, 3000);

export default pool;