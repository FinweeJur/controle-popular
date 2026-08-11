-- Censo de licenciamento ambiental de MG (IDE-Sisema/SEMAD), a "espinha
-- dorsal" do eixo /ambiental. Coletor: `etl/betim/etl/apis/ambiental_licenciamento.py`.
-- Fonte, contrato e armadilhas medidas: `docs/ambiental/F0-discovery.md` §1 e §3.
--
-- ═══ POR QUE `id_fonte` É O `fid` DO WFS, NÃO ALGO EXTRAÍDO DO `link` ═══
--
-- O plano original cogitava o `idSolicitacao` de dentro do `link`
-- (`.../acesso-visitante/{id}/{cod_atividade}`) como chave natural — é a
-- chave de junção com o SLA, medida no F0 §2.1. Medido ao vivo contra a
-- fonte em 2026-08-11 antes de fixar isso: **41 feições têm o `link`
-- IDÊNTICO (string exata) a outra feição com `n_solicit`, `mun_solic`,
-- `cpf_cnpj`, `classe` e datas TOTALMENTE diferentes** — não é o mesmo
-- processo visto duas vezes, são dois licenciamentos distintos com o mesmo
-- link, bug de origem na própria fonte. Usar esse id como chave teria
-- perdido uma das duas licenças em cada colisão (upsert) ou abortado a
-- carga (unique constraint). `fid` é o id interno do próprio WFS/GeoServer
-- — únicos nos 19.713/19.713 medidos, sem exceção — e é o que garante que
-- as 41 colisões viram 82 linhas, não 41.
--
-- ═══ POR QUE NÃO HÁ COLUNA DE GEOMETRIA/SEGUNDA PASSADA PAGINADA ═══
--
-- O F0 §1.1 documenta duas estratégias porque a coordenada, na trajetória
-- original, só vinha da coluna `geom` (Point) — e pedir `geom` da camada
-- inteira aborta o stream no meio (feição com coordenada não-finita) sem
-- status de erro. Medido ao vivo em 2026-08-11: a camada TAMBÉM expõe
-- `latitude`/`longitude` como colunas ESCALARES (`xsd:double`), fora de
-- `geom` — confirmado no `DescribeFeatureType`. Pedir só essas colunas (a
-- MESMA estratégia 1 do F0: `propertyName=` sem `geom`) devolveu as
-- 19.713/19.713 feições LIMPAS, com `latitude`/`longitude` preenchidos em
-- 100% delas e nenhuma fora da caixa de MG. A necessidade que motivava a
-- segunda passada (paginar `geom` para isolar a feição envenenada) deixou
-- de existir: o coletor nunca toca em `geom`. A guarda do corpo
-- (`if "ExceptionReport" in corpo: raise`) continua no coletor mesmo assim
-- — o princípio "nunca confiar só no status" vale para qualquer resposta
-- desta fonte, não só para o caminho que a única passada usa hoje.
--
-- ═══ `documento` — A CLASSIFICAÇÃO É POR DÍGITO VERIFICADOR, NÃO POR TAMANHO ═══
--
-- `cpf_cnpj` é campo NUMÉRICO na fonte: zero à esquerda corta (confirmado
-- ao vivo — ex. um CPF que começa com 0 chega com 10 dígitos, não 11).
-- `zfill` sozinho não resolve qual tamanho usar: um valor de 9 dígitos pode
-- ser um CNPJ com raiz começada em zero (zfill(14)) ou um CPF começado em
-- zero (zfill(11)), e o comprimento cru não distingue os dois casos. O
-- coletor decide pelo DÍGITO VERIFICADOR oficial (mod 11) dos dois
-- documentos, não por comprimento — ver `_classificar_documento` no
-- coletor. Medido contra as 19.713 linhas (2026-08-11):
--
--   cnpj_redigido_pela_fonte    13.262  (termina em 6 zeros — raiz preservada, filial+DV zerados)
--   cpf                          4.615  (valida só como CPF)
--   cnpj_nao_redigido            1.569  (valida só como CNPJ — a fonte publicou inteiro)
--   indeterminado_tratado_como_pf   265  (valida como CPF E como CNPJ ao mesmo tempo —
--                                         ambíguo de verdade, não erro de código; tratado
--                                         pelo lado mais protetor: sem raiz, sem nome, sem
--                                         coordenada, exatamente como pessoa física)
--   corrompido_na_fonte              2  (ex. "4,24174E+13" — número virou notação
--                                        científica de planilha na própria fonte;
--                                        irrecuperável, mesmo tratamento do indeterminado)
--
-- 13.262 redigidos bate EXATO com o "13.262 de 14.360 (92%)" do F0 §1.3 —
-- mesma fonte, mesmo critério. O CPF (4.615) e o CNPJ não-redigido (1.569)
-- divergem dos "4.802"/"~1.098" do F0 porque aquela medição separava por
-- COMPRIMENTO, não por dígito verificador — o método daqui resolve a
-- ambiguidade que o comprimento cru não resolve (ver acima), então a
-- diferença é o método ficando mais correto, não a fonte mudando.
--
-- ═══ SEGUNDO VAZAMENTO, NÃO DOCUMENTADO NO F0: CPF COLADO NO NOME (MEI) ═══
--
-- O F0 §1.3 já registrava "nome com CPF colado no texto (padrão MEI): 273"
-- como achado geral. Medido ao vivo para ESTA carga: **360 linhas** têm um
-- CPF de 11 dígitos dentro do texto livre de `nome_pf_pj` (ex.
-- `"ANDREIVE PEDRO MARQUES 05593124663"`, `"EDMAR GERALDO DA COSTA CPF
-- 392.386.876-68"`) — e as 360 são TODAS classificadas como CNPJ
-- (redigido ou não), ou seja, TODAS entrariam como "empreendimento PJ,
-- publicar nome e coordenada" pela regra normal. Gravar o texto cru
-- vazaria o CPF do titular por uma coluna que o resto da regra de
-- privacidade nem olha. `_sanitizar_nome` no coletor remove o número (e o
-- rótulo "CPF"/"CNPJ" ao lado) ANTES de gravar `nome_empreendimento`,
-- para todo PJ — não só para os 360 já achados, porque a fonte pode
-- colar outro CPF em outro nome na próxima coleta.
--
-- ═══ POR QUE NÃO HÁ CENTROIDE DE MUNICÍPIO NO LUGAR DA COORDENADA DE PF ═══
--
-- A tarefa sugeriu, condicionalmente, substituir a coordenada por
-- "o centroide do município, mesmo padrão que o projeto já usa nesse tipo
-- de caso, se houver precedente". Verificado: NÃO há precedente — nenhuma
-- tabela deste projeto grava centroide de município, e `ref_municipios_mg`
-- (migration `0057`) só tem `id_ibge`/`nome`, sem geometria. A licença da
-- malha municipal do IBGE é, inclusive, um `[VERIFY]` em aberto do F0 §8
-- item 3. Fabricar um centroide sem fonte validada seria inventar dado
-- geográfico — o oposto do "número medido, não impressão" deste projeto.
-- A escolha, então, é a mais simples e a mais segura: `latitude`/
-- `longitude` ficam NULL para pessoa física (e para o indeterminado, que
-- é tratado do mesmo jeito). Documentado aqui para quem quiser resolver o
-- `[VERIFY]` da malha do IBGE e reabrir esta decisão depois.
--
-- ═══ `setor_letra`/`subsetor` VÊM DE `cod_atvpri`, NUNCA DE `listagem` ═══
--
-- Confirmado ao vivo (2026-08-11): o mesmo setor (`B`) aparece em
-- `listagem` como "B - Atividades Industriais/Indústria Metalúrgica e
-- Outras" (1.866 linhas) E como "B -  Atividades industriais / Indústria
-- Metalúrgica e Outras" (69 linhas, dois espaços, caixa diferente) — e
-- ACHADO NOVO: **uma linha tem `cod_atvpri` começando em "B-" mas
-- `listagem` começando em "C -..."** (divergência real na própria fonte,
-- não erro de leitura). `cod_atvpri[0]` é a letra oficial (nunca falha:
-- 19.713/19.713 preenchidas, sempre no padrão `X-NN-...`); `setor_rotulo`
-- vem de um dicionário fixo por letra (a DN Copam 217/2017), não do texto
-- livre da fonte. `subsetor` é `cod_atvpri[:4]` (ex. `"F-05"`) — 42
-- valores distintos observados nas licenças emitidas, dos 44 catalogados
-- no F0 §3 (nem todo subsetor tem licença concedida ainda).
--
-- ═══ O QUE ESTA TABELA NÃO PROVA ═══
--
-- É o registro HISTÓRICO de licenças já concedidas (`status_pro` tem um
-- único valor, "Concluído Deferido", nas 19.713 — F0 §1.2). Não é a fila
-- viva (isso é o SLA, ecosistemas.meioambiente.mg.gov.br, não coletado
-- aqui) nem confirma que a licença ainda está ativa hoje — só que foi
-- deferida.

