// Logos de "Partners y proveedores" del pie de página del sitio público.
// Lista abierta y editable desde admin: si está vacía, esa sección no se
// muestra.

function shapeRow(row) {
  return { ...row, featured: Boolean(row.featured) };
}

function normalizeLink(linkUrl) {
  const trimmed = String(linkUrl ?? '').trim().slice(0, 500);
  if (!trimmed) return null;
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

export async function listPartners(env) {
  const result = await env.DB.prepare(
    'SELECT id, name, image_url, link_url, badge, featured FROM partners ORDER BY position ASC, id ASC'
  ).all();
  return { partners: result.results.map(shapeRow) };
}

export async function addPartner(env, body) {
  const name = String(body.name ?? '').trim().slice(0, 120);
  const imageUrl = String(body.imageUrl ?? '').trim().slice(0, 500);
  if (!imageUrl) { const err = new Error('Falta la imagen del partner.'); err.status = 400; throw err; }
  if (!name) { const err = new Error('Falta el nombre del partner.'); err.status = 400; throw err; }
  const linkUrl = normalizeLink(body.linkUrl);
  const badge = String(body.badge ?? '').trim().slice(0, 12) || null;
  const featured = body.featured ? 1 : 0;
  const next = await env.DB.prepare('SELECT COALESCE(MAX(position), -1) + 1 AS next FROM partners').first();
  await env.DB.prepare('INSERT INTO partners(name, image_url, link_url, badge, featured, position, created_at) VALUES(?1,?2,?3,?4,?5,?6,?7)')
    .bind(name, imageUrl, linkUrl, badge, featured, next.next, new Date().toISOString()).run();
  return listPartners(env);
}

export async function updatePartner(env, id, body) {
  const name = String(body.name ?? '').trim().slice(0, 120);
  const imageUrl = String(body.imageUrl ?? '').trim().slice(0, 500);
  if (!imageUrl) { const err = new Error('Falta la imagen del partner.'); err.status = 400; throw err; }
  if (!name) { const err = new Error('Falta el nombre del partner.'); err.status = 400; throw err; }
  const linkUrl = normalizeLink(body.linkUrl);
  const badge = String(body.badge ?? '').trim().slice(0, 12) || null;
  const featured = body.featured ? 1 : 0;
  await env.DB.prepare('UPDATE partners SET name=?1, image_url=?2, link_url=?3, badge=?4, featured=?5 WHERE id=?6')
    .bind(name, imageUrl, linkUrl, badge, featured, id).run();
  return listPartners(env);
}

export async function deletePartner(env, id) {
  await env.DB.prepare('DELETE FROM partners WHERE id=?1').bind(id).run();
  return listPartners(env);
}
