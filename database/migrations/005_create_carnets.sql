CREATE TABLE carnets (
    id SERIAL PRIMARY KEY,
    
    -- Claves foráneas
    cliente_id INTEGER NOT NULL,
    usuario_id INTEGER NOT NULL,
    
    -- Datos del carnet
    meses_pagados JSONB NOT NULL DEFAULT '[]',
    carnet_url VARCHAR(500),
    
    -- Estado y fechas
    activo BOOLEAN DEFAULT true,
    fecha_desde DATE NOT NULL,
    fecha_hasta DATE,
    
    -- Control de auditoría
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_ultima_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Restricciones de integridad
    CONSTRAINT fk_carnet_cliente 
        FOREIGN KEY (cliente_id) REFERENCES cliente(usuario_id) 
        ON DELETE CASCADE,
    
    CONSTRAINT fk_carnet_usuario 
        FOREIGN KEY (usuario_id) REFERENCES usuario(id) 
        ON DELETE RESTRICT,
    
    -- Validaciones
    CONSTRAINT check_fechas_validas 
        CHECK (fecha_hasta IS NULL OR fecha_hasta >= fecha_desde),
    
    CONSTRAINT check_meses_pagados_valido 
        CHECK (jsonb_typeof(meses_pagados) = 'array'),
    
    -- Asegurar que un cliente no tenga múltiples carnets activos simultáneamente
    CONSTRAINT unique_carnet_activo_cliente 
        UNIQUE NULLS NOT DISTINCT (cliente_id, activo)
);

-- Índices para mejor rendimiento
CREATE INDEX idx_carnets_cliente_id ON carnets(cliente_id);
CREATE INDEX idx_carnets_usuario_id ON carnets(usuario_id);
CREATE INDEX idx_carnets_fecha_desde ON carnets(fecha_desde);
CREATE INDEX idx_carnets_activo ON carnets(activo) WHERE activo = true;

-- Índice GIN para búsquedas eficientes en JSONB
CREATE INDEX idx_carnets_meses_pagados ON carnets USING GIN (meses_pagados);

-- Trigger para actualizar automáticamente fecha_ultima_actualizacion
CREATE OR REPLACE FUNCTION update_ultima_actualizacion()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fecha_ultima_actualizacion = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_carnets
BEFORE UPDATE ON carnets
FOR EACH ROW
EXECUTE FUNCTION update_ultima_actualizacion();