import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { RouterModule } from "@angular/router";
import { LoadingController } from '@ionic/angular/standalone'; 
import { 
  IonContent, 
  IonHeader, 
  IonTitle, 
  IonToolbar,
  IonCard, 
  IonCardContent, 
  IonCardHeader, 
  IonCardTitle,
  IonCardSubtitle,
  IonIcon,
  IonButton,
  IonList,
  IonItem,
  IonLabel,
  IonBadge,
  IonGrid,
  IonRow,
  IonCol,
  IonMenuButton,
  IonButtons,
  IonSpinner,
  IonAvatar,
  IonNote,
  IonListHeader,
  IonFab,
  IonFabButton,
  IonFabList,
  AlertController,
  ActionSheetController,
  ModalController,
  ToastController
} from "@ionic/angular/standalone";
import { Router } from "@angular/router";
import { addIcons } from "ionicons";
import { 
  people, cash, calendar, idCard,
  statsChart, settings, refresh,
  personAdd, addCircle, documentText,
  arrowForward, barbell, time,
  checkmarkCircle, timeOutline, alertCircle,
  helpCircle, checkmark, mail, create,
  flash, card, wallet, swapHorizontal,
  notifications, add, trendingUp, pieChart,
  timer, card as cardIcon, statsChart as statsIcon,
  create as createIcon,
  star, close, cashOutline,
  trash, download, eye, print,
  calendarOutline, cardOutline,
  walletOutline, receipt
} from "ionicons/icons";
import { Cliente } from "../../../core/models/cliente.model";
import { Pago } from "../../../core/models/pago.model";
import { DashboardService } from "../../../core/services/dashboard.service";
import { catchError, finalize } from "rxjs/operators";
import { of } from "rxjs";

@Component({
  selector: "app-dashboard",
  templateUrl: "./dashboard.page.html",
  styleUrls: ["./dashboard.page.scss"],
  standalone: true,
  imports: [
     CommonModule, 
    FormsModule,
    RouterModule,
    IonContent, 
    IonHeader, 
    IonTitle, 
    IonToolbar,
    IonCard, 
    IonCardContent, 
    IonCardHeader, 
    IonCardTitle,
    IonCardSubtitle,
    IonIcon,
    IonButton,
    IonList,
    IonItem,
    IonLabel,
    IonBadge,
    IonGrid,
    IonRow,
    IonCol,
    IonMenuButton,
    IonButtons,
    IonSpinner,
    IonAvatar,
    IonNote,
    IonListHeader,
    IonFab,
    IonFabButton,
    IonFabList
  ]
})
export class DashboardPage implements OnInit {
  // Estadísticas inicializadas en ceros
  stats = {
    totalClientes: 0,
    clientesActivos: 0,
    ingresosMensuales: 0,
    asistenciaHoy: 0,
    carnetsActivos: 0,
    pagosPendientes: 0,
    tasaRetencion: 0,
    ingresosVsMeta: 0,
    clientesInactivos: 0,
    clientesSuspendidos: 0,
    clientesVencidos: 0,
    ingresosTotales: 0,
    pagosPagados: 0,
    pagosVencidos: 0,
    pendienteTotal: 0
  };
  
  recentClients: Cliente[] = [];
  pendingPayments: Pago[] = [];
  loading = true;
  selectedPeriod: string = 'month';
  selectedView: string = 'overview';
  quickStats: any[] = [];
  errorMessage: string = '';
  lastUpdated: Date = new Date();

  constructor(
    private router: Router,
    private alertController: AlertController,
    private actionSheetController: ActionSheetController,
    private modalController: ModalController,
    private toastController: ToastController,
    private dashboardService: DashboardService,
    private loadingController: LoadingController, 
  ) {
    addIcons({ 
      people, cash, calendar, idCard,
      statsChart, settings, refresh,
      personAdd, addCircle, documentText,
      arrowForward, barbell, time,
      checkmarkCircle, timeOutline, alertCircle,
      helpCircle, checkmark, mail, create,
      flash, card, wallet, swapHorizontal,
      notifications, add, trendingUp, pieChart,
      timer, cardIcon, statsIcon, createIcon,
      star, close, cashOutline,
      trash, download, eye, print,
      calendarOutline, cardOutline,
      walletOutline, receipt
    });
  }

goToRapido(){  
  this.router.navigate(['/rapido']);
}
  ngOnInit() {
    this.loadDashboardData();
    this.initQuickStats();
  }
   

