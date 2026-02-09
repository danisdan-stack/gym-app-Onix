import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';


import {
  IonContent,
  IonHeader,
  IonTitle,
  IonToolbar,
  IonButton,
  IonItem,
  IonLabel,
  IonInput,
  IonList,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent
} from '@ionic/angular/standalone';

import { AlertController, ToastController } from '@ionic/angular';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
  imports: [
    CommonModule,
    FormsModule,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonButton,
    IonItem,
    IonLabel,
    IonInput,
    IonList,
    IonSelect,
    IonSelectOption,
    IonSpinner
  ]
})
export class DashboardPage implements OnInit {
  private apiUrl = environment.apiUrl;

  // =========================
  // Datos del dashboard
  // =========================
  ingresosMensuales: any[] = [];
  clientes: any[] = [];
  cargando = false;
  filtroCliente = '';

  // =========================
  // Formulario crear cliente
  // =========================
  nuevoCliente = {
    nombre: '',
    apellido: '',
    telefono: '',
    monto: 0
  };

  // =========================
  // Formulario registrar pago
  // =========================
  pagoCliente = {
    clienteId: null as number | null,
    monto: 0
  };

 
  whatsappService: any;

  constructor(
    private http: HttpClient,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,
   
  ) {}

  ngOnInit() {
    this.cargarIngresos();
    this.cargarClientes();
  }

  // =========================
  // Cargar ingresos mensuales
  // =========================
  cargarIngresos() {
    this.cargando = true;
    this.http.get<any>(`${this.apiUrl}/dashboard/ingresos`)
      .subscribe({
        next: res => {
          this.ingresosMensuales = res.ingresos || [];
          this.cargando = false;
        },
        error: err => {
          console.error(err);
          this.cargando = false;
        }
      });
  }

  // =========================
  // Crear cliente + primer pago
  // =========================
  async crearCliente() {
  const { nombre, apellido, telefono, monto } = this.nuevoCliente;

  if (!nombre || !apellido || !telefono || !monto) {
    await this.mostrarAlerta('Error', 'Debe completar todos los campos');
    return;
  }

  const ahora = new Date();

  const payload = {
    usuario: {
      username: `${nombre}${apellido}`.toLowerCase(),
      email: `${telefono}@noemail.com`,
      password: '1234'
    },
    cliente: {
      nombre,
      apellido,
      telefono
    },
    pago: {
      monto,
      mes: ahora.getMonth() + 1,
      ano: ahora.getFullYear(),
      metodo: 'efectivo'
    }
  };

  this.http.post(`${this.apiUrl}/clientes/alta`, payload)
    .subscribe({
      next: async () => {
        await this.mostrarToast('Cliente creado y carnet generado', 'success');
        this.nuevoCliente = { nombre: '', apellido: '', telefono: '', monto: 0 };
        this.cargarClientes();
        this.cargarIngresos();
      },
      error: async err => {
        await this.mostrarAlerta(
          'Error',
          err.error?.error || err.error?.message || 'No se pudo crear cliente'
        );
      }
    });
}


  // =========================
  // Registrar pago
  // =========================
  async registrarPago() {
    if (!this.pagoCliente.clienteId || !this.pagoCliente.monto) {
      await this.mostrarAlerta('Error', 'Debe seleccionar cliente y monto');
      return;
    }

    this.http.post(`${this.apiUrl}/pagos`, this.pagoCliente)
      .subscribe({
        next: async () => {
          await this.mostrarToast('Pago registrado', 'success');
          this.pagoCliente = { clienteId: null, monto: 0 };
          this.cargarClientes();
          this.cargarIngresos();
        },
        error: async err => {
          await this.mostrarAlerta(
            'Error',
            err.error?.message || 'No se pudo registrar pago'
          );
        }
      });
  }

  // =========================
  // Clientes
  // =========================
  cargarClientes() {
    this.http.get<any>(`${this.apiUrl}/clientes/con-carnet`)
      .subscribe({
        next: res => {
          this.clientes = (res.data || []).sort((a: any, b: any) => b.id - a.id);
        },
        error: err => console.error(err)
      });
  }

  clientesFiltrados() {
    if (!this.filtroCliente) return this.clientes;

    const filtro = this.filtroCliente.toLowerCase();
    return this.clientes.filter((c: any) =>
      c.nombre.toLowerCase().includes(filtro) ||
      c.apellido.toLowerCase().includes(filtro)
    );
  }

  // =========================
  // Helpers UI
  // =========================
  private async mostrarAlerta(header: string, message: string) {
    const alert = await this.alertCtrl.create({
      header,
      message,
      buttons: ['OK']
    });
    await alert.present();
  }

  private async mostrarToast(message: string, color: 'success' | 'danger') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2000,
      color
    });
    await toast.present();
  }

 enviarWhatsApp(cliente: any) {
  const ahora = new Date();

  this.http.post(`${this.apiUrl}/wpp/enviar`, {
    telefono: cliente.telefono,
    nombre: cliente.nombre,
    apellido: cliente.apellido,
    mes: ahora.getMonth() + 1,
    ano: ahora.getFullYear(),
    carnetUrl: cliente.carnet_url
  }).subscribe({
    next: (res: any) => {
      window.open(res.url, '_blank');
    },
    error: async (err) => {
      await this.mostrarAlerta(
        'WhatsApp',
        err.error?.message || 'No se pudo generar el WhatsApp'
      );
    }
  });
}

}
