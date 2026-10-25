-- Objetivos de ahorro: metas con nombre, importe y fecha límite opcional.
-- Cada ingreso a la hucha puede ir a un objetivo (o a ninguno). Todo cuenta para la hucha general.

create table if not exists public.objetivos (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nombre       text not null,
  importe      numeric(10, 2) not null check (importe > 0),
  fecha_limite date,
  creado       timestamptz not null default now(),
  actualizado  timestamptz not null default now()
);

alter table public.ahorros add column if not exists objetivo_id uuid references public.objetivos (id) on delete set null;

alter table public.objetivos enable row level security;

create policy "Cada uno ve lo suyo" on public.objetivos
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
