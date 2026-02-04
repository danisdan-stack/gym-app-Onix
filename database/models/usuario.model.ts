// database/models/usuario.model.ts
export interface Usuario {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  rol: 'admin' | 'entrenador' | 'cliente';
  activo: boolean;
  ultimo_login: Date | null;
  creado_en: Date;
  actualizado_en: Date;
  creado_por: number | null;
}

export class UsuarioModel {
  // ... métodos CRUD para usuarios
}