# Notas — tu app de agenda (y pronto, finanzas)

*Nombre provisional. Empezada el 2026-10-25.*

## Qué hace
Sustituto de Notion hecho a tu medida. Por ahora tiene un sector:

### Agenda
- **Mes**: calendario con un color por ámbito. Pulsa un día para ver lo que tiene debajo (o a la derecha en el PC).
- **Semana**: los 7 días de la semana, de lunes a domingo, con sus entradas.
- **Tablero**: una columna por ámbito con todo lo pendiente, ordenado por fecha.
- **Filtros**: los botones de colores de arriba ocultan o muestran un ámbito.
- **Crear**: botón "+ Nueva" (en el móvil, el botón azul redondo) o "+ Añadir" en un día.
- **Editar o borrar**: pulsa una entrada.
- **Hecho**: pulsa el cuadradito de la izquierda.
- Cada entrada tiene: nombre, fecha, hora (opcional), ámbito, tipo, prioridad, estado y notas. Son los mismos campos que el Calendario de Notion.
- Lo atrasado (sin hacer y con fecha pasada) sale marcado en rojo.

### Aspecto
- **Modo claro / oscuro**: botón abajo del menú en el PC y botón redondo arriba a la derecha en el móvil. Al principio sigue al PC o al iPhone; si lo cambias, se queda como lo dejaste.
- Iconos de **línea fina** (elegidos el 2026-10-25). Los iconos nuevos tienen que seguir el mismo estilo.

## Cómo se abre
- **En internet** (cuando esté publicada): la dirección web de la app. Entras con tu correo y tu contraseña.
- **En el iPhone**: abre la dirección en Safari → botón Compartir → **Añadir a pantalla de inicio**. Queda como una app más, con su icono azul.
- **Modo prueba**: si `js/config.js` está vacío, la app guarda solo en el navegador de ese PC y trae datos de ejemplo.
- Al volver a la app, se recargan los datos (por si cambiaste algo en el otro aparato).

## Próximos pasos
1. ~~Ajustar la Agenda a tu gusto.~~
2. Subirla a internet (cuentas gratis de GitHub y Supabase, creadas por Koke). *En marcha.*
3. Pasar tu Agenda de Notion.
4. Sector de Finanzas.

## Para Claude (detalles técnicos)
- Web sin instalación: HTML, CSS y JavaScript sueltos, sin herramientas de compilación. Supabase se carga desde jsDelivr (versión fija en `index.html`).
- `js/datos.js` es la única pieza que guarda datos: nube (Supabase) si `js/config.js` tiene URL y clave **publishable**; si no, `localStorage` con ejemplos. Nunca poner la clave secreta.
- Esquema de la nube en `nube/` (un `.sql` por cambio, numerados). Acceso por fila: cada usuario solo ve lo suyo.
- Usuario: lo crea Koke en Supabase (Authentication → Users → Add user). Registro público desactivado.
- Publicación: GitHub Pages desde el repositorio (público: el código se ve, los datos no).
- Cada sector es un archivo en `js/` con `montar()` y `refrescar()`; se registra en `js/app.js` y en el menú de `index.html`.
- Iconos de la app en `iconos/`: una **K** blanca de trazo fino sobre azul (petición de Koke, 2026-10-25).
