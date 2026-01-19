// src/app/core/models/cliente.model.ts

// Interface principal (para recibir datos del backend)
export interface Cliente {
  
  email: any;
  usuario_id: number;
  nombre: string;
  apellido: string;
  telefono: string;
  entrenador_id: number | null;
  estado_cuota: 'activo' | 'inactivo' | 'suspendido' | 'pendiente';
  fecha_inscripcion: Date | string;
  fecha_vencimiento: Date | string;
  direccion: string | null;
  creado_en: Date | string;
  actualizado_en: Date | string;
   dni?: string;           // ← Agregar
  photo?: string;          // ← Ya existe, pero en HTML usan 'photo'
  estado?: string;        // ← Agregar
  fechaRegistro?: Date;   // ← Agregar
  
  
  
  // Campos adicionales para frontend
  id?: number; // Para compatibilidad
  foto?: string;
  membresia?: string;
  diasRestantes?: number; // Calculado en frontend
}

// Para crear cliente (después de crear usuario)
export interface CreateClienteDto {
  usuario_id: number;        // REQUERIDO, viene del usuario creado
  nombre: string;
  apellido: string;
  telefono?: string;
  entrenador_id?: number;
  estado_cuota?: 'activo' | 'inactivo' | 'suspendido';
  fecha_inscripcion?: Date | string;
  fecha_vencimiento?: Date | string;
  direccion?: string;
}

// Para registro completo desde frontend
export interface ClienteRegistroRequest {
  usuario: {
    username: string;
    email: string;
    password: string;
  };
  cliente: Omit<CreateClienteDto, 'usuario_id'>; // Sin usuario_id
  pago: {
    monto: number;
    mes: number;      // 1-12
    ano: number;      // 2024, etc.
    metodo?: 'efectivo' | 'tarjeta' | 'transferencia' | 'otro';
  };
}

// Para actualizar cliente
export interface UpdateClienteDto {
  nombre?: string;
  apellido?: string;
  telefono?: string | null;
  entrenador_id?: number | null;
  estado_cuota?: 'activo' | 'inactivo' | 'suspendido';
  fecha_vencimiento?: Date | string | null;
  direccion?: string | null;
}

// Filtros para búsqueda
export interface FiltrosCliente {
  buscar?: string;
  estado_cuota?: 'activo' | 'inactivo' | 'suspendido' | 'todos';
  entrenador_id?: number;
  pagina?: number;
  limite?: number;
}
