# Ambiental — F0 · Descoberta de fontes

> Sondado ao vivo em **2026-08-07**. Tudo abaixo foi verificado contra o serviço real;
> o que não foi está marcado **[VERIFY]** e nomeia quem tem de resolver.
> Licenças de uso das fontes: `docs/ambiental/PROVENIENCIA.json`.

O eixo `/ambiental` cobre licenciamento ambiental de MG (SEMAD/COPAM), barragens e um
painel unificado de legislação ambiental nacional e estadual.

---

## 1. A espinha dorsal — IDE-Sisema (WFS)

`https://geoserver.meioambiente.mg.gov.br/IDE/ows` · anônimo · `Fees: NONE`, `AccessConstraints: NONE`

| Camada | Feições | Verificado |
|---|---|---|
| `IDE:ide_2101_mg_empreendimentos_licenciados_pto` | **19.162** (`numberMatched`) | censo completo, abaixo |
| `IDE:ide_1901_mg_barragens_rejeitos_residuos_pto` | 259 | tem `id_sigibar` |
| `ide_2301_mg_fiscalizacoes_realizadas_pto` | — | nome só |
| `ide_2304_mg_areas_embargadas_sisema_pol` | — | **CC BY 4.0** |

**Descoberta de camada é pelo CSW do GeoNetwork, não por `GetCapabilities`** — o
capabilities trunca em ~300 de 1.405 camadas e faz camada existente parecer inexistente:

```
https://idesisema.meioambiente.mg.gov.br/geonetwork/srv/por/csw
  ?service=CSW&version=2.0.2&request=GetRecords&typeNames=csw:Record
  &resultType=results&constraintLanguage=CQL_TEXT
  &constraint=AnyText like '%barragem%'
```

`/sistemas` **não** é um segundo workspace: uma camada `IDE:` resolve por lá, então é
alias do mesmo OWS global. Não há conjunto `sistemas:` para minerar.

### 1.1 ⚠️ A armadilha que decide o desenho do coletor

Pedir a camada inteira em `outputFormat=application/json` **falha em silêncio**:

```
HTTP 200 · Content-Type: application/json;charset=UTF-8 · Transfer-Encoding: chunked
...,"geometry":{"type":"Point","coordinates":<?xml version="1.0"?><ows:ExceptionReport ...>
   ... non-finite numbers</ows:ExceptionText>
```

Uma feição com coordenada não-finita aborta o stream. Como o corpo é *chunked* e o
**200 já foi enviado**, não existe status de erro. Um coletor ingênuo ou estoura no
parser (bom) ou, com parser tolerante, **grava 145 de 19.162 e reporta sucesso** (péssimo).

**Regra: a guarda vai no CORPO, nunca no status.** `if "ExceptionReport" in corpo: raise`.

Dois contornos, ambos testados, e o coletor usa os dois:

| Estratégia | Resultado |
|---|---|
| `propertyName=<campos>` **sem a coluna de geometria** | ✅ 19.162 feições limpas numa passada |
| `startIndex` + `maxFeatures` com geometria | ✅ isola a feição ruim numa página; `startIndex=0` e `200` passam, `100`/`140`/`145` envenenam |

Ou seja: **atributos numa passada sem geometria; geometria numa segunda passada paginada**,
com a página envenenada reduzida até identificar e pular a feição, que entra na
divulgação de cobertura. Como coordenada de pessoa física é substituída pelo centroide
do município (§5), a geometria só é necessária para pessoa jurídica.

### 1.2 Censo das 19.162 feições

**`status_pro` tem UM único valor: `Concluído Deferido`, nas 19.162.**

> **Isto corrige uma premissa do plano.** A camada é o **registro histórico de licenças
> já concedidas**, não a fila viva. Nada "Em Análise" está aqui — e "em análise" é
> exatamente o que ainda dá para influenciar. O WFS **não** substitui o SLA nem as
> pautas do COPAM para a função de participação; ele é completo para o que já foi decidido.

| Campo | Distribuição |
|---|---|
| `modl_licen` | LAS CADASTRO 13.458 · LAS RAS 4.160 · LAC1 1.019 · LAC2 472 · LAT 53 |
| `classe` | 2: 14.579 · 3: 1.950 · 1: 1.412 · 4: 1.049 · 5: 104 · 6: 68 |
| `fase_licen` | `NÃO SE APLICA` 17.159 · LOC 643 · **`Não se aplica` 456** · LP+LI+LO 394 · LO 214 · LP 140 · LIC+LO 103 · LP+LI 34 |
| `tipo_solic` | 11 valores; "Nova solicitação" 12.758 |
| `mun_solic` | **NOME**, não código IBGE. 830 de 853 municípios. Uberlândia 640, Paracatu 305, Betim 12 |

