
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar,
  IonSearchbar, IonSegment, IonSegmentButton, IonLabel,
  IonList, IonItem, IonAvatar, IonIcon, IonButton,
  IonButtons, IonBadge, IonNote, IonMenuButton, IonSpinner,
  IonCard, IonCardContent, IonFab, IonFabButton,
  IonChip, IonGrid, IonRow, IonCol
} from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { 
  people, add, person, search, logoWhatsapp, call, calendar, 
  refresh, eye, menu, home, arrowDownCircleOutline,
  timeOutline, checkmarkCircleOutline, closeCircleOutline, time,
  downloadOutline,
  peopleOutline
} from 'ionicons/icons';
import { Cliente } from '../../../core/models/cliente.model';

@Component({
  selector: 'app-members',
  templateUrl: './members.page.html',
  styleUrls: ['./members.page.scss'],
  standalone: true,
  imports: [
    CommonModule, RouterModule, FormsModule,
    IonContent, IonHeader, IonTitle, IonToolbar,
    IonSearchbar, IonSegment, IonSegmentButton, IonLabel,
    IonList, IonItem, IonAvatar, IonIcon, IonButton,
    IonButtons, IonBadge, IonNote, IonMenuButton, IonSpinner,
    IonCard, IonCardContent, IonFab, IonFabButton,
    IonChip, IonGrid, IonRow, IonCol
  ]
})
export class MembersPage implements OnInit {
  // Todos los clientes
  clients: Cliente[] = [];
  
  // Listas separadas
  activos: Cliente[] = [];
  porVencer: Cliente[] = [];  // Vence en 7 días o menos
  inactivos: Cliente[] = [];
  
  // Estadísticas
  totalActivos = 0;
  totalPorVencer = 0;
  totalInactivos = 0;
  
  // Filtros
  searchTerm = '';
  filterStatus = 'activos'; // 'activos', 'porVencer', 'inactivos'
  loading = true;
  errorMessage = '';

  private apiUrl = 'http://localhost:3000/api';

  constructor(
    private router: Router,
    private http: HttpClient
  ) {
    addIcons({ 
      people, add, person, search, logoWhatsapp, call, calendar, 
      refresh, eye, menu, home, 'arrow-down-circle-outline': arrowDownCircleOutline,
      'time-outline': timeOutline, 
      'checkmark-circle-outline': checkmarkCircleOutline,
      'close-circle-outline': closeCircleOutline, time,
    'download-outline': downloadOutline,
    'people-outline': peopleOutline
    });
  }

  ngOnInit() {
    this.loadClientsFromBackend();
  }

  loadClientsFromBackend() {
    this.loading = true;
    this.errorMessage = '';

     this.http.get<any>(`${this.apiUrl}/clientes`)
    .subscribe({
        next: (response) => {
          this.loading = false;
          
          if (response.success) {
            console.log('📊 Datos del backend:', response.data.length, 'clientes');
            
            // Mapear datos
            // Mapear datos
this.clients = response.data.map((clienteData: any) => ({
  usuario_id: clienteData.usuario_id,  // ← YA VIENE COMO usuario_id
  nombre: clienteData.nombre,
  apellido: clienteData.apellido,
  telefono: clienteData.telefono,
  email: '',  // ← NO VIENE EN LA RESPUESTA
  estado_cuota: clienteData.estado_cuota,  // ← 'activo'
  fecha_inscripcion: clienteData.fecha_inscripcion,  // ← FORMATO: "2026-01-14T03:00:00.000Z"
  fecha_vencimiento: clienteData.fecha_vencimiento,  // ← FORMATO: "2026-02-13T03:00:00.000Z"
  direccion: clienteData.direccion || '',
  entrenador_id: clienteData.entrenador_id || null,
  foto: undefined,  // ← NO VIENE
  creado_en: new Date(clienteData.creado_en),  // ← USAR FECHA REAL
  actualizado_en: new Date(clienteData.actualizado_en),  // ← USAR FECHA REAL
  carnet_url: undefined  // ← NO VIENE EN ESTE ENDPOINT
} as Cliente));
            
            // ✅ CLASIFICAR CLIENTES
            this.clasificarClientes();
            
            console.log(`✅ Clasificados: ${this.activos.length} activos, ${this.porVencer.length} por vencer, ${this.inactivos.length} inactivos`);
          }
        },
        error: (error) => {
          this.loading = false;
          console.error('❌ Error HTTP:', error);
          this.errorMessage = 'No se pudo conectar con el servidor';
        }
      });
  }

