

export interface Usuario {
  id: number;
  username: string;
  email: string;
  password_hash?: string;
  rol: 'admin' | 'entrenador' | 'cliente';
  activo: boolean;
  ultimo_login: Date | string | null;
  creado_en: Date | string;
  actualizado_en: Date | string;
  CREADO_POR: number | null;
  
  // Para frontend
  token?: string;
  nombre?: string;
}

export interface UsuarioCreate {
  username: string;
  email: string;
  password: string;
  rol?: 'admin' | 'entrenador' | 'cliente';
  activo?: boolean;
  creado_por?: number;
}

export interface UsuarioLogin {
  email: string;
  password: string;
}

export interface UsuarioUpdate {
  username?: string;
  email?: string;
  password?: string;
  rol?: 'admin' | 'entrenador' | 'cliente';
  activo?: boolean;
  ultimo_login?: Date | string;
}

export interface AuthResponse {
  token: string;
  usuario: Usuario;
  message?: string;
}
