# Plano de camadas históricas no globo 3D (revoltas, sesmarias e capitanias)

> **Tipo:** PLANO
> **Domínio:** global (história + território + memória)
> **Última medição:** 2026-09-30
> **Leitura estimada:** média (10–15 min)
> **Relacionados:** [PRODUTO.md](../01-produto/PRODUTO.md), [FONTES.md](../06-fontes/FONTES.md), [ESTADO.md](../02-estado/ESTADO.md), [plano-geolocalizacao-camadas-globo-3d.md](plano-geolocalizacao-camadas-globo-3d.md), [AGENTS.md](/AGENTS.md)
> **Palavras-chave:** historia, globo 3d, capitanias hereditarias, sesmarias, revoltas, tordesilhas, tratado de madri, territorio, limites, ibge, arquivo publico mineiro, incra, openhistoricalmap, camadas, memoria

## Sumário

- [O que o dev pediu](#o-que-o-dev-pediu)
- [O problema editorial: história não acusa, data e cita](#o-problema-editorial-história-não-acusa-data-e-cita)
- [O que já existe no repositório (medido em 30/09/2026)](#o-que-já-existe-no-repositório-medido-em-30092026)
- [O botão "Voe até aqui" e a ficha de contexto](#o-botão-voe-até-aqui-e-a-ficha-de-contexto)
- [Fontes medidas (30/09/2026)](#fontes-medidas-30092026)
- [Fontes por sondar (não medidas)](#fontes-por-sondar-não-medidas)
- [As cinco camadas propostas](#as-cinco-camadas-propostas)
- [Referências acadêmicas (Geografia, História, Antropologia)](#referências-acadêmicas-geografia-história-antropologia)
- [Pendências a resolver](#pendências-a-resolver)
- [Fases de execução](#fases-de-execução)
- [Regras editoriais específicas](#regras-editoriais-específicas)
- [Riscos e o que NÃO fazer](#riscos-e-o-que-não-fazer)
- [Decisões registradas](#decisões-registradas)
- [Origem](#origem)

## O que o dev pediu

Pedido do dev de 30/09/2026, com as palavras dele:

> "Com base em registros e mapas históricos preferencialmente de fontes oficiais e
> acadêmicas, como Incra, IBGE, USP, UFMG, UFRJ, e outras, seja proativo na busca, faça
> o plano abaixo: geo localizar e colocar camadas no mapa 3D de História, com localização
> das revoltas, limites territoriais e de controle máximo, das sesmarias, capitanias
> hereditárias e maiores."

Complemento do mesmo pedido (30/09/2026): os pontos precisam de **links ao final,
ligados na Mística do Dia com pequenos botões "voe até aqui"**, o mesmo na **página da
linha do tempo e em outras páginas**; e, ao clicar na descrição do local, **um contexto
histórico / educativo / informativo**. Esses dois itens estão especificados na seção
[O botão "Voe até aqui" e a ficha de contexto](#o-botão-voe-até-aqui-e-a-ficha-de-contexto)
e a infraestrutura deles já está implementada (Fase 0).

Este documento é esse plano: **pesquisa medida nas fontes** (o que dá e o que não dá),
**as camadas** a construir, **as fases** e o que **não** fazer.

⚠️ **Interpretação de "e maiores", a confirmar:** leio "maiores" como **a maior extensão de
controle** — os limites máximos do território na colônia (Tordesilhas 1494 → Madri 1750 →
Santo Ildefonso 1777), e não "as maiores sesmarias". As duas leituras estão previstas: a
camada `hist-sesmarias-mg` pode ordenar por área **quando a fonte der a área**, e a camada
de limites cobre o "controle máximo". Confirmar com o dev na [Fase A](#fases-de-execução).

## O problema editorial: história não acusa, data e cita

O portal publica ato oficial e dado público; a tentação, aqui, é pior que nas outras frentes:
**mapa histórico parece prova**. Três regras governam estas camadas:

1. **Fronteira colonial é aproximação, não linha exata.** Os mapas de 1574, 1750 e 1777 foram
   desenhados à mão, em escalas diferentes, com trechos "por descobrir". Todo polígono desta
   frente nasce com **ano, autor, obra e natureza** ("traçado histórico aproximado") na ficha.
2. **Datas e autores viajam com o desenho.** A capitania de 1534 não é a de 1750; o "controle
   máximo" só existe **contra um ano e um tratado**. Sem o ano, o número mente.
3. **Nome colonial ≠ nome atual.** Sesmarias e capitanias usam freguesias, arraiais e vilas
   que não existem hoje. Casar por nome é o erro clássico; o caminho é o **dicionário
   documentado** (ver a armadilha de "município por nome" no [FONTES.md](../06-fontes/FONTES.md)),
   com o que não casou **declarado**.

E a frase da casa: **a história aqui é acervo documental, com fonte e data — o portal não
julga o passado como julga um ato de hoje.** Cada ficha leva "Fonte oficial ↗".

## O que já existe no repositório (medido em 30/09/2026)

**A infraestrutura de camadas do globo já está pronta e documentada** —
[plano-geolocalizacao-camadas-globo-3d.md](plano-geolocalizacao-camadas-globo-3d.md):

- registro de camadas em `apps/web/public/terras/globo/js/config.js` (`ASSUNTOS` e
  `LAYER_REGISTRY`, com `render: 'point'|'polygon'`, `color`, `pointSize`);
- ficha lateral em `apps/web/public/terras/globo/js/ui/inspector.js`;
- **geolocalização híbrida** já desenhada: coordenada nativa quando existe; senão
  **centróide municipal (IBGE) com dispersão determinística** (espiral do número áureo pelo
  hash do registro), o que evita empilhar pontos no mesmo pixel;
- gerador de referência: `scripts/gerar-camadas-ambientais-globo.py`;
- camadas versionadas em `apps/web/public/terras/globo/dados/camadas/`.

**Dados que já existem e encostam nesta frente:**

| Item | O que é | Onde |
|---|---|---|
| `lib/memoria/calendario.ts` | **538 verbetes** de lutas, revoltas e resistências (dia, ano, título, resumo, tipo, autor, órgão, URL) | campos medidos: `diaMes, ano, titulo, resumo, tipo, autor, orgao, url, semData, fonteCurta, fonteData` — ⚠️ **não há campo de lugar** |
| `municipios-centroides.json` e `municipios-mg.json` | centróides oficiais do IBGE | `apps/web/data/` |
| `terra-publica-certificada.geojson`, `devolutas-arrecadadas.geojson`, `assentamentos.geojson` | terra pública e assentamentos (INCRA) | camadas do globo |
| `atos-area-protegida-municipios.geojson` | atos municipais sobre área protegida | camadas do globo |

⚠️ **A lacuna que manda na Fase C:** os 538 verbetes de revolta **não têm coordenada nem
município**. Georreferenciá-los exige **enriquecer o dado** (extrair o lugar do texto da
fonte, documentado) — não "adivinhar" o ponto.

## O botão "Voe até aqui" e a ficha de contexto

Duas peças que o dev pediu, e que valem para **qualquer** página — não só as históricas.

### O deep link (contrato)

```
/terras/globo/?voe=<lat>,<lon>&nome=<rótulo>&ctx=<slug>&z=<distância>
```

- `voe` é o ponto (graus decimais). Fora da faixa válida, o globo ignora e abre no padrão —
  melhor que voar para o oceano.
- `nome` é o rótulo humano que a ficha mostra.
- `ctx` é o slug do contexto em
  `apps/web/public/terras/globo/dados/contextos-lugares.json`.
- `z` é a distância ao centro da Terra (1 = superfície); omitida, usa o padrão de município.

### O que já está implementado (Fase 0 — 30/09/2026)

| Peça | Arquivo | Papel |
|---|---|---|
| Leitura do endereço | `public/terras/globo/js/core/voo.js` | parse + validação (`vooDoEndereco`, `enderecoVoarAte`) |
| Teste da leitura | `public/terras/globo/js/core/voo.test.mjs` | **9 testes** (voo inválido, faixa, slug, ciclo) |
| Ficha do lugar | `public/terras/globo/js/ui/contextolugar.js` | painel de contexto, fechável (botão e Esc) |
| Textos | `public/terras/globo/dados/contextos-lugares.json` | contextos por slug, com fonte e link |
| Ligação no globo | `public/terras/globo/js/main.js` | voa ao ponto e abre a ficha |
| Botão (Next) | `app/components/BotaoVoarAte.tsx` + `lib/globo/voo.ts` (+ teste vitest) | `<BotaoVoarAte lat lon nome ctx />` em qualquer página |

**Já ligado:** a tabela de comunidades de `/mineracao/ilegal` (cada linha tem lat/lon do
centroide e um `ctx` por tipo — `terra-indigena` ou `territorio-quilombola`).

**Entra em seguida:** Mística do Dia e linha do tempo — dependem do **campo de lugar** que
os verbetes ainda não têm (Fase C) —, e as demais páginas conforme forem ganhando
coordenada.

### O contexto ao clicar

Ao chegar, o globo abre um painel com **título, texto curto e o link da fonte oficial**.
O texto é educativo e datado; quando o ponto não tem contexto publicado, a ficha **declara
a lacuna** em vez de preencher com suposição (AGENTS § 7). Nada de HTML montado com dado do
endereço: tudo por `textContent`, e o `ctx` só aceita slug (`[a-z0-9-]`).

## Fontes medidas (30/09/2026)

Todas sondadas de verdade nesta máquina, em 30/09/2026, com User-Agent honesto.

| Fonte | O que dá | O que **não** dá | Link |
|---|---|---|---|
| **IBGE — Brasil: 500 anos de povoamento** (oficial) | Seção *construção do território*: Tordesilhas, capitanias hereditárias, União Ibérica, descoberta do ouro, **tratados** e extensão atual. Texto + mapas (JPG) + publicação completa em PDF | Não é dado vetorial: é **mapa e texto** | [brasil500anos.ibge.gov.br](https://brasil500anos.ibge.gov.br/territorio-brasileiro-e-povoamento/construcao-do-territorio/capitanias-hereditarias.html) |
| **IBGE — Evolução da Divisão Territorial do Brasil 1872-2010** (oficial) | Ficha do *Mapa das Capitanias Hereditárias* (**mapa de Luis Teixeira, 1574**); bbox do Brasil (−74,0 a −34,8; −33,7 a 5,27) | Formato **PDF/PNG** no catálogo; foi catalogado como "arquivo antigo" | ficha `cb6e6495-cd71-45d4-884f-904e6231858c` no [Catálogo de Metadados](https://metadadosgeo.ibge.gov.br/geonetwork_ibge/srv/search?keyword=Captanias%20Heredit%C3%A1rias) |
| **IBGE — malhas** (oficial) | Malhas atuais por UF/município/região em SVG, GeoJSON e TopoJSON | Não há malha **colonial** vetorial no FTP | API `servicodados.ibge.gov.br/api/v3/malhas/...`; espelho `geoftp.ibge.gov.br/.../malhas_municipais/` (**2000 a 2025**) |
| **Arquivo Público Mineiro — SIAAPM, Seção Colonial** (oficial, MG) | **Registro de sesmarias** catalogado e pesquisável: séries `SC-01` (1605-1799), `SC-106` (1753-1754), `SC-112`, `SC-119`, `SC-122`, `SC-125`, `SC-127`, `SC-129`, `SC-140`, `SC-146`, `SC-172`… | É **catálogo de códices** (metadado + imagem), não geometria | busca `siaapm.cultura.mg.gov.br/modules/brtacervo/search.php?query=sesmaria` |
| **APM — Terras Públicas e núcleos coloniais** (oficial, MG) | "Repartição Especial das Terras Públicas" e "Mapas de População e Títulos de Terra dos Núcleos Coloniais"; "Documentos Cartográficos" | Idem: catálogo e imagem | módulos `terras_publicas`, `mapas_populacao`, `grandes_formatos_docs` no SIAAPM |
| **OpenHistoricalMap** (comunidade, CC0) | Fronteiras históricas do mundo em vetor; **têm relação de "Capitanias"** (relação `2751236` testada via Overpass) | **Não é fonte oficial**: é wiki colaborativa — serve de **ponto de partida**, sempre conferida contra o mapa oficial | Overpass `overpass-api.openhistoricalmap.org`; dados **CC0** |

**O que a própria fonte oficial diz (IBGE 500 anos), para citar com precisão:** a capitania
não era propriedade absoluta do donatário — as terras eram do Estado; o hereditário era o
**poder de administrar**, e ao donatário se permitia **conceder sesmarias** ("lotes de terra
não cultivada", com prazo para torná-la produtiva).

## Fontes por sondar (não medidas)

⚠️ Buscadores responderam mal nesta máquina em 30/09 (DuckDuckGo com captcha; Bing
ignorando os termos técnicos). Ficam **nomeadas e com endereço provável** para a Fase A
medir uma a uma:

- **Biblioteca Nacional — cartografia digital (BNDigital)** — mapas do período colonial e do
  Império (inclusive o *Mapa das Cortes*, 1749): ponto de partida para os **limites dos
  tratados**. É a fonte primária natural do "controle máximo".
- **Laboratórios de cartografia histórica (USP, UFMG, UFRJ)** — acervos georreferenciados e
  artigos; o dev citou as três. Medir repositório, licença e formato antes de usar.
- **INCRA — Acervo Fundiário** — o projeto **já consome** o WFS do INCRA; verificar se há
  camada de **terras devolutas / sesmarias remanescentes** além do que o globo já publica.
- **Wikidata / Wikipédia** — ponte terciária para **coordenadas de evento** (revoltas),
  nunca como campo `fonte` (regra do [AGENTS.md § 7](/AGENTS.md)).

## As cinco camadas propostas

Cada camada diz **o que prova** e **o que não prova** — e a ficha publica isso.

### 1. `hist-capitanias` — as capitanias hereditárias

- **O que é:** polígonos das 14 donatarias (1534-1536) e a evolução até as capitanias
  régias/província; recorte do Brasil.
- **Fonte:** mapa oficial do IBGE (Luis Teixeira, 1574) e a seção *construção do território*;
  **geometria de trabalho** a partir do OpenHistoricalMap, **conferida** contra o mapa oficial.
- **O que prova:** onde a Coroa tentou dividir e administrar a costa.
- **O que NÃO prova:** que a linha tenha sido realidade no terreno — muitas capitanias
  fracassaram ou não passaram do papel.

### 2. `hist-sesmarias-mg` — sesmarias de Minas Gerais

- **O que é:** pontos por **registro** de sesmaria (e cartas de confirmação/doação), com
  período, série/códice e link para o APM.
- **Fonte:** APM — Seção Colonial (`brtacervo`), busca por palavra-chave "sesmaria".
- **Como localizar:** o registro traz **lugar** (freguesia/arraial/vila); o ponto sai do
  **dicionário documentado** lugar→município atual + **centróide IBGE com dispersão**; o que
  não casa fica com `municipio_atual: null` e o nome **como na fonte** preservado.
- **O que prova:** que um ato de doação existe no acervo, com data e lugar.
- **O que NÃO prova:** a área no terreno — o documento raramente traz uma geometria fechada.
- ⚠️ **Titular:** o nome do sesmeiro é parte do **ato oficial** e entra como o ato o traz;
  **nunca** CPF/CNPJ e **nunca** cruzamento com base de pessoa física (AGENTS § 5.2).

### 3. `hist-revoltas` — as revoltas no mapa

- **O que é:** pontos das revoltas e lutas já catalogadas em `lib/memoria/calendario.ts`,
  com ano, tipo e link da fonte.
- **Fonte:** o próprio acervo do portal (Mística/Memória) + as fontes que ele cita; o
  **enriquecimento** acrescenta `local`, `uf` e a coordenada (município IBGE).
- **O que prova:** onde o episódio se deu, segundo a fonte citada.
- **O que NÃO prova:** que o evento cobriu só aquele ponto — revolta é processo, não pino.

### 4. `hist-territorio-maximo` — limites e controle máximo

- **O que é:** traçados dos marcos — **Tordesilhas (1494)**, **Madri (1750)**, **Santo
  Ildefonso (1777)** — e a extensão de controle efetivo no século XVIII.
- **Fonte:** IBGE 500 anos (tratados) e mapas da **Biblioteca Nacional** (a sondar).
- **O que prova:** o desenho **como um período e um tratado o fixaram**.
- **O que NÃO prova:** presença efetiva contínua — "controle" é frágil e pontual; a ficha
  diz isso.

### 5. `hist-divisao-municipal-<ano>` — a evolução das malhas (se houver vetor)

- **O que é:** malhas municipais históricas (1872, 1920, 1940…) para "ver o mapa mudar".
- **Fonte:** IBGE — *Evolução da Divisão Territorial* (medido: **publicação e mapas em PDF**;
  não se confirmou vetor no FTP, que só tem 2000-2025).
- **Decisão de escopo:** se não houver vetor oficial, **declara a lacuna** e entrega só as
  imagens citáveis — não desenhar à mão.

## Referências acadêmicas (Geografia, História, Antropologia)

Pedido do dev (30/09/2026): somar **artigos e livros acadêmicos** das três áreas para
**caracterizar** (o que era uma sesmaria, um engenho, uma fazenda de café, um quilombo) e
**localizar** (onde estavam, como o território mudou). Esta lista é a **bibliografia de
trabalho** das Fases G e H; cada item entra na ficha da camada que ajudar a sustentar.

⚠️ **Regra da casa aplicada:** aqui estão as obras (ABNT). O **link canônico de cada uma é
pendência** — o portal linka à fonte, e a URL de cada obra será conferida uma a uma antes
de publicar, em vez de link solto para catálogo genérico.

**Geografia (formação territorial e geografia agrária)**

- MORAES, Antonio Carlos Robert. *Bases da formação territorial do Brasil*. São Paulo:
  Hucitec, 2000. — como o território colonial se organiza (capitanias → sesmarias → freguesias).
- ABREU, Maurício de Almeida. *Geografia histórica do Rio de Janeiro (1502-1700)*. Rio de
  Janeiro: Andrea Jakobsson, 2010. — método de geografia histórica para reconstituir o
  território a partir de fontes.
- FERNANDES, Bernardo Mançano. *A formação do MST no Brasil*. Petrópolis: Vozes, 2000. —
  leitura da terra como território (ponte com a frente agrária do portal).

**História (economia colonial, escravidão e os ciclos)**

- PRADO JÚNIOR, Caio. *Formação do Brasil contemporâneo*. São Paulo: Brasiliense, 1942. —
  o tripé cana/mineração/café na formação do país.
- HOLANDA, Sérgio Buarque de. *Caminhos e fronteiras*. Rio de Janeiro: José Olympio, 1957. —
  **localização**: rotas, sertões e a expansão do povoamento.
- SCHWARTZ, Stuart B. *Segredos internos: engenhos e escravos na sociedade colonial*. São
  Paulo: Companhia das Letras, 1988. — **engenhos de cana** (Fase H).
- FURTADO, Celso. *Formação econômica do Brasil*. Rio de Janeiro: Fundo de Cultura, 1959. —
  **café** e o deslocamento do centro econômico para o Sudeste.
- GORENDER, Jacob. *O escravismo colonial*. São Paulo: Ática, 1978. — estrutura da
  escravidão (Fase G).
- MARTINS, Roberto Borges. *A economia escravista de Minas Gerais no século XIX*. Belo
  Horizonte: CEDEPLAR/UFMG, 1982. — **Minas**: onde a economia escravista de fato operou.
- PAIVA, Clotilde Andrade. *População e economia nas Minas Gerais do século XIX*. São
  Paulo: USP, 1996 (tese). — **demografia histórica de MG**: base para o recenseamento de 1872.
- REIS, João José. *Rebelião escrava no Brasil: a história do levante dos malês (1835)*. São
  Paulo: Brasiliense, 1986. — a revolta dos malês (já com contexto na Fase C).
- MOURA, Clóvis. *Rebeliões da senzala*. São Paulo: Zumbi, 1959. — quilombos e revoltas.

**Antropologia (território, etnicidade e quilombo)**

- CARNEIRO DA CUNHA, Manuela (org.). *História dos índios no Brasil*. São Paulo:
  Companhia das Letras, 1992. — povos e territórios indígenas na colônia.
- ARRUTI, José Maurício. *Mocambo: antropologia e história do processo de formação
  quilombola*. Bauru: EDUSC, 2006. — **quilombo** como processo, não como resto.
- O'DWYER, Eliane Cantarino (org.). *Quilombos: identidade étnica e territorialidade*. Rio
  de Janeiro: FGV, 2002. — os critérios que sustentam o território (INCRA/4.887).
- ALMEIDA, Alfredo Wagner Berno de. *Terras de quilombo, terras indígenas, "babaçuais
  livres", "castanhais do povo", faixinais e fundos de pasto*. Manaus: PPGSCA-UFAM, 2006. —
  como nomear e localizar territorialidades tradicionais.

**Onde procurar os artigos (periódicos, para as Fases G e H)**

- *Varia Historia* e *Tempo* (História, UFMG/UFF) · *Revista Brasileira de Estudos de
  População* (v. CEDEPLAR/UFMG) · *Anais do Museu Paulista* · *Revista do Arquivo Público
  Mineiro* · *GEOUSP* e *Revista do Departamento de Geografia* (USP) · *Boletim Paulista de
  Geografia* · SciELO e Periódicos CAPES como porta de busca.

## Pendências a resolver

Registradas por pedido do dev (30/09/2026). Cada uma diz **o que falta** e **o que a
destrava** — nada aqui se resolve por suposição.

| # | Pendência | O que destrava | Dono | Estado |
|---|---|---|---|---|
| P1 | **Mineração escravizada** (Fase G): dado por município | **FEITO em parte:** coleção *Mapas de População* do APM = **354 listas nominativas (1838-1840)** coletadas; **121** no mapa, 233 declarados. Falta: **contagem de escravizados** (exige leitura da imagem) e o censo de 1872 | agente | 🚧 |
| P1b | **Censo de 1872** por município e **base histórica do CEDEPLAR** | Biblioteca do IBGE devolve **403** (dois UAs); CEDEPLAR 200 mas sem base exposta → procurar a via (contato/LAI ou repositório) | agente | ⛔ |
| P2 | **Engenhos de cana** (Fase H): nenhum no IEPHA | acervos de PE/AL e **IPHAN** (a medir) | agente | ⛔ |
| P3 | **Fazendas de café** (Fase H): só as tombadas | **Inventário das Fazendas de Café** (IPHAN) e atlas da cafeicultura | agente | ⛔ |
| P4 | **IPHAN**: rota de dado em massa morta/barrada | achada a página `/iphan/pt-br/acesso-a-informacao/dados-abertos` (200), que aponta para o `dados.gov.br` — cuja **API devolve 401**; falta a via de download direto | agente | 🚧 |
| P5 | **Biblioteca Nacional** (Fase E): cartografia dos tratados | sondar o acervo digital — **medido 30/09: 403 com UA honesto E com UA de navegador**, em `bndigital.bn.gov.br` e `bn.gov.br/acervo`; a via segue a reencontrar | agente | ⛔ |
| P6 | **Camada `hist-revoltas.geojson`** | **FEITO 30/09:** 15 lutas com lugar, geradas do próprio gazetteer (`scripts/gerar-camada-revoltas.py`) e registradas no globo | agente | ✅ |
| P7 | **Link canônico das obras acadêmicas** acima | conferir obra a obra (sem link solto de catálogo) | agente | 🚧 |
| P8 | **Revisão humana dos 100 exemplos** (plano de cavas) | é do dev; barra a publicação de número novo da Fase E | dev | ⛔ |
| P9 | **Confirmar a leitura de "maiores"** e o recorte da Fase A | é do dev | dev | ⛔ |
| P10 | **Deploy** das camadas novas no Guara | política de ~5 dias; a suíte e o `tsc` estão verdes | dev | ⛔ |
| P11 | **Moeda/tabela de preço do provedor** para o custo em yuan | confirmar em que moeda o opencode grava `session.cost` (hoje a conversão usa taxa assumida 1 USD = 7,1) | dev | 🚧 |

## Fases de execução

### Fase 0 — infraestrutura do "voe até aqui" (feito em 30/09/2026)

- Deep link, leitura validada, painel de contexto, textos por slug e o componente
  `BotaoVoarAte`; primeiro uso na tabela de comunidades de `/mineracao/ilegal`.
- Detalhe e arquivos na seção
  [O botão "Voe até aqui" e a ficha de contexto](#o-botão-voe-até-aqui-e-a-ficha-de-contexto).
- Suíte verde: 2.012 testes no vitest + 177 no globo (9 novos), `tsc` limpo.

### Fase A — dicionário e gazetteer (0,5 dia)

- Montar `lugar colonial → município atual` com fonte para cada casamento, reaproveitando o
  dicionário de municípios e os centróides do IBGE; o que não casar fica declarado.
- Reaproveitar a **dispersão determinística** do [plano de camadas](plano-geolocalizacao-camadas-globo-3d.md)
  (nada de ponto aleatório que muda a cada build).
- Sondar as **fontes por sondar** (BN, labs, INCRA) e registrar `robots.txt`, licença e formato.
- **Confirmar com o dev** a leitura de "maiores" e o recorte (Brasil colônia × MG × período).

### Fase B — capitanias (1–2 dias)

- Obter a geometria do OpenHistoricalMap (CC0) e **conferir** contra o mapa do IBGE; onde
  divergir, vale o oficial e a divergência fica escrita.
- Camada nasce **desligada**, com o ano e a natureza na etiqueta.

**Status medido 30/09/2026 — feito:**

- **Geometria do OpenHistoricalMap** (CC0), relação a relação: **13 capitanias** com
  `start_date`/`end_date`, incluindo Pernambuco — que no OHM se chama **Nova Lusitânia**
  (1534-1700). Os anéis foram costurados a partir das *ways* (`outer`): **18 anéis, nenhum
  aberto**.
- **Camada versionada:** `apps/web/public/terras/globo/dados/camadas/hist-capitanias.geojson`
  (233 KB), com `nome`, `inicio`, `fim`, `ohm_id`, `fonte`, `licenca` e `natureza`
  ("traçado histórico aproximado") em cada feição.
- **Conferência contra o mapa oficial do IBGE** — o *Mapa das Capitanias Hereditárias*
  (mapa de **Luís Teixeira, 1574**, ficha `cb6e6495…`): confere no **modelo** (faixas
  costeiras perpendiculares à costa, uma por donataria) e na **contagem** (13 no OHM × 14
  doações históricas — as duas porções do Maranhão são uma relação só no OHM). **Não é
  sobreposição pixel a pixel**: o mapa de 1574 não tem georreferenciamento, e isso fica
  escrito na nota da camada.
- **Registrada no globo** em `config.js`: assunto novo `historia`, linha e fonte próprias;
  nasce **desligada**. Teste sentinela do painel atualizado (**57 fontes / 53 linhas**) e
  `hist-capitanias` entrou no contrato de ids publicados.
- ⚠️ **Armadilha medida:** consultar o Overpass por PowerShell mangla a query (colchetes);
  a coleta foi feita com `requests` no Python. E o recorte por *bounding box* trouxe o
  **Chile** junto — filtrar por relação, não por caixa.

### Fase C — revoltas (1 dia)

- Enriquecer `calendario.ts` com `local`, `uf` e coordenada (município IBGE); campo novo
  documentado e testado em `mistica.test.ts`.
- Gerar `hist-revoltas.geojson`; a tabela de `/memoria` ganha coluna "Onde".
- **Ligar o botão da Fase 0:** `BotaoVoarAte` na Mística do Dia (home) e em cada verbete da
  linha do tempo, com `ctx` do contexto do lugar.

**Status medido 30/09/2026 — feito, com o número declarado:**

- **Gazetteer curado** em `apps/web/lib/memoria/locais.ts`: só nome de movimento
  inequívoco (`Inconfidência Mineira`, `Cabanagem`, `Canudos`, `Palmares`, …). Palavra
  ambígua (`palmares`, `chibata`, `males`, `farrapos`) fica **de fora** — casá-la daria
  "onde" falso, e onde falso é dano.
- **Coordenada do IBGE, conferida por teste:** as coordenadas estão embutidas no módulo
  (para ele não levar o JSON de 529 KB ao bundle da home) e `locais.test.ts` compara cada
  uma com `apps/web/data/municipios-centroides.json` — divergência > ~0,05° quebra o teste.
- **Cobertura declarada: 14 de 533 verbetes** ganham lugar (Belém, Canudos, Marabá, Caxias,
  Contestado, Ouro Preto, Recife, Rio, Salvador, São Paulo…). **A maior parte fica sem
  lugar, e a tela diz isso** — lacuna é informação.
- **Onde aparece:** Mística do Dia (home) e cada verbete de `/memoria` mostram
  `Onde: <lugar>/<UF>` com o botão **"Voe até aqui"** (Fase 0).
- **16 contextos históricos** publicados em `dados/contextos-lugares.json` (um por
  movimento), cada um com fonte (Arquivo Nacional, Biblioteca Nacional, Palmares).
- **Camada `hist-revoltas.geojson`: FEITA em 30/09** — 15 lutas com lugar, geradas do
  próprio gazetteer por `scripts/gerar-camada-revoltas.py` e registradas no globo
  (assunto `historia`, desligada). Antes era "pendente declarado"; a P6 fechou.
- Suíte verde: **2.036 testes** no vitest + 177 no globo; `tsc` limpo.

### Fase D — sesmarias de MG (1–2 dias)

- Coletor do APM (`brtacervo`): busca por "sesmaria", paginação, só **metadado + link**;
  varredura de dado pessoal antes de commitar (AGENTS § 5.2).
- Gerar `hist-sesmarias-mg.geojson` (pontos) e o agregado por município/período.

**Status medido 30/09/2026 — feito, com a premissa corrigida pela medição:**

- **A premissa do plano não se sustentou, e a medição corrigiu o rumo.** O APM cataloga o
  **LIVRO de registro**, não a sesmaria: a busca devolve **1.726 registros de série**
  (ex.: `SC-106 Registro de sesmarias, 1753-1754`), **sem lugar**. Geolocalizar sesmaria a
  sesmaria exigiria ler o índice digitalizado de cada livro — fora do alcance de um coletor.
  Então **não se inventou ponto**: publica-se o **índice documental** em
  `apps/web/data/apm-sesmarias-indice.json` (notação, título, período, link), e a ausência
  de lugar fica escrita.
- **O que DEU para geolocalizar foi outro fundo:** o módulo *Terras Públicas* tem **244
  registros**, e **14** nomeiam o município no título (`TP-1-222 … (Mariana), 1855-1856`).
  Vira a camada `hist-terras-publicas.geojson` (ponto no centroide do município do IBGE,
  com dispersão determinística), com período e link do APM.
- Índices completos em `apps/web/data/apm-terras-publicas-indice.json` (244, incluindo os
  **11 que não casaram** no IBGE — nomes históricos como "Vila de", "Cueluz", "Mato Dentro").
- Coletor: `scripts/coletar-apm-territorio-historico.py` (pausa de 2 s; **fim provado por
  página vazia**, nunca pelo teto — a primeira rodada bateu no teto de 80 páginas e
  devolveu 1.600 como se fosse o total).
- Camada registrada no globo no assunto `historia`, **desligada**; teste sentinela do painel
  atualizado (**58 fontes / 54 linhas**).

### Fase E — limites e tratados (1 dia)

- Camada dos traçados (Tordesilhas/Madri/Santo Ildefonso); cada linha com o **ano e o
  tratado** no nome. Depende do que a BN liberar na Fase A.

### Fase G — mineração escravizada e população escravizada (pedido do dev, 30/09)

- **Pedido:** cruzar e publicar os **locais de mineração escravizada**.
- **A via encontrada — e é oficial:** a coleção **"Mapas de População" do APM** são
  **listas nominativas de 1838-1840** (relação de habitantes, fogos, idade, estado civil,
  nacionalidade, alfabetização e **ocupação**) — a fonte primária da população da província,
  **incluindo a escravizada**. Cada item traz um campo **`Local`**.
- **Coletado:** `scripts/coletar-apm-listas-populacao.py` (retomável, pausa de 2 s) leu a
  coleção: **354 registros**; **121** resolvem em município de MG (pelo "Município de X" da
  fonte e por um dicionário documentado de nomes de época, ex.: *Queluz → Conselheiro
  Lafaiete*, *Curral del Rei → Belo Horizonte*) e viraram a camada
  `hist-listas-populacao.geojson`; **233** são freguesias/distritos que **não** resolveram e
  ficam **sem ponto**, declarados no índice (`apps/web/data/apm-listas-populacao.json`).
- ⚠️ **O que a fonte NÃO dá:** a **contagem de pessoas escravizadas**. O acervo cataloga o
  documento; o número exigiria ler/OCR da imagem de cada lista. Publicar "N escravizados"
  a partir daqui seria inventar.
- **Fontes que falharam, medidas:** **Biblioteca Nacional** (403 com UA honesto **e** com UA
  de navegador, em `bndigital.bn.gov.br` e `bn.gov.br/acervo`) e **Biblioteca do IBGE**
  (403 com os dois UAs). O **CEDEPLAR/UFMG** responde 200 (o programa de demografia foi
  achado), mas a base de dados histórica não está exposta em página pública óbvia.
- **Próximo passo natural:** cruzar as **121 listas** com as áreas de **mineração** para
  dizer onde o documento de população coexiste com a lavra — sem confundir "lista
  nominativa" com "escravidão na mineração", que é leitura de conteúdo.

### Fase H — fazendas e engenhos (pedido do dev, parcialmente feito)

- **Feito:** camada `hist-fazendas-engenhos` — **13 conjuntos rurais tombados** pelo
  IEPHA-MG (fazendas históricas e uma usina), com `ato_legal` e link da fonte; ponto no
  centroide do município.
- **O que falta, e é grande:** "principais fazendas e engenhos de cana e de café" **não é o
  que está tombado**. O universo pede inventário acadêmico/oficial (IPHAN *Inventário das
  Fazendas de Café*; engenhos de cana em acervos de PE/AL; atlas da cafeicultura).
- ⚠️ **Medido:** **nenhum engenho de cana** aparece no acervo do IEPHA — a camada de
  engenhos exige outra fonte, declarada como pendência.

### Fase F — globo, ficha e página (1 dia)

- Registrar as camadas em `config.js` + ficha no `inspector.js`; as seis qualidades
  ([AGENTS.md § 8](/AGENTS.md)) numa página `/historia` (busca, filtros por ano/tipo/UF,
  ordenação, cartões de topo, CSV com BOM e `;`, impressão vetorial).
- Cada linha/camada da página publica o **botão "Voe até aqui"** (Fase 0) com o `ctx` do
  lugar — o mesmo par que a Mística e a linha do tempo usam.
- Critério de pronto: suíte verde, `tsc` limpo, acessibilidade AA, e **toda** camada com
  `fonte`, `data`, `autor`, `licenca` e `natureza` no arquivo.

## Regras editoriais específicas

1. **História não acusa.** O portal publica o documento e o mapa; o juízo é do leitor e da
   historiografia — nunca uma manchete do portal.
2. **Data e autor no desenho.** Nenhum polígono/linha sai sem ano, obra e autoria.
3. **Aproximação declarada.** Fronteira histórica é traçado aproximado; a ficha escreve isso.
4. **Nunca somar bases diferentes** (capitanias × sesmarias × municípios — três perguntas).
5. **Lugar por dicionário, jamais por forma.** O que não casar fica `null` e visível.
6. **Fonte primária primeiro:** IBGE, APM, Biblioteca Nacional; comunidade (OHM) e Wikipédia
   só como **partida**, com a conferência oficial registrada.

## Riscos e o que NÃO fazer

| Risco | O que fazer |
|---|---|
| Mapa de 1574 lido como fronteira exata | escrever "traçado histórico aproximado" na ficha e no rótulo da camada |
| "Controle máximo" sem ano virar manchete | sempre com o tratado e o ano; nunca "o Brasil era X" |
| Nome de sesmeiro tratado como dado pessoal | é ato oficial; publicar como o ato traz, **sem CPF/CNPJ** e sem cruzar com base de pessoa |
| Casar arraial/freguesia por nome | dicionário documentado; divergência declarada |
| Copiar o OpenHistoricalMap como se fosse oficial | conferir contra o mapa oficial; divergência escrita |
| Camada pesada derrubar o globo | nascer desligada; teto de payload (AGENTS § 5.1) e GeoJSON simplificado |
| Sobrepor "história" a "denúncia" na mesma tela | assunto próprio no globo (`ASSUNTOS`), cor e grupo separados |

## Decisões registradas

- **Dev, 30/09/2026:** pedir as camadas históricas no globo 3D (revoltas, limites e controle
  máximo, sesmarias, capitanias), preferindo fontes **oficiais e acadêmicas** (Incra, IBGE,
  USP, UFMG, UFRJ e outras), com busca proativa.
- **Agente, 30/09/2026:** leitura de "maiores" como **maior extensão de controle**
  (a confirmar na Fase A); camadas propostas acima; OpenHistoricalMap entra como ponto de
  partida CC0, nunca como fonte oficial.
- **Vale a regra da casa:** evidência histórica é **documento público com fonte e data**;
  dado de pessoa só como o ato oficial o traz.

## Origem

- Pedido do dev em 30/09/2026 (chat).
- Medições de 30/09/2026: IBGE (Brasil 500 anos; Catálogo de Metadados geo; malhas API v3 e
  FTP), Arquivo Público Mineiro (SIAAPM, Seção Colonial e Terras Públicas) e OpenHistoricalMap
  (Overpass). Infra de camadas do globo: [plano-geolocalizacao-camadas-globo-3d.md](plano-geolocalizacao-camadas-globo-3d.md).
