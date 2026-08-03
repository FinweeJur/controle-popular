-- Aplica de fato a chave natural de `proposicoes` que 0007 já descrevia.
--
-- 0007_proposicoes_unique.sql foi escrito em 2026-07 e ficou sem rodar: em
-- 2026-08-03, `pg_index` sobre `public.proposicoes` no Neon mostrava só a
-- primary key e o índice GIN de `temas`. Foi por isso que
-- `etl/camaras/betim.py` teve de emular upsert com select-then-update linha
-- a linha ("no DDL access", ver docstring de `_upsert_proposicoes`).
--
-- Sem a constraint, `on_conflict` é impossível e o ETL de Belo Horizonte
-- (3.6 mil proposições da 19ª legislatura, contra 2,7 mil de Betim inteiro)
-- gastaria duas queries por linha em toda rodada — e, pior, uma rodada
-- interrompida no meio não teria como ser retomada sem duplicar.
--
-- Conferido antes de aplicar: `select id_municipio, tipo, numero, ano,
-- count(*) ... having count(*) > 1` devolve zero linhas, então a constraint
-- entra sem precisar limpar nada.
--
-- O nome da constraint é o MESMO de 0007 de propósito, com guarda de
-- existência: quem rodar as migrations na ordem a partir do zero cria em
-- 0007 e passa batido aqui, em vez de estourar "already exists".
--
-- A guarda olha `pg_class` (o namespace de RELAÇÕES, onde índice e
-- constraint dividem o mesmo nome), não `pg_constraint`. A primeira versão
-- checava só `pg_constraint` e estourou na hora de aplicar, ao vivo em
-- 2026-08-03: entre a conferência de duplicatas e o ALTER, outra sessão
-- trabalhando no mesmo banco (o eixo de São Paulo) criou a mesma chave, e o
-- erro veio como `DuplicateTable: relation "..." already exists`. O erro
-- fala de "relation" justamente porque a colisão é de nome de relação — e
-- um índice único criado por fora (`create unique index`, sem constraint)
-- causaria exatamente o mesmo estouro passando batido por `pg_constraint`.
do $$
begin
  if not exists (
    select 1 from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where c.relname = 'proposicoes_id_municipio_tipo_numero_ano_key'
      and n.nspname = 'public'
  ) then
    alter table proposicoes
      add constraint proposicoes_id_municipio_tipo_numero_ano_key
      unique (id_municipio, tipo, numero, ano);
  end if;
end
$$;
