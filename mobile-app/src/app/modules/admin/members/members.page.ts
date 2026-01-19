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

  private apiUrl = 'https://gym-app-n77p.onrender.com/api';

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
            console.log('📦 RESPUESTA CRUDA DEL BACKEND:', response);
            
            // ✅ DIAGNÓSTICO: Ver primer cliente RAW
            if (response.data && response.data.length > 0) {
              const first = response.data[0];
              console.log('🔍 Primer cliente RAW:', first);
              console.log('📋 Campos disponibles:');
              Object.keys(first).forEach(key => {
                console.log(`  ${key}: ${first[key]} (${typeof first[key]})`);
              });
            }
            
            // ✅ MAPEO CORREGIDO
            this.clients = response.data.map((clienteData: any) => ({
              // 🔥 ID PRIMERO: usar id si viene, sino usuario_id
              id: clienteData.id || clienteData.usuario_id || 0,
              usuario_id: clienteData.usuario_id,
              nombre: clienteData.nombre || '',
              apellido: clienteData.apellido || '',
              telefono: clienteData.telefono || '',
              email: clienteData.email || '',
              estado_cuota: clienteData.estado_cuota || 'pendiente',
              
              // ✅ PARSEAR FECHAS CORRECTAMENTE
              fecha_inscripcion: this.parseDate(clienteData.fecha_inscripcion),
              fecha_vencimiento: this.parseDate(clienteData.fecha_vencimiento),
              
              direccion: clienteData.direccion || '',
              entrenador_id: clienteData.entrenador_id || null,
              foto: clienteData.foto || undefined,
              carnet_url: clienteData.carnet_url || undefined,
              
              // Campos opcionales
              creado_en: this.parseDate(clienteData.creado_en) || new Date(),
              actualizado_en: this.parseDate(clienteData.actualizado_en) || new Date(),
              dni: clienteData.dni || '',
              photo: clienteData.photo || undefined,
              estado: clienteData.estado || '',
              fechaRegistro: this.parseDate(clienteData.fechaRegistro),
              
              // Campos calculados
              diasRestantes: 0 // Se calculará después
            } as Cliente));
            
            console.log('✅ Primer cliente mapeado:', this.clients[0]);
            
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

  // ✅ MÉTODO PARA PARSEAR FECHAS
  private parseDate(dateString: any): Date | null {
    if (!dateString) return null;
    
    try {
      // Si ya es Date
      if (dateString instanceof Date) return dateString;
      
      // Si es string ISO (ej: "2026-01-14T03:00:00.000Z")
      if (typeof dateString === 'string') {
        // Limpiar string
        const cleanString = dateString.trim();
        
        // Si es solo fecha (YYYY-MM-DD)
        if (/^\d{4}-\d{2}-\d{2}$/.test(cleanString)) {
          return new Date(cleanString + 'T00:00:00.000Z');
        }
        
        // Si ya tiene formato completo
        const date = new Date(cleanString);
        return isNaN(date.getTime()) ? null : date;
      }
      
      // Si es número (timestamp)
      if (typeof dateString === 'number') {
        return new Date(dateString);
      }
      
      return null;
    } catch (error) {
      console.warn('⚠️ Error parseando fecha:', dateString, error);
      return null;
    }
  }

  // ✅ FUNCIÓN CALCULAR ESTADO - CORREGIDA
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
      console.warn('⚠️ Error calculando estado para:', cliente.nombre, error);
      return 'inactivo';
    }
  }

  // ✅ CLASIFICAR CLIENTES - CORREGIDA
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

  // ✅ DÍAS PARA VENCER
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

  // ✅ AVISO POR VENCER
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

  // ✅ FORMATO FECHAS PARA MOSTRAR
  formatDate(date: string | Date | null | undefined): string {
    if (!date) return 'Sin fecha';
    
    try {
      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) {
        return 'Fecha inválida';
      }
      return dateObj.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch {
      return 'Error fecha';
    }
  }

  // ✅ GENERAR ENLACE WHATSAPP
  generarEnlaceWhatsApp(cliente: Cliente): string {
    if (!cliente.telefono) return '#';
    let telefono = cliente.telefono.toString().replace(/\D/g, '');
    if (telefono.length === 10) telefono = '54' + telefono;
    const mensaje = this.generarMensajeWhatsApp(cliente);
    return `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`;
  }

  // ✅ GENERAR MENSAJE WHATSAPP - CORREGIDO
  generarMensajeWhatsApp(cliente: Cliente): string {
    const backendUrl = 'https://gym-app-n77p.onrender.com';
    
    // ✅ USAR id PRIMERO, luego usuario_id como fallback
    const clienteId = cliente.id || cliente.usuario_id;
    
    if (!clienteId) {
      console.error('❌ Cliente sin ID para WhatsApp:', cliente);
      return `¡Hola ${cliente.nombre}! Contacta al gimnasio para obtener tu carnet.`;
    }
    
    // ✅ ENLACE CORRECTO
    const urlCarnet = `${backendUrl}/api/carnets/descargar/${clienteId}`;
    
    // 📱 MENSAJE OPTIMIZADO
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

  // ✅ FILTRAR POR ESTADO
  filterByStatus(event: any) {
    this.filterStatus = event.detail.value;
  }

  // ✅ BUSCAR
  onSearchInput(event: any) {
    this.searchTerm = event.detail?.value || '';
    this.clasificarClientes(); // Reclasificar con filtro
  }

  // ✅ OBTENER CLIENTES FILTRADOS Y ORDENADOS
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
    lista.sort((a, b) => {
      // PRIMERO: Ordenar por fecha de vencimiento (más reciente primero)
      if (a.fecha_vencimiento && b.fecha_vencimiento) {
        const fechaA = new Date(a.fecha_vencimiento).getTime();
        const fechaB = new Date(b.fecha_vencimiento).getTime();
        return fechaB - fechaA; // Orden descendente
      }
      
      // SEGUNDO: Si uno tiene fecha y otro no
      if (a.fecha_vencimiento && !b.fecha_vencimiento) return -1;
      if (!a.fecha_vencimiento && b.fecha_vencimiento) return 1;
      
      // TERCERO: Ordenar por fecha de inscripción
      if (a.fecha_inscripcion && b.fecha_inscripcion) {
        const fechaA = new Date(a.fecha_inscripcion).getTime();
        const fechaB = new Date(b.fecha_inscripcion).getTime();
        return fechaB - fechaA;
      }
      
      // CUARTO: Si uno tiene fecha inscripción y otro no
      if (a.fecha_inscripcion && !b.fecha_inscripcion) return -1;
      if (!a.fecha_inscripcion && b.fecha_inscripcion) return 1;
      
      // QUINTO: Orden alfabético
      const nombreCompletoA = `${a.nombre || ''} ${a.apellido || ''}`.toLowerCase();
      const nombreCompletoB = `${b.nombre || ''} ${b.apellido || ''}`.toLowerCase();
      return nombreCompletoA.localeCompare(nombreCompletoB);
    });
    
    return lista;
  }

  // ✅ COLORES DE ESTADO
  getStatusColor(status: string): string {
    switch (status) {
      case 'activo': return 'success';
      case 'inactivo': return 'medium';
      case 'suspendido': return 'danger';
      default: return 'medium';
    }
  }

  // ✅ ICONOS DE ESTADO
  getStatusIcon(status: string): string {
    switch (status) {
      case 'activo': return 'checkmark-circle-outline';
      case 'porVencer': return 'time-outline';
      case 'inactivo': return 'close-circle-outline';
      default: return 'person';
    }
  }

  // ✅ ETIQUETAS DE ESTADO
  getStatusLabel(status: string): string {
    switch (status) {
      case 'activos': return 'Activos';
      case 'porVencer': return 'Por Vencer';
      case 'inactivos': return 'Inactivos';
      default: return 'Activos';
    }
  }

  // ✅ NAVEGACIÓN
  goToNewMember() {
    this.router.navigate(['/rapido']);
  }

  goToDashboard() {
    this.router.navigate(['/admin/dashboard']);
  }

  viewMemberDetails(clientId: number) {
    this.router.navigate(['/admin/members', clientId]);
  }

  // ✅ REFRESCAR
  refreshData(event?: any) {
    this.loadClientsFromBackend();
    if (event) {
      setTimeout(() => event.target.complete(), 1000);
    }
  }

  // ✅ DESCARGAR CARNET - CORREGIDO
  descargarCarnet(cliente: Cliente) {
    console.log('🎫 Descargar carnet para:', {
      id: cliente.id,
      usuario_id: cliente.usuario_id,
      nombre: cliente.nombre,
      apellido: cliente.apellido
    });
    
    // ✅ USAR id PRIMERO, luego usuario_id como fallback
    const clienteId = cliente.id || cliente.usuario_id;
    
    if (!clienteId) {
      console.error('❌ ERROR: Cliente no tiene ID ni usuario_id:', cliente);
      alert('Error: Cliente no tiene ID asociado');
      return;
    }
    
    const url = `https://gym-app-n77p.onrender.com/api/carnets/descargar/${clienteId}`;
    console.log('🔗 URL carnet:', url);
    
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  // ✅ MÉTODO AUXILIAR PARA FORMATO DE NOMBRES (opcional)
  formatearNombreUrl(nombre: string): string {
    if (!nombre) return '';
    
    return nombre
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9_]/g, '');
  }
}
