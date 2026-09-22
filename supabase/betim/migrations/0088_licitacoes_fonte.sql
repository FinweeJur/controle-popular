-- Abre a tabela `licitacoes` para uma SEGUNDA fonte além do PNCP.
--
-- Mesmo padrão da migration 0047 (contratos + TCE): a `licitacoes` nasceu
-- PNCP-shaped (`numero_controle_pncp unique`), e uma linha do portal de
-- dados abertos de Betim não tem esse número. Sem `fonte`/`chave_fonte`,
-- o upsert casaria por nulo e reprocessar duplicaria — em silêncio.
--
-- Fonte desta carga: portal municipal
-- https://www.betim.mg.gov.br/portal/dados-abertos/licitacoes/<ano>
-- (~2.7k linhas 2019–2026, medida 22/09/2026). O Compras.gov.br não tem
-- Betim; a API PNCP estava fora; o portal tem.

alter table licitacoes add column if not exists fonte text not null default 'pncp';
alter table licitacoes add column if not exists chave_fonte text;

update licitacoes
   set fonte = 'pncp',
       chave_fonte = coalesce(chave_fonte, numero_controle_pncp)
 where fonte = 'pncp' and chave_fonte is null;

-- UNIQUE completa (sem `where`): o ON CONFLICT do ETL é
-- (id_municipio, fonte, chave_fonte) sem predicado — um índice parcial não
-- casa no conflict target. Nulos múltiplos seguem permitidos (regra do
-- Postgres). Em `contratos` este índice foi refeito fora da migration na
-- mesma madrugada; aqui já nasce certo.
create unique index if not exists licitacoes_fonte_chave_idx
  on licitacoes (id_municipio, fonte, chave_fonte);

create index if not exists licitacoes_municipio_fonte_idx
  on licitacoes (id_municipio, fonte, data_publicacao_pncp desc);

comment on column licitacoes.fonte is
  'De qual coletor veio a linha: pncp, tce_mg_sicom ou betim_dados_abertos. O refresh/upsert é filtrado por fonte para as fontes não se apagarem.';
comment on column licitacoes.chave_fonte is
  'Identificador que a própria fonte dá à licitação (PNCP: numero_controle_pncp; SICOM: seq_licitacao; portal Betim: ano/processo/edital/data/título). Dedup por (id_municipio, fonte, chave_fonte).';
