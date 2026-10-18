# PLANO — Plataforma Rio Doce: o modelo do Projeto Brumadinho dentro do Controle Popular

> **Arquivado em 18/10/2026** na consolidação de planos. O que restava
> de pendência foi absorvido pelos planos integrados em `docs/planos/`.


> **Tipo:** PLANO
> **Domínio:** global
> **Última medição:** 2026-10-12
> **Leitura estimada:** longa (> 15 min)
> **Relacionados:** [ESTADO.md](../../02-estado/ESTADO.md), [PRODUTO.md](../../01-produto/PRODUTO.md), [FONTES.md](../../06-fontes/FONTES.md), [ARQUITETURA.md](../../04-arquitetura/ARQUITETURA.md), [OPERACAO.md](../../05-operacao/OPERACAO.md), [PLANO-INTEGRACAO-BRUMADINHO.md](/docs/historico/entregas/PLANO-INTEGRACAO-BRUMADINHO.md), [PLANO-INGESTAO-PARAOPEBA.md](/docs/historico/entregas/PLANO-INGESTAO-PARAOPEBA.md), [AGENTS.md](/AGENTS.md)
> **Palavras-chave:** rio doce, mariana, fundao, samarco, reparacao, brumadinho, datajud, processos, busca, geoserver, semad, wfs, globo-3d, ocr, pdfplumber, glm-ocr, renova, ttac, hub, zona, payload, dado-pessoal

## Sumário

