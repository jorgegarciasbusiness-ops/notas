-- 2026-10-30: se quitan las rutinas. Los turnos de trabajo pasan a ser entradas normales de la agenda
-- (ámbito Trabajo y "turno" en el nombre), que la app pinta de azul en el calendario.
drop table if exists public.rutinas;
