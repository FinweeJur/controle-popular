# Fonte geológica de MG — prior de mineração — 2026-10-13

> **Tipo:** PESQUISA
> **Domínio:** ambiental
> **Última medição:** 2026-10-13
> **Leitura estimada:** media (5-15 min)
> **Relacionados:** [README.md](../README.md), [AGENTS.md](/AGENTS.md), [FONTES.md](../06-fontes/FONTES.md), [PLANO-IBAMA-COORDENADAS-E-PRIOR-GEOLOGICO.md](/docs/historico/planos/PLANO-IBAMA-COORDENADAS-E-PRIOR-GEOLOGICO.md)
> **Palavras-chave:** pesquisa, geologia, mineracao, MG, litologia, geoquimica, SIGMINE, IBAMA, MDE

## Sumário

- [Propósito](#propósito)
- [O que é um prior geológico](#o-que-é-um-prior-geológico)
- [Os seis fatores, com o que foi medido](#os-seis-fatores-com-o-que-foi-medido)
- [Tabela-resumo por fator](#tabela-resumo-por-fator)
- [Armadilhas medidas (todas comprovadas em 13/10/2026)](#armadilhas-medidas)
- [Recomendação de implementação](#recomendação-de-implementação)
- [Origem](#origem)

Pesquisa pedida pelo usuário para decidir **onde o satélite deve olhar
primeiro** na busca por cavas ilegais em Minas Gerais. Não editei código nesta
rodada — só medi fonte. A implementação fica para a sessão de código.

## O que é um prior geológico

Um "prior" é um mapa de calor que ordena o território por **potencial de
mineração ilegal**. A ideia é simples: cava ilegal não aparece em qualquer
lugar. Ela aparece onde (a) a rocha é boa para extrair, (b) alguém já tem
título de pesquisa, (c) dá para chegar de carro, (d) não tem Terra Indígena
por cima. Quem sabe isso olha primeiro os 5% do estado, não os 556.000 km².

**Separar duas coisas que se confundem:** o prior ordena a **varredura do
satélite** (o que processar primeiro). Ele **não** é o que o leitor vê. O
leitor vê a cava, o município, o processo da ANM e a fonte — a §7 do AGENTS
vale aqui: dois dados verdadeiros lado a lado podem sugerir um terceiro
falso. Prior baixo não significa "não há cava"; significa "menos urgente de
conferir".

## Os seis fatores, com o que foi medido

### Fator 1 — Litologia (CPRM/SGB): onde a rocha interessa

Servidor ArcGIS do Serviço Geológico do Brasil em
`geoportal.sgb.gov.br`. Camada por estado:
`geologia/litoestratigrafia_estados/MapServer`, layer 8 = "Minas Gerais -
1:1.000.000 [2021]" com **8.893 polígonos** — este é o total da camada, o
número que o órgão publica para MG.

As camadas nacionais (`litoestratigrafia_1000000`, `_250000`, `_150000`,
`_50000`, `_2500000`) trazem o Brasil inteiro. Para saber quantos polígonos
caem em MG foi preciso baixar a geometria de todas as feições e fazer
ponto-dentro-do-polígono aqui — o servidor recusa filtro espacial (ver
[Armadilhas](#armadilhas-medidas)). Contagem por centróide do polígono
maior, com limite de MG do IBGE simplificado a 4.001 vértices.

| Escala | Brasil | Lidos | MG (centróide dentro) |
|---|---|---|---|
| 1:1.000.000 | 46.712 | 46.712 | **8.975** |
| 1:50.000 | 5.184 | 5.184 | **2.205** |
| 1:2.500.000 | 2.838 | 2.838 | **321** |
| 1:250.000 | 19.982 | 19.982 | **4** |
| 1:150.000 | 578 | 578 | **0** |

O 8.975 do 1:1M é **maior que o 8.893** da camada por estado porque aqui
conta-se centróide dentro do limite e ali é o recorte oficial do órgão —
diferença de 82 polígonos que encostam na divisa. Não é erro; é método
diferente, e os dois números têm de ser publicados com o seu método.

O 4 do 1:250.000 e o 0 do 1:150.000 **não significam ausência de litologia**:
significam que essas duas coleções nacionais mal cobrem MG (são escalas
usadas mais no Norte/Sul do país). Quem quiser detalhe em MG usa o 1:1M por
estado ou o 1:50.000, não esses dois.

### Fator 2 — Geoquímica de sedimentos de córrego (CPRM/SGB)

Camada `geoquimica/geoquimica_integrada/FeatureServer`, contagem com filtro
espacial por polígono de MG (o servidor do SGB **aceita** filtro espacial
nesta coleção, ao contrário da litologia — confirmado 13/10):

| Coleta | Brasil | MG |
|---|---|---|
| Sedimento de Corrente | 151.473 | **14.576** |
| Sedimento de Bateia | 64.381 | **3.137** |
| Solo | 106.310 | **3.078** |
| Rocha | 36.932 | **1.259** |
| Água | 1.440 | **95** |

Mais as Cartas de Anomalia (`geoquimica/Cartas_de_Anomalia/MapServer`) com
**50 cartas** em MG, e a coleção dedicada a ouro
(`geoquimica_ouro/MapServer`): 6.547 pontos pós-2012 (ppb) e 1.621 pré-2012
(ppm) em MG.

**Armadilha de conteúdo:** a `geoquimica_integrada` tem 51 campos e
**nenhum campo de teor** (Au, Fe, Mn, terras raras). Só metadados de coleta
(data, coordenada, tipo). Os teores moram em outra publicação do CPRM que
ainda não foi identificada — `sistemasgb.sgb.gov.br` não resolve DNS. Sem o
teor, o ponto geoquímico é um **marcador de "aqui se coletou"**, não um
marcador de "aqui tem ouro".

### Fator 3 — Títulos de pesquisa mineral (ANM/SIGMINE)

`https://dadosabertos.anm.gov.br/SIGMINE/PROCESSOS_MINERARIOS/MG.zip` —
responde 200, **22.277.169 bytes**, `Last-Modified: Tue, 13 Oct 2026
03:02:13 GMT`. Arquivo único com o estado inteiro.

**54.966 registros** no MG.zip. Fases principais:

| Fase | Registros |
|---|---|
| AUTORIZAÇÃO DE PESQUISA | 24.909 |
| REQUERIMENTO DE LAVRA | 6.073 |
| REQUERIMENTO DE PESQUISA | 5.685 |
| DISPONIBILIDADE | 5.295 |
| LICENCIAMENTO | 3.415 |
| CONCESSÃO DE LAVRA | 3.207 |
| REQUERIMENTO DE LICENCIAMENTO | 2.353 |
| Outras (garimpo, extração, etc.) | < 2.000 cada |

"**Pesquisa mineral sem lavra**" (o que interessa ao prior, porque é terra
com alguém sondando metal, ainda sem mina formal) = AUTORIZAÇÃO DE PESQUISA
+ REQUERIMENTO DE PESQUISA + RECONHECIMENTO GEOLÓGICO = **30.596**.

Substâncias mais pedidas na AUTORIZAÇÃO DE PESQUISA: GRANITO 3.752, AREIA
3.134, MINÉRIO DE FERRO 2.715, **MINÉRIO DE OURO 2.571**, **MINÉRIO DE
LÍTIO 1.924**, QUARTZITO 1.004, QUARTZO 884, FOSFATO 655, DIAMANTE 600.

**Armadilha de dado (a mais grave deste fator):** o arquivo chama-se MG.zip,
mas **nem todo registro é de MG**. Do total, 51.135 têm UF=MG. Os outros
3.831 (7%) são BA (216), ES (42), SP (18), GO (4), RJ (3) e 3.548 com "DADO
NÃO CADASTRADO". Publicar o total do zip como "processos em MG" publicaria
7% de dado de outro estado.

### Fator 4 — Acesso: relevo e malha viária (IBGE)

**Relevo — existe e é usável.** `geoftp.ibge.gov.br` responde 200 sem login.
MDE 1:50.000 de SP+MG+GO em
`modelos_digitais_de_superficie/modelo_digital_de_elevacao_mde/spmggo50/tif/`
— **73 folhas**, cada uma um `.zip` numerado de folha (23764.zip,
23772.zip, ...). Medido em uma folha: **1,7 MB** e **0,5 s** de download
(3,43 MB/s); média de 3 folhas = **4,0 MB**. As 73 juntas estimam-se em
~290 MB.

**Malha viária — o IBGE não publica vetor de estrada.** Medido: a pasta de
ligações rodoviárias tem só **3 planilhas `.ods`** (2016), sem geometria; a
API de malhas do IBGE devolve **TopoJSON com 1 geometria só** (o estado, não
as estradas). Rede viária vetor tem de vir de outra fonte (DNIT, OpenStreetMap)
— fica para a sessão de código, não foi medida aqui.

### Fator 5 — Proteção e conflito (já no repositório)

Confirmado em [FONTES.md](../06-fontes/FONTES.md), sem novo download, a
pedido:

| Camada | MG |
|---|---|
| Terra Indígena (FUNAI) | 16 polígonos |
| Processos minerários (SIGMINE) | 54.916 polígonos |
| Barragens de rejeito (SIGBM) | 320 |

Camada de conflito pronta: cava dentro de TI, cava sobre barragem, cava sem
título.

### Fator 6 — Alerta de mudança (MapBiomas e IBAMA)

**MapBiomas — o produto de mineração é o Monitor da Mineração, não o Alerta.**
O MapBiomas Alerta
(`plataforma.alerta.mapbiomas.org/api/v2/graphql`) é **desmatamento**; não
tem camada de mineração. Quem quer mineração do MapBiomas usa o **Monitor da
Mineração** (`plataforma.monitormineracao.mapbiomas.org`), que cruza a
classe de mineração da Cobertura 30 m com a arrecadação de CFEM da ANM.
Já mapeado em [FONTES.md](../06-fontes/FONTES.md).

**IBAMA / Rede BrasilMAIS — existe e é pequeno.** ArcGIS do PAMGIA, camada
0 "Alertas Mineração (Rede BrasilMAIS)":

- Brasil: **250 alertas**
- MG (`ufs = 'MG'`): **3 alertas**

3 alertas em todo o estado é um número pequeno demais para mover o prior —
serve como **sinal de calibração**, não como fator de peso.

## Tabela-resumo por fator

| # | Fator | Fonte / URL | Formato | Volume medido em MG | Licença | Armadilha |
|---|---|---|---|---|---|---|
| 1 | Litologia | `geoportal.sgb.gov.br/server/rest/services/geologia/litoestratigrafia_estados/MapServer` | ArcGIS FeatureServer | 8.893 polígonos (camada por estado, 1:1M) | Dados abertos SGB | Filtro espacial recusado; ver armadilhas |
| 2 | Geoquímica | `geoportal.sgb.gov.br/server/rest/services/geoquimica/geoquimica_integrada/FeatureServer` | ArcGIS FeatureServer | 14.576 pontos de sedimento de corrente | Dados abertos SGB | Sem campo de teor — só metadados |
| 3 | Títulos ANM | `dadosabertos.anm.gov.br/SIGMINE/PROCESSOS_MINERARIOS/MG.zip` | Shapefile (zip, 22,3 MB) | 30.596 de pesquisa sem lavra | Dados abertos ANM | 7% dos registros não são de MG |
| 4 | Relevo | `geoftp.ibge.gov.br/.../spmggo50/tif/` | GeoTIFF em zip (73 folhas) | 73 folhas, ~4,0 MB cada (~290 MB) | Dados abertos IBGE | Pasta chamada "tif" guarda .zip |
| 4b | Vias | IBGE (medido) | — | **sem vetor de estrada no IBGE** | — | Só 3 planilhas .ods de 2016 |
| 5 | Proteção | FUNAI, SIGMINE, SIGBM (em FONTES.md) | vetor | 16 TI, 54.916 processos, 320 barragens | Dados abertos | Já medido; não baixar de novo |
| 6 | Alerta IBAMA | `pamgia.ibama.gov.br/server/rest/services/Dados_Mineração__ANM___RedeMais____Exploratório_2_MIL1/MapServer` | ArcGIS FeatureServer | **3** alertas (Brasil: 250) | Dados abertos IBAMA | Número pequeno; calibra, não pesa |
| 6b | Alerta MapBiomas | `plataforma.monitormineracao.mapbiomas.org` | plataforma + shapefile | cobertura nacional | MapBiomas | O *Alerta* do MapBiomas é desmatamento, não mineração |

## Armadilhas medidas

Todas confirmadas em 13/10/2026 contra o servidor real. Não são teoria.

1. **ArcGIS do SGB recusa filtro espacial na litologia.** Query com
   `geometry` devolve `{"error": "Unable to complete operation."}`, mesmo com
   retângulo envolvente e mesmo com polígono simplificado. A geoquímica, ao
   contrário, **aceita** filtro espacial. Não dá para assumir o mesmo
   comportamento entre coleções do mesmo servidor.
2. **Sem paginação.** `supportsPagination: false` — `resultOffset` devolve
   `Pagination is not supported`. `returnCentroidOnly` devolve **só o
   atributo, sem o centróide**, e sem avisar. Sobra fatiar o `WHERE` por
   `OBJECTID`.
3. **`OBJECTID` não começa em 1.** No 1:50.000 vai de 66.594 a 71.777. A
   faixa tem de ser lida por `outStatistics`, senão o fatiamento sai vazio.
4. **`Error performing query operation` é intermitente e depende da
   escala.** A mesma faixa de 2.000 volta cheia minutos depois. Por escala:
   1:250.000 só passou com fatia de **500**, 1:2.500.000 com **200**, as
   demais com 2.000. Sem retenção com espera crescente, a contagem sai
   errada e **sem mensagem de erro**.
5. **`MG.zip` da ANM tem 7% de registros que não são MG.** Filtro por campo
   `UF`, não pelo nome do arquivo.
6. **`apps/web/data/sigmine-nacional.json` está truncado** (`truncado: true`,
   MG com 2.000 linhas). O `por_fase` daí **não é o total** — é o total do
   recorte truncado.
7. **IBGE não publica malha viária vetor.** Só planilhas de texto de 2016.
8. **A pasta `tif` do IBGE guarda `.zip`,** não `.tif` solto — regex por
   `.tif` devolve 0 folhas e parece que a fonte está vazia.
9. **`sistemasgb.sgb.gov.br` não resolve DNS** — a fonte de teores
   geoquímicos do CPRM continua não localizada.

## Recomendação de implementação

### Grade de 1 km

Cruzar tudo numa malha de **1 km × 1 km** sobre MG. Cada célula ganha um
valor de 0 a 100 por fator, e o prior é a soma ponderada. 1 km é fino o
suficiente para separar duas cavas vizinhas e grosso o suficiente para caber
no navegador (MG tem ~556 mil células).

### Pesos sugeridos por fator

| Fator | Peso | Por quê |
|---|---|---|
| Litologia favorável | 20 | É a condição de base: sem rocha boa não tem cava |
| Título de pesquisa ANM | 25 | Onde alguém **já** está minerando é o melhor preditor de cava ilegal vizinha |
| Acesso (relevo + via) | 20 | Cava precisa de máquina e caminhão; beira de estrada e vale favorecem |
| Geoquímica (ponto coletado) | 15 | Marcador de potencial, mas sem teor não é prova |
| Conflito (TI, UC, barragem) | 10 | Aumenta a **urgência** de olhar, não o potencial |
| Alerta de mudança | 10 | Sinal recente; o IBAMA com 3 casos em MG calibra, não puxa |

Os pesos são ponto de partida, não medida. A primeira calibração é comparar
o prior com as **7.656 cavas de treino** já em
`scripts/.cache/cavas-calibracao/positivos-mg.json` — se cavas conhecidas
caem em célula de prior alto, o peso está razoável; se caindo em prior baixo,
peso errado.

### Varredura do satélite × o que o leitor vê

Duas camadas separadas, para não misturar ordem de máquina com informação
para gente:

- **Varredura do satélite:** ordem decrescente de prior. Célula de prior 90
  é processada na primeira leva; célula de prior 10, na última. Isto é
  interno — o leitor não precisa saber a ordem em que o computador olhou.
- **O que o leitor vê:** a cava, o município, o processo da ANM, a fonte
  oficial com link, e a data. **Não** o número do prior. Mostrar "prior 87"
  ao leitor seria o portal afirmando algo que o dado não diz — a §7 do
  AGENTS proíbe exatamente isso. Se o prior for exibido, for à parte, com
  rótulo de que é ordenação de varredura, não constatação de irregularidade.

Lembrar que **prior baixo não é álibi**: a última leva ainda é olhada, só
depois. A frase que acompanha o método, se ele for publicado, é "ordenamos a
busca; não classificamos a terra".

## Origem

Pedido do usuário em 13/10/2026, na sequência do
[PLANO-IBAMA-COORDENADAS-E-PRIOR-GEOLOGICO.md](/docs/historico/planos/PLANO-IBAMA-COORDENADAS-E-PRIOR-GEOLOGICO.md).
Todas as medições deste documento foram feitas no dia 13/10/2026 com
User-Agent honesto e pausa de 2 s por requisição. Nenhum dado pessoal entrou
no repositório.