**`listagem` já traz a letra e o rótulo oficial** — não precisamos redigir taxonomia:

```
G - Atividades Agrossilvipastoris ................ 5.486
F - Gerenciamento de Resíduos e Serviços ......... 3.902
A - Atividades Minerárias ........................ 3.421
B - Atividades Industriais/Indústria Metalúrgica e Outras  1.815
E - Atividades de Infraestrutura ................. 1.775
C - Atividades Industriais/Indústria Química e Outras      1.404
D - Atividades Industriais/Indústria Alimentícia . 1.221
B -  Atividades industriais / Indústria Metalúrgica e Outras  69   <-- MESMA letra
```

⚠️ **Normalizar SEMPRE pela letra, nunca pela string.** `B` aparece com dois espaços e
caixa diferente (69 linhas), e `fase_licen` tem `NÃO SE APLICA`/`Não se aplica`. Facetar
por string parte a contagem em duas e nenhum erro aparece.

### 1.3 Documento do titular — o achado de privacidade

| | |
|---|---|
| CNPJ | 14.360 |
| **CPF (11 dígitos, em claro)** | **4.802 — 25% da camada** |
| CNPJ redigido pela fonte (termina em 6 zeros) | 13.262 de 14.360 (92%) |
| Nome com CPF colado no texto (padrão MEI) | **273** |

- O campo é **numérico**: zeros à esquerda vêm cortados (13, 12 dígitos). **`zfill(14)`/`zfill(11)` antes de qualquer coisa.**
- A fonte **redige o CNPJ**: preserva a raiz de 8 dígitos e zera filial e DV. Guardar o
  valor zerado como CNPJ seria **publicar o CNPJ de outra empresa**. Grava-se `cnpj_raiz char(8)`.
  Note que ~1.098 CNPJs **não** estão redigidos — o coletor tem de tratar os dois casos.
- A fonte **publica CPF em claro**, ao lado do nome e da coordenada exata. É a forma
  exata do "Risco 1" do Terras Devolutas, e aqui não é hipótese: é o estado do dado.
- O `nome_pf_pj` também vaza CPF (MEI). **O texto é vetor de vazamento.**

---

## 2. SLA — a fila viva

`https://ecosistemas.meioambiente.mg.gov.br` — Next.js com BFF. A configuração sai de
`/environments-api/?variaveis=…`, **o mesmo padrão do `/env.json` das SPAs da PBH**.

| Endpoint | Devolve |
|---|---|
| `GET /sla/processo/atividades` | 247 atividades da DN COPAM 217/2017 |
| `GET /sla/processo/municipiosMG` | 853 municípios com `codIbge`, `idMunicipio` interno, `sigla`/`idSupram` (URA) |
| `GET /sla/modalidade/listar` | LAS CADASTRO, LAS RAS, LAC1, LAC2, LAT |
| `POST /sla/processo/listar` | `{"paginacao":{"sort":[],"size":N,"changedQuery":true,"totalElements":0,"pageNumber":0},"idMunicipio":3921}` |

Armadilhas medidas:

- Consulta **sem filtro devolve 0**; só `idModalidade` devolve 0. Exige `idMunicipio` —
  a coleta é 1 requisição por município (853), educada por construção.
- Betim: `totalElements`=22 mas `content.length`=**23**. `idSolicitacao` distintos = 22,
  `idProcesso` distintos = **18**. **A contagem mente, vem linha duplicada, e um processo
  tem várias solicitações.** Paginar até página curta; dedup por `idSolicitacao`.
- `featureCollection` é sempre `null` na lista.
- Vocabulário de status **diferente do WFS**: `Solicitação Deferida - Processo Concluído`
  aqui, `Concluído Deferido` lá. Precisa de mapa de normalização com o literal de cada
  fonte preservado ao lado do normalizado.

### 2.1 A chave de junção WFS ↔ SLA — resolvida

Testado em Betim (12 feições WFS × 23 linhas SLA):

