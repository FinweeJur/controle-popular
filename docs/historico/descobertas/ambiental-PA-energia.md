# Ambiental PA — energia: o que existe de dado público sobre geração, transmissão, CFURH e petróleo/gás no Pará

> **Tipo:** HISTORICO / descoberta
> **Domínio:** ambiental-PA / energia
> **Data da medição:** 17/11/2026
> **Método:** `GET` simples com `curl`, sem navegador, sem JS executado, sem token (**45 requisições** no total, 1–2 s entre chamadas ao mesmo host)
> **User-Agent usado:** `finweejur/github artur colito` (honesto, sem UA de navegador)
> **Status:** descoberta. **Nenhum coletor foi escrito**, nada foi gravado em banco nem em `apps/web/data`, nada foi commitado.
> **robots.txt lidos antes de coletar:** `www.gov.br/robots.txt` (200, 2.102 B — libera `/anp/` e `/epe/`, proíbe só `/economia/pt-br/internet/*`, `/ebserh`, `/mre` e views de formulário), `www.epe.gov.br/robots.txt` (200, 535 B — proíbe `/_layouts/`, `*.aspx`, `/pt/acesso-restrito/`, `/es/`), `dadosabertos.aneel.gov.br` é API CKAN pública sem `robots.txt` restritivo.

## Sumário

