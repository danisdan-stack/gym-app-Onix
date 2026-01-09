

export interface Carnet {
  id: number;
  cliente_id: number;
  usuario_id: number;
  meses_pagados: number[];
  carnet_url: string | null;
  activo: boolean;
  fecha_desde: Date | string;
  fecha_hasta: Date | string | null;
  fecha_creacion: Date | string;
  fecha_ultima_actualizacion: Date | string;
  
  // Para frontend
  cliente?: any;
  usuario?: any;
  clienteNombre?: string;
  tipo?: string;
  diasRestantes?: number;
}

export interface CarnetCreate {
  cliente_id: number;
  usuario_id: number;
  meses_pagados: number[];
  carnet_url?: string;
  activo?: boolean;
  fecha_desde: Date | string;
  fecha_hasta?: Date | string;
}

export interface CarnetUpdate {
  meses_pagados?: number[];
  carnet_url?: string | null;
  activo?: boolean;
  fecha_hasta?: Date | string | null;
}

export interface CarnetGenerar {
  cliente_id: number;
  usuario_id: number;
  meses: number[];
  año: number;
}

export interface FiltrosCarnet {
  cliente_id?: number;
  activo?: boolean;
  fecha_desde?: Date | string;
  fecha_hasta?: Date | string;
  pagina?: number;
  limite?: number;
}
