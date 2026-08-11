# Ambiental — F0 · Descoberta de fontes

> Sondado ao vivo em **2026-08-07** (§1-9), **2026-08-09** (§10-13) e **2026-08-11**
> (§14, teste de viabilidade da extração de município do COPAM). Tudo abaixo foi
> verificado contra o serviço real; o que não foi está marcado **[VERIFY]** e nomeia
> quem tem de resolver. Licenças de uso das fontes: `docs/ambiental/PROVENIENCIA.json`.
>
> **A sessão de 2026-08-09 fecha a pergunta que a pesquisa de 2026-07-21**
> (`docs/betim/ambiental-pecma-research.md`) **deixou em aberto** — "sem fonte
> ambiental por município" — que só tinha olhado PECMA e o site do MPMG. Três fontes
> novas foram investigadas a pedido: IBAMA (§10), cadastro nacional de barragens (§11)
> e IGAM/SEMAD-MG (§12). **Nenhuma das três confirma "sem fonte"** — pelo contrário,
> IBAMA e SNISB têm coletor funcionando (testado ao vivo, ver §10-11); IGAM tem fonte
> real mas fragmentada, sem coletor ainda (§12). §13 documenta o catálogo de serviços
> do Portal Ecosistemas, descoberto ao vivo durante a mesma sessão.
>
> **Segunda passada, mesmo dia:** o CAP (autuação ambiental estadual de MG) saiu de
> "achado promissor" para **fonte mapeada com coletor** (§13.2); os 4 sistemas restantes
> do IGAM foram verificados um a um e **fechados por escrito** — nenhum é consulta
> pública por município (§13.4); e o SIGIBAR ficou de fora **por política** (reCAPTCHA
> Enterprise), com o contrato registrado para o caso de a decisão mudar (§13.1).
>
> **2026-08-11 — teste de viabilidade pedido antes de escrever a tela do F3 (COPAM):**
> a "dor nº 1" do §4 (dá para saber a que município um item de pauta se refere?) está
> **respondida: sim, 97,2% dos itens substantivos numa amostra de 21 reuniões (§14)** —
> e pelo método certo é **melhor** do que o §4 previa: um campo estruturado
> `<td>Município</td>` na própria página de detalhe, não a leitura de PDF por PDF.

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
| ~~1~~ | ~~URL do **Painel de Indicadores do SISEMA**~~ — **resolvido em 2026-08-09, ver §12.3**: `semad.mg.gov.br/painel-de-indicadores-do-sisema`, HTTP 200. Conteúdo interno ainda não aberto. | F5 |
| 2 | Colunas reais de `ide_2301` (fiscalizações) e `ide_2304` (embargos) | F5 |
| 3 | Licença da **malha municipal do IBGE** para redistribuição | F8 |
| 4 | Dispositivo da **DN 217/2017 sobre prorrogação** por pedido de renovação, para citar no vocabulário de validade | F4 |
| 5 | **Rota por path × subdomínio** para o `apps/mapa` no plano Free da Cloudflare | F8 |
| 6 | Contagem real do CSV do MMA (~550–600 observadas × 1.751 alegadas no painel) | F6 |
| 7 | Onde exatamente está a feição de coordenada não-finita (índice entre 145 e 199) | F4 |

## 9. Resolvidos nesta F0 (2026-08-07)

`mun_solic` é nome · chave de junção é o `idSolicitacao` do `link` · WFS só tem licença
deferida · CNPJ redigido e CPF em claro · prefixos de setor (transporte = E-01) · DCE está
na FEAM com vocabulário fechado · paginação da ALMG é `p=` e não há busca textual ·
paginação do SEMAD é `delta`+`cur` · SIAM devolve HTML · `searchParams` × export · cor e contraste.

---

## 10. IBAMA — fiscalização ambiental federal ✅ VIÁVEL, coletor escrito

A pesquisa de 2026-07-21 nunca tinha olhado o IBAMA. Verificado ao vivo em 2026-08-09
(`curl`/download real, não WebFetch): `https://dadosabertos.ibama.gov.br` é um portal
CKAN com dois datasets relevantes, ambos sem chave e sem login.

| Dataset | Recurso | Tamanho | Cobertura |
|---|---|---|---|
| Autos de Infração | `.../auto_infracao/auto_infracao_csv.zip` | 121 MB zip / 711 MB descompactado, 48 arquivos (1977-2026) | **708.691** linhas nacionais, **113.242** em MG |
| Termos de Embargo | `.../termo_embargo/termo_embargo_csv.zip` | 47 MB zip / 170 MB descompactado, 1 arquivo | **113.878** linhas nacionais, **5.247** em MG |

**Testado com Betim (3106705) rodando o coletor de verdade, sem tocar no banco**
(`python -m etl.apis.ibama_fiscalizacao --id-municipio 3106705 --sondar`, 2026-08-09):

```
autos de infração: 2844 linha(s), soma de valor_multa: R$ 17.306.229,80
embargos: 48 linha(s)
junção auto->embargo (CD_TERMOS_EMBARGOS = NUM_TAD): 8 de 2844 têm embargo correspondente
```

**A chave de junção entre os dois datasets é `CD_TERMOS_EMBARGOS`(auto) = `NUM_TAD`(embargo)**,
com `SEQ_AUTO_INFRACAO` como segunda amarração — 4 de 4 casamentos testados manualmente
antes do coletor existir.

