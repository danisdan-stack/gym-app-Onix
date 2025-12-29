// src/models/interfaces/pago.interface.ts
import { ICliente } from './cliente.interface';

export interface IPago {
  id: number;
  cliente_id: number;
  monto: number;
  fecha_pago: Date;
  fecha_vencimiento: Date;
  fecha_registro: Date;
  metodo: 'efectivo' | 'tarjeta' | 'transferencia' | 'otro';
  tipo_pago: 'normal' | 'anticipado' | 'tardio' | null;
  estado: 'pagado' | 'pendiente' | 'anulado' | 'vencido';
  periodo_mes: number | null;  // 1-12
  periodo_ano: number | null;
  comprobante_url: string | null;
  referencia: string | null;
  observaciones: string | null;
  creado_en: Date;
  actualizado_en: Date;
  // Relaciones
  cliente?: ICliente;
}

export interface IPagoCreate {
  fecha_pago: Date;
  cliente_id: number;
  monto: number;
  fecha_vencimiento: Date;
  metodo: 'efectivo' | 'tarjeta' | 'transferencia' | 'otro';
  tipo_pago?: 'normal' | 'anticipado' | 'tardio';
  estado?: 'pagado' | 'pendiente' | 'anulado' | 'vencido';
  periodo_mes?: number;
  periodo_ano?: number;
  comprobante_url?: string;
  referencia?: string;
  observaciones?: string;
  // fecha_pago se establece automáticamente si estado = 'pagado'
}

export interface IPagoUpdate {
  monto?: number;
  fecha_pago?: Date;
  fecha_vencimiento?: Date;
  metodo?: 'efectivo' | 'tarjeta' | 'transferencia' | 'otro';
  tipo_pago?: 'normal' | 'anticipado' | 'tardio' | null;
  estado?: 'pagado' | 'pendiente' | 'anulado' | 'vencido';
  periodo_mes?: number | null;
  periodo_ano?: number | null;
  comprobante_url?: string | null;
  referencia?: string | null;
  observaciones?: string | null;
}

export interface IFiltrosPago {
  cliente_id?: number;
  estado?: 'pagado' | 'pendiente' | 'anulado' | 'vencido';
  periodo_mes?: number;
  periodo_ano?: number;
  metodo?: 'efectivo' | 'tarjeta' | 'transferencia' | 'otro';
  fecha_desde?: Date;
  fecha_hasta?: Date;
  pagina?: number;
  limite?: number;
}