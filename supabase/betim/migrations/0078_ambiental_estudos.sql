-- Audiências públicas de EIA/RIMA e as decisões de licenciamento associadas.
-- Fonte: sistemas.meioambiente.mg.gov.br/licenciamento/site/
--   view-audiencia?id=N (audiências) e view-externo?id=N (decisões).
-- Medições abaixo feitas ao vivo em 2026-08-20.
--
-- ═══ (a) POR QUE `id_fonte` É A CHAVE NATURAL, NÃO O NÚMERO DO PROCESSO ═══
--
-- O número de processo publicado vem no formato `33646/2026/___/____`, com
-- sublinhados literais nos campos que a fonte não preencheu — não é um
-- identificador estável (dois registros distintos podem publicar o mesmo
-- texto com blank) nem garantidamente único. `id_fonte` é o `?id=` da
-- própria URL de detalhe, sempre presente e sempre único na fonte — mesmo
-- raciocínio de `copam_reunioes.id_fonte` (migration 0062) e do `fid` de
-- `ambiental_licenciamento` (migration 0064): usar um campo de conteúdo
-- como chave quebra na primeira vez que o conteúdo vier vazio ou repetido;
-- o id da própria URL não quebra porque é o que a fonte usa para servir a
-- página.
--
-- ═══ (b) POR QUE `municipios_*` SÃO ARRAYS PARALELOS, NÃO TABELA DE LIGAÇÃO ═══
--
-- Mesmo desenho de `copam_pauta_itens` (migration 0062, ver docstring lá):
-- a fonte publica o campo de município como texto livre, às vezes com mais
-- de um nome numa audiência só (empreendimento que atravessa municípios), e
-- a ligação audiência↔município não carrega nenhum atributo próprio (não
-- há "papel do município nesta audiência" a modelar) — não há o que uma
-- tabela de junção acrescentaria além de linhas a mais para manter. Um
-- array por audiência resolve isso sem join, e o índice GIN abaixo cobre a
-- consulta real da tela ("que audiências tratam do meu município"):
-- `municipios_ids @> ARRAY[$1]` ou `$1 = ANY(municipios_ids)`.
--
-- ═══ (c) POR QUE EXISTE `municipios_nao_resolvidos` ═══
--
-- Município que a fonte cita mas que não casa contra `ref_municipios_mg`
-- (grafia divergente, nome incompleto, erro de digitação na origem) tem que
-- ficar VISÍVEL nesta coluna — nunca descartado em silêncio. Array vazio
-- aqui é achado (toda menção casou); linha que desaparece sem deixar rastro
-- é dado perdido calado, o oposto do padrão do projeto (mesmo princípio de
-- "casar por código, relatar o que não casou" do AGENTS.md).
--
-- ═══ (d) POR QUE NUNCA HÁ COLUNA DE CPF ═══
--
-- A fonte publica CPF em claro na própria coluna de CNPJ/CPF do
-- empreendedor (medido: `000.000.000-00 (CPF real, redigido aqui)`, pessoa física identificada). O
-- coletor redige esse dado NA ORIGEM, antes de qualquer insert — nunca
-- chega ao banco. O schema, por desenho, não oferece nenhuma coluna onde um
-- CPF caberia: só `cnpj_raiz char(8)` (8 dígitos, não cabe um CPF de 11) e
-- `eh_pessoa_fisica boolean`, que marca o caso sem guardar o número. Ver
-- também `ambiental_licenciamento.cnpj_raiz` (migration 0064) — mesmo
-- padrão, mesma razão.
--
-- ═══ (e) POR QUE `links_eia_rima` E `repositorio_tipos` SÃO ARRAYS ═══
--
-- ⟲ CORRIGIDO 20/08/2026 depois de MEDIR 458 fichas. A primeira versão desta
-- migration tinha `link_eia_rima text` e um CHECK de três valores
-- ('drive','externo','ausente'). As duas coisas estavam erradas, e o erro era
-- do mesmo tipo: presumir a forma da fonte em vez de contar.
--
--   1. O campo pode ter MAIS DE UMA URL. Medido: a ficha 15 (consultoria
--      Nativa) traz duas URLs no mesmo campo, separadas por " / ", e as duas
--      são PDF direto. Guardar `text` obrigaria a escolher uma e perder a
--      outra — ou a gravar a string dupla, que não é URL nenhuma (foi o que
--      fez o primeiro download devolver HTTP 000).
--   2. "externo" não é UM estado, são sete. Contagem por link em 458 fichas:
--         site de consultoria/empreendedor  111
--         Google Drive                       97
--         Dropbox                            42
--         OneDrive                           17
--         PDF direto (link do arquivo)       17
--         MEGA                                6
--         Google Sites                        4
--         página institucional do órgão       9   <- e essa NÃO é estudo nenhum
--      A distinção importa porque cada uma se comporta diferente: Drive e PDF
--      direto o coletor baixa; Dropbox devolve zip da pasta; MEGA e OneDrive
--      exigem cliente próprio; site de consultoria é página, não arquivo; e
--      "órgão" aqui é link errado na origem, apontando para a lista de
--      SUPRAMs em vez do estudo. Achatar tudo em "externo" faria a página
--      prometer link que não entrega.
--
-- Não há CHECK sobre o array de propósito: vocabulário fechado em CHECK
-- transforma "a fonte inventou um host novo" em erro de carga no meio da
-- madrugada. A validação do vocabulário mora no coletor, que reporta o
-- desconhecido em vez de derrubar a ingestão.
--
-- ═══ (e2) O QUE ISSO SIGNIFICA, E QUE A PÁGINA TEM DE DIZER ═══
--
-- O Estado de Minas NÃO hospeda o EIA/RIMA. Ele publica um link para a nuvem
-- pessoal do empreendedor ou da consultoria. A consequência é medível: entre
-- os primeiros links testados, 9 já respondem 404 — estudo que embasou uma
-- licença e hoje não abre para ninguém.
--
-- ═══ (f) O AVISO QUE A PÁGINA VAI REPETIR ═══
--
-- Os arquivos de estudo (EIA/RIMA/PCA/RCA) moram em pastas do Google Drive
-- DE TERCEIROS (do empreendedor ou do órgão), não deste projeto. O link
-- pode morrer sem aviso a qualquer momento — a mitigação é espelhamento
-- SELETIVO via `arquivo_fontes` (migration 0076, ver docstring lá sobre por
-- que aquilo é tabela própria e por url, não coluna aqui) num passo
-- posterior e deliberado, não uma coluna de "cópia automática" nesta
-- migration.
--
-- ═══ (g) POR QUE `ambiental_decisoes.municipio_nome` EXISTE ALÉM DA FK ═══
--
-- A fonte dá o nome do município como texto. Se o casamento contra
-- `ref_municipios_mg` falhar (`municipio_id` fica NULL), o nome ORIGINAL
-- precisa sobreviver na própria linha para auditoria — sem ele, uma
-- decisão sem município resolvido vira uma linha muda, impossível de
-- investigar depois sem voltar à fonte. Mesmo princípio do item (c) acima,
-- aplicado a uma FK escalar em vez de um array.
--
-- ═══ TRÊS TABELAS, NÃO DUAS: DOCUMENTO DE ESTUDO É 1:N DA AUDIÊNCIA ═══
--
-- Uma audiência pode publicar mais de um arquivo de estudo (EIA e RIMA
-- separados, mais ART, mais anexo) — não cabe em colunas de
-- `ambiental_audiencias`. `ambiental_estudo_documentos` guarda uma linha
-- por ARQUIVO, com FK e cascade para a audiência (mesma razão de
-- `copam_pauta_itens` referenciar `copam_reunioes`: o documento não existe
-- sem a audiência que o publicou). `classe_estudo_confianca` registra COMO
-- o coletor decidiu a classe (regex no nome do arquivo, LLM quando o nome
-- não é conclusivo, ou indefinido quando nenhum dos dois resolveu) — para
-- que a tela possa, se quiser, tratar diferente o que foi inferido por
-- modelo do que foi lido direto do nome do arquivo.