**Licença**: `other-open` ("Outra (Aberta)") nos dois CSVs — `od_conformance: approved`
no vocabulário do próprio CKAN, sem cláusula de uso comercial em lugar nenhum verificado
(portal, `/about`, robots.txt). O SHP-ZIP de embargos (geometria, não usado pelo coletor)
usa **ODbL** — também sem vedação comercial, mas com exigência formal de atribuição/
share-alike se a base for redistribuída modificada.

### 10.1 Armadilhas medidas (a docstring do módulo tem a lista completa)

- **Encoding é UTF-8 de verdade** — diferente do padrão ASP.NET legado da ANM.
- **`;` dentro de aspas em campo de texto longo** — precisa `csv.field_size_limit()` maior
  que o default (131.072), senão o parser estoura no meio do arquivo.
- **IDs vêm com `.0` grudado** nas colunas-chave do dataset de embargo
  (`SEQ_AUTO_INFRACAO`, `SEQ_TAD` como string) — `int(float(v))` resolve.
- **Coordenada muda de separador decimal ENTRE os dois datasets**: vírgula no auto
  (`"-44,187..."`), ponto no embargo (`"-44.213..."`) — mesmo órgão, mesmo portal, dois
  formatos. Confirmado lendo os dois lado a lado.
- **CPF/CNPJ em claro nos dois datasets**, sem redação — mesmo "Risco 1" já registrado
  para o WFS estadual (§1.3). Formato de serialização difere entre datasets.
- **`MUNICIPIO` (texto) varia de caixa DENTRO do mesmo dataset**, não só entre os dois —
  `{'BETIM', 'Betim'}` apareceram nos autos de Betim na mesma coleta. A chave é sempre
  `COD_MUNICIPIO` (IBGE, 7 dígitos).
- **Metadado do CKAN mente sobre frescor**: embargos se declara "atualização diária" mas
  o `Last-Modified` real ficou ~14 semanas parado (autos, em contraste, está genuinamente
  fresco: 4 dias). Conferir a data, nunca o texto do catálogo.
- **A URL do arquivo não é hardcoded** — o coletor resolve via `package_show` do CKAN a
  cada rodada (uso pretendido da API), protegendo contra o recurso mudar de lugar.
- **`COD_MUNICIPIO` é onde o auto foi LAVRADO, não necessariamente onde o dano ocorreu**
  — exemplos antigos de Betim parecem autuação de transporte (provável barreira na
  BR-381). Não é bloqueio técnico, mas a tela não pode alegar "dano ambiental em
  \<cidade\>" só por uma linha aqui.

### 10.2 O que foi implementado

`etl/betim/etl/apis/ibama_fiscalizacao.py` escreve em duas tabelas novas
(`supabase/betim/migrations/0048_ibama_fiscalizacao.sql`): `ibama_autos_infracao` e
`ibama_embargos`, refresh total por município. **Testado ao vivo contra a fonte real em
modo `--sondar` (sem banco, sem gravar)** — os números acima são dessa rodada, não
estimativa. O modo `sync` (grava de verdade) não foi executado — a Neon está em HTTP 402
até 2026-09-01.

**Não implementado** (documentado, não bloqueio): as tabelas satélite do mesmo dataset
(`enquadramento`, `especime`, `coordenada`, `bioma`, `decisao` dos embargos — decisão
judicial que suspende/mantém o embargo, `itens` — cruzamento com PRODES/desmatamento).
Enriquecimento futuro, não F0.

---

## 11. Barragens — o SNISB acrescenta o que FEAM/ANM não cobrem ✅ VIÁVEL, coletor escrito

O §5 (2026-08-07) já tinha FEAM (249 barragens de MG, mineração/resíduos) e o dashboard
da ANM (894 nacionais, mineração) — e descartou o SIGBM por redundância com a FEAM. O que
nunca foi checado: **SNISB (ANA)**, o cadastro nacional consolidado pós-Lei 14.066/2020.

**Domínio certo, achado só pelo link de saída de `ana.gov.br`**: `snisb.ana.gov.br` **não
existe**; é `www.snisb.gov.br` (institucional) + o dado de verdade em
`https://www.snirh.gov.br/arcgis/rest/services/IG/SNISB/FeatureServer/0` (ArcGIS REST,
espelho equivalente em `portal1.snirh.gov.br/server/rest/services/SNISB_MapaInterativo2023/MapServer/0`).
Sem chave, sem login, `where=1=1` funciona (diferente do dashboard da ANM, que dá 403 nesse caso).

**Por que vale a pena**: FEAM e ANM cobrem só barragem de MINERAÇÃO. Depois da Lei
14.066/2020, abastecimento/irrigação/contenção de cheia ficam com a ANA/IGAM,
hidrelétrica com a ANEEL — e SÓ o SNISB cruza todos os reguladores num cadastro só.

```
Total nacional: 31.135 barragens · MG: 2.212
Por órgão em MG: IGAM 1.523 · ANM 320 · ANEEL 277 · ANA 71 · FEAM 21
```

