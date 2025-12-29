import { ICliente } from './cliente.interface';
import { IUsuario } from './usuario.interface';

export interface ICarnet {
  id: number;
  cliente_id: number;
  usuario_id: number;
  meses_pagados: number[];  // Array de meses (1-12)
  carnet_url: string | null;
  activo: boolean;
  fecha_desde: Date;
  fecha_hasta: Date | null;
  fecha_creacion: Date;
  fecha_ultima_actualizacion: Date;
  // Relaciones
  cliente?: ICliente;
  usuario?: IUsuario;
}

export interface ICarnetCreate {
  cliente_id: number;
  usuario_id: number;
  meses_pagados: number[];
  carnet_url?: string;
  activo?: boolean;
  fecha_desde: Date;
  fecha_hasta?: Date;
}

export interface ICarnetUpdate {
  meses_pagados?: number[];
  carnet_url?: string | null;
  activo?: boolean;
  fecha_hasta?: Date | null;
}

export interface ICarnetGenerar {
  cliente_id: number;
  usuario_id: number;  // ID del admin que genera el carnet
  meses: number[];     // Meses a marcar como pagados
  año: number;         // Año del carnet
}

export interface IFiltrosCarnet {
  cliente_id?: number;
  activo?: boolean;
  fecha_desde?: Date;
  fecha_hasta?: Date;
  pagina?: number;
  limite?: number;
}