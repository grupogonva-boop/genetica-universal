-- Marca de disponibilidad "Limitado" (existencia reducida), independiente
-- de la presentación (sexado/convencional/etc.), controlada por checkbox.
ALTER TABLE sires ADD COLUMN limitado INTEGER NOT NULL DEFAULT 0;
