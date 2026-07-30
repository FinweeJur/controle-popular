-- 0005 — autoria COMPLETA da proposição, para aparecer na lista.
--
-- POR QUE UMA TABELA NOVA, e não só usar `proposicao_autores`:
-- `proposicao_autores` é uma relação com FK obrigatória para
-- `parlamentares`, e o ETL descarta de propósito todo autor que não tem
-- linha lá (`etl/camara/proposicoes.py::_autores`). Medido no banco de
-- produção: das 5.562 proposições, **1.117 ficam sem autoria nenhuma** —
-- Poder Executivo, Senado, comissões e deputados de legislatura anterior.
-- 94 delas já têm análise publicada, ou seja, apareciam em /alertas e
-- /bons-exemplos sem dizer de quem é o projeto.
--
-- Alargar a tabela existente exigiria tornar `parlamentar_id` nulável e
-- trocar a PK — e a PK é justamente o alvo do `on conflict` de dois ETLs
-- que já rodam. Uma tabela de APRESENTAÇÃO ao lado, escrita pelo MESMO
-- passe de ETL que alimenta a relação, não pode divergir dela: quem grava
-- as duas é `etl.camara.autoria`, do mesmo CSV, na mesma transação lógica.
--
-- `partido`/`uf` ficam aqui denormalizados de propósito: são o partido e a
-- UF **na assinatura**, que é o que a fonte publica e o que faz sentido
-- histórico. Ler de `parlamentares` mostraria a filiação de hoje num
-- projeto de 2023 — errado sem avisar.
set search_path = congresso, public;

create table if not exists congresso.proposicao_autoria (
  proposicao_id  uuid not null references congresso.proposicoes(id) on delete cascade,
  nome           text not null,
  tipo           text,
  cod_tipo       integer,
  partido        text,
  uf             text,
  ordem          integer,
  proponente     boolean not null default false,
  -- Nulo quando o autor não é parlamentar desta legislatura. É o campo que
  -- permite ligar de volta ao perfil quando existe, sem exigir que exista.
  parlamentar_id uuid references congresso.parlamentares(id) on delete set null,
  primary key (proposicao_id, nome)
);

-- A lista de proposições busca autoria por lote de ids; sem este índice o
-- `in (...)` de 60 ids varre a tabela inteira.
create index if not exists proposicao_autoria_proposicao_idx
  on congresso.proposicao_autoria (proposicao_id);
create index if not exists proposicao_autoria_parlamentar_idx
  on congresso.proposicao_autoria (parlamentar_id)
  where parlamentar_id is not null;

-- GRANTS condicionais: o banco saiu do Supabase para o Neon, onde os papéis
-- `anon`/`authenticated` não existem. Sem o `if exists`, esta migration
-- quebraria no Neon; sem os grants, quebraria num Supabase. O bloco serve
-- aos dois.
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    grant select on congresso.proposicao_autoria to anon;
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    grant select on congresso.proposicao_autoria to authenticated;
  end if;
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant all on congresso.proposicao_autoria to service_role;
  end if;
end $$;
