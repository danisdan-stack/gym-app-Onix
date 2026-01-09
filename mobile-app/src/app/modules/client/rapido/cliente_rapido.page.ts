import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonHeader, IonToolbar, IonTitle, IonContent, 
  IonItem, IonLabel, IonInput, IonButton, 
  IonIcon, IonCard, IonCardHeader, 
  IonCardTitle, IonCardContent, IonToast, 
  IonSpinner, IonBackButton, IonButtons,
  IonChip, IonText
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { checkmarkCircle, arrowBack, cash, card } from 'ionicons/icons';
import { Router } from '@angular/router';

@Component({
  selector: 'app-cliente-rapido',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent,
    IonItem, IonLabel, IonInput, IonButton,
    IonIcon, IonCard, IonCardHeader,
    IonCardTitle, IonCardContent, IonToast,
    IonSpinner, IonBackButton, IonButtons,
    IonChip, IonText
  ],
  templateUrl: './cliente_rapido.page.html',  // Tu template HTML
  styleUrls: ['./cliente_rapido.page.scss']   // Tus estilos CSS
})
export class ClienteRapidoPage {
  cliente = {
    nombre: '',
    apellido: '',
    celular: ''
  };

  loading = false;
  showToast = false;
  toastMessage = '';
  toastColor = 'success';
  
  clienteCreado: any = null;

  constructor(private router: Router) {
    addIcons({ checkmarkCircle, arrowBack, cash, card });
  }

  async crearCliente() {
    // Validaciones...
    if (!this.cliente.nombre.trim()) {
      this.mostrarToast('Ingresa el nombre', 'warning');
      return;
    }
    
    // ... más validaciones
    
    this.loading = true;

    try {
      
      const response = await fetch('http://localhost:3000/api/clientes/rapido', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nombre: this.cliente.nombre,
          apellido: this.cliente.apellido,
          celular: this.cliente.celular
        })
      });

      const data = await response.json();

      if (data.success) {
        this.clienteCreado = data.data;
        this.mostrarToast(`✅ Cliente creado • Pago: $24,000`, 'success');
        
        // Redirigir a lista de clientes
        setTimeout(() => {
          this.router.navigate(['/admin/members'], {
            state: { 
              nuevoCliente: true,
              datosCliente: this.clienteCreado
            }
          });
        }, 1500);
      } else {
        this.mostrarToast(`❌ ${data.message}`, 'danger');
      }
    } catch (error: any) {
      console.error('Error:', error);
      this.mostrarToast('❌ Error de conexión', 'danger');
    } finally {
      this.loading = false;
    }
  }

  mostrarToast(mensaje: string, color: string = 'success') {
    this.toastMessage = mensaje;
    this.toastColor = color;
    this.showToast = true;
  }
}