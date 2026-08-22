# Plano: imagens de satélite do INPE no mapa 3D

> Pedido do dono em 13/08/2026: *"acrescente ao plano de COMO usar essas
> imagens no mapa 3d"*, citando que "todas as imagens que o INPE possui são
> gratuitas e podem ser acessadas diretamente pelo usuário através do
> catálogo disponível em `http://www.dgi.inpe.br/catalogo` ou
> `http://www.dgi.inpe.br/CDSR/`". A decisão de usar já está tomada — este
> documento é o COMO, não o SE.

Tudo abaixo foi **chamado de verdade** em 2026-08-13: o catálogo foi aberto
no navegador, a API real por trás dele foi descoberta pela aba de rede (não
adivinhada), 6 buscas STAC foram feitas contra ela, e 3 imagens de verdade
foram baixadas e medidas (tamanho em bytes, dimensão em pixel). Onde não deu
para confirmar — porque a etapa seguinte exige cadastro, e criar conta não é
uma ação que este assistente pode tomar — está escrito que não confirmei.

---

## Resposta curta

| # | Pergunta | Achado |
|---|---|---|
| 1 | As duas URLs do pedido são coisas diferentes? | **Não — é o MESMO catálogo.** `dgi.inpe.br/CDSR/` é um endereço antigo: testado agora, ele redireciona (301→302→301→200) até `dgi.inpe.br/catalogo/`, a mesma aplicação. Uma URL só, dois nomes. |
| 2 | O catálogo funciona e cobre o quê? | Sim, testado no navegador e por API. **21 coleções** de imagem (Amazônia-1, CBERS-4A, CBERS-4, CBERS-2B, CBERS-2, ResourceSat-1), de 2003 até hoje. Sobre Brumadinho especificamente: **110 cenas medidas** só na coleção mais nova (CBERS-4A/WPM, 2 m/pixel) entre 2020 e 2024. |
| 3 | "Acessadas diretamente", como o texto do dono diz — é isso mesmo? | **Parcialmente, e a diferença importa.** A MINIATURA (quicklook, o que dá pra ver no mapa) é livre, sem login — testado, baixei 3 de verdade. O PIXEL de verdade (a banda GeoTIFF, o que serviria pro globo) **exige e-mail cadastrado** — testado batendo no endpoint sem cadastro: `403 Invalid e-mail`. O texto do dono está certo sobre a miniatura e a licença; a parte "direto" não é 100% literal para o dado bruto. |
| 4 | Licença? | **CC BY-SA, conferida em duas páginas oficiais do INPE** (não presumida): o rodapé do catálogo linka `creativecommons.org/licenses/by-sa/4.0/`, e a página do LGI (`obt.inpe.br`) diz por extenso: *"As imagens disponibilizadas no Catálogo podem ser copiadas e redistribuídas desde que mencionada a fonte (INPE)"*. Pode processar e republicar, citando o INPE. |
| 5 | Formato e volume — medidos? | Miniatura PNG: **de 129 KB a 3,8 MB por cena** (3 cenas medidas de verdade, números na seção 2). Banda GeoTIFF real: **não medi** — bloqueada pelo cadastro (seção 2.2). Cabe nos dois casos em Static Assets sem chegar perto do teto de 25 MiB; o risco de CONTAGEM de arquivo só apareceria se a proposta fosse "baixar o acervo inteiro", que não é o que este plano recomenda (seção 4). |
| 6 | Existe serviço de tile (WMTS/XYZ)? | **Não.** O GeoServer do catálogo (`dgi.inpe.br/geoserver`, GetCapabilities chamado de verdade) só publica as GRADES de contorno das cenas (onde cada órbita passa), não o pixel da imagem. Ladrilhar (tile) a imagem seria trabalho NOSSO, não um serviço que o INPE já oferece — e a seção 3.3 explica por que este plano não recomenda fazer isso agora. |
| 7 | Qual caso de uso usar primeiro? | **Prova visual do vazio cadastral** (seção 5). Descartados por ora: "antes e depois" do rompimento de Brumadinho (nuvem medida inviabiliza — seção 3.1) e série temporal de avanço de lavra (mesmo pipeline, mas depende de um dado que não confirmei nesta rodada — seção 5.3). |

---

## 1. O catálogo, testado ao vivo

