-- A pagina /defesa-civil mostrava os canais de Betim (app, WhatsApp) pra
-- QUALQUER cidade, porque nenhuma delas tinha a chave "defesa_civil" em
-- `fontes` e `temFonte()` volta true por omissao. BH, SP e os tres
-- municipios dos Vales nunca tiveram esse canal pesquisado -- corrigido no
-- codigo (app/[municipio]/defesa-civil/page.tsx) em 2026-08-09, esta
-- migration fecha o lado do dado.
--
-- Numero pode colidir com outra migration em worktree paralelo (branches
-- ambiental/f0-descoberta e feat/busca-legislativa tambem escrevem em
-- supabase/betim/migrations/) -- resolver a ordem no merge, nao aqui.

update public.municipios
set fontes = coalesce(fontes, '{}'::jsonb) || '{"defesa_civil": false}'::jsonb
where id_municipio != '3106705';
