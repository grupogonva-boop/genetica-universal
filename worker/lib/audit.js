// Bitácora de cambios del admin: quién hizo qué y cuándo. Pensada para que
// solo el dueño (env.ADMIN_EMAIL) pueda leerla — ver la restricción en
// worker/index.js sobre /api/logs. Si el registro falla, nunca debe tumbar
// la operación real (crear/editar/borrar sí debe completarse igual).
export async function logAction(env, session, action, target, summary) {
  try {
    await env.DB.prepare('INSERT INTO audit_log(created_at, actor_email, action, target, summary) VALUES(?1,?2,?3,?4,?5)')
      .bind(new Date().toISOString(), session.email, action, target ?? null, summary ?? null)
      .run();
  } catch (error) {
    console.error(JSON.stringify({ message: 'audit log failed', action, target, error: error instanceof Error ? error.message : String(error) }));
  }
}

export async function listAuditLog(env, limit = 300) {
  const result = await env.DB.prepare('SELECT id, created_at, actor_email, action, target, summary FROM audit_log ORDER BY id DESC LIMIT ?1').bind(limit).all();
  return { logs: result.results };
}

// Compara dos objetos ya "shapeados" (los que devuelve la API, no las filas
// crudas de D1) y arma un resumen legible de qué campos cambiaron. Se
// ignoran los campos compuestos (arrays/objetos) y los de auditoría propios.
const DIFF_SKIP_FIELDS = new Set(['traits', 'ancestors', 'fotosExtra', 'genomic_data', 'updated_at', 'updated_by', 'created_at', 'import_id']);
export function diffSummary(before, after) {
  if (!before || !after) return null;
  const changes = [];
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  for (const key of keys) {
    if (DIFF_SKIP_FIELDS.has(key)) continue;
    const oldValue = before[key] ?? null;
    const newValue = after[key] ?? null;
    if (String(oldValue) !== String(newValue)) {
      changes.push(`${key}: ${oldValue === null || oldValue === '' ? '—' : oldValue} → ${newValue === null || newValue === '' ? '—' : newValue}`);
    }
  }
  if (!changes.length) return 'Sin cambios en los campos';
  const shown = changes.slice(0, 8);
  return shown.join('; ') + (changes.length > 8 ? ` (+${changes.length - 8} más)` : '');
}
