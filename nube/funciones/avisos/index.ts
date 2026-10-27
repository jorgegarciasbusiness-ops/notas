// Función "avisos" de Supabase: la base de datos la llama cada minuto (pg_cron).
// Busca los eventos de la agenda cuyo aviso toca ahora y manda la notificación a cada aparato apuntado.
// Con {"prueba": true, "endpoint": "…"} manda un aviso de prueba solo a ese aparato.
// Las claves para firmar los avisos (VAPID) las crea ella misma la primera vez y las guarda en push_claves.
import webpush from "npm:web-push@3.6.7";
import { createClient } from "jsr:@supabase/supabase-js@2";

const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const APP = "https://jorgegarciasbusiness-ops.github.io/notas/";

async function claves(): Promise<{ publica: string; privada: string }> {
  const { data } = await sb.from("push_claves").select("publica, privada").eq("id", 1).maybeSingle();
  if (data) return data;
  const k = webpush.generateVAPIDKeys();
  const fila = { id: 1, publica: k.publicKey, privada: k.privateKey };
  const { error } = await sb.from("push_claves").insert(fila);
  if (error) {
    // Otra llamada las creó a la vez: se usan esas
    const { data: otra } = await sb.from("push_claves").select("publica, privada").eq("id", 1).single();
    return otra!;
  }
  return fila;
}

// Fecha de hoy en Madrid, "AAAA-MM-DD"
const hoyMadrid = (desplazar = 0) => {
  const d = new Date(Date.now() + desplazar * 86400000);
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Madrid" }).format(d);
};

function cuando(a: { fecha: string; hora: string | null; ambito: string }) {
  const hora = a.hora ? ` a las ${a.hora.slice(0, 5)}` : " (todo el día)";
  let dia: string;
  if (a.fecha === hoyMadrid()) dia = "Hoy";
  else if (a.fecha === hoyMadrid(1)) dia = "Mañana";
  else {
    const [y, m, d] = a.fecha.split("-").map(Number);
    dia = new Intl.DateTimeFormat("es-ES", { weekday: "long", day: "numeric", month: "short", timeZone: "UTC" })
      .format(new Date(Date.UTC(y, m - 1, d)));
    dia = dia.charAt(0).toUpperCase() + dia.slice(1);
  }
  return `${dia}${hora} · ${a.ambito}`;
}

async function enviar(s: { id: string; endpoint: string; p256dh: string; auth: string }, cuerpo: string) {
  try {
    await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, cuerpo, { TTL: 3600 });
    return true;
  } catch (e) {
    // El aparato ya no existe o quitó el permiso: se borra
    const codigo = (e as { statusCode?: number }).statusCode;
    if (codigo === 404 || codigo === 410) await sb.from("push_suscripciones").delete().eq("id", s.id);
    return false;
  }
}

Deno.serve(async (req) => {
  const k = await claves();
  webpush.setVapidDetails(APP, k.publica, k.privada);

  let pedido: { prueba?: boolean; endpoint?: string } = {};
  try { pedido = await req.json(); } catch { /* sin cuerpo */ }

  if (pedido.prueba && pedido.endpoint) {
    const { data: s } = await sb.from("push_suscripciones").select("*").eq("endpoint", pedido.endpoint).maybeSingle();
    if (!s) return Response.json({ ok: false, motivo: "aparato no apuntado" }, { status: 404 });
    const ok = await enviar(s, JSON.stringify({ titulo: "Avisos activados", texto: "Así te llegarán los recordatorios de tu agenda.", url: APP }));
    return Response.json({ ok });
  }

  const { data: avisos, error } = await sb.rpc("avisos_pendientes");
  if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });

  let enviados = 0;
  for (const a of avisos ?? []) {
    const { data: subs } = await sb.from("push_suscripciones").select("*").eq("user_id", a.user_id);
    const cuerpo = JSON.stringify({ titulo: a.nombre, texto: cuando(a), url: APP, tag: a.id });
    for (const s of subs ?? []) if (await enviar(s, cuerpo)) enviados++;
    await sb.from("agenda").update({ avisado_en: new Date().toISOString() }).eq("id", a.id);
  }
  return Response.json({ ok: true, avisos: avisos?.length ?? 0, enviados });
});
