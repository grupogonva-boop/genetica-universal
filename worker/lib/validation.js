// Validadores compartidos por las rutas del worker. Todo lo que llega del
// cliente pasa por aquí antes de tocar D1 o R2.

export function cleanText(value, max) { return String(value ?? '').trim().slice(0, max); }
export function cleanDataText(value, max) { return cleanText(value, max).replace(/[<>&"'`]/g, ''); }
export function cleanNumber(value) { if (value === null || value === '' || value === undefined) return null; const parsed = Number(value); return Number.isFinite(parsed) ? parsed : null; }
export function cleanImageUrl(value) {
  const text = cleanText(value, 500);
  if (!text) return '';
  // Acepta URLs absolutas https:// (subidas a R2 u otro host) y rutas
  // relativas del propio sitio (ej. assets/media/bulls/...), que es como
  // sigue viviendo la mayoría de las fotos migradas desde el catálogo estático.
  if (/^https:\/\//i.test(text)) { try { return new URL(text).href; } catch { return ''; } }
  if (/^assets\//.test(text)) return text;
  return '';
}
export function cleanGenomicData(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const output = {};
  for (const [key, item] of Object.entries(value).slice(0, 200)) {
    const safeKey = cleanDataText(key, 120);
    if (!safeKey || !['string', 'number', 'boolean'].includes(typeof item)) continue;
    output[safeKey] = typeof item === 'string' ? cleanDataText(item, 500) : item;
  }
  return output;
}

const RELATION_MAX = 8;
export function cleanAncestors(value) {
  if (!Array.isArray(value)) return [];
  return value.slice(0, RELATION_MAX).map((item) => ({
    relation: cleanDataText(item?.relation, 40),
    name: cleanDataText(item?.name, 160),
    foto: cleanImageUrl(item?.foto),
  })).filter((item) => item.name && item.foto);
}

const TRAITS_MAX = 18;
export function cleanTraits(value) {
  if (!Array.isArray(value)) return [];
  return value.slice(0, TRAITS_MAX).map((item) => {
    const [label, val, left, right, descriptor] = Array.isArray(item) ? item : [];
    return [cleanDataText(label, 60), cleanNumber(val) ?? 0, cleanDataText(left, 40), cleanDataText(right, 40), cleanDataText(descriptor, 40)];
  }).filter((item) => item[0]);
}

const AVAILABILITY = new Set(['sex', 'conv', 'conv-sex', 's-conv']);

const NUMERIC_FIELDS = ['nm', 'cm', 'milk', 'fat', 'ccr', 'cfp', 'dpr', 'fatPct', 'feedSaved', 'fertIndex', 'flc', 'hcc', 'livability', 'mastitis', 'milkR', 'pl', 'protein', 'proteinPct', 'ptat', 'sce', 'scs', 'sta', 'tpi', 'udc'];
const TEXT_FIELDS = { aaa: 40, dam: 200, damName: 200, dob: 20, haplotipos: 20, mgd: 200, mgs: 200, mggs: 200, mggd: 200, nombreRegistrado: 160, reg: 60, sireName: 200, source: 120, sourceUrl: 500, beta: 20, kappa: 20, ped: 240, raza: 50 };

/** Valida el cuerpo completo de un semental (crear o editar). Lanza un Error
 * con mensaje en español listo para mostrar si algo es inválido. */
export function cleanFieldSet(body) {
  const codigo = cleanDataText(body.codigo, 60).toUpperCase();
  const nombre = cleanDataText(body.nombre, 120).toUpperCase();
  if (!codigo || !/^[A-Z0-9]{3,20}$/.test(codigo)) throw new Error('El código NAAB es obligatorio y solo puede tener letras y números.');
  if (!nombre) throw new Error('El nombre del semental es obligatorio.');

  const disponibilidad = cleanDataText(body.disponibilidad, 20);
  if (disponibilidad && !AVAILABILITY.has(disponibilidad)) throw new Error('Presentación inválida.');

  const row = { codigo, nombre, disponibilidad: disponibilidad || null };
  for (const field of NUMERIC_FIELDS) row[field] = cleanNumber(body[field]);
  for (const [field, max] of Object.entries(TEXT_FIELDS)) row[field] = cleanText(body[field], max) || null;
  row.foto = cleanImageUrl(body.foto) || null;
  row.foto_alt = cleanImageUrl(body.fotoAlt ?? body.foto_alt) || null;
  row.raza = row.raza || 'Holstein';
  row.activo = body.activo === false ? 0 : 1;
  row.traits_json = JSON.stringify(cleanTraits(body.traits));
  row.ancestors_json = JSON.stringify(cleanAncestors(body.ancestors));
  row.ficha_pdf_url = cleanImageUrl(body.fichaPdfUrl ?? body.ficha_pdf_url) || null;
  row.genomic_json = JSON.stringify(cleanGenomicData(body.genomic_data));
  return row;
}
