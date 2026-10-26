-- Kok$: calendario de contenido (cada pieza que se publica en redes).
-- Cada fila es de un usuario y solo ese usuario puede verla o cambiarla.

create table if not exists public.contenido (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  pieza       text not null,
  fecha       date,
  redes       text[] not null default '{}',   -- TikTok, Instagram, YouTube
  formato     text not null default 'Otro',
  tema        text not null default '',
  estado      text not null default 'Idea',   -- Idea → Por grabar → Grabado → Editado → Programado → Publicado
  enlace      text not null default '',
  vistas      integer,
  notas       text not null default '',
  creado      timestamptz not null default now(),
  actualizado timestamptz not null default now()
);

create index if not exists contenido_usuario_fecha on public.contenido (user_id, fecha);

alter table public.contenido enable row level security;

create policy "Cada uno ve lo suyo" on public.contenido
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
