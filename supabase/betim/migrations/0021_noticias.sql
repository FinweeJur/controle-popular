-- Portal de notícias/blog (pedido do usuário 2026-07-24: "quero um
-- portal noticias/blog que nem mab.org.br" -- F13 do plano, formato em
-- aberto até agora).
--
-- DECISÃO DE FORMATO: redação própria (texto HTML autoral, não RSS
-- agregado de fontes externas nem markdown com parser novo -- este
-- ambiente não tem npm/node disponível pra instalar e testar uma lib de
-- markdown com segurança, ver TODO.md "recharts"). `conteudo` é HTML
-- direto, escrito por quem mantém o site (não é input de usuário --
-- sem risco de XSS de terceiro). Conteúdo real: achados de investigação
-- que este próprio projeto já fez (Regra 5/CEIS, IDH desatualizado,
-- mínimos constitucionais, nota de transparência), não notícia
-- genérica -- é isso que dá substância a um site de transparência sem
-- redação jornalística própria.
create table noticias (
  id uuid primary key default gen_random_uuid(),
  id_municipio text not null references municipios,
  slug text not null,
  titulo text not null,
  resumo text not null,          -- aparece na listagem, tipo o "TODAS AS NOTÍCIAS" do MAB
  conteudo_html text not null,
  categoria text not null,       -- achado | explicador | nota
  temas text[],                  -- reaproveita lib/temas.ts (Saúde, Educação, ...)
  autor text default 'Controle Popular Betim',
  publicado_em timestamptz not null default now(),
  criado_em timestamptz default now(), updated_at timestamptz,
  unique (id_municipio, slug)
);
create index on noticias (id_municipio, publicado_em desc);

alter table noticias enable row level security;
create policy noticias_public_select on noticias for select using (publicado_em <= now());
create policy noticias_service_role_all on noticias for all to service_role using (true) with check (true);
