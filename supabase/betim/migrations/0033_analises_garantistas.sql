-- 0033_analises_garantistas.sql
-- Fundação da análise garantista × reducionista no eixo Cidades (F13.0).
--
-- Espelha `congresso.analises` / `congresso.analise_itens` (ver
-- `supabase/congresso/migrations/0001_schema.sql`, linhas 200-238) porque a
-- RÉGUA É A MESMA: as 24 âncoras da rubrica são da CF/88, e a CF/88 governa
-- lei municipal exatamente como governa lei federal. A taxonomia continua
-- morando em UM lugar só (`apps/web/lib/congresso/rubrica/rubrica.json`) —
-- o `_nota` daquele arquivo é explícito: instruir o modelo com uma lista e
-- pontuar com outra produz deriva silenciosa. Isso vale entre eixos também;
-- por isso aqui não há cópia de taxonomia nenhuma, só as colunas que
-- guardam o resultado.
--
-- ═══ DIFERENÇA ESTRUTURAL EM RELAÇÃO AO CONGRESSO ═══
--
-- O Congresso analisa UM tipo de objeto: proposição federal. Por isso lá
-- `analises.proposicao_id` é `not null unique` e acabou.
--
-- As cidades têm DOIS objetos analisáveis, e eles não são a mesma coisa:
--
--   `atos_oficiais`  -> lei/decreto JÁ SANCIONADO (o que vale hoje)
--   `proposicoes`    -> projeto EM TRAMITAÇÃO (o que pode passar a valer)
--
-- Escolha: DUAS COLUNAS NULÁVEIS com CHECK de exclusividade, em vez de um
-- par polimórfico (`tipo_objeto text, objeto_id uuid`).
--
-- POR QUÊ. O par polimórfico é mais curto de escrever e paga o preço no
-- lugar errado: o Postgres não sabe declarar chave estrangeira para "uma de
-- duas tabelas", então `objeto_id` vira um uuid solto. Apagar um ato
-- deixaria a análise órfã apontando para nada, e nada no banco reclamaria —
-- é o mesmo tipo de erro silencioso que reetiquetou os postos da ANP
-- (ver `scripts/conferir_defaults_de_cidade.py`). Com duas colunas, cada
-- uma tem `references ... on delete cascade` de verdade e o banco garante
-- a integridade sozinho. O custo — uma coluna sempre nula por linha — é
-- irrelevante nessa escala (660 atos + 8.941 proposições nas três cidades).
--
-- O CHECK usa `num_nonnulls(...) = 1`: exatamente um dos dois preenchido.
-- Nem zero (análise de coisa nenhuma) nem dois (análise ambígua, que faria
-- a mesma linha aparecer em duas telas com o mesmo score).
--
-- As UNIQUEs são COMUNS, não parciais. Mesmo motivo já documentado em
-- `0031_diarias_natureza_e_chave.sql`: o adapter deste ETL
-- (`etl/common.py::_QueryBuilder`) monta `ON CONFLICT (col) DO UPDATE` sem
-- predicado, e o Postgres não infere índice parcial sem que o predicado
-- seja repetido na cláusula. Unique comum funciona porque NULL é distinto
-- de NULL no Postgres (NULLS DISTINCT é o padrão): as centenas de linhas
-- com `ato_id` nulo convivem sem colidir entre si.
--
-- ═══ id_municipio EM TODA LINHA ═══
--
-- Inclusive em `analise_itens`, onde seria derivável por join com a análise
-- pai. É denormalização deliberada: toda tela deste eixo filtra por cidade
-- primeiro, e o item é o que alimenta o corte "quais direitos BH restringe"
-- sem passar por `analises`. Sem a coluna, esse corte vira join obrigatório
-- e o risco é o de sempre — alguém esquece o filtro e mistura três cidades
-- num ranking só.
--
-- ═══ versao_rubrica / versao_prompt / modelo ═══
--
-- Mesma função que no Congresso, e não é metadado decorativo: quando a
-- rubrica subir para 1.1.0, `where versao_rubrica <> '1.1.0'` é o que
-- permite reanalisar SÓ o que ficou para trás em vez de refazer as 9.601
-- linhas. `modelo` guarda quem respondeu — este eixo não tem AI_API_KEY, as
-- respostas vêm de fora (ver `etl/exportar_prompts.py`), e sem esse rótulo
-- não há como comparar a qualidade de duas rodadas feitas por modelos
-- diferentes.

create table if not exists public.analises (
  id uuid primary key default gen_random_uuid(),
  id_municipio text not null references public.municipios(id_municipio) on delete cascade,

  -- Exatamente um dos dois. Ver bloco "DIFERENÇA ESTRUTURAL" acima.
  ato_id uuid references public.atos_oficiais(id) on delete cascade unique,
  proposicao_id uuid references public.proposicoes(id) on delete cascade unique,
  constraint analises_um_objeto_so check (num_nonnulls(ato_id, proposicao_id) = 1),

  score numeric(6,2),
  rotulo text,        -- garantista_forte|garantista|neutro|misto|reducionista|reducionista_forte

  -- Constitucionalidade não entra no score: é selo próprio, não questão de
  -- grau. Somar "fere cláusula pétrea" com "amplia acesso" produziria um
  -- número sem significado. (Mesma decisão do Congresso.)
  clausula_petrea boolean default false,
  vedacao_retrocesso boolean default false,

  resumo_neutro text,                     -- ficha técnica: o que muda, na letra
  parecer_critico text,                   -- opinião, rotulada como tal na UI
  legislacao_relacionada jsonb,           -- extração determinística, nunca o que o modelo alegou

  modelo text,
  versao_rubrica text,
  versao_prompt text,
  status text default 'ok' check (status in ('ok', 'requer_revisao', 'falhou')),
  criado_em timestamptz default now()
);

create index if not exists analises_municipio_rotulo_idx on public.analises (id_municipio, rotulo);
create index if not exists analises_municipio_status_idx on public.analises (id_municipio, status);
create index if not exists analises_score_idx on public.analises (score);
-- Reanálise por versão de rubrica é uma varredura frequente e barata de indexar.
create index if not exists analises_versao_rubrica_idx on public.analises (versao_rubrica);

create table if not exists public.analise_itens (
  id uuid primary key default gen_random_uuid(),
  analise_id uuid not null references public.analises(id) on delete cascade,
  id_municipio text not null references public.municipios(id_municipio) on delete cascade,

  direito text not null,
  -- Obrigatório. Item sem dispositivo válido é descartado ANTES de entrar no
  -- score (`rubrica.validar_itens`) — é o que impede o modelo de alucinar um
  -- artigo e mesmo assim mover o rótulo. O `not null` aqui é a última
  -- barreira caso alguém escreva um importador novo e esqueça a validação.
  dispositivo text not null,
  direcao text not null check (direcao in ('amplia', 'restringe', 'neutro')),
  mecanismo text,
  titulares text[],
  grau text check (grau in ('marginal', 'moderado', 'estrutural')),
  trecho text,                            -- citação literal do ato/projeto
  confianca numeric(3,2),
  peso numeric(6,2)
);

create index if not exists analise_itens_analise_idx on public.analise_itens (analise_id);
-- "Quais direitos esta cidade mais restringe" lê por aqui, sem tocar em `analises`.
create index if not exists analise_itens_municipio_direito_idx
  on public.analise_itens (id_municipio, direito, direcao);
