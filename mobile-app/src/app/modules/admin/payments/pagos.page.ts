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

 procesarClientes() {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0); // Normalizar a medianoche

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
    
    // 2. CALCULAR ESTADO BASADO EN FECHA_VENCIMIENTO
    let estadoNormalizado = 'inactivo';
    let diasRetraso = 0;
    let estadoTexto = '';
    
    // Verificar si tiene fecha_vencimiento
    if (cliente.fecha_vencimiento) {
      const fechaVencimiento = new Date(cliente.fecha_vencimiento);
      fechaVencimiento.setHours(0, 0, 0, 0);
      
      if (!isNaN(fechaVencimiento.getTime())) {
        // Calcular días de diferencia
        const diffMs = hoy.getTime() - fechaVencimiento.getTime();
        diasRetraso = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        // Aplicar tu lógica:
        if (diasRetraso <= 0) {
          // Al día (dentro de los 31 días desde pago)
          estadoNormalizado = 'al-dia';
          estadoTexto = 'Al Día';
        } else if (diasRetraso > 0 && diasRetraso <= 15) {
          // Retraso leve (hasta 15 días después de vencimiento)
          estadoNormalizado = 'retraso-leve';
          estadoTexto = `Retraso Leve (${diasRetraso} días)`;
        } else if (diasRetraso > 15) {
          // Retraso severo (más de 15 días después de vencimiento)
          estadoNormalizado = 'retraso-severo';
          estadoTexto = `Retraso Severo (${diasRetraso} días)`;
        }
      }
    }
    
    // Si no tiene fecha_vencimiento, mantener estado del backend o asignar inactivo
    if (!cliente.fecha_vencimiento) {
      const estadoBackend = cliente.estado_pago || cliente.estado_cuota || 'inactivo';
      const estadoLower = estadoBackend.toLowerCase();
      
      if (estadoLower.includes('al-dia') || estadoLower.includes('pagado') || estadoLower.includes('activo')) {
        estadoNormalizado = 'al-dia';
        estadoTexto = 'Al Día';
      } else if (estadoLower.includes('retraso-leve') || estadoLower.includes('leve')) {
        estadoNormalizado = 'retraso-leve';
        estadoTexto = 'Retraso Leve';
      } else if (estadoLower.includes('retraso-severo') || estadoLower.includes('severo') || estadoLower.includes('inactivo')) {
        estadoNormalizado = 'retraso-severo';
        estadoTexto = 'Retraso Severo';
      }
    }
    
    // 3. VALOR POR DEFECTO DE MENSUALIDAD
    const mensualidad = cliente.mensualidad || 24000; // Valor estándar
    
    // 4. TELÉFONO FORMATEADO
    const telefono = cliente.telefono || 'Sin teléfono';
    
    // 5. EXTRAER FECHA DE CREACIÓN
    const fechaCreacion = cliente.fecha_creacion || cliente.created_at || cliente.fecha_registro || cliente.fecha_alta;
    
    // 6. Calcular timestamp para ordenamiento fácil
    const timestampCreacion = fechaCreacion ? new Date(fechaCreacion).getTime() : 0;
    
    // 7. Formatear fecha de vencimiento para mostrar
    let fechaVencimientoFormatted = 'Sin fecha';
    if (cliente.fecha_vencimiento) {
      try {
        const fecha = new Date(cliente.fecha_vencimiento);
        fechaVencimientoFormatted = fecha.toLocaleDateString('es-ES');
      } catch (e) {
        fechaVencimientoFormatted = 'Fecha inválida';
      }
    }
    
    return {
      // Campos originales
      ...cliente,
      
      // Campos procesados
      id: cliente.id || cliente.usuario_id,
      nombre: nombre,
      apellido: apellido,
      nombre_completo: nombreCompleto,
      telefono: telefono,
      email: cliente.email,
      mensualidad: mensualidad,
      estado: estadoNormalizado,
      estado_pago: cliente.estado_pago,
      estado_cuota: cliente.estado_cuota,
      estado_texto: estadoTexto, // ← Nuevo campo con texto descriptivo
      dias_retraso: diasRetraso,
      fecha_ultimo_pago: cliente.fecha_ultimo_pago,
      fecha_vencimiento: cliente.fecha_vencimiento,
      fecha_vencimiento_formatted: fechaVencimientoFormatted, // ← Fecha formateada
      
      // Fechas para ordenamiento
      fecha_creacion: fechaCreacion,
      timestamp_creacion: timestampCreacion,
      
      carnet_url: cliente.carnet_url,
      whatsapp_link: cliente.whatsapp_link,
      avatar: cliente.avatar || 'https://ionicframework.com/docs/img/demos/avatar.svg'
    };
  });
  
  console.log('✅ Clientes procesados con nueva lógica de estados');
}

