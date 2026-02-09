export interface Cliente {
  nombre: string;
  apellido: string;
  fecha_inscripcion?: string;
}

export interface PagoPendiente {
  nombre: string;
  apellido: string;
  fecha_vencimiento: string;
  dias_vencido: number;
}

export interface Stats {
  total_clientes: number;
  clientes_activos: number;
  clientes_vencidos: number;
}

export interface DashboardData {
  estadisticas: Stats;
  clientesRecientes: Cliente[];
  pagosPendientes: PagoPendiente[];
  timestamp: string;
}

export interface IngresoMensual {
  mes: string;
  total: number;
}