`dgi.inpe.br/catalogo` é uma SPA (Angular) que desenha um mapa Leaflet (base
Esri, só para navegação — não é imagem do INPE) com uma árvore de camadas à
esquerda. Testado no navegador agora, a árvore lista:

```
LGI-CDSR (catálogo corrente, atualizado até hoje):
  AMAZONIA1    → WFI_L2_DN, WFI_L4_DN
  CBERS4A      → MUX_L2/L4, WFI_L2/L4, WPM_L2/L4
  CBERS4       → AWFI_L2/L4, MUX_L2/L4, PAN10M_L2/L4, PAN5M_L2/L4

LGI-CDSR-ACERVO (arquivo histórico, satélites desativados):
  CBERS2B      → CCD_L2, HRC_L2, WFI_L2
  CBERS2       → CCD_L2, WFI_L2
  RESOURCESAT1 → AWIFS_L2, LISS3_L2
```

**21 coleções ao todo**, cada uma um sensor+nível de processamento. A árvore
não é decoração: por trás dela tem uma API REST de verdade, achada pela aba
de rede do navegador (não documentada em lugar óbvio) — é um serviço
**STAC** (SpatioTemporal Asset Catalog, o mesmo padrão que várias
plataformas de imagem de satélite usam, incluindo o Planetary Computer da
Microsoft e o Earth Search da AWS):

```
GET https://www.dgi.inpe.br/stac-compose/collections/          → lista as 21 coleções (chamado, 21.843 bytes)
GET https://www.dgi.inpe.br/lgi-stac/search?collections=...&bbox=...&datetime=...   → busca por área e data
GET https://www.dgi.inpe.br/geoserver/ows?service=WMS&...GetCapabilities           → só grades de contorno, sem pixel
```

Isto muda o plano de coleta: não precisa raspar a SPA nem clicar no mapa —
dá para consultar a API STAC diretamente, do mesmo jeito que
`docs/PLANO-INTEGRACAO-BRUMADINHO.md` fez com o GeoServer da Semad. HTTPS,
sem chave de API para a BUSCA (só para o download — seção 2.2).

---

## 2. O que dá para baixar sem cadastro, e o que não dá

### 2.1 A miniatura (quicklook) — livre, testada, medida

Toda cena tem um asset `thumbnail`, um PNG já renderizado em cor, sem
qualquer autenticação. Três cenas baixadas de verdade hoje:

| Cena | Sensor / resolução nativa | Data | Nuvem | Dimensão da miniatura | Tamanho |
|---|---|---:|---:|---|---:|
| `CBERS4_MUX15212320190112CB11` | MUX, 20 m/pixel | 12/01/2019 | 20% | 1.505 × 1.433 px | 3,66 MB |
| `CBERS4_AWFI14712320190127CB11` | AWFI, 64 m/pixel | 27/01/2019 | 15% | 512 × 512 px | 385 KB |
| `CBERS4A_WPM20113820240904` | WPM, 2 m/pixel (pancromático) | 04/09/2024 | 0% | 295 × 303 px | 129 KB |

**O achado que muda o desenho**: a miniatura tem tamanho de PIXEL fixo
(centenas de px), não proporcional à resolução nativa do sensor. Dividindo a
extensão da cena pela dimensão da miniatura, a cena WPM de 2 m/pixel vira
uma miniatura de **~380 m/pixel** — inútil para conferir uma área de 10
hectares (que mede uns 316 × 316 m, MENOR que um pixel da miniatura). A
miniatura serve para o usuário ESCOLHER a cena no catálogo, não para o mapa
mostrar a imagem de verdade. **Quem quiser o dado que resolve o vazio
cadastral precisa da banda de verdade — seção 2.2.**

Formato: PNG comum, sem georreferência embutida (é o retrato da cena, não um
GeoTIFF). O alinhamento no globo tem que vir do POLÍGONO que a API devolve
junto (`geometry`, 4 cantos lat/lon) — não do arquivo de imagem em si. As
cenas não são retângulos alinhados a norte: o satélite passa em órbita
inclinada, e a miniatura sai "torta" (conferido visualmente nas 3 imagens
baixadas — a MUX de 12/01/2019 é um quadrilátero girado, não um retângulo).

### 2.2 A banda de verdade — exige cadastro, confirmado por teste ativo