**1.871 barragens em MG (IGAM+ANEEL+ANA) fora de FEAM e ANM.** Testado ao vivo com
Betim (`python -m etl.apis.snisb_barragens --id-municipio 3106705 --sondar --nome-municipio Betim`,
2026-08-09) — **2 barragens**, nenhuma delas na FEAM:

```
DIQUE D                       uso=Contenção de rejeitos de mineração  órgão=ANM       risco=Baixo/dano=Alto  PAE=Sim
BARRAGEM VARGEM DAS FLORES    uso=Abastecimento humano                órgão=MG-IGAM   risco=Médio/dano=Alto  PAE=Não
```

**BARRAGEM VARGEM DAS FLORES é da COPASA, abastece água em Betim, categoria de risco
Médio, dano potencial Alto e `POSSUI_PAE=Não`** (sem Plano de Ação de Emergência) — dado
concreto e específico do próprio município-piloto do projeto, que não existia em nenhuma
fonte já documentada.

### 11.1 Armadilhas medidas

- **Não há código IBGE de município nesta fonte** — só nome + sigla de UF, mesma lacuna
  do `mun_solic` do WFS estadual. O coletor filtra por UF no servidor (seguro, é sigla
  ASCII) e por nome de município em código (normalizado, nunca comparado direto no
  `where=` do ArcGIS).
- **`NIVEL_PERIGO` (semáforo Normal/Atenção/Alerta/Emergência) está vazio em ~97% das
  linhas**, nacional e em MG — não é falha de coleta, é o estado real da fonte. O SNISB
  NÃO substitui a FEAM como fonte de DCE para as barragens de mineração; contribui
  `categoria_risco`/`dano_potencial`/`possui_pae`/`possui_plano_seguranca`, que vêm bem
  preenchidos nas barragens não-minerárias que só ele cobre.
- **`BAR_DT_CADASTRO` vem em epoch milissegundos**, campo `esriFieldTypeDate` — não texto.
- **Licença ambígua entre dois "items" do mesmo dado**: o item que alimenta o mapa público
  declara `licenseInfo: "Uso liberado bastando dar o crédito à ANA"`; o item "canônico" do
  catálogo oficial (mesmo `recordCount`, dono diferente) devolve o campo de licença vazio.
  Nenhum dos dois declara vedação comercial — o gate do `PROVENIENCIA.json` passa, mas a
  ambiguidade fica registrada.
- **[VERIFY] não resolvido**: três números diferentes para "barragens de mineração em
  MG" — FEAM 249, WFS IDE-Sisema 259, SNISB (linhas atribuídas à ANM) 320. Não reconciliado;
  quem cruzar as três fontes por nome/`id_sigibar` resolve.

### 11.2 O que foi implementado

`etl/betim/etl/apis/snisb_barragens.py` + `supabase/betim/migrations/0049_snisb_barragens.sql`
(tabela `snisb_barragens`, refresh total por município). **Testado ao vivo** — os números
acima são de uma rodada `--sondar` real, sem gravar (Neon em 402 até 2026-09-01).

---

## 12. IGAM/SEMAD-MG — água e outorga ⚠️ VIÁVEL, mas sem coletor (decisão pendente)

O registro de 2026-08-07 ("`dados.mg.gov.br`: 110 datasets, zero ambientais") foi feito
buscando LEGISLAÇÃO. Refeito em 2026-08-09 com busca direcionada — **confirmado, agora
para água/outorga/IGAM especificamente**: `organization_list` não tem `igam` nem `semad`
(nenhuma das 18 organizações é ambiental); `package_search` com `q=igam`, `q=água`,
`q=outorga`, `q=recursos+hídricos`, `q=balneabilidade` etc. — **todos zero**. O próprio
`igam.mg.gov.br/dados-abertos` só aponta de volta pro CKAN central. **O CKAN central está
definitivamente descartado para este tema** — mas isso não fecha a pergunta, porque o
IGAM tem sistemas próprios fora do CKAN.

### 12.1 Qualidade da água — viável, sem granularidade municipal nativa

Achado na MESMA infraestrutura WFS já usada pelo projeto (`geoserver.meioambiente.mg.gov.br/IDE/ows`):
camada `IDE:ide_2201_mg_indice_qualidade_agua_lin` ("Índice de Qualidade da Água por
ottotrechos de drenagem, 2000-2024"), licença **"O acesso ao dado é livre"** (mesma
fórmula das fontes já aprovadas).

⚠️ **89.969 feições na camada, mas só 654 têm dado de qualidade de água** — o resto é
malha hidrográfica de base sem `estacao` nem `iqa*`. Um coletor sem
`CQL_FILTER=estacao IS NOT NULL` direto no servidor desperdiça 99,3% do payload e pode
reportar "89.969 leituras" quando são 654. Vocabulário real (`iqa2024`, 654 estações):
Médio 426 · Bom 148 · Ruim 79 · Coleta Não Realizada 1.

**Sem campo de município nem código IBGE** — a chave é estação (`estacao`, ex. `BG061`) ou
trecho de drenagem (`cobacia`). Amarrar a um município específico exige **join espacial**
(geometria da estação × polígono municipal), o que reabre o item 3 da tabela [VERIFY]
abaixo (licença da malha municipal do IBGE) — já em aberto por outro motivo, agora com uma
segunda razão para resolver.