create table if not exists ambiental_audiencias (
  id                          uuid primary key default gen_random_uuid(),
  id_fonte                    integer not null,             -- o ?id= de view-audiencia (ver nota (a))
  numero_processo             text,                          -- cru da fonte; NUNCA chave (ver nota (a))
  nome_empreendimento         text,
  cnpj_raiz                   char(8),                       -- só quando documento_classificacao é cnpj_* (ver nota (d))
  eh_pessoa_fisica            boolean not null default false,
  documento_classificacao     text not null,                 -- cnpj_redigido_pela_fonte | cnpj_nao_redigido | cpf | indeterminado_tratado_como_pf | corrompido_na_fonte
  municipios_ids               text[],                        -- ref_municipios_mg.id_ibge, um ou mais (ver nota (b))
  municipios_nomes             text[],                        -- grafia da fonte, paralelo a municipios_ids
  municipios_nao_resolvidos    text[],                        -- menções que não casaram (ver nota (c)) — nunca descartadas
  unidade_regional             text,
  classe                       smallint,                      -- 1..6
  modalidade                   text,
  atividades_descricoes        text[],
  data_publicacao              date,
  data_limite_solicitacao      date,
  link_iof                     text,                          -- Instrumento de Orientação Básica
  links_eia_rima               text[],                        -- PLURAL: ver nota (e)
  repositorio_tipos            text[] not null default '{}',  -- um por link, mesmo indice (ver nota (e))
  atualizado_em                date default current_date,
  created_at                   timestamptz default now(),
  updated_at                   timestamptz,
  unique (id_fonte)
);

