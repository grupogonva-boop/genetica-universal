-- Logos de "Partners y proveedores" del pie de página del sitio público.
-- Editable desde admin: nombre, imagen, link, insignia opcional (ej. "A2")
-- y si se muestra destacado (como GONVAX hoy).
CREATE TABLE IF NOT EXISTS partners (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  image_url TEXT NOT NULL,
  link_url TEXT,
  badge TEXT,
  featured INTEGER NOT NULL DEFAULT 0,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);
