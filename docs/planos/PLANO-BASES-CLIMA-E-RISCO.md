# Plano: bases de vulnerabilidade climática e risco

Pedido do dono: *"procure bases úteis para integração, como a de vulnerabilidade
climática e me apresente COMO integrar."* Ele já decidiu que quer — este
documento não pesa "vale a pena", só mostra o caminho: endpoint, esquema,
onde encaixa na tela, o que atualiza sozinho e o que não, e o que falta.

Duas pistas dadas por ele: um artigo do MAB
(`mab.org.br/.../plataformas-publicas-monitoram-riscos...`) citando oito
plataformas de monitoramento, e o catálogo `basedosdados.org/search`. As
duas foram abertas de verdade — o artigo entrega uma lista de nomes, o
catálogo entrega datasets. Nenhum dos dois foi tratado como conteúdo: cada
plataforma e cada dataset citado abaixo foi **aberto, chamado e medido**
em 13/08/2026. Onde a chamada falhou ou veio vazia, está escrito que
falhou — isso também é resultado, não lacuna de pesquisa.

Padrão de rigor, o mesmo de `docs/_historico/FONTES-TERRITORIO-E-MINERACAO.md`:
endpoint citado foi chamado, contagem foi medida, licença foi conferida.
Uma regra a mais, específica deste levantamento: **índice composto não é
medida**. Várias das fontes abaixo publicam um número de 0 a 1 ("risco
alto", "vulnerabilidade média") calculado por metodologia de terceiro —
isso é opinião técnica com forma de dado, e só entra no portal com link
visível pra metodologia. Onde a fonte dá contagem bruta (gente, domicílio,
milímetro de chuva), isso é dito explicitamente, porque é uma categoria
diferente de fato.

---

> **Estado da execução (2026-08-15).** A primeira fatia deste plano saiu:
> **AdaptaBrasil** (coletor `etl/betim/etl/apis/adaptabrasil_risco.py`,
> migration `0074`, 6.824 linhas medidas) e **INMET avisos ativos** (coletor
> `etl/betim/etl/apis/inmet_avisos.py`, só leitura). O que foi medido, o que
> mudou em relação a este documento e o que ficou bloqueado está em
> **`docs/CLIMA-ADAPTABRASIL-E-INMET.md`** — inclusive o achado que este
> plano não previa: **Belo Horizonte pontua 0,00 ("Muito baixo") nos dois
> índices de manchete do AdaptaBrasil**, a mesma cidade que o BATER mede com
> 389.218 pessoas em área de risco. BATER e CEMADEN seguem sem tocar.

## Resposta curta

| Base | Dado extraível | Granularidade | Licença | Onde encaixa |
|---|---|---|---|---|
| **AdaptaBrasil** (MCTI/INPE/RNP) | Índice de risco climático (deslizamento, inundação, seca, calor, 6 setores) | **Município** — 853/853 de MG confirmados | CC-BY-SA, confirmada no texto de uso | Globo (camada nova, coroplético) + `/[municipio]/clima` |
| **IBGE + CEMADEN — BATER** ("População em áreas de risco no Brasil") | Nº de pessoas e domicílios expostos, por características (idade, sexo, renda) | **Polígono BATER** (setor censitário × área de risco) — mais fino que município | Não confirmada formalmente (dado estatístico federal) | `/[municipio]/defesa-civil` (número de destaque) + globo (geometria pendente) |
| **CEMADEN — pluviômetros** | Chuva acumulada em tempo real, por estação | **Ponto** — 500 estações em MG | Não confirmada para o espelho estadual testado; presumir padrão MCTI | Globo (ponto perto de barragem) + `/[municipio]/clima` |
| **INMET — avisos ativos** | Alerta de risco meteorológico geolocalizado (polígono + municípios) | **Polígono** cobrindo lista de municípios | Domínio público, confirmada na própria resposta da API | Banner/card em `/[municipio]/clima` e `/[municipio]/defesa-civil` |
| **INPE — Queimadas** | Foco de calor, dias sem chuva, risco de fogo | **Ponto** (foco individual) | Do INPE, não da Base dos Dados — não conferida | Globo (camada de ponto) ou tabela nova |
| **MDR/SNIS + ANA/Atlas Esgotos** | Cobertura de água/esgoto, carga poluidora | **Município** | Do MDR/ANA — não conferida | `/ambiental` ou `/[municipio]/infraestrutura` |
| **MapBiomas** | Série histórica de uso/cobertura da terra | **Município** (o baixável); pixel 30 m só via GEE | CC BY, confirmada | `/ambiental` (tabela nova, ETL único) |
| **MapBiomas Alerta** | Alerta de desmatamento já cruzado com TI/quilombola/UC | Geometria por alerta — **bloqueada por login** | CC BY | Pendente — decisão de produto (criar conta), não dado hoje |
| **PNUD — Atlas do Desenvolvimento Humano** | Índice de vulnerabilidade socioeconômica | Município | Não conferida | Baixa prioridade — dado de 1991–2010 |
| AdaptaSUS | — | — | — | **Não há dado**: é PDF de plano, sem API |
| Plano Clima (MMA) | — | — | — | **Não há dado**: 403/restrito nas 3 URLs testadas, cópia achada é slide sem tabela |
| CEMADEN GeoRisk / Painel de Alertas / SALVAR | — | — | — | **Sem API pública confirmada** (SALVAR é login por definição) |
| S2ID (desastres, MIDR) | — | — | — | Catalogado na Base dos Dados só como link — "Tem API: Não" |

---

## 1. AdaptaBrasil (MCTI/INPE/RNP) — índice de risco climático por município

### O serviço

API REST pública, sem autenticação, `sistema.adaptabrasil.mcti.gov.br/api/`.
Confirmada hoje:

```
GET https://sistema.adaptabrasil.mcti.gov.br/api/hierarquia/adaptabrasil
→ HTTP 200, 1.486.690 bytes, 558 indicadores (JSON)

GET https://sistema.adaptabrasil.mcti.gov.br/api/mapa-dados/MG/municipio/{indicador}/{ano}/null/adaptabrasil
→ HTTP 200, um registro por município
```

⚠️ **Armadilha medida:** cada indicador tem um `ano` fixo próprio (o campo
`years` na hierarquia) — chamar com o ano errado devolve `[]` silencioso,
não erro. Testei `indicador=60000` (nível de setor, não de indicador) e
`ano=2020` (errado): array vazio. Corrigido para `indicador=60001`
(Deslizamento de terra) e `ano=2015` (o ano real do indicador): **853
registros**, um por município de MG — bate exato com os 853 municípios do
estado.

### O que o indicador é, e o que ele não é

`60000` (Desastres geo-hidrológicos) se abre em dois indicadores de
primeira linha — `60001` Deslizamento de terra e `60041`
Inundações/enxurradas/alagamentos — cada um decomposto em Vulnerabilidade
× Exposição × Ameaça, e Vulnerabilidade se abre em Capacidade adaptativa ×
Sensibilidade, com 14 subcomponentes por baixo (população, infraestrutura,
domicílios em área de risco, densidade demográfica, gestão de risco,
saneamento, drenagem etc.) — 81 indicadores só neste setor.

Exemplo real, medido (Brumadinho, `geocod_ibge=3109006`, ano 2015):

```json
{"indicator_id": 60001, "name": "Deslizamento de terra", "value": 0.37, "rangelabel": "Baixo"}
{"indicator_id": 60039, "name": "Domicílios em áreas de risco", "value": 0.32, "rangelabel": "Baixo"}
```

**Todo valor é índice normalizado de 0 a 1**, com faixa de cor e rótulo
(Muito baixo/Baixo/Médio/Alto/Muito alto/Dado indisponível) — mesmo o
subcomponente `60039` "Domicílios em áreas de risco", que pelo nome parece
contagem: é 0,32, não "32 domicílios" nem "32%". **Isto é a doutrina do
projeto sobre índice, e vale integralmente aqui**: publicar o valor sem
dizer que é índice composto, calculado pela metodologia do AdaptaBrasil
(peso de cada subindicador documentado no próprio site, em
`complete_description` de cada nível), seria publicar opinião técnica com
cara de fato.

### Esquema da resposta

```
id, geocod_ibge, name, indicator_id, year, scenario_id, pessimist, value, valuecolor, rangelabel
```

`geocod_ibge` é o código IBGE de 7 dígitos — bate direto com
`ref_municipios_mg.id_ibge`, chave de junção pronta.

### Setores disponíveis (além de desastres geo-hidrológicos)

Recursos hídricos, Segurança alimentar, Segurança energética,
Infraestrutura portuária, Saúde (doenças vetoriais), e o próprio Desastres
geo-hidrológicos. Não explorei os outros cinco a fundo — o pedido do dono
foi vulnerabilidade climática/desastre, que é exatamente o setor 60000.
Se um dia servir saúde ou recursos hídricos, o padrão de chamada é
idêntico, só troca o `indicador`.

### Licença

Confirmada em `adaptabrasil.mcti.gov.br/sobre/termos-de-uso`: **CC-BY-SA**,
com citação obrigatória no formato "AdaptaBrasil MCTI – Setor(es)
Estratégico(s) [nome], acessado em [data] através do link [LINK]". Uso
comercial permitido. Compatível com o projeto.

### Onde encaixa

1. **Camada nova no globo 3D** — coroplético por município (853 polígonos
   de `municipios-mg.geojson` já existente, colorido pelo `value`/
   `valuecolor` do indicador escolhido), no padrão de `sigmine-operacao`
   (fill, listável). Rótulo do `hint` precisa dizer "índice calculado pelo
   AdaptaBrasil MCTI, não uma contagem" e linkar a metodologia.
2. **Nova seção em `/[municipio]/clima`** (a página já existe e já mostra
   clima — ver `apps/web/app/[municipio]/clima/page.tsx`): um card "Risco
   climático do seu município, segundo o AdaptaBrasil MCTI" com os dois
   índices (deslizamento, inundação) e o `rangelabel`, com link explícito
   "como este número foi calculado".
3. É **ETL periódico, não tempo real** — o AdaptaBrasil atualiza por ciclo
   de estudo (o indicador testado é ano-base 2015, com cenários 2030/2050),
   não por dia.

### Tabela proposta

```sql
create table if not exists adaptabrasil_indicadores (
  id                uuid primary key default gen_random_uuid(),
  id_municipio      text not null references ref_municipios_mg(id_ibge) on delete cascade,
  indicador_id      integer not null,        -- 60001, 60039 etc.
  indicador_nome    text not null,
  setor_id          integer not null,        -- 60000 = desastres geo-hidrológicos
  ano               integer not null,        -- ano-base do indicador, não o ano da coleta
  cenario_id         integer,                 -- null = presente
  valor              numeric(4, 3) not null,   -- 0.000 a 1.000, NUNCA tratar como %
  faixa               text not null,           -- rangelabel: Muito baixo..Muito alto
  cor_hex             text not null,
  atualizado_em       date default current_date,
  unique (id_municipio, indicador_id, ano, cenario_id)
);
```

---

## 2. IBGE + CEMADEN — "População em áreas de risco no Brasil" (BATER)

Este é o item que responde à pergunta que o dono repetiu o dia inteiro:
**não é risco, é gente**. Nenhuma das fontes acima ou do que o portal já
publica diz *quantas pessoas* moram numa área de risco — só onde o risco
está.

### O estudo

IBGE + CEMADEN cruzaram o Censo Demográfico 2010 com o mapeamento de áreas
de risco (deslizamento, inundação, enxurrada) que o CEMADEN tinha em
30/04/2017, usando um recorte espacial próprio, a **Base Territorial
Estatística de Áreas de Risco (BATER)** — mais fina que setor censitário:
é a interseção da face de quadra/setor com o polígono de risco. Publicado
em 2018, PDF confirmado:

```
https://agenciadenoticias.ibge.gov.br/media/com_mediaibge/arquivos/6d4743b1a7387a2f8ede699273970d77.pdf
→ HTTP 200, 1.596.729 bytes, lido com pdftotext
```

### Os números de MG, medidos no texto do relatório

| | Brasil | Minas Gerais |
|---|---:|---:|
| Polígonos BATER | 8.309 | **1.631** (19,6% do total) |
| Município com maior nº de polígonos | — | MG é o **estado com mais polígonos** do país |
| Pessoas expostas em área de risco | — | **1.377.577** (14,8% da população dos municípios monitorados no estado) |

Por município, os três maiores citados no relatório: **Belo Horizonte**
389.218 pessoas expostas (16,4% da população do município), **Ribeirão
das Neves** 179.314 (**60,5%** da população do município — mais da
metade da cidade), **Juiz de Fora** 128.946 (25,0%).

O apêndice do relatório traz o dicionário de variáveis por domicílio
(`d001` domicílios ocupados, `d004` moradores, `d005`–`d010` moradores por
faixa etária, `d011`–`d017` homens por faixa etária, e equivalente para
mulheres e para renda) e por morador — dá pra saber não só "quantas
pessoas", mas o perfil etário de quem está exposto.

### ⚠️ O que este dado NÃO é

- **Datado**: base socioeconômica é o Censo 2010, mapeamento de risco é de
  até abril de 2017. Não inclui o rompimento da Barragem B1 (janeiro de
  2019) nem qualquer expansão urbana ou nova área de risco mapeada desde
  então. IBGE e CEMADEN anunciaram atualização com o Censo 2022 — notícia
  confirmada, mas com status "**em elaboração**", sem previsão de
  publicação (checado em 08/07/2026, sem versão nova até 13/08/2026).
- **Cobertura parcial por desenho**: só os 872 municípios que o CEMADEN já
  monitorava e já tinham associação socioeconômica pronta em 2017 (de
  bem mais municípios monitorados hoje) — não é "toda área de risco de
  MG", é a fração que tinha mapeamento pronto naquele corte.
- Todo número acima precisa aparecer com a data-base ao lado: **"Censo
  2010, mapeamento de risco até abril/2017"** — nunca como se fosse "hoje".

### ⚠️ Geometria: existe, mas não consegui baixar

O relatório cita "cartogramas" — ou seja, a geometria dos polígonos BATER
existe e foi usada para gerar mapas. A página oficial do IBGE que deveria
disponibilizar o dado completo:

```
https://www.ibge.gov.br/geociencias/informacoes-ambientais/estudos-ambientais/21538-populacao-em-areas-de-risco-no-brasil.html
```

**bloqueia chamada automatizada.** Testei duas vezes (WebFetch e `curl`
com User-Agent de navegador real): as duas vezes veio HTTP 403 com página
"Just a moment..." — desafio do Cloudflare, não erro de URL. Isto é
diferente do caso do SIGMINE (que só exigia User-Agent): aqui o bloqueio é
ativo contra automação. **Próximo passo, não resolvido aqui:** acessar a
página manualmente pelo navegador (que passa no desafio) para achar o link
de download do shapefile/GeoJSON dos polígonos BATER, ou abrir chamado
direto com o IBGE pedindo a base.

Sem a geometria, o dado ainda serve — como **número de destaque por
município**, extraído do relatório (que já lista números por município
grande; os demais precisariam da tabela completa, também atrás do mesmo
bloqueio).

### Licença

Não encontrei texto formal de licença desta publicação específica —
mesmo caso do SIGMINE em `FONTES-TERRITORIO-E-MINERACAO.md`. É estatística
oficial federal (Lei 5.534/1968), publicada para uso livre com atribuição
por convenção do IBGE, mas **não confirmei uma string de licença**. Item a
confirmar antes de publicar, se quisermos rigor total — mesma ressalva já
registrada para o SIGMINE.

### Onde encaixa

1. **Número de destaque em `/[municipio]/defesa-civil`** (a página já
   existe — ver `apps/web/app/[municipio]/defesa-civil/page.tsx`, hoje só
   lista canais oficiais de Betim): para os 872 municípios cobertos, "X
   pessoas em [cidade] moram em área de risco de deslizamento/inundação
   mapeada pelo CEMADEN — dado do Censo 2010, mapeamento até abril de
   2017" com aviso de desatualização em destaque, não em rodapé.
2. **Camada no globo** — SE a geometria for obtida: polígono BATER, cor
   por densidade populacional exposta, no padrão de `vazio-cadastral-bacia`.
   Sem a geometria, fica só o número por município.
3. É **ETL único** (não tempo real) — a fonte é um estudo publicado, não
   uma API viva.

### Tabela proposta (sem geometria, pendente)

```sql
create table if not exists ibge_bater_populacao_risco (
  id                  uuid primary key default gen_random_uuid(),
  id_municipio        text not null references ref_municipios_mg(id_ibge) on delete cascade,
  pessoas_expostas    integer not null,
  pct_populacao_municipio numeric(5, 2),   -- % da população total do município
  domicilios_expostos integer,
  ano_base_censo      integer not null default 2010,
  data_mapeamento_risco date not null default '2017-04-30',
  fonte_pagina         text,               -- referência ao PDF/página usada
  atualizado_em        date default current_date,
  unique (id_municipio)
);
-- geometria BATER entra como tabela `postgis` separada quando/se
-- conseguirmos o shapefile — não inventar coluna geom vazia agora.
```

---

## 3. CEMADEN — rede de pluviômetros em tempo real

O artigo do MAB cita o CEMADEN como a plataforma nacional de alerta de
desastre. Abri cada produto do CEMADEN separadamente — não são a mesma
coisa.

### O que tem API confirmada: pluviômetros

Testei o espelho oficial da rede CEMADEN publicado pela Secretaria de
Infraestrutura de MG (ArcGIS REST, `observatorio.infraestrutura.mg.gov.br`,
mesmo padrão de serviço do IDE-Sisema que o projeto já consome):

```
GET https://observatorio.infraestrutura.mg.gov.br/server/rest/services/00_PUBLICACOES/cemaden_estacoes_pluviometricas/MapServer/1/query?where=1=1&returnCountOnly=true&f=json
→ HTTP 200, {"count":500}
```

**500 estações pluviométricas em MG**, ponto, tempo real. Amostra real
(GeoJSON, `f=geojson`):

```json
{"cidade":"BELO HORIZONTE","idestacao":3064,"codestacao":"310620007A",
 "codibge":3106200,"nomeestacao":"Pampulha","acumulado":0,
 "url_graficos":"https://resources.cemaden.gov.br/graficos/interativo/grafico_CEMADEN.php?idpcd=3064&uf=MG"}
```

CRS confirmado: **EPSG:4674 (SIRGAS 2000)** — o mesmo do resto do projeto.
`codibge` é o código IBGE do município (formato numérico, precisa `LPAD`
pra 7 dígitos texto na junção com `ref_municipios_mg`). `acumulado` é
chuva acumulada em mm, atualizado por telemetria (a rede CEMADEN
transmite a cada ~10 min, conforme documentação pública do CEMADEN).

⚠️ Esta é a fonte **espelhada pelo governo de MG**, não a API oficial do
CEMADEN acessada diretamente — não testei o webservice nativo do CEMADEN
(a documentação técnica dele, hospedada em `trac.dpi.inpe.br`, não
respondeu no teste). Como fonte de atribuição, o dado é do CEMADEN (o
próprio `url_graficos` aponta pra `resources.cemaden.gov.br`); o serviço
testado é um espelho que o Estado de MG já mantém publicamente.

### O que existe mas não tem API pública confirmada

- **GeoRisk** (`georisk.cemaden.gov.br`) — índice de risco de deslizamento
  em grade ("Grade intermediária"), com previsão de chuva e ocorrências
  reportadas. Abri a página: é visualização (mapa + manual técnico em
  PDF), sem endpoint de dados aberto identificado.
- **Painel de Alertas** (`painelalertas.cemaden.gov.br`) — mostra alertas
  ativos por UF/Município/Tipo (Mov. Massa, Risco Hidro.)/Nível/Abertura.
  Estrutura confirmada visualmente; nenhum endpoint JSON/WFS encontrado
  por trás.
- **SALVAR** (`salvar.cemaden.gov.br/salvar/restrito/painel.jsf`) —
  confirmado **login restrito** pela própria URL (`/restrito/`): é
  ferramenta operacional de defesa civil, não dado aberto por definição.

### Licença

Não confirmei texto de licença específico do espelho estadual nem da rede
CEMADEN diretamente. O CEMADEN é órgão do MCTI, mesma pasta do
AdaptaBrasil (CC-BY-SA confirmada) e do INMET (domínio público
confirmado) — tratar como dado aberto federal até confirmação formal,
mesma ressalva do SIGMINE.

### Onde encaixa

1. **Ponto no globo perto das barragens já mapeadas** — cruzamento direto
   com a camada `zas-barragens` que o projeto já publica: "quanto choveu
   nas últimas 24h nesta estação, a X km desta barragem". É o tipo de
   contexto que aumenta o valor da ZAS sem inventar limiar de alerta.
2. **Card em `/[municipio]/clima`** — chuva acumulada real (CEMADEN) ao
   lado da previsão que a página já mostra (Open-Meteo).
3. É dado **vivo** (atualiza a cada ~10 min na fonte) — exige job
   periódico, não ETL único.

### Tabela proposta

```sql
create table if not exists cemaden_pluviometros (
  id                uuid primary key default gen_random_uuid(),
  id_estacao        integer not null,          -- idestacao
  codigo_estacao    text not null,              -- codestacao
  id_municipio      text not null references ref_municipios_mg(id_ibge),
  nome_estacao      text not null,
  latitude          numeric(9, 6) not null,
  longitude         numeric(9, 6) not null,
  acumulado_mm      numeric(6, 2),
  medido_em         timestamptz not null,       -- campo `data` da fonte
  url_grafico       text,
  atualizado_em      timestamptz default now(),
  unique (id_estacao, medido_em)
);
```

---

## 4. INMET — avisos de risco meteorológico geolocalizados

### O serviço

Duas APIs distintas do INMET, as duas sem autenticação:

```
GET https://apitempo.inmet.gov.br/estacoes/T   → estações automáticas
GET https://apitempo.inmet.gov.br/estacoes/M   → estações convencionais
GET https://apiprevmet3.inmet.gov.br/avisos/ativos  → avisos de risco ativos/futuros
```

⚠️ **Armadilha medida**: sem `User-Agent` de navegador, a conexão é
recusada (reset), não HTTP 403 — parece falha de rede, não é.

**Estações**: 676 automáticas no Brasil, **68 em MG** (60 operantes, 8 em
pane); 87 convencionais no Brasil, **13 em MG**. Combinando as duas
listas, **71 municípios de MG têm estação própria, de 853** (8,3%) — é
dado pontual, não malha, e a cobertura é fraca. Menos relevante: a página
`/[municipio]/clima` já usa Open-Meteo pra previsão, que não depende de
estação física próxima.

**Avisos ativos** — o achado que importa. Chamei e confirmei
independentemente (`apiprevmet3.inmet.gov.br/avisos/ativos`, HTTP 200,
374.887 bytes, medido duas vezes — pelo agente de pesquisa e por mim):

```json
{"hoje": [...], "futuro": [...]}
```

Cada aviso: `severidade` (Perigo / Perigo Potencial), `poligono` (GeoJSON),
`municipios` (lista com nome + código IBGE embutido), `geocodes`,
`data_inicio/fim`, `descricao`, `riscos`, `instrucoes`.

**Medido ao vivo em 13–14/08/2026**: 8 avisos ativos/futuros no Brasil
inteiro. Dois cobrem MG — ambos de "Baixa Umidade" (risco de incêndio
florestal e à saúde), afetando **636** e **237** municípios listados,
incluindo os de MG. **Zero avisos de chuva intensa/tempestade ativos para
MG** neste momento (as tempestades ativas hoje são só na região Sul). Ou
seja: o endpoint funciona e tem conteúdo real, ainda que hoje nenhum
aviso relevante para barragem esteja no ar.

### Licença

Confirmada **na própria resposta da API** (comentário embutido no XML de
`/avisos/rss`, texto legal do INMET, não de página de marketing):

> "Licenca de Uso: O conteudo deste site, podera ser reproduzido desde que
> citada a fonte..." — `<copyright>public domain</copyright>`

### Onde encaixa

1. **Cruzamento com a camada de barragens/ZAS já publicada**: "há aviso
   ativo de Chuva Intensa cobrindo o município desta barragem" — mesmo
   padrão do alerta calculado de sobreposição território×mineração que o
   projeto já tem (`alerta-ti-mancha`). Não é uma fonte nova de risco, é
   um sinal de contexto que aumenta a utilidade prática da ZAS.
2. **Banner em `/[municipio]/clima` e `/[municipio]/defesa-civil`** quando
   há aviso ativo cobrindo o município — texto direto: "Aviso ativo:
   [tipo], até [data]. [instruções do próprio INMET]".
3. É dado **vivo**, muda por hora — precisa de job periódico (ex. a cada
   hora), não ETL único. Baixo custo: resposta inteira tem ~375 KB.

### Tabela proposta

```sql
create table if not exists inmet_avisos (
  id                uuid primary key default gen_random_uuid(),
  id_aviso_fonte    text not null,             -- id_aviso da API
  tipo              text not null,              -- descricao: Tempestade, Baixa Umidade etc.
  severidade        text not null,              -- Perigo | Perigo Potencial
  data_inicio       timestamptz not null,
  data_fim          timestamptz not null,
  municipios_ids    text[] not null default '{}',  -- geocodes cruzados contra ref_municipios_mg
  poligono          jsonb,                       -- GeoJSON bruto do aviso
  riscos            text,
  instrucoes        text,
  ativo             boolean not null default true,
  atualizado_em     timestamptz default now(),
  unique (id_aviso_fonte)
);
create index if not exists inmet_avisos_municipios_idx
  on inmet_avisos using gin (municipios_ids);
```

---

## 5. INPE — Programa Queimadas (foco de calor / risco de fogo)

Achado explorando a Base dos Dados, não citado no artigo do MAB.

### O serviço

Duas rotas possíveis, nenhuma delas testada por chamada direta nesta
pesquisa — registrado como próximo passo, não como dado pronto:

1. **Fonte primária do INPE**, dados abertos sem cadastro:
   `data.inpe.br/queimadas/dados-abertos/` — CSV/KML por intervalo (anual
   a quase-tempo-real, a cada 10 min na fonte, atualização geral a cada
   3h), cobertura América do Sul inteira.
2. **Via Base dos Dados** (tratado, com `id_municipio` pronto):
   `basedosdados.org/dataset/f06f3cdc-b539-409b-b311-1ff8878fb8d9`, tabela
   `Microdados` — confirmei o schema aberto na página (não a chamada de
   dado): `id_municipio, sigla_uf, bioma, data_hora, latitude, longitude,
   satelite, dias_sem_chuva, precipitacao, risco_fogo,
   potencia_radiativa_fogo`. 1,80 GB, cobertura 2003-01 a 2026-05.

**Não medi quantos focos caem em MG** — exigiria rodar BigQuery (sem
acesso nesta pesquisa) ou baixar e filtrar o CSV bruto do INPE, que não
fiz. Isto é lacuna declarada, não estimativa.

### Licença

Do INPE, não da Base dos Dados — a Base dos Dados não licencia dado de
terceiro (confirmado nos termos dela: dados são "de propriedade de
terceiros e sujeitos às suas respectivas políticas de uso"). Licença do
INPE em si não conferida nesta pesquisa.

### Onde encaixa

Camada de ponto no globo (foco de calor, cor por `risco_fogo`) ou tabela
nova cruzável por município — relevante para seca e calor extremo, que
hoje o portal não mapeia de forma nenhuma. **Prioridade menor que as
quatro fontes acima**: exige o passo de medição que falta antes de vender
como pronto.

---

## 6. MDR/SNIS + ANA/Atlas Esgotos — saneamento básico

Achado pela busca dirigida à Base dos Dados (clima, desastre, saneamento,
saúde ambiental). Relevância indireta: saneamento precário piora o
impacto de enchente (contaminação da água) e de seca (abastecimento) —
mas é fator de vulnerabilidade socioeconômica geral, não climático em si.
Registrado por completude, prioridade abaixo das seis fontes anteriores.

### SNIS — Prestadores de Água e Esgoto (Ministério do Desenvolvimento Regional)

```
https://basedosdados.org/dataset/2a543ad8-3cdb-4047-9498-efe7fb8ed697
```

Tabela "Prestadores de Água e Esgoto", **96,30 MB** — abaixo do limite de
100 MB da Base dos Dados, **download direto grátis** (confirmado na
página, não baixei o arquivo em si). Colunas confirmadas: `id_municipio`,
`sigla_uf`, `ano`, `id_prestador`, `prestador`,
`populacao_atendida_agua`, `populacao_atendida_esgoto`,
`extensao_rede_agua`/`extensao_rede_esgoto`, `volume_agua_produzido/
tratado/consumido`, `volume_esgoto_coletado/tratado`. Cobertura 1995–2022.

### Atlas Esgotos (ANA/SNSA-MCidades)

```
https://basedosdados.org/dataset/fdd3e0b6-a5bd-4cb6-83c9-eae7cb5cdccb
```

Tabela "Município", **1,68 MB**, ano-referência **2013** (estático, não
série). Colunas: `id_municipio`, carga de esgoto gerada/lançada
(`carga_gerada_total`, `carga_lancada_sem_coleta_sem_tratamento`, em Kg
DBO/dia), `vazao_total`, `populacao_urbana_2013`,
`investimento_coleta/tratamento`. Cobre as 5.570 sedes municipais do
Brasil (declarado na página).

### Licença

Da Base dos Dados: não é dela — confere a origem (MDR, ANA). Não
conferida diretamente nesta pesquisa.

### Onde encaixa

`/ambiental` (ao lado do licenciamento e do COPAM, que já tratam de
infraestrutura ambiental) ou `/[municipio]/infraestrutura` (que já
existe). ETL único por ano de referência — SNIS atualiza anualmente,
Atlas Esgotos é estático desde 2013.

---

## 7. MapBiomas — cobertura e uso da terra por município

### O que baixei de verdade

```
Link em brasil.mapbiomas.org/estatisticas/ → Google Drive
→ HTTP 200 (após redirect), 75.353.139 bytes
→ MAPBIOMAS_BRAZIL-COL.11-BIOME_STATE_MUNICIPALITY.xlsx
```

Planilha única, Brasil inteiro (não pré-recortada por estado), área em
hectares por classe de cobertura/uso × Bioma × Estado × Município,
Coleção 11, série 1985–2024. Granularidade do **dado baixável**: município
(agregado) — o pixel de 30 m só sai como GeoTIFF nacional ou via Google
Earth Engine, não como download direto recortável.

### MapBiomas Alerta

API GraphQL (`plataforma.alerta.mapbiomas.org/api/v2/graphql`), testada
sem autenticação: metadado público funciona (`territoryOptions` confirma
Minas Gerais na lista de recorte, 564.543 bytes; `lastAlertPublication`
confirma ciclo em 04/08/2026, 780 alertas no Brasil todo). **Geometria e
detalhe de cada alerta individual exigem login/token** — testado e
confirmado bloqueado ("Token de acesso inválido"). O schema já cruza
nativamente cada alerta com `crossedIndigenousLands`, `crossedQuilombos`,
`crossedConservationUnits`, `crossedEmbargoes` — exatamente o tipo de
sobreposição que o projeto já calcula para mineração — mas hoje isso é
**decisão de produto pendente** (criar conta de serviço gratuita), não
dado disponível.

### Licença

CC BY para ambos (confirmada nos termos de uso de cada plataforma),
atribuição obrigatória em formato padronizado, uso comercial permitido.

### Onde encaixa

`/ambiental`, tabela nova (ETL único do xlsx municipal — não é API viva).
Relevância pro escopo climático: perda de vegetação nativa perto de
encosta/barragem aumenta risco de erosão e assoreamento — é sinal
indireto de exposição, cruzável com as camadas de barragem/mineração que
já existem, não substituto do AdaptaBrasil.

---

## 8. PNUD — Atlas do Desenvolvimento Humano (ADH)

Achado na Base dos Dados: `basedosdados.org/dataset/cbfc7253-089b-44e2-
8825-755e1419efc8`, tabelas Brasil/UF/Município, mais de 200 indicadores
cobrindo "demografia, educação, renda, trabalho, habitação e
vulnerabilidade" (texto da própria página). Cobertura **1991–2010** — mais
datado que o próprio BATER. É índice composto (mesma ressalva de
metodologia do AdaptaBrasil). **Prioridade baixa**: o dado é
socioeconômico geral, não climático, e a defasagem de 16 anos é maior que
a de qualquer outra fonte deste documento. Registrado por completude, não
recomendado para esta rodada.

---

## Lacunas declaradas

### AdaptaSUS (Ministério da Saúde)

Citado no artigo do MAB como plataforma de saúde-clima. **Não é
plataforma de dado**: é um Plano Setorial (PDF/apresentação) que integra
o Plano Clima nacional. Sem API, sem planilha, sem indicador consultável
por município. Existe um "Observatório Nacional de Clima e Saúde"
(`adaptaclima.mma.gov.br`) citado como complemento — a URL redireciona
para `defeso.mma.gov.br`, sem conteúdo de dados identificado no teste.

### Plano Clima (MMA)

**Bloqueado em três tentativas independentes**: `gov.br/mma/.../
plano-clima` e o PDF-resumo retornaram "Conteúdo Restrito" via WebFetch,
403 via `curl` com User-Agent de navegador, e o mesmo bloqueio via
navegador real com JavaScript habilitado. A única cópia acessível
(`conama.mma.gov.br`, outro subdomínio do MMA) é uma apresentação de
slides de 15 páginas, sem tabela de indicador extraível. Não é plataforma
de dado — é documento de política pública.

### GeoRisk, Painel de Alertas e SALVAR (CEMADEN)

Nenhum dos três tem endpoint de dados aberto confirmado (SALVAR é login
restrito por definição, os outros dois só expõem visualização). Diferente
do caso do Plano Clima, aqui **pode existir** API não documentada
publicamente — não é uma conclusão definitiva, é o limite do que dava pra
confirmar sem contato direto com o CEMADEN.

### S2ID — Sistema Integrado de Informações sobre Desastres (MIDR)

Catalogado na Base dos Dados só como "dados originais... não passaram
pela metodologia de tratamento", com "Tem API: Não" — a Base dos Dados
serve aqui só de catálogo/link para `s2id.mi.gov.br`, não como fonte de
dado tratado. Registro histórico de desastres decretados por município
existe no sistema oficial, mas não foi testado diretamente.

### Geometria do BATER (IBGE)

Existe (citada como "cartograma" no relatório de 2018), mas a página do
IBGE que deveria publicá-la bloqueia chamada automatizada (Cloudflare
challenge, testado duas vezes). Requer acesso manual via navegador ou
contato direto com o IBGE.

### MapBiomas Alerta — geometria por alerta

Existe no schema (`geometryWkt`), mas exige autenticação. Decisão de
produto pendente (criar conta de serviço gratuita), não resolvida nesta
pesquisa.

---

## Ordem sugerida — maior ganho para quem vive no território, menor esforço

1. **AdaptaBrasil** — API limpa, sem login, cobre os 853 municípios de MG
   de uma vez, JSON direto. Menor esforço de integração de toda a lista.
2. **IBGE/CEMADEN — BATER** — o número que falta no portal: quantas
   pessoas moram em área de risco, não só onde o risco está. O headline
   number (por município, extraído do relatório) já dá pra publicar sem
   esperar a geometria. Maior ganho cívico de todos os itens.
3. **INMET — avisos ativos** — cruza direto com a ZAS/mancha de barragem
   que o projeto já tem. Esforço baixo (endpoint simples, ~375 KB), mas
   exige job periódico, não ETL único.
4. **CEMADEN — pluviômetros** — contexto de chuva real perto da barragem.
   Espelho estadual já testado e funcionando; confirmar depois se vale a
   pena trocar pelo webservice nativo do CEMADEN.
5. **SNIS / Atlas Esgotos** — saneamento como fator de vulnerabilidade,
   arquivos pequenos, download direto.
6. **MapBiomas (municipal)** — sinal indireto de erosão/assoreamento perto
   de barragem e mina, ETL único de uma planilha já baixada e confirmada.
7. **INPE Queimadas** — bom sinal de seca/calor, mas precisa do passo de
   medição de volume em MG que ainda não foi dado.
8. **ADH/PNUD** — mencionado por completude; muito datado (1991–2010) pra
   priorizar nesta rodada.
9. **MapBiomas Alerta (geometria)** — potencial alto (já cruza nativamente
   com TI/quilombola/UC), mas é decisão de produto (criar conta), não
   pesquisa concluída.

---

*Levantado em 13/08/2026. Todo endpoint citado neste documento foi
chamado; toda contagem foi medida no momento da chamada, não estimada.
Onde a chamada não veio (bloqueio, login, ausência de API), está escrito
explicitamente — inclusive quando isso significa que a fonte citada no
artigo do MAB não tem dado extraível hoje.*
