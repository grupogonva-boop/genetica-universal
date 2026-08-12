# Publicar el administrador

El panel está preparado para `https://admin.geneticauniversal.com`. No debe usarse `www.admin.geneticauniversal.com`: `admin` ya es el subdominio.

## Arquitectura

- El sitio público continúa en GitHub Pages.
- El subdominio administrativo se sirve desde Cloudflare Workers.
- D1 guarda el catálogo normalizado, expedientes genómicos e historial de importaciones.
- La contraseña y la firma de sesión son secretos de Cloudflare; nunca viven en Git.
- SheetJS 0.20.3 está versionado localmente en `admin/vendor/` e interpreta `.xlsx`, `.xls` y `.csv` en el navegador antes de enviar datos normalizados.

## Requisitos

1. La zona `geneticauniversal.com` debe estar activa en la cuenta de Cloudflare.
2. Instalar Wrangler 4 en una máquina con espacio disponible: `npm install -D wrangler@latest`.
3. Autenticarse con `npx wrangler login`.

## Primera publicación

```bash
npx wrangler d1 create genetica-universal-admin
npx wrangler d1 migrations apply genetica-universal-admin --remote
npx wrangler secret put ADMIN_PASSWORD
npx wrangler secret put SESSION_SECRET
npx wrangler deploy
```

Wrangler solicitará cada secreto de forma interactiva. Para `ADMIN_PASSWORD`, usa la contraseña temporal entregada al propietario y cámbiala después del primer acceso. Para `SESSION_SECRET`, genera una cadena aleatoria de al menos 48 bytes y pégala sólo en el prompt interactivo.

El dominio personalizado declarado en `wrangler.jsonc` crea el origen de `admin.geneticauniversal.com`. Si existe previamente un registro DNS con ese nombre, debe retirarse antes de asociar el Custom Domain.

## Desarrollo local

Crea un archivo `.dev.vars` —está ignorado por Git— con:

```text
ADMIN_PASSWORD=contraseña-local
SESSION_SECRET=secreto-local-largo-y-aleatorio
```

Después ejecuta las migraciones y el servidor local:

```bash
npx wrangler d1 migrations apply genetica-universal-admin --local
npx wrangler dev
```

No copies `.dev.vars` a producción ni lo subas al repositorio.

## Catálogo público

El Worker expone `GET /api/public/sires` con CORS limitado a los dominios públicos configurados. `assets/app.js` ya apunta a esa fuente y la activa únicamente en el dominio de producción. Si el subdominio administrativo todavía no existe, tarda demasiado o devuelve un error, la web conserva automáticamente su catálogo local como respaldo.