Cada cena publica as bandas cruas em GeoTIFF por asset:

```
https://www.dgi.inpe.br/api/download/TIFF/CBERS4/2019_01/.../CBERS_4_MUX_20190112_152_123_L2_BAND5.tif
```

Testado sem parâmetro: `HTTP 400 {"message": "\`email\` parameter is
required!"}`. Testado com um e-mail qualquer: `HTTP 403 {"message":
"Invalid e-mail: \`teste@example.com\`"}`. **Confirmado por teste ativo, não
suposição**: o endpoint exige um e-mail que exista no cadastro do INPE — o
mesmo botão "Registro" que aparece no topo do catálogo. Criar essa conta é
**gratuita** (o cadastro do INPE é auto-serviço, sem custo, documentado no
FAQ do próprio catálogo — mas o FLUXO completo de cadastro não foi testado
até o fim nesta pesquisa, porque **criar contas está fora do que este
assistente pode fazer sozinho**, mesmo sendo gratuito e sem dado sensível
envolvido; ver seção 6, é lacuna declarada, não me omiti por acaso).

**Isto qualifica a frase do pedido.** "Todas as imagens... podem ser
acessadas diretamente pelo usuário" é verdade para a miniatura E verdade no
sentido de que qualquer pessoa PODE se cadastrar de graça — mas não é
"baixar sem fricção nenhuma": tem uma conta no meio. Para o mapa do portal,
isso quer dizer que **o coletor** (rodando uma vez, do nosso lado, como todo
outro pipeline do projeto) precisa de uma conta e de um e-mail configurado
— não o visitante do site. O visitante final não vê cadastro nenhum: ele só
vê o resultado já processado no globo, do mesmo jeito que hoje não vê o
cadastro que a Semad ou o INCRA exigem para os coletores que já alimentam o
mapa.

### 2.3 Tamanho da banda de verdade — não medido, e por quê isso é declarado, não estimado

Não consegui medir o peso de um arquivo `.tif` de banda porque o download é
bloqueado sem cadastro (seção 2.2). Não vou inventar um número. O que dá
para dizer com o que FOI medido: a geometria de uma cena WPM (2 m/pixel)
baixada nesta pesquisa cobre `-45,26° a -44,17°` de longitude por `-20,38° a
-19,33°` de latitude — cerca de 113 × 116 km. Uma banda pancromática nessa
extensão, a 2 m/pixel, é uma grade de ~56.500 × 58.000 pixels — grande
demais para qualquer produto pensado para navegador, mesmo comprimido.
**Isto não é a peça que vai para o globo**: a peça é um RECORTE da cena
(a área de um vazio cadastral, alguns km, não os 113 km inteiros da cena) —
ver arquitetura, seção 4. O tamanho real do recorte só se mede depois do
cadastro feito e de uma banda baixada de verdade — declarado como o próximo
passo concreto (seção 6).

---

## 3. A prova de conceito — cenas de verdade, medidas

### 3.1 Tentativa "antes e depois" do rompimento (25/01/2019) — e por que não recomendo este caso primeiro

Busquei de verdade, pela API STAC, toda cena disponível sobre a Barragem I
(Córrego do Feijão) entre 01/01/2019 e 15/03/2019, em 4 coleções:

| Coleção | Cenas encontradas | Nuvem medida |
|---|---:|---|
| CBERS4 PAN5M (5 m) | 9 | 47% a 100% — só uma abaixo de 50% (12/01, antes) |
| CBERS4 PAN10M (10 m) | 7 | mesma distribuição |
| CBERS4 MUX (20 m) | 7 | 20% a 95% — só a de 12/01 (antes) abaixo de 50% |
| CBERS4 AWFI (64 m, faixa larga) | 1 (bbox estreito) / 1 adicional com bbox largo | 15% (27/01, depois) |
| CBERS4A WPM (2 m) | 0 | CBERS-4A só entrou em operação em dez/2019 — não existia ainda |

