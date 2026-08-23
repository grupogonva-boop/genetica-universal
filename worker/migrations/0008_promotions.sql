-- Imágenes del carrusel de promociones del sitio público. Vive aparte de
-- sires porque no pertenece a ningún semental — es contenido del sitio.
CREATE TABLE IF NOT EXISTS promotions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  url TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);
