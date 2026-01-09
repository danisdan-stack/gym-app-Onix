

export interface Entrenador {
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
  fecha_contratacion: Date | string;
  creado_en: Date | string;
  actualizado_en: Date | string;
  
  // Para frontend
  usuario?: any;
  clientes?: any[];
  foto?: string;
  especialidad?: string;
  id?: number;
}

export interface EntrenadorCreate {
  usuarioData: {
    username: string;
    email: string;
    password: string;
  };
  dni: string;
  nombre: string;
  apellido: string;
  telefono?: string;
  especializacion?: string;
  certificaciones?: string;
  bio?: string;
  disponible?: boolean;
  fecha_contratacion?: Date | string;
}

export interface EntrenadorUpdate {
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
