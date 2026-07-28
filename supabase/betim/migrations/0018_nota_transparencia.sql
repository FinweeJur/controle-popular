-- Nota de Transparência (PNTP/ATRICON) — tira /nota-betim do "em breve".
--
-- ACHADO QUE MUDA O ESTADO ANTERIOR ("sem fonte confirmada"): o Radar da
-- Transparência da ATRICON expõe ZIPs prontos por ano em
-- radardatransparencia.atricon.org.br/downloads.html (sem scraping, sem
-- Playwright) -- o bloqueio anterior (ECONNRESET) era de outra tentativa de
-- acesso; baixar o ZIP direto via `requests` funciona sem nem precisar de
-- User-Agent de navegador. Dentro do ZIP, `avaliacoes_pntp_{ano}.xlsx` é o
-- resumo por ente avaliado (853/853 municípios de MG cobertos, tanto
-- Executivo quanto Legislativo) -- os arquivos `respostas_pntp_{ano}_{UF}.xlsx`
-- (bem maiores, questionário bruto) não são necessários pra essa página.
create table nota_transparencia (
  id uuid primary key default gen_random_uuid(),
  id_municipio text not null references municipios,
  ano int not null,
  poder text not null,              -- Executivo | Legislativo
  indice_transparencia numeric(6,4) not null,   -- 0-1
  nivel_transparencia text not null,            -- Diamante | Ouro | Prata | Elevado | Intermediário | Básico | Inicial
  variacao_indice numeric(8,6),
  variacao_nivel text,              -- Subiu | Desceu | Manteve
  historico_nivel text,             -- ex. "Prata -> Ouro"
  posicao_ranking_mg int,           -- posição entre os entes do mesmo poder/esfera em MG
  total_avaliados_mg int,
  link_site text,
  unique (id_municipio, ano, poder),
  created_at timestamptz default now(), updated_at timestamptz
);

alter table nota_transparencia enable row level security;
create policy nota_transparencia_public_select on nota_transparencia for select using (true);
create policy nota_transparencia_service_role_all on nota_transparencia for all to service_role using (true) with check (true);