create table if not exists ambiental_licenciamento (
  id                         uuid primary key default gen_random_uuid(),
  id_fonte                   bigint not null,               -- `fid` do WFS (ver nota acima: `link` NÃO é chave confiável)
  id_municipio               text not null references ref_municipios_mg(id_ibge) on delete cascade,
  municipio_fonte            text not null,                 -- grafia crua da fonte (`mun_solic`)
  setor_letra                text not null,                 -- A..H, de `cod_atvpri[0]`
  setor_rotulo               text not null,                 -- rótulo oficial canônico (DN Copam 217/2017)
  subsetor                   text not null,                 -- `cod_atvpri[:4]`, ex. "F-05"
  atividade_codigo           text not null,                 -- `cod_atvpri` completo
  atividade_descricao        text,                          -- `des_atvpri`
  modalidade                 text not null,                 -- `modl_licen`: LAS CADASTRO | LAS RAS | LAC1 | LAC2 | LAT
  classe                     smallint,                      -- 1..6
  fase_licenciamento         text not null,                 -- normalizado (maiúsculo/trim) — ver armadilha acima
  fase_licenciamento_fonte   text,                          -- texto cru, para auditoria
  situacao                   text not null,                 -- `status_pro`
  tipo_solicitacao           text,                          -- `tipo_solic`
  numero_solicitacao         text,                          -- `n_solicit`
  numero_processo            text,                          -- `n_processo`
  documento_classificacao    text not null,                 -- cnpj_redigido_pela_fonte | cnpj_nao_redigido | cpf | indeterminado_tratado_como_pf | corrompido_na_fonte
  cnpj_raiz                  char(8),                       -- só quando documento_classificacao é um dos dois "cnpj_*"
  eh_pessoa_fisica           boolean not null default false,
  nome_empreendimento        text,                          -- só PJ; sanitizado (nunca nome de PF, nunca CPF colado — ver nota acima)
  latitude                   numeric(9, 6),                 -- só PJ (ver nota sobre centroide acima)
  longitude                  numeric(9, 6),                 -- só PJ
  data_emissao               date,
  data_validade               date,
  link                        text,                          -- cru; NUNCA usado como chave (ver nota acima)
  atualizado_em               date default current_date,
  created_at                  timestamptz default now(),
  updated_at                  timestamptz,
  unique (id_fonte)
);

create index if not exists ambiental_licenciamento_municipio_idx
  on ambiental_licenciamento (id_municipio);
create index if not exists ambiental_licenciamento_setor_idx
  on ambiental_licenciamento (setor_letra);
create index if not exists ambiental_licenciamento_modalidade_idx
  on ambiental_licenciamento (modalidade);
create index if not exists ambiental_licenciamento_classe_idx
  on ambiental_licenciamento (classe);

do $$
begin
  if exists (select 1 from pg_roles where rolname = 'anon') then
    grant select on ambiental_licenciamento to anon;
  end if;
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    grant select on ambiental_licenciamento to authenticated;
  end if;
end $$;