cargarClientes() {
  this.isLoading = true;
  
  // URL CORRECTA que ya funciona
  const url = 'https://gym-app-n77p.onrender.com/api/clientes';
  
  this.http.get<any>(url).subscribe({
    next: (response) => {
      if (response.success && response.data) {
        // 1. Asignar datos crudos del API
        this.clientes = response.data;
        
        console.log('📥 Datos crudos recibidos:', this.clientes.length, 'clientes');
        
        // 2. Procesar los datos (transformar campos, extraer fechas)
        this.procesarClientes();
        
        // 3. AHORA ordenar DESPUÉS de procesar
        console.log('🔄 Ordenando clientes procesados...');
        
        this.clientes.sort((a, b) => {
          // OPCIÓN 1: Usar timestamp_creacion si existe (más eficiente)
          if (a.timestamp_creacion && b.timestamp_creacion) {
            // Más nuevo primero: b.timestamp - a.timestamp
            return b.timestamp_creacion - a.timestamp_creacion;
          }
          
          // OPCIÓN 2: Usar fecha_creacion (string a Date)
          if (a.fecha_creacion && b.fecha_creacion) {
            const fechaA = new Date(a.fecha_creacion).getTime();
            const fechaB = new Date(b.fecha_creacion).getTime();
            return fechaB - fechaA; // Más nuevo primero
          }
          
          // OPCIÓN 3: Usar campos originales de fecha si no están en fecha_creacion
          const getFechaTimestamp = (cliente: any) => {
            // Buscar en varios campos posibles
            if (cliente.timestamp_creacion) return cliente.timestamp_creacion;
            if (cliente.fecha_creacion) return new Date(cliente.fecha_creacion).getTime();
            if (cliente.created_at) return new Date(cliente.created_at).getTime();
            if (cliente.fecha_registro) return new Date(cliente.fecha_registro).getTime();
            if (cliente.fecha_alta) return new Date(cliente.fecha_alta).getTime();
            return 0;
          };
          
          const timestampA = getFechaTimestamp(a);
          const timestampB = getFechaTimestamp(b);
          
          if (timestampA > 0 && timestampB > 0) {
            return timestampB - timestampA; // Más nuevo primero
          }
          
          // OPCIÓN 4: Último recurso - ordenar por ID (asumiendo auto-increment)
          // IDs más altos = más nuevos
          const idA = Number(a.id) || 0;
          const idB = Number(b.id) || 0;
          
          return idB - idA; // ID más alto primero
        });
        
        // 4. Verificar el orden
        console.log('📋 Primeros 5 clientes (más nuevos primero):');
        this.clientes.slice(0, 5).forEach((cliente, index) => {
          console.log(`${index + 1}. ${cliente.nombre_completo} - ID: ${cliente.id} - Fecha: ${cliente.fecha_creacion || 'Sin fecha'}`);
        });
        
        // 5. Copiar a filteredClientes
        this.filteredClientes = [...this.clientes];
        
        // 6. Calcular estadísticas
        this.calcularEstadisticas();
        
        console.log(`✅ Carga completada: ${this.clientes.length} clientes ordenados`);
      }
      this.isLoading = false;
    },
    error: (error) => {
      console.error('Error:', error);
      this.clientes = [];
      this.filteredClientes = [];
      this.isLoading = false;
    }
  });
}
calcularEstadisticas() {
  this.totalClientes = this.clientes.length;
  this.alDiaCount = this.clientes.filter(c => c.estado === 'al-dia').length;
  this.retrasoLeveCount = this.clientes.filter(c => c.estado === 'retraso-leve').length;
  this.retrasoSeveroCount = this.clientes.filter(c => c.estado === 'retraso-severo').length;
  
  // Calcular ingresos potenciales (solo clientes al día)
  this.totalMensual = this.clientes
    .filter(c => c.estado === 'al-dia')
    .reduce((sum, cliente) => sum + (cliente.mensualidad || 0), 0);
  
  console.log('📊 Estadísticas NUEVA LÓGICA:');
  console.log('- Total clientes:', this.totalClientes);
  console.log('- Al día:', this.alDiaCount);
  console.log('- Retraso leve:', this.retrasoLeveCount);
  console.log('- Retraso severo:', this.retrasoSeveroCount);
  console.log('- Ingresos mensuales (al día):', this.totalMensual);
  
  // Mostrar también en console los días promedio
  const clientesConRetraso = this.clientes.filter(c => c.dias_retraso > 0);
  if (clientesConRetraso.length > 0) {
    const promedioRetraso = clientesConRetraso.reduce((sum, c) => sum + c.dias_retraso, 0) / clientesConRetraso.length;
    console.log('- Promedio días retraso:', promedioRetraso.toFixed(1));
  }
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
  const hoy = new Date();
  const mesActual = hoy.getMonth() + 1;
  const mesNombre = this.getNombreMes(mesActual);
  
  // ============================================
  // ✅ URL DEL CARNET QUE SÍ FUNCIONA
  // ============================================
  
  // Construir URL del carnet QUE SÍ ABRE EL CARNET
  let urlCarnet = '';
  if (cliente.carnet_url) {
    // Si ya tiene carnet_url del backend, usarla
    urlCarnet = `https://gym-app-n77p.onrender.com${cliente.carnet_url}`;
    console.log('🔗 URL del backend:', urlCarnet);
  } else if (cliente.nombre && cliente.apellido) {
    // ✅ CONSTRUIR URL QUE SÍ FUNCIONA (como en MembersPage)
    const año = hoy.getFullYear();
    const mesNumero = hoy.getMonth() + 1;
    
    // Convertir número de mes a nombre en mayúsculas
    const meses = [
      'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
      'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'
    ];
    const mesNombreCarpeta = meses[mesNumero - 1];
    
    // Formatear nombre y apellido para coincidir con el archivo PNG
    // Ejemplo: "Iglesias_Onix.png"
    const nombreLimpio = this.limpiarNombreParaArchivo(cliente.nombre);
    const apellidoLimpio = this.limpiarNombreParaArchivo(cliente.apellido);
    
    // ✅ URL QUE SÍ FUNCIONA
    urlCarnet = `https://gym-app-n77p.onrender.com/storage/carnets/${año}/${mesNombreCarpeta}/${apellidoLimpio}_${nombreLimpio}.png`;
    console.log('🔗 URL generada:', urlCarnet);
  }
  
  // Construir mensaje PASO A PASO
  let mensaje = '';
  
  // 1. Saludo con nombre completo
  if (cliente.nombre && cliente.apellido) {
    mensaje = `Hola ${cliente.nombre} ${cliente.apellido}`;
  } else {
    mensaje = `Hola ${nombre}`;
  }
  
  // 2. Mensaje principal
  mensaje += `, te enviamos el carnet de pago del mes de ${mesNombre}.\n\n`;
  
  // 3. ✅ URL del carnet (con salto de línea claro)
  if (urlCarnet) {
    mensaje += `🎫 Enlace a tu carnet:\n`;
    mensaje += `${urlCarnet}\n\n`;
    mensaje += `Haz clic en el enlace para ver tu carnet\n\n`;
  } else {
    mensaje += `⚠️ Tu carnet se está generando. En breve recibirás el enlace.\n\n`;
  }
  
  // 4. Despedida
  mensaje += `¡Nos vemos en el gimnasio!`;
  
  console.log('📄 Mensaje completo:', mensaje);
  console.log('🔗 URL Carnet final:', urlCarnet);
  
  const mensajeCodificado = encodeURIComponent(mensaje);
  const urlWhatsApp = `https://wa.me/${numeroWhatsApp}?text=${mensajeCodificado}`;
  
  console.log('🔗 URL WhatsApp:', urlWhatsApp);
  
  // Abrir WhatsApp en nueva pestaña
  window.open(urlWhatsApp, '_blank', 'noopener,noreferrer');
}

