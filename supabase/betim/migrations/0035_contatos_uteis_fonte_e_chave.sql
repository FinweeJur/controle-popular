-- `contatos_uteis`: registrar a FONTE de cada telefone e dar chave natural
-- à tabela.
--
-- MOTIVO 1 — telefone sem procedência num portal de transparência é pior do
-- que telefone nenhum. A tabela nasceu com (nome, telefone, categoria,
-- ordem) e nada que diga DE ONDE o número veio: as 19 linhas de Betim foram
-- curadoria manual de 2026-07-20/24 e hoje não há como conferir nenhuma
-- delas sem refazer a pesquisa do zero. Quando o número está errado — e
-- número de emergência errado manda a pessoa para o lugar errado na hora
-- pior — a primeira pergunta é "onde vocês leram isso?", e a tabela não
-- sabia responder.
--
-- `fonte` guarda a URL da página OFICIAL onde o número foi lido. É URL, não
-- rótulo ("prefeitura", "curadoria"): rótulo não se confere, link se abre.
-- Fica NULL nas 19 linhas de Betim porque inventar uma origem retroativa
-- seria pior que admitir que não se sabe — quem revisar Betim preenche.
--
-- MOTIVO 2 — a tabela não tinha NENHUMA unique além da primary key
-- (`gen_random_uuid()`), então todo INSERT era não idempotente: rodar duas
-- vezes o ETL de contatos de uma cidade duplicaria a lista inteira, e a
-- página mostraria "SAMU 192" duas vezes. O par (id_municipio, nome) é a
-- chave natural real — não faz sentido a mesma cidade ter dois contatos com
-- o mesmo nome — e permite `ON CONFLICT DO UPDATE`, que é o que corrige um
-- número quando a prefeitura o troca, em vez de acumular a versão velha.
--
-- Conferido antes de criar a constraint: não há (id_municipio, nome)
-- repetido no banco hoje (só as 19 linhas de Betim existem).

alter table contatos_uteis add column if not exists fonte text;

comment on column contatos_uteis.fonte is
  'URL da página oficial onde este telefone foi lido e verificado. NULL nas '
  'linhas anteriores a 0032 (curadoria manual de Betim, origem não registrada).';

-- Guarda por `pg_class` e não por `pg_constraint`: constraint e índice
-- compartilham o namespace de relações, então um `create unique index` feito
-- à mão com este nome passaria batido por `pg_constraint` e o ALTER
-- estouraria com `relation already exists` (foi assim que 0029 quebrou ao
-- vivo, com outra sessão mexendo no mesmo banco).
do $$
begin
  if not exists (
    select 1 from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where c.relname = 'contatos_uteis_id_municipio_nome_key'
      and n.nspname = 'public'
  ) then
    alter table contatos_uteis
      add constraint contatos_uteis_id_municipio_nome_key
      unique (id_municipio, nome);
  end if;
end
$$;
