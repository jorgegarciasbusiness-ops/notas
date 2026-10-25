# Notas — tu app personal (sustituto de Notion)

*Nombre provisional. Empezada el 2026-10-25.*

## Qué hace
Sustituto de Notion hecho a tu medida. Sectores: Agenda, Bandeja, Páginas y Finanzas (Kok$, en camino). La app recuerda el último sector que abriste.

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

### Bandeja
- Para apuntar algo rápido, sobre todo desde el iPhone: escribes y pulsas **Apuntar**.
- Lo último sale arriba, con el día y la hora.
- Claude la vacía en cada sesión y pasa cada cosa a su sitio. La × borra una nota (pregunta antes).

### Páginas
- Documentos con títulos, listas, casillas y tablas, agrupados por **sección** (Finanzas, Kok$, Trabajo, Amor, Salud, Personal, General o la que escribas).
- **Ver**: pulsa una página. Las casillas se marcan directamente, sin entrar a editar.
- **Editar**: botón Editar. Los botones Título, N (negrita), Lista, Casilla y Tabla ponen el formato.
- **Nueva**: botón "+ Nueva". **Borrar**: dentro de Editar (pregunta antes).

### Finanzas
- **Resumen**: lo gastado esta semana contra el límite de 50 € (barra verde, amarilla al acercarte y roja si te pasas), las horas trabajadas del mes y tu **Plan de finanzas** (se edita en Páginas).
- **Gastos**: apunta cada gasto (importe, concepto, categoría y fecha) o el total de la semana. Se suman por semana, de lunes a domingo. Se pueden apuntar **por adelantado** (con fecha futura): salen como "Previsto" y cuentan en su semana. Al guardar, la app te lleva a la semana del gasto. A la derecha, las semanas con gastos previstos y las últimas 8. El Resumen avisa si la semana que viene ya tiene gastos previstos.
- **Horas**: cada turno con entrada y salida; las horas se calculan solas. Total del mes, para el parte del catering.
- **Ahorro**:
  - **Hucha**: un anillo con lo ahorrado hacia el objetivo de **10.000 €**. Cada vez que metes dinero, pulsas "+ Ingreso" y el anillo se actualiza. Si sacas dinero, el importe va en negativo.
  - **Nómina**: lo que cobras cada mes y a dónde va cada parte (Ahorro, Gastos fijos, Gastos variables, Libre o lo que escribas), con una barra de colores y el % de cada cosa. Avisa de lo que queda sin repartir. "Copiar el reparto" trae el del mes anterior para no escribirlo otra vez.
- Orden de las pestañas: Gastos · Horas · Ahorro · Resumen.

### Aspecto
- **Modo claro / oscuro**: botón abajo del menú en el PC y botón redondo arriba a la derecha en el móvil. Al principio sigue al PC o al iPhone; si lo cambias, se queda como lo dejaste.
- Iconos de **línea fina** (elegidos el 2026-10-25). Los iconos nuevos tienen que seguir el mismo estilo.

## Cómo se abre
- **En internet**: **https://jorgegarciasbusiness-ops.github.io/notas/**. Entras con tu correo y tu contraseña.
- **En el iPhone**: abre la dirección en Safari → botón Compartir → **Añadir a pantalla de inicio**. Queda como una app más, con su icono azul.
- **Modo prueba**: si `js/config.js` está vacío, la app guarda solo en el navegador de ese PC y trae datos de ejemplo.
- Al volver a la app, se recargan los datos (por si cambiaste algo en el otro aparato).

## Próximos pasos — pasar todo lo de Notion (plan aprobado el 2026-10-25)
1. ~~Agenda~~ (hecha, es el calendario principal).
2. ~~Bandeja + Páginas~~ (sectores hechos el 2026-10-25).
3. ~~Finanzas~~ (hecho el 2026-10-25: plan copiado a Páginas y los 6 turnos de octubre a Horas; el gasto semanal de Notion estaba vacío).
4. **Kok$**: calendario de contenido y páginas estado, marketing y lanzamientos.
5. Cambiar al secretario (resumen, revisión del domingo, contrato) para que todo use la app. Revisión semanal → una página de la app.
- El **historial** (candidaturas, PROYECTOS, ALMOALB, Blaziken, Calendario viejo) se queda en Notion (plan gratis); no se pasa.


## Para Claude (detalles técnicos)
- Web sin instalación: HTML, CSS y JavaScript sueltos, sin herramientas de compilación. Supabase se carga desde jsDelivr (versión fija en `index.html`).
- `js/datos.js` es la única pieza que guarda datos: nube (Supabase) si `js/config.js` tiene URL y clave **publishable**; si no, `localStorage` con ejemplos. Nunca poner la clave secreta.
- Esquema de la nube en `nube/` (un `.sql` por cambio, numerados). Acceso por fila: cada usuario solo ve lo suyo.
- Usuario: lo crea Koke en Supabase (Authentication → Users → Add user). Registro público desactivado.
- Nube: proyecto Supabase **notas** (organización "Koke", plan gratis, Europa) · `https://dvsnwwabycgpeqgqpvgj.supabase.co`. Registro público desactivado.
- Publicación: GitHub Pages desde `github.com/jorgegarciasbusiness-ops/notas` (público: el código se ve, los datos no). Rama `main`, raíz.
- **Versión**: GitHub Pages deja los archivos en caché 10 min y el iPhone se queda con la versión vieja. Con cada publicación se sube el número en `index.html` (`VERSION` y todos los `?v=`) y en `version.json`; la app compara al abrirse y al volver a ella, y si hay una nueva se recarga sola. `version.json` se sube el último.
- Cómo publicar cambios: no hay git en local con sesión de GitHub. Se copian los archivos cambiados al scratchpad y se suben con Claude in Chrome (sesión de Koke) en `github.com/jorgegarciasbusiness-ops/notas/upload/main/<carpeta>`. `IDEA.md` no se sube (notas privadas).
- Si se cambia algo de la base de datos: nuevo `nube/NN-*.sql`, ejecutarlo en el editor SQL de Supabase y subirlo también al repositorio.
- Cada sector es un archivo en `js/` con `montar()` y `refrescar()`; se registra en `js/app.js` y en el menú de `index.html`. `app.js` limpia `onclick/onsubmit/onmousedown` del contenedor al cambiar de sector.
- Tablas: `agenda`, `bandeja` (texto, creado), `paginas` (titulo, seccion, contenido en Markdown, orden), `gastos` (fecha, importe, concepto, categoria), `horas` (fecha, entrada, salida, horas, trabajo, nota), `ahorros` (fecha, importe, nota), `nominas` (mes = día 1, neto; una por mes), `nomina_partidas` (mes, concepto, importe). Objetivo de ahorro (10.000 €) en `js/finanzas.js`. Koke apunta él la nómina y el reparto el primer mes; cuando se repita, el secretario puede apuntarlos (con su OK). El límite semanal (50 €) está en `js/finanzas.js`; el resumen muestra la página de sección Finanzas cuyo título empieza por "Plan". En Markdown, usar `≈` y no `~` (la virgulilla tacha texto). En `datos.js` se añaden en `TABLAS` y en el `return` de nube y local.
- Páginas: Markdown con `marked` + `DOMPurify` (jsDelivr, versión fija). El secretario puede escribir páginas directamente en Markdown (tablas GFM, `- [ ]` casillas).
- Iconos de la app en `iconos/`: una **K** blanca gruesa sobre azul (elegida por Koke, 2026-10-25).
