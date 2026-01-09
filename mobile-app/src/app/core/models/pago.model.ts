// src/app/core/models/pago.model.ts
import { Cliente } from './cliente.model';

// Interface principal
export interface Pago {
  id: number;
  cliente_id: number;
  monto: number;
  fecha_pago: Date | string;
  fecha_vencimiento: Date | string;
  fecha_registro: Date | string;
  metodo: 'efectivo' | 'tarjeta' | 'transferencia' | 'otro';
  tipo_pago: 'normal' | 'anticipado' | 'tardio' | null;
  estado: 'pagado' | 'pendiente' | 'anulado' | 'vencido';
  periodo_mes: number | null;  // 1-12
  periodo_ano: number | null;
  comprobante_url: string | null;
  referencia: string | null;
  observaciones: string | null;
  creado_en: Date | string;
  actualizado_en: Date | string;
  
  // Relaciones
  cliente?: Cliente;
  
  // Campos para frontend
  clienteNombre?: string;
  diasVencido?: number;
}

// Para crear pago
export interface CreatePagoDto {
  fecha_pago: Date | string;
  cliente_id: number;
  monto: number;
  fecha_vencimiento: Date | string;
  metodo: 'efectivo' | 'tarjeta' | 'transferencia' | 'otro';
  tipo_pago?: 'normal' | 'anticipado' | 'tardio';
  estado?: 'pagado' | 'pendiente' | 'anulado' | 'vencido';
  periodo_mes?: number;
  periodo_ano?: number;
  comprobante_url?: string;
  referencia?: string;
  observaciones?: string;
}

// Para actualizar pago
export interface UpdatePagoDto {
  monto?: number;
  fecha_pago?: Date | string;
  fecha_vencimiento?: Date | string;
  metodo?: 'efectivo' | 'tarjeta' | 'transferencia' | 'otro';
  tipo_pago?: 'normal' | 'anticipado' | 'tardio' | null;
  estado?: 'pagado' | 'pendiente' | 'anulado' | 'vencido';
  periodo_mes?: number | null;
  periodo_ano?: number | null;
  comprobante_url?: string | null;
  referencia?: string | null;
  observaciones?: string | null;
}

// Filtros para búsqueda
export interface FiltrosPago {
  cliente_id?: number;
  estado?: 'pagado' | 'pendiente' | 'anulado' | 'vencido';
  periodo_mes?: number;
  periodo_ano?: number;
  metodo?: 'efectivo' | 'tarjeta' | 'transferencia' | 'otro';
  fecha_desde?: Date | string;
  fecha_hasta?: Date | string;
  pagina?: number;
  limite?: number;
}