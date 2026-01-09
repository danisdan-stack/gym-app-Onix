
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { 
  IonContent, 
  IonHeader, 
  IonTitle, 
  IonToolbar,
  IonSearchbar,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonList,
  IonItem,
  IonAvatar,
  IonIcon,
  IonButton,
  IonButtons,
  IonBadge,
  IonNote,
  IonMenuButton,
  IonSpinner,
  IonCard,
  IonCardContent,
  IonFab,
  IonFabButton
} from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { people, add, person, search, logoWhatsapp, call, calendar, refresh, eye, menu, home } from 'ionicons/icons'; // ← AGREGAR 'home'
import { Cliente } from '../../../core/models/cliente.model';

@Component({
  selector: 'app-members',
  templateUrl: './members.page.html',
  styleUrls: ['./members.page.scss'],
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule,
    FormsModule,
    IonContent, 
    IonHeader, 
    IonTitle, 
    IonToolbar,
    IonSearchbar,
    IonSegment,
    IonSegmentButton,
    IonLabel,
    IonList,
    IonItem,
    IonAvatar,
    IonIcon,
    IonButton,
    IonButtons,
    IonBadge,
    IonNote,
    IonMenuButton,
    IonSpinner,
    IonCard,
    IonCardContent,
    IonFab,
    IonFabButton
  ]
})
export class MembersPage implements OnInit {
  clients: Cliente[] = [];
  filteredClients: Cliente[] = [];
  searchTerm = '';
  filterStatus = 'all';
  loading = true;
  errorMessage = '';

  // Para estadísticas
  totalActivos = 0;
  totalPorVencer = 0; 

  // URL de tu backend
  private apiUrl = 'http://localhost:3000/api';

  constructor(
    private router: Router,
    private http: HttpClient
  ) {
    addIcons({ people, add, person, search, logoWhatsapp, call, calendar, refresh, eye, menu, home }); // ← AGREGAR 'home'
  }

  ngOnInit() {
    this.loadClientsFromBackend();
  }

  loadClientsFromBackend() {
    this.loading = true;
    this.errorMessage = '';

  this.http.get<any>(`${this.apiUrl}/clientes-con-carnet`)
    .subscribe({
      next: (response) => {
        this.loading = false;
        
        if (response.success) {
          console.log('📊 Datos del backend CON CARNET:', response.data[0]);
          
          this.clients = response.data.map((clienteData: any) => ({
              usuario_id: clienteData.id || clienteData.usuario_id,
              nombre: clienteData.nombre,
              apellido: clienteData.apellido,
              telefono: clienteData.telefono,
              email: clienteData.email || '',
              estado_cuota: clienteData.estado_cuota,
              fecha_inscripcion: clienteData.fecha_inscripcion,
              fecha_vencimiento: clienteData.fecha_vencimiento,
              direccion: clienteData.direccion || '',
              entrenador_id: clienteData.entrenador_id || null,
              foto: clienteData.foto || undefined,
              creado_en: new Date(),
              actualizado_en: new Date(),
              carnet_url: clienteData.carnet_url
            } as Cliente));
            
             // ORDENAR por fecha de inscripción (más recientes primero)
          this.clients.sort((a, b) => {
            const fechaA = new Date(a.fecha_inscripcion).getTime();
            const fechaB = new Date(b.fecha_inscripcion).getTime();
            return fechaB - fechaA; // Más recientes primero
          });
          
          this.filteredClients = [...this.clients];
          console.log(`✅ ${this.clients.length} clientes cargados y ordenados por fecha de inscripción`);
        } else {
          this.errorMessage = response.message || 'Error al cargar clientes';
        }
      },
        
        error: (error) => {
          this.loading = false;
          console.error('❌ Error HTTP:', error);
          this.errorMessage = 'No se pudo conectar con el servidor';
          // NO hay datos jarcodeados - solo el mensaje de error
        }
      });
  }
// Después de loadClientsFromBackend() o antes de formatDate()
searchClient(event: any) {
  const term = event.target.value.toLowerCase();
  this.searchTerm = term;
  this.applyFilters();
}
  formatDate(date: string | Date): string {
    if (!date) return '';
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('es-ES');
  }