-- A consulta que a tela faz: "que audiências tratam do meu município".
create index if not exists ambiental_audiencias_municipios_idx
  on ambiental_audiencias using gin (municipios_ids);
create index if not exists ambiental_audiencias_classe_idx
  on ambiental_audiencias (classe);
create index if not exists ambiental_audiencias_data_publicacao_idx
  on ambiental_audiencias (data_publicacao desc);
-- GIN, nao btree: `repositorio_tipos` virou array (nota (e)), e a consulta da
-- tela e' de pertinencia ("audiencias cujo estudo esta no Drive"), nao de
-- igualdade. btree em text[] indexa o array inteiro como valor unico e nao
-- serve a `@>` nem a `= ANY`.
create index if not exists ambiental_audiencias_repositorio_tipos_idx
  on ambiental_audiencias using gin (repositorio_tipos);

create table if not exists ambiental_estudo_documentos (
  id                          uuid primary key default gen_random_uuid(),
  id_audiencia                uuid not null references ambiental_audiencias(id) on delete cascade,
  nome_arquivo                 text not null,
  classe_estudo                 text not null
                                  check (classe_estudo in ('eia', 'rima', 'pca', 'rca', 'art', 'outro')),
  classe_estudo_confianca       text not null
                                  check (classe_estudo_confianca in ('regex', 'llm', 'indefinido')),
  id_drive                      text,                          -- id do arquivo no Google Drive, quando repositorio_tipo = 'drive'
  url_download                  text,
  ordem                         int,                           -- posição como a fonte lista, para reproduzir a ordem original
  created_at                    timestamptz default now(),
  updated_at                    timestamptz,
  unique (id_audiencia, nome_arquivo)
);

create index if not exists ambiental_estudo_documentos_audiencia_idx
  on ambiental_estudo_documentos (id_audiencia);
create index if not exists ambiental_estudo_documentos_classe_idx
  on ambiental_estudo_documentos (classe_estudo);

create table if not exists ambiental_decisoes (
  id                          uuid primary key default gen_random_uuid(),
  id_fonte                    integer not null,             -- o ?id= de view-externo (mesma família de chave que (a))
  regional                     text,
  municipio_id                 text references ref_municipios_mg(id_ibge),
  municipio_nome                text,                          -- grafia da fonte; sobrevive mesmo se municipio_id ficar NULL (ver nota (g))
  nome_empreendimento           text,
  cnpj_raiz                     char(8),                       -- ver nota (d)
  eh_pessoa_fisica               boolean not null default false,
  documento_classificacao        text not null,                 -- mesmo vocabulário de ambiental_audiencias.documento_classificacao
  numero_processo                 text,
  numero_protocolo                text,
  modalidade                       text,
  classe                           smallint,
  atividade                         text,
  ano                               smallint,
  mes                               text,
  data_publicacao                   date,
  decisao                           text,
  link_certificado                   text,
  links_outros_documentos             text[],
  created_at                          timestamptz default now(),
  updated_at                          timestamptz,
  unique (id_fonte)
);

create index if not exists ambiental_decisoes_municipio_idx
  on ambiental_decisoes (municipio_id);
create index if not exists ambiental_decisoes_data_publicacao_idx
  on ambiental_decisoes (data_publicacao desc);
create index if not exists ambiental_decisoes_decisao_idx
  on ambiental_decisoes (decisao);

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    grant select on ambiental_audiencias to anon;
    grant select on ambiental_estudo_documentos to anon;
    grant select on ambiental_decisoes to anon;
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    grant select on ambiental_audiencias to authenticated;
    grant select on ambiental_estudo_documentos to authenticated;
    grant select on ambiental_decisoes to authenticated;
  end if;
end $$;