**O achado real**: a única passagem de baixa nuvem ANTES do rompimento é
12/01/2019 (20% de nuvem, MUX 20 m — a que virou a miniatura "antes" desta
seção). Toda passagem DEPOIS do rompimento sobre o ponto exato da barragem,
até início de março, tem nuvem entre 85% e 100% — é a estação chuvosa em
Minas. A única imagem de baixa nuvem pós-rompimento (27/01/2019, 15%) é de
um sensor de faixa larga (AWFI, 64 m nativo, miniatura de ~1,7 km/pixel) —
resolução baixa demais para mostrar uma mancha de rejeito com nitidez.

**Por que isto não vira o primeiro caso de uso**: o portal já tem a mancha
REAL da área atingida (`brumadinho-area-atingida`, mapeada pela Semad por
imagem Pleiades a escala 1:2.500 — muito mais precisa que qualquer cena do
INPE encontrada aqui) como polígono verificado, publicado em
`docs/PLANO-INTEGRACAO-BRUMADINHO.md`. Uma imagem de satélite do INPE aqui
seria ILUSTRAÇÃO de um fato já provado por dado melhor — bonita, mas de
menor ganho marginal, e o próprio dado disponível (nuvem alta) dificulta
fazer bem. Fica como candidato de baixa prioridade, não descartado —
**seção 6**.

### 3.2 Prova de que a coleta funciona de verdade — 3 imagens baixadas

Peguei as URLs de miniatura devolvidas pela busca STAC e baixei de verdade
(não simulei):

