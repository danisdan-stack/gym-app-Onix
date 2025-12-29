import  { IUsuario } from './usuario.interface';
import  { ICliente } from './cliente.interface';

export interface IEntrenador {
    usuario_id: number;
    dni: string;
    nombre: string;
    apellido: string;
    telefono: string | null;
    especializcon: string | null;
    bio: string | null;
    clientes_actuales: number;
    calificacion_promedio: number;
    disponible: boolean;
    fecha_contratacion: Date;
    creado_en: Date;
    actualizado_en:Date;
      // Relaciones
  usuario?: IUsuario;
  clientes?: ICliente[];
}

export interface IEntrenadorCreate {
  // Datos de usuario
  usuarioData: {
    username: string;
    email: string;
    password: string;
  };
  // Datos específicos de entrenador
  dni: string;
  nombre: string;
  apellido: string;
  telefono?: string;
  especializacion?: string;
  certificaciones?: string;
  bio?: string;
  disponible?: boolean;
  fecha_contratacion?: Date;
}

export interface IEntrenadorUpdate {
  dni?: string;
  nombre?: string;
  apellido?: string;
  telefono?: string | null;
  especializacion?: string | null;
  certificaciones?: string | null;
  bio?: string | null;
  disponible?: boolean;
  clientes_actuales?: number;
  calificacion_promedio?: number;
}