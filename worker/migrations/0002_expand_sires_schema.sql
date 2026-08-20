-- Amplía sires con todos los campos que hoy solo existen en assets/sires.js /
-- assets/linear-traits.js, para que D1 pueda ser la fuente de verdad completa
-- del catálogo (no solo los 9 campos originales de la carga por Excel).

-- Valores numéricos (impulsan las columnas ordenables/filtrables de la tabla
-- y las tarjetas de la ficha 360).
ALTER TABLE sires ADD COLUMN ccr REAL;
ALTER TABLE sires ADD COLUMN cfp REAL;
ALTER TABLE sires ADD COLUMN dpr REAL;
ALTER TABLE sires ADD COLUMN fatPct REAL;
ALTER TABLE sires ADD COLUMN feedSaved REAL;
ALTER TABLE sires ADD COLUMN fertIndex REAL;
ALTER TABLE sires ADD COLUMN flc REAL;
ALTER TABLE sires ADD COLUMN hcc REAL;
ALTER TABLE sires ADD COLUMN livability REAL;
ALTER TABLE sires ADD COLUMN mastitis REAL;
ALTER TABLE sires ADD COLUMN milkR REAL;
ALTER TABLE sires ADD COLUMN pl REAL;
ALTER TABLE sires ADD COLUMN protein REAL;
ALTER TABLE sires ADD COLUMN proteinPct REAL;
ALTER TABLE sires ADD COLUMN ptat REAL;
ALTER TABLE sires ADD COLUMN sce REAL;
ALTER TABLE sires ADD COLUMN scs REAL;
ALTER TABLE sires ADD COLUMN sta REAL;
ALTER TABLE sires ADD COLUMN tpi REAL;
ALTER TABLE sires ADD COLUMN udc REAL;

-- Texto / identidad / pedigrí.
ALTER TABLE sires ADD COLUMN aaa TEXT;
ALTER TABLE sires ADD COLUMN dam TEXT;
ALTER TABLE sires ADD COLUMN damName TEXT;
ALTER TABLE sires ADD COLUMN disponibilidad TEXT;
ALTER TABLE sires ADD COLUMN dob TEXT;
ALTER TABLE sires ADD COLUMN foto_alt TEXT;
ALTER TABLE sires ADD COLUMN haplotipos TEXT;
ALTER TABLE sires ADD COLUMN mgd TEXT;
ALTER TABLE sires ADD COLUMN nombreRegistrado TEXT;
ALTER TABLE sires ADD COLUMN reg TEXT;
ALTER TABLE sires ADD COLUMN sireName TEXT;
ALTER TABLE sires ADD COLUMN source TEXT;
ALTER TABLE sires ADD COLUMN sourceUrl TEXT;

-- Estructuras (arreglos/objetos) guardadas como JSON en texto.
-- traits_json: los 18 rasgos lineales [[label,value,left,right,descriptor], ...]
-- ancestors_json: lista abierta de fotos de parientes [{relation,name,foto}, ...]
ALTER TABLE sires ADD COLUMN traits_json TEXT NOT NULL DEFAULT '[]';
ALTER TABLE sires ADD COLUMN ancestors_json TEXT NOT NULL DEFAULT '[]';

-- Archivo de la ficha descargable.
ALTER TABLE sires ADD COLUMN ficha_pdf_url TEXT;

-- Auditoría.
ALTER TABLE sires ADD COLUMN created_at TEXT;
ALTER TABLE sires ADD COLUMN updated_by TEXT;

CREATE INDEX IF NOT EXISTS idx_sires_updated ON sires(updated_at DESC);