// ============================================
// MÉTODO PARA LIMPIAR NOMBRES PARA ARCHIVO PNG
// ============================================
limpiarNombreParaArchivo(nombre: string): string {
  if (!nombre) return '';
  
  return nombre
    .trim()
    .normalize('NFD')  // Separar acentos
    .replace(/[\u0300-\u036f]/g, '')  // Eliminar diacríticos
    .replace(/\s+/g, '_')  // Espacios por guiones bajos
    .replace(/[^a-zA-Z0-9_]/g, '')  // Eliminar caracteres especiales
    .replace(/_+/g, '_')  // Múltiples guiones por uno solo
    .replace(/^_|_$/g, '');  // Quitar guiones al inicio/final
}
// Función para formatear número para WhatsApp
formatearNumeroWhatsApp(telefono: string): string {
  if (!telefono) return '';
  
  // 1. Solo números
  let numero = telefono.toString().replace(/\D/g, '');
  
  // 2. Si ya tiene 13 dígitos y empieza con 54, usarlo
  if (numero.length === 13 && numero.startsWith('54')) {
    return numero;
  }
  
  // 3. Si tiene 10 dígitos, asumir que es 11 + número (Buenos Aires)
  if (numero.length === 10) {
    return '54911' + numero;
  }
  
  // 4. Si tiene 11 dígitos y empieza con 9 (ej: 91123456677)
  if (numero.length === 11 && numero.startsWith('9')) {
    return '54' + numero;
  }
  
  // 5. Si tiene 8-9 dígitos, agregar 54911
  if (numero.length >= 8 && numero.length <= 9) {
    return '54911' + numero;
  }
  
  // 6. Si no coincide con nada, devolver vacío
  return '';
}


 
// VERSIÓN CORREGIDA - SIN HTML EN EL MESSAGE
async confirmarPago(cliente: any) {
  const loading = await this.loadingController.create({
    message: 'Registrando pago...'
  });
  
  try {
    await loading.present();
    
    const clienteId = cliente.id || cliente.usuario_id;
    const hoy = new Date();
    const mesActual = hoy.getMonth() + 1;
    const añoActual = hoy.getFullYear();
    const mesNombre = this.getNombreMes(mesActual);
    
    const pagoData = {
      cliente_id: clienteId,
      mes: mesActual,
      año: añoActual,
      monto: 24000,
      metodo: 'efectivo'
    };
    
    console.log('📤 Enviando pago:', pagoData);
    const url = 'https://gym-app-n77p.onrender.com/api/pagos/cliente';
    const response: any = await lastValueFrom(this.http.post(url, pagoData));
    
    await loading.dismiss();
    
    if (response.success) {
      console.log('✅ Pago registrado:', response.data);
      
      // ✅ ALERTA CON TEXTO PLANO - SIN HTML
      const successAlert = await this.alertController.create({
        header: '✅ PAGO REGISTRADO',
        subHeader: 'Comprobante generado exitosamente',
        message: `
Cliente: ${cliente.nombre_completo}
Monto: $${pagoData.monto.toLocaleString()}
Período: ${mesNombre} ${añoActual}
Método: ${pagoData.metodo.toUpperCase()}

✅ Carnet generado y listo para enviar
ID Transacción: ${response.data.pago?.id || 'N/A'}
        `,
        cssClass: 'pago-exitoso-alert',
        buttons: [
          {
            text: '📱 WhatsApp',
            cssClass: 'whatsapp-button',
            handler: () => {
              this.enviarComprobanteWhatsApp(cliente, response.data);
              this.cargarClientes();
            }
          },
          {
            text: '📄 Ver Carnet',
            cssClass: 'carnet-button',
            handler: () => {
              if (response.data.carnet?.url) {
                const carnetUrl = `https://gym-app-n77p.onrender.com${response.data.carnet.url}`;
                window.open(carnetUrl, '_blank');
              }
              this.cargarClientes();
            }
          },
          {
            text: '✅ Listo',
            cssClass: 'listo-button',
            role: 'cancel',
            handler: () => {
              this.cargarClientes();
            }
          }
        ]
      });
      
      await successAlert.present();
      
      setTimeout(() => {
        this.cargarClientes();
      }, 1000);
      
    } else {
      await this.mostrarAlertaSimple('Error', response.message || 'No se pudo registrar el pago');
    }
    
  } catch (error: any) {
    await loading.dismiss();
    console.error('❌ Error:', error);
    
    // Manejo de error de duplicado
    if (error.error?.error?.includes('duplicada')) {
      await this.mostrarAlertaClienteAlDiaSimple(cliente);
    } else {
      await this.mostrarAlertaSimple('Error', 'No se pudo registrar el pago');
    }
  }
}

