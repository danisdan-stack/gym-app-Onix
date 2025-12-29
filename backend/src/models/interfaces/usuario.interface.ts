export interface IUsuario{
    id: number;
    username: string;
    email: string;
    password_hash: string;
    rol: 'admin' | 'entrenador' | 'cliente';
    activo: boolean;
    ultimo_login: Date | null;
    creado_en: Date;
    actualizado_en: Date;
    CREADO_POR: number | null;
}

export interface IUsuarioCreate{
    username: string;
    email: string;
    password: string;
    rol?: 'admin' | 'entrenador' | 'cliente';
     activo?: boolean;
  creado_por?: number;
}

export interface IUsuarioLogin {
  email: string;
  password: string;
}

export interface IUsuarioUpdate {
  username?: string;
  email?: string;
  password?: string;
  rol?: 'admin' | 'entrenador' | 'cliente';
  activo?: boolean;
  ultimo_login?: Date;
}