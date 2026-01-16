import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

console.log('=========================================');
console.log('🏋️‍♂️ ONIX GYM - Inicializando BD');
console.log('=========================================');

// CONFIGURACIÓN CON SESSION POOLER
const poolConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  max: 10,
  connectionTimeoutMillis: 30000,
  idleTimeoutMillis: 30000
};

console.log('🔧 Usando Session Pooler de Supabase');
console.log('📍 Región: us-west-2');
console.log('🔐 SSL: Habilitado');

const pool = new Pool(poolConfig);

// TEST DE CONEXIÓN
const testConnection = async () => {
  console.log('\n🔌 Probando conexión...');
  
  try {
    const client = await pool.connect();
    console.log('✅ CONEXIÓN EXITOSA!');
    
    // Información de la conexión
    const info = await client.query(`
      SELECT 
        NOW() as hora,
        current_database() as bd,
        current_user as usuario,
        inet_server_addr() as ip_servidor
    `);
    
    console.log('\n📊 INFORMACIÓN DE CONEXIÓN:');
    console.log(`   ⏰ Hora servidor: ${info.rows[0].hora}`);
    console.log(`   🗄️  Base de datos: ${info.rows[0].bd}`);
    console.log(`   👤 Usuario: ${info.rows[0].usuario}`);
    console.log(`   🌐 IP servidor: ${info.rows[0].ip_servidor}`);
    
    // Verificar tablas
    const tables = await client.query(`
      SELECT COUNT(*) as total 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    console.log(`   📋 Tablas públicas: ${tables.rows[0].total}`);
    
    client.release();
    
    console.log('\n🎉 SISTEMA LISTO PARA OPERAR!');
    console.log('=========================================\n');
    
  } catch (error) {
    console.error('\n💥 ERROR DE CONEXIÓN:');
    console.error(`   ${error.message}`);
    
    console.error('\n🔍 DIAGNÓSTICO:');
    
    if (error.message.includes('password authentication')) {
      console.error('   ❌ Error de autenticación');
      console.error('   💡 Verifica la contraseña en DATABASE_URL');
    } else if (error.message.includes('timeout')) {
      console.error('   ❌ Timeout de conexión');
      console.error('   💡 La URL puede ser incorrecta');
    }
    
    console.error('\n📝 TU CONFIGURACIÓN DEBE SER:');
    console.error('   DATABASE_URL=postgresql://postgres.shkzfvmxawargmdssrsr:CONTRASEÑA@aws-0-us-west-2.pooler.supabase.com:5432/postgres');
  }
};

// Ejecutar test
setTimeout(testConnection, 1500);

export default pool;