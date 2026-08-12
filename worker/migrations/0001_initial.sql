CREATE TABLE IF NOT EXISTS sires (
  codigo TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  nm REAL,
  cm REAL,
  milk REAL,
  fat REAL,
  beta TEXT,
  kappa TEXT,
  ped TEXT,
  foto TEXT,
  raza TEXT NOT NULL DEFAULT 'Holstein',
  activo INTEGER NOT NULL DEFAULT 1 CHECK (activo IN (0, 1)),
  genomic_json TEXT NOT NULL DEFAULT '{}',
  import_id TEXT,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sires_active_nm ON sires(activo, nm DESC);

CREATE TABLE IF NOT EXISTS import_batches (
  id TEXT PRIMARY KEY,
  filename TEXT NOT NULL,
  sheet_name TEXT,
  row_count INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('processing', 'completed', 'failed')),
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS login_attempts (
  ip_hash TEXT PRIMARY KEY,
  attempts INTEGER NOT NULL DEFAULT 0,
  window_started INTEGER NOT NULL
);
