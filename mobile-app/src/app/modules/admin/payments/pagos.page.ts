// src/app/modules/admin/payments/pagos.page.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';


import { Router } from '@angular/router';
import { 
  AlertController, 
  LoadingController,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonGrid,
  IonRow,
  IonCol,
  IonIcon,
  IonButton,
  IonButtons,
  IonBadge,
  IonList,
  IonItem,
  IonLabel,
  IonAvatar,
  IonNote,
  IonSpinner,
  IonSearchbar,
  IonSegment,
  IonSegmentButton,
  
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  cashOutline,
  refresh,
  people,
  checkmarkCircle,
  warning,
  alertCircle,
  list,
  callOutline,
  calendarOutline,
  logoWhatsapp,
  cash,
  searchOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-pagos',
  templateUrl: './pagos.page.html',
  styleUrls: ['./pagos.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardSubtitle,
    IonCardContent,
    IonGrid,
    IonRow,
    IonCol,
    IonIcon,
    IonButton,
    IonButtons,
    IonBadge,
    IonList,
    IonItem,
    IonLabel,
    IonAvatar,
    IonNote,
    IonSpinner,
    IonSearchbar,
    IonSegment,
    IonSegmentButton
  ]
})

export class PagosPage implements OnInit {
  // Datos de clientes
  clientes: any[] = [];
  filteredClientes: any[] = [];
  
  // Estadísticas
  totalClientes: number = 0;
  alDiaCount: number = 0;
  retrasoLeveCount: number = 0;
  retrasoSeveroCount: number = 0;
  totalMensual: number = 0;
  
  // Filtros
  searchTerm: string = '';
  filtroEstado: string = 'todos';
  
  // Cargando
  isLoading: boolean = true;
    errorCarga: string | undefined;

  constructor(
    private http: HttpClient,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private router: Router
  ) {
    addIcons({
      
      cashOutline,
      refresh,
      people,
      checkmarkCircle,
      warning,
      alertCircle,
      list,
      callOutline,
      calendarOutline,
      logoWhatsapp,
      cash,
      searchOutline
    });
  }

  ngOnInit() {
    this.cargarClientes();
  }
 
// Añade este método si no existe
  volverAlHome() {
    this.router.navigate(['/admin/dashboard']);
    // O si quieres a la raíz:
    // this.router.navigate(['/']);
  }
 cargarClientes() {
  this.isLoading = true;
  
  // URL CORRECTA que ya funciona
  const url = 'http://localhost:3000/api/clientes';
  
  this.http.get<any>(url).subscribe({
    next: (response) => {
      if (response.success && response.data) {
        this.clientes = response.data;
        this.filteredClientes = [...this.clientes];
        this.calcularEstadisticas();
      }
      this.isLoading = false;
    },
    error: (error) => {
      console.error('Error:', error);
      this.clientes = [];
      this.isLoading = false;
    }
  });
}
procesarClientes() {
  // Adapta los datos de la API a tu interfaz
  this.clientes = this.clientes.map(cliente => {
    // 1. COMBINAR NOMBRE Y APELLIDO CORRECTAMENTE
    const nombre = cliente.nombre || '';
    const apellido = cliente.apellido || '';
    
    // Si ya tiene nombre_completo, úsalo, sino combínalos
    let nombreCompleto = cliente.nombre_completo;
    if (!nombreCompleto) {
      if (nombre && apellido) {
        nombreCompleto = `${nombre} ${apellido}`;
      } else if (nombre) {
        nombreCompleto = nombre;
      } else if (apellido) {
        nombreCompleto = apellido;
      } else {
        nombreCompleto = 'Cliente sin nombre';
      }
    }
    
    // 2. NORMALIZAR ESTADO
    const estado = cliente.estado_pago || cliente.estado_cuota || 'inactivo';
    let estadoNormalizado = 'inactivo';
    
    // Busca coincidencias en el texto del estado
    const estadoLower = estado.toLowerCase();
    if (estadoLower.includes('al-dia') || estadoLower.includes('pagado') || estadoLower.includes('activo')) {
      estadoNormalizado = 'al-dia';
    } else if (estadoLower.includes('retraso-leve') || estadoLower.includes('leve')) {
      estadoNormalizado = 'retraso-leve';
    } else if (estadoLower.includes('retraso-severo') || estadoLower.includes('severo') || estadoLower.includes('inactivo')) {
      estadoNormalizado = 'retraso-severo';
    }
    
    // 3. CALCULAR DIAS DE RETRASO
    let diasRetraso = cliente.dias_retraso || 0;
    
    // 4. VALOR POR DEFECTO DE MENSUALIDAD
    const mensualidad = cliente.mensualidad || 500; // Valor por defecto
    
    // 5. TELÉFONO FORMATEADO
    const telefono = cliente.telefono || 'Sin teléfono';
    
    return {
      id: cliente.id || cliente.usuario_id,
      nombre: nombre,
      apellido: apellido,
      nombre_completo: nombreCompleto, // ✅ AQUÍ ESTÁ EL NOMBRE COMPLETO
      telefono: telefono,
      email: cliente.email,
      mensualidad: mensualidad,
      estado: estadoNormalizado,
      estado_pago: cliente.estado_pago,
      estado_cuota: cliente.estado_cuota,
      estado_texto: cliente.estado_texto,
      dias_retraso: diasRetraso,
      fecha_ultimo_pago: cliente.fecha_ultimo_pago,
      fecha_vencimiento: cliente.fecha_vencimiento,
      fecha_vencimiento_formatted: cliente.fecha_vencimiento_formatted,
      carnet_url: cliente.carnet_url,
      whatsapp_link: cliente.whatsapp_link,
      avatar: cliente.avatar || 'https://ionicframework.com/docs/img/demos/avatar.svg'
    };
  });
  
  console.log('✅ Clientes procesados:', this.clientes);
}
  calcularEstadisticas() {
  this.totalClientes = this.clientes.length;
  this.alDiaCount = this.clientes.filter(c => c.estado === 'al-dia').length;
  this.retrasoLeveCount = this.clientes.filter(c => c.estado === 'retraso-leve').length;
  this.retrasoSeveroCount = this.clientes.filter(c => c.estado === 'retraso-severo').length;
  this.totalMensual = this.clientes.reduce((sum, cliente) => {
    // Si no tienes mensualidad en la API, usa un valor por defecto
    return sum + (cliente.mensualidad || 0);
  }, 0);
  
  console.log('📊 Estadísticas:', {
    total: this.totalClientes,
    alDia: this.alDiaCount,
    retrasoLeve: this.retrasoLeveCount,
    retrasoSevero: this.retrasoSeveroCount,
    totalMensual: this.totalMensual
  });
}

