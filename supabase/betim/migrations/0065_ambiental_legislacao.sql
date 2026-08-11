-- Legislação ambiental unificada — MG/nacional, três fontes que não
-- conversam entre si. Coletores: `etl/betim/etl/apis/legislacao_almg.py`,
-- `legislacao_semad.py`, `legislacao_siam.py`. Contratos testados ao vivo
-- em 2026-08-11 — ver `docs/ambiental/F0-discovery.md` §6.
--
-- ═══ POR QUE UMA TABELA SÓ, NÃO TRÊS ═══
--
-- A tela busca "numa busca só" (pedido do plano) — filtrar em três tabelas
-- e mesclar em memória a cada requisição custaria três roundtrips por
-- consulta, no ambiente que já tem teto de subrequests por invocação
-- (`lib/db/client.ts`). Uma tabela com `fonte` como coluna é uma consulta
-- só, e a proveniência (de qual sistema veio) fica tão visível quanto
-- qualquer outra coluna — não escondida atrás de um JOIN.
--
-- ═══ POR QUE NÃO HÁ FUSÃO ENTRE FONTES, SÓ SINALIZAÇÃO (chave_dedup) ═══
--
-- As três fontes se sobrepõem de verdade: a Lei nº 26.039/2026 apareceu
-- tanto na ALMG (normas básicas, filtradas localmente por tema "Meio
-- Ambiente") quanto no Banco da Semad — mesma norma, medido ao vivo. Fundir
-- por engano (duas normas DIFERENTES tratadas como uma por coincidência)
-- apaga informação real e não tem como desfazer sem reprocessar as três
-- fontes do zero. Não fundir mantém tudo auditável: cada linha aponta para
-- a fonte que a publicou, e `chave_dedup` (tipo normalizado + número em
-- dígitos + ano — ver `etl.apis._legislacao_ambiental`) deixa a tela
-- sinalizar "isto também está em outra fonte" sem apagar nenhuma linha.
-- Decisão registrada aqui porque é a pergunta que a tarefa pediu para
-- responder por escrito, não só resolver em código.
--
-- ═══ id_ibge_municipio: NULLABLE, E NA PRÁTICA SEMPRE NULL POR AGORA ═══
--
-- Nem toda norma ambiental é territorializável por município — a imensa
-- maioria das ~2.500 normas básicas da ALMG, dos ~2.200 atos do Banco da
-- Semad e dos ~4.100 do SIAM é estadual ou federal por natureza (política
-- pública, padrão de qualidade do ar, composição de conselho). Nenhuma das
-- três fontes carimba um município na norma em si — diferente do COPAM
-- (`copam_pauta_itens`), onde o item de pauta É sobre um empreendimento
-- localizado. Inventar uma extração de município a partir da ementa aqui
-- seria o mesmo risco já documentado no F0 (§3): falso positivo por
-- palavra-chave. A coluna existe para o dia em que uma norma citar
-- explicitamente "Município de X" de forma estruturada — não força isso
-- agora.
--
-- ═══ POR QUE UPSERT POR (fonte, id_fonte), NÃO refresh_completo_seguro ═══
--
-- Mesmo raciocínio do `copam_reunioes` (migration 0062): cada fonte é um
-- catálogo que só CRESCE (nova norma publicada) ou ganha correção pontual
-- — nunca um recorte por município que possa encolher por engano de
-- raspagem. `id_fonte` é o identificador estável de CADA fonte (ALMG:
-- `numDoc`; Semad: `fileEntryId` do PDF; SIAM: `idNorma`) — nunca inventado,
-- sempre o que a própria fonte usa para essa norma.

create table if not exists ambiental_legislacao (
  id                 uuid primary key default gen_random_uuid(),
  fonte              text not null check (fonte in ('almg', 'semad', 'siam')),
  id_fonte           text not null,        -- identificador estável NA fonte (não inventado aqui)
  tipo               text not null,        -- como a fonte escreve: "LEI" (Almg) | "Lei" (Semad) | "Decreto Estadual" (Siam)
  numero             text,
  ano                integer,
  ementa             text,
  data               date,                 -- data de publicação/assinatura
  orgao              text,                 -- IEF | Igam | Copam | CERH-MG | Estadual | Conjunta Semad/Ief/Feam/Igam ...
  link_pdf           text,                 -- documento oficial. Apesar do nome, Semad/Siam às vezes servem HTML
                                            -- com Content-Type text/html sob uma URL de nome "download.pdf" — ver
                                            -- F0-discovery.md §6 (medido, não bug do coletor).
  id_ibge_municipio  text references ref_municipios_mg(id_ibge) on delete set null,
  chave_dedup        text,                 -- best-effort cross-fonte — ver o comentário acima. NUNCA usada para apagar linha.
  created_at         timestamptz default now(),
  updated_at         timestamptz,
  unique (fonte, id_fonte)
);

create index if not exists ambiental_legislacao_fonte_idx
  on ambiental_legislacao (fonte);
create index if not exists ambiental_legislacao_tipo_idx
  on ambiental_legislacao (tipo);
create index if not exists ambiental_legislacao_ano_idx
  on ambiental_legislacao (ano desc);
create index if not exists ambiental_legislacao_data_idx
  on ambiental_legislacao (data desc);
create index if not exists ambiental_legislacao_dedup_idx
  on ambiental_legislacao (chave_dedup) where chave_dedup is not null;
create index if not exists ambiental_legislacao_municipio_idx
  on ambiental_legislacao (id_ibge_municipio) where id_ibge_municipio is not null;

-- Busca por palavra-chave na ementa — mesma receita de `unaccent_immutable`
-- de `atos_oficiais`/`proposicoes` (migration 0046): sem isso "saude" nunca
-- acha "saúde", e um índice sem o wrapper IMMUTABLE nem é aceito pelo
-- Postgres para expressão.
create index if not exists ambiental_legislacao_ementa_tsv_idx
  on ambiental_legislacao using gin (
    to_tsvector('portuguese', public.unaccent_immutable(coalesce(ementa, '')))
  );

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    grant select on ambiental_legislacao to anon;
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    grant select on ambiental_legislacao to authenticated;
  end if;
end $$;