// ✅ ALERTA SIMPLE PARA ERRORES
async mostrarAlertaSimple(titulo: string, mensaje: string) {
  const alert = await this.alertController.create({
    header: titulo,
    message: mensaje,
    buttons: ['OK']
  });
  
  await alert.present();
}

// ✅ ALERTA SIMPLE PARA CLIENTE AL DÍA
async mostrarAlertaClienteAlDiaSimple(cliente: any) {
  const hoy = new Date();
  const mesNombre = this.getNombreMes(hoy.getMonth() + 1);
  const añoActual = hoy.getFullYear();
  
  const alert = await this.alertController.create({
    header: '✅ CLIENTE AL DÍA',
    message: `
${cliente.nombre_completo}

Ya tiene registrado el pago para:
${mesNombre} ${añoActual}

El sistema protege al cliente evitando cobros duplicados.

Estado: ${cliente.estado_texto || 'Al Día'}
Último pago: ${cliente.fecha_ultimo_pago || 'Reciente'}
    `,
    buttons: [
     
      {
        text: 'Cerrar',
        role: 'cancel'
      }
    ]
  });
  
  await alert.present();
}

// ✅ MÉTODO MEJORADO PARA ALERTA DE ÉXITO
async mostrarAlertaExito(cliente: any, pagoData: any, responseData: any) {
  const alert = await this.alertController.create({
    header: '🎉 PAGO EXITOSO',
    subHeader: 'Comprobante generado',
    message: `
      <div class="alert-success-container">
        <div class="alert-header-success">
          <ion-icon name="checkmark-circle" class="success-icon"></ion-icon>
          <h3>¡PAGO REGISTRADO!</h3>
        </div>
        
        <div class="alert-info-card">
          <div class="info-row">
            <ion-icon name="person-outline" class="info-icon"></ion-icon>
            <div class="info-content">
              <span class="info-label">Cliente</span>
              <span class="info-value">${cliente.nombre_completo}</span>
            </div>
          </div>
          
          <div class="info-row">
            <ion-icon name="calendar-outline" class="info-icon"></ion-icon>
            <div class="info-content">
              <span class="info-label">Período</span>
              <span class="info-value">${this.getNombreMes(pagoData.mes)} ${pagoData.año}</span>
            </div>
          </div>
          
          <div class="info-row">
            <ion-icon name="cash-outline" class="info-icon"></ion-icon>
            <div class="info-content">
              <span class="info-label">Monto</span>
              <span class="info-value success-amount">$${pagoData.monto.toLocaleString()}</span>
            </div>
          </div>
          
          <div class="info-row">
            <ion-icon name="card-outline" class="info-icon"></ion-icon>
            <div class="info-content">
              <span class="info-label">Método</span>
              <span class="info-value">${pagoData.metodo.toUpperCase()}</span>
            </div>
          </div>
        </div>
        
        <div class="alert-status-success">
          <ion-icon name="document-text-outline" class="status-icon"></ion-icon>
          <span>Carnet generado y listo para enviar</span>
        </div>
        
        <div class="alert-footer">
          <ion-icon name="information-circle-outline"></ion-icon>
          <small>ID Transacción: ${responseData.pago?.id || 'N/A'}</small>
        </div>
      </div>
    `,
    cssClass: 'pago-exitoso-alert',
    buttons: [
      {
        text: '📱 WhatsApp',
        cssClass: 'whatsapp-button',
        handler: () => {
          this.enviarComprobanteWhatsApp(cliente, responseData);
          this.cargarClientes();
        }
      },
      {
        text: '📄 Ver Carnet',
        cssClass: 'carnet-button',
        handler: () => {
          if (responseData.carnet?.url) {
            const carnetUrl = `https://gym-app-n77p.onrender.com${responseData.carnet.url}`;
            window.open(carnetUrl, '_blank');
          }
          this.cargarClientes();
        }
      },
      {
        text: '✅ Listo',
        cssClass: 'listo-button',
        role: 'cancel',
        handler: () => {
          this.cargarClientes();
        }
      }
    ]
  });
  
  await alert.present();
}

