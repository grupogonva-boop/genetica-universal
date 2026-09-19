CREATE TABLE IF NOT EXISTS audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL,
  actor_email TEXT NOT NULL,
  action TEXT NOT NULL,
  target TEXT,
  summary TEXT
);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(id DESC);