| Par | Casamentos |
|---|---|
| id dentro do `link` do WFS ∩ `idSolicitacao` | **12 de 12** ✅ |
| id dentro do `link` ∩ `idProcesso` | 0 |
| `n_solicit` (WFS) ∩ `numeroProtocolo` (SLA) | 0 |
| `n_processo` (WFS) ∩ `numeroProtocolo` (SLA) | 11 de 12 |

**A chave canônica é o `idSolicitacao` extraído do `link`** (`.../acesso-visitante/{idSolicitacao}/{cod_atividade}`).
Cuidado com a nomenclatura cruzada: **`n_processo` do WFS é o `numeroProtocolo` do SLA**,
e `n_solicit` do WFS (`2023.11.04.003.0001724`) tem formato pontuado sem contraparte na lista do SLA.

### 2.2 Política de acesso — decisão, não implementação

A UI do SLA dispara `POST /sla/recaptcha` antes de buscar. O `POST /sla/processo/listar`
respondeu 200 sem token, mas **o primário é o WFS** (que declara acesso livre) e o SLA é
enriquecimento: 1 pedido por vez, ≥2 s entre pedidos, semanal, `User-Agent` identificável
com URL de contato.

**Regra de parada, sem exceção:** 403/429, desafio de CAPTCHA no corpo, ou exigência de
token ⇒ grava `fontes_externas.ultimo_status='bloqueado_por_captcha'`, `SystemExit` com
instrução ao operador, e **para**. Não retentar, não trocar UA, não obter token em
navegador, não terceirizar resolução.

---

## 3. Setores — a taxonomia é oficial, não nossa

A **primeira letra** do `codigo` da atividade é o setor da DN COPAM 217/2017, e o campo
`listagem` do WFS já traz o rótulo oficial. Os prefixos de 4 caracteres dão o subsetor,
e é deles que saem os agrupamentos populares que o usuário pediu:

| Prefixo | Conteúdo (amostra real) | n |
|---|---|---|
| `A-01`…`A-07` | lavra subterrânea, lavra a céu aberto, areia/cascalho, água mineral, **UTM e barragem de rejeito (A-05)**, petróleo/gás, pesquisa mineral | 27 |
| `B-01`…`B-10` | britamento, cal, cerâmica, siderurgia, ferroligas, metalurgia não-ferrosa, galvanotécnica, veículos, móveis | 45 |
| `C-01`…`C-10` | celulose/papel, borracha, couro, **química (C-04, 18 atividades)**, medicamentos, cosméticos, plásticos, têxtil, calçados, concreto | 43 |
| `D-01`…`D-03` | abate e alimentos (19), bebidas (6), fumo (1) | 26 |
| **`E-01`** | **rodovias, ferrovias, trens metropolitanos** → *transporte* | 18 |
| **`E-02`** | **hidrelétrica, CGH, termoelétrica fóssil e não fóssil, +4** → *energia* | 8 |
| `E-03` | barragem de acumulação, ETA, interceptores e emissários de esgoto → *saneamento* | 9 |
| `E-04` | loteamento urbano, distrito industrial | 2 |
| `E-05` | barragens de amortecimento de cheias, diques, dragagem, transposição | 7 |
| `F-01` | recebimento/triagem/transbordo de sucata, embalagens, agrotóxicos | 11 |
| `F-02` | transporte rodoviário de produtos e resíduos perigosos | 1 |
| `F-05` | **reciclagem (24 atividades)** | 24 |
| `F-06` | postos revendedores de combustível, lavanderias, serigrafia | 8 |
| `G-01`…`G-05` | horticultura, culturas, avicultura/suinocultura/bovinos, **carvão vegetal (G-03)**, beneficiamento, irrigação | 17 |
| `H-01` | não listadas / não enquadradas | 1 |

Soma: 27+45+43+26+44+44+17+1 = **247** ✅

**Correção de um palpite do plano:** *transporte* é **`E-01`**, não `E-03`. `E-03` é
saneamento e água. `F-03` e `F-04` não existem na lista.

Regra do `setores.json` (espelho do `rubrica.json`): a **letra é o filtro autoritativo** e
a UI diz "Setor oficial: E — Atividades de Infraestrutura"; o agrupamento popular
(mineração/energia/agronegócio) é **recorte por prefixo de código**, determinístico e
rotulado como recorte editorial. **Nunca por palavra-chave em texto livre** — é o bug do
`licita` casando dentro de "SOlicitação".

---

## 4. Reuniões do COPAM — a dor nº 1

`https://sistemas.meioambiente.mg.gov.br/reunioes/reuniao-copam/index-externo`