Portal dedicado **InfoHidro** (`portalinfohidro.igam.mg.gov.br`) existe mas está
**bloqueado por período eleitoral** em toda rota testada (Lei nº 9.504/1997, aviso da
SEMAD) — não avaliado o que ofereceria além do WFS.

### 12.2 Outorga — viável, mas fragmentado em 3 fontes com trade-offs diferentes

Não existe um sistema único e limpo (o nome "SIGA" cogitado inicialmente não corresponde
a nada real — o sistema chama-se **SOUT**, mas é o portal de PETICIONAMENTO, com login).
A consulta pública de verdade está em dois backends sem login, achados seguindo links de
saída de páginas aparentemente fechadas de `igam.mg.gov.br`:

| Fonte | Cobertura | Município | Formato | Problema |
|---|---|---|---|---|
| **B1** `sistemas.meioambiente.mg.gov.br/licenciamento/site/lista-outorgas` | Atual (55.729 registros) | Só no detalhe (`?id=N`), não na listagem | Grid HTML + export Excel | Export pode não ter município (não testado — exigiria replicar POST com CSRF) |
| **B2 índice** `outorga.meioambiente.mg.gov.br/index.php?r=portaria/listar` | Atual, 2001-2026 (4.192 `.doc`) | Sim, em texto livre | `.doc` binário sem campos fixos | Parsing caro/frágil (~4.192 documentos) |
| **B2 export** `outorga.meioambiente.mg.gov.br/arquivos/outorgas_ate_31_12_2015.xlsx` | Só até 2015 | Sim, coluna limpa | XLSX estruturado | **CPF completo, SEM máscara** — ex. `449.918.516-53` |

**Achado de privacidade — o mais sério desta sessão**: o export XLSX estruturado (única
fonte com município limpo E dado atual-o-bastante-pra-ser-útil-em-massa) expõe CPF
**inteiro**, mais exposto que qualquer outra fonte já documentada no eixo (o WFS de
licenciamento redige o CNPJ e mostra CPF, mas pelo menos é geometria pontual; aqui é uma
planilha pronta para `Ctrl+F`). Confirmado com o piloto do projeto: 1 outorga de Betim
achada na aba Subterrâneo (Processo 28551/2013, Transportes Pesados Minas Ltda).

