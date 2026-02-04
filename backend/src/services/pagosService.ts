import { PoolClient } from 'pg';
import { IPagoCreate, IPago } from '../models/interfaces/pago.interface';
import { PagoModel } from '../models/pago.model';
import { ClienteAltaService } from './clienteAlta.service';
import { CarnetService } from './carnet.service';
import pool from '../config/database';

export class PagoService {
  constructor(
    private pagoModel: PagoModel,
    private clienteAltaService: ClienteAltaService,
    private carnetService: CarnetService
  ) {}

  /**
   * Registra un pago nuevo
   * @param pagoData datos del pago
   * @param client conexión PG (transacción abierta)
   */
 async registrarPago(pagoData: IPagoCreate, client: PoolClient): Promise<IPago> {

  // 1️⃣ Evitar pagar dos veces el mismo mes
  const pagosExistentes = await this.pagoModel.obtenerPorCliente(
    pagoData.cliente_id,
    pagoData.periodo_mes!,
    pagoData.periodo_ano!,
    client
  );

  if (pagosExistentes.length > 0) {
    throw new Error('El período ya está abonado');
  }

  // 2️⃣ Fechas del pago
  const fechaPago = pagoData.fecha_pago || new Date();
  const fechaVencimiento = new Date(fechaPago);
  fechaVencimiento.setDate(fechaVencimiento.getDate() + 30);

  // 3️⃣ Registrar pago (fuente de verdad)
  const pago = await this.pagoModel.registrar(
    {
      ...pagoData,
      fecha_pago: fechaPago,
      fecha_vencimiento: fechaVencimiento,
      estado: 'pagado',
    },
    client
  );

  // 4️⃣ Activar cliente hasta vencimiento
  await this.clienteAltaService.actualizarEstado(
    pagoData.cliente_id,
    'activo',
    fechaVencimiento,
    client
  );

  // 5️⃣ Generar carnet del mes abonado (si no existe)
  await this.carnetService.generarSiCorresponde(
    pagoData.cliente_id,
    client
  );

  return pago;
}


  /**
   * Determina el estado dinámico del cliente para el frontend
   * @param fechaVencimiento fecha de vencimiento de la cuota
   */
  calcularEstadoVencimiento(fechaVencimiento: Date) {
    const hoy = new Date();
    const diffDias = Math.ceil(
      (fechaVencimiento.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDias < 0 && diffDias >= -7) return 'inactivo'; // pasaron 7 días de gracia
    if (diffDias <= 7 && diffDias >= 0) return 'por vencer'; // queda ≤ 7 días
    return 'activo';
  }
}