// ✅ MÉTODO MEJORADO PARA CLIENTE AL DÍA (DUPLICADO)
async mostrarAlertaClienteAlDia(cliente: any) {
  const hoy = new Date();
  const mesNombre = this.getNombreMes(hoy.getMonth() + 1);
  const añoActual = hoy.getFullYear();
  
  const alert = await this.alertController.create({
    header: '✅ CLIENTE AL DÍA',
    subHeader: 'Pago ya registrado',
    message: `
      <div class="alert-success-container">
        <div class="alert-header-al-dia">
          <ion-icon name="shield-checkmark" class="al-dia-icon"></ion-icon>
          <h3>¡CLIENTE AL CORRIENTE!</h3>
        </div>
        
        <div class="alert-info-card">
          <div class="info-row-center">
            <ion-icon name="checkmark-done" class="info-icon-success"></ion-icon>
            <div class="info-content-center">
              <span><strong>${cliente.nombre_completo}</strong></span>
              <span class="info-subtitle">Ya tiene pago registrado para</span>
              <span class="info-period">${mesNombre} ${añoActual}</span>
            </div>
          </div>
          
          <div class="alert-info-box">
            <ion-icon name="information-circle" class="info-box-icon"></ion-icon>
            <small>El sistema protege al cliente evitando cobros duplicados</small>
          </div>
        </div>
        
        <div class="alert-tags">
          <div class="info-tag">
            <ion-icon name="calendar-outline"></ion-icon>
            <span>${cliente.estado_texto || 'Al Día'}</span>
          </div>
          <div class="info-tag">
            <ion-icon name="time-outline"></ion-icon>
            <span>Último pago: ${cliente.fecha_ultimo_pago || 'Reciente'}</span>
          </div>
        </div>
      </div>
    `,
    cssClass: 'cliente-al-dia-alert',
    buttons: [
      
      {
        text: 'Cerrar',
        role: 'cancel',
        cssClass: 'cerrar-button'
      }
    ]
  });
  
  await alert.present();
}