HTML server-rendered, **454 reuniões**, colunas Município · Data · Título · Sede/regional ·
Unidade colegiada. Paginação `?page=N`, ordenação `?sort=`, filtro por município, export
"Excel 2007+". Detalhe em `?id=` traz a **pauta estruturada** com itens numerados
(5.1, 6.1.1, 7.1.1…), nome da parte, município e anexos.

Colegiados: URC ZM, NOR, Jequitinhonha, Central Metropolitana, LM, Sul de Minas, NM, ASF,
Triângulo Mineiro + câmaras CNR, CID, CIF, CAP, CPB, CMI.

- **Reuniões futuras estão publicadas** (20/08/2026 já listada). É o que torna possível
  agir antes da decisão.
- **Não** usar o export XLSX como fonte primária: o HTML traz o `id` do detalhe, o XLSX não.
  Serve como conferência de contagem.
- **O rótulo do anexo mora no texto da âncora**, não no nome do arquivo — a URL é
  `/reunioes/uploads/<token opaco>.pdf` e não carrega semântica. Perder esse campo é
  perder a única informação que diz se o PDF é a Pauta ou a Ata.

---

## 5. Barragens

### FEAM — inventário anual · **resolve a DCE**
`https://feam.br/documents/d/feam/lista-de-barragens-2024-xlsx` (XLSX + PDF por ano, 2008–2024)

⚠️ **O cabeçalho NÃO está na linha 0.** Linha 0 = `Total | 249`, linha 1 = nota,
linha 2 = branco, **linha 3 = cabeçalho real** (20 colunas úteis). Um ETL que assuma
linha 0 grava lixo sem erro. E célula vazia **some do XML** do xlsx: alinhar pela
referência (`A1`, `B1`), nunca pela ordem dos elementos.

Colunas: `Item · Id Sigibar · EMPREENDEDOR - RAZÃO SOCIAL · NOME DA BARRAGEM · MUNICÍPIO ·
URA · LATITUDE · LONGITUDE · ATIVIDADE · FINALIDADE · SITUAÇÃO DA BARRAGEM ·
CONDIÇÃO DE ESTABILIDADE · MÉTODO CONSTRUTIVO · ALTURA (m) · VOLUME DO RESERVATÓRIO (m³) ·
CATEGORIA DE RISCO · POTENCIAL DE DANO AMBIENTAL · CLASSE · NÍVEL DE EMERGÊNCIA · SUSPENSÃO`

**249 linhas, `Id Sigibar` preenchido em 249/249** → casa 1-a-1 com `id_sigibar` do IDE.

Vocabulário real (é o que o semáforo vai mostrar):

| Campo | Valores |
|---|---|
| **CONDIÇÃO DE ESTABILIDADE** | Atestada **216** · Não Atestada **21** · Não apresentou **10** · vazio 2 |
| **NÍVEL DE EMERGÊNCIA** | 0: 231 · **1: 11** · **2: 4** · **3: 3** |
| SITUAÇÃO | Operação 160 · Desativada 87 · Instalada 2 |
| MÉTODO CONSTRUTIVO | Etapa Única 117 · Jusante 71 · **Montante 34** · Linha de Centro 23 (+ variantes de caixa) |
| CATEGORIA DE RISCO | BAIXO 239 · MEDIO 5 · ALTO 3 |

> **31 barragens sem estabilidade atestada** (21 "Não Atestada" + 10 "Não apresentou") e
> **18 em nível de emergência ≥ 1, sendo 3 no nível 3.** Isso resolve a divergência da
> imprensa (21 × 24 × 48): os números diferem por escopo e por contar ou não o "Não apresentou".
>
> ⚠️ Caixa inconsistente em `MÉTODO CONSTRUTIVO` ("Etapa Única"/"Etapa única", "Jusante"/"jusante"):
> normalizar, ou a faceta parte em duas.

A planilha diz que os dados são **atualizados mensalmente no Painel de Indicadores do
SISEMA** — fonte mais fresca que o XLSX anual. **[VERIFY]** achar a URL do painel.

### ANM — `https://geo.anm.gov.br/arcgis/rest/services/Producao/Barragens_Dashboard_Publico/MapServer/0/query?where=ATIVO>0&outFields=*&f=json`
894 feições, nacional, com `IDNivelEmergencial`, `DSCategoriaRisco`, `DSMetodoConstrutivo`.
⚠️ `where=1=1` devolve **403** (assinatura de WAF); usar `where=ATIVO>0`.

