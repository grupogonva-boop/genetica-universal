// Herramienta local de un solo uso: lee el catálogo estático actual
// (assets/sires.js + assets/linear-traits.js) y genera un archivo de
// migración D1 (worker/migrations/0003_seed_sires.sql) que deja la base de
// datos con los 49 sementales completos, incluyendo el PDF de ficha ya
// existente cuando aplica. No se despliega — se corre una vez con
// `node scripts/seed-d1-from-static.mjs` y el SQL resultante se aplica con
// `wrangler d1 migrations apply --remote` como cualquier otra migración.
import { readFileSync, existsSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const read = (rel) => readFileSync(path.join(root, rel), 'utf8');

function loadAssignment(file, varName) {
  const src = read(file);
  const prefix = `window.${varName}=`;
  if (!src.startsWith(prefix)) throw new Error(`${file} no empieza con ${prefix}`);
  const body = src.slice(prefix.length).trim().replace(/;\s*$/, '');
  return JSON.parse(body);
}

const sires = loadAssignment('assets/sires.js', 'SIRE_CATALOG');
const linearTraits = loadAssignment('assets/linear-traits.js', 'LINEAR_TRAITS');

const NUMERIC_COLS = ['nm','cm','milk','fat','ccr','cfp','dpr','fatPct','feedSaved','fertIndex','flc','hcc','livability','mastitis','milkR','pl','protein','proteinPct','ptat','sce','scs','sta','tpi','udc'];
const TEXT_COLS = ['nombre','beta','kappa','ped','foto','aaa','dam','damName','disponibilidad','dob','haplotipos','mgd','nombreRegistrado','reg','sireName','source','sourceUrl'];

function sqlValue(value) {
  if (value === null || value === undefined || value === '') return 'NULL';
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : 'NULL';
  return `'${String(value).replace(/'/g, "''")}'`;
}

const columns = ['codigo', ...TEXT_COLS, ...NUMERIC_COLS, 'foto_alt', 'traits_json', 'ancestors_json', 'ficha_pdf_url', 'raza', 'activo', 'genomic_json', 'created_at', 'updated_at', 'updated_by'];

const rows = sires.map((bull) => {
  const traits = linearTraits[bull.codigo] || bull.traits || [];
  const ancestors = bull.ancestorPhoto ? [{ relation: bull.ancestorPhoto.label, name: bull.ancestorPhoto.name, foto: bull.ancestorPhoto.foto }] : [];
  const pdfPath = `assets/media/fichas/${bull.codigo}.pdf`;
  const fichaUrl = existsSync(path.join(root, pdfPath)) ? pdfPath : null;
  const now = new Date().toISOString();

  const values = {
    codigo: bull.codigo,
    ...Object.fromEntries(TEXT_COLS.map((k) => [k, bull[k] ?? null])),
    ...Object.fromEntries(NUMERIC_COLS.map((k) => [k, typeof bull[k] === 'number' ? bull[k] : null])),
    foto_alt: bull.fotoAlt ?? null,
    traits_json: JSON.stringify(traits),
    ancestors_json: JSON.stringify(ancestors),
    ficha_pdf_url: fichaUrl,
    raza: 'Holstein',
    activo: 1,
    genomic_json: '{}',
    created_at: now,
    updated_at: now,
    updated_by: 'seed-migration',
  };

  return `(${columns.map((c) => sqlValue(values[c])).join(', ')})`;
});

const updateSet = columns.filter((c) => c !== 'codigo').map((c) => `${c}=excluded.${c}`).join(', ');
const sql = `-- Generado por scripts/seed-d1-from-static.mjs a partir del catálogo\n` +
  `-- estático actual (${sires.length} sementales). No editar a mano.\n\n` +
  `INSERT INTO sires (${columns.join(', ')})\nVALUES\n${rows.join(',\n')}\n` +
  `ON CONFLICT(codigo) DO UPDATE SET ${updateSet};\n`;

const outPath = path.join(root, 'worker/migrations/0003_seed_sires.sql');
writeFileSync(outPath, sql, 'utf8');
console.log(`Escrito ${outPath} con ${rows.length} sementales.`);
const withPdf = sires.filter((b) => existsSync(path.join(root, `assets/media/fichas/${b.codigo}.pdf`))).length;
console.log(`PDFs de ficha vinculados: ${withPdf} de ${sires.length}.`);