Nenhuma das três declara licença/termos formalmente; suporte indireto via
`semad.mg.gov.br/politica-de-privacidade-do-sisema` ("conteúdo pode ser reutilizado,
desde que a fonte seja identificada") — sem menção a vedação comercial, mas é política de
portal genérica, não licença de dataset.

**Por que não tem coletor**: as três fontes têm trade-offs incompatíveis (frescor ×
limpeza × granularidade × privacidade) e a fonte mais limpa é também a mais arriscada. Não
é uma decisão técnica — é uma decisão de produto/risco que cabe ao usuário, não ao F0.

### 12.3 Achado colateral — resolve o [VERIFY] #1 da tabela §8

`https://semad.mg.gov.br/painel-de-indicadores-do-sisema` (espelho:
`feam.br/w/painel-de-indicadores-do-sisema`) — **confirmado ao vivo, HTTP 200**. Inclui
classificação de risco e nível de emergência de barragens, atualizado mensalmente (mais
fresco que o XLSX anual da FEAM). Conteúdo interno não aberto — fora do escopo desta
sessão, fica para quem for medir a granularidade real do painel (era o F5 no plano
original).

---

## 13. Portal Ecosistemas — catálogo de serviços (achado ao vivo, 2026-08-09)

Durante a mesma sessão, o usuário pediu para catalogar as fontes de `ecosistemas.meioambiente.mg.gov.br`
e ofereceu login pessoal (CPF + senha) para acesso mais profundo. **A credencial não foi
usada — a política deste projeto proíbe entrar com senha de terceiro em qualquer sistema,
mesmo com autorização explícita do dono.** Tudo abaixo foi descoberto como visitante
anônimo. Registrado aqui para que uma sessão futura não repita a tentativa nem presuma que
o login foi testado.

A home (`/eco-ui`) tem 4 módulos de "Transparência" (consulta pública, sem login):

| Módulo | URL | Estado |
|---|---|---|
| Licenciamento Ambiental (SLA) | `/sla/#/acesso-visitante` | ✅ já documentado, §2 |
| Termos de Ajustamento de Conduta (GTAC) | `/gtac/acessoExterno` | ✅ já descartado, `PROVENIENCIA.json` |
| **Gestão de Barragens (SIGIBAR)** | `/sigibar-ui/#/acessoExterno` | ⚠️ parcial — abaixo |
| **Consulta Geral de Autos de Infração (CAP)** | `/consulta-ai` | ✅ novo achado — abaixo |

### 13.1 SIGIBAR — listagem existe e é pública, mas o caminho de máquina é captcha-gated ⛔

> **Atualização 2026-08-09 (segunda passada).** Uma sessão de navegador conduzida pelo
> usuário **alcançou a listagem** — o badge de reCAPTCHA não impediu a navegação humana:
> **572 barragens em MG**, 3 em Betim (ex.: ID 530, Barragem de Ibirité, PETROBRAS,
> Indústria, CRI Baixo, PDA Alto, estabilidade atestada, auditoria em 20/08/2025). As
> colunas que o SIGIBAR tem e o SNISB **não** tem são justamente as boas: Condição de
> Estabilidade, Nível de Emergência e Data da Última Auditoria.
>
> **Mesmo assim não há coletor, e a razão é de política, não de mapeamento.** Lendo o
> bundle Angular (`sigibar-ui/main.*.js`) fica explícito que `POST
> /sigibar/acessoExterno/listarBarragemPorFiltro` só é chamado **depois** de
> `validaRecaptcha` devolver `score > 0.5` (reCAPTCHA **Enterprise**). Chamar o endpoint
> direto de um ETL é contornar essa proteção — a regra de parada do §2.2 vale aqui. O
> contrato do filtro está mapeado e registrado abaixo para quem for retomar **se** a
> decisão de política mudar (ou se a SEMAD publicar o mesmo dado sem captcha):
>
> ```
> POST /sigibar/acessoExterno/listarBarragemPorFiltro
>   {idBarragem, nomeBarragem, nomeEmpreendedor, idMunicipio, atividadeBarragem,
>    categoriaRisco, potencialDanoAmbiental, statusCondicaoEstabilidade,
>    nivelEmergencia, statusAtualCadastro, statusCadastroDesativacao,
>    anoUltimaAuditoria, page (0-based no wire), size}
>   -> {content:[...], totalElements}
> ```
>
> **Os 572 não reconciliam o [VERIFY] de §11.1 (249 × 259 × 320)** — o aviso da própria
> tela diz que barragem desativada continua listada, então 572 é um universo maior e de
> definição diferente, não um quarto valor para o mesmo conceito.

**(registro original da primeira passada, mantido)**

Mesmo padrão de backend já visto no SLA (`/environments-api/?variaveis=...`). O endpoint
`GET /sigibar/acessoExterno/listarMunicipiosSigibarMg` respondeu **200, sem login**, com a
lista real dos 853 municípios de MG (`idMunicipio`/`nomeMunicipio`). **A listagem de
barragens em si fica atrás de um diálogo de confirmação ("Deseja prosseguir?") com
**reCAPTCHA** — clicar "Sim" não avançou o estado da página na sessão testada. Seguindo a
regra de parada já estabelecida no §2.2 para CAPTCHA: não contornado, não tentado de novo.
Poderia reconciliar o [VERIFY] de §11.1 (249×259×320 barragens de mineração em MG) se
alguém destravar isso depois.

### 13.2 CAP — Consulta Geral de Autos de Infração e Arrecadação ✅ MAPEADO, COM COLETOR

> **Atualização 2026-08-09 (segunda passada).** Contrato reproduzido ao vivo, sem login e
> sem captcha. Coletor: `etl/betim/etl/apis/cap_autos_infracao.py` + migration
> `supabase/betim/migrations/0050_cap_autos_infracao.sql` (tabela `cap_autos_infracao`,
> refresh total por município, **não aplicada** — Neon em 402 até 2026-09-01).
>
> ```
> POST /consulta-ai/api/autos/filtro-avancado
>   {numero_ai, lavratura_inicio, lavratura_fim, nome_autuado, cpfCnpj,
>    municipios:[{value:<nome>}], orgaos:[], unidades:[],
>    page:<1-based>, tipoDado:<DI|PA|DA|CA>, search:""}
>   -> {data:[...], meta:{current_page,last_page,total,per_page:50}}
> ```
>
> Volume medido por município: **BH 26.764 · Diamantina 25.292 · Gov. Valadares 23.372 ·
> Araçuaí 11.368 · Betim 9.621 · Itinga 4.994** linhas.
>
> Quatro armadilhas que valem para além deste módulo:
> 1. **Linha não é auto** — o grão é (auto × dispositivo legal). O mesmo `num_ai` aparece
>    N vezes com `num_lei` diferente. "9.621 autuações em Betim" é falso.
> 2. **`tipoDado` inválido cai em `DI` em silêncio** (`''`, `'ALL'`, `'*'` → 200 com as
>    colunas de DI). Um typo não falha, só entrega menos coluna.
> 3. **Os 4 `tipoDado` são recortes de coluna da MESMA consulta** — mesmo `id`, mesmo
>    `total`. Coletar tudo custa 4 passadas e junta-se por `id`.
> 4. **`per_page` é fixo em 50 e ignora sobrescrita** — BH custa ~2.144 requisições por
>    rodada. É ETL mensal, com pausa entre requisições.
>
> **Achado de privacidade, e é o inverso do que se temia:** o CAP **já mascara CPF de
> pessoa física** (`***.327.536-**`) e publica CNPJ inteiro. É postura melhor que a do
> IBAMA (§10, CPF em claro) e que a do XLSX de outorga do IGAM (§12.2, CPF completo). Não
> há decisão de redação a tomar nesta fonte.

**(registro original da primeira passada, mantido)**

`ecosistemas.meioambiente.mg.gov.br/consulta-ai` é o **autos de infração ESTADUAL de MG**
(sistema CAP), complementar ao IBAMA federal (§10) — jurisdições diferentes. Confirmado ao
vivo:

```
GET .../consulta-ai/api/autos/municipios              -> 200, lista de município (só NOME, sem código IBGE)
GET .../consulta-ai/api/autos/relatorio-geral/last-update -> 200, {"completed_at":"2026-08-09T03:06:13.000000Z"}
```

**Sem login, atualizado no mesmo dia da consulta**, com filtro por município na UI e
exportação para Excel de até 100.000 registros. **Não mapeado**: o contrato exato da
consulta (`POST` disparado pelo botão "Consultar", que exige "dados exibidos" + pelo menos
um filtro selecionado) não foi reproduzido nesta sessão — ficou só a descoberta dos
endpoints de apoio. Candidata forte para uma sessão de mapeamento dedicada: é
provavelmente a fonte de autuação ambiental MAIS relevante para município de MG
especificamente (o IBAMA é federal e mais esparso por cidade pequena).

### 13.3 Lista de sistemas do SISEMA — nomeada pelo usuário, não verificada individualmente

O usuário colou uma lista de "Serviços Digitais do Sisema" (fonte exata não identificada —
não é `meioambiente.mg.gov.br/servicos-semad`, que é outra página, de serviços
administrativos). Nomes registrados aqui para não se perderem, **sem verificação
individual nesta sessão** — cada um precisa da mesma checagem ao vivo que os demais antes
de entrar como fonte:

```
SISEMACADU (Cadu — cadastro de PF/PJ, não é fonte de dado)  · SEMADGAIA (Fiscalização —
provavelmente o backend do CAP, §13.2)  · SEMADPECMA (Programa Estadual de Conversão de
Multas — permanece login-gated, ver docs/betim/ambiental-pecma-research.md)  ·
FEAMSLA (= SLA, já documentado)  · FEAMSIGIBAR (= SIGIBAR, §13.1)  · IEFMG Florestas ·
IEFMGPESCA (Pesca Amadora)  · IEFREC (Registro Fauna/Flora)  · IGAMDAURH (Declaração Anual
de Uso de Recursos Hídricos)  · IGAMMIRA (Monitoramento Remoto Integrado das Águas)  ·
IGAMMRHI (Uso Insignificante de Recursos Hídricos, "Apenas Consulta" — nome sugere consulta
pública)  · IGAMSGBH (Gestão de Bacias Hidrográficas)  · IGAMSIGMA (Gestão do Monitoramento
das Águas)  · IGAMSOUT (= SOUT, outorga, §12.2)
```

**Próximo passo, se alguém priorizar**: IGAMDAURH, IGAMMIRA, IGAMSGBH e IGAMSIGMA são os
únicos desta lista genuinamente não-investigados (os demais já foram resolvidos, descartados
ou mapeados em §10-13.2 acima).

### 13.3.1 O que entrou no lugar do SIGIBAR ✅ FEAM, com coletor (2026-08-09)

O SIGIBAR ficou barrado por política (§13.1). O conteúdo que ele teria — **condição de
estabilidade, nível de emergência, método construtivo** — chega pela **FEAM**, por caminho
aberto, para as barragens de **mineração e indústria** de MG:
`etl/betim/etl/apis/feam_barragens.py` + `supabase/betim/migrations/0051_feam_barragens.sql`.

Cobre 249 barragens (mineração 209 + indústria 40) em 58 municípios. Não cobre
abastecimento, irrigação nem hidrelétrica — para essas, o SNISB (§11). **"Zero barragens
da FEAM" num município não é "nenhuma barragem no município"**, e as duas tabelas existem
lado a lado por isso.

**Correção de um fato que este documento afirmava**: a §5 dizia `Id Sigibar` preenchido
**249/249**. São **247 numéricos + 2 com o literal "Não cadastrado"** (Massa Falida da
Mundo Mineração, Rio Acima). Como chave, `id_sigibar` colidiria essas duas — a chave
natural é `(município, nome)`, medida sem colisão nas 249.

**O [VERIFY] de frescor da §5 está RESOLVIDO.** A URL do painel mensal, dada como não
encontrada, é hyperlink da célula D2 da própria planilha:
`https://app.powerbi.com/view?r=eyJrIjoiOThhNzgyMTQtNGU5Ny00Mzk0LWIzODItNDg3Nzk2MDlmYmEyIiwidCI6IjkyNGY5ODQ3LTI0MmUtNGE5YS04OTEzLTllNDM2NDliOWVhYSJ9`
— embed público do Power BI, sem login, e **relatório diferente** do divulgado em
`semad.mg.gov.br/painel-de-indicadores-do-sisema` (os tokens `r=` divergem). Não vira
coletor: Power BI só entrega dado por API interna não documentada, enquanto o XLSX é
estruturado. O preço é o frescor — XLSX anual (base 2024) contra painel mensal.

Cinco armadilhas medidas ao vivo estão na docstring do coletor; a que mais assusta é a
coordenada: **5 das 249 linhas trazem lat/long como inteiro de 8 dígitos sem separador
decimal** (`-19645284` para −19,645284), e latitude e longitude podem ter tipos diferentes
na mesma linha. Gravar cru põe a barragem a milhões de graus dali, sem erro nenhum.

### 13.4 Veredito dos 4 sistemas do IGAM ⛔ FECHADO — nenhum serve como fonte por município

Verificado ao vivo em 2026-08-09 numa sessão de navegador conduzida pelo usuário, **já
autenticado** no Portal Ecosistemas (o que torna o veredito mais forte, não mais fraco:
nem com sessão ativa existe consulta pública agregada). **Esta seção existe para que
ninguém pesquise isto de novo** — é o item 20 do Bloco 4 do plano de execução.

| Sistema | Veredito | Por quê |
|---|---|---|
| **IGAMDAURH** (Declaração Anual de Uso de Recursos Hídricos) | ⛔ não serve | Só formulário de **submissão** (exige cadastro CADU). Não existe tela de consulta às declarações de terceiros — não há o que coletar. |
| **IGAMMIRA** (Monitoramento Telemétrico) | ⛔ parada por login | O link oficial cai em `/portalseguranca/login`, pedindo CPF+senha. Sessão interrompida ali pela política do projeto (nunca autenticar com credencial de terceiro). |
| **IGAMSGBH** (Gestão de Bacias Hidrográficas) | ⛔ não serve | É o "Memorial de Cálculo" da cobrança, **amarrado à outorga/CADU do próprio usuário** — consulta pessoal, não agregada por município. |
| **IGAMSIGMA** (Gestão do Monitoramento das Águas) | ⛔ parada por SSO | O card "Hub de Relatórios" redireciona para `app.powerbi.com/singleSignOn` (login Microsoft, outro domínio). |

**Colateral, não seguido:** o SGBH linka uma planilha pública de "CONSULTA DETALHAMENTO
DOS VALORES" (cobrança 2024/2023) hospedada em **OneDrive**, fora do domínio da SEMAD.
Não aberta — domínio de terceiro, e planilha de cobrança por outorgado tem o mesmo perfil
de exposição de CPF já documentado em §12.2. Fica registrado como pista, não como fonte.

**Consequência para o eixo Ambiental:** a única frente do IGAM que sobrevive é a de §12.1
(IQA via WFS), e ela continua bloqueada pelo mesmo motivo de antes — sem campo de
município, exige join espacial com a malha do IBGE, cuja licença é o [VERIFY] #3 da §8.
O que o IGAM regula e é coletável hoje chega por **outros** órgãos: barragens via SNISB
(§11, 1.523 delas atribuídas ao IGAM) e autuação via CAP (§13.2).

---

## 14. COPAM — teste de viabilidade da extração de município ✅ VIÁVEL, método melhor do que o §4 previa

> Verificado ao vivo em 2026-08-11 (`requests` puro, sem curl_cffi — o host não exige
> impersonar TLS), a pedido do usuário, **antes de escrever a tela `/ambiental/copam`**.
> Pergunta: dado um item de pauta, dá para saber de forma confiável a que município ele se
> refere? Resposta medida: **sim, e a fonte melhor não é o PDF da pauta em si — é um campo
> estruturado na própria página de detalhe que o §4 não tinha visto.**

### 14.1 O achado que muda o desenho do coletor

`GET /reunioes/reuniao-copam/view-externo?id={id}` traz, além de Convocação/Pauta/Decisão/Ata
(já documentados no §4), um fieldset **"Documento(s) inerente(s) à pauta"** com uma
`<table>` de 3 colunas: **Nome do Arquivo · Município · Ações**. O `<td>` do meio é o nome
do município **como valor de campo estruturado**, preenchido pelo servidor — não é texto
livre para regex, é literalmente `<td>Sete Lagoas</td>`. Não precisa abrir PDF nenhum para
esta fonte. Exemplo real (reunião id=1991, 61ª RO da URC CM):

```html
<tr><td>Item 7.1. Parecer Pro-Flora Agroflorestal Ltda.pdf</td><td>Sete Lagoas</td>...
<tr><td>Item 7.2. Parecer Flávio Grisi - Minérios e Jazidas Minerais.pdf</td><td>Ouro Preto</td>...
<tr><td>Item 8.1. Parecer Alcântara Participações Ltda.pdf</td><td>Sarzedo</td>...
```

Isto é **diferente** do achado do §4 ("o rótulo do anexo mora no texto da âncora") — aquele
resolve Pauta-vs-Ata (qual documento é qual), este resolve **a que município o item se
refere**. Os dois achados coexistem; nenhum invalida o outro.

### 14.2 Amostra e taxa de sucesso — camada 1 (campo estruturado, sem abrir PDF)

**21 reuniões** testadas ao vivo (acima do pedido de 10-15), cobrindo os dois formatos de
colegiado (7 URCs regionais: CM, ZM, NOR, JEQ, NM, SM, ASF — e 6 câmaras sede: CMI, CNR,
CID, CIF, CAP, CPB), reuniões futuras (id=2011, 20/08/2026, já publicada) e reuniões de
maio-agosto/2026, ordinárias e uma extraordinária.

Excluídos da contagem os itens administrativos (exame de ata, indicação de representante —
não têm e não deveriam ter município). Nos **176 itens substantivos restantes**:

| Camada | Município recuperado | Taxa |
|---|---:|---:|
| 1 — só o campo `<td>Município</td>` | 138 / 176 | **78,4%** |

O sucesso **não é uniforme por reunião**: 17 das 21 reuniões vieram 80-100% preenchidas
(a maioria 100%), mas 3 vieram baixas — **id=1997 (180ª RO URC NM): 0/20**, **id=1980
(179ª RO URC NM): 5/13**, **id=1979 (122ª RE da CPB): 0/5**. Confirmado lendo o HTML bruto
(não é bug de parser): a SEMAD simplesmente não preencheu o campo nessas reuniões. As duas
piores são da **mesma URC (Norte de Minas)** — pista de que é hábito de quem lança o dado
naquela regional, não aleatório.

### 14.3 Camada 2 — o PDF da Pauta consolidada como reforço, testado nas 6 reuniões com lacuna

Toda reunião tem **um único PDF de Pauta** (não confundir com os PDFs individuais de
parecer/recurso da tabela) e ele **tem camada de texto** (`pymupdf`/`fitz` extrai sem OCR,
2-3 páginas, 2.600-14.400 caracteres por pauta nesta amostra). Testado nas 6 reuniões que
tinham alguma lacuna na camada 1 (1997, 1980, 1979, 1971, 2008, 1978): todo item substantivo
traz o padrão **`<Município>/MG`** colado perto do número do processo. Exemplo real (pauta
da reunião id=1997, onde a camada 1 deu 0%):

```
6.1 Lenimar Ribas Rabelo - ... - Ibiracatu/MG - PA/CAP/Nº 12000000902/15 - AI/Nº 40779/2011.
7.1 Agro Industrial de Lassance Ltda./Fazenda Boa Esperança - ... - Lassance/MG - Licença de Operação Corretiva ...
9.2 Companhia de Saneamento de Minas Gerais - COPASA - ... - Montes Claros/MG - PA/CAP/Nº 818167/26 ...
```

Das **38 lacunas da camada 1** (176 − 138), a camada 2 resolveu **33** com confiança alta.
As **5 restantes não são falha — são município genuinamente inaplicável**: item normativo
sem local (`6.1` da 213ª RO da CNR, "Minuta de Deliberação Normativa Copam", 3 lacunas),
apresentação de programa (`6` da 144ª RO da URC JEQ, "Diálogos com o Sisema", 1 lacuna) e
uma ata mal-rotulada ("Item 05 ATA 144ª URC JEQ.pdf", sem o texto literal "Exame da Ata",
1 lacuna — mostra que o classificador de "item administrativo" por regex de nome de
arquivo precisa de mais variantes, problema à parte da extração de município).

**Taxa combinada, camada 1 + camada 2, sobre os itens que de fato tratam de um lugar:
171/171 = 100%** nesta amostra. Contando os 5 administrativos como zero (postura
conservadora): **171/176 = 97,2%**. Muito acima do corte de 80% do pedido.

### 14.4 Armadilhas medidas para quem escrever o coletor (F3)

- **Chave de junção item↔pauta é o prefixo numérico, não string exata.** A tabela usa
  granularidade por *documento* (`Item 06.1.1`, `Item 06.1.2`, `Item 06.1.3`... — vários
  PDFs por item) e a Pauta usa granularidade por *item* (`6.1`). Casar pelo prefixo
  (`6.1` ⊂ `06.1.1`), não pelo texto inteiro.
- **Um item pode ter mais de um município.** id=1979, item 5.1 (Vale S.A., plano de
  compensação) cita três operações em três municípios diferentes num único item
  (`Itabirito, Nova Lima e Rio Acima/MG` e depois `São Gonçalo do Rio Abaixo/MG`). Campo
  tem de ser lista, não string única — assumir 1:1 quebra silenciosamente neste caso real.
- **O rótulo "administrativo" não é um único padrão de texto.** "Exame da Ata da X RO",
  "ATA X URC JEQ", "Indicação de representante..." são três grafias distintas pro mesmo
  tipo de item; um classificador com uma regex só vai contar ata como item substantivo sem
  município (falso "gap").
- **Normalização de acento.** A resposta HTTP declara `charset=UTF-8` e os bytes batem
  (`Reuniões` = `\xc3\xb5` correto) — mojibake visto no terminal Windows durante o teste é
  problema de codepage do console, não do dado; confirmado lendo os bytes crus.
- **Sem `robots.txt`** em `sistemas.meioambiente.mg.gov.br` (404, mesma situação do SIAM,
  §6) — sem restrição publicada. Nenhum 403/429/CAPTCHA em ~30 requisições desta sessão
  (21 páginas de detalhe + 6 PDFs de pauta + 2 páginas de listagem), com `User-Agent`
  identificável e ≥1s entre pedidos — mesma política do §2.2.
- **Não testado nesta sessão** (fica para quem escrever o coletor): parser de regex de
  produção para `<Município>/MG` contra os 853 nomes reais de município (evitar falso
  positivo em nomes compostos com "de/da/dos"); volume completo (454 reuniões ÷ 20 por
  página ≈ 23 páginas de listagem, e um PDF de pauta a mais por reunião que caiu na
  camada 2 — custo desprezível, mas não medido em escala real).

**Veredito para o F3 do plano de execução:** a seção é viável com folga. O método certo é
**camada 1 primeiro (tabela estruturada, sem PDF), camada 2 como reforço (1 PDF de pauta
por reunião, só quando a camada 1 vier vazia)** — não o que o §4 sugeria (ler âncora/nome
de anexo por item). PDF individual de parecer/recurso (um por documento) **não precisa
ser aberto** para este propósito.