### Descopado
- **SIGBM export** — a FEAM já entrega DCE e nível de emergência para as 249 de MG.
  O SIGBM só acrescentaria o detalhamento DCE RISR/RPSB/DCO nacional de mineração.
  **Deixa de ser bloqueio de F0**; volta se o semáforo precisar do detalhe.
- **MPMG "Bombas-Relógio"** — WordPress, robots permissivo, só cronograma de
  descaracterização (23 feitas, 30 em curso). Sem DCE.

---

## 6. Legislação

### ALMG — `https://dadosabertos.almg.gov.br/api/v2/` · JSON · sem auth
> O base `/ws/` foi descontinuado em 2025-05-06. Limite **documentado e estrito**:
> máx. 2 concorrentes, **≥ 1 s entre pedidos**, "acesso pode ser bloqueado sem aviso".

- Norma direta: `/legislacao/mineira/{TIPO}/{NUMERO}/{COMPLEMENTO}/{ANO}?formato=json` → traz `texto` integral.
- Busca: `/legislacao/mineira/pesquisa/direcionada?formato=json`.
  **A resposta é aninhada em `resultado`** (`j.resultado.noOcorrencias`), não na raiz.

| Parâmetro | Efeito |
|---|---|
| `tipo=LEI` | ✅ filtra — e devolve **30.156** |
| `ano=2020` | ✅ filtra — 1.298 |
| **`p=2`** | ✅ **pagina** (`numPagina` volta 2) |
| `numPagina`, `pagina`, `page`, `offset`, `start`, `inicio`, `pag`, `nrPagina`, `indice` | ❌ ignorados |
| `tamanhoPagina` | ❌ ignorado — **página é fixa em 20** |
| `expr`, `q`, `termo`, `palavra`, `busca`, `texto`, `pesquisa`, `ementa`, `indexacao`, `assunto`, `exp` | ❌ **não existe busca por texto livre** |
| `relevancia`, `origem`, `numero` | ❌ ignorados |

A consulta padrão é `BOOL(shoud: TERM(relevancia: NORMA BÁSICA))` — o `shoud` é typo deles.
O default são **2.539 normas básicas**; o corpus completo é uma ordem de grandeza maior.

> **Estratégia:** ingerir as 2.539 normas básicas com `p=1..127` (≈ 127 pedidos, ~2,5 min
> a 1 req/s), **filtrar as ambientais localmente** por ementa/indexação, e resolver normas
> específicas por URL direta. **Não** espelhar 30 mil.
>
> Irmãs inventadas (`pesquisa/livre`, `/textual`, `/avancada`…) devolvem **403
> "Access Denied: Restricted resource"** — mas um caminho deliberadamente falso devolve o
> mesmo 403, então **o status não prova ausência**. Mesma calibração do `/gtac/api/*`.

### SEMAD — Banco de Legislação Ambiental · o que a ALMG não tem
`https://semad.mg.gov.br/banco-de-legislação-ambiental` · atual até **hoje (2026-08-07)**

Paginação do Asset Publisher do Liferay, **verificada**:
`?p_p_id=com_liferay_asset_publisher_web_portlet_AssetPublisherPortlet_INSTANCE_vopo`
`&_..._INSTANCE_vopo_delta=40&_..._INSTANCE_vopo_cur=5` → traz páginas mais antigas
(`cur=5` com `delta=40` chegou a set/2025). `start`/`delta` simples **não** funciona.

Traz `Tipo · Âmbito · Órgão · Número · Data · Ementa` + PDF em
`/c/document_library/get_file?fileEntryId={ID}`, e cobre justamente o que a ALMG não tem:
**Deliberação Copam, Portaria IEF, Portaria Igam, Resolução Conjunta Semad/Feam/IEF/Igam**.

⚠️ A **API headless do Liferay devolve HTTP 500** (`/o/headless-delivery/v1.0/sites`) — planejar HTML.

### SIAM — arquivo histórico
`https://www.siam.mg.gov.br/sla/action/Consulta.do` — um GET **sem parâmetro devolve a
tabela inteira, sem paginação**. Norma em `download.pdf?idNorma={ID}`.

⚠️ **`download.pdf` devolve `Content-Type: text/html`** (verificado por HEAD: 200,
`text/html`, 453 KB para `idNorma=43778`). Apesar do nome, é HTML — parsing é muito mais
simples que PDF, mas o coletor tem de conferir o `Content-Type`, não o sufixo.
robots.txt → 404 (sem restrição publicada).

