import { cleanFieldSet } from '../lib/validation.js';

// Convierte una fila cruda de D1 (columnas planas + *_json en texto) a la
// forma que consume tanto el sitio público como el editor del panel.
function shapeRow(row) {
  const { traits_json, ancestors_json, foto_alt, ficha_pdf_url, genomic_json, activo, ...rest } = row;
  return {
    ...rest,
    activo: Boolean(activo),
    fotoAlt: foto_alt || null,
    fichaPdfUrl: ficha_pdf_url || null,
    traits: traits_json ? JSON.parse(traits_json) : [],
    ancestors: ancestors_json ? JSON.parse(ancestors_json) : [],
    genomic_data: genomic_json ? JSON.parse(genomic_json) : {},
  };
}

export async function publicSires(env) {
  const result = await env.DB.prepare('SELECT * FROM sires ORDER BY nm DESC, nombre ASC').all();
  return { sires: result.results.map(shapeRow) };
}

export async function listSires(env) {
  const [sires, lastImport] = await Promise.all([
    env.DB.prepare('SELECT * FROM sires ORDER BY updated_at DESC').all(),
    env.DB.prepare("SELECT created_at FROM import_batches WHERE status='completed' ORDER BY created_at DESC LIMIT 1").first(),
  ]);
  return { sires: sires.results.map(shapeRow), lastImport: lastImport?.created_at || null };
}

export async function getSire(env, codigo) {
  const row = await env.DB.prepare('SELECT * FROM sires WHERE codigo=?1').bind(codigo).first();
  return row ? shapeRow(row) : null;
}

const COLUMNS = ['codigo', 'nombre', 'disponibilidad', 'nm', 'cm', 'milk', 'fat', 'ccr', 'cfp', 'dpr', 'fatPct', 'feedSaved', 'fertIndex', 'flc', 'hcc', 'livability', 'mastitis', 'milkR', 'pl', 'protein', 'proteinPct', 'ptat', 'sce', 'scs', 'sta', 'tpi', 'udc', 'aaa', 'dam', 'damName', 'dob', 'haplotipos', 'mgd', 'mgs', 'mggs', 'mggd', 'nombreRegistrado', 'reg', 'sireName', 'source', 'sourceUrl', 'beta', 'kappa', 'ped', 'raza', 'foto', 'foto_alt', 'traits_json', 'ancestors_json', 'ficha_pdf_url', 'activo', 'genomic_json'];

export async function createSire(env, session, body) {
  const row = cleanFieldSet(body);
  const existing = await env.DB.prepare('SELECT 1 FROM sires WHERE codigo=?1').bind(row.codigo).first();
  if (existing) { const err = new Error('Ya existe un semental con ese código.'); err.status = 409; throw err; }
  const now = new Date().toISOString();
  const values = { ...row, created_at: now, updated_at: now, updated_by: session.email };
  const cols = [...COLUMNS, 'created_at', 'updated_at', 'updated_by'];
  const sql = `INSERT INTO sires(${cols.join(',')}) VALUES(${cols.map((_, i) => `?${i + 1}`).join(',')})`;
  await env.DB.prepare(sql).bind(...cols.map((c) => values[c] ?? null)).run();
  return getSire(env, row.codigo);
}

export async function updateSire(env, session, codigoParam, body) {
  const existing = await env.DB.prepare('SELECT 1 FROM sires WHERE codigo=?1').bind(codigoParam).first();
  if (!existing) { const err = new Error('Ese semental no existe.'); err.status = 404; throw err; }
  const row = cleanFieldSet({ ...body, codigo: codigoParam });
  const now = new Date().toISOString();
  const values = { ...row, updated_at: now, updated_by: session.email };
  const setCols = COLUMNS.filter((c) => c !== 'codigo');
  const sql = `UPDATE sires SET ${setCols.map((c) => `${c}=?`).join(',')}, updated_at=?, updated_by=? WHERE codigo=?`;
  await env.DB.prepare(sql).bind(...setCols.map((c) => values[c] ?? null), now, session.email, codigoParam).run();
  return getSire(env, codigoParam);
}

// Columnas editables por carga masiva (Excel). Se excluyen ancestors_json y
// ficha_pdf_url a propósito: esos solo se suben con archivo real desde el
// editor de un semental, así que la carga masiva nunca debe pisarlos.
const BULK_COLUMNS = COLUMNS.filter((c) => c !== 'ancestors_json' && c !== 'ficha_pdf_url');

export async function bulkUpsertSires(env, session, rows) {
  const seen = new Set();
  const cleanedRows = [];
  rows.forEach((input, index) => {
    let cleaned;
    try { cleaned = cleanFieldSet(input); } catch (error) { const err = new Error(`Fila ${index + 1}: ${error.message}`); err.status = 400; throw err; }
    if (seen.has(cleaned.codigo)) { const err = new Error(`Código duplicado: ${cleaned.codigo}`); err.status = 400; throw err; }
    seen.add(cleaned.codigo);
    cleanedRows.push(cleaned);
  });
  const now = new Date().toISOString();
  const cols = [...BULK_COLUMNS, 'updated_at', 'updated_by'];
  const setCols = cols.filter((c) => c !== 'codigo');
  const sql = `INSERT INTO sires(${cols.join(',')}) VALUES(${cols.map((_, i) => `?${i + 1}`).join(',')}) ON CONFLICT(codigo) DO UPDATE SET ${setCols.map((c) => `${c}=excluded.${c}`).join(',')}`;
  for (let offset = 0; offset < cleanedRows.length; offset += 50) {
    const statements = cleanedRows.slice(offset, offset + 50).map((row) => {
      const values = { ...row, updated_at: now, updated_by: session.email };
      return env.DB.prepare(sql).bind(...cols.map((c) => values[c] ?? null));
    });
    await env.DB.batch(statements);
  }
  return cleanedRows.length;
}

export async function setSireActive(env, codigo, activo) {
  const existing = await env.DB.prepare('SELECT 1 FROM sires WHERE codigo=?1').bind(codigo).first();
  if (!existing) { const err = new Error('Ese semental no existe.'); err.status = 404; throw err; }
  await env.DB.prepare('UPDATE sires SET activo=?1, updated_at=?2 WHERE codigo=?3').bind(activo ? 1 : 0, new Date().toISOString(), codigo).run();
  return getSire(env, codigo);
}

// Borrado permanente. Solo se permite sobre un semental ya desactivado
// (candado de seguridad contra borrar algo que sigue en uso), y de paso
// limpia sus archivos en R2 para no dejar fotos/PDF huérfanos.
export async function purgeSire(env, codigo) {
  const existing = await env.DB.prepare('SELECT activo FROM sires WHERE codigo=?1').bind(codigo).first();
  if (!existing) { const err = new Error('Ese semental no existe.'); err.status = 404; throw err; }
  if (existing.activo) { const err = new Error('Solo se puede borrar permanentemente un semental ya desactivado.'); err.status = 400; throw err; }
  const listed = await env.MEDIA.list({ prefix: `bulls/${codigo}/` });
  const keys = listed.objects.map((o) => o.key);
  keys.push(`fichas/${codigo}.pdf`);
  await env.MEDIA.delete(keys);
  await env.DB.prepare('DELETE FROM sires WHERE codigo=?1').bind(codigo).run();
  return { ok: true };
}
