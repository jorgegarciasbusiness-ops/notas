# Notas — tu app personal (sustituto de Notion)

*Nombre provisional. Empezada el 2026-10-25.*

## Qué hace
Sustituto de Notion hecho a tu medida. Sectores: Agenda, Bandeja, Páginas, Finanzas y Kok$. La app recuerda el último sector que abriste.

### Agenda
- **Mes**: calendario con un color por ámbito. Pulsa un día para ver lo que tiene debajo (o a la derecha en el PC).
- **Semana**: los 7 días de la semana, de lunes a domingo, con sus entradas.
- **Tablero**: una columna por ámbito con todo lo pendiente, ordenado por fecha.
- **Filtros**: los botones de colores de arriba ocultan o muestran un ámbito.
- **Ocultar pasadas** (primer botón de los filtros, activado por defecto): esconde todo lo de días anteriores a hoy, en todas las vistas. Muestra cuántas hay ocultas; púlsalo para verlas otra vez. Se recuerda en cada aparato. El resumen de la mañana sigue avisando de lo vencido sin hacer.
- **Crear**: botón "+ Nueva" (en el móvil, el botón azul redondo) o "+ Añadir" en un día.
- **Editar o borrar**: pulsa una entrada.
- **Hecho**: pulsa el cuadradito de la izquierda.
- Cada entrada tiene: nombre, cuándo empieza (fecha y hora opcional), **cuándo termina** (fecha y hora opcionales), ámbito, tipo, prioridad, estado y notas.
- **Eventos con inicio y fin**: si dura varias horas, pon la hora de fin ("17:00–19:30"). Si dura varios días, pon la fecha en "Termina": sale en cada día que dura, con "lun 27 oct 18:00 → jue 30 oct". "Ocultar pasadas" y "Atrasada" cuentan por el día en que termina. En Mes y Semana, los días que ocupa un evento de varios días salen **teñidos con el color de su ámbito**.
- **Arrastrar a otro día** (Mes y Semana): en el PC, coge el bloque con el ratón y suéltalo en otro día; en el móvil, **mantén pulsado medio segundo** y arrastra (deslizar normal sigue moviendo la pantalla). Sirve con las etiquetas del mes, las tarjetas de la lista del día y las de la semana. Conserva la hora; un evento de varios días se mueve entero; el aviso vuelve a quedar pendiente.
- Ámbitos: Trabajo (azul), Kok$ (morado), Amor (rosa), Salud (verde), Finanzas (amarillo), Curros (naranja), **Viajes (turquesa, desde 2026-10-27)** y Personal (gris).
- Lo atrasado (sin hacer y con fecha pasada) sale marcado en rojo.

### Turnos de trabajo (día pintado de azul)
- Una entrada es **turno** si es del ámbito **Trabajo** y su nombre lleva la palabra **"turno"** (por ejemplo "Turno Led&Go"). Se apunta como cualquier otra entrada, un turno por día trabajado.
- En el **Mes** el turno no lleva punto ni etiqueta: el día entero sale **pintado de azul**, para ver de un vistazo qué días trabajas. En la lista del día y en la **Semana** sale como tarjeta normal, con su horario.
- Si coinciden un turno y un evento de varios días (un viaje), el día toma el color del que se creó antes.
- Un turno pasado sin marcar no sale como "Atrasada". Un turno cancelado no pinta el día.
- Las **rutinas** (entradas que se repetían cada semana) se quitaron el 2026-10-30: el horario de Led&Go hasta el 13-nov pasó a turnos sueltos.

### Avisos (notificaciones)
- Cada evento tiene **"Avísame"**: sin aviso, a la hora, 15 min, 30 min, 1 h, 2 h o 1 día antes. Los nuevos vienen con **1 h antes**. Si no tiene hora, cuenta desde las 9:00 de ese día. Los eventos con aviso llevan una campanita.
- Para recibirlos, pulsa **"Activar avisos"** (en el PC, abajo del menú; en el iPhone, la campana de arriba a la derecha) y acepta el permiso. Te llega uno de prueba. Hay que activarlo **en cada aparato** (el iPhone con la app en la pantalla de inicio).
- Si cambias la fecha, la hora o el aviso de un evento, vuelve a avisar. Lo que ya está "Listo" o "Cancelado" no avisa.
- Pulsar el botón otra vez los quita en ese aparato.