  diasParaVencer(fechaVencimiento: string | Date): number {
    if (!fechaVencimiento) return 0;
    
    const fechaVenc = typeof fechaVencimiento === 'string' 
      ? new Date(fechaVencimiento) 
      : fechaVencimiento;
    
    const hoy = new Date();
    const diferencia = fechaVenc.getTime() - hoy.getTime();
    
    return Math.ceil(diferencia / (1000 * 3600 * 24));
  }

  generarEnlaceWhatsApp(cliente: Cliente): string {
  if (!cliente.telefono) return '#';
  
  // 1. Usa el número DEL CLIENTE (para escribirle directamente)
  let telefono = cliente.telefono.toString().replace(/\D/g, '');
  
  // 2. Formatear para WhatsApp (Argentina)
  if (telefono.length === 10) {
    telefono = '54' + telefono; // Código Argentina
  }
  
  // 3. Generar mensaje MEJORADO
  const mensaje = this.generarMensajeWhatsApp(cliente);
  const mensajeCodificado = encodeURIComponent(mensaje);
  
  // 4. Enlace para escribir AL CLIENTE (no al gimnasio)
  return `https://wa.me/${telefono}?text=${mensajeCodificado}`;
}

generarMensajeWhatsApp(cliente: Cliente): string {
  const carnetUrl = (cliente as any).carnet_url;
  
  // Usar ngrok en lugar de localhost
  let urlCompleta = '';
  if (carnetUrl && carnetUrl.trim() !== '') {
    // Convertir a URL con ngrok
    if (carnetUrl.startsWith('/')) {
      urlCompleta = `https://woodrow-opprobrious-hypercarnally.ngrok-free.dev${carnetUrl}`;
    } else if (carnetUrl.startsWith('http://localhost:3000')) {
      urlCompleta = carnetUrl.replace(
        'http://localhost:3000', 
        'https://woodrow-opprobrious-hypercarnally.ngrok-free.dev'
      );
    } else {
      urlCompleta = carnetUrl;
    }
  }
  
  // Mensaje MEJORADO
  let mensaje = `*¡HOLA ${cliente.nombre.toUpperCase()}!*\n\n` +
    `Tu registro en ONIX GYM ha sido completado\n\n`;
  
  if (urlCompleta) {
    mensaje += ` *Tu carnet digital:*\n` +
      `${urlCompleta}\n\n` +
      `_Haz clic para ver/descargar_\n\n`;
  }
  
  mensaje += ` *Fecha inscripción:* ${this.formatDate(cliente.fecha_inscripcion)}\n` +
    `*Válido por:* 15 días\n\n` +
    `¡Nos vemos en el gym! `;
  
  return mensaje;
}

  filterByStatus(event: any) {
    this.filterStatus = event.detail.value;
    this.applyFilters();
  }

  applyFilters() {
    let filtered = [...this.clients];
    
    if (this.searchTerm) {
      filtered = filtered.filter(client =>
        client.nombre.toLowerCase().includes(this.searchTerm) ||
        client.apellido.toLowerCase().includes(this.searchTerm) ||
        client.email?.toLowerCase().includes(this.searchTerm) ||
        client.telefono.includes(this.searchTerm)
      );
    }
    
    if (this.filterStatus !== 'all') {
      filtered = filtered.filter(client => client.estado_cuota === this.filterStatus);
    }
    
    this.filteredClients = filtered;
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'activo': return 'success';
      case 'inactivo': return 'medium';
      case 'suspendido': return 'danger';
      default: return 'medium';
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
      setTimeout(() => {
        event.target.complete();
      }, 1000);
    }
  }
}