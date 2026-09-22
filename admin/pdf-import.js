// Extrae el catálogo completo (todos los sementales y sus datos) de un PDF
// tipo "catalogo-genetica-universal.pdf" — una página por semental, con el
// mismo formato de CDCB Summary / HA Type Summary. Corre en el navegador
// (PDF.js), sin backend. Si algún campo de un semental no se pudo leer,
// se marca en `_warnings` para que el panel lo muestre antes de publicar.
import * as pdfjsLib from './vendor/pdf.min.mjs';
pdfjsLib.GlobalWorkerOptions.workerSrc = 'vendor/pdf.worker.min.mjs';

const TRAIT_TEMPLATE = [
  ['Estatura', 'Baja', 'Alta'], ['Fortaleza', 'Débil', 'Fuerte'], ['Profundidad corporal', 'Poco profunda', 'Profunda'],
  ['Fortaleza lechera', 'Costilla cerrada', 'Costilla abierta'], ['Ángulo de grupa', 'Isquiones altos', 'Isquiones bajos'], ['Ancho de grupa', 'Angosta', 'Ancha'],
  ['Patas vista lateral', 'Rectas', 'Curvas'], ['Patas vista posterior', 'Cerradas', 'Rectas'], ['Ángulo de pie', 'Bajo', 'Alto'], ['Score de patas', 'Bajo', 'Alto'],
  ['Inserción ubre anterior', 'Débil', 'Fuerte'], ['Altura ubre posterior', 'Baja', 'Alta'], ['Ancho ubre posterior', 'Angosta', 'Ancha'], ['Hendidura de ubre', 'Débil', 'Fuerte'],
  ['Profundidad de ubre', 'Profunda', 'Poco profunda'], ['Colocación pezones', 'Alejados', 'Centrados'], ['Pezón posterior', 'Alejados', 'Centrados'], ['Largo de pezones', 'Cortos', 'Largos'],
];

const clean = (s) => String(s ?? '').replace(/ /g, ' ').replace(/\s+/g, ' ').trim();
const num = (s) => { if (s == null) return null; const m = String(s).replace(/,/g, '').match(/[+-]?\d+\.?\d*/); return m ? Number(m[0]) : null; };
function inlineNum(lines, labelPattern) {
  const re = new RegExp(labelPattern + '\\s*([+-]?\\d+\\.?\\d*)');
  for (const l of lines) { const m = re.exec(clean(l)); if (m) return Number(m[1]); }
  return null;
}

// Busca la fotografía principal del semental dentro de la página: recorre
// la lista de operadores en busca de imágenes pintadas (paintImageXObject),
// renderiza la página para que PDF.js resuelva los bitmaps, y toma la
// primera imagen "apaisada" y suficientemente grande (>=400px en su lado
// menor) — así se descartan íconos/insignias cuadradas (EcoFeed+, A2A2,
// Proven, Ultra Fertility) y se evita quedarse con la foto de una hija/grupo
// cuando hay varias del mismo tamaño en la página.
function paintImageToCanvas(ctx, img, w, h) {
  if (img.bitmap) { ctx.drawImage(img.bitmap, 0, 0, w, h); return true; }
  const src = img.data;
  if (!src) return false;
  const channels = src.length / (w * h);
  const out = ctx.createImageData(w, h);
  const dst = out.data;
  if (channels === 4) dst.set(src);
  else if (channels === 3) { for (let i = 0, j = 0; i < src.length; i += 3, j += 4) { dst[j] = src[i]; dst[j + 1] = src[i + 1]; dst[j + 2] = src[i + 2]; dst[j + 3] = 255; } }
  else if (channels === 1) { for (let i = 0, j = 0; i < src.length; i++, j += 4) { dst[j] = dst[j + 1] = dst[j + 2] = src[i]; dst[j + 3] = 255; } }
  else return false;
  ctx.putImageData(out, 0, 0);
  return true;
}