  aplicarFiltros() {
    let filtered = [...this.clientes];
    
    // Filtrar por búsqueda
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(cliente =>
        cliente.nombre_completo.toLowerCase().includes(term) ||
        cliente.telefono.includes(term)
      );
    }
    
    // Filtrar por estado
    if (this.filtroEstado !== 'todos') {
      filtered = filtered.filter(cliente => cliente.estado_pago === this.filtroEstado);
    }
    
    this.filteredClientes = filtered;
  }

  onSearch(event: any) {
    this.searchTerm = event.target.value || '';
    this.aplicarFiltros();
  }

  onEstadoChange(event: any) {
    this.filtroEstado = event.detail.value;
    this.aplicarFiltros();
  }

  getColorEstado(estado: string): string {
    switch(estado) {
      case 'al-dia': return 'success';
      case 'retraso-leve': return 'warning';
      case 'retraso-severo': return 'danger';
      default: return 'medium';
    }
  }

  getTextoEstado(estado: string): string {
    switch(estado) {
      case 'al-dia': return 'Al Día';
      case 'retraso-leve': return 'Retraso Leve';
      case 'retraso-severo': return 'Retraso Severo';
      default: return estado;
    }
  }

  getIconoEstado(estado: string): string {
    switch(estado) {
      case 'al-dia': return 'checkmark-circle';
      case 'retraso-leve': return 'warning';
      case 'retraso-severo': return 'alert-circle';
      default: return 'help-circle';
    }
  }

 async abrirWhatsApp(cliente: any) {
  console.log('📱 Intentando abrir WhatsApp para:', cliente.nombre_completo);
  console.log('📞 Teléfono del cliente:', cliente.telefono);
  
  // Verificar si el cliente tiene teléfono
  if (!cliente.telefono) {
    await this.mostrarAlerta(
      'Sin teléfono', 
      `${cliente.nombre_completo || 'Este cliente'} no tiene número de teléfono registrado.`
    );
    return;
  }
  
  // Limpiar y formatear el número
  const numeroWhatsApp = this.formatearNumeroWhatsApp(cliente.telefono);
  
  if (!numeroWhatsApp) {
    await this.mostrarAlerta(
      'Número inválido', 
      `El número ${cliente.telefono} no es válido para WhatsApp.`
    );
    return;
  }
  
  console.log('✅ Número formateado:', numeroWhatsApp);
  
  // Crear mensaje personalizado
  const nombre = cliente.nombre || cliente.nombre_completo || 'Cliente';
  const mensaje = `Hola ${nombre}, te contacto desde el gimnasio. ¡Buen día!`;
  const mensajeCodificado = encodeURIComponent(mensaje);
  
  // Construir URL de WhatsApp
  const urlWhatsApp = `https://wa.me/${numeroWhatsApp}?text=${mensajeCodificado}`;
  
  console.log('🔗 URL WhatsApp:', urlWhatsApp);
  
  // Abrir WhatsApp en nueva pestaña
  window.open(urlWhatsApp, '_blank', 'noopener,noreferrer');
}