// ✅ MÉTODO MEJORADO PARA ERROR GENERAL
async mostrarAlertaError(mensaje: string) {
  const alert = await this.alertController.create({
    header: '⚠️ ERROR',
    message: `
      <div class="alert-error-container">
        <div class="alert-header-error">
          <ion-icon name="alert-circle" class="error-icon"></ion-icon>
          <h3>OPERACIÓN FALLIDA</h3>
        </div>
        
        <div class="alert-error-message">
          <ion-icon name="warning-outline" class="warning-icon"></ion-icon>
          <p>${mensaje}</p>
        </div>
        
        <div class="alert-suggestion">
          <small>
            <ion-icon name="bulb-outline"></ion-icon>
            Verifica la conexión e intenta nuevamente
          </small>
        </div>
      </div>
    `,
    cssClass: 'error-alert',
    buttons: ['OK']
  });
  
  await alert.present();
}

// Método auxiliar para obtener nombre del mes
getNombreMes(mesNumero: number): string {
  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  return meses[mesNumero - 1] || '';
}

// Método para enviar comprobante por WhatsApp
async enviarComprobanteWhatsApp(cliente: any, pagoData?: any) {
  console.log('📱 Enviando comprobante por WhatsApp...');
  
  if (!cliente.telefono) {
    await this.mostrarAlerta(
      'Sin teléfono', 
      `${cliente.nombre_completo} no tiene número de teléfono registrado.`
    );
    return;
  }
  
  // Formatear número para WhatsApp
  const numeroWhatsApp = this.formatearNumeroWhatsApp(cliente.telefono);
  
  if (!numeroWhatsApp) {
    await this.mostrarAlerta(
      'Número inválido', 
      `El número ${cliente.telefono} no es válido para WhatsApp.`
    );
    return;
  }
  
  // Crear mensaje personalizado
  const nombre = cliente.nombre || cliente.nombre_completo || 'Cliente';
  const fecha = new Date().toLocaleDateString('es-AR');
  const monto = pagoData.pago?.monto || 24000;
  const mesNombre = this.getNombreMes(pagoData.pago?.mes || new Date().getMonth() + 1);
  const año = pagoData.pago?.año || new Date().getFullYear();
  
  let mensaje = `¡Hola ${nombre}! 👋\n\n`;
  mensaje += `✅ *COMPROBANTE DE PAGO*\n\n`;
  mensaje += `🏋️ *Gimnasio Onix*\n`;
  mensaje += `👤 *Cliente:* ${cliente.nombre_completo}\n`;
  mensaje += `💰 *Monto:* $${monto.toLocaleString()}\n`;
  mensaje += `📅 *Período:* ${mesNombre} ${año}\n`;
  mensaje += `🏷️ *Método:* Efectivo\n`;
  mensaje += `📋 *Estado:* Pagado ✅\n\n`;
  
  // Agregar enlace al carnet si está disponible
  if (pagoData.carnet?.url) {
    const carnetUrl = `https://gym-app-n77p.onrender.com${pagoData.carnet.url}`;
    mensaje += `🎫 *Tu carnet actualizado:*\n`;
    mensaje += `${carnetUrl}\n\n`;
  }
  
  mensaje += `¡Gracias por tu pago puntual! 💪\n`;
  mensaje += `_Mensaje automático - Onix Gym_`;
  
  const mensajeCodificado = encodeURIComponent(mensaje);
  
  // Construir URL de WhatsApp
  const urlWhatsApp = `https://wa.me/${numeroWhatsApp}?text=${mensajeCodificado}`;
  
  console.log('🔗 URL WhatsApp:', urlWhatsApp);
  
  // Abrir WhatsApp en nueva pestaña
  window.open(urlWhatsApp, '_blank', 'noopener,noreferrer');
  
  // Recargar lista después de enviar
  setTimeout(() => {
    this.cargarClientes();
  }, 1500);
}

