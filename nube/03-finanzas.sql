-- Finanzas: gastos sueltos (se suman por semana contra el límite) y turnos de trabajo (horas por mes).
-- Cada fila es de un usuario y solo ese usuario puede verla o cambiarla.

create table if not exists public.gastos (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  fecha       date not null default current_date,
  importe     numeric(10, 2) not null check (importe >= 0),
  concepto    text not null default '',
  categoria   text not null default 'Otros',
  creado      timestamptz not null default now(),
  actualizado timestamptz not null default now()
);

create table if not exists public.horas (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  fecha       date not null,
  entrada     time,
  salida      time,
  horas       numeric(4, 2) not null default 0,
  trabajo     text not null default 'Catering (Interim)',
  nota        text not null default '',
  creado      timestamptz not null default now(),
  actualizado timestamptz not null default now()
);

create index if not exists gastos_usuario_fecha on public.gastos (user_id, fecha);
create index if not exists horas_usuario_fecha on public.horas (user_id, fecha);

alter table public.gastos enable row level security;
alter table public.horas enable row level security;

create policy "Cada uno ve lo suyo" on public.gastos
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Cada uno ve lo suyo" on public.horas
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