async function extractMainPhoto(page) {
  try {
    const opList = await page.getOperatorList();
    const names = [];
    for (let i = 0; i < opList.fnArray.length; i++) {
      if (opList.fnArray[i] === pdfjsLib.OPS.paintImageXObject) names.push(opList.argsArray[i][0]);
    }
    if (!names.length) return null;
    const viewport = page.getViewport({ scale: 1.5 });
    const renderCanvas = document.createElement('canvas');
    renderCanvas.width = viewport.width; renderCanvas.height = viewport.height;
    await page.render({ canvasContext: renderCanvas.getContext('2d'), viewport }).promise;
    for (const name of names) {
      let img = null;
      try { img = page.objs.get(name); } catch { /* no resuelto */ }
      if (!img) { try { img = page.commonObjs.get(name); } catch { /* no resuelto */ } }
      if (!img || !img.width || !img.height) continue;
      const { width: w, height: h } = img;
      if (Math.min(w, h) < 400 || w <= h) continue; // descarta íconos y retratos verticales
      const out = document.createElement('canvas');
      out.width = w; out.height = h;
      if (!paintImageToCanvas(out.getContext('2d'), img, w, h)) continue;
      const blob = await new Promise((resolve) => out.toBlob(resolve, 'image/jpeg', 0.9));
      if (blob) return blob;
    }
    return null;
  } catch {
    return null;
  }
}

async function pageToLines(page) {
  const content = await page.getTextContent();
  const groups = [];
  for (const item of content.items) {
    if (!item.str) continue;
    const y = item.transform[5];
    let g = groups.find((gr) => Math.abs(gr.y - y) < 2.5);
    if (!g) { g = { y, items: [] }; groups.push(g); }
    g.items.push(item);
  }
  groups.sort((a, b) => b.y - a.y);
  return groups.map((g) => {
    g.items.sort((a, b) => a.transform[4] - b.transform[4]);
    let line = '', lastEndX = null;
    for (const it of g.items) {
      const x = it.transform[4];
      if (lastEndX != null && x - lastEndX > 1.5 && !line.endsWith(' ') && !it.str.startsWith(' ')) line += ' ';
      line += it.str;
      lastEndX = x + (it.width || 0);
    }
    return line;
  });
}

