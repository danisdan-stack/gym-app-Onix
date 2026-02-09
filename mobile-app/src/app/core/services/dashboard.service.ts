import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Cliente, DashboardData, IngresoMensual, PagoPendiente, Stats } from '../models/dasboard.model';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {

  private baseUrl = `${environment.apiUrl}/dashboard`;

  constructor(private http: HttpClient) {}

  // =========================
  // DASHBOARD COMPLETO
  // =========================
  getFullDashboard(): Observable<DashboardData> {
    return this.http.get<DashboardData>(`${this.baseUrl}/resumen`);
  }

  // =========================
  // ESTADÍSTICAS
  // =========================
  getStats(): Observable<Stats> {
    return this.http.get<Stats>(`${this.baseUrl}/estadisticas`);
  }

  // =========================
  // CLIENTES RECIENTES
  // =========================
  getRecentClients(limit: number = 5): Observable<Cliente[]> {
    return this.http.get<Cliente[]>(
      `${this.baseUrl}/clientes-recientes?limit=${limit}`
    );
  }

  // =========================
  // PAGOS PENDIENTES
  // =========================
  getPendingPayments(): Observable<PagoPendiente[]> {
    return this.http.get<PagoPendiente[]>(
      `${this.baseUrl}/pagos-pendientes`
    );
  }

  // =========================
  // INGRESOS MENSUALES
  // =========================
  getMonthlyIncome(): Observable<IngresoMensual[]> {
    return this.http.get<IngresoMensual[]>(
      `${this.baseUrl}/ingresos`
    );
  }
}
