// Imágenes del carrusel de promociones del sitio público (no pertenecen a
// ningún semental). Lista abierta: si está vacía, el sitio no muestra nada.

export async function listPromotions(env) {
  const result = await env.DB.prepare('SELECT id, url FROM promotions ORDER BY position ASC, id ASC').all();
  return { promotions: result.results };
}

export async function addPromotion(env, url) {
  const clean = String(url ?? '').trim().slice(0, 500);
  if (!clean) { const err = new Error('Falta la URL de la imagen.'); err.status = 400; throw err; }
  const next = await env.DB.prepare('SELECT COALESCE(MAX(position), -1) + 1 AS next FROM promotions').first();
  await env.DB.prepare('INSERT INTO promotions(url, position, created_at) VALUES(?1, ?2, ?3)')
    .bind(clean, next.next, new Date().toISOString()).run();
  return listPromotions(env);
}

export async function deletePromotion(env, id) {
  await env.DB.prepare('DELETE FROM promotions WHERE id=?1').bind(id).run();
  return listPromotions(env);
}