### Nacional
- **MMA CKAN** `dados.mma.gov.br`, dataset `417a755c-4449-42e7-a60e-143a83dc130b`,
  **CC-BY**, CSV `;` desde 1937. Header: `ANO;DOCUMENTO;Nº ;ATO NORMATIVO;EMENTA;ÁREA MMA;ASSUNTO;LINK;STATUS;REVOGA`
  (**espaço no fim de `Nº `**). ⚠️ `package_search` devolve `count: 0` — índice quebrado;
  **buscar por UUID**.
- **CONAMA** `conama.mma.gov.br/index.php?option=com_sisconama&view=atonormativo&id={N}` —
  enumerável por id inteiro, 1984→2026.
- **Painel de Legislação do MMA** é embed de Power BI — **não raspar**.
- `plone.restapi` **não** está exposto no gov.br (`++api++` 404, `?_format=json` devolve HTML).
- **LexML**: `urn:lex` é o único esquema que unifica federal e estadual
  (`urn:lex:br;minas.gerais:estadual:lei:...`). O portal está atrás de muro de bot do
  Senado. **A URN é construída, nunca consultada ao vivo.**
- `dados.mg.gov.br`: 110 datasets, **zero ambientais** — descartado, verificado.

---

## 7. Restrições do app que a F0 confirmou

- **`searchParams` em Server Component quebra o build de `output: 'export'`** — não degrada,
  **para**. Mas o alvo GitHub Pages **já não fecha hoje**: `docs/deploy-github-pages.md` §3
  lista 11 páginas na mesma situação. Padrão A é seguro no alvo Cloudflare (o real) e só
  acrescenta 2 linhas àquela tabela. Se o Pages voltar a importar, o remédio documentado
  para lista grande é **"JSON estático + tabela cliente"** (um Route Handler `GET` sem
  Request **é** suportado em export e sai como arquivo).
- **`--cp-secondary` e `--cp-tertiary` não existem** em `app/globals.css` — só
  `--cp-primary`, `--cp-accent`, `--cp-alert`. O Judiciário vive do literal de fallback
  em `lib/zonas.ts`. A F1 tem de defini-las nos 3 blocos de tema.
- **Cor da zona, medida (não escolhida no olho):** verde está tomado por `--cp-accent` e
  azul por `--cp-primary`; ocre/âmbar passa em todos os temas.

  | Tema | Cor | vs bg | vs surface | vs ink | Alvo |
  |---|---|---|---|---|---|
  | claro | `#8a5300` | 5,90 | 6,33 | 6,33 (ink `#ffffff`) | 4,5 ✅ |
  | escuro | `#e0a458` | 8,58 | 7,82 | 8,49 (ink `#1a1206`) | 4,5 ✅ |
  | alto contraste | `#6b3f00` | 8,99 | 8,99 | 8,99 (ink `#ffffff`) | 7,0 ✅ |

---

## 8. `[VERIFY]` que sobraram

| # | Item | Quem resolve |
|---|---|---|
| 1 | URL do **Painel de Indicadores do SISEMA** (barragens mensais, mais fresco que o XLSX anual) | F5 |
| 2 | Colunas reais de `ide_2301` (fiscalizações) e `ide_2304` (embargos) | F5 |
| 3 | Licença da **malha municipal do IBGE** para redistribuição | F8 |
| 4 | Dispositivo da **DN 217/2017 sobre prorrogação** por pedido de renovação, para citar no vocabulário de validade | F4 |
| 5 | **Rota por path × subdomínio** para o `apps/mapa` no plano Free da Cloudflare | F8 |
| 6 | Contagem real do CSV do MMA (~550–600 observadas × 1.751 alegadas no painel) | F6 |
| 7 | Onde exatamente está a feição de coordenada não-finita (índice entre 145 e 199) | F4 |

## 9. Resolvidos nesta F0

`mun_solic` é nome · chave de junção é o `idSolicitacao` do `link` · WFS só tem licença
deferida · CNPJ redigido e CPF em claro · prefixos de setor (transporte = E-01) · DCE está
na FEAM com vocabulário fechado · paginação da ALMG é `p=` e não há busca textual ·
paginação do SEMAD é `delta`+`cur` · SIAM devolve HTML · `searchParams` × export · cor e contraste.
