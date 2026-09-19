// Imágenes del carrusel de promociones del sitio público (no pertenecen a
// ningún semental). Lista abierta: si está vacía, el sitio no muestra nada.

function normalizeLink(linkUrl) {
  const trimmed = String(linkUrl ?? '').trim().slice(0, 500);
  if (!trimmed) return null;
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

export async function listPromotions(env) {
  const result = await env.DB.prepare('SELECT id, url, link_url FROM promotions ORDER BY position ASC, id ASC').all();
  return { promotions: result.results };
}

export async function addPromotion(env, url, linkUrl) {
  const clean = String(url ?? '').trim().slice(0, 500);
  if (!clean) { const err = new Error('Falta la URL de la imagen.'); err.status = 400; throw err; }
  const cleanLink = normalizeLink(linkUrl);
  const next = await env.DB.prepare('SELECT COALESCE(MAX(position), -1) + 1 AS next FROM promotions').first();
  await env.DB.prepare('INSERT INTO promotions(url, link_url, position, created_at) VALUES(?1, ?2, ?3, ?4)')
    .bind(clean, cleanLink, next.next, new Date().toISOString()).run();
  return listPromotions(env);
}

export async function updatePromotionLink(env, id, linkUrl) {
  const cleanLink = normalizeLink(linkUrl);
  await env.DB.prepare('UPDATE promotions SET link_url=?1 WHERE id=?2').bind(cleanLink, id).run();
  return listPromotions(env);
}

export async function deletePromotion(env, id) {
  await env.DB.prepare('DELETE FROM promotions WHERE id=?1').bind(id).run();
  return listPromotions(env);
}