  initQuickStats() {
    // Quick stats inicializadas en ceros
    this.quickStats = [
      { icon: 'trending-up', label: 'Activos', value: '0%', color: 'medium', change: 'neutral' },
      { icon: 'people', label: 'Total', value: '0', color: 'medium', change: 'neutral' },
      { icon: 'alert-circle', label: 'Inactivos', value: '0', color: 'medium', change: 'neutral' },
      { icon: 'calendar', label: 'Vencidos', value: '0', color: 'medium', change: 'neutral' }
    ];
  }

  loadDashboardData() {
    this.loading = true;
    this.errorMessage = '';
    
    // IMPORTANTE: Usa getDashboardStats() que es el endpoint que SÍ existe
    this.dashboardService.getDashboardStats()
      .pipe(
        catchError(error => {
          console.error('Error al cargar datos del dashboard:', error);
          this.errorMessage = 'No se pudieron cargar los datos del servidor';
          this.showError('Error de conexión con el servidor');
          
          // En caso de error, mostramos ceros (NO datos mock)
          this.setEmptyData();
          
          return of(this.getEmptyBackendData());
        }),
        finalize(() => {
          this.loading = false;
          this.lastUpdated = new Date();
        })
      )
      .subscribe(data => {
        if (data) {
          this.processRealData(data);
        } else {
          // Si no hay datos, mostramos estado vacío
          this.setEmptyData();
        }
      });
  }

  // Helper para datos vacíos del backend
  getEmptyBackendData() {
    return {
      total_clientes: 0,
      clientes_activos: 0,
      clientes_inactivos: 0,
      clientes_suspendidos: 0,
      clientes_vencidos: 0
    };
  }

  // Configurar datos vacíos
  setEmptyData() {
    this.stats = {
      totalClientes: 0,
      clientesActivos: 0,
      clientesInactivos: 0,
      clientesSuspendidos: 0,
      clientesVencidos: 0,
      ingresosMensuales: 0,
      asistenciaHoy: 0,
      carnetsActivos: 0,
      pagosPendientes: 0,
      tasaRetencion: 0,
      ingresosVsMeta: 0,
      ingresosTotales: 0,
      pagosPagados: 0,
      pagosVencidos: 0,
      pendienteTotal: 0
    };
    
    this.recentClients = [];
    this.pendingPayments = [];
    
    this.quickStats = [
      { icon: 'trending-up', label: 'Activos', value: '0%', color: 'medium', change: 'neutral' },
      { icon: 'people', label: 'Total', value: '0', color: 'medium', change: 'neutral' },
      { icon: 'alert-circle', label: 'Inactivos', value: '0', color: 'medium', change: 'neutral' },
      { icon: 'calendar', label: 'Vencidos', value: '0', color: 'medium', change: 'neutral' }
    ];
  }

  processRealData(data: any) {
    console.log('📊 Datos REALES del backend:', data);
    
    // IMPORTANTE: Tu backend devuelve los datos DIRECTAMENTE, no dentro de "estadisticas"
    // Ejemplo: { total_clientes: 17, clientes_activos: 0, ... }
    
    this.stats = {
      totalClientes: data.total_clientes || 0,
      clientesActivos: data.clientes_activos || 0,
      clientesInactivos: data.clientes_inactivos || 0,
      clientesSuspendidos: data.clientes_suspendidos || 0,
      clientesVencidos: data.clientes_vencidos || 0,
      
      // Estos campos se implementarán después
      ingresosMensuales: 0,
      asistenciaHoy: 0,
      carnetsActivos: 0,
      pagosPendientes: 0,
      ingresosTotales: 0,
      pagosPagados: 0,
      pagosVencidos: 0,
      pendienteTotal: 0,
      
      // Cálculos reales
      tasaRetencion: data.total_clientes > 0 ? 
        Math.round((data.clientes_activos / data.total_clientes) * 100) : 0,
      ingresosVsMeta: 0
    };

    // Por ahora, arrays vacíos hasta que agregues los endpoints
    this.recentClients = [];
    this.pendingPayments = [];

    this.updateQuickStats(data);
  }

