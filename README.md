# ERP Municipal San Pedro — Prototipo visual

Prototipo estático preparado para GitHub Pages. No utiliza Supabase ni requiere servidor.

## Alcance

- Portal institucional por dependencias.
- Secretaría General completamente navegable.
- Talento Humano: directorio, filtros, fichas, novedades y exportación CSV.
- Sistema Integrado de Gestión: documentos, riesgos, indicadores y planes de mejoramiento.
- Mesa de Ayuda TIC: radicación, filtros, vista tarjetas/tabla y trazabilidad.
- Calendario institucional: vista mensual, asignación, filtros y cumplimiento.
- Módulos generales para las demás secretarías y oficinas técnicas.

## Organización

Cada módulo y submódulo incluye:

- `index.html`
- `styles.css`
- `script.js`
- `data.json`

Los componentes visuales reutilizables están en `assets/css/base.css` y `assets/js/shell.js`.

## Publicar en GitHub Pages

1. Crear un repositorio nuevo.
2. Subir el contenido de esta carpeta a la rama `main`.
3. Entrar a **Settings → Pages**.
4. En **Build and deployment**, seleccionar **Deploy from a branch**.
5. Elegir la rama `main` y la carpeta `/ (root)`.
6. Guardar y abrir la URL publicada.

## Datos de demostración

Los archivos JSON contienen datos ficticios. Las solicitudes, novedades y actividades creadas desde la interfaz se guardan en `localStorage` del navegador.

## Próxima etapa

Reemplazar progresivamente la lectura JSON y `localStorage` por servicios de Supabase independientes por secretaría, conservando la interfaz actual.