### Bandeja
- Para apuntar algo rápido, sobre todo desde el iPhone: escribes y pulsas **Apuntar**.
- **Dictar**: pulsa el micro, habla, y lo que dices se va escribiendo en la caja. Pulsa el micro otra vez para parar, revisa y **Apuntar**. La voz la pasa a texto el propio navegador (no se guarda ningún audio). Si en el iPhone no funciona dentro de la app, el micro del teclado hace lo mismo.
- En el PC, Intro apunta y Mayús+Intro cambia de línea.
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
  - **Objetivos**: metas propias (nombre, cuánto y, si quieres, para cuándo). Cada una con su barra, lo que falta y, si tiene fecha, cuánto apartar al mes para llegar. Al apuntar un ingreso eliges "Para" qué objetivo es (o la hucha general). Todo suma para la hucha general.
  - **Nómina**: lo que cobras cada mes y a dónde va cada parte (Ahorro, Gastos fijos, Gastos variables, Libre o lo que escribas), con una barra de colores y el % de cada cosa. Avisa de lo que queda sin repartir. "Copiar el reparto" trae el del mes anterior para no escribirlo otra vez.
- Orden de las pestañas: Gastos · Horas · Ahorro · Resumen.

### Kok$
- **Tablero**: una columna por estado (Idea → Por grabar → Grabado → Editado → Programado → Publicado). El botón **›** de cada pieza la pasa al siguiente estado.
- **Lista**: próximas, retrasadas (fecha pasada sin publicar, en rojo) y publicadas con sus vistas.
- **Ocultar pasadas** (activado por defecto): en Tablero y Lista esconde las piezas con fecha anterior a hoy (las que no tienen fecha se ven siempre). Púlsalo para verlas.
- **Páginas**: Estado de Kok$, Marketing y una por lanzamiento (se editan en Páginas, sección Kok$).
- Cada pieza: nombre, fecha, redes (TikTok, Instagram, YouTube), formato, tema, estado, vistas, enlace y notas.

### Aspecto
- **Modo claro / oscuro**: botón abajo del menú en el PC y botón redondo arriba a la derecha en el móvil. Al principio sigue al PC o al iPhone; si lo cambias, se queda como lo dejaste.
- Iconos de **línea fina** (elegidos el 2026-10-25). Los iconos nuevos tienen que seguir el mismo estilo.

## Cómo se abre
- **En internet**: **https://jorgegarciasbusiness-ops.github.io/notas/**. Entras con tu correo y tu contraseña.
- **En el PC**: acceso directo **Notas** en el Escritorio. Abre la app en su propia ventana (sin pestañas ni barra de direcciones).
- **En el iPhone**: abre la dirección en Safari → botón Compartir → **Añadir a pantalla de inicio**. Queda como una app más, con su icono azul.
- **Modo prueba**: si `js/config.js` está vacío, la app guarda solo en el navegador de ese PC y trae datos de ejemplo.
- Al volver a la app, se recargan los datos (por si cambiaste algo en el otro aparato).

## Próximos pasos — pasar todo lo de Notion (plan aprobado el 2026-10-25)
1. ~~Agenda~~ (hecha, es el calendario principal).
2. ~~Bandeja + Páginas~~ (sectores hechos el 2026-10-25).
3. ~~Finanzas~~ (hecho el 2026-10-25: plan copiado a Páginas y los 6 turnos de octubre a Horas; el gasto semanal de Notion estaba vacío).
4. ~~Kok$~~ (hecho el 2026-10-27: 20 piezas del calendario de contenido y 3 páginas copiadas).
5. ~~Cambiar al secretario~~ para todo (hecho el 2026-10-27). Notion queda solo como historial.
- El **historial** (candidaturas, PROYECTOS, ALMOALB, Blaziken, Calendario viejo) se queda en Notion (plan gratis); no se pasa.