  updateQuickStats(data: any) {
    const tasaActivos = data.total_clientes > 0 ? 
      Math.round((data.clientes_activos / data.total_clientes) * 100) : 0;
    
    this.quickStats = [
      { 
        icon: 'trending-up', 
        label: 'Activos', 
        value: `${tasaActivos}%`, 
        color: data.clientes_activos > 0 ? 'success' : 'medium', 
        change: data.clientes_activos > 0 ? 'positive' : 'neutral' 
      },
      { 
        icon: 'people', 
        label: 'Total', 
        value: data.total_clientes?.toString() || '0', 
        color: 'primary', 
        change: 'neutral' 
      },
      { 
        icon: 'alert-circle', 
        label: 'Inactivos', 
        value: data.clientes_inactivos?.toString() || '0', 
        color: data.clientes_inactivos > 0 ? 'warning' : 'medium', 
        change: 'neutral' 
      },
      { 
        icon: 'calendar', 
        label: 'Vencidos', 
        value: data.clientes_vencidos?.toString() || '0', 
        color: data.clientes_vencidos > 0 ? 'danger' : 'medium', 
        change: 'neutral' 
      }
    ];
  }

  // ========== ACCIONES RÁPIDAS ==========
  
  async openNewClientModal() {
    const alert = await this.alertController.create({
      header: 'Nuevo Cliente',
      subHeader: 'Próximamente disponible',
      message: 'Esta funcionalidad estará disponible en la próxima actualización.',
      buttons: ['OK']
    });
    await alert.present();
  }

  async openRegisterPaymentModal() {
  // Navega a la página de control de pagos
  this.router.navigate(['/pagos']);
}

  async openEditClientModal() {
    const actionSheet = await this.actionSheetController.create({
      header: 'Seleccionar cliente a editar',
      buttons: [
        ...this.recentClients.map(client => ({
          text: `${client.nombre} ${client.apellido}`,
          icon: 'create',
          handler: () => {
            this.openEditClientForm(client);
          }
        })),
        {
          text: 'Cancelar',
          icon: 'close',
          role: 'cancel'
        }
      ]
    });
    
    await actionSheet.present();
  }

  async openEditClientForm(client: Cliente) {
    const alert = await this.alertController.create({
      header: `Editar ${client.nombre} ${client.apellido}`,
      subHeader: 'Próximamente disponible',
      message: 'El formulario de edición estará disponible en la próxima actualización.',
      buttons: ['OK']
    });
    await alert.present();
  }
  

  // ========== FUNCIONALIDADES ADICIONALES ==========
  
  async openQuickActionMenu() {
    const actionSheet = await this.actionSheetController.create({
      header: 'Acciones Rápidas',
      buttons: [
        {
          text: 'Nuevo Cliente',
          icon: 'person-add',
          handler: () => {
            this.openNewClientModal();
          }
        },
        {
          text: 'Registrar Pago',
          icon: 'cash',
          handler: () => {
            this.openRegisterPaymentModal();
          }
        },
        {
          text: 'Editar Cliente',
          icon: 'create',
          handler: () => {
            this.openEditClientModal();
          }
        },
        {
          text: 'Ver Carnets',
          icon: 'id-card',
          handler: () => {
            this.goToCarnets();
          }
        },
        {
          text: 'Generar Reporte',
          icon: 'document-text',
          handler: () => {
            this.generateReport();
          }
        },
        {
          text: 'Cancelar',
          icon: 'close',
          role: 'cancel'
        }
      ]
    });
    
    await actionSheet.present();
  }

  async viewClientDetails(client: Cliente) {
    const alert = await this.alertController.create({
      header: `${client.nombre} ${client.apellido}`,
      message: `
        <div style="text-align: left;">
          <p><strong>Email:</strong> ${client.email || 'No especificado'}</p>
          <p><strong>Teléfono:</strong> ${client.telefono}</p>
          <p><strong>Estado:</strong> ${client.estado_cuota}</p>
          <p><strong>Dirección:</strong> ${client.direccion || 'No especificada'}</p>
          <p><strong>Fecha Inscripción:</strong> ${this.formatDate(client.fecha_inscripcion)}</p>
          <p><strong>Fecha Vencimiento:</strong> ${this.formatDate(client.fecha_vencimiento)}</p>
          ${client.entrenador_id ? `<p><strong>Entrenador ID:</strong> ${client.entrenador_id}</p>` : ''}
        </div>
      `,
      buttons: [
        {
          text: 'Editar',
         
          cssClass: 'alert-button-edit', // Agrega clase CSS,
          handler: () => {
            this.openEditClientForm(client);
          }
        },
        {
          text: 'Ver Pagos',
          cssClass: 'alert-button-payments', // Agrega clase CSS
          handler: () => {
            this.viewClientPayments(client.usuario_id);
          }
        },
        {
          text: 'Cerrar',
           cssClass: 'alert-button-cancel',
          role: 'cancel'
        }
      ]
    });
    
    await alert.present();
  }