function parsePage(lines) {
  const text = lines.join('\n');
  const warnings = [];
  const row = {};

  const codigoM = /(\d[\dA-Z]{2,5}HO\d{4,6})\s+([A-Z0-9][A-Z0-9\-.' ]*)/.exec(text);
  if (codigoM) { row.codigo = codigoM[1].toUpperCase(); row.nombre = codigoM[2].trim().toUpperCase(); }
  else { warnings.push('codigo/nombre'); }

  // "Haplotype: <codigo opcional> <pedigrí corto: Word x Word x Word>" y el nombre
  // registrado va en la línea inmediatamente anterior a esta.
  const haploIdx = lines.findIndex((l) => /Haplotype:/.test(l));
  let regName = null, ped = null, haplotipos = null;
  if (haploIdx >= 0) {
    const after = clean(lines[haploIdx].split('Haplotype:')[1] || '');
    const pedRe = /[A-Za-z][A-Za-z0-9'*.\-]*(?:\s+x\s+[A-Za-z][A-Za-z0-9'*.\-]*){1,3}/g;
    const matches = [...after.matchAll(pedRe)];
    const pedM = matches[matches.length - 1];
    if (pedM) { ped = pedM[0].replace(/ x /g, ' × '); haplotipos = clean(after.slice(0, pedM.index)) || null; }
    else { haplotipos = after || null; }
    if (haploIdx > 0) regName = clean(lines[haploIdx - 1]) || null;
  }
  row.nombreRegistrado = regName; row.ped = ped; row.haplotipos = haplotipos;
  if (!regName) warnings.push('nombreRegistrado');
  if (!ped) warnings.push('ped');

  let m = /Reg:\s*(\S+)/.exec(text); row.reg = m ? clean(m[1]) : null; if (!row.reg) warnings.push('reg');
  m = /DOB:\s*(\S+)/.exec(text); row.dob = m ? clean(m[1]) : null; if (!row.dob) warnings.push('dob');

  m = /\baAa:\s*(\d+)/.exec(text); row.aaa = m ? m[1] : null;
  m = /\b([A-Z]{2})\s+([A-Z]\d[A-Z]\d)\b/.exec(text);
  if (m) { row.kappa = m[1]; row.beta = m[2].slice(0, 2) + '/' + m[2].slice(2); }
  else { row.kappa = null; row.beta = null; warnings.push('beta/kappa'); }

  for (const [label, key] of [['Sire:', 'sireName'], ['Dam:', 'damName'], ['MGS:', 'mgs'], ['MGD:', 'mgd'], ['MGGS:', 'mggs'], ['MGGD:', 'mggd']]) {
    const re = new RegExp(label.replace(':', '\\:') + '\\s*([^\\n]+)');
    const mm = re.exec(text);
    const val = mm ? clean(mm[1]) : null;
    row[key] = val || null;
    if (!val) warnings.push(key);
  }

  m = /NM\$\s*([+-]?[\d,]+)/.exec(text); row.nm = m ? num(m[1]) : null; if (row.nm == null) warnings.push('nm');
  m = /Cheese Merit \$\s*([+-]?[\d,]+\.?\d*)/.exec(text); row.cm = m ? num(m[1]) : null; if (row.cm == null) warnings.push('cm');

  m = /\bMilk\s+([+-]?[\d,]+\.?\d*)/.exec(text); row.milk = m ? num(m[1]) : null; if (row.milk == null) warnings.push('milk');
  m = /\bMilk\s+[+-]?[\d,]+\.?\d*\s+(\d+)%R/.exec(text); row.milkR = m ? num(m[1]) : null;

  m = /\bFat\s+([+-]?\d+\.?\d*)\s+([+-]?\d+\.?\d*)%/.exec(text);
  if (m) { row.fat = num(m[1]); row.fatPct = num(m[2]); } else { row.fat = row.fatPct = null; warnings.push('fat/fatPct'); }

  m = /\bProtein\s+([+-]?\d+\.?\d*)\s+([+-]?\d+\.?\d*)%/.exec(text);
  if (m) { row.protein = num(m[1]); row.proteinPct = num(m[2]); } else { row.protein = row.proteinPct = null; warnings.push('protein/proteinPct'); }

  row.cfp = inlineNum(lines, '\\bCFP\\b'); if (row.cfp == null) warnings.push('cfp');
  row.scs = inlineNum(lines, '\\bSCS\\b'); if (row.scs == null) warnings.push('scs');
  row.pl = inlineNum(lines, '\\bPL\\b'); if (row.pl == null) warnings.push('pl');
  row.ccr = inlineNum(lines, '\\bCCR\\b'); if (row.ccr == null) warnings.push('ccr');
  row.feedSaved = inlineNum(lines, 'Feed Saved'); if (row.feedSaved == null) warnings.push('feedSaved');

  row.mastitis = inlineNum(lines, 'Mastitis');
  row.fertIndex = inlineNum(lines, 'Fert\\. Index');
  row.livability = inlineNum(lines, 'Livability');
  row.dpr = inlineNum(lines, '\\bDPR\\b');
  row.sce = inlineNum(lines, '\\bSCE\\b');
  row.rfi = inlineNum(lines, '\\bRFI\\b');
  row.msp = inlineNum(lines, '\\bMSP\\b');
  row.efi = inlineNum(lines, '\\bEFI\\b');
  row.gefi = inlineNum(lines, 'gEFI');
  for (const k of ['mastitis', 'fertIndex', 'livability', 'dpr', 'sce', 'rfi', 'msp', 'efi', 'gefi']) if (row[k] == null) warnings.push(k);

  m = /\bTPI\s+([+-]?\d+)/.exec(text); row.tpi = m ? num(m[1]) : null;
  m = /\bPTAT\s+([+-]?\d+\.?\d*)/.exec(text); row.ptat = m ? num(m[1]) : null;
  m = /\bHCC\s+([+-]?\d+\.?\d*)/.exec(text); row.hcc = m ? num(m[1]) : null;
  m = /\bUDC\s+([+-]?\d+\.?\d*)/.exec(text); row.udc = m ? num(m[1]) : null;
  m = /\bFLC\s+([+-]?\d+\.?\d*)/.exec(text); row.flc = m ? num(m[1]) : null;
  for (const k of ['tpi', 'ptat', 'hcc', 'udc', 'flc']) if (row[k] == null) warnings.push(k);
  row.sta = null;

  const bwcIdx = lines.findIndex((l) => /\bBWC\b/.test(l));
  const traitValues = [];
  if (bwcIdx >= 0) {
    for (const l of lines.slice(bwcIdx + 1)) {
      const matches = clean(l).matchAll(/[+-]\d+\.\d+/g);
      for (const mm of matches) { traitValues.push(Number(mm[0])); if (traitValues.length >= 18) break; }
      if (traitValues.length >= 18) break;
    }
  }
  let traits = [];
  if (traitValues.length >= 18) {
    traits = TRAIT_TEMPLATE.map(([label, left, right], i) => { const v = traitValues[i]; return [label, v, left, right, v < 0 ? left : right]; });
  } else {
    warnings.push(`rasgos lineales (solo ${traitValues.length}/18)`);
  }
  row.traits = traits;
  row.raza = 'Holstein';
  row.activo = true;
  row.disponibilidad = '';
  row.foto = ''; row.fotoAlt = '';
  row.dam = '';
  row.sourceUrl = ''; row.source = 'catalogo-genetica-universal.pdf';
  row.genomic_data = {};

  row._warnings = warnings;
  return row;
}

// Algunas fichas sueltas (no el catálogo por lotes) vienen generadas con una
// fuente "Tipo 3" sin texto real embebido: cada letra es un dibujo vectorial
// indexado con nombres de glifo reciclados (p. ej. el código "A" puede dibujar
// el trazo de un "5"), no un carácter Unicode real. PDF.js igual devuelve
// letras sueltas ahí (por eso no basta con contar letras), pero nunca ninguna
// de las palabras/etiquetas fijas que sí aparecen literalmente en toda ficha
// real. Si ninguna de esas anclas aparece, el texto es, de hecho, ilegible.
const TEXT_ANCHORS = ['Reg:', 'DOB:', 'CDCB', 'TPI', 'Haplotype:', 'NM$'];
function isTextUnreadable(lines) {
  const joined = lines.join('');
  return !TEXT_ANCHORS.some((anchor) => joined.includes(anchor));
}

async function parseCatalogPdf(file, onProgress) {
  const buffer = await file.arrayBuffer();
  const doc = await pdfjsLib.getDocument({ data: buffer }).promise;
  const rows = [];
  const seen = new Set();
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const lines = await pageToLines(page);
    const row = parsePage(lines);
    const photoBlob = await extractMainPhoto(page);
    if (photoBlob) row._photoBlob = photoBlob;
    else row._warnings.push('foto (no se detectó automáticamente, sube manualmente)');
    const rowErrors = [];
    if (isTextUnreadable(lines)) {
      row._warnings.length = 0;
      rowErrors.push('Este PDF no tiene texto legible (usa una fuente sin texto real, típico de un PDF "impreso" desde otro sistema). No se puede leer automáticamente: agrega este semental a mano desde "+ Nuevo semental", o pide el PDF original con texto seleccionable.');
    } else {
      if (!row.codigo) rowErrors.push('Falta código');
      if (!row.nombre) rowErrors.push('Falta nombre');
      if (row.codigo && seen.has(row.codigo)) rowErrors.push('Código duplicado');
      if (row.codigo) seen.add(row.codigo);
    }
    rows.push({ ...row, _errors: rowErrors, _page: i });
    if (onProgress) onProgress(i, doc.numPages);
  }
  return rows;
}

window.PDFImport = { parseCatalogPdf };