- [1. Resposta curta](#1-resposta-curta)
- [2. URLs sondadas ao vivo](#2-urls-sondadas-ao-vivo)
- [3. O que é coletável hoje](#3-o-que-é-coletável-hoje)
- [4. O que está bloqueado e por quê](#4-o-que-está-bloqueado-e-por-quê)
- [5. Veredito por fonte](#5-veredito-por-fonte)
- [6. Armadilhas para quem for escrever o coletor](#6-armadilhas-para-quem-for-escrever-o-coletor)
- [7. Já existe algo no repo?](#7-já-existe-algo-no-repo)

## 1. Resposta curta

**Existe muito dado aberto de energia do Pará, e ele é bom — mas não onde se costuma procurar.**

Três achados que mudam o desenho do portal:

1. **CFURH por município é o melhor dado de energia do Pará que apareceu**: 1.435.782 registros nacionais, **3.963 linhas do PA**, com **`CodMunicipioIBGE`** e os valores pagos a estado, município, ANA e total, mês a mês, desde **1996-11 até 2026-07**. Somando `VlrPagoMunicipio` do PA: **R$ 2.834.586.968,36** em 30 anos. É dinheiro público rastreável por município — a manchete mais forte do conjunto.
2. **SIGA (ANEEL) entrega o cadastro de geração inteiro em um CSV de 7,8 MB**: 25.046 empreendimentos no Brasil, **13.206 no PA**, com potência outorgada/fiscalizada, fase, município, sub-bacia e regime de participação. Confirma Belo Monte (11.233.100 kW) e Tucuruí (853.500 kW) — e revela que **13.110 dos 13.206 registros do PA são UFV somando só 37 MW**: autorização de solar não é usina construída.
3. **ANP é o oposto**: para petróleo e gás o Pará é **exploração sem produção**. A série oficial de produção por estado (1997–2026) tem **zero linhas do PA**, o cadastro de campos produtores tem **zero campos do PA**, e ainda assim **17 municípios paraenses receberam R$ 451.484,51 em royalties em 2025** — royalties de campos offshore, não de produção local. Essa contradição é pauta por si.

O que **não** dá para fazer hoje: filtrar **auto de infração da ANEEL** por estado (a base não tem UF nem município) e atribuir **bloco exploratório da ANP** a município (só tem bacia). Esses dois ficam bloqueados por desenho da fonte, não por falta de acesso.

## 2. URLs sondadas ao vivo

Todas as 45 requisições em 17/11/2026. "Corpo" é o tamanho real medido. Nenhum 403, nenhum 429, nenhum CAPTCHA.

### 2.1 ANEEL — API CKAN `dadosabertos.aneel.gov.br` (26 requisições)

| # | URL | Status | Corpo | Leitura |
|---:|---|---:|---:|---|
| 1 | `/api/3/action/package_search?q=siga&rows=10` | 200 | 24.276 B | 3 conjuntos; `siga-sistema-de-informacoes-de-geracao-da-aneel` |
| 2 | `/api/3/action/package_show?id=siga-...` | 200 | 9.884 B | 5 recursos; CSV/XML, `datastore_active=true` |
| 3 | `/dataset/6d90b77c-.../resource/11ec447d-.../download/siga-empreendimentos-geracao.csv` | 200 | **7.883.527 B** | 25.046 linhas, 23 colunas, competência 2026-11-01 |
| 4 | `/api/3/action/package_search?q=transmissao&rows=15` | 200 | 264.151 B | 14 conjuntos; SIGET, leilões, capacidade por UF |
| 5 | `/api/3/action/package_show?id=sistema-de-gestao-da-transmissao-siget` | 200 | 48.716 B | 35 recursos (17 CSV) |
| 6 | `/api/3/action/package_search?q=fiscalizacao&rows=15` | 200 | 137.240 B | 22 conjuntos; `auto-de-infracao`, `fsb-...barragens`, `termo-de-notificacao` |
| 7 | `/api/3/action/package_search?q=compensacao+financeira&rows=15` | 200 | 44.511 B | 2 conjuntos; `cfurh`, `compensacao-financeira-royalties` |
| 8 | `/api/3/action/package_show?id=cfurh` | 200 | 38.123 B | 20 recursos (11 CSV, 2 parquet, 2 zip) |
| 9 | `/api/3/action/package_show?id=auto-de-infracao` | 200 | 7.981 B | 3 recursos |
| 10 | `/dataset/sistema-de-gestao-da-transmissao-siget/resource/(vazio)` | **404** | 6.383 B | URL de teste com id vazio — não é rota, erro vem em HTML |
| 11 | `/api/3/action/datastore_search?resource_id=6ad76203-...&limit=1` | 200 | 1.868 B | CFURH beneficiários: **total 1.435.782** |
| 12 | `/api/3/action/datastore_search?resource_id=518a4804-...&limit=1` | 200 | 1.413 B | CFURH coeficiente por município: **total 4.725** |
| 13 | `/api/3/action/datastore_search?resource_id=(vazio)&limit=1` | **409** | 184 B | erro de recurso ausente (teste meu) |
| 14 | `/api/3/action/datastore_search_sql?sql=...` | **400** | 58 B | `Action name not known: datastore_search_sql` — **não existe SQL** neste CKAN |
| 15 | `/api/3/action/datastore_search?resource_id=6ad76203-...&filters={"SigUF":"PA"}&limit=2` | 200 | 2.615 B | **PA = 3.963 registros** |
| 16 | idem com `limit=5000` | 200 | 2.626.781 B | 3.963 registros completos em uma página |
| 17 | `/dataset/beefe870-.../resource/89caca18-.../download/siget-contrato-modulolinhatransmissao-...csv` | 200 | 469.484 B | 1.743 linhas, 29 colunas |
| 18 | `/api/3/action/datastore_search?resource_id=f221158a-...&limit=1` | 200 | 2.777 B | Auto de infração: **total 1.635**, 29 campos |
| 19 | `/dataset/4d690c9d-.../resource/f221158a-.../download/auto-infracao.csv` | 200 | 715.557 B | 1.635 linhas |
| 20 | `/api/3/action/package_show?id=fsb-fiscalizacao-de-seguranca-de-barragens` | 200 | 7.791 B | 2 recursos; CSV de 35.958 KB |
| 21 | `/api/3/action/datastore_search?resource_id=c1399837-...&limit=1` | 200 | 8.366 B | FSB: **total 17.135**, 89 campos |
| 22 | idem `filters={"SigEstadoUsina":"PA"}&limit=100` | 200 | 422.140 B | **PA = 625 registros** |
| 23 | idem `filters={"SigEstadoUsina":"PA"}&limit=1000` | 200 | 2.594.822 B | 625 linhas completas |
| 24 | `/dataset/beefe870-.../download/siget-contrato-empreendimento-obra-modulo.csv` | 200 | **9.069.364 B** | 18.388 linhas, 32 colunas |
| 25 | `/api/3/action/package_show?id=resultado-de-leiloes` | 200 | 10.699 B | 4 recursos |
| 26 | `/dataset/resultado-de-leiloes/resource/a1328fc1-.../download/resultado-leiloes-geracao.csv` | 200 | 422.878 B | 1.552 linhas, 26 colunas |

### 2.2 ANP — `www.gov.br/anp` (14 requisições)

| # | URL | Status | Corpo | Leitura |
|---:|---|---:|---:|---|
| 27 | `/robots.txt` | 200 | 2.102 B | libera `/anp/` |
| 28 | `/anp/pt-br/centrais-de-conteudo/dados-abertos` | 200 | 311.700 B | índice com **231 conjuntos** declarados |
| 29 | `/anp/.../dados-abertos/arquivos/home/inventario-dados.xlsx` | 200 | 42.039 B | 231 linhas × 11 colunas: base, unidade responsável, periodicidade, se está no dados.gov.br, se é sigilosa |
| 30 | `/anp/.../dados-abertos/fase-de-desenvolvimento-e-producao` | 200 | 407.899 B | **303 links de CSV/XLSX** |
| 31 | `/anp/.../dados-abertos/participacoes-governamentais` | 200 | 315.765 B | **88 links** (royalties e participação especial por União/estado/município/campo) |
| 32 | `/anp/.../arquivos/pg/royalties-municipios/royalties-municipio-2025.csv` | 200 | 458.638 B | 10.478 linhas, **204 do PA** |
| 33 | `/anp/.../informacoes-sobre-campos/extracao-campo.csv` | 200 | 61.784 B | 444 campos produtores no Brasil, **0 no PA** |
| 34 | `/anp/.../arquivos-producao-.../producao-terra-4-trim.csv` | **404** | 26 B | nome de arquivo errado (o trimestral usa outro padrão) |
| 35 | `/anp/.../dados-abertos/fase-de-exploracao` | **404** | 26 B | slug certo é `fase-exploracao` (sem "de") |
| 36 | `/anp/.../dados-abertos/producao-de-petroleo-e-gas-natural-por-estado-e-localizacao` | 200 | 295.207 B | 6 séries mensais (petróleo, LGN, gás, reinjeção, queima, consumo) |
| 37 | `/anp/.../arquivos/ppgn-el/producao-petroleo-m3.csv` | 200 | 463.261 B | 7.920 linhas, **0 do PA** |
| 38 | `/anp/.../arquivos/ppgn-el/producao-gas-natural-1000m3.csv` | 200 | 480.850 B | idem, **0 do PA** |
| 39 | `/anp/.../dados-abertos/fase-exploracao` | 200 | 431.467 B | blocos sob contrato, poços exploratórios, PADs |
| 40 | `/anp/.../bsc/2025/blocos-sob-contrato-nov-2025.csv` | 200 | 85.402 B | 435 blocos, 20 colunas, **sem campo UF** |

### 2.3 EPE — `www.epe.gov.br` (5 requisições)

| # | URL | Status | Corpo | Leitura |
|---:|---|---:|---:|---|
| 41 | `/robots.txt` | 200 | 535 B | libera publicações e dados abertos |
| 42 | `/pt/publicacoes-dados-abertos/dados-abertos` | 200 | 82.763 B | página de entrada |
| 43 | `/pt/publicacoes-dados-abertos/publicacoes/leiloes-de-energia` | 200 | 114.324 B | **nenhum arquivo de dado**; só um PDF de aviso de privacidade |
| 44 | `/pt/publicacoes-dados-abertos/publicacoes/Plano-Decenal-de-Expansao-de-Energia-2035` | 200 | 115.226 B | PDE 2035 com planilhas por tema |
| 45 | `.../publicacao-894/topico-831/PDE 2035_Empreendimentos Transmissão_LTs e SEs.xlsx` | 200 | 139.438 B | 758 empreendimentos, 20 colunas, **33 no PA** |

## 3. O que é coletável hoje

### 3.1 CFURH — compensação financeira por município (ANEEL)

- **Recurso:** `6ad76203-68d8-48c1-a338-a6ff5e6167a7` (`cfurh-beneficiarios-cfurh.csv`, 469.469 KB em CSV; existe `.zip` de 64.736 KB e `.parquet` de 56.955 KB, ambos **sem datastore**).
- **Volume:** 1.435.782 registros nacionais; **3.963 no PA**; **15 municípios paraenses**; competências de **1996-11 a 2026-07**.
- **Acesso:** `datastore_search` com `filters={"SigUF":"PA"}` e `limit=5000` devolve as 3.963 linhas em **uma requisição** (2,6 MB). Não existe `datastore_search_sql` neste CKAN (item 14 da tabela) — toda agregação é feita depois, no cliente.
- **Campos:** `DatCompetencia`, `DatDistribuicao`, `SigUF`, `NomMunicipio`, `CodMunicipioIBGE`, `NomAgente`, `NumCNPJ`, `NomUsinaPcp`, `CodCEGPcp`, `NomUsinaMtt`, `CodCEGMtt`, `NomReservatorioCmpf`, `IdcUsinaProrrogada`, `IdcUsinaPrincipal`, `IdcLiminarTAREspecial`, `VlrPagoEstado`, `VlrPagoMunicipio`, `VlrPagoDemaisEntes`, `VlrPagoANA`, `VlrPagoTotal`.
- **Números medidos:** soma de `VlrPagoMunicipio` no PA = **R$ 2.834.586.968,36**. Competência 2026-07, 16 linhas; maiores: Novo Repartimento R$ 2.984.091,29 e Altamira R$ 1.715.164,36 (Tucuruí e Belo Monte).
- **Recurso irmão:** `518a4804-...` (`cfurh-coeficiente-distribuicao-municipio.csv`, 904 KB) — 4.725 linhas, coeficiente de distribuição e percentual de repasse por município e por usina. Bom para explicar *por que* aquele município recebe.

### 3.2 SIGA — cadastro de geração (ANEEL)

- **Recurso:** CSV de 7.883.527 B, competência 2026-11-01, **25.046 linhas** e 23 colunas; `datastore_active=true`.
- **Campos:** `NomEmpreendimento`, `IdeNucleoCEG`, `CodCEG`, `SigUFPrincipal`, `SigTipoGeracao`, `DscFaseUsina`, `DscOrigemCombustivel`, `DscFonteCombustivel`, `DscTipoOutorga`, `NomFonteCombustivel`, `DatEntradaOperacao`, `MdaPotenciaOutorgadaKw`, `MdaPotenciaFiscalizadaKw`, `MdaGarantiaFisicaKw`, `IdcGeracaoQualificada`, `NumCoordNEmpreendimento`, `NumCoordEEmpreendimento`, `DatInicioVigencia`, `DatFimVigencia`, `DscPropriRegimePariticipacao`, `DscSubBacia`, `DscMuninicpios`.
- **PA medido:** 13.206 linhas, 54 municípios citados.

  | Tipo | Registros no PA | Soma potência outorgada |
  |---|---:|---:|
  | UHE | 5 | 22.331 MW |
  | UTE | 83 | 2.772 MW |
  | PCH | 3 | 60 MW |
  | UFV | 13.110 | 37 MW |
  | CGH | 5 | 3 MW |

  Fase: 13.202 em `Operação`, 3 `Construção não iniciada`, 1 `Construção`.
- **Leitura cívica direta:** 13.110 autorizações solares no PA somam 37 MW — a maior delas, `Jacareacanga R70`, tem 19 MW. O "boom solar" do Pará é, hoje, **papel**, não potência.
- **UHEs do PA:** Belo Monte 11.233.100 kW (Altamira + Vitória do Xingu, operação 2016-04-20, concessão até 2046-07-13, 100% Norte Energia); Tucuruí 853.500 kW (1984-12-30); Teles Pires 181.980 kW e São Manoel 70.000 kW (com MT); Curuá-Una 4.280 kW.
- **UTE de Barcarena:** Portocém I 157.189 kW, Novo Tempo Barcarena 62.937 kW (entrada em operação 2026-08-26), Novo Tempo Barcarena II 13.026 kW, Alunorte 9.159 kW.

### 3.3 FSB — fiscalização de segurança de barragens (ANEEL)

- **Recurso:** `c1399837-ed14-4955-a7e0-7027b0caf980`, CSV de 35.958 KB, `datastore_active=true`, **17.135 registros nacionais**, **89 campos**.
- **PA medido:** **625 registros**, **8 usinas**, 130 barramentos nomeados, 10 campanhas (2016/1 a 2025-1). Nível de segurança: 625 `Normal`; risco: 609 `BAIXO`, **16 `MÉDIO`**.
- **Campos de ouro para pauta:** `DscNivelSegurancaBarragem`, `DscCategoriaRiscoGeral`, `DscDanoPotencialGeral`, `DscPSBElaborado`, `DscPAEElaborado`, `DscISRRealizada`, `DscISERealizada` + datas de conclusão das campanhas, `DscPossuiTecnicoEstrutura`, `DscEmiteRelatorio`, `QtdMunicipioAfetado`, `MdaAlturaMacicoTerreno`, `DscEnquadraResolucao`, `DscExisteAcidenteIncidente`.
- **Por que importa:** é o único dado público que cruza **barragem de usina + municípios afetados + plano de emergência entregue ou não**. Belo Monte aparece com `Dique 1`, `Dique 1A` etc.

### 3.4 SIGET — linhas de transmissão e obras (ANEEL)

- **Linhas (contrato):** 469.484 B, 1.743 linhas, 29 colunas (`NomLinTms`, `NomSubestacaoOrigem/Destino`, `SigUFSubestacaoOrigem/Destino`, `NumTensaoBaseLinhaTransm`, `NumEtnLinTms` (km), `QtdTorLinTms` (torres), `DscSitLinTms`). **PA: 65 linhas, todas `Ativa`** — 41 em 230 kV, 20 em 500 kV, **4 em 800 kV**; 17 interestaduais. `LT 800 kV XINGU/ESTREITO PA/MG` = 3.803 torres e 2.092 km; `LT 800 kV XINGU/TERMINAL RIO PA/RJ` = 4.448 torres e 2.539 km.
- **Obras (contrato):** 9.069.364 B, 18.388 linhas, 32 colunas (`NomEpd`, `DscObr`, `DscSitObr`, `DatOprComEpd` (data prevista de operação), `DatOprComObr` (data real), `DscSituacaoEpd`, `VlrHisRct`). **PA: 799 módulos** identificados por `NomMdl ... PA` — 730 `Em operação`, 63 `Em andamento`, 6 `Planejado`. Comparar `DatOprComEpd` com `DatOprComObr` é o caminho medido para falar de atraso por obra no PA.
- **Leilões de geração:** 422.878 B, 1.552 linhas, 26 colunas (`VlrPrecoLeilao`, `VlrDesagio`, `VlrInvestimentoPrevisto`, `DscEmpresaVencedora`). **PA: 3 empreendimentos, 12.537,6 MW** — Belo Monte (2010, 11.233,10 MW, R$ 19.018.115.000,00 de investimento previsto), São Manoel (2013, 700 MW), Novo Tempo Barcarena (2019, 604,52 MW).

### 3.5 ANP — royalties e produção

- **Royalties por município (2025):** 458.638 B, 10.478 linhas, colunas `competencia`, `caixa`, `municipio`, `estado`, `royalties minimos`, `royalties excedentes`. **PA: 204 linhas, 17 municípios, R$ 451.484,51** (Afuá, Alenquer, Almeirim, Anajás, Breves, Chaves, Curuá, Faro, Gurupá, Juruti, Melgaço, Monte Alegre, Óbidos, Porto de Moz, Prainha, Santarém, Terra Santa).
- **Produção por estado (1997–2026, mensal):** 7.920 linhas de petróleo e 7.920 de gás; colunas `ANO`, `MÊS`, `UNIDADE DA FEDERAÇÃO`, `PRODUTO`, `LOCALIZAÇÃO` (terra/mar), `PRODUÇÃO`. **PA: 0 linhas** em ambas.
- **Campos produtores:** `extracao-campo.csv`, 444 linhas, UTF-8 com `,`; colunas `CAMPO`, `BACIA`, `ESTADO`, `OPERADOR`, `AMBIENTE`, `SITUACAO_CAMPO`, `DATA_INICIO_PRODUCAO`. **PA: 0 campos** (BA 120, RN 96, RJ 74, ES 64, MA 13, AM 9, PR 2).
- **Blocos sob contrato (nov/2025):** 85.402 B, 435 blocos, 20 colunas; **sem campo UF**. Por bacia: Potiguar 159, Pelotas 47, Santos 37, **Foz do Amazonas 28**, **Amazonas 6**, **Pará-Maranhão 5**.
- **Inventário ANP:** 231 conjuntos × 11 colunas — inclui o que a própria ANP classifica como **"Não abertos"** (Sistema de Fiscalização da Produção, notas técnicas de blocos, base de contratos).

### 3.6 EPE — PDE 2035

- **Recurso:** `PDE 2035_Empreendimentos Transmissão_LTs e SEs.xlsx` (139.438 B), aba `PDE 2035`, **758 linhas × 20 colunas**.
- **Campos:** `Estudo`, `Tipo do Empreendimento` (LT/SE), `Região Geoelétrica`, `UF Origem`, `UF Destino`, `UF Secc`, `Característica` (Nova/Expansão), `Nome do Empreendimento`, `Itens de obra`, `Status`, `Data de Necessidade`, `km Total`.
- **PA medido: 33 empreendimentos** (21 SE, 12 LT), **1.122 km** de LT; status: 20 `Estudo/Consolidação`, 12 `DMSE`, 1 `Outorga`. Exemplos: `LT 230 kV Transamazônica - Tapajós, C2` (187 km, necessidade 01/2037), `LT 230 kV Açailândia - Dom Eliseu II` (138 km, DMSE 01/2026).
- **Leitura cívica:** é a lista do que **ainda não existe e já tem data** no PA — dá para acompanhar promessa vs. leilão vs. obra (SIGET).

## 4. O que está bloqueado e por quê

| Fonte | O que se queria | Por que não dá |
|---|---|---|
| ANEEL — `auto-infracao` | autos de infração de agentes do PA | **Não existe campo de UF nem de município** nas 1.635 linhas / 29 campos. O objeto é textual (`CodObjetoFiscalizado`) e o agente vem por nome/CNPJ. Filtrar por `NomAgenteFiscalizado -match "PARA"` dá falso positivo comprovado: casou `ENERGISA Paraíba`, `Três Leões Participações` e `Companhia CELG`. Atribuição geográfica só com **tabela externa de CNPJ → UF**. As naturezas existentes incluem `1.02.05 - Procedimento Segurança de Barragens` (129 no Brasil) e `1.02.04 - Procedimento Desempenho Eólicas e Fotovoltaicas` (673) — mas sem recorte estadual. |
| ANP — blocos | blocos no território do PA | O CSV de nov/2025 tem **bacia, não UF**. `Amazonas` (6), `Pará-Maranhão` (5) e `Foz do Amazonas` (28) são bacias que **atravessam** o PA e outros estados. Atribuir bloco a município paraense exigiria shapefile (existe em `Dados Georreferenciados das Bacias Sedimentares Brasileiras`) + geometria — não medido nesta sessão. |
| ANP — BDEP / dados técnicos de poço | poços perfurados no PA | O inventário da própria ANP aponta o acervo técnico (poços, sísmica) como publicado via `dados.gov.br`, mas o **BDEP exige cadastro de usuário**. **Não sondado nesta sessão** (evitei rota com autenticação, conforme a regra). **Não medido.** |
| EPE — `leiloes-de-energia` | leilões com empreendimentos do PA | A página responde 200 com 114.324 B mas **não tem nenhum link de dado** — só um PDF de aviso de privacidade. O conteúdo de leilão está no dataset da ANEEL (`resultado-de-leiloes`), não aqui. |
| ANP — "Não abertos" (inventário) | fiscalização da produção, notas técnicas de bloco | A própria ANP declara sigiloso/planejado: `Sistema de Fiscalização da Produção` (diária), `Base dos contratos`, `Nota Técnica - inicial de proposição de bloco`. Sem acesso. |

## 5. Veredito por fonte

| Fonte | Consegue coletar hoje? | Dificuldade | Ganho cívico (uma frase) |
|---|---|---|---|
| **CFURH beneficiários (ANEEL)** | **Sim** — 3.963 linhas do PA, 1 requisição, `CodMunicipioIBGE` | **Baixa**: CSV Latin-1 com `;` e **vírgula decimal**; sem SQL no CKAN | Mostra, mês a mês desde 1996, quanto cada um dos 15 municípios paraenses recebeu de compensação — **R$ 2,83 bi** acumulados — e permite cobrar do gestor municipal a aplicação desse dinheiro. |
| **SIGA geração (ANEEL)** | **Sim** — 13.206 linhas do PA, 1 CSV de 7,8 MB | **Baixa** | Desmonta o discurso de "expansão solar" no PA: 13.110 autorizações somando 37 MW, contra 5 UHEs somando 22.331 MW. |
| **FSB barragens (ANEEL)** | **Sim** — 625 registros, 8 usinas, 10 campanhas | **Média**: 89 campos, muitos de texto livre; nome de barramento repete entre campanhas | Liga barragem de usina a **plano de emergência e municípios afetados** — o dado que falta em qualquer debate sobre Belo Monte e Tucuruí. |
| **SIGET linhas + obras (ANEEL)** | **Sim** — 65 linhas ativas e 799 módulos de obra no PA | **Média**: CSV de 9 MB; `NomMdl` precisa de regex para separar UF | Permite medir atraso de obra de transmissão no PA comparando data prevista e data real de operação. |
| **Leilões de geração (ANEEL)** | **Sim** — 3 linhas do PA | **Baixa** | Fecha a cadeia leilão → usina → operação para os 12.537,6 MW leiloados no PA, com preço, deságio e vencedor. |
| **Royalties municípios (ANP)** | **Sim** — 204 linhas do PA em 2025 | **Baixa**: colunas minúsculas, município em `nome-uf`, sem código IBGE | Revela que **17 municípios do PA recebem royalties de petróleo sem o PA produzir um barril** — dinheiro de campo offshore, rastreável por município. |
| **Produção por estado (ANP)** | **Sim, mas vazio para o PA** — 0 linhas | **Baixa** | Serve como prova negativa documentada: a série oficial não registra produção de petróleo nem de gás no Pará. |
| **Campos produtores (ANP)** | **Sim, mas vazio para o PA** — 0 de 444 | **Baixa** | Confirma por outra base que não há campo produtor paraense; o petróleo do PA é exploração, não produção. |
| **Blocos sob contrato (ANP)** | **Parcial** — 435 blocos, sem UF | **Alta** para recorte estadual (precisa de shapefile + geometria) | Mostra que a fronteira exploratória no PA existe (bacias Amazonas, Pará-Maranhão, Foz do Amazonas) mesmo sem campo produtor. |
| **PDE 2035 (EPE)** | **Sim** — 33 empreendimentos no PA | **Baixa** | Coloca no mapa o que **ainda não foi construído** no PA (1.122 km de LT) com data de necessidade — munição para cobrar atraso. |
| **Auto de infração (ANEEL)** | **Não, por desenho** | **Bloqueada**: sem UF/município | Se um dia houver tabela CNPJ → UF, vira o painel de punições do setor elétrico no PA; hoje só produz falso positivo. |
| **BDEP (ANP)** | **Não sondado** | **Bloqueada**: login | Ficaria com o acervo de poços e sísmica do PA — **não medido**, rota autenticada não foi tentada. |

## 6. Armadilhas para quem for escrever o coletor

1. **`datastore_search_sql` não existe** neste CKAN (400, item 14). Toda contagem agregada é feita depois do download.
2. **CSV da ANEEL é Latin-1 (Windows-1252) com delimitador `;`** e **vírgula decimal** (`"11233100,00"`). Ler como UTF-8 produz `Opera??o`; converter `,` → `.` é obrigatório antes de somar.
3. **`Import-Csv` com delimitador errado devolve 1 coluna só e "0 linhas do PA" sem erro** — foi o que aconteceu na primeira tentativa. Valide o número de colunas antes de confiar no recorte.
4. **SIGA não tem código IBGE de município**, só `DscMuninicpios` com múltiplos municípios separados por vírgula (`"Altamira - PA, Vitória do Xingu - PA"`) e o campo está **escrito errado na fonte** (`DscMuninicpios`). Cruzar com municípios exige split + normalização de nome. Para join confiável use **CFURH**, que traz `CodMunicipioIBGE`.
5. **`SigUFPrincipal` é o campo de UF no SIGA**, não `SigUF`. Filtrar pelo nome de coluna errado devolve zero em silêncio.
6. **SIGET obra (`NomMdl`) codifica a UF no fim do nome** (`... MG1 PA`); `-match " PA$"` funciona, `-match "PA"` não.
7. **ANP royalties 2025 grafa `estado` em minúsculas** (`pa`) e `municipio` como `santarem-pa`; já `extracao-campo.csv` é UTF-8 com vírgula e `ESTADO` em maiúsculas (`Pará`). Nenhum dos dois é consistente com o outro.
8. **`datastore_search` tem teto de página**: `limit=5000` funcionou para 3.963 linhas; para o CSV de 469 MB (1,4 M linhas) é preciso paginar com `offset`, ou baixar o `.parquet`.
9. **200 não é sucesso** (itens 43 e 34): a página de leilões da EPE responde 200 sem dado e o CSV trimestral respondeu 404 com 26 bytes de corpo. Sempre valide o conteúdo, não o status.

## 7. Já existe algo no repo?

`grep -ril "aneel\|anp\|energia" scripts etl --include=*.py` retorna 12 arquivos fora de `.venv`. O único de energia é **`etl/betim/etl/apis/anp.py`**, e ele é de **outro escopo**: sincroniza o cadastro de **revendedores de combustível** (`https://revendedoresapi.anp.gov.br/v1/combustivel`) na tabela `postos_anp`, por UF + município, para o município de Betim/MG. **Não** toca exploração, produção, royalties, CFURH, geração ou transmissão.

Ou seja: **nada no repo cobre energia do Pará**, e o único coletor ANP existente é de outra base e de outro município. Os 4 documentos irmãos desta pasta (`ambiental-PA-semas`, `ambiental-PA-sydia-api`, `ambiental-PA-mppa-tac`, `ambiental-PA-eia-rima`) tratam de licenciamento ambiental, não de energia.
