-- 0079_sigpub_entidade_diamantina.sql
-- Completa `municipios.fontes` de Diamantina com os ids de `entidadeUsuaria`
-- que o coletor `etl.camaras.sigpub` precisa para filtrar a busca do SIGPub
-- por Prefeitura/Câmara (sem eles, `carregar_municipio` -> `sync()` aborta
-- com "nenhuma de fontes.sigpub_entidade_prefeitura/sigpub_entidade_camara
-- está configurada" — ver o cabeçalho de `etl/camaras/sigpub.py`).
--
-- ═══ OS IDS FORAM RECONFERIDOS AO VIVO EM 22/08/2026, NÃO HERDADOS ═══
--
-- Dois relatos anteriores do repo se contradiziam sobre o mecanismo de busca
-- do SIGPub (ver `docs/_historico/diario-oficial-sigpub-mapeamento.md`,
-- seção D0 de 11/08 vs. o cabeçalho desta própria migration em
-- `0077_atos_diario.sql`, 16/08) — a existência da contradição foi motivo
-- suficiente para reconferir do zero em vez de copiar qualquer um dos dois.
-- Os valores abaixo saíram do HTML bruto do `<select id="entidadeUsuaria">`
-- em `https://www.diariomunicipal.com.br/amm-mg/pesquisar` (curl.exe, ver
-- armadilha 0 do cabeçalho de `sigpub.py`), e foram usados numa busca real
-- que devolveu matérias reais e datadas (196 da Prefeitura e 11 da Câmara
-- só em julho/2026, batendo com o que já constava no D1 do histórico) — não
-- é só o id existir no dropdown, é o id ter devolvido matéria de verdade.
--
-- ═══ POR QUE CHAVES NOVAS, E NÃO REAPROVEITAR `camara_host`/`camara_coletor` ═══
--
-- Aquelas duas já têm dono: `camara_coletor = "syssolution"` (migration
-- 0043) aponta para o sistema de vereadores/leis/proposições da Câmara
-- (`etl.camaras.syssolution`), uma fonte TOTALMENTE diferente do diário.
-- Diamantina tem duas fontes de dado da mesma Câmara, de dois fornecedores
-- diferentes, e cada uma precisa da própria chave — sobrescrever
-- `camara_coletor` para "sigpub" quebraria `etl.camaras.syssolution`.
update municipios
   set fontes = coalesce(fontes, '{}'::jsonb)
              || jsonb_build_object(
                   'sigpub_entidade_prefeitura', '905',
                   'sigpub_entidade_camara', '21672'
                 )
 where id_municipio = '3121605';
