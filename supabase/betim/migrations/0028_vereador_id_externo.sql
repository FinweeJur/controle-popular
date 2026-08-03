-- Identidade do vereador NA FONTE, separada da identidade no nosso portal.
--
-- O problema apareceu ao ligar a Câmara de Belo Horizonte (etl/camaras/bh.py).
-- O site da CMBH é um Drupal 7 cujo caminho de cada vereador carrega ACENTO:
--   /vereadores/iza-lourença   /vereadores/trópia   /vereadores/cláudio-do-mundo-novo
-- (13 dos 41 em 2026-08-03). E o Drupal ainda desambigua homônimos históricos
-- com sufixo numérico: /vereadores/edmar-branco-0, /vereadores/uner-augusto-0.
--
-- `vereadores.slug` NÃO pode receber isso: ele é a URL do NOSSO portal
-- (`/bh/vereadores/<slug>`), então precisa ser ASCII, estável e legível.
-- Mas jogar o caminho original fora quebra o caminho de volta à fonte — sem
-- ele não dá para reabrir o perfil oficial nem reraspar o vereador sem
-- readivinhar a acentuação (adivinhar erra: "loíde-gonçalves" não sai de
-- "loide-goncalves" por nenhuma regra determinística).
--
--   slug_fonte  — o caminho como a fonte publica, já com acento e com o
--                 sufixo de desambiguação. Guardado DECODIFICADO (legível);
--                 quem for requisitar faz o percent-encoding na hora.
--   id_externo  — o identificador interno do vereador no sistema legislativo
--                 (SIL) da Casa, um GUID de 32 hex. Não aparece em lugar
--                 nenhum de forma listável: só dá para descobrir baixando
--                 /vereadores/<slug>/projetos e lendo o <input name=
--                 "idVereador">, um GET por vereador. É ele — não o nome —
--                 que filtra a busca de proposições, então guardá-lo evita
--                 41 requisições em toda rodada futura.
--
-- Ambas as colunas são genéricas (qualquer câmara tem um id próprio e um
-- caminho próprio), não específicas de BH: Betim tem o mesmo par (id numérico
-- em /Parlamentares/Parlamentar/{id}) e pode preenchê-las depois.
alter table vereadores add column if not exists slug_fonte text;
alter table vereadores add column if not exists id_externo text;

comment on column vereadores.slug_fonte is
  'Caminho/slug do vereador na fonte oficial, decodificado (pode conter acento e sufixo de desambiguação). Serve para voltar à fonte; NÃO usar em URL do portal.';
comment on column vereadores.id_externo is
  'Identificador do vereador no sistema legislativo da própria Câmara (ex.: GUID do SIL na CMBH). Chave para filtrar proposições na fonte.';

-- Um mesmo id da fonte não pode aparecer em dois vereadores do mesmo
-- município: se aparecer, é sinal de que a raspagem casou o GUID no
-- vereador errado (e a busca de proposições estaria atribuindo autoria
-- errada em silêncio). Parcial porque `id_externo` fica NULL nas cidades
-- que ainda não preencheram, e NULL não deve colidir com NULL.
create unique index if not exists vereadores_id_municipio_id_externo_key
  on vereadores (id_municipio, id_externo)
  where id_externo is not null;
