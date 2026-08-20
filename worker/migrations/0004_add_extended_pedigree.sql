-- Agrega el resto del pedigrí materno: abuelo (MGS), bisabuelo (MGGS) y
-- bisabuela (MGGD) maternos. mgd (abuela materna) ya existía desde 0002.
ALTER TABLE sires ADD COLUMN mgs TEXT;
ALTER TABLE sires ADD COLUMN mggs TEXT;
ALTER TABLE sires ADD COLUMN mggd TEXT;
