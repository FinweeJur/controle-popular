-- 0080_domweb_bh.sql
-- Completa `municipios.fontes` de BH com a base da API do DOM-PBH que o
-- coletor `etl.camaras.domweb` usa (`diario_oficial_coletor`).
--
-- ═══ POR QUE CHAVE NOVA, E NÃO REAPROVEITAR `diario_oficial` ═══
--
-- `fontes.diario_oficial` de BH já aponta para a SPA pública
-- (`https://dom-web.pbh.gov.br/`) — é o link que a TELA mostra ao cidadão.
-- A API de coleta mora em OUTRO host (`https://api-dom.pbh.gov.br/`), medido
-- ao vivo em 30/08/2026 via `env.json` da SPA (a SPA carrega `VUE_APP_URL_API`
-- em runtime de `/env.json`). Sobrescrever `diario_oficial` com o host da API
-- quebraria o card da fonte no portal; criar `diario_oficial_coletor` separa
-- o link público do endpoint de máquina, no mesmo padrão de
-- `sigpub_entidade_prefeitura`/`sigpub_entidade_camara` (0079).
--
-- ═══ POR QUE SÓ BH ═══
--
-- As demais cidades do portal ou não têm coletor de diário ainda (Araçuaí/
-- Itinga/SP) ou usam o SIGPub via `diario_oficial` + ids de entidade
-- (Diamantina, 0079). `etl.camaras.domweb` exige esta chave e aborta sem ela
-- ("diario_oficial_coletor ausente") — a presença da chave é o que liga a
-- cidade ao coletor, e ela só existe onde o mecanismo foi medido.
update municipios
   set fontes = coalesce(fontes, '{}'::jsonb)
              || jsonb_build_object(
                   'diario_oficial_coletor', 'https://api-dom.pbh.gov.br/api/'
                 )
 where id_municipio = '3106200';