- [O que o dono pediu e o que foi decidido](#o-que-o-dono-pediu-e-o-que-foi-decidido)
- [O modelo Brumadinho em 11 passos](#o-modelo-brumadinho-em-11-passos)
- [O mesmo em Controle Popular, passo a passo](#o-mesmo-em-controle-popular-passo-a-passo)
- [O que já existe hoje (medido)](#o-que-já-existe-hoje-medido)
- [Fase 0 — levantamento medido de fontes](#fase-0--levantamento-medido-de-fontes)
- [Arquitetura alvo da zona `/riodoce`](#arquitetura-alvo-da-zona-riodoce)
- [Fases de construção](#fases-de-construção)
- [Regras que este plano obedece](#regras-que-este-plano-obedece)
- [Verificação em camadas](#verificação-em-camadas)
- [O que este plano NÃO decide](#o-que-este-plano-não-decide)
- [Lacunas declaradas](#lacunas-declaradas)
- [Decisões registradas](#decisões-registradas)
- [Origem / Histórico](#origem--histórico)

## O que o dono pediu e o que foi decidido em 12/10/2026

Pedido do dono: **fazer para o caso do Rio Doce o mesmo que o Projeto Brumadinho
UFMG fez para Brumadinho** — plataforma de acesso a processos, documentos, busca
e dados espaciais — e integrar isso ao Controle Popular.

Três decisões tomadas com o dono em 12/10/2026:

1. **Zona nova `/riodoce`**, hub irmão do `/paraopeba` (cada desastre vira uma zona);
2. **Fase 1 = busca + processos** (o núcleo do Brumadinho vem primeiro);
3. **Escopo desta sessão = este plano + linha na fila do ESTADO + push.**

⚠️ **O PDF `CHAMADA 01 PROJETO BRUMADINHO.pdf` não pôde ser lido** — este
modelo não aceita entrada de PDF. O que se usou foi o **diagrama de fluxo de
dados enviado como imagem** (o mesmo da Chamada 01) e a plataforma pública ao
vivo. Se o texto integral do edital for necessário, extraia com `pdftotext` ou
GLM OCR e cole o `.txt`.

## O modelo Brumadinho em 11 passos

O Projeto Brumadinho UFMG (projeto técnico-científico de extensão que apoia a
Justiça de Minas no caso da barragem de Brumadinho) publica uma plataforma com
três eixos: **busca combinada** (palavras-chave, temas, localidade, tempo),
**processos** (visão hierárquica dos autos) e **dados espaciais** (IDE/GeoNode).
O diagrama de fluxo da Chamada 01 descreve 11 passos, em cinco colunas:

- **Tipos de dados:** textos PDF, imagens, vídeos, dados geográficos, dados tabulares;
- **Fontes:** processos (PJe), partes, subprojetos, Comitê Técnico-Científico (CTC);
- **Aquisição (1, 2, 3, 6):** monitoramento do PJe e download de documentos,
  upload das partes, envio dos subprojetos, publicações do CTC;
- **Back-end (4, 5, 7, 8, 9, 10):** extrator PDF→TXT em Python, PostgreSQL de
  metadados, repositório de texto com URI por documento, **Solr** de busca,
  **PostGIS** geográfico, **GeoNode** como IDE com serviços OGC;
- **Front-end (11):** Drupal servindo o portal — consulta aos textos dos
  processos, busca simples e avançada, linha do tempo, serviços geoespaciais,
  visualização e infográficos.

A plataforma vive em `plataforma.projetobrumadinho.ufmg.br` (medido ao vivo em
12/10/2026: home, `/about` e `/search` respondem; o conteúdo é SPA em JavaScript).
O acervo de processos, medido em 2026-08-13, tem **7.107 documentos de 16
processos distintos** — detalhe em
[PLANO-INTEGRACAO-BRUMADINHO.md](/docs/historico/entregas/PLANO-INTEGRACAO-BRUMADINHO.md).

## O mesmo em Controle Popular, passo a passo

| Passo do Brumadinho | O que é lá | O mesmo aqui | Estado |
|---|---|---|---|
| 1 | Equipe monitora o PJe, baixa documentos, gera metadados e URI | **API Pública do DataJud (CNJ)** consultada ao vivo — cliente já existe (`lib/judiciario/datajud.ts` + rota `app/api/datajud/route.din.ts`) | cliente ✅, **falta tela** |
| 2 | Partes fazem upload de documentos com autenticação | Portal não autentica cidadãos — **fora de escopo**, declarado | ❌ não faz |
| 3 | Subprojetos enviam relatórios, mapas e dados científicos | Relatórios da **Fundação Renova**/TTAC, dados do **CKAN MG** (`portal_mariana`), camadas da **SEMAD** via WFS | coleta própria com checkpoint |
| 4 | Extrator PDF→TXT em Python | `scripts/probrumadinho-extrair-texto.py` (pdfplumber) + **GLM OCR** no PDF digitalizado, CPF mascarado antes de qualquer IA | ✅ reuso, adaptar |
| 5 | PostGIS + serviços espaciais ISO/OGC | Globo 3D + `lib/terras/camadas.ts` + proveniência (`scripts/gerar-proveniencia-globo.mjs`); **não usamos PostGIS** — o GeoJSON vai versionado e comprimido | consumidor do WFS da SEMAD |
| 6 | CTC publica notícias, chamadas e resultados | Fontes oficiais (MPMG, MPF, imprensa) + `data/noticias-vale.json` já versionado; o portal é o publicador | parcial ✅ |
| 7 | PostgreSQL como gerenciador de metadados | Heroku Postgres + Drizzle (134 tabelas, medido 04/10) para o que é consulta; **acervo pesado** em JSON versionado com agregado `COBERTURA_*` | ✅ padrão da casa |
| 8 | Repositório de texto, cada documento com URI | `apps/web/data/riodoce/*.json` + **link canônico à fonte oficial** em cada item (a "URI" nossa é o link da qualidade 1) | a criar |
| 9 | Solr indexa texto + metadados, ranqueia | **Índice estático da `/busca`**: radical `ts_lexize('portuguese_stem')` do próprio Postgres + prefixo + distância de edição (`lib/busca/indice.ts`) | ✅ motor pronto, falta a zona |
| 10 | GeoNode organiza e serve os dados espaciais | Consumimos o **WFS da SEMAD** (`geoserver.meioambiente.mg.gov.br/IDE`) — a mesma infra que já serve `zas-barragens`; não publicamos IDE própria | ✅ protocolo provado |
| 11 | Drupal: portal com busca, linha do tempo, mapas, infográficos | **Hub Next.js `/riodoce`** reusando `TabelaEstatica`, `BotoesExportar`, `LinhaDoTempo`, `ResumoExpandivel`, globo 3D | a criar |

**Diferença central e honesta:** a plataforma Brumadinho é de uma universidade
com acesso ao PJe e publica metadado + resumo dos autos. Nós **não espelhamos
autos** — o Termo de Uso do DataJud veda republicar derivado do acervo, e esta
regra já está gravada no cabeçalho de `lib/judiciario/datajud.ts`. Nosso papel é
**consultar ao vivo, catalogar as fontes oficiais e linkar**.

## O que já existe hoje (medido)

| Ativo | Caminho | O que tem |
|---|---|---|
| Execução do Acordo em MG | `app/ambiental/mariana/` + `lib/ambiental/ckan-mg-mariana.ts` | `COBERTURA_ACORDO_RIO_DOCE`: 532 empenhos, 40 iniciativas, 14 órgãos; totais na constante — **remeça antes de citar em tela** |
| Acordos de reparação por município | `data/acordos-reparacao-mg.json` + `lib/acordos/reparacao-mg.ts` (+ teste) | 2 acordos, municípios destaque |
| Notícias da Vale | `data/noticias-vale.json` + rota `/paraopeba/noticias-vale` | 38,2 KB versionados |
| Casos MPMG/MPF | `data/mpmg-coerdoce.json`, `data/mpf-grandes-casos.json` | ligação direta MPMG × Comitê Rio Doce |
| Biblioteca de desastres | `data/biblioteca-desastres-unificada.json` | 758,5 KB de acervo já unificado |
| Cliente DataJud | `lib/judiciario/datajud.ts` (+ `datajud.test.ts`) | consulta viva, chave pública, teto de 20 por página, **sem gravação alguma** |
| Busca do portal | `lib/busca/indice.ts` + `scripts/gerar-indice-busca.mts` | radical do PG, 4 facetas reutilizáveis, zona por `f` |
| Camadas no globo | `lib/terras/camadas.ts` + `scripts/gerar-proveniencia-globo.mjs` | WFS da SEMAD já é a mesma infra (`zas-barragens`) |
| Linha do tempo | `app/paraopeba/linha-do-tempo/LinhaDoTempo.tsx` | componente pronto para reuso |
| Extrator de PDF | `scripts/probrumadinho-extrair-texto.py` | pdfplumber + mascarar CPF + resumo rotulado |
| Memória do assistente | `lib/assistente/arvore-galhos.ts` | nós `ter-mariana` e `ter-brumadinho` já existem |
| Navegação | `app/components/TopNav.tsx:97` | "Repactuação Rio Doce (Mariana)" → `/ambiental/mariana` |

O **molde de hub** é o `/paraopeba` (Brumadinho): 16 subrotas, layout próprio,
dado em `lib/paraopeba/`. O **molde de hub completo** (com `BuscaUniversal` e
`FooterGlobal`) é o `/judiciario`.

## Fase 0 — levantamento medido de fontes

Nada entra no código sem medição com data. Esta fase é barata e destrava todas
as outras.

### O que já medimos em 12/10/2026 (nesta sessão)

| Fonte | Probe | Resultado medido |
|---|---|---|
| SEMAD/IDE (WFS) | `GetCapabilities` de `geoserver.meioambiente.mg.gov.br/IDE/ows` | HTTP 200, **1.006.114 bytes**, **1.420 camadas** com prefixo `IDE:` |
| Mancha real do Fundão | `GetFeature typeName=IDE:ide_250101_do_mancha_inund_fundao_pol resultType=hits` | HTTP 200, **`numberMatched="1243"`** — 1.243 feições |
| Famílias do Rio Doce no mesmo WFS | grep no capabilities | `ide_240205_mg_altodoce_*` (11), `ide_240208_mg_gualaxon_*` (16), `ide_210603_mg_*_riodoce_pol` (2), `ide_210604_mg_analise_car_*_doce_pol` (~10) |
| DataJud (CNJ) | `POST api_publica_tjmg/_search` com `orgaoJulgador.codigoMunicipioIBGE=3144805` | HTTP 200, `took` **38.765 ms**, `total ≥ 10.000`. ⚠️ **Cuidado medido:** o 1º hit veio da "3ª Câmara Cível" com esse código IBGE — **filtro por município não equivale a vara de Mariana** |
| Portal da Transparência da Renova | `GET transparencia.fundacaorenova.org/inicio` | HTTP 200, 116.309 bytes, `robots: follow` |
| GIS da Renova | `GET gis.fundacaorenova.org/portaltransparenciaapp/` | HTTP 200 — SPA; **API por trás não medida** |
| Situação jurídica recente | demonstrações financeiras da Fundação Renova (15/10/2025), lidas via busca em 12/10 | Novo Acordo do Rio Doce homologado pelo STF em **06/11/2024**; Renova em liquidação, encerramento aprovado em **20/10/2025**; Samarco assume a condução; TTAC celebrado em **02/03/2016** |

### O que falta medir (comandos prontos)

1. **Processos-chave da reparação.** Achar os números CNJ dos processos do
   Fundão/Acordo (TTAC, Novo Acordo, ACPs) e testar cada um no DataJud:

   ```powershell
   curl.exe -s -X POST "https://api-publica.datajud.cnj.jus.br/api_publica_tjmg/_search" `
     -H "Authorization: APIKey <chave-publica-em-lib/judiciario/datajud.ts>" `
     -H "Content-Type: application/json" `
     -d '{\"query\":{\"match\":{\"numeroProcesso\":\"<20 digitos>\"}},\"size\":1}'
   ```

   Se o número não existir no índice público, montar lista por
   `classeCodigo`/`assuntoCodigo` e **declarar a lacuna** — nunca inventar número.
2. **API por trás do GIS da Renova.** Testar caminhos de serviço comuns
   (`/arcgis/rest/services`, `/sharing/rest`, JSON de `portaltransparenciaapp`);
   se não houver API, registrar coleta HTML→CSV com checkpoint.
3. **Licença camada a camada** das famílias Rio Doce: abrir o metadado de cada
   camada no GeoNetwork da SEMAD (mesmo procedimento do plano de Brumadinho —
   lá só 2 de 8 foram confirmadas, lacuna que **não queremos repetir**).
4. **Contagem e peso** das camadas candidatas (só a mancha do Fundão foi
   contada hoje): `GetFeature resultType=hits` por `typeName`.
5. **CKAN do MG:** procurar dataset da Repactuação 2026 além do
   `portal_mariana` já integrado.
6. **Qualidade da água:** informativo mensal da Renova (PDF) vs IGAM/InfoHidro
   — o InfoHidro já é lacuna declarada no plano de Brumadinho, confirmar se
   segue sem API.
7. **Entrega da fase:** novo documento `docs/06-fontes/FONTES-RIO-DOCE.md`
   (Tipo: FONTE) com cada endpoint, resposta e data — mais a linha no
   [FONTES.md](../../06-fontes/FONTES.md).

## Arquitetura alvo da zona `/riodoce`

### Rotas

| Rota | O que mostra | Fase |
|---|---|---|
| `/riodoce` | hub: o que é, cartões de cobertura, mapa das frentes, chamadas às subrotas | F1 |
| `/riodoce/processos` | **processos-chave** (números medidos, estático) + "consultar movimentações ao vivo" via `/api/datajud` | F1 |
| `/riodoce/busca` | busca combinada da zona: texto + facetas (tipo, tema, período, município) | F1 |
| `/riodoce/documentos` | biblioteca de relatórios, atos e deliveráveis (TTAC, Renova) com busca, ordenação e CSV | F3 |
| `/riodoce/linha-do-tempo` | linha do tempo do caso, reusando `LinhaDoTempo` | F4 |
| `/riodoce/dados-espaciais` | tabela das camadas SEMAD + deep-link `?camada=` para o globo 3D | F2 |
| `/riodoce/indice` | índice A–Z das páginas da zona | F5 |

- **Layout enxuto ou completo:** propomos **completo** (`BuscaUniversal` +
  `FooterGlobal`), ao contrário do `/paraopeba` que é enxuto por decisão de
  22/08 — o `/riodoce` nasce como porta de entrada nova e quer busca de zona.
  O dono pode vetar.
- **Não duplicar:** a execução financeira em MG continua em
  [`/ambiental/mariana`](../../06-fontes/FONTES.md) — o hub `/riodoce` apenas
  linka para ela (mesma régua de "um número, uma fonte").

### Dado

- Fonte bruta em `apps/web/data/riodoce/*.json`, **sempre com agregado
  `COBERTURA_RIO_DOCE`** exportado à parte; página de servidor importa o
  agregado, nunca o array inteiro (§5.1 — `/ambiental/legislacao` chegou a
  35,5 MiB);
- acervo acima de ~2 mil linhas vai fatiado pelo pipeline
  `lib/estatico/compactar.ts` → `fatiar.ts` → `emitir.ts` → `TabelaEstatica`;
- módulos em `apps/web/lib/riodoce/<mod>.ts` com teste ao lado
  (`<mod>.test.ts`), cabeçalho explicando o "porquê" (§5.9);
- **coletor novo que grava JSON entra em `DIRETORIOS_DADO`** de
  `scripts/checar-dado-pessoal-em-dado.py` antes do primeiro commit (§5.2).

### Navegação e assistente (os registros obrigatórios)

1. `app/components/TopNav.tsx` — entrada do menu;
2. `app/components/FooterGlobal.tsx` — `LINKS_PORTAL`;
3. `lib/zonas.ts` — href **absoluto**, sempre em `<a>` cru, nunca `<Link>`
   (bug já aconteceu 3×);
4. `lib/eixos/catalogo.ts` — subfrente de águas/desastres junto ao `/paraopeba`;
5. `lib/busca/paginas-portal.ts` — senão a zona não aparece na busca global;
6. `lib/seo/contexto-pagina.ts` — sugestões do Seu Nonô por rota;
7. `app/components/SeuNonoData.ts` — `PAGINAS_DADOS` e `FRENTES`;
8. `lib/assistente/arvore-galhos.ts` — nó `ter-riodoce` ligado a `ter-mariana`;
9. `scripts/gerar-rotas-sitemap.mts` — sitemap;
10. regenerar o índice: `npx tsx --env-file=.env.local scripts/gerar-indice-busca.mts`
    (índice é gitignorado, **sempre regerar**).

### Busca (o "Solr" deles, o nosso)

- **Zona nova `f: "riodoce"`** no índice de `/busca`, reaproveitando o mesmo
  pipeline de radicalização — o motor não muda, muda a fonte alimentada;
- **busca da zona** em `/riodoce/busca` com as facetas reutilizáveis
  (`TIPOS_FILTRO`, `PERIODOS`, `docTemTipo`, `docPassaPeriodo`) — o `select`
  de `BuscaClient.tsx` é o molde;
- busca textual só ativa quando **todas as fatias chegaram** (armadilha
  registrada em `TabelaEstatica`);
- **sem `useSearchParams()`** — ler `window.location.search` em efeito e
  gravar com `history.replaceState`.

## Fases de construção

| Fase | Entrega | Tamanho | Verificação |
|---|---|---|---|
| **F0 — fontes** | `FONTES-RIO-DOCE.md` com endpoints medidos e datados | 2–3 h de terminal | cada probe com resposta e data |
| **F1 — busca + processos** (decidida) | zona `/riodoce` no ar, `/riodoce/processos` com DataJud ao vivo, zona `f` na `/busca` | 2–3 sessões | `tsc`, `eslint`, `sem-cpf-no-repo.test.ts`, `test:lib -- --changed` |
| **F2 — dados espaciais** | camada da mancha do Fundão + demais camadas medidas no globo, página com tabela das camadas | 1–2 sessões | contagem de feições bate com o `GetFeature`; proveniência com fonte e data |
| **F3 — biblioteca** | `/riodoce/documentos` com extração pdfplumber + GLM OCR, CPF mascarado antes de IA, resumo rotulado | 2+ sessões | `checar-dado-pessoal-em-dado.py` limpo; CSV do que está filtrado |
| **F4 — linha do tempo** | `/riodoce/linha-do-tempo` com datas checadas em fonte oficial | 1 sessão | toda data da tela tem link à fonte |
| **F5 — assistente** | 5 registros do Seu Nonô + índice regenerado + top-100 | 1 sessão | golden set do assistente verde |
| **F6 — publicação** | suíte completa, CodeScene 10, deploy **só com permissão do dono** (§5.7.1, via `azure-mirror.yml`) | contínua | `npm test` na raiz |

**Ordem já decidida:** F0 → F1 (busca + processos) → F2 → F3 → F4 → F5 → F6.

Detalhes que a F1 precisa resolver (todos medidos hoje):

- **Latência do DataJud: 38,7 s** numa consulta de órgão julgador. A tela
  precisa de estado de carregamento visível e aviso de espera; o cache em
  memória do cliente cobre repetição em rajada, não a primeira chamada;
- o DataJud **exige critério** (nunca `match_all`) e a rota tem teto de 20
  resultados por página — é consulta pontual, não varredura;
- **nenhuma gravação**: resultado do DataJud não vira arquivo, tabela nem
  cache em disco (Termo de Uso CNJ, cláusulas 3.8/3.9);
- a lista de processos-chave é **só número + classe + órgão** (metadado
  público), checada na Fase 0, com aviso na tela de que a movimentação é
  consultada ao vivo.

## Regras que este plano obedece

| Regra | O que obriga aqui | Onde |
|---|---|---|
| 7 qualidades da informação | link à fonte, busca, ordenação, cartões de topo com agregado datado, Seu Nonô, CSV com BOM, responsivo | [AGENTS.md § 8](/AGENTS.md) |
| Celular é a régua | `<main>` com `w-full`, tabela/gráfico em `overflow-x-auto`, verificação em 390 px | [AGENTS.md § 5.14](/AGENTS.md) |
| Payload | coleção nunca como prop de cliente; fatiar acima de ~2 mil linhas | [AGENTS.md § 5.1](/AGENTS.md) |
| Dado pessoal | varrer o **dado ingerido**, não só o código; CPF por mod-11 redigido antes de qualquer IA | [AGENTS.md § 5.2](/AGENTS.md) |
| Editorial | "documento que CITA", nunca "sobre"; lacuna é informação; resumo de máquina rotulado; dois dados verdadeiros lado a lado podem inferir um terceiro falso | [AGENTS.md § 7](/AGENTS.md) |
| DataJud | consulta viva, sem derivado republicado | cabeçalho de `lib/judiciario/datajud.ts` |
| Código comentado | cabeçalho de arquivo, o "porquê" de cada função, PT-BR | [AGENTS.md § 5.9](/AGENTS.md) |
| IA local | triagem/OCR em volume vai para Ollama/GLM local, com `format: "json"` e validação; nada de segredo ou dado pessoal em prompt | [AGENTS.md § 5.12](/AGENTS.md) |
| Publicação | push é livre; **deploy só com permissão** — Azure: `gh workflow run azure-mirror.yml --ref main` | [AGENTS.md § 5.7.1](/AGENTS.md) |

## Verificação em camadas

**Todo commit (segundos):**

```bash
cd apps/web
npx tsc --noEmit
npx vitest run lib/sem-cpf-no-repo.test.ts
npx eslint <arquivos do diff>
```

**Se o diff tocar `lib/`:** `npm run test:lib -- --changed HEAD` (de `apps/web`).

**Se mexeu em `docs/`:** `python scripts/validar-documentacao.py`.

**Antes do push:** `npm test` na raiz (baseline: 2.134 testes vitest, 30/09)
e o CodeScene do pré-commit (`cs delta --git-hook --staged`, meta 10,00).

## O que este plano NÃO decide

- **Espelhar autos/processos em disco** — proibido pelo Termo de Uso do CNJ;
  se algum dia for pedido, é decisão nova do dono, registrada aqui;
- **R2 vs Static Assets** para a biblioteca pesada (mesma abertura do
  arquivo de fontes — teto de 25 MiB por arquivo);
- **Nome exato das subrotas** — as sete acima são proposta, o dono ajusta;
- **Custo/chave do GLM OCR** — a chave mora em `.env`, nunca no repo (§5.8);
- **Deploy** — só após ordem explícita (§5.7.1).

## Lacunas declaradas

- **O PDF da Chamada 01 não foi lido** (modelo sem suporte a PDF); base foi o
  diagrama em imagem + a plataforma pública;
- **A API por trás de `gis.fundacaorenova.org` não foi medida** — só o HTTP 200
  da SPA;
- **Licença camada a camada** das famílias Rio Doce no WFS da SEMAD não foi
  confirmada (só a existência e o `GetCapabilities`);
- **Números dos processos-chave não foram levantados** — é o primeiro item da
  Fase 0;
- **Só a mancha do Fundão foi contada** (1.243 feições); as demais camadas
  candidatas não têm contagem nem tamanho medidos;
- **Filtro IBGE do DataJud não localiza vara** (medido: câmara cível veio no
  resultado) — achar os órgãos julgadores certos é trabalho da Fase 0;
- **Dataset da Repactuação 2026 no CKAN** não foi verificado hoje.

## Decisões registradas

| # | Decisão | Quem / quando |
|---|---|---|
| 1 | Zona nova `/riodoce`, hub irmão do `/paraopeba` | dono, 12/10/2026 |
| 2 | Fase 1 = busca + processos | dono, 12/10/2026 |
| 3 | Esta sessão entrega plano + linha na fila do ESTADO + push | dono, 12/10/2026 |
| 4 | DataJud sempre ao vivo, nunca derivado em disco | herdada (cabeçalho de `datajud.ts`) |
| 5 | Upload de partes (passo 2 do diagrama) fora de escopo | deste plano |
| 6 | Layout do hub proposto completo (`BuscaUniversal` + `FooterGlobal`) | dev, 12/10/2026 — aberto ao veto do dono |

## Origem / Histórico

- Diagrama de fluxo de dados da **Chamada Pública Interna Induzida nº 01/2019 —
  Projeto Brumadinho UFMG**, enviado pelo dono como imagem em 12/10/2026
  (o PDF original não é legível por este modelo);
- plataforma pública ao vivo (`plataforma.projetobrumadinho.ufmg.br`), medida
  em 12/10/2026;
- [PLANO-INTEGRACAO-BRUMADINHO.md](/docs/historico/entregas/PLANO-INTEGRACAO-BRUMADINHO.md)
  e [PLANO-INGESTAO-PARAOPEBA.md](/docs/historico/entregas/PLANO-INGESTAO-PARAOPEBA.md)
  — o que já foi medido e entregue para o caso Brumadinho;
- sondagens desta sessão: WFS da SEMAD, DataJud, Portal da Transparência da
  Fundação Renova (todas em 12/10/2026, com resposta registrada na Fase 0).