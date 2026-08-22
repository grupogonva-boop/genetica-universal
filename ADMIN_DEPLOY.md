# Publicar el administrador

El panel está preparado para `https://admin.geneticauniversal.com`. No debe usarse `www.admin.geneticauniversal.com`: `admin` ya es el subdominio.

## Arquitectura

- El sitio público continúa en GitHub Pages.
- El subdominio administrativo se sirve desde Cloudflare Workers.
- D1 guarda el catálogo normalizado (todos los campos de la ficha 360°, incluyendo `traits_json` y `ancestors_json`), expedientes genómicos e historial de importaciones.
- R2 (`genetica-universal-media`, dominio público `media.geneticauniversal.com`) guarda las fotos y PDFs que el cliente sube desde el editor.
- La contraseña se guarda como hash (PBKDF2-SHA256), nunca en texto plano; la firma de sesión también es secreto de Cloudflare. Ninguno vive en Git.
- SheetJS 0.20.3 está versionado localmente en `admin/vendor/` e interpreta `.xlsx`, `.xls` y `.csv` en el navegador antes de enviar datos normalizados (carga masiva). El editor de un solo semental (`admin/editor.html`) no depende de SheetJS.

## Requisitos

1. La zona `geneticauniversal.com` debe estar activa en la cuenta de Cloudflare.
2. Instalar Wrangler 4 en una máquina con espacio disponible: `npm install -D wrangler@latest`.
3. Autenticarse con `npx wrangler login`.

## Primera publicación

```bash
npx wrangler d1 create genetica-universal-admin
npx wrangler d1 migrations apply genetica-universal-admin --remote
npx wrangler r2 bucket create genetica-universal-media
npx wrangler r2 bucket domain add genetica-universal-media --domain media.geneticauniversal.com
node scripts/hash-admin-password.mjs "la-contraseña-del-cliente"
npx wrangler secret put ADMIN_EMAIL
npx wrangler secret put ADMIN_PASSWORD_SALT
npx wrangler secret put ADMIN_PASSWORD_HASH
npx wrangler secret put SESSION_SECRET
npx wrangler deploy
```

`node scripts/hash-admin-password.mjs "..."` imprime el salt y el hash correspondientes a la contraseña indicada — pega cada valor cuando Wrangler lo solicite de forma interactiva (`ADMIN_PASSWORD_SALT` primero, luego `ADMIN_PASSWORD_HASH`). Para `SESSION_SECRET`, genera una cadena aleatoria de al menos 48 bytes y pégala sólo en el prompt interactivo. Si el Worker ya tenía el secreto antiguo `ADMIN_PASSWORD` (texto plano), retíralo una vez confirmado que el login funciona con el hash: `npx wrangler secret delete ADMIN_PASSWORD`.

El dominio personalizado declarado en `wrangler.jsonc` crea el origen de `admin.geneticauniversal.com`. Si existe previamente un registro DNS con ese nombre, debe retirarse antes de asociar el Custom Domain. Lo mismo aplica para `media.geneticauniversal.com` con el bucket R2.

### Migrar el catálogo existente a D1 (una sola vez)

Antes de la primera publicación del editor, el catálogo vive únicamente en `assets/sires.js` / `assets/linear-traits.js`. Para llenar D1 con esos 49 sementales (incluyendo el `ficha_pdf_url` de cada PDF ya generado en `assets/media/fichas/`):

```bash
node scripts/seed-d1-from-static.mjs
npx wrangler d1 execute genetica-universal-admin --remote --file=worker/migrations/0003_seed_sires.sql
```

El script regenera `worker/migrations/0003_seed_sires.sql` (upsert idempotente por `codigo`, seguro de re-ejecutar). Revísalo en git antes de aplicarlo si el catálogo estático cambió desde la última migración.

## Desarrollo local

Crea un archivo `.dev.vars` —está ignorado por Git— con:

```text
ADMIN_EMAIL=correo@ejemplo.com
ADMIN_PASSWORD_SALT=salt-local
ADMIN_PASSWORD_HASH=hash-local
SESSION_SECRET=secreto-local-largo-y-aleatorio
```

Genera el par salt/hash local con `node scripts/hash-admin-password.mjs "contraseña-local"`. Después ejecuta las migraciones y el servidor local:

```bash
npx wrangler d1 migrations apply genetica-universal-admin --local
npx wrangler dev
```

No copies `.dev.vars` a producción ni lo subas al repositorio.

## Invitar usuarios adicionales del panel

El dueño (`ADMIN_EMAIL`/`ADMIN_PASSWORD_HASH`/`ADMIN_PASSWORD_SALT`) sigue autenticado por secretos de Cloudflare. Para invitar a alguien más sin tocar esos secretos, se usa la tabla `admin_users` en D1 — cada fila es una cuenta independiente con su propia contraseña, y `must_change_password=1` obliga a esa persona a capturar su propia contraseña en el primer acceso (el panel bloquea todo lo demás hasta que la cambien).

```bash
node scripts/hash-admin-password.mjs "contraseña-temporal"
npx wrangler d1 execute genetica-universal-admin --remote --command="INSERT INTO admin_users(email,password_hash,password_salt,must_change_password,created_at,updated_at) VALUES('correo@ejemplo.com','<hash>','<salt>',1,'2026-01-01T00:00:00.000Z','2026-01-01T00:00:00.000Z');"
```

Usa la fecha actual en formato ISO para `created_at`/`updated_at` (`node -e "console.log(new Date().toISOString())"`). Para revocar el acceso de alguien: `DELETE FROM admin_users WHERE email='correo@ejemplo.com';` con el mismo comando `d1 execute --remote`.

## Editor de sementales

`admin/index.html` lista el catálogo completo con acciones **Editar / Eliminar / Restaurar** por semental, más **+ Nuevo semental**. "Eliminar" es un soft-delete (`activo=0`, reversible con "Restaurar"); no borra el registro.

`admin/editor.html` es el formulario de alta/edición: identidad, pedigrí, producción, economía, salud/fertilidad, conformación funcional (incluye los 18 rasgos lineales), 3 zonas de carga (foto principal, foto de otro ángulo, PDF de ficha) y una lista abierta de fotos de familiares (relación + nombre + foto, se pueden agregar tantas como se necesiten). Incluye una vista previa en vivo de la ficha 360° tal como la verá el cliente en el sitio público (`admin/vendor/ficha-render.js` + `admin/vendor/ficha-preview.css`, copias mantenidas en sincronía con `assets/ficha-render.js` y las clases `.ficha-*`/`.catalog-*`/`.linear-*` de `assets/styles.css`).

La carga masiva por Excel (panel 01–03 de `admin/index.html`) se conserva para actualizar muchos sementales de golpe; sigue sin subir imágenes ni PDFs.

## Catálogo público

El Worker expone `GET /api/public/sires` con CORS limitado a los dominios públicos configurados, devolviendo el expediente completo de cada semental (incluye `traits`, `ancestors` ya parseados y `activo`). `assets/app.js` fusiona esos datos con el catálogo estático por `codigo`, agrega los sementales nuevos que no existan localmente y oculta los que tengan `activo:false`. Si el subdominio administrativo todavía no existe, tarda demasiado o devuelve un error/catálogo vacío, la web conserva automáticamente su catálogo local como respaldo.