  async viewPaymentDetails(payment: Pago) {
    const alert = await this.alertController.create({
      header: `Pago #${payment.id}`,
      subHeader: payment.clienteNombre || 'Cliente',
      message: `
        <div style="text-align: left;">
          <p><strong>Monto:</strong> $${payment.monto.toFixed(2)}</p>
          <p><strong>Fecha Vencimiento:</strong> ${this.formatDate(payment.fecha_vencimiento)}</p>
          <p><strong>Fecha Pago:</strong> ${payment.fecha_pago ? this.formatDate(payment.fecha_pago) : 'Pendiente'}</p>
          <p><strong>Estado:</strong> ${payment.estado}</p>
          <p><strong>Método:</strong> ${payment.metodo}</p>
          <p><strong>Tipo:</strong> ${payment.tipo_pago || 'Normal'}</p>
          ${payment.diasVencido ? `<p><strong>Días Vencido:</strong> ${payment.diasVencido}</p>` : ''}
          ${payment.periodo_mes ? `<p><strong>Período:</strong> ${payment.periodo_mes}/${payment.periodo_ano}</p>` : ''}
          ${payment.referencia ? `<p><strong>Referencia:</strong> ${payment.referencia}</p>` : ''}
          ${payment.observaciones ? `<p><strong>Observaciones:</strong> ${payment.observaciones}</p>` : ''}
        </div>
      `,
      buttons: [
        {
          text: 'Marcar como Pagado',
            cssClass: 'alert-button-success',
          handler: () => {
            this.markAsPaid(payment.id);
          }
        },
        {
          text: 'Enviar Recordatorio',
          cssClass: 'alert-button-warning',
          handler: () => {
            this.sendPaymentReminder(payment.id);
          }
        },
        {
          text: 'Ver Comprobante',
          cssClass: 'alert-button-info',
          handler: () => {
            this.viewPaymentReceipt(payment);
          }
        },
        {
          text: 'Cerrar',
           cssClass: 'alert-button-cancel',
          role: 'cancel'
        }
      ]
    });
    
    await alert.present();
  }

