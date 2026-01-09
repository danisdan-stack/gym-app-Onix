// frontend/src/app/core/services/dashboard.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private apiUrl = `${environment.apiUrl}/dashboard`;

  constructor(private http: HttpClient) {}
  

  getDashboardStats(): Observable<any> {
    return this.http.get(`${this.apiUrl}/estadisticas`);
  }

  getRecentClients(limit: number = 5): Observable<any> {
    return this.http.get(`${this.apiUrl}/clientes-recientes?limit=${limit}`);
  }

  getPendingPayments(): Observable<any> {
    return this.http.get(`${this.apiUrl}/pagos-pendientes`);
  }

  getFullDashboard(): Observable<any> {
    return this.http.get(`${this.apiUrl}/resumen`);
  }
  
}