/*
 * Dónde se guardan los datos.
 * Vacío = modo prueba (solo este navegador).
 * Con la dirección del proyecto de Supabase y su clave pública ("publishable"), la app usa la nube.
 * La clave pública está hecha para ir dentro de webs; quién ve qué lo controla la base de datos.
 * Aquí NUNCA va la clave secreta ("secret" / "service_role").
 */
const CONFIG = {
  supabaseUrl: 'https://dvsnwwabycgpeqgqpvgj.supabase.co',
  supabaseClave: 'sb_publishable_4DthC7tfJpebb2QzSJnPsw_Ywdxx0Y9',
};