  // Modificar la función calcularEstadoCliente()
calcularEstadoCliente(cliente: Cliente): 'activo' | 'inactivo' {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  
  if (!cliente.fecha_vencimiento) {
    return 'inactivo';
  }
  
  try {
    const fechaVenc = new Date(cliente.fecha_vencimiento);
    fechaVenc.setHours(0, 0, 0, 0);
    
    if (isNaN(fechaVenc.getTime())) {
      return 'inactivo';
    }
    
    // Cliente activo si la fecha de vencimiento es hoy o en el futuro
    return fechaVenc >= hoy ? 'activo' : 'inactivo';
    
  } catch (error) {
    return 'inactivo';
  }
}

// Modificar clasificarClientes() para usar 30 días
clasificarClientes() {
  this.activos = [];
  this.porVencer = [];
  this.inactivos = [];
  
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  
  this.clients.forEach(cliente => {
    const estado = this.calcularEstadoCliente(cliente);
    
    if (estado === 'inactivo') {
      this.inactivos.push(cliente);
    } else if (estado === 'activo') {
      // Verificar si está por vencer (menos de 7 días para el vencimiento)
      if (cliente.fecha_vencimiento) {
        const fechaVenc = new Date(cliente.fecha_vencimiento);
        fechaVenc.setHours(0, 0, 0, 0);
        const diasRestantes = Math.ceil((fechaVenc.getTime() - hoy.getTime()) / (1000 * 3600 * 24));
        
        // Si faltan 7 días o menos para el vencimiento
        if (diasRestantes <= 7 && diasRestantes >= 0) {
          this.porVencer.push(cliente);
        } else {
          this.activos.push(cliente);
        }
      } else {
        this.activos.push(cliente);
      }
    }
  });
  
  // Actualizar estadísticas
  this.totalActivos = this.activos.length;
  this.totalPorVencer = this.porVencer.length;
  this.totalInactivos = this.inactivos.length;
}
 diasParaVencer(cliente: Cliente): number {
    if (!cliente.fecha_vencimiento) {
      return 999;
    }
    
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    const fechaVenc = new Date(cliente.fecha_vencimiento);
    fechaVenc.setHours(0, 0, 0, 0);
    
    if (isNaN(fechaVenc.getTime())) {
      return 999;
    }
    
    const diferenciaMs = fechaVenc.getTime() - hoy.getTime();
    return Math.ceil(diferenciaMs / (1000 * 3600 * 24));
  }
// Nueva función para mostrar el aviso "Por vencer" en el HTML
getAvisoPorVencer(cliente: Cliente): string {
  if (!cliente.fecha_vencimiento) return '';
  
  const diasRestantes = this.diasParaVencer(cliente);
  
  if (diasRestantes <= 7 && diasRestantes > 0) {
    return ` (Vence en ${diasRestantes} días)`;
  } else if (diasRestantes === 0) {
    return ' (Vence hoy)';
  } else if (diasRestantes < 0) {
    return ' (Vencido)';
  }
  
  return '';
}

  // Resto de tus métodos (sin cambios)
  formatDate(date: string | Date | null | undefined): string {
    if (!date) return 'Sin fecha';
    const dateObj = new Date(date);
    return isNaN(dateObj.getTime()) ? 'Fecha inválida' : dateObj.toLocaleDateString('es-ES');
  }

  generarEnlaceWhatsApp(cliente: Cliente): string {
    if (!cliente.telefono) return '#';
    let telefono = cliente.telefono.toString().replace(/\D/g, '');
    if (telefono.length === 10) telefono = '54' + telefono;
    const mensaje = this.generarMensajeWhatsApp(cliente);
    return `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`;
  }

generarMensajeWhatsApp(cliente: Cliente): string {
  const backendUrl = 'http://localhost:3000';
  
  // ✅ ENLACE DIRECTAMENTE CLICKEABLE
  const urlCarnet = `${backendUrl}/api/carnets/descargar/${cliente.usuario_id}`;
  
  // 📱 MENSAJE OPTIMIZADO PARA WHATSAPP (los enlaces ya son clicables)
  let mensaje = `*¡HOLA ${cliente.nombre.toUpperCase()}!*\n\n`;
  mensaje += `Tu registro en ONIX GYM ha sido completado ✅\n\n`;
  
  mensaje += `*🎫 TU CARNET DIGITAL:*\n`;
  mensaje += `${urlCarnet}\n\n`;
  mensaje += `*👉 HAZ CLIC EN EL ENLACE DE ARRIBA*\n`;
  mensaje += `Se abrirá tu carnet para ver/descargar 📱\n\n`;
  
  mensaje += `*📝 Formulario de datos:*\n`;
  mensaje += `https://forms.gle/RjDLmzH29UeocWcV8\n\n`;
  
  mensaje += `🏋️ *¡Te esperamos!* 💪`;
  
  return mensaje;
}

// Método auxiliar para formatear nombres (OPCIONAL - si necesitas limpiar caracteres)
formatearNombreUrl(nombre: string): string {
  if (!nombre) return '';
  
  return nombre
    .trim()
    .normalize('NFD')  // Separar acentos
    .replace(/[\u0300-\u036f]/g, '')  // Eliminar diacríticos
    .replace(/\s+/g, '_')  // Espacios por guiones bajos
    .replace(/[^a-zA-Z0-9_]/g, '');  // Eliminar caracteres especiales
}