// método registrarPago para que use confirmarPago
async registrarPago(cliente: any) {
     await this.confirmarPago(cliente);
}
  
  

  verCarnet(cliente: any) {
    if (cliente.carnet_url) {
      const url = `https://gym-app-n77p.onrender.com${cliente.carnet_url}`;
      window.open(url, '_blank');
    } else {
      this.mostrarAlerta('Sin Carnet', 'Este cliente no tiene carnet generado');
    }
  }

  /*async verDetalles(cliente: any) {
    const alert = await this.alertController.create({
      header: cliente.nombre_completo,
       
      buttons: [
        { text: 'Cerrar', role: 'cancel' },
        { 
        text: '📄 Ver Carnet', 
        cssClass: 'ver-carnet-button',
        handler: () => {
          // ✅ MISMA LÓGICA QUE FUNCIONA
          if (cliente.carnet_url) {
            const carnetUrl = `https://gym-app-n77p.onrender.com${cliente.carnet_url}`;
            console.log('🔗 Abriendo carnet:', carnetUrl);
            window.open(carnetUrl, '_blank');
          } else {
            // Si no tiene carnet_url, mostrar mensaje
            this.mostrarAlerta(
              'Sin Carnet',
              `${cliente.nombre_completo} no tiene carnet generado.\n\nRegistra un pago para generar el carnet.`
            );
          }
          return false; // No cierra el alert inmediatamente
        }
      },
        { 
          text: 'Registrar Pago', 
          handler: () => this.registrarPago(cliente)
        }
      ]
    });
    
    await alert.present();
  }*/

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
