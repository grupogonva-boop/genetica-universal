-- Usuarios adicionales del panel (aparte del dueño, que sigue autenticado
-- vía los secretos ADMIN_EMAIL/ADMIN_PASSWORD_HASH/ADMIN_PASSWORD_SALT).
-- Permite invitar a alguien más con su propia contraseña, sin tocar
-- secretos de Cloudflare, y forzar que la cambien en su primer acceso.
CREATE TABLE IF NOT EXISTS admin_users (
  email TEXT PRIMARY KEY,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  must_change_password INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
