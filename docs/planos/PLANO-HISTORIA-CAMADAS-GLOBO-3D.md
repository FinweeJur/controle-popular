# Plano de camadas históricas no globo 3D (capitanias, revoltas, terras e população)

> **Tipo:** PLANO
> **Domínio:** global (história + território + memória)
> **Última medição:** 2026-09-30
> **Leitura estimada:** média (10–15 min)
> **Relacionados:** [PRODUTO.md](../01-produto/PRODUTO.md), [FONTES.md](../06-fontes/FONTES.md), [ESTADO.md](../02-estado/ESTADO.md), [plano-geolocalizacao-camadas-globo-3d.md](plano-geolocalizacao-camadas-globo-3d.md), [AGENTS.md](/AGENTS.md)
> **Palavras-chave:** historia, globo 3d, capitanias hereditarias, sesmarias, revoltas, terras publicas, fazendas, engenhos, listas nominativas, mineracao escravizada, vilas mineradoras, tordesilhas, tratado de madri, ibge, arquivo publico mineiro, iepha, incra, openhistoricalmap, camadas, memoria

## Sumário

- [O que o dev pediu](#o-que-o-dev-pediu)
- [Status geral (30/09/2026)](#status-geral-30092026)
- [O problema editorial: história não acusa, data e cita](#o-problema-editorial-história-não-acusa-data-e-cita)
- [O que já existe no repositório (medido em 30/09/2026)](#o-que-já-existe-no-repositório-medido-em-30092026)
- [O botão "Voe até aqui" e a ficha de contexto](#o-botão-voe-até-aqui-e-a-ficha-de-contexto)
- [Fontes medidas (30/09/2026)](#fontes-medidas-30092026)
- [Fontes por sondar (não medidas)](#fontes-por-sondar-não-medidas)
- [As camadas propostas e o que já está no ar](#as-camadas-propostas-e-o-que-já-está-no-ar)
- [Referências acadêmicas (Geografia, História, Antropologia)](#referências-acadêmicas-geografia-história-antropologia)
- [Pendências a resolver](#pendências-a-resolver)
- [Fases de execução](#fases-de-execução)
- [Regras editoriais específicas](#regras-editoriais-específicas)
- [Riscos e o que NÃO fazer](#riscos-e-o-que-não-fazer)
- [Decisões registradas](#decisões-registradas)
- [Origem](#origem)

## Status geral (30/09/2026)

Uma linha por etapa. "No ar" = publicado no repositório **e** verificado (suíte + `tsc`).

| Etapa | Estado | O que falta |
|---|---|---|
| Fase 0 — "voe até aqui" + ficha de contexto | ✅ no ar | ligar o botão em mais páginas conforme ganharem coordenada |
| Fase A — dicionário e gazetteer | ✅ no ar | P9: confirmar com o dev a leitura de "maiores" |
| Fase B — capitanias (1534) | ✅ no ar | — |
| Fase C — revoltas com lugar | ✅ no ar | OCR/conteúdo não se aplica |
| Fase D — terras públicas do Império (APM) | ✅ no ar | — |
| Fase F — página `/historia` | ✅ no ar | acessibilidade AA a revisar no dev server |
| Fase G — listas nominativas + cruzamento histórico | 🚧 parcial | contagem de escravizados (OCR) e censo de 1872 (P1b) |
| Fase H — fazendas e engenhos | 🚧 parcial | engenhos de cana e fazendas de café (P2, P3) |
| Fase E — limites e tratados | ⛔ bloqueada | Biblioteca Nacional devolve 403 (P5) |
| Camadas de mineração em UC/quilombo (plano da mineração) | ✅ no ar | — |

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

**Camadas desta frente já publicadas no globo** (`/terras/globo/`, assunto `historia` e
`territorio-mineracao`; todas nascem **desligadas**):

| Camada (id) | O que traz | Fonte |
|---|---|---|
| `hist-capitanias` | **13** capitanias de 1534, com início/fim | OpenHistoricalMap (CC0) |
| `hist-revoltas` | **15** revoltas e lutas com lugar | acervo de memória + gazetteer (IBGE) |
| `hist-terras-publicas` | **14** registros de terras públicas do Império | Arquivo Público Mineiro |
| `hist-fazendas-engenhos` | **13** conjuntos rurais tombados | IEPHA-MG |
| `hist-listas-populacao` | **121** listas nominativas (1838-1840) | Arquivo Público Mineiro |
| `mineracao-em-uc` | **875** polígonos de mineração em UC | MapBiomas × ANM × CNUC |
| `mineracao-em-quilombo` | **21** polígonos em território quilombola | MapBiomas × ANM × INCRA |

**Páginas e infraestrutura:**

- **`/historia`** — as cinco tabelas de leitura (capitanias, revoltas, fazendas, terras públicas,
  listas nominativas), lendo os **mesmos** `.geojson` do globo por `lib/historia/camadas.ts`;
  busca, ordenação, CSV por tabela e o **botão "Voe até aqui"** em cada revolta.
- **`/mineracao/ilegal`** — o cruzamento comunidades × mineração, com **6 links** que abrem o globo
  com a camada acesa.
- **Deep link "voe até aqui"** (`public/terras/globo/js/core/voo.js` + `app/components/BotaoVoarAte.tsx`)
  e a **ficha de contexto** (`contextos-lugares.json`, 20 contextos) — seção própria abaixo.
- **`lib/memoria/locais.ts`** — o gazetteer curado de movimentos (coordenada do IBGE conferida por
  teste) e o **`lib/historia/camadas.ts`**, que lê as camadas no servidor.
- Registro de camadas em `apps/web/public/terras/globo/js/config.js` (`ASSUNTOS`, `LAYER_REGISTRY`,
  `CAMADAS`), ficha em `js/ui/inspector.js`; sentinelas do painel em `js/ui/layerspanel.test.mjs`
  (**63 fontes / 59 linhas**).

**Coletores e geradores versionados:** `scripts/coletar-apm-territorio-historico.py`,
`scripts/coletar-apm-listas-populacao.py` (retomável), `scripts/gerar-camada-revoltas.py`,
`scripts/gerar-camada-fazendas-engenhos.py`, `scripts/etl/cavas/gerar-camadas-mineracao-protegida.py`,
`scripts/etl/historia/marcar-zona-mineradora.py`.

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
| **Arquivo Público Mineiro — SIAAPM, Seção Colonial** (oficial, MG) | **Registro de sesmarias** catalogado e pesquisável: **1.726 registros de série** (`SC-01` 1605-1799, `SC-106` 1753-1754, `SC-112`, `SC-119`, `SC-122`, `SC-125`, `SC-127`, `SC-129`, `SC-140`, `SC-146`, `SC-172`…) | É **catálogo de livros** (metadado + imagem), **sem lugar** da sesmaria — por isso virou **índice**, não camada | busca `siaapm.cultura.mg.gov.br/modules/brtacervo/search.php?query=sesmaria` |
| **APM — Terras Públicas** (oficial, MG) | **244 registros**; **14** nomeiam o município no título → camada `hist-terras-publicas` | O ponto é o centroide do município; piso | módulo `terras_publicas` no SIAAPM |
| **APM — Mapas de População** (oficial, MG) | **354 listas nominativas (1838-1840)**, com campo `Local`; **121** resolvem em município → camada `hist-listas-populacao`; **64** em vila mineradora do século XVIII | **Não traz a contagem** de pessoas escravizadas (exige OCR da imagem) | módulo `mapas_populacao` no SIAAPM |
| **IEPHA-MG — patrimônio tombado** (oficial, MG) | **153 bens**; **13 conjuntos rurais** (fazendas e uma usina) → camada `hist-fazendas-engenhos` | Só o que está **tombado**; **nenhum engenho de cana**; sem coordenada do bem | `apps/web/data/patrimonio-tombado-iepha.json`; fonte `iepha.mg.gov.br` |
| **Bloqueadas (medido 30/09)** | — | **Biblioteca Nacional 403** (UA honesto **e** de navegador); **Biblioteca do IBGE 403**; `dados.gov.br/api` **401**; `geoservicos.iphan.gov.br` **sem DNS** | ver P4 e P5 |
| **OpenHistoricalMap** (comunidade, CC0) | Fronteiras históricas do mundo em vetor; **13 capitanias de 1534** por relação, cada uma com data de início e fim | **Não é fonte oficial**: é wiki colaborativa — serve de **ponto de partida**, sempre conferida contra o mapa oficial | Overpass `overpass-api.openhistoricalmap.org`; dados **CC0** |

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
  tratados**. **Medido 30/09: 403** com UA honesto e de navegador (P5) — a via a reencontrar.
- **Laboratórios de cartografia histórica (USP, UFMG, UFRJ)** — acervos georreferenciados e
  artigos; o dev citou as três. **Medido 30/09:** o **CEDEPLAR/UFMG** responde 200 (programa de
  demografia achado), mas a **base histórica não está exposta** (P1b); USP e UFRJ ainda a medir.
- **INCRA — Acervo Fundiário** — o projeto **já consome** o WFS do INCRA; verificar se há
  camada de **terras devolutas / sesmarias remanescentes** além do que o globo já publica.
- **IPHAN — bens e arqueologia** — `/iphan/pt-br/acesso-a-informacao/dados-abertos` responde 200
  mas **não linka o `dados.gov.br`**; as vias úteis estão na navegação: **Banco de Bens Culturais
  Procurados (BCP)**, **Notificações de tombamento** e **Boletins Administrativos por ano** (P4).
- **Wikidata / Wikipédia** — ponte terciária para **coordenadas de evento** (revoltas),
  nunca como campo `fonte` (regra do [AGENTS.md § 7](/AGENTS.md)).

## As camadas propostas e o que já está no ar

Cada camada diz **o que prova** e **o que não prova** — e a ficha publica isso. O estado é o de
30/09/2026.

### 1. `hist-capitanias` — as capitanias hereditárias · ✅ **no ar** (13 polígonos)

- **O que é:** polígonos das capitanias de 1534-1536; recorte do Brasil.
- **Fonte:** OpenHistoricalMap (CC0), **conferida** no modelo e na contagem contra o mapa oficial
  do IBGE (Luís Teixeira, 1574).
- **O que prova:** onde a Coroa tentou dividir e administrar a costa.
- **O que NÃO prova:** que a linha tenha sido realidade no terreno — muitas capitanias
  fracassaram ou não passaram do papel.
- **O que a medição corrigiu:** as 14 doações históricas aparecem como **13 relações** no OHM (as
  duas porções do Maranhão são uma só); Pernambuco está lá como **"Nova Lusitânia"**.

### 2. Sesmarias do APM — ⚠️ **não é camada; é índice** (premissa corrigida pela medição)

- **O que a fonte dá:** o APM cataloga o **LIVRO de registro** de sesmarias (**1.726 séries**,
  ex.: `SC-106 Registro de sesmarias, 1753-1754`), **sem lugar** — não a sesmaria individual.
- **Decisão:** publicar o **índice documental** (`apps/web/data/apm-sesmarias-indice.json`), com
  notação, título, período e link — **nunca ponto inventado**. Geolocalizar sesmaria a sesmaria
  exigiria ler o índice digitalizado do livro.
- **O que provou mesmo veio de outro fundo:** as **terras públicas** (abaixo).

### 3. `hist-revoltas` — as revoltas no mapa · ✅ **no ar** (15 pontos)

- **O que é:** pontos das revoltas e lutas do acervo de memória cujo lugar o gazetteer reconhece.
- **Fonte:** o acervo do portal (Mística/Memória) + `lib/memoria/locais.ts` (coordenada do IBGE,
  conferida por teste). Gerado por `scripts/gerar-camada-revoltas.py` — a camada, a página e a
  Mística saem do mesmo dado.
- **O que prova:** onde o episódio se deu, segundo a fonte citada.
- **O que NÃO prova:** que o evento cobriu só aquele ponto — revolta é processo, não pino; e é
  **piso**: só 15 dos 533 verbetes têm lugar inequívoco.

### 4. `hist-territorio-maximo` — limites e controle máximo · ⛔ **bloqueada**

- **O que é:** traçados dos marcos — **Tordesilhas (1494)**, **Madri (1750)**, **Santo
  Ildefonso (1777)** — e a extensão de controle efetivo no século XVIII.
- **Fonte:** IBGE 500 anos (tratados) e mapas da **Biblioteca Nacional** — **medido 30/09: 403
  com UA honesto e com UA de navegador** (P5).
- **O que prova:** o desenho **como um período e um tratado o fixaram**.
- **O que NÃO prova:** presença efetiva contínua — "controle" é frágil e pontual.

### 5. `hist-divisao-municipal-<ano>` — a evolução das malhas · ⛔ **sem vetor**

- **O que é:** malhas municipais históricas (1872, 1920, 1940…) para "ver o mapa mudar".
- **Fonte:** IBGE — *Evolução da Divisão Territorial* (**publicação e mapas em PDF**; o FTP só tem
  o vetor de **2000-2025**).
- **Decisão de escopo:** sem vetor oficial, **declara a lacuna** e entrega só as imagens citáveis.

### 6. `hist-terras-publicas` — terras públicas do Império · ✅ **no ar** (14 pontos)

- **O que é:** registros da *Repartição Especial das Terras Públicas* (APM, 1854-1857) que nomeiam o
  município no título, com período e link.
- **O que NÃO prova:** a parcela no terreno — o ponto é o **centroide do município**; e é **piso**:
  244 registros no acervo, 14 nomeiam município.

### 7. `hist-fazendas-engenhos` — conjuntos rurais tombados · ✅ **no ar** (13 pontos)

- **O que é:** fazendas históricas e uma usina **tombadas** pelo IEPHA-MG, com o ato legal.
- **O que NÃO prova:** o universo das fazendas e engenhos do estado — é o que está tombado; e
  **engenho de cana não existe** neste acervo (P2).

### 8. `hist-listas-populacao` — listas nominativas (1838-1840) · 🚧 **no ar, com lacuna declarada**

- **O que é:** **121** das **354** listas do APM (habitantes, fogos, idade, estado civil,
  alfabetização e **ocupação**) que resolvem em município de MG; **64** vêm de vila/comarca
  mineradora do século XVIII (critério histórico, não a lavra moderna).
- **O que NÃO prova / não dá:** a **contagem** de pessoas escravizadas (exige OCR da imagem) e a
  lavra no mesmo lugar no século XVIII — **cruzar com o satélite seria anacronismo** (recusado).

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
| P1 | **Mineração escravizada** (Fase G): dado por município | **CRUZADO em 30/09 com critério HISTÓRICO:** 64 das 121 listas em vila/comarca mineradora do séc. XVIII; o cruzamento com a lavra moderna foi **recusado por anacronismo**. **A contagem está bloqueada na ORIGEM:** o APM não publica a imagem (só `Microfilme: MP Rolo-04/Flash 02`) — não há o que OCRizar. Caminhos: pedido ao arquivo (LAI/consulta) ou digitalização; OCR local disponível na máquina: **Ollama `qwen3-vl` 2b/4b** (sem chave) | agente | ⛔ |
| P1b | **Censo de 1872** por município e **base histórica do CEDEPLAR** | Biblioteca do IBGE devolve **403** (dois UAs); CEDEPLAR 200 mas sem base exposta → procurar a via (contato/LAI ou repositório) | agente | ⛔ |
| P2 | **Engenhos de cana** (Fase H): nenhum no IEPHA | acervos de PE/AL e **IPHAN** (a medir) | agente | ⛔ |
| P3 | **Fazendas de café** (Fase H): só as tombadas | **A via achada em 30/09:** os **Boletins Administrativos do IPHAN** (`/iphan/pt-br/centrais-de-conteudo/boletins-administrativos/<ano>`) são **PDFs semanais** (**99 em 2026**) com os atos de tombamento — é por onde se lê o inventário de fazendas/engenhos. Custo: ler PDF (não é dado tabular) | agente | 🚧 |
| P3b | **Inventário das Fazendas de Café** (publicação) | a rota é a mesma dos **Boletins** e das publicações do IPHAN (**TODO:** ver `boletins-administrativos` de 2010 e 2019, quando o inventário saiu) | agente | ⛔ |
| P4 | **IPHAN**: rota de dado em massa morta/barrada | **RESOLVIDO em 30/09 (armadilha medida):** o HTML do gov.br traz os links **escapados** (`\u002F`) — no HTML cru não aparece nenhum `href`. **Desescapando**, a página dos Boletins entrega **99 PDFs** e 700 páginas internas. O `@@search` é **JS-morto** (0 resultado no HTML); o BCP é app. Via: Boletins Administrativos por ano | agente | ✅ |
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

**Status medido 30/09/2026 — feito:** o dicionário vive em `lib/memoria/locais.ts` (movimentos) e
nos geradores (`scripts/etl/historia/marcar-zona-mineradora.py` para as vilas do ouro), sempre com a
coordenada lida do IBGE e **conferida por teste**. A dispersão determinística está nos geradores de
camada. As fontes por sondar foram medidas e registradas na tabela de pendências. **Falta só a P9**
(leitura de "maiores"), que é decisão do dev.

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

**Status medido 30/09/2026 — ⛔ bloqueada:** a **Biblioteca Nacional** devolve **403 com UA
honesto e com UA de navegador** (`bndigital.bn.gov.br` e `bn.gov.br/acervo`), e a **Biblioteca do
IBGE** também (403). Sem a cartografia digital dos tratados, a camada não nasce: desenhar à mão
seria inventar fronteira. Fica na **P5**.

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
- **Próximo passo natural:** ~~cruzar as 121 listas com as áreas de mineração~~ — **substituído
  pelo critério acadêmico abaixo**, feito no mesmo dia: o cruzamento com a lavra moderna foi
  **recusado por anacronismo**, e o que se fez foi o cruzamento **histórico** (vila/comarca do
  ouro do século XVIII).

**Critério acadêmico do cruzamento (pedido do dev: "com cuidado, revisando critério
acadêmico científico") — feito em 30/09:**

- **O cruzamento que se fez é HISTÓRICO:** o dicionário das **vilas e comarcas do ouro do
  século XVIII** (`scripts/etl/historia/marcar-zona-mineradora.py`) marca a lista cujo
  município pertenceu a uma vila mineradora — **64 das 121** listas caem em vila/comarca
  (Vila Rica, Rio das Velhas, Rio das Mortes, Serro do Frio, Pitangui, Paracatu). Fonte:
  IBGE *Brasil: 500 anos*; Prado Júnior (1942); Revista do Arquivo Público Mineiro.
- **O cruzamento que se RECUSOU, e por quê:** cruzar as listas de 1838-1840 com a
  **mineração detectada por satélite** (1995-2024) e concluir "mineração escravizada".
  São dois dados verdadeiros separados por 150 anos — juntos, sugerem um terceiro falso.
  **Anacronismo**, vedado pela regra editorial (AGENTS § 7). A recusa está escrita na tela.
- **A ressalva da historiografia, publicada junto:** em 1838-1840 a economia escravista de
  Minas já era **majoritariamente agrária**, não de lavra (MARTINS, Roberto Borges. *A
  economia escravista de Minas Gerais no século XIX*. CEDEPLAR/UFMG, 1982). A lista vem de
  lugar que **foi** minerador; o trabalho escravizado do período era, em boa parte, rural.
- **O que a fonte ainda não dá:** a **contagem** de pessoas escravizadas — exigiria OCR da
  imagem de cada lista. Fica declarado como pendência.

**OCR — o que existe nesta máquina, medido em 30/09 (resposta ao dev):**

- **Local, sem cadastro e sem chave:** há caminho — mas **não há OCR clássico instalado**:
  falta o binário do **Tesseract** (o `pytesseract` existe, o motor não), e não há
  **PaddleOCR** nem **RapidOCR** (os pares chineses, `pip`, sem cadastro). O que **há**:
  `transformers` 5.5, `torch` 2.5.1+cu121, `PIL`, `pypdf` e **PyMuPDF**, e o **Ollama com
  `qwen3-vl:2b` e `qwen3-vl:4b` já baixados** — VLM local, sem chave.
- **Nuvem chinesa (Baidu/Tencent) exige chave/cadastro** → excluída pela regra do dev.
- ⚠️ **Mas o OCR está bloqueado na ORIGEM, não na ferramenta:** o APM **não publica a
  imagem** das listas — o item traz só `Microfilme: MP Rolo-04/Flash 02`. Sem scan on-line,
  não há o que OCRizar: a contagem exige pedido ao arquivo (LAI/consulta) **ou** a
  digitalização. Por isso o caminho prático hoje é **ler os Boletins do IPHAN** (Fase H),
  que **já têm camada de texto** — sem OCR.

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

**Status medido 30/09/2026 — ✅ feito:** a página `/historia` está no ar com **cinco tabelas**
(capitanias, revoltas — com o botão "Voe até aqui" —, fazendas tombadas, terras públicas e listas
nominativas), lendo as camadas por `lib/historia/camadas.ts` (o mesmo `.geojson` do globo), com
busca, ordenação e CSV por tabela, e a seção do **critério do cruzamento**. As sete camadas estão
registradas no painel do globo; sentinelas em **63 fontes / 59 linhas**. **Resta a P8** (o próprio
dev conferir a acessibilidade AA no dev server).

## Regras editoriais específicas

1. **História não acusa.** O portal publica o documento e o mapa; o juízo é do leitor e da
   historiografia — nunca uma manchete do portal.
2. **Data e autor no desenho.** Nenhum polígono/linha sai sem ano, obra e autoria.
3. **Aproximação declarada.** Fronteira histórica é traçado aproximado; a ficha escreve isso.
4. **Nunca somar bases diferentes** (capitanias × sesmarias × municípios — três perguntas).
5. **Lugar por dicionário, jamais por forma.** O que não casar fica `null` e visível.
6. **Fonte primária primeiro:** IBGE, APM, Biblioteca Nacional; comunidade (OHM) e Wikipédia
   só como **partida**, com a conferência oficial registrada.
7. **Anacronismo é proibido.** Não cruzar dados de séculos diferentes como se fossem o mesmo
   fato (ex.: lista de 1838 × lavra detectada por satélite em 2024). O cruzamento válido é o
   **histórico**, com o ano em cada ponta — e a recusa fica escrita na tela.
8. **Contagem só quando a fonte conta.** "Lista nominativa" não é "N pessoas escravizadas": o
   número exigiria ler o documento. Sem leitura, publica-se o documento, nunca o total.
9. **Preço/etiqueta:** toda camada com fonte, data, autor, licença e natureza; o método
   (centroide, piso) viaja no arquivo e na ficha.

## Riscos e o que NÃO fazer

| Risco | O que fazer |
|---|---|
| Mapa de 1574 lido como fronteira exata | escrever "traçado histórico aproximado" na ficha e no rótulo da camada |
| "Controle máximo" sem ano virar manchete | sempre com o tratado e o ano; nunca "o Brasil era X" |
| Nome de sesmeiro tratado como dado pessoal | é ato oficial; publicar como o ato traz, **sem CPF/CNPJ** e sem cruzar com base de pessoa |
| Casar arraial/freguesia por nome | dicionário documentado; divergência declarada |
| **Cruzar séculos diferentes** (lista de 1838 × satélite de 2024) e sugerir "mineração escravizada" | recusar e **escrever a recusa** na tela; o cruzamento válido é com a vila mineradora do século XVIII |
| Publicar "N escravizados" a partir do catálogo | o catálogo descreve o documento; só a leitura da imagem dá o número — e ela não existe ainda |
| Copiar o OpenHistoricalMap como se fosse oficial | conferir contra o mapa oficial; divergência escrita |
| Camada pesada derrubar o globo | nascer desligada; teto de payload (AGENTS § 5.1) e GeoJSON simplificado |
| Sobrepor "história" a "denúncia" na mesma tela | assunto próprio no globo (`ASSUNTOS`), cor e grupo separados |

## Decisões registradas

- **Dev, 30/09/2026:** publicar **"voe até aqui"** na Mística do Dia, na linha do tempo e em
  outras páginas, e dar **contexto histórico/educativo** ao clicar no local — atendido na Fase 0
  e ligado em `/historia`, `/memoria` e `/mineracao/ilegal`.
- **Dev, 30/09/2026:** somar **artigos acadêmicos** de Geografia, História e Antropologia para
  caracterizar e localizar — feito: bibliografia de trabalho registrada, com o link canônico
  como pendência (P7).
- **Dev, 30/09/2026:** cruzar as listas com a mineração **"com cuidado, revisando critério
  acadêmico científico"** — feito: cruzamento **histórico** (vila/comarca do ouro), com a recusa
  do cruzamento anacrônico **escrita** na página.
- **Dev, 30/09/2026:** reportar o **custo da sessão em yuan** a cada fase concluída. Medido na
  telemetria do opencode (tabela `session`); a moeda/tabela do provedor é a **P11**.
- **Dev, 30/09/2026:** registrar as **pendências para resolver depois** — a tabela
  [Pendências a resolver](#pendências-a-resolver).
- **Agente, 30/09/2026:** leitura de "maiores" como maior extensão de controle (P9, a confirmar);
  OpenHistoricalMap entra como ponto de partida CC0, nunca como fonte oficial.
- **Vale a regra da casa:** evidência histórica é **documento público com fonte e data**;
  dado de pessoa só como o ato oficial o traz.

## Origem

- Pedido do dev em 30/09/2026 (chat).
- Medições de 30/09/2026: IBGE (Brasil 500 anos; Catálogo de Metadados geo; malhas API v3 e
  FTP), Arquivo Público Mineiro (SIAAPM, Seção Colonial e Terras Públicas) e OpenHistoricalMap
  (Overpass). Infra de camadas do globo: [plano-geolocalizacao-camadas-globo-3d.md](plano-geolocalizacao-camadas-globo-3d.md).
