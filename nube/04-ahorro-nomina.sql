-- Ahorro: cada ingreso que se mete en la hucha (cuenta hacia el objetivo).
-- Nómina: lo que cobra cada mes y a dónde va cada parte.
-- Cada fila es de un usuario y solo ese usuario puede verla o cambiarla.

create table if not exists public.ahorros (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  fecha       date not null default current_date,
  importe     numeric(10, 2) not null,
  nota        text not null default '',
  creado      timestamptz not null default now(),
  actualizado timestamptz not null default now()
);

create table if not exists public.nominas (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  mes         date not null,  -- día 1 del mes
  neto        numeric(10, 2) not null default 0,
  creado      timestamptz not null default now(),
  actualizado timestamptz not null default now(),
  unique (user_id, mes)
);

create table if not exists public.nomina_partidas (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  mes         date not null,  -- día 1 del mes
  concepto    text not null,
  importe     numeric(10, 2) not null default 0,
  creado      timestamptz not null default now(),
  actualizado timestamptz not null default now()
);

create index if not exists ahorros_usuario_fecha on public.ahorros (user_id, fecha);
create index if not exists partidas_usuario_mes on public.nomina_partidas (user_id, mes);

alter table public.ahorros enable row level security;
alter table public.nominas enable row level security;
alter table public.nomina_partidas enable row level security;

create policy "Cada uno ve lo suyo" on public.ahorros
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Cada uno ve lo suyo" on public.nominas
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Cada uno ve lo suyo" on public.nomina_partidas
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
