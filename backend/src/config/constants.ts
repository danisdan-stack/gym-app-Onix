// ==================== CONFIGURACIÓN JWT ====================
export const CONFIG_JWT = {
  SECRETO: process.env.JWT_SECRET || 'clave_secreta_gimnasio_dev',
  EXPIRA_EN: '24h', // Token válido por 24 horas
};

// ==================== PAGINACIÓN ====================
export const PAGINACION = {
  LIMITE_POR_DEFECTO: 50,
  LIMITE_MAXIMO: 100,
  PAGINA_POR_DEFECTO: 1,
};

// ==================== ESTADOS DE CLIENTES ====================
export const ESTADO_CLIENTE = {
  ACTIVO: 'activo',
  VENCIDO: 'vencido',
  INACTIVO: 'inactivo',
  SUSPENDIDO: 'suspendido',
} as const;

// ==================== ESTADOS DE PAGO ====================
export const ESTADO_PAGO = {
  PENDIENTE: 'pendiente',
  PAGADO: 'pagado',
  VENCIDO: 'vencido',
  CANCELADO: 'cancelado',
} as const;

// ==================== MÉTODOS DE PAGO ====================
export const METODO_PAGO = {
  EFECTIVO: 'efectivo',
  TARJETA: 'tarjeta',
  TRANSFERENCIA: 'transferencia',
  DEPOSITO: 'depósito',
} as const;

// ==================== MESES EN ESPAÑOL ====================
export const MESES_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

// Versión corta (para carnets)
export const MESES_CORTOS = [
  'ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN',
  'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'
];

// ==================== ROLES DE USUARIO ====================
export const ROLES_USUARIO = {
  ADMINISTRADOR: 'administrador',
  ENTRENADOR: 'entrenador',
  RECEPCION: 'recepcion',
  CONTADOR: 'contador',
  REDESSOCIALES: `social media`,
} as const;

// ==================== TIPOS DE MEMBRESÍA ====================
export const TIPO_MEMBRESIA = {
  MENSUAL: 'mensual',
  TRIMESTRAL: 'trimestral',
  SEMESTRAL: 'semestral',
  ANUAL: 'anual',
  POR_CLASES: 'por_clases',
} as const;

// ==================== DÍAS DE LA SEMANA ====================
export const DIAS_SEMANA = [
  'Domingo', 'Lunes', 'Martes', 'Miércoles', 
  'Jueves', 'Viernes', 'Sábado'
];

// Versión corta
export const DIAS_CORTOS = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];

// ==================== HORARIOS DEL GIMNASIO ====================
export const HORARIO_GIMNASIO = {
  APERTURA: '06:00',
  CIERRE: '22:00',
  DIAS_ABIERTO: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
  DIAS_CERRADO: ['Domingo'],
} as const;

// ==================== CONFIGURACIÓN DE CARNERS ====================
export const CONFIG_CARNET = {
  ANCHO: 350,        // px o mm para PDF
  ALTO: 200,
  COLOR_PRIMARIO: '#1E40AF',   // Azul gimnasio
  COLOR_SECUNDARIO: '#DC2626', // Rojo para vencidos
  COLOR_ACTIVO: '#10B981',     // Verde para activos
  LOGO_URL: '/assets/logo-gym.png',
  VALIDEZ_MESES: 1,  // Los carnets son mensuales
};

// ==================== MENSAJES DEL SISTEMA ====================
export const MENSAJES = {
  ERROR: {
    NO_AUTORIZADO: 'No autorizado para realizar esta acción',
    NO_ENCONTRADO: 'Recurso no encontrado',
    VALIDACION: 'Error de validación',
    SERVIDOR: 'Error interno del servidor',
    BD: 'Error en la base de datos',
    SESION_EXPIRADA: 'Sesión expirada, por favor inicia sesión nuevamente',
  },
  EXITO: {
    CREADO: 'Creado exitosamente',
    ACTUALIZADO: 'Actualizado exitosamente',
    ELIMINADO: 'Eliminado exitosamente',
    PAGO_REGISTRADO: 'Pago registrado exitosamente',
    CARNET_GENERADO: 'Carnet generado exitosamente',
  },
  VALIDACION: {
    CAMPO_REQUERIDO: 'Este campo es requerido',
    EMAIL_INVALIDO: 'Correo electrónico inválido',
    TELEFONO_INVALIDO: 'Número de teléfono inválido',
    MIN_CARACTERES: 'Debe tener al menos {n} caracteres',
    MAX_CARACTERES: 'No debe exceder {n} caracteres',
  },
};

// ==================== RUTAS DEL SISTEMA ====================
export const RUTAS_API = {
  CLIENTES: '/api/clientes',
  USUARIOS: '/api/usuarios',
  PAGOS: '/api/pagos',
  CARNERS: '/api/carnets',
  ENTRENADORES: '/api/entrenadores',
  REPORTES: '/api/reportes',
  AUTENTICACION: '/api/auth',
} as const;

// ==================== EXPORTACIONES POR GRUPOS ====================
export default {
  // Agrupar para mejor organización
  JWT: CONFIG_JWT,
  PAGINACION,
  ESTADOS: {
    CLIENTE: ESTADO_CLIENTE,
    PAGO: ESTADO_PAGO,
  },
  METODOS_PAGO: METODO_PAGO,
  MESES: {
    COMPLETOS: MESES_ES,
    CORTOS: MESES_CORTOS,
  },
  DIAS: {
    COMPLETOS: DIAS_SEMANA,
    CORTOS: DIAS_CORTOS,
  },
  ROLES: ROLES_USUARIO,
  TIPOS_MEMBRESIA: TIPO_MEMBRESIA,
  HORARIO: HORARIO_GIMNASIO,
  CARNET: CONFIG_CARNET,
  MENSAJES,
  RUTAS: RUTAS_API,
};