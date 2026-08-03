-- Semeia o host do acervo de legislação municipal de São Paulo.
--
-- POR QUE UMA CHAVE NOVA E NÃO `diario_oficial`. A hipótese de partida era
-- que São Paulo rodasse o mesmo produto de Belo Horizonte — o DOM-web em
-- Vue, com API REST ato a ato atrás de `/env.json`, que `etl/pbh/legislacao.py`
-- descobre sozinho a partir de `fontes.diario_oficial`. Verificado ao vivo em
-- 2026-08-03: NÃO É. `https://diariooficial.prefeitura.sp.gov.br/` redireciona
-- para `md_epubli_controlador.php?acao=inicio`, o módulo de Publicação
-- Eletrônica do SEI (PHP), que serve a EDIÇÃO do diário; `/env.json` e
-- `/docs/api-docs.json` respondem 404. `fontes.diario_oficial` continua certo
-- para o que ele é (o diário da cidade, para o cidadão), e por isso não é
-- alterado aqui — o que ele NÃO é, em São Paulo, é uma fonte de ato a ato.
--
-- O acervo estruturado de São Paulo mora em outro lugar: o Catálogo de
-- Legislação Municipal da Casa Civil (`legislacao.prefeitura.sp.gov.br`),
-- um buscador server-rendered cuja página de resultado já traz tipo, órgão,
-- número, data, EMENTA e situação de cada ato. É o que
-- `etl/psp/legislacao.py` consome. A chave é genérica de propósito: outra
-- cidade que publique um acervo próprio de legislação entra semeando esta
-- mesma chave, sem tocar no código.
--
-- Guarda de existência com `?` (operador "a chave existe no jsonb"): uma
-- segunda execução não sobrescreve um host que alguém já tenha ajustado à
-- mão, e o `where` faz o UPDATE não tocar linha nenhuma na repetição.
-- Read-modify-write com `||` porque `fontes` é um jsonb inteiro; só esta
-- chave é acrescentada, as demais seguem idênticas.

update municipios
set fontes = fontes || jsonb_build_object(
      'legislacao_municipal_host', 'https://legislacao.prefeitura.sp.gov.br/'
    )
where id_municipio = '3550308'
  and not (coalesce(fontes, '{}'::jsonb) ? 'legislacao_municipal_host');
