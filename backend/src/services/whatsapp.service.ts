/* ======================================================
   INTERFAZ DE ENTRADA
====================================================== */
export interface WhatsAppCarnetData {
  telefono: string;
  nombre: string;
  apellido: string;
  mes: number;      // 1–12
  ano: number;
  carnetUrl: string;
}

/* ======================================================
   SERVICIO WHATSAPP (DESACOPLADO)
====================================================== */
export class WhatsAppService {

  /* ======================================================
     MÉTODO PRINCIPAL
  ====================================================== */
  generarLinkCarnet(data: WhatsAppCarnetData) {
    this.validarDatos(data);

    const mensaje = this.generarMensaje(data);
    const telefono = this.normalizarTelefono(data.telefono);

    const url = `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`;

    return {
      telefono,
      mensaje,
      url
    };
  }

  /* ======================================================
     MENSAJE
  ====================================================== */
  private generarMensaje(data: WhatsAppCarnetData): string {
    const mesNombre = this.nombreMes(data.mes);

    return (
`Hola ${data.nombre} 👋

✅ *Mes de ${mesNombre} ${data.ano} abonado correctamente.*

📎 Te dejamos tu carnet actualizado:
${data.carnetUrl}

💪 ¡Gracias por entrenar con ONIX GYM!`
    );
  }

  /* ======================================================
     HELPERS
  ====================================================== */
  private nombreMes(mes: number): string {
    const meses = [
      'ENERO', 'FEBRERO', 'MARZO', 'ABRIL',
      'MAYO', 'JUNIO', 'JULIO', 'AGOSTO',
      'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'
    ];

    return meses[mes - 1] || 'MES';
  }

  private normalizarTelefono(telefono: string): string {
    // Ej: 3511234567 → 5493511234567
    let limpio = telefono.replace(/\D/g, '');

    if (!limpio.startsWith('54')) {
      limpio = '54' + limpio;
    }

    return limpio;
  }

  private validarDatos(data: WhatsAppCarnetData) {
    if (!data.telefono) throw new Error('WhatsApp: teléfono faltante');
    if (!data.nombre) throw new Error('WhatsApp: nombre faltante');
    if (!data.carnetUrl) throw new Error('WhatsApp: URL de carnet faltante');
    if (data.mes < 1 || data.mes > 12) {
      throw new Error('WhatsApp: mes inválido');
    }
  }
}