  filterByStatus(event: any) {
    this.filterStatus = event.detail.value;
  }

  onSearchInput(event: any) {
    this.searchTerm = event.detail?.value || '';
    this.clasificarClientes(); // Reclasificar con filtro
  }

 getClientesFiltrados(): Cliente[] {
  let lista: Cliente[] = [];
  
  // Seleccionar lista según filtro
  switch (this.filterStatus) {
    case 'activos': lista = this.activos; break;
    case 'porVencer': lista = this.porVencer; break;
    case 'inactivos': lista = this.inactivos; break;
    default: lista = this.activos;
  }
  
  // Aplicar búsqueda si hay término
  if (this.searchTerm.trim()) {
    const term = this.searchTerm.toLowerCase().trim();
    lista = lista.filter(c => 
      c.nombre?.toLowerCase().includes(term) ||
      c.apellido?.toLowerCase().includes(term) ||
      c.telefono?.toString().includes(term) ||
      `${c.nombre} ${c.apellido}`.toLowerCase().includes(term)
    );
  }
  
  // ORDENAR DEL MÁS RECIENTE AL MÁS ANTIGUO
  // Basado en fecha_vencimiento (si existe), sino fecha_inscripcion
  lista.sort((a, b) => {
    // PRIMERO: Ordenar por fecha de vencimiento (más reciente primero)
    if (a.fecha_vencimiento && b.fecha_vencimiento) {
      const fechaA = new Date(a.fecha_vencimiento).getTime();
      const fechaB = new Date(b.fecha_vencimiento).getTime();
      return fechaB - fechaA; // Orden descendente (más reciente primero)
    }
    
    // SEGUNDO: Si uno tiene fecha y otro no, el que tiene fecha va primero
    if (a.fecha_vencimiento && !b.fecha_vencimiento) return -1;
    if (!a.fecha_vencimiento && b.fecha_vencimiento) return 1;
    
    // TERCERO: Ordenar por fecha de inscripción (más reciente primero)
    if (a.fecha_inscripcion && b.fecha_inscripcion) {
      const fechaA = new Date(a.fecha_inscripcion).getTime();
      const fechaB = new Date(b.fecha_inscripcion).getTime();
      return fechaB - fechaA; // Orden descendente
    }
    
    // CUARTO: Si uno tiene fecha inscripción y otro no
    if (a.fecha_inscripcion && !b.fecha_inscripcion) return -1;
    if (!a.fecha_inscripcion && b.fecha_inscripcion) return 1;
    
    // QUINTO: Orden alfabético por nombre como último criterio
    const nombreCompletoA = `${a.nombre || ''} ${a.apellido || ''}`.toLowerCase();
    const nombreCompletoB = `${b.nombre || ''} ${b.apellido || ''}`.toLowerCase();
    return nombreCompletoA.localeCompare(nombreCompletoB);
  });
  
  return lista;
}

  getStatusColor(status: string): string {
    switch (status) {
      case 'activo': return 'success';
      case 'inactivo': return 'medium';
      case 'suspendido': return 'danger';
      default: return 'medium';
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'activo': return 'checkmark-circle-outline';
      case 'porVencer': return 'time-outline';
      case 'inactivo': return 'close-circle-outline';
      default: return 'person';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'activos': return 'Activos';
      case 'porVencer': return 'Por Vencer';
      case 'inactivos': return 'Inactivos';
      default: return 'Activos';
    }
  }

  goToNewMember() {
    this.router.navigate(['/rapido']);
  }

  goToDashboard() {
    this.router.navigate(['/admin/dashboard']);
  }

  viewMemberDetails(clientId: number) {
    this.router.navigate(['/admin/members', clientId]);
  }

  refreshData(event?: any) {
    this.loadClientsFromBackend();
    if (event) {
      setTimeout(() => event.target.complete(), 1000);
    }
  }

  descargarCarnet(cliente: Cliente) {
    const clienteId = (cliente as any).usuario_id;
    if (!clienteId) return;
    const url = `http://localhost:3000/api/carnets/descargar/${clienteId}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}

