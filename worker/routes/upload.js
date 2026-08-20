const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_PDF_BYTES = 15 * 1024 * 1024;
const SLOTS = new Set(['main', 'alt', 'ancestor', 'ficha']);
const PUBLIC_MEDIA_BASE = 'https://media.geneticauniversal.com/';

// Detecta el tipo real por los primeros bytes del archivo — no confiamos en
// el Content-Type que manda el navegador, puede venir mal o falsificado.
function sniffType(bytes) {
  const b = bytes.subarray(0, 12);
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return { ext: 'jpg', mime: 'image/jpeg', kind: 'image' };
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return { ext: 'png', mime: 'image/png', kind: 'image' };
  if (b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) return { ext: 'webp', mime: 'image/webp', kind: 'image' };
  if (b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46) return { ext: 'pdf', mime: 'application/pdf', kind: 'pdf' };
  return null;
}

async function shortHash(bytes) {
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest).slice(0, 6)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function handleUpload(request, env, session) {
  const form = await request.formData();
  const codigo = String(form.get('codigo') || '').trim().toUpperCase();
  const slot = String(form.get('slot') || '');
  const file = form.get('file');

  if (!/^[A-Z0-9]{3,20}$/.test(codigo)) { const e = new Error('Código de semental inválido.'); e.status = 400; throw e; }
  if (!SLOTS.has(slot)) { const e = new Error('Tipo de archivo desconocido.'); e.status = 400; throw e; }
  if (!(file instanceof File)) { const e = new Error('No se recibió ningún archivo.'); e.status = 400; throw e; }

  const buffer = new Uint8Array(await file.arrayBuffer());
  const type = sniffType(buffer);
  if (!type) { const e = new Error('El archivo no es una imagen (JPG/PNG/WEBP) ni un PDF válido.'); e.status = 400; throw e; }
  if (slot === 'ficha' && type.kind !== 'pdf') { const e = new Error('La ficha descargable debe ser un PDF.'); e.status = 400; throw e; }
  if (slot !== 'ficha' && type.kind !== 'image') { const e = new Error('Esta foto debe ser JPG, PNG o WEBP.'); e.status = 400; throw e; }
  const maxBytes = type.kind === 'pdf' ? MAX_PDF_BYTES : MAX_IMAGE_BYTES;
  if (buffer.byteLength > maxBytes) { const e = new Error(`El archivo supera el máximo de ${Math.round(maxBytes / 1024 / 1024)} MB.`); e.status = 400; throw e; }

  const key = slot === 'ficha'
    ? `fichas/${codigo}.pdf`
    : `bulls/${codigo}/${slot}-${await shortHash(buffer)}.${type.ext}`;

  await env.MEDIA.put(key, buffer, {
    httpMetadata: { contentType: type.mime, cacheControl: slot === 'ficha' ? 'public, max-age=3600' : 'public, max-age=31536000, immutable' },
    customMetadata: { uploadedBy: session.email, uploadedAt: new Date().toISOString() },
  });

  return { url: PUBLIC_MEDIA_BASE + key, key };
}