// Función para formatear número para WhatsApp
formatearNumeroWhatsApp(telefono: string): string {
  if (!telefono) return '';
  
  // Convertir a string si no lo es
  const telefonoStr = telefono.toString();
  
  // Remover todo excepto números
  let numeroLimpio = telefonoStr.replace(/\D/g, '');
  
  // Verificar que tenga al menos 8 dígitos (número local mínimo)
  if (numeroLimpio.length < 8) {
    console.error('Número muy corto:', numeroLimpio);
    return '';
  }
  
  // PARA ARGENTINA 🇦🇷:
  // Formato esperado: 549XXXXXXXXX (54 código país, 9 dígitos del número)
  
  // Si empieza con 0 (ej: 01112345678)
  if (numeroLimpio.startsWith('0')) {
    numeroLimpio = '54' + numeroLimpio.substring(1);
  }
  
  // Si tiene 10 dígitos y no empieza con 54 (ej: 1134567890)
  else if (numeroLimpio.length === 10 && !numeroLimpio.startsWith('54')) {
    // Ej: 1134567890 -> 5491134567890
    numeroLimpio = '549' + numeroLimpio;
  }
  
  // Si tiene 9 dígitos (ej: 934567890)
  else if (numeroLimpio.length === 9) {
    numeroLimpio = '549' + numeroLimpio;
  }
  
  // Si ya empieza con 54 pero le falta el 9 (ej: 54112345678)
  else if (numeroLimpio.startsWith('54') && numeroLimpio.length === 11) {
    // 54112345678 -> 549112345678
    numeroLimpio = '549' + numeroLimpio.substring(2);
  }
  
  console.log('🔄 Número formateado:', numeroLimpio, 'de', telefono);
  return numeroLimpio;
}


 
  // ✅ FUNCIÓN SIMPLE: Registrar pago sin modal
  async registrarPago(cliente: any) {
    const alert = await this.alertController.create({
      header: 'Registrar Pago',
      message: `¿Registrar pago para ${cliente.nombre_completo}?`,
      buttons: [
        { 
          text: 'Cancelar', 
          role: 'cancel' 
        },
        { 
          text: 'Registrar Pago', 
          handler: () => this.confirmarPago(cliente)
        }
      ]
    });
    
    await alert.present();
  }

  // ✅ FUNCIÓN PARA CONFIRMAR Y ENVIAR PAGO
  async confirmarPago(cliente: any) {
    const loading = await this.loadingController.create({
      message: 'Registrando pago...'
    });
    
    try {
      await loading.present();
      
      // Datos fijos: mes actual, $24,000, efectivo
      const data = {
        cliente_id: cliente.id,
        mes: new Date().getMonth() + 1,
        año: new Date().getFullYear(),
        monto: 24000,
        metodo: 'efectivo'
      };
      
      const response: any = await this.http.post('/api/pagos/cliente', data).toPromise();
      
      if (response.success) {
        await loading.dismiss();
        
        // Preguntar si quiere abrir WhatsApp
        const successAlert = await this.alertController.create({
          header: '✅ Pago Registrado',
          message: `Pago registrado para ${cliente.nombre_completo}`,
          buttons: [
            { 
              text: 'Enviar WhatsApp', 
              handler: () => {
                if (response.data.whatsapp_link) {
                  window.open(response.data.whatsapp_link, '_blank');
                }
                // Recargar la lista después
                this.cargarClientes();
              }
            },
            { 
              text: 'OK', 
              handler: () => {
                // Recargar la lista
                this.cargarClientes();
              }
            }
          ]
        });
        
        await successAlert.present();
      }
    } catch (error: any) {
      await loading.dismiss();
      console.error('Error registrando pago:', error);
      this.mostrarAlerta('Error', 'No se pudo registrar el pago');
    }
  }

  verCarnet(cliente: any) {
    if (cliente.carnet_url) {
      const url = `http://localhost:3000${cliente.carnet_url}`;
      window.open(url, '_blank');
    } else {
      this.mostrarAlerta('Sin Carnet', 'Este cliente no tiene carnet generado');
    }
  }

  async verDetalles(cliente: any) {
    const alert = await this.alertController.create({
      header: cliente.nombre_completo,
      message: `
        <p><strong>Teléfono:</strong> ${cliente.telefono || 'No registrado'}</p>
        <p><strong>Estado:</strong> ${this.getTextoEstado(cliente.estado_pago)}</p>
        <p><strong>Días de retraso:</strong> ${cliente.dias_retraso}</p>
        <p><strong>Fecha vencimiento:</strong> ${cliente.fecha_vencimiento_formatted}</p>
        <p><strong>Último pago:</strong> ${cliente.estado_ultimo_pago}</p>
      `,
      buttons: [
        { text: 'Cerrar', role: 'cancel' },
        { 
          text: 'Ver Carnet', 
          handler: () => this.verCarnet(cliente)
        },
        { 
          text: 'Registrar Pago', 
          handler: () => this.registrarPago(cliente)
        }
      ]
    });
    
    await alert.present();
  }

  async refrescar() {
    await this.cargarClientes();
  }

  async mostrarAlerta(titulo: string, mensaje: string) {
    const alert = await this.alertController.create({
      header: titulo,
      message: mensaje,
      buttons: ['OK']
    });
    
    await alert.present();
  }
}