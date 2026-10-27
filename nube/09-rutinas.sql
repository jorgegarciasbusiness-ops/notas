-- Rutinas: entradas de la agenda que se repiten cada semana (horario de trabajo, entrenos…).
-- No se guardan día a día: la app las dibuja en cada día que toca.
-- dias: 1 = lunes … 7 = domingo. excepciones: días sueltos en que no toca (festivos, vacaciones).

create table if not exists public.rutinas (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nombre      text not null,
  ambito      text not null default 'Personal',
  tipo        text not null default 'Evento Personal',
  dias        smallint[] not null check (array_length(dias, 1) > 0),
  hora        time,
  hora_fin    time,
  desde       date not null default current_date,
  hasta       date check (hasta is null or hasta >= desde),
  excepciones date[] not null default '{}',
  notas       text not null default '',
  creado      timestamptz not null default now(),
  actualizado timestamptz not null default now()
);

alter table public.rutinas enable row level security;

create policy "Cada uno ve lo suyo" on public.rutinas
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
