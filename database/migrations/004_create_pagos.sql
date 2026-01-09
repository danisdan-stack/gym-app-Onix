CREATE TABLE pagos(
	id SERIAL PRIMARY KEY,
	cliente_id integer NOT NULL REFERENCES cliente(usuario_id) ON DELETE CASCADE,
	monto DECIMAL(10,2) NOT NULL,
	concepto VARCHAR(100) DEFAULT 'Mensualidad',
	fecha_pago DATE DEFAULT CURRENT_DATE,
	fecha_vencimiento DATE NOT NULL,
	fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	metodo VARCHAR(20) NOT NULL
		CHECK (metodo IN ('efectivo', 'tarjeta', 'transferencia', 'otro')),
	tipo_pago VARCHAR(20)
		CHECK (tipo_pago IN ('normal', 'anticipado', 'tardio')),
	estado VARCHAR(20) DEFAULT  'pendiente'
	    CHECK (estado IN('pagado', 'pendiente', 'anulado', 'vencido')),
	periodo_mes INTEGER CHECK (periodo_mes BETWEEN 1 AND 12),
	periodo_ano INTEGER,
	comprobante_url VARCHAR(255),
	referencia VARCHAR(50) UNIQUE,
	observaciones TEXT,
	creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT chk_fechas CHECK (fecha_pago <= fecha_vencimiento),
	CONSTRAINT chk_monto CHECK (monto > 0),
	CONSTRAINT chk_periodo_unico UNIQUE(cliente_id, periodo_mes, periOdo_ano)
);
-- Trigger para actualizar automáticamente actualizado_en
CREATE TRIGGER trigger_actualizar_pago
BEFORE UPDATE ON pagos
FOR EACH ROW
EXECUTE FUNCTION actualizar_timestamp();