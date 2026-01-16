// frontend/src/app/core/services/dashboard.service.ts - VERSIÓN CON TIPOS
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

// Interfaces para los tipos
interface Cliente {
  usuario_id?: number;
  id?: number;
  nombre?: string;
  apellido?: string;
  estado_cuota?: string;
  estado?: string;
  fecha_vencimiento?: string;
}

interface Pago {
  id?: number;
  cliente_id?: number;
  monto?: number;
  estado?: string;
  metodo?: string;
  fecha_vencimiento?: string;
}

interface ApiResponse<T> {
  success?: boolean;
  data?: T[];
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  // URL CORRECTA
  private apiUrl = 'https://gym-app-n77p.onrender.com/api';

  constructor(private http: HttpClient) {
    console.log('🔗 DashboardService conectando a:', this.apiUrl);
  }

  // ✅ USAR RUTA QUE SÍ EXISTE: /api/clientes
  getDashboardStats(): Observable<any> {
    return this.http.get<ApiResponse<Cliente>>(`${this.apiUrl}/clientes`).pipe(
      map((response: ApiResponse<Cliente>) => {
        // El backend devuelve { data: [...] }
        const clientes = response.data || [];
        
        return {
          total_clientes: clientes.length,
          clientes_activos: clientes.filter((c: Cliente) => 
            c.estado_cuota === 'activo'
          ).length,
          clientes_inactivos: clientes.filter((c: Cliente) => 
            c.estado_cuota === 'inactivo'
          ).length,
          _message: 'Datos reales del backend'
        };
      }),
      catchError(error => {
        console.error('Error obteniendo clientes:', error);
        return of({
          total_clientes: 0,
          clientes_activos: 0,
          clientes_inactivos: 0,
          _message: 'Error conectando al servidor'
        });
      })
    );
  }

  // ✅ Obtener clientes recientes (usando /api/clientes)
  getRecentClients(limit: number = 5): Observable<Cliente[]> {
    return this.http.get<ApiResponse<Cliente>>(`${this.apiUrl}/clientes`).pipe(
      map((response: ApiResponse<Cliente>) => {
        const clientes = response.data || [];
        return clientes.slice(0, limit);
      }),
      catchError(() => of([]))
    );
  }

  // ✅ Obtener pagos pendientes (usando /api/pagos)
  getPendingPayments(): Observable<Pago[]> {
    return this.http.get<ApiResponse<Pago>>(`${this.apiUrl}/pagos`).pipe(
      map((response: ApiResponse<Pago>) => {
        const pagos = response.data || [];
        return pagos.filter((p: Pago) => p.estado === 'pendiente').slice(0, 10);
      }),
      catchError(() => of([]))
    );
  }

  getFullDashboard(): Observable<any> {
    return this.getDashboardStats();
  }
}