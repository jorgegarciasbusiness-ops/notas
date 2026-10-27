-- Agenda: eventos con inicio y fin (pueden durar varias horas o varios días).
-- Si fecha_fin está vacía, el evento es de un solo día; hora_fin es opcional.

alter table public.agenda add column if not exists fecha_fin date;
alter table public.agenda add column if not exists hora_fin time;

alter table public.agenda drop constraint if exists agenda_fin_despues;
alter table public.agenda add constraint agenda_fin_despues check (fecha_fin is null or fecha_fin >= fecha);
