import {IUsuario} from './usuario.interface';
import { IEntrenador } from './entrenador.interface';
import { IPago } from './pago.interface';             
import { ICarnet } from './carnet.interface';

export interface ICliente {
  dni: any;
  email: string;
     usuario_id: number;
     nombre: string;
     apellido: string;
     telefono: string;
     entrenador_id: number | null;
     estado_cuota: 'activo' | 'inactivo' | 'suspendido';
     fecha_inscripcion: Date;
     fecha_vencimiento: Date;
     direccion: string | null;
     creado_en: Date;
     actualizado_en: Date;
    //relaciones (opcionales para JOIN)
    usuario?: IUsuario;
    entrenador?: IEntrenador;
    pagos?: IPago[];
    carnets?: ICarnet[];
}

// Para crear cliente DESPUÉS de haber creado el usuario
export interface IClienteCreate {
  usuario_id: number;        // ← REQUERIDO, viene del usuario creado
  nombre: string;
  apellido: string;          // ← CORREGIDO: apellido (no apaellido)
  telefono?: string;
  entrenador_id?: number;
  estado_cuota?: 'activo' | 'inactivo' | 'suspendido';
  fecha_inscripcion?: Date;  // ← CORREGIDO: inscripcion (no isncripcion)
  fecha_vencimiento?: Date;  // ← CORREGIDO: vencimiento (no vencimineot)
  direccion?: string;
}

// Para el registro completo desde el frontend
export interface IClienteRegistroRequest {
  usuario: {
    username: string;
    email: string;
    password: string;
  };
  cliente: Omit<IClienteCreate, 'usuario_id'>; // Sin usuario_id
   // ✅ NUEVO: Datos del pago inicial obligatorio
  pago: {
    monto: number;
    mes: number;      // 1-12
    ano: number;      // 2024, etc.
    metodo?: 'efectivo' | 'tarjeta' | 'transferencia' | 'otro';
  };
}

export interface IClienteUpdate {
    nombre?: string;
    apellido?: string;
    telefono?: string | null;
    entrenador_id?: number | null;
    estado_cuota?: 'activo' | 'inactivo' | 'suspendido';
    fecha_vencimiento?: Date | null;
    direccion?: string | null;
}

export interface IFiltrosCliente {
  buscar?: string;
  estado_cuota?: 'activo' | 'inactivo' | 'suspendido' | 'todos';
  entrenador_id?: number;
  pagina?: number;
  limite?: number;
}