  async markAsPaid(paymentId: number) {
    const alert = await this.alertController.create({
      header: 'Confirmar Pago',
      message: '¿Marcar este pago como pagado? Esta acción no se puede deshacer.',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Confirmar',
          handler: async () => {
            try {
              // Aquí iría la llamada al backend
              console.log('Pago marcado como pagado:', paymentId);
              
              // Mostrar toast de éxito
              const toast = await this.toastController.create({
                message: 'Pago marcado como pagado',
                duration: 2000,
                color: 'success',
                position: 'top'
              });
              await toast.present();
              
              // Actualizar datos
              this.refreshData();
            } catch (error) {
              console.error('Error al marcar pago:', error);
              this.showError('Error al procesar el pago');
            }
          }
        }
      ]
    });
    
    await alert.present();
  }

  async sendPaymentReminder(paymentId: number) {
    const alert = await this.alertController.create({
      header: 'Enviar Recordatorio',
      message: '¿Enviar recordatorio de pago por correo electrónico?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Enviar',
          handler: async () => {
            try {
              // Aquí iría la llamada al backend
              console.log('Recordatorio enviado para pago:', paymentId);
              
              const toast = await this.toastController.create({
                message: 'Recordatorio enviado',
                duration: 2000,
                color: 'success',
                position: 'top'
              });
              await toast.present();
            } catch (error) {
              console.error('Error al enviar recordatorio:', error);
              this.showError('Error al enviar recordatorio');
            }
          }
        }
      ]
    });
    
    await alert.present();
  }

  async viewClientPayments(clientId: number) {
    this.router.navigate(['/admin/payments'], { 
      queryParams: { cliente: clientId } 
    });
  }

  async viewPaymentReceipt(payment: Pago) {
    if (payment.comprobante_url) {
      // Abrir comprobante en nueva ventana
      window.open(payment.comprobante_url, '_blank');
    } else {
      const alert = await this.alertController.create({
        header: 'Sin Comprobante',
        message: 'No hay comprobante disponible para este pago.',
        buttons: ['OK']
      });
      await alert.present();
    }
  }

  async generateReport() {
    const alert = await this.alertController.create({
      header: 'Generar Reporte',
      message: 'Seleccione el tipo de reporte:',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Clientes Activos',
          handler: () => {
            this.downloadReport('clientes-activos');
          }
        },
        {
          text: 'Pagos Pendientes',
          handler: () => {
            this.downloadReport('pagos-pendientes');
          }
        },
        {
          text: 'Ingresos Mensuales',
          handler: () => {
            this.downloadReport('ingresos-mensuales');
          }
        }
      ]
    });
    
    await alert.present();
  }

  async downloadReport(type: string) {
    console.log('Generando reporte:', type);
    
    const toast = await this.toastController.create({
      message: `Generando reporte de ${type}...`,
      duration: 2000,
      color: 'success',
      position: 'top'
    });
    await toast.present();
  }

  async showError(message: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 3000,
      color: 'danger',
      position: 'top'
    });
    await toast.present();
  }

  // ========== MÉTODOS DE UTILIDAD ==========
  
  getStatusColor(status: string): string {
    if (!status) return "medium";
    switch (status.toLowerCase()) {
      case "activo": 
      case "pagado": 
        return "success";
      case "pendiente": 
        return "warning";
      case "vencido": 
      case "anulado":
      case "inactivo": 
      case "suspendido": 
        return "danger";
      default: 
        return "medium";
    }
  }

  getStatusIcon(status: string): string {
    if (!status) return 'help-circle';
    switch(status.toLowerCase()) {
      case 'activo': 
      case 'pagado': 
        return 'checkmark-circle';
      case 'pendiente': 
        return 'time-outline';
      case 'vencido': 
      case 'anulado':
        return 'alert-circle';
      case 'inactivo': 
        return 'close-circle';
      case 'suspendido': 
        return 'pause-circle';
      default: 
        return 'help-circle';
    }
  }

  getPaymentMethodIcon(method: string): string {
    if (!method) return 'wallet';
    switch(method.toLowerCase()) {
      case 'efectivo': return 'cash-outline';
      case 'tarjeta': return 'card-outline';
      case 'transferencia': return 'swap-horizontal';
      case 'otro': return 'wallet-outline';
      default: return 'wallet-outline';
    }
  }

  formatDate(date: string | Date | null | undefined): string {
    if (!date) return 'No especificada';
    
    let dateObj: Date;
    
    if (typeof date === 'string') {
      dateObj = new Date(date);
    } else {
      dateObj = date;
    }
    
    if (isNaN(dateObj.getTime())) {
      return 'Fecha inválida';
    }
    
    return dateObj.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  }

  formatPercentage(value: number): string {
    return `${value}%`;
  }

  calculateDaysBetween(start: Date, end: Date): number {
    const diff = end.getTime() - start.getTime();
    return Math.ceil(diff / (1000 * 3600 * 24));
  }

  changePeriod(period: string) {
    this.selectedPeriod = period;
    this.refreshData();
  }

  changeView(view: string) {
    this.selectedView = view;
  }

  refreshData() {
    this.loading = true;
    setTimeout(() => {
      this.loadDashboardData();
    }, 500);
  }

  // ========== NAVEGACIÓN ==========
  
  goToMembers() {
    this.router.navigate(["/admin/members"]);
  }

  goToPayments() {
    this.router.navigate(["/admin/payments"]);
  }

  goToCarnets() {
    this.router.navigate(["/admin/carnets"]);
  }

  goToReports() {
    this.router.navigate(["/admin/reports"]);
  }

  openSettings() {
    console.log('Abrir configuración');
  }

  // ========== MÉTODOS ADICIONALES ==========
  
  getProgressColor(value: number): string {
    if (value >= 80) return 'success';
    if (value >= 50) return 'warning';
    return 'danger';
  }

  getClientStatusCount(): any {
    return {
      activos: this.stats.clientesActivos,
      inactivos: this.stats.clientesInactivos,
      suspendidos: this.stats.clientesSuspendidos,
      vencidos: this.stats.clientesVencidos
    };
  }

  getPaymentStatusCount(): any {
    return {
      pagados: this.stats.pagosPagados,
      pendientes: this.stats.pagosPendientes,
      vencidos: this.stats.pagosVencidos
    };
  }

  exportData() {
    const data = {
      estadisticas: this.stats,
      clientes: this.recentClients,
      pagos: this.pendingPayments,
      exportado: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dashboard-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }
}