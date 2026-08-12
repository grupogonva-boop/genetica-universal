# Genética Universal

Sitio estático de asesoría genética bovina y catálogo de sementales.

## Estructura

- `index.html`: contenido semántico y secciones de la página.
- `assets/styles.css`: sistema visual, responsive y animaciones.
- `assets/app.js`: datos del catálogo, filtros, ordenamiento, ficha 360 y comportamiento.
- `assets/media/`: logos y fotografías; se sirven como archivos cacheables.
- `admin/`: panel protegido para importar Excel, mapear encabezados y validar sementales.
- `worker/`: API segura y migración D1 del administrador.
- `wrangler.jsonc`: despliegue de `admin.geneticauniversal.com` en Cloudflare.
- `catalogo-genetica-universal.pdf`: catálogo descargable.

## Desarrollo local

No requiere compilación ni dependencias. Desde la raíz:

```bash
python3 -m http.server 4173
```

Después abre `http://localhost:4173`.

## Edición rápida

- Los 19 sementales se encuentran en `TOROS`, al inicio de `assets/app.js`.
- El teléfono y los mensajes de WhatsApp están en `CONFIG`, en el mismo archivo.
- Los colores principales están como variables CSS al inicio de `assets/styles.css`.
- Los datos adicionales de la ficha 360 y todo el bloque de Genetics Lab son demostrativos; deben reemplazarse por evaluaciones oficiales antes de publicarse como resultados reales.

La publicación segura del administrador está documentada en `ADMIN_DEPLOY.md`. Las credenciales nunca deben agregarse al HTML, JavaScript, README o historial de Git.

## Decisión técnica

Se mantiene HTML/CSS/JavaScript sin framework porque la página actual es pequeña y principalmente informativa. Separar código e imágenes permite caché del navegador y evita que cada visita descargue un HTML Base64 de gran tamaño. Conviene migrar a un generador o framework sólo cuando el catálogo tenga un panel de administración, datos remotos, usuarios o varias rutas dinámicas.