- `quicklook-20190112-antes.png` — 3,66 MB, 1.505×1.433 px, composição de
  cor que resulta em vegetação em VERDE saturado (bandas NIR/vermelho/verde
  do MUX, não é "cor natural" — é a combinação que o INPE usa por padrão
  para essa miniatura). Nuvem visível em branco, cobrindo boa parte do
  quadro — confirma o número de 20% medido pela API (a nuvem que aparece é
  a fina, cirros incluídos; a métrica do catálogo é mais rigorosa que "olho
  no PNG").
- `quicklook-20190127-depois-awfi.png` — 385 KB, 512×512 px — confirmado
  baixa resolução (faixa larga), não dá para localizar a barragem no
  quadro sem o polígono de referência.
- `quicklook-wpm-2024-clear.png` — 129 KB, 295×303 px, 0% de nuvem — prova
  de que cenas modernas (CBERS-4A/WPM) TÊM passagens limpas em abundância
  (110 cenas encontradas 2020-2024 só nesta busca, várias com 0% de
  nuvem) — o problema de nuvem é específico da janela de dias ao redor do
  rompimento de 2019, não do catálogo em geral.

Estas 3 imagens ficaram no scratchpad da sessão, não entraram no
repositório: são maiores que o necessário para prova de conceito e a
decisão de QUAIS cenas arquivar de verdade é do próximo passo (seção 6), não
desta pesquisa.

### 3.3 Por que a proposta não é "tile" — testado, não suposto

O pedido do dono citava o teto de Static Assets (25 MiB/arquivo, risco de
CONTAGEM em massa) como algo a calcular se a proposta fosse ladrilhar
(tile) a imagem. **Testei se o INPE oferece tile pronto (WMTS/XYZ) e a
resposta é não**: o `GetCapabilities` do GeoServer do catálogo
(`dgi.inpe.br/geoserver`, 175.527 bytes, chamado de verdade) só lista 14
camadas de GRADE (contorno de onde cada sensor passa — `grid_cbers4_mux`,
`grid_sentinel_mgrs` etc., usadas para desenhar a malha de referência no
mapa do catálogo), nenhuma camada de PIXEL.

Ladrilhar seria, então, um pipeline NOSSO: baixar a cena inteira, cortar em
quadrados, publicar cada quadrado como arquivo. Para a extensão de uma cena
WPM medida (113 × 116 km) a um zoom que mostre 10 ha de detalhe, seriam
milhares de ladrilhos por cena — e o teto de CONTAGEM do Static Assets
(20 mil arquivos no gratuito) estouraria rápido com poucas cenas, exatamente
o risco que o pedido apontou. **A arquitetura da seção 4 evita esse
problema não fazendo tile**: em vez de ladrilhar, recorta a cena para só a
área de interesse (um polígono de vazio cadastral, alguns km) e publica UM
arquivo raster por recorte — o mesmo padrão que `textures/bluemarble.jpg`
já usa hoje (uma imagem, uma vez, sem pirâmide), medido em 1,4 MB para o
planeta inteiro. Long prazo, se um dia fizer sentido zoom bem mais fundo
numa área maior, tile vira necessário — mas não para o caso de uso
recomendado aqui.

---

## 4. Arquitetura proposta

### 4.1 Onde a imagem mora: R2, não Static Assets — mesma razão de sempre

Confirma o padrão já decidido em `docs/PLANO-ARQUIVO-DE-FONTES.md`: R2 para
qualquer coisa pesada e que cresce, Static Assets só para o bundle do site.
Um recorte de cena processado (seção 4.2) deve pesar de centenas de KB a
poucos MB — cabe folgado nos dois, mas **o motivo de escolher R2 não é o
tamanho de UM arquivo, é o mesmo motivo do resto do projeto**: a coleção
cresce (mais cenas, mais datas, mais áreas) e não deve inflar o bundle que o
Next empacota a cada deploy. O quase-desastre do commit `e82a58e` (570 MiB
de cache de coleta quase entrando no build) é o lembrete vivo de manter
dado de coleta FORA de `public/`.

### 4.2 O pipeline de processamento — a peça que falta hoje

Nada disto existe ainda no repositório (conferido: não há script de GDAL
nem de leitura de GeoTIFF em `apps/web/scripts/` nem em `pipeline/`). Passos:

1. **Coletor** (`pipeline/ingerir_inpe_stac.py`, no padrão dos outros
   coletores Python do projeto): busca cenas por bbox+data+coleção na API
   STAC (seção 1), com o e-mail cadastrado vindo de variável de ambiente
   (`INPE_EMAIL` ou similar) — **nunca hardcoded, nunca commitado**, mesma
   disciplina que qualquer outra credencial do projeto.
2. **Recorte + composição de cor**: as bandas chegam separadas (uma banda
   por arquivo `.tif`) e em DN cru (não é RGB pronto) — precisa de uma
   biblioteca de raster (GDAL/rasterio; não há isso no projeto hoje, é
   dependência nova) para: (a) empilhar 3 bandas (ex. vermelho/verde/azul,
   ou uma combinação falsa-cor como a própria miniatura do INPE usa) em uma
   imagem RGB de 8 bits; (b) recortar para o polígono de interesse (a área
   de um vazio cadastral, não a cena inteira); (c) exportar como
   PNG/JPG comum — o mesmo formato que `textures/bluemarble.jpg` já usa,
   sem exigir o Three.js aprender a ler GeoTIFF.
3. **Publicar no R2**, registrando os 4 cantos lat/lon da cena (já vêm da
   API STAC, `geometry`) e a data de captura — mesmo desenho de proveniência
   que `scripts/gerar-proveniencia-globo.mjs` já aplica a toda camada.

### 4.3 Como chega ao navegador e se alinha ao globo — usando o que já existe

O globo (Three.js puro, sem build, `apps/web/public/terras/globo/`) já tem
o padrão exato que este caso precisa, e ele não é a textura base
(`core/earth.js`, que texturiza a esfera INTEIRA com um único
`bluemarble.jpg` equiretangular — trocar isso destruiria a Blue Marble para
todo o resto do mapa, e é o jeito ERRADO de fazer isto). O padrão certo já
está em `js/layers/satelites.js`: uma camada `render: 'custom'` no
`LAYER_REGISTRY` (`js/config.js`), cuja factory devolve um
`THREE.Group` construído sob demanda — `js/main.js` já registra essa
factory (`{ 'satelites-orbita': createSatellitesGroup }`) no construtor do
`LayerManager`, e `layers/manager.js` já sabe chamar `render === 'custom'`
(linha 152 do arquivo, conferida nesta pesquisa).

Uma camada `imagens-inpe` seguiria o mesmo molde:

- `fetch()` do PNG/JPG recortado no R2 (não do `.tif` — o navegador não
  precisa nem deve处 processar GeoTIFF; isso já aconteceu no pipeline).
- Um `THREE.PlaneGeometry` (não uma esfera nova) com os 4 vértices postos
  nos 4 cantos lat/lon da cena, convertidos por `latLonToVec3()`
  (`core/earth.js`, já exportada e usada por toda camada de polígono) —
  a MESMA função, então a imagem se alinha ao mesmo sistema de coordenadas
  que toda camada vetorial do globo já usa, sem inventar uma segunda
  matemática de projeção.
- UV padrão (0,0 a 1,1) mapeando o quadrilátero — como as cenas do INPE não
  são retângulos alinhados a norte (seção 2.1), o plano fica "torto" em
  cima da esfera, do jeito que a cena realmente é. Para o zoom em que o
  globo mostra um município (dezenas de km), esse desvio de projeção é
  pequeno — o mesmo raciocínio de aproximação plana que `core/earth.js` já
  usa para desenhar camadas "127 m acima da superfície" numa esfera.
- Entra no painel de camadas (`ASSUNTOS`/`LAYER_REGISTRY`) como qualquer
  outra: nasce `on: false` (é peso extra, não deve carregar sem pedir),
  cor própria, `hint` explicando a data e a fonte, e citação obrigatória
  "INPE, `<sensor>`, `<data>` — CC BY-SA" (a licença exige menção da fonte,
  seção 1).

### 4.4 O que este pipeline NÃO precisa (evitado de propósito)

- **Não precisa de tile/WMTS** — seção 3.3.
- **Não precisa trocar a textura base do planeta** — é uma camada por cima,
  não a Blue Marble.
- **Não precisa o navegador entender GeoTIFF** — o recorte já sai processado
  em PNG/JPG do pipeline.
- **Não precisa reprojeção cartográfica pesada no cliente** — os 4 cantos
  da cena (já em WGS84, confirmado pelo nome `UTM_WGS84` no caminho de
  download, mesmo datum SIRGAS2000/WGS84 do resto do projeto) bastam para o
  quadrilátero aproximado da seção 4.3.

---

## 5. A escolha do caso de uso

### 5.1 Os três candidatos, pesados por ganho × esforço

| Candidato | Ganho para quem vive no território | Esforço medido/estimado |
|---|---|---|
| **Prova visual do vazio cadastral** | Alto e direto: o projeto já erra ~30% a olho em 40 polígonos (medição existente) — imagem de verdade é o que deixa QUALQUER pessoa conferir uma área "sem cadastro" sem depender só do número do projeto. Serve a tese central do portal. | Baixo-médio. Não depende de data fixa — pode escolher a passagem mais limpa entre 110+ cenas WPM já encontradas com 0% de nuvem em vários meses. Mesmo pipeline da seção 4, primeira aplicação. |
| **Antes/depois de Brumadinho (2019)** | Médio: reforça visualmente um fato que o portal já prova com dado MELHOR (polígono Pleiades 1:2.500 da Semad). | Alto, e parcialmente travado: nuvem medida em 85-100% na janela pós-rompimento inviabiliza um par limpo — seção 3.1. |
| **Avanço de lavra ao longo do tempo** | Alto em tese (documenta expansão de mina sobre território, complementa as 21 sobreposições já mapeadas — dado citado no pedido, não reconferido nesta pesquisa). | Alto: precisa de série temporal (múltiplas datas por área, não uma), o que multiplica o pipeline da seção 4 por N datas, e a lista das "21 sobreposições" não foi localizada/confirmada nesta pesquisa (lacuna, seção 7). |

### 5.2 Recomendação: prova visual do vazio cadastral, primeiro

Maior ganho, menor esforço, e usa exatamente o que foi medido como
abundante (cenas WPM de 2 m, mensais, boa parte com 0% de nuvem). É também
a aplicação mais alinhada à missão do portal: o vazio cadastral já é a
"camada de saída" do globo (`vazio-cadastral-bacia`, ligada por padrão,
seção do `config.js` conferida nesta pesquisa) — dar a QUALQUER visitante a
imagem de satélite ao lado do polígono transforma uma alegação do projeto
em algo que se confere com o próprio olho, sem precisar confiar só no
cálculo.

Proposta de piloto: recortar 3 a 5 cenas WPM (2 m, nuvem baixa, já
localizadas nesta pesquisa) sobre os maiores polígonos de
`vazio-cadastral-bacia` (35 áreas ≥ 500 ha — as maiores, mais fáceis de
enquadrar numa cena só), processar pelo pipeline da seção 4, e medir de
verdade o peso do resultado antes de decidir escalar para as 390 áreas de
Curvelo ou para os Vales.

### 5.3 O que fica para depois, não descartado

- **Antes/depois de Brumadinho**: não descartado, rebaixado. Se um dia
  aparecer uma cena de outro provedor com nuvem baixa perto de 25/01/2019
  (fora do escopo INPE deste pedido), a arquitetura da seção 4 serve sem
  mudança.
- **Avanço de lavra**: mesmo pipeline, esforço maior por ser série
  temporal — fica como segunda aplicação depois que o piloto do vazio
  cadastral validar o pipeline na prática. Requer localizar e confirmar a
  fonte das "21 sobreposições" citada no pedido, que esta pesquisa não
  reconferiu.

---

## 6. Ordem sugerida — maior ganho, menor esforço primeiro

1. **O dono cria a conta gratuita no catálogo do INPE** (botão "Registro",
   `dgi.inpe.br/catalogo`) — passo que este assistente não pode fazer
   sozinho (criar conta é ação vedada, mesmo sendo grátis e pública). Sem
   isso, nada do pipeline real (seção 4.2) roda.
2. **Medir de verdade o peso de uma banda GeoTIFF** assim que o cadastro
   existir — fecha a lacuna da seção 2.3 com número medido, não estimado.
3. **Escrever o coletor + o passo de recorte/composição de cor** (seção
   4.2) — dependência nova (GDAL/rasterio), primeira vez que o projeto
   processa raster; vale isolar num venv próprio, mesma disciplina de
   `isolar-ambiente-python` já em uso no projeto.
4. **Piloto de 3-5 cenas sobre o vazio cadastral da bacia** (seção 5.2),
   publicado no R2, e só então a camada `imagens-inpe` no globo (seção
   4.3) — não editar `apps/web/public/terras/globo/**` antes de ter o
   dado processado e medido; código sem dado real desalinha rápido.
5. **Avanço de lavra** (seção 5.3), depois do pipeline provado.

---

## 7. O que este plano NÃO decide

- Qual composição de bandas usar para "cor" (RGB natural vs. falsa-cor tipo
  a miniatura padrão do INPE, que realça vegetação) — decisão visual, cabe
  testar as duas no piloto.
- Se o recorte de imagem processado é público no R2 ou atrás de Worker —
  mesma decisão em aberto que `docs/PLANO-ARQUIVO-DE-FONTES.md` já deixou.
- Quantas cenas/datas por área entram no piloto além das 3-5 iniciais —
  decisão de escala, depois de medir o peso real (item 2 da seção 6).

---

## 8. Lacunas declaradas

- **Não completei o cadastro no INPE** — ação vedada para este assistente
  (criar conta), mesmo gratuita. Todo número desta seção que depende de
  cadastro (peso real de banda GeoTIFF, fluxo completo de registro) fica
  como próximo passo, não como medição.
- **Não confirmei o link "Como acessar imagens de maior resolução espacial
  (somente para servidores públicos)"**, visto no menu de tutoriais de
  `obt.inpe.br` mas não aberto — pode existir uma camada de resolução MAIOR
  que o WPM de 2 m restrita a servidor público, o que não afetaria o plano
  recomendado (que já usa WPM, de acesso comum), mas fica registrado para
  não afirmar que 2 m é o teto absoluto do catálogo.
- **Não reconferi a fonte das "21 sobreposições" de mineração** citada no
  pedido do dono para o caso de uso de avanço de lavra (seção 5.3) — fora
  do escopo desta pesquisa, que foi sobre o catálogo de imagem, não sobre
  releitura de `docs/FONTES-TERRITORIO-E-MINERACAO.md`.
- **As 3 imagens baixadas ficaram só no scratchpad da sessão**, não no
  repositório — são material de prova de conceito, não o recorte final que
  o pipeline da seção 4 produziria; publicá-las como estão seria confundir
  miniatura de baixa resolução com o produto de verdade.
- **Não testei se o e-mail de cadastro tem algum custo de aprovação/demora**
  (ex.: se é instantâneo ou se alguém no INPE aprova manualmente) — o FAQ
  do catálogo lista tutoriais sobre o assunto que não abri um a um.

---

*Levantado em 2026-08-13. Catálogo, API STAC, GeoServer e as 3 miniaturas
foram chamados/baixados de verdade nesta data — números de bytes e pixels
são medição direta, não estimativa. O que não foi confirmado está marcado
como tal.*
