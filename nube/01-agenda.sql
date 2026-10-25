-- Tabla de la Agenda en Supabase. Se ejecuta una vez en el editor SQL del proyecto.
-- Cada fila es de un usuario y solo ese usuario puede verla o cambiarla.

create table if not exists public.agenda (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nombre      text not null,
  fecha       date not null,
  hora        time,
  tipo        text not null default 'Tarea',
  prioridad   text not null default 'Media',
  estado      text not null default 'Sin empezar',
  ambito      text not null default 'Personal',
  notas       text not null default '',
  creado      timestamptz not null default now(),
  actualizado timestamptz not null default now()
);

create index if not exists agenda_usuario_fecha on public.agenda (user_id, fecha);

alter table public.agenda enable row level security;

drop policy if exists "Cada uno ve lo suyo" on public.agenda;
create policy "Cada uno ve lo suyo" on public.agenda
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
