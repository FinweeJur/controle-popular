-- 0073_arquivo_fontes.sql
-- Arquivo (cópia) dos documentos que o portal cita como fonte — pedido do
-- dono em 13/08/2026, desenhado em `docs/PLANO-ARQUIVO-DE-FONTES.md`.
-- Recorte desta primeira leva: normas de PROTEÇÃO (serras, recursos
-- hídricos, indígena, quilombola, povos tradicionais, rios, direitos
-- humanos, área protegida).
--
-- ═══ POR QUE TABELA PRÓPRIA, NÃO COLUNA EM `atos_oficiais`/`proposicoes`/
--     `ambiental_legislacao`/`direito_critico_normas` ═══
--
-- Duas razões, ambas do próprio plano:
--   1. Uma norma pode ter mais de um documento arquivado (texto original,
--      texto compilado, anexo) — 1:N, não cabe em coluna.
--   2. A MESMA url_original pode ser citada por linhas de tabelas
--      diferentes (ex.: uma norma estadual aparece em `ambiental_legislacao`
--      E é referenciada como precedente em `direito_critico_normas`).
--      Guardar por URL evita baixar/hashear o mesmo documento duas vezes.
-- Consequência de desenho: esta tabela NÃO tem FK para a norma. A ligação é
-- por `url_original` — quem renderiza a página resolve
-- "existe cópia para este link_fonte/link_pdf/link_oficial?" com uma busca
-- por URL, não por join de chave estrangeira.
--
-- ═══ POR QUE SEM `unique (url_original)` ═══
--
-- Capturar de novo a mesma URL depois (ex.: 1 ano) e ver o hash mudado É
-- informação de transparência por si só — o plano é explícito sobre isso.
-- Cada captura é uma LINHA nova; "a cópia vigente" é a de
-- `capturado_em` mais recente para aquela URL (índice abaixo serve essa
-- consulta). Nada aqui apaga uma captura antiga.
--
-- ═══ O HASH É O CORAÇÃO ═══
--
-- `sha256` do conteúdo BAIXADO (não da URL, não do HTML de uma página de
-- redirecionamento). Sem ele a cópia é só um arquivo; com ele dá para
-- afirmar "isto é, byte a byte, o que a fonte servia em `capturado_em`".
--
-- ═══ POR QUE `aprovado_para_publicacao` SEPARADO DE TER SIDO CAPTURADO ═══
--
-- `scripts/checar-dado-pessoal.py` varre CÓDIGO por desenho — não cobre
-- texto extraído de PDF ingerido (lacuna registrada no próprio cabeçalho
-- dele). O capturador extrai o texto e varre ANTES de expor a cópia: se
-- achar CPF ou outro dado de pessoa, a linha existe (o download aconteceu,
-- fica registrado por que não passou), mas `aprovado_para_publicacao` fica
-- `false` e `motivo_reprovacao` diz o motivo. Nenhuma tela pode mostrar um
-- link de cópia para uma linha não aprovada — a checagem é no dado, não
-- confiar em quem chama.
--
-- ═══ `modo_armazenamento`: 'local' até o R2 estar configurado ═══
--
-- O plano recomenda R2 (`docs/PLANO-ARQUIVO-DE-FONTES.md` §"Onde guardar").
-- Sem credencial de R2 configurada nesta máquina, a primeira leva grava em
-- disco LOCAL, fora de `apps/web/public/` (nunca ali — um cache de 570 MiB
-- em `public/` quase quebrou o deploy em 13/08, commit `e82a58e`: `public/`
-- inteiro vira Static Assets e o teto do Cloudflare é 25 MiB por arquivo).
-- `caminho_armazenamento` guarda o caminho local OU a chave R2, conforme
-- `modo_armazenamento` — subir para R2 é passo declarado, não feito aqui.

create table if not exists arquivo_fontes (
  id                        uuid primary key default gen_random_uuid(),
  url_original              text not null,
  capturado_em              timestamptz not null default now(),
  http_status               integer,
  content_type              text,
  tamanho_bytes             integer,
  sha256                    text not null,
  modo_armazenamento        text not null default 'local'
                              check (modo_armazenamento in ('local', 'r2')),
  caminho_armazenamento     text not null,
  aprovado_para_publicacao  boolean not null default false,
  motivo_reprovacao         text,
  erro_captura              text,
  user_agent                text not null,
  created_at                timestamptz default now()
);

-- "existe cópia para esta URL, e qual é a mais recente" — a consulta que
-- toda página que mostra um link de fonte precisa fazer.
create index if not exists arquivo_fontes_url_capturado_idx
  on arquivo_fontes (url_original, capturado_em desc);

create index if not exists arquivo_fontes_sha256_idx
  on arquivo_fontes (sha256);

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    grant select on arquivo_fontes to anon;
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    grant select on arquivo_fontes to authenticated;
  end if;
end $$;