## Para Claude (detalles técnicos)
- Web sin instalación: HTML, CSS y JavaScript sueltos, sin herramientas de compilación. Supabase se carga desde jsDelivr (versión fija en `index.html`).
- `js/datos.js` es la única pieza que guarda datos: nube (Supabase) si `js/config.js` tiene URL y clave **publishable**; si no, `localStorage` con ejemplos. Nunca poner la clave secreta.
- Esquema de la nube en `nube/` (un `.sql` por cambio, numerados). Acceso por fila: cada usuario solo ve lo suyo.
- Usuario: lo crea Koke en Supabase (Authentication → Users → Add user). Registro público desactivado.
- Nube: proyecto Supabase **notas** (organización "Koke", plan gratis, Europa) · `https://dvsnwwabycgpeqgqpvgj.supabase.co`. Registro público desactivado.
- Publicación: GitHub Pages desde `github.com/jorgegarciasbusiness-ops/notas` (público: el código se ve, los datos no). Rama `main`, raíz.
- **Versión**: GitHub Pages deja los archivos en caché 10 min y el iPhone se queda con la versión vieja. Con cada publicación se sube el número en `index.html` (`VERSION` y todos los `?v=`) y en `version.json`; la app compara al abrirse y al volver a ella, y si hay una nueva se recarga sola. `version.json` se sube el último.
- Cómo publicar cambios: no hay git en local con sesión de GitHub. Se copian los archivos cambiados al scratchpad y se suben con Claude in Chrome (sesión de Koke) en `github.com/jorgegarciasbusiness-ops/notas/upload/main/<carpeta>`. `IDEA.md` y la carpeta `copias/` (copias de datos antes de cambiarlos) no se suben: son privadas.
- Si se cambia algo de la base de datos: nuevo `nube/NN-*.sql`, ejecutarlo en el editor SQL de Supabase y subirlo también al repositorio.
- Cada sector es un archivo en `js/` con `montar()` y `refrescar()`; se registra en `js/app.js` y en el menú de `index.html`. `app.js` limpia `onclick/onsubmit/onmousedown` del contenedor al cambiar de sector.
- **Avisos**: `sw.js` (receptor de notificaciones; no guarda copias de la app) + `js/avisos.js` (botón y alta del aparato en `push_suscripciones`). La función de Supabase **avisos** (código en `nube/funciones/avisos/index.ts`, `verify_jwt` desactivado: no devuelve datos) la llama `pg_cron` cada minuto; usa `avisos_pendientes()` y marca `agenda.avisado_en`. Sus claves VAPID las creó ella misma en `push_claves` (nadie más puede leerlas). Para redesplegarla: herramienta `deploy_edge_function` del conector de Supabase.
- Arrastrar: `data-arrastre` (id) en píldoras y tarjetas, `data-soltar` (fecha) en días de Mes y Semana. Ratón con pointer events (empieza a 6 px); dedo con touch events y pulsación larga de 450 ms (`touchmove` no pasivo para frenar el desplazamiento). Mueve `fecha` y `fecha_fin` los mismos días y pone `avisado_en` a null.
- Turnos: `esTurno` (ámbito Trabajo + /turno/i en el nombre, no cancelado) tiñe el día como los de varios días (`deVariosDias`, gana el `creado` más antiguo) y no lleva píldora en Mes. La tabla `rutinas` sigue en la nube pero la app ya no la lee (copia en `copias/2026-10-30-rutinas-antes-de-turnos.json`).
- Tablas: `agenda` (con `fecha_fin` y `hora_fin` opcionales desde 2026-10-27, y `aviso_min` / `avisado_en`), `bandeja` (texto, creado), `paginas` (titulo, seccion, contenido en Markdown, orden), `gastos` (fecha, importe, concepto, categoria), `horas` (fecha, entrada, salida, horas, trabajo, nota), `ahorros` (fecha, importe, nota, objetivo_id opcional), `objetivos` (nombre, importe, fecha_limite opcional), `contenido` (pieza, fecha, redes text[], formato, tema, estado, enlace, vistas, notas), `nominas` (mes = día 1, neto; una por mes), `nomina_partidas` (mes, concepto, importe). Objetivo de ahorro (10.000 €) en `js/finanzas.js`. Koke apunta él la nómina y el reparto el primer mes; cuando se repita, el secretario puede apuntarlos (con su OK). El límite semanal (50 €) está en `js/finanzas.js`; el resumen muestra la página de sección Finanzas cuyo título empieza por "Plan". En Markdown, usar `≈` y no `~` (la virgulilla tacha texto). En `datos.js` se añaden en `TABLAS` y en el `return` de nube y local.
- Páginas: Markdown con `marked` + `DOMPurify` (jsDelivr, versión fija). El secretario puede escribir páginas directamente en Markdown (tablas GFM, `- [ ]` casillas).
- Iconos de la app en `iconos/`: una **K** blanca gruesa sobre azul (elegida por Koke, 2026-10-25).
