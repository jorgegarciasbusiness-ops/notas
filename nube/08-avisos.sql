-- Avisos (notificaciones) de la agenda.
-- aviso_min: minutos antes del inicio (vacío = sin aviso). Los eventos sin hora avisan respecto a las 9:00.
-- avisado_en: cuándo se mandó el aviso (se vacía si cambia la fecha, la hora o el aviso).

alter table public.agenda add column if not exists aviso_min integer check (aviso_min is null or aviso_min >= 0);
alter table public.agenda add column if not exists avisado_en timestamptz;

-- Aparatos que reciben avisos (uno por navegador o iPhone donde se activaron)
create table if not exists public.push_suscripciones (
  id       uuid primary key default gen_random_uuid(),
  user_id  uuid not null default auth.uid() references auth.users (id) on delete cascade,
  endpoint text not null unique,
  p256dh   text not null,
  auth     text not null,
  aparato  text not null default '',
  creado   timestamptz not null default now()
);
alter table public.push_suscripciones enable row level security;
create policy "Cada uno ve lo suyo" on public.push_suscripciones
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Claves para firmar los avisos. Las crea la función "avisos" la primera vez; nadie más puede leerlas.
create table if not exists public.push_claves (
  id      integer primary key default 1 check (id = 1),
  publica text not null,
  privada text not null,
  creado  timestamptz not null default now()
);
alter table public.push_claves enable row level security;
revoke all on public.push_claves from anon, authenticated;

-- La app solo necesita la parte pública
create or replace function public.clave_publica_push() returns text
language sql stable security definer set search_path = public
as $$ select publica from public.push_claves where id = 1 $$;
revoke all on function public.clave_publica_push() from public, anon;
grant execute on function public.clave_publica_push() to authenticated;

-- Avisos que tocan ahora (como mucho con 2 horas de retraso, para no avisar de cosas viejas)
create or replace function public.avisos_pendientes()
returns table (id uuid, user_id uuid, nombre text, fecha date, hora time, ambito text, aviso_min integer)
language sql stable security definer set search_path = public
as $$
  select a.id, a.user_id, a.nombre, a.fecha, a.hora, a.ambito, a.aviso_min
  from public.agenda a
  where a.aviso_min is not null
    and a.avisado_en is null
    and a.estado not in ('Listo', 'Cancelado')
    and ((a.fecha + coalesce(a.hora, time '09:00')) at time zone 'Europe/Madrid') - make_interval(mins => a.aviso_min) <= now()
    and ((a.fecha + coalesce(a.hora, time '09:00')) at time zone 'Europe/Madrid') - make_interval(mins => a.aviso_min) > now() - interval '2 hours'
$$;
revoke all on function public.avisos_pendientes() from public, anon, authenticated;

-- La función que activa la seguridad por filas sola no tiene por qué poder llamarla nadie desde fuera
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;

-- Cada minuto, la base de datos llama a la función "avisos" (código en nube/funciones/avisos/)
create extension if not exists pg_cron;
create extension if not exists pg_net;
select cron.unschedule('avisos-agenda') where exists (select 1 from cron.job where jobname = 'avisos-agenda');
select cron.schedule('avisos-agenda', '* * * * *', $cron$
  select net.http_post(
    url := 'https://dvsnwwabycgpeqgqpvgj.supabase.co/functions/v1/avisos',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  )
$cron$);
