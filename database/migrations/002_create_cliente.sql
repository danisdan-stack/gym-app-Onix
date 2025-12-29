CREATE TABLE cliente (
	---relacion con usuario (1:1)
	usuario_id INTEGER PRIMARY KEY REFERENCES usuario(id) ON DELETE CASCADE,

	---datos personales basicos
	
	nombre VARCHAR(100) NOT NULL,
	apellido VARCHAR(100) NOT NULL,
	telefono VARCHAR(20) NOT NULL,

	---relacion con entrenador
	entrenador_id INTEGER,

	---ESTADO MEMBRESIA
	estado_cuota VARCHAR(20) DEFAULT 'inactivo'
		CHECK (estado_cuota IN ('activo', 'inactivo', 'suspendido')),
	fecha_inscripcion DATE DEFAULT CURRENT_DATE,
	fecha_vencimiento DATE,

	---DIRECCION
	direccion TEXT,

	--AUDITORIA
	creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	
);
CREATE TRIGGER trigger_actualizar_cliente
BEFORE UPDATE ON cliente
FOR EACH ROW
EXECUTE FUNCTION actualizar_timestamp();
