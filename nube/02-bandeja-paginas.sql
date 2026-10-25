-- Bandeja (apuntes rápidos desde el móvil) y Páginas (documentos con texto, listas y tablas).
-- Cada fila es de un usuario y solo ese usuario puede verla o cambiarla.

create table if not exists public.bandeja (
  id      uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  texto   text not null,
  creado  timestamptz not null default now()
);

create table if not exists public.paginas (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  titulo      text not null,
  seccion     text not null default 'General',
  contenido   text not null default '',
  orden       integer not null default 0,
  creado      timestamptz not null default now(),
  actualizado timestamptz not null default now()
);

create index if not exists bandeja_usuario on public.bandeja (user_id, creado);
create index if not exists paginas_usuario on public.paginas (user_id, seccion, orden);

alter table public.bandeja enable row level security;
alter table public.paginas enable row level security;

create policy "Cada uno ve lo suyo" on public.bandeja
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Cada uno ve lo suyo" on public.paginas
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
