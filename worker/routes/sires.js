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

const COLUMNS = ['codigo', 'nombre', 'disponibilidad', 'nm', 'cm', 'milk', 'fat', 'ccr', 'cfp', 'dpr', 'fatPct', 'feedSaved', 'fertIndex', 'flc', 'hcc', 'livability', 'mastitis', 'milkR', 'pl', 'protein', 'proteinPct', 'ptat', 'sce', 'scs', 'sta', 'tpi', 'udc', 'aaa', 'dam', 'damName', 'dob', 'haplotipos', 'mgd', 'nombreRegistrado', 'reg', 'sireName', 'source', 'sourceUrl', 'beta', 'kappa', 'ped', 'raza', 'foto', 'foto_alt', 'traits_json', 'ancestors_json', 'ficha_pdf_url', 'activo', 'genomic_json'];

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

export async function setSireActive(env, codigo, activo) {
  const existing = await env.DB.prepare('SELECT 1 FROM sires WHERE codigo=?1').bind(codigo).first();
  if (!existing) { const err = new Error('Ese semental no existe.'); err.status = 404; throw err; }
  await env.DB.prepare('UPDATE sires SET activo=?1, updated_at=?2 WHERE codigo=?3').bind(activo ? 1 : 0, new Date().toISOString(), codigo).run();
  return getSire(env, codigo);
}
