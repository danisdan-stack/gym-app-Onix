import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Cliente {
  nombre: string;
  apellido: string;
  fecha_inscripcion?: string;
  email?: string;
}

export interface Pago {
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
  pagosPendientes: Pago[];
  timestamp: string;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {

  private baseUrl = 'http://localhost:3000/api/dashboard';

  constructor(private http: HttpClient) { }

  getFullDashboard(): Observable<DashboardData> {
    return this.http.get<DashboardData>(`${this.baseUrl}/full`);
  }

}