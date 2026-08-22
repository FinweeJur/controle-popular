# Fontes: território e mineração

> **Tipo:** HISTORICO
> **Domínio:** global
> **Última medição:** 2026-08-22
> **Leitura estimada:** curta (< 5 min)
> **Relacionados:** [README.md](../../README.md), [AGENTS.md](/AGENTS.md)
> **Palavras-chave:** historico, fontes, coleta

## Sumário

- [Propósito](#propósito)
- [Resposta curta](#resposta-curta)
- [1. Terras indígenas — FUNAI](#1-terras-indígenas-funai)
- [2. Empreendimentos minerários — SIGMINE / ANM](#2-empreendimentos-minerários-sigmine-anm)
- [3. ZAS — a suspeita está certa, e a solução é melhor que o pedido](#3-zas-a-suspeita-está-certa-e-a-solução-é-melhor-que-o-pedido)
- [4. A correção mais importante: 8 km ≠ ZAS](#4-a-correção-mais-importante-8-km-zas)
- [5. Lacunas declaradas](#5-lacunas-declaradas)
- [6. Endpoints confirmados — resumo para a ingestão](#6-endpoints-confirmados-resumo-para-a-ingestão)
- [7. Territórios quilombolas — INCRA (poligonal) e Palmares (lista, sem polígono)](#7-territórios-quilombolas-incra-poligonal-e-palmares-lista-sem-polígono)
- [8. Ordem sugerida](#8-ordem-sugerida)

## Propósito

Levantamento para fechar duas lacunas do globo (terras indígenas, empreendimentos minerários) e corrigir uma premissa errada do plano (ZAS como círculo). Tudo abaixo foi **aberto e confirmado respondendo** em 2026-08-13. Onde não confirmei, está escrito que não confirmei. ---

Levantamento para fechar duas lacunas do globo (terras indígenas, empreendimentos
minerários) e corrigir uma premissa errada do plano (ZAS como círculo).

Tudo abaixo foi **aberto e confirmado respondendo** em 2026-08-13. Onde não
confirmei, está escrito que não confirmei.

---

## Resposta curta

| # | Pergunta | Existe fonte utilizável hoje? |
|---|---|---|
| 1 | Terras indígenas | **Sim.** WFS da FUNAI, aberto, licença compatível. 16 polígonos em MG. |
| 2 | Empreendimentos minerários com geometria | **Sim, com ressalva grande.** SIGMINE/ANM tem 54.916 polígonos em MG — mas só ~6% são lavra de verdade. |
| 3 | ZAS | **Sim, e melhor do que o pedido.** A FEAM publica a ZAS **real** e a mancha de inundação de 156 barragens de MG. Não precisa (nem deve) desenhar círculo. |
| 3b | Povos e comunidades tradicionais não indígenas/não quilombolas | **Não.** Lacuna declarada — ver seção 5. |

A mudança mais importante deste documento não é achar dado novo: é que **o raio
de 8 km e a ZAS são duas coisas jurídicas diferentes**, e o plano estava
fundindo as duas. Ver seção 4.

---

## 1. Terras indígenas — FUNAI

### O serviço

WFS OGC, aberto, sem cadastro:

```
https://geoserver.funai.gov.br/geoserver/ows?service=wfs&version=1.1.0&request=GetCapabilities
```

Confirmado: HTTP 200, 27.900 bytes, `application/xml`.

Camadas publicadas (8):

| Camada | O que é |
|---|---|
| `Funai:tis_poligonais` | **a que interessa** — polígono de cada TI |
| `Funai:tis_pontos` | TIs pequenas demais para polígono, como ponto |
| `Funai:tis_poligonais_portarias` / `tis_pontos_portarias` | versão vinculada ao ato normativo |
| `Funai:tis_amazonia_legal_poligonais` | recorte da Amazônia Legal |
| `Funai:aldeias_pontos` | aldeias |
| `Funai:tis_cr` / `tis_ctl` | coordenações regionais / técnicas locais |

Formatos: `outputFormat=application/json` (GeoJSON), `csv`, `shape-zip`,
`excel2007`, KML. CRS **EPSG:4674 (SIRGAS 2000)** — o mesmo do resto do projeto.

### Esquema de `tis_poligonais`

```
gid, terrai_codigo, terrai_nome, etnia_nome, municipio_nome, uf_sigla,
superficie_perimetro_ha, fase_ti, modalidade_ti, reestudo_ti, cr,
faixa_fronteira, undadm_codigo, undadm_nome, undadm_sigla, dominio_uniao,
data_atualizacao, epsg
```

### ⚠️ Armadilha operacional (custou três tentativas)

Um `GetFeature` **sem filtro** na camada nacional leva **403 do nginx** — é
rate-limit de borda, não erro de permissão. O mesmo request com `CQL_FILTER`
ou `resultType=hits` responde 200 normalmente.

Para a ingestão: **paginar por UF** (`CQL_FILTER=uf_sigla LIKE '%MG%'`) ou por
fase. Não tentar puxar o Brasil inteiro num request.

### As fases, e por que a diferença é jurídica e não burocrática

Contagem nacional real, medida hoje via `resultType=hits` (663 polígonos):

| `fase_ti` | Brasil | MG | O que significa |
|---|---:|---:|---|
| Regularizada | 494 | 11 | fim da linha: homologada **e** registrada em cartório/SPU |
| Declarada | 73 | 0 | Portaria do Ministro da Justiça reconhece os limites; já vale posse plena |
| Delimitada | 45 | 3 | estudo antropológico aprovado e publicado pela FUNAI; ainda não foi ao Ministro |
| Encaminhada RI | 28 | 2 | Reserva Indígena em tramitação (terra comprada/doada, não tradicional) |
| Homologada | 17 | 0 | Decreto do Presidente homologou a demarcação; falta só o registro |
| Em Estudo | 6 | 0 | grupo de trabalho constituído, estudo em curso |

**Isto importa para o alerta, e muito.** A tentação é filtrar por "Regularizada"
porque é a mais "sólida". Seria um erro grave:

- O direito territorial indígena é **originário** (CF art. 231): a demarcação
  *declara* um direito que já existe, não o cria. Terra em estudo não é terra
  sem direito.
- A **Convenção 169 da OIT** (Decreto 10.088/2019, com força de lei no Brasil)
  condiciona a consulta livre, prévia e informada à **afetação** do povo — não
  ao estágio cartorial do processo. Uma TI *Em Estudo* atingida por uma barragem
  gera dever de consulta igual ao de uma *Regularizada*.
- Na prática, as fases iniciais são justamente as mais vulneráveis: é onde o
  empreendimento tenta correr na frente da demarcação.

**Portanto: o globo deve mostrar todas as fases, com a fase visível na etiqueta
e na legenda.** Filtrar por fase é decisão do usuário, nunca padrão do sistema.

### Quantas TIs em MG, e onde

**16 polígonos** (a Xacriabá aparece duas vezes: a Regularizada de 46.416 ha e o
reestudo Delimitado de 43.357 ha — são **15 TIs distintas**).

**Na bacia do Paraopeba — duas, e não zero:**

| TI | Etnia | Município | Fase | Área |
|---|---|---|---|---|
| Aldeia Katurama | Pataxó, Pataxó Hã-Hã-Hãe | **São Joaquim de Bicas** | Regularizada | 346 ha |
| Caxixé | Kaxixó | **Pompéu, Martinho Campos** | **Delimitada** | 5.411 ha |

São Joaquim de Bicas fica no Paraopeba **logo a jusante de Brumadinho**. Pompéu
está no baixo Paraopeba, perto da foz no São Francisco. Ou seja: a feature não é
teórica para a bacia — e uma das duas está em fase *Delimitada*, exatamente o
caso que um filtro ingênuo por "Regularizada" apagaria do mapa.

**Nos Vales (Mucuri, Jequitinhonha, Rio Doce) — sete:**

| TI | Etnia | Município | Fase |
|---|---|---|---|
| Aldeia Escola Floresta | Maxakali | Teófilo Otoni | Regularizada |
| Mundo Verde/Cachoeirinha | Maxakali | Teófilo Otoni | Regularizada |
| Hãm Yãxux | Maxakali | Ladainha | Regularizada |
| Maxacali | Maxakali | Santa Helena de Minas, Bertópolis | Regularizada |
| Fazenda Guarani | Pataxó, Krenak | Senhora do Porto, Carmésia | Regularizada |
| Krenak | Krenak | Resplendor | Regularizada |
| Krenak de Sete Salões | Krenak | Sta. Rita do Itueto, Resplendor, Cons. Pena, Itueta | Delimitada |

As demais em MG: Xacriabá e Xakriabá Rancharia (Itacarambi / São João das
Missões — a maior de MG), Tuxá Setsor Bragagá (Buritizeiro), Fazenda Boa Vista e
Kiriri de Caldas (Caldas), Muã Mimatxi (Itapecerica).

**Conclusão: a feature vale a pena.** Não é o caso de "poucas ou nenhuma".

### Licença

Da própria página da FUNAI:

> "o conteúdo dos arquivos correspondentes a geoprocessamento e mapas poderá ser
> reproduzido desde que citada a fonte, excetuando os casos especificados em
> contrário e os conteúdos replicados de outras fontes."

**Atribuição, sem restrição de uso comercial.** Compatível com o projeto.
Atualização **mensal**.

### Bônus: MG já tem a mesma coisa no IDE-Sisema

`IDE:ide_2003_mg_terras_indigenas_pol` — **16 feições**, bate exatamente com a
FUNAI. Serve como fonte de conferência, mas a FUNAI é a fonte primária e deve
ser a usada.

---

## 2. Empreendimentos minerários — SIGMINE / ANM

### O serviço

Não é WFS: é download direto de shapefile, gerado **diariamente**.

```
https://dadosabertos.anm.gov.br/SIGMINE/PROCESSOS_MINERARIOS/MG.zip
```

Confirmado: HTTP 200, **21.952.070 bytes**, zip válido (`MG.shp` 67,6 MB,
`MG.dbf` 23,1 MB). Também disponível `BRASIL.zip`, `.kmz` por UF, e
`AREA_SERVIDAO / ARRENDAMENTO / BLOQUEIO / PROTECAO_FONTE / RESERVAS_GARIMPEIRAS`.

**⚠️ Exige `User-Agent` de navegador.** Sem UA, o servidor devolve 403. Com
`Mozilla/5.0 (...)`, 200. Vale para o `curl` e para qualquer fetch do script de
ingestão.

CRS: **SIRGAS 2000** (do `.prj`), encoding UTF-8 (do `.cpg`).

Esquema do DBF:
`PROCESSO, NUMERO, ANO, AREA_HA, ID, FASE, ULT_EVENTO, NOME, SUBS, USO, UF, DSProcesso`

### O que cada polígono é — e o que ele NÃO é

**54.916 polígonos em MG.** Distribuição real, contada agora no DBF:

| FASE | Polígonos | Área total | É mina? |
|---|---:|---:|---|
| AUTORIZAÇÃO DE PESQUISA | 24.707 | 19.429.306 ha | ❌ pesquisa autorizada |
| REQUERIMENTO DE LAVRA | 6.051 | 2.023.596 ha | ❌ **pedido** de lavra |
| REQUERIMENTO DE PESQUISA | 5.697 | 2.788.312 ha | ❌ pedido de pesquisa |
| DISPONIBILIDADE | 5.593 | 2.653.273 ha | ❌ área devolvida, sem titular |
| LICENCIAMENTO | 3.397 | 88.367 ha | ✅ produção (regime de licenciamento) |
| **CONCESSÃO DE LAVRA** | **3.184** | **942.245 ha** | ✅ **mina autorizada a produzir** |
| REQUERIMENTO DE LICENCIAMENTO | 2.366 | 60.035 ha | ❌ pedido |
| REQUERIMENTO DE LAVRA GARIMPEIRA | 1.474 | 318.876 ha | ❌ pedido |
| DIREITO DE REQUERER A LAVRA | 1.029 | 299.484 ha | ❌ direito ainda não exercido |
| APTO PARA DISPONIBILIDADE | 606 | 374.491 ha | ❌ |
| REQUERIMENTO DE REGISTRO DE EXTRAÇÃO | 306 | 1.056 ha | ❌ pedido |
| LAVRA GARIMPEIRA | 278 | 26.236 ha | ✅ PLG ativa |
| REGISTRO DE EXTRAÇÃO | 224 | 796 ha | ✅ extração p/ obra pública |
| RECONHECIMENTO GEOLÓGICO | 2 | 330 ha | ❌ |
| DADO NÃO CADASTRADO | 2 | 759 ha | ❓ |

O ponto que o plano não pode borrar, em números: das 54.916 poligonais,
**7.083 (12,9%) são título que autoriza extrair** — e só 3.184 (5,8%) são
Concessão de Lavra propriamente dita. As outras 47.833 são pedidos, pesquisa ou
área vaga.

**Publicar as 54.916 como "empreendimentos minerários" diria que 19,4 milhões de
hectares de Minas — mais de 30% do estado — são mina.** É falso, e é exatamente o
tipo de salto que o projeto existe para não dar. Um requerimento de pesquisa é
um papel protocolado na ANM; pode ser indeferido, pode nunca virar nada.

### Proposta: o que entra e o que fica de fora

**Camada "Minas em operação"** (padrão, ligada) — FASE ∈
`CONCESSÃO DE LAVRA`, `LICENCIAMENTO`, `LAVRA GARIMPEIRA`, `REGISTRO DE EXTRAÇÃO`.
7.083 polígonos, ~1,06 M ha. Só aqui cabe a palavra "mina".

**Camada "Interesse minerário"** (desligada por padrão) — as fases de
requerimento, pesquisa e disponibilidade. Rótulo honesto: *"processo na ANM —
não é mina em operação"*. É informação legítima e útil (mostra pressão futura
sobre um território), desde que nomeada pelo que é.

**Nunca** somar as duas num número único, nem chamar o conjunto de
"empreendimentos".

Campos úteis para a etiqueta: `NOME` (titular), `SUBS` (substância), `FASE`,
`AREA_HA`, `PROCESSO`. Em MG as substâncias líderes são areia (10.491), granito
(6.167), minério de ferro (4.587), ouro (3.946) e **lítio (2.086)**.

### Licença

Portal federal de dados abertos (Decreto 8.777/2016 + LAI 12.527/2011), download
público sem cadastro. **Não consegui recuperar uma string formal de licença** —
a API do dados.gov.br exige chave (401) e a página de bases de dados da ANM não
traz o texto. Tratar como dado aberto governamental com atribuição à ANM.
*Item a confirmar antes de publicar, se quisermos rigor total.*

### E a CFEM?

Confirma-se o diagnóstico: a CFEM é royalty por município/substância/mês/valor.
Não tem coordenada nem poligonal, e **não localiza mina**. Serve para dizer
*quanto* um município arrecada, nunca *onde* está o buraco. O SIGMINE é que
responde "onde".

---

## 3. ZAS — a suspeita está certa, e a solução é melhor que o pedido

### A definição legal, na fonte

**Resolução ANM nº 95/2022, Art. 2º, inciso LI** (texto extraído do PDF oficial
em `gov.br/anm/.../resolucao-no-95-2022.pdf`, 51 páginas):

> "Zona de Autossalvamento (ZAS): trecho do vale **à jusante** da barragem em que
> se considera que os avisos de alerta à população são da responsabilidade do
> empreendedor, por não haver tempo suficiente para uma intervenção das
> autoridades competentes em situações de emergência, devendo-se adotar a maior
> das seguintes distâncias para a sua delimitação: a distância que corresponda a
> um tempo de chegada da onda de inundação igual a 30 (trinta) minutos ou 10 km
> (dez quilômetros)."

E o inciso **LII**: "Zona de Segurança Secundária (ZSS): trecho constante do
Mapa de Inundação, não definida como ZAS."

**Confirmado, palavra por palavra: "trecho do vale à jusante".** A ZAS desce o
vale. Não é círculo. Rejeito não sobe morro.

Confirmado também que **o piso legal é 10 km, não 8**. A resolução manda pegar
*a maior* entre 10 km e a distância de 30 minutos de propagação — nunca menos
que 10 km ao longo do vale.

### Quanto o círculo erraria — medido, não estimado

Baixei a ZAS real das 5 barragens de Brumadinho e calculei a área:

| Barragem | ZAS real | Círculo de 8 km | Superestimação |
|---|---:|---:|---:|
| Barragem VI – Mina Córrego do Feijão | 2,5 km² | 201 km² | **81×** |
| Barragem B1 – Mina Ipê | 13,9 km² | 201 km² | 14× |
| Barragem Menezes II | 1,9 km² | 201 km² | 105× |
| Barragem Capim Branco | 1,8 km² | 201 km² | 111× |
| Barragem Santa Bárbara | 1,6 km² | 201 km² | 127× |

E o erro não é só de tamanho, é de **direção**. A ZAS da Barragem VI tem 49.372
vértices dentro de uma caixa de 5,2 × 6,1 km: é um fio sinuoso de vale ocupando
~8% da caixa, não um disco. O círculo:

- **inclui** morro acima e para os lados — assusta quem está seguro;
- **exclui** o vale abaixo dos 8 km, onde a onda de fato chega — e a lâmina
  segue muito além disso.

O segundo erro é o que mata. Uma família a 12 km rio abaixo consulta o mapa,
se vê fora do círculo e conclui que está segura. Está dentro da ZAS real.

### A boa notícia: a ZAS real de MG é pública, com geometria

A FEAM publica **as duas coisas** no geoserver que o projeto **já usa** para
`feam_barragens` (`geoserver.meioambiente.mg.gov.br/IDE/ows`):

| Camada | Feições | O que é |
|---|---:|---|
| `IDE:ide_1903_mg_zas_pae_pol` | **156** | **a ZAS de verdade**, do PAE de cada barragem |
| `IDE:ide_1903_mg_mancha_inundacao_pae_pol` | **156** | envoltória máxima de inundação (cenário de ruptura extremo, do ERHB) |
| `IDE:ide_250101_do_mancha_inund_fundao_pol` | 1.243 | mancha específica do rompimento de Fundão / Rio Doce |
| `IDE:ide_1901_mg_barragens_rejeitos_residuos_pto` | 259 | pontos das barragens |

Atributos: `id`, `id_sigibar`, `estrutura`, `empreended`, `municipio`,
`status_pae`, `status_erh`. CRS **EPSG:4674**. Atualização **bimestral**
(última revisão de metadado: 2026-01-23). Metadado diz **"O acesso ao dado é
livre"**. Órgão: FEAM / NUGEO.

Origem: é a envoltória máxima do **Estudo de Ruptura Hipotética de Barragem
(ERHB)** que compõe o PAE. Ou seja — **é o dado certo, e não um raio**.

Status das 156 ZAS: 144 com PAE *em análise* + ERHB *aprovada*, 11 com PAE
*aprovado*, 1 descadastrada. **Mostrar `status_pae` na etiqueta**: "em análise"
significa que o próprio órgão ainda não bateu o martelo naquela mancha.

**Na bacia do Paraopeba são 24 ZAS**, incluindo Córrego do Feijão e Menezes II
(Brumadinho), Casa de Pedra e B4 (CSN, Congonhas), Marés I e II (Belo Vale),
B1/B3 (Minerita, Itatiaiuçu), Ibirité (Petrobras, Sarzedo).

### E os PAE em si?

O **PAE completo não é publicado** em base aberta. A Resolução 95/2022 (art. 38)
obriga o empreendedor a "disponibilizar informações, de ordem técnica, para a
Defesa Civil, para as prefeituras e para as demais instituições indicadas pelo
governo municipal, **quando solicitado formalmente**" — ou seja, sob demanda e
para o poder público, não em portal.

O que é público é **o produto geográfico do PAE** (ZAS + mancha), via FEAM. Que
é justamente a parte que o mapa precisa. O PAE textual continua sendo alvo de
LAI — encaixa no painel de LAI que o projeto já tem.

Da ANM em dados abertos só sai `dadosabertos.anm.gov.br/SIGBM/Barragens.csv`
(908 barragens, 57 colunas: DPA, CRI, Nível de Emergência, lat/long,
"Necessita de PAEBM"). **Tem o ponto, não tem a mancha.** Para geometria de ZAS,
a FEAM é a única fonte pública que encontrei.

### Como o mapa deve tratar isso, com honestidade

1. **Usar `ide_1903_mg_zas_pae_pol` como a ZAS.** Nunca gerar buffer circular.
2. Desenhar **ZAS e mancha de inundação como camadas distintas** — a ZAS é onde
   não dá tempo de a autoridade chegar (o empreendedor tem que avisar); a mancha
   é todo o alcance da onda. A diferença entre as duas é a ZSS.
3. **As 103 barragens de MG sem ZAS publicada** (259 pontos − 156 manchas)
   precisam de tratamento explícito: *"sem mancha de inundação publicada pela
   FEAM"*. **Ausência de mancha não é ausência de risco** — é ausência de dado.
   Deixar em branco e mudo é o pior dos mundos.
4. Se em algum momento for preciso um indicador na falta da mancha, que seja
   rotulado como **proxy grosseiro**, jamais como ZAS, e de preferência traçado
   descendo a drenagem — não como disco.
5. Mostrar `status_pae` e a data de atualização em cada mancha.

---

## 4. A correção mais importante: 8 km ≠ ZAS

O pedido original — *"raio de ZAS ou 8 km"* — mistura **dois institutos
jurídicos diferentes**. Os dois existem. Nenhum dos dois é o outro.

| | **ZAS** | **Raio de 8 km** |
|---|---|---|
| Norma | Lei 12.334/2010 (red. Lei 14.066/2020); Res. ANM 95/2022 art. 2º, LI | **Portaria Interministerial 60/2015, Anexo I** |
| Forma | **trecho do vale a jusante** | **círculo em volta da TI** |
| Centro | a barragem | a terra indígena |
| Tamanho | maior entre 10 km e 30 min de onda | 8 km fora da Amazônia Legal (10 km dentro) |
| Para quê | salvar vida na emergência | disparar a participação da FUNAI no licenciamento |

O 8 km é real e é relevante para Minas — só que ele é o raio a partir do qual um
**empreendimento pontual (portos, mineração e termelétricas)** obriga a
manifestação da FUNAI no licenciamento ambiental, fora da Amazônia Legal.

E — melhor ainda — **esse raio já está pronto e publicado**:
`IDE:ide_2004_mg_raio_rest_terras_indigenas_pol`, **80 feições** (as 16 TIs de MG
× 5 tipologias), com o campo `dist` em metros:

| `dist` | `tipologia` |
|---:|---|
| 15 km | Aproveitamentos hidrelétricos (UHEs e PCHs) |
| 10 km | Rodovias |
| **8 km** | **Empreendimentos pontuais (portos, mineração e termelétricas)** |
| 5 km | Ferrovias e linhas de transmissão |
| 3 km | Dutos |

Há também o equivalente para quilombolas:
`IDE:ide_2006_mg_raio_rest_terras_quilombolas_pol`.

**Então são duas features distintas, ambas construíveis hoje:**

- **"Esta TI está no caminho de uma barragem?"** → interseção TI × ZAS/mancha da FEAM.
- **"Este processo minerário exige oitiva da FUNAI?"** → interseção poligonal SIGMINE × raio de 8 km.

Fundir as duas num "raio de ZAS ou 8 km" produziria um número que não responde
nenhuma das duas perguntas.

### Teste real: já dá alerta hoje

Peguei a bbox da TI **Aldeia Katurama** (São Joaquim de Bicas) e consultei quais
manchas de inundação a cruzam. Resultado — **seis barragens**:

| Barragem | Empreendedor | Município |
|---|---|---|
| Barragem B1 | Itaminas Comércio de Minérios S.A. | Sarzedo |
| Barragem B4 | Itaminas Comércio de Minérios S.A. | Sarzedo |
| Barragem 7 Mina de Viga | Vale S.A. | Jeceaba |
| Barragem B1 Auxiliar | Mineração Morro do Ipê S.A. | Igarapé |
| Barragem B2 – Mina Tico-Tico | Mineração Morro do Ipê S.A. | Igarapé |
| Barragem Soledade | Gerdau Açominas S.A. | Ouro Branco |

⚠️ Isto é teste **bbox × geometria** (filtro BBOX do WFS), não interseção exata
de polígonos. Antes de virar alerta publicado tem que rodar `ST_Intersects` de
verdade. Mas mostra que a feature tem conteúdo real, não é hipótese.

---

## 5. Lacunas declaradas

### 5.1 Territórios de povos e comunidades tradicionais não indígenas e não quilombolas — NÃO HÁ BASE

Faiscadores, geraizeiros, apanhadoras de flores sempre-vivas, vazanteiros,
povos de terreiro, pescadores artesanais. Minas tem todos, e a Convenção 169
alcança todos eles. **Não encontrei base geográfica oficial com poligonal.**

O que existe e por que não serve:

- **Plataforma de Territórios Tradicionais (MPF + CNPCT)** —
  `territoriostradicionais.mpf.mp.br`. **Exige login**; não achei download
  público, WFS nem API aberta. Além disso é autodeclaratória e alimentada pelas
  próprias comunidades, o que levanta uma questão que não é técnica: publicar
  localização de comunidade vulnerável sem consentimento pode expor em vez de
  proteger. Mesmo que abrisse, o caminho correto seria pedir autorização, não
  raspar.
- **IDE-Sisema** — tem TI, quilombola, assentamentos rurais
  (`ide_1107_mg_assentamentos_rurais_pol`) e áreas de patrimônio cultural do
  IEPHA. **Não tem** camada de PCTs.
- **CEPCT/MG** reconheceu formalmente 73 comunidades geraizeiras em 2018, mas o
  reconhecimento é lista administrativa, **sem poligonal publicada**.
- **"Tô no Mapa" (ISPN)** — autocartografia comunitária, integrada à plataforma
  do MPF; mesma questão de consentimento e sem download aberto confirmado.

**Consequência para o plano:** o alerta de sobreposição pode cobrir hoje
**indígenas e quilombolas**. Para os demais PCTs, o mapa deve dizer
explicitamente que **não os representa** — para ninguém ler "não aparece no mapa"
como "não existe ali". Uma comunidade geraizeira dentro de uma ZAS não vai
aparecer, e o mapa precisa admitir isso em texto visível, não em rodapé.

### 5.2 Licença formal do SIGMINE

Não recuperada (API do dados.gov.br pede chave; página da ANM não traz o texto).
Dado é abertamente baixável e regido por LAI + Decreto 8.777/2016. Confirmar
antes de publicar se quisermos rigor total.

### 5.3 PAE textual

Não publicado em base aberta. Só via solicitação formal / LAI. A geometria (ZAS
e mancha) é pública via FEAM — que é o que o mapa precisa.

### 5.4 103 barragens de MG sem mancha publicada

259 pontos de barragem contra 156 manchas. A diferença precisa de rótulo
explícito no mapa (ver seção 3, item 3).

---

## 6. Endpoints confirmados — resumo para a ingestão

```bash
# Terras indígenas (FUNAI) — paginar por UF, senão 403
https://geoserver.funai.gov.br/geoserver/ows
  ?service=WFS&version=1.0.0&request=GetFeature
  &typeName=Funai:tis_poligonais
  &outputFormat=application/json
  &CQL_FILTER=uf_sigla LIKE '%MG%'          # 16 feições

# Processos minerários (ANM/SIGMINE) — exige User-Agent de navegador
https://dadosabertos.anm.gov.br/SIGMINE/PROCESSOS_MINERARIOS/MG.zip   # 22 MB, 54.916 polígonos

# ZAS e mancha de inundação (FEAM/IDE-Sisema) — geoserver que o projeto já usa
https://geoserver.meioambiente.mg.gov.br/IDE/ows
  ?service=WFS&version=1.0.0&request=GetFeature
  &typeName=IDE:ide_1903_mg_zas_pae_pol                    # 156
  &typeName=IDE:ide_1903_mg_mancha_inundacao_pae_pol       # 156
  &typeName=IDE:ide_2004_mg_raio_rest_terras_indigenas_pol # 80 (dist=8000 p/ mineração)
  &typeName=IDE:ide_2006_mg_raio_rest_terras_quilombolas_pol

# Cadastro de barragens (ANM/SIGBM) — ponto + DPA/CRI, sem mancha
https://dadosabertos.anm.gov.br/SIGBM/Barragens.csv                   # 908 barragens
```

⚠️ **A ZAS completa em GeoJSON tem 418 MB.** Usar `propertyName` sem a coluna de
geometria para atributos, `resultType=hits` para contagem, e filtro espacial ou
por município para geometria. Não puxar a camada inteira num request.

---

## 7. Territórios quilombolas — INCRA (poligonal) e Palmares (lista, sem polígono)

Levantado em 13/08/2026, no mesmo dia em que um alerta novo
(`calcular_alerta_territorio_mineracao.py`) achou 12 sobreposições reais de
território quilombola com lavra de granito autorizada e não conseguiu dizer o
NOME de nenhum território — as duas camadas já publicadas
(`territorios-quilombolas.geojson`, `territorios-quilombolas-vales.geojson`)
só tinham `area_ha`. Ver `scripts/ingerir_incra_quilombolas.py` para a
ingestão completa; aqui fica só o registro da fonte.

### Duas fontes, e são coisas diferentes

| | **INCRA** | **Fundação Cultural Palmares** |
|---|---|---|
| O que é | POLIGONAL do processo de regularização fundiária | CERTIDÃO de comunidade remanescente de quilombo (CRQ) |
| Geometria | Sim | **Não** — é lista |
| Serve para | Desenhar o território no mapa | Cruzar/enriquecir nome × município |

### INCRA — Acervo Fundiário, camada `quilombolas_mg`

```
http://acervofundiario.incra.gov.br/i3geo/ogc.php
  ?tema=quilombolas_mg&service=WFS&version=1.1.0&request=GetFeature
```

Confirmado hoje, chamando de verdade: HTTP 200, **22 feições em MG**
(`resultType=hits`), esquema com `nm_comunid`, `nm_municip`, `nr_process`,
`area_calc_ha`, `nr_familia`, `dt_publica`/`dt_public1` (publicação do RTID),
`dt_titulac` (titulação), `esfera`, `responsave`. Só sai GML 3.1.1 — não tem
`outputFormat=application/json` habilitado para esta camada (erro do próprio
servidor confirma). Eixo do `posList` é (lat, lon), invertido do que GeoJSON
espera. UTF-8 declarado bate com os bytes (ao contrário do WFS da FUNAI —
ver seção 1). Licença, do `AccessConstraints` do `GetCapabilities`: **"vedado
o uso comercial"** — mais restritiva que a da FUNAI. Fees: "none".

Não existe campo de fase pronto como `fase_ti`; a fase usada no mapa
(`fase_quilombola`) é DEDUZIDA das datas de RTID/titulação — documentado com
o mesmo cuidado do campo da FUNAI: é etiqueta, nunca filtro.

`responsave` (responsável pela titulação) foi conferido nas 22 feições de MG:
só assume "INCRA" ou "CEMIG" — nomes de instituição, não de pessoa física.
Mesmo assim não entra no GeoJSON publicado (ver docstring do script) — não
soma informação e é campo do tipo que um dia pode trazer nome de
representante.

### Fundação Cultural Palmares — lista de comunidades certificadas

```
https://dados.cultura.gov.br/dataset/comunidades-quilombolas-certificadas
```

Confirmado hoje: HTTP 200, CSV de 749.619 bytes
(`.../resource/d95c6eca-38f7-4f4a-998f-97849df2575a/download/planilhacertificadas.csv`),
licença **Creative Commons Atribuição**. Última atualização: **05/07/2022** —
portanto quase quatro anos desatualizada em relação a hoje. **Não usada nesta
ingestão**: a poligonal do INCRA já resolve nome + geometria na mesma fonte, e
a lista da Palmares não tem coordenada nenhuma — só serviria para cruzar nome
×município, o que o INCRA já traz. Fica registrada para um dia servir de
conferência cruzada (ex.: um território "Sem RTID publicado" no INCRA que já
tem certidão da Palmares é candidato a checar se o INCRA está atrasado).

### O que a ingestão achou, medido

Das 14 feições que as duas camadas já tinham: **13 casaram** com uma feição do
INCRA por geometria (centróide + área — não há ID em comum entre a base
antiga e o INCRA). Uma (`territorios-quilombolas-vales.geojson` índice 3,
58,2 ha, perto de Lagoa Grande) **não achou par** e continua sem nome — não foi
apagada, nem inventado nome: fica com `fonte_incra: false` e um aviso na
própria ficha.

O INCRA tem **13 territórios em MG que não entram em nenhuma das duas
camadas** hoje (TQ Nogueira, São Sebastião, Baú-Serro, Ausente, Tabua, Brejo
dos Criolos, Amaros, Sete Ladeiras e Terra Dura, Machadinho, São Domingos,
Gurutuba, Lapinha, Pimentel) — nenhum é claramente Paraopeba nem
Jequitinhonha/Mucuri pela leitura do município; a maioria é Norte/Noroeste de
Minas, fora das regiões que este projeto já delimita. Decidir se algum deles
(sobretudo Pimentel, Pedro Leopoldo — perto da RMBH) entra na camada da bacia
exige checar contra a malha real da bacia do Paraopeba, não contra o nome do
município. Fica como próximo passo, não decidido aqui.

**A resposta que motivou toda esta seção**: as duas maiores sobreposições com
lavra de granito autorizada (551,3 ha e 256,7 ha, GRANSENA EXPORTAÇÃO E
COMÉRCIO, `territorios-quilombolas-vales.geojson` índice 5) são no território
**Baú, em Araçuaí** — RTID publicado em 27/11/2023, ainda em titulação,
15.500 ha, 95 famílias, processo INCRA 54170.000070/2009-81.

---

## 8. Ordem sugerida

1. **ZAS + mancha da FEAM.** Maior ganho, menor esforço — é o geoserver que o
   projeto já consome, e substitui uma feature que teria nascido errada.
2. **Terras indígenas da FUNAI**, todas as fases, fase na etiqueta.
3. **Interseção TI × mancha** → o alerta que o dono pediu. Já sabemos que tem
   resultado em São Joaquim de Bicas.
4. **SIGMINE**, separado em duas camadas ("minas em operação" / "interesse
   minerário"), com a de operação como padrão.
5. **Raio de 8 km × SIGMINE** → alerta de licenciamento sem oitiva da FUNAI.
6. **Texto de lacuna sobre PCTs** — junto com a feature, não depois.

---

*Levantado em 2026-08-13. Todos os endpoints desta página foram chamados e
responderam; as contagens foram medidas, não estimadas. O que não foi
confirmado está marcado como tal.*
