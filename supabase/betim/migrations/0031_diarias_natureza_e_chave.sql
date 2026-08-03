-- `diarias`: marcar a NATUREZA da despesa e dar uma chave natural à tabela.
--
-- MOTIVO 1 — a tabela passou a receber uma despesa que não é diária.
-- Belo Horizonte NÃO publica diária como dataset. O único dado de viagem
-- oficial que a PBH abre é `despesas-passagens-viagens-oficiais` (CKAN,
-- órgão SMALOG): PASSAGEM AÉREA — o bilhete, não a diária de alimentação e
-- hospedagem. São coisas diferentes e a soma de uma não é a soma da outra.
--
-- Gravar passagem em `diarias` é a decisão certa (é a tabela que a UI já lê,
-- e a pergunta do leitor — "quanto custou a viagem?" — é a mesma), mas
-- gravar sem marcar seria afirmar ao leitor uma coisa falsa. `natureza`
-- existe para que a diferença sobreviva ao banco em vez de morar só na
-- cabeça de quem escreveu o ETL:
--
--     'diaria'          -> diária propriamente dita (Câmara de Betim)
--     'passagem_aerea'  -> bilhete de viagem oficial (PBH/CKAN)
--
-- O backfill marca as linhas que já existiam como 'diaria' porque elas são
-- diária de verdade: vêm de `etl.camaras.diarias`, que raspa a seção
-- "Viagens e Diárias" da Câmara de Betim e traz `qtd_diarias` preenchido.
--
-- MOTIVO 2 — `diarias` não tinha NENHUMA unique além da primary key
-- (`gen_random_uuid()`), o que torna todo INSERT não idempotente: rodar o
-- ETL duas vezes duplicaria a tabela inteira. Betim contornava com refresh
-- total (delete+insert do município), estratégia que já custou 55 linhas de
-- `verbas_indenizatorias` em 2026-07-29 quando a raspagem rendeu menos que o
-- banco — daí `refresh_completo_seguro`. Para BH o refresh nem serve: são
-- 10 recursos mensais independentes, e uma rodada que falhe no 7º não pode
-- ter apagado os 6 primeiros.
--
-- `chave_natural` recebe um identificador determinístico derivado do
-- CONTEÚDO do registro (a fonte não publica id), e o par
-- (id_municipio, chave_natural) vira a chave de `ON CONFLICT`.
--
-- Por que a unique NÃO é parcial (`where chave_natural is not null`): o
-- adapter deste ETL (`etl/common.py::_QueryBuilder`) monta
-- `ON CONFLICT (a, b) DO UPDATE` sem predicado, e o Postgres não consegue
-- inferir um índice parcial sem que o predicado seja repetido na cláusula.
-- Uma unique comum resolve porque no Postgres NULL é distinto de NULL
-- (NULLS DISTINCT é o padrão): as linhas antigas da Câmara, com
-- `chave_natural` nula, convivem sem colidir entre si.
--
-- Colunas de conteúdo (`orgao_nome`, `cargo`, `origem`, `tipo_destino`,
-- `data_solicitacao`) entram junto porque a fonte publica esses campos e o
-- schema atual não tinha onde pô-los. Sem eles a linha gravada diria
-- "alguém da prefeitura foi a Brasília por R$ 3.440,93" — perdendo
-- justamente o que responde se o gasto se justifica (quem, de qual órgão,
-- com quanta antecedência) e escondendo as 10 viagens INTERNACIONAIS no
-- meio das 366 nacionais. `orgao` continua sendo o PODER ('camara' /
-- 'prefeitura'), como já era.
--
-- `raw` segue o padrão de `contratos.raw`/`licitacoes.raw`: guarda o
-- registro cru da fonte. Aqui ele carrega os campos que o schema não
-- modela (MATRICULA, OBSERVACOES) e, mais importante, deixa a MUDANÇA DE
-- LAYOUT auditável — o cabeçalho deste dataset muda todo mês
-- (`Cargo_ou_Funcao` → `CARGO_OU_FUNCAO` → `CARGO OU FUNCAO`), e sem o cru
-- não dá para conferir depois se o mapeamento pegou a coluna certa.

alter table diarias add column if not exists natureza text;
alter table diarias add column if not exists orgao_nome text;
alter table diarias add column if not exists cargo text;
alter table diarias add column if not exists origem text;
alter table diarias add column if not exists tipo_destino text;
alter table diarias add column if not exists data_solicitacao date;
alter table diarias add column if not exists chave_natural text;
alter table diarias add column if not exists raw jsonb;

comment on column diarias.natureza is
  'Natureza da despesa: ''diaria'' (diária de viagem) ou ''passagem_aerea'' '
  '(bilhete). A PBH só publica passagem; chamá-la de diária seria falso.';
comment on column diarias.orgao_nome is
  'Órgão/entidade da fonte (FMAATM, SLU, EGM SMMA...). `orgao` segue sendo o poder.';
comment on column diarias.chave_natural is
  'Id determinístico derivado do conteúdo, para upsert idempotente. NULL nas '
  'linhas anteriores a 0031 (Câmara de Betim, gravadas por refresh total).';

update diarias set natureza = 'diaria' where natureza is null;

-- Guarda por `pg_class`, não por `pg_constraint`: constraint e índice
-- dividem o mesmo namespace de relações, então um `create unique index`
-- feito à mão com este nome passaria batido por `pg_constraint` e o ALTER
-- estouraria com `relation already exists`. Foi assim que 0029 quebrou ao
-- vivo, com outra sessão mexendo no mesmo banco.
do $$
begin
  if not exists (
    select 1 from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where c.relname = 'diarias_id_municipio_chave_natural_key'
      and n.nspname = 'public'
  ) then
    alter table diarias
      add constraint diarias_id_municipio_chave_natural_key
      unique (id_municipio, chave_natural);
  end if;
end
$$;
