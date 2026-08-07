-- Royalties da mineração (CFEM) por município, da ANM.
--
-- Motivo de existir: é conteúdo que capital nenhuma do eixo Cidades tem. Belo
-- Horizonte e São Paulo não arrecadam CFEM relevante; Araçuaí e Itinga estão
-- em cima da maior província de LÍTIO do país, e a CFEM é o único número
-- público que mede, mês a mês, quanto minério sai de lá. Escrito por
-- `etl/betim/etl/apis/anm_cfem.py` — a docstring dele tem as 6 armadilhas
-- medidas na fonte.
--
-- ═══ O QUE ESTES NÚMEROS NÃO PERMITEM ═══
--
-- **NÃO SOME `valor` ENTRE MUNICÍPIOS.** Medido em 2026-08-07: em 2024, a
-- guia da `SIGMA MINERACAO S.A.` (1 título, R$ 268.606.086,50 de operação,
-- R$ 6.290.155,84 de CFEM) aparece INTEIRA em Itinga **e** inteira em
-- Araçuaí — a mesma guia, sem rateio. Cada município fecha certo consigo
-- mesmo (o total por empresa bate com o total por substância), mas somar as
-- duas cidades conta esse título duas vezes e inventa R$ 6,3 milhões.
--
-- Consequência para a tela: qualquer agregado tem de ser POR MUNICÍPIO. Um
-- "total dos Vales" ou um ranking somando cidades vizinhas é um número falso,
-- e falso justamente onde a matéria seria mais interessante.
--
-- ═══ E O QUE NÃO É ═══
--
-- Isto é a CFEM ARRECADADA sobre a produção do município, não a parcela que a
-- Prefeitura RECEBE (a Lei 13.540/2017 distribui entre União, estado,
-- município produtor e municípios afetados). O relatório de distribuição da
-- ANM (`distribuicao_cfem_muni.aspx`) responde 200 com a área de conteúdo
-- VAZIA — medido, não presumido. Enquanto isso não mudar, a tela não pode
-- dizer "a cidade recebeu".

create table if not exists royalties_cfem (
  id             uuid primary key default gen_random_uuid(),
  id_municipio   text not null references municipios(id_municipio) on delete cascade,
  ano            int  not null,
  mes            int  not null check (mes between 1 and 12),
  substancia     text not null,
  -- `numeric`: valores em reais com centavos. Lembrar que no Drizzle isto
  -- volta como STRING na leitura e quer string na escrita (`num()`/`String()`).
  valor          numeric(16, 2) not null,
  atualizado_em  date,
  -- Chave natural. O ETL grava por refresh total filtrado por `id_municipio`,
  -- mas a unicidade documenta o grão e barra dupla-carga acidental.
  unique (id_municipio, ano, mes, substancia)
);

-- A leitura da tela é sempre "esta cidade, série no tempo".
create index if not exists royalties_cfem_municipio_periodo_idx
  on royalties_cfem (id_municipio, ano desc, mes desc);
-- E "quais substâncias movem esta cidade" — o filtro que separa lítio de areia.
create index if not exists royalties_cfem_substancia_idx
  on royalties_cfem (id_municipio, substancia);

create table if not exists royalties_cfem_empresas (
  id                uuid primary key default gen_random_uuid(),
  id_municipio      text not null references municipios(id_municipio) on delete cascade,
  ano               int  not null,
  -- Razão social como a ANM grafa. Vem sem padronização de caixa na fonte
  -- ("SIGMA MINERACAO S.A." ao lado de "Rocha Verde Brasil Extração e ...");
  -- normalizar aqui destruiria a grafia oficial, então a tela que decida.
  empresa           text not null,
  qtde_titulos      int,
  -- Valor da operação declarado (a base de cálculo), não o imposto.
  valor_operacao    numeric(18, 2),
  valor_cfem        numeric(16, 2),
  -- Alíquota EFETIVA que a própria ANM imprime (cfem/operação). Guardada como
  -- a fonte publica, e não recalculada: divergência entre as duas é notícia.
  pct_recolhimento  numeric(6, 2),
  atualizado_em     date,
  unique (id_municipio, ano, empresa)
);

create index if not exists royalties_cfem_empresas_municipio_ano_idx
  on royalties_cfem_empresas (id_municipio, ano desc);

-- Grants: no Neon os papéis `anon`/`authenticated` do Supabase não existem, e
-- um grant a papel inexistente aborta a migration inteira. Ver
-- `apps/web/scripts/aplicar-migration.mts`.
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    grant select on royalties_cfem, royalties_cfem_empresas to anon;
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    grant select on royalties_cfem, royalties_cfem_empresas to authenticated;
  end if;
end $$;
