-- Reemplaza el slot único "foto_alt" (otro ángulo) por una lista abierta de
-- fotos adicionales del propio toro, igual de flexible que los familiares.
ALTER TABLE sires ADD COLUMN fotos_extra_json TEXT NOT NULL DEFAULT '[]';

-- Migra cualquier foto_alt existente a la nueva lista para no perder nada.
UPDATE sires SET fotos_extra_json = json_array(foto_alt) WHERE foto_alt IS NOT NULL AND foto_alt != '';
