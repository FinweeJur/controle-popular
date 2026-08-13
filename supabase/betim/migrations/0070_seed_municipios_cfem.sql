-- Semeia linhas MÍNIMAS em `municipios` para municípios mineradores de MG que
-- não são cidade onboardada do produto (sem domínio, sem branding, sem
-- conteúdo) — só para destravar `royalties_cfem`/`royalties_cfem_empresas`
-- (migration 0044), que têm FK em `municipios` (6 linhas) mesmo a CFEM sendo,
-- por natureza da fonte (ANM, sem chave, por município do dropdown), uma
-- camada ESTADUAL — ver docs/FONTES-FLUXO-FINANCEIRO.md §4.1, que já
-- registrava esta linha mínima como o destravamento de menor custo.
--
-- `ativo = false` DE PROPÓSITO: `apps/web/lib/db/queries/municipios.ts`
-- (`listarCidadesDoPostgres`) só lista `where ativo = true`, e é essa lista
-- que vira rota (`generateStaticParams`) e cidade "onboardada" no produto.
-- Uma linha com `ativo = false` grava CFEM sem nunca aparecer como cidade do
-- eixo Cidades — exatamente o comportamento que se quer aqui: destravar o
-- dado sem fingir branding/domínio que não existem.
--
-- ═══ POR QUE ESTAS SETE CIDADES, E NÃO AS 854 ═══
--
-- Não é a varredura estadual completa (item 6 do §5 da pesquisa, "a etapa
-- cara" — cada cidade no coletor da ANM é uma cascata de 3 postbacks +
-- ~22 anos de série, WebForms, sem paralelismo confortável). É uma amostra
-- deliberada dos municípios de maior peso minerário de MG fora do
-- Jequitinhonha (que já tinha Araçuaí/Itinga/Diamantina semeados pela
-- 0043): Quadrilátero Ferrífero (ferro, ouro) — a outra província mineral
-- que compete em volume com o lítio do Vale. Serve para a camada de CFEM não
-- nascer restrita a uma única região, mas ainda NÃO é cobertura estadual —
-- o texto da camada tem de dizer isso.
--
-- Códigos IBGE conferidos contra `ref_municipios_mg` (migration 0057, que já
-- carregou os 853 municípios de MG a partir da fonte do IBGE).
insert into municipios (id_municipio, nome, uf, ativo)
values
  ('3131703', 'Itabira', 'MG', false),
  ('3140001', 'Mariana', 'MG', false),
  ('3144805', 'Nova Lima', 'MG', false),
  ('3118007', 'Congonhas', 'MG', false),
  ('3118304', 'Conselheiro Lafaiete', 'MG', false),
  ('3109006', 'Brumadinho', 'MG', false),
  ('3146107', 'Ouro Preto', 'MG', false)
on conflict (id_municipio) do nothing;
