-- Abre a tabela `contratos` para uma SEGUNDA fonte além do PNCP.
--
-- Por que agora: Itinga parou de publicar no PNCP em jan/2024 e por isso tem
-- ZERO contrato lá (medido, é dado real). Mas publica ao TCE-MG via SICOM
-- ~130-190 contratos/ano, INCLUSIVE em 2024-2025. Ou seja: o dinheiro não
-- parou, só a divulgação no portal nacional parou. O coletor
-- `etl/apis/tce_mg.py` traz esses contratos — e eles precisam conviver na
-- mesma tabela que o front-end já renderiza, sem colidir com o PNCP.
--
-- ═══ O PROBLEMA QUE ESTA MIGRATION RESOLVE ═══
--
-- A `contratos` nasceu PNCP-shaped: a ÚNICA chave de deduplicação é
-- `numero_controle_pncp text unique`. Um contrato do TCE não tem esse número
-- — teria `null` ali —, e como o Postgres permite N nulos numa coluna unique,
-- rodar o coletor duas vezes duplicaria tudo, em silêncio. Falta uma chave
-- natural que valha PARA CADA FONTE.
--
-- A saída é o mesmo padrão de `fontes.legislacao_fonte`/`contratos_fonte` e do
-- `royalties_cfem`: uma coluna `fonte` que diz de quem é a linha, mais a chave
-- que a PRÓPRIA fonte usa (`chave_fonte`). No SICOM é o `seq_contrato`, que é
-- único por município. O upsert do coletor casa por (id_municipio, fonte,
-- chave_fonte), então reprocessar atualiza no lugar em vez de duplicar, e o
-- PNCP e o TCE nunca se sobrescrevem.

alter table contratos add column if not exists fonte text not null default 'pncp';
alter table contratos add column if not exists chave_fonte text;

-- Backfill do que já existe: tudo que está na tabela hoje veio do PNCP, e a
-- chave natural dele é o próprio número de controle. Assim as linhas antigas
-- entram no mesmo esquema de dedup sem exceção.
update contratos
   set fonte = 'pncp',
       chave_fonte = coalesce(chave_fonte, numero_controle_pncp)
 where fonte = 'pncp' and chave_fonte is null;

-- A chave de dedup por fonte. Parcial (`where chave_fonte is not null`) porque
-- uma fonte futura pode, num registro específico, não ter identificador — e aí
-- é melhor deixar entrar sem dedup do que barrar a carga inteira. O
-- `numero_controle_pncp unique` original CONTINUA valendo para o PNCP; este
-- índice é a garantia adicional para as demais fontes.
create unique index if not exists contratos_fonte_chave_idx
  on contratos (id_municipio, fonte, chave_fonte)
  where chave_fonte is not null;

-- Leitura típica do front-end de uma cidade que tem duas fontes: "contratos
-- desta cidade, mais recentes primeiro", agora ciente da fonte.
create index if not exists contratos_municipio_fonte_ano_idx
  on contratos (id_municipio, fonte, ano desc);

comment on column contratos.fonte is
  'De qual coletor veio a linha: pncp (PNCP/ComprasGov) ou tce_mg_sicom (TCE-MG, via SICOM). O refresh/upsert é filtrado por fonte para os dois nunca se apagarem.';
comment on column contratos.chave_fonte is
  'Identificador que a própria fonte dá ao contrato (PNCP: numero_controle_pncp; SICOM: seq_contrato). Dedup por (id_municipio, fonte, chave_fonte).';
