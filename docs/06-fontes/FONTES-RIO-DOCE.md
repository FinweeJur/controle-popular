# Fontes: Plataforma Rio Doce (Mariana / Fundão / Acordo de Reparação)

> **Tipo:** fonte
> **Domínio:** Rio Doce
> **Última medição:** 2026-10-12
> **Leitura estimada:** 10 min
> **Relacionados:** [FONTES.md](FONTES.md), [PLANO-PLATAFORMA-RIO-DOCE.md](../planos/PLANO-PLATAFORMA-RIO-DOCE.md), [ESTADO.md](../02-estado/ESTADO.md)
> **Palavras-chave:** riodoce, mariana, fundao, samarco, datajud, semad, wfs, renovacao, ckan-mg, portal_mariana, arcgis, repactuacao

## Sumário

Levantamento da Fase 0 do plano da Plataforma Rio Doce (`/riodoce`): as três
famílias de fonte do caso, medidas em 12/10/2026 por sondagem com User-Agent
honesto e pausa por host. Nada aqui é estimativa; lacuna está declarada como
lacuna. Relatórios brutos (medições, logs de probe, CSV de metadado) ficaram
em `Temp\opencode\fase0\` desta máquina — não versionados por peso (~542 MB)
e por serem artefato de sondagem, não dado publicado.

## DataJud (CNJ) — API pública, consulta ao vivo

| Medida | Valor (12/10/2026) |
|---|---|
| Índices ativos | `tjmg`, `trf1`, `trf6`, `stj` (HTTP 200) |
| Índices **inexistentes** | `jfmg`, `stf` (404 `index_not_found_exception`) |
| Processos confirmados | **8 distintos** (9 probes com hit) |
| Latência | 4,6 s a 40 s; mediana ~25 s; `took` do Elasticsearch ≈ latência total |

**Processos confirmados** (probe `match` em `numeroProcesso`, `size:1`; ver
tabela completa no relatório `A-datajud.md` da Fase 0):

| Nº CNJ | Índice | Classe | Órgão |
|---|---|---|---|
| `0395595-67.2015.8.13.0105` | tjmg | ACP | 7ª Vara Cível de Governador Valadares |
| `1024354-89.2019.4.01.3800` | trf1+trf6 | ACP / Apelação | 12ª VF BH / GAB. 41 |
| `1016756-84.2019.4.01.3800` | trf6 | ACP | 4ª VF BH |
| `0060017-58.2015.4.01.3800` | trf6 | ACP | 4ª VF BH |
| `6025194-97.2024.4.06.3800` | trf6 | Apelação (ressalva ao acordo) | GAB. 44 |
| `0002725-15.2016.4.01.3822` | trf1 | Ação Penal | Vara Única de Ponte Nova |
| `1011729-52.2021.4.01.3800` | trf6 | Cumprimento de sentença | 4ª VF BH |
| `1040611-58.2020.4.01.3800` | trf6 | Execução TTAC | 4ª VF BH |

**Filtros medidos:** `orgaoJulgador.nome` funciona (≥10 mil em "MARIANA",
tjmg, ~29 s); `assuntos.nome` com termos acentuados em tjmg devolve **0**
(analyzer — usar número exato ou órgão); `assuntos.nome`="Mariana" em trf6 →
863 hits. Número exato é a consulta mais rápida (5–15 s).

**Lacunas declaradas:** ACP União R$ 20 bi, TTAC/TAC-GOV, ACP e cautelar do
MPMG (2015, sem atualização recente) **não estão no índice público**; Petição
13.157/STF e processos JF-MG **não são testáveis** (índices `stf`/`jfmg`
inexistem). Número não indexado ≠ processo inexistente. DV CNJ validado pelo
algoritmo oficial (Módulo 97, Res. 65/2008): 12/12 reproduzidos.

⚠️ `orgaoJulgador.codigoMunicipioIBGE=3144805` (Mariana) **não equivale a
vara da reparação** — devolveu "3ª Câmara Cível" como primeiro hit. Regra para
a Fase 1b: filtro por número ou por `orgaoJulgador.nome`, nunca por código de
município sozinho. Regra da casa (B8 em [FONTES.md](FONTES.md)): consulta
**ao vivo**, cache só em memória, nunca derivado em disco (Termo de Uso 3.8/3.9).

## WFS da SEMAD/MG — camadas espaciais da bacia

WFS `https://geoserver.meioambiente.mg.gov.br/IDE/ows` (2.0.0, EPSG:4674).
GetCapabilities medido: 1.006.114 bytes, **1.420 camadas `IDE:`**; 38
prioritárias medidas + 1 bônus (PAE). Relatório `B-semad.md` tem a tabela
camada a camada com `numberMatched`, bytes GeoJSON e licença por metadado
GeoNetwork (uuid conferido, não similaridade de título).

| Família | Camadas | Destaque medido |
|---|---|---|
| Mancha do Fundão (`ide_250101_do_mancha_inund_fundao_pol`) | 1 | **1.243 feições, 132,7 MB** GeoJSON completo; "acesso livre" (sem CC) |
| ZAP Alto Doce (`ide_240205_mg_altodoce_*`) | **12** (briefing dizia 11) | 1–558 feições; licença **varia dentro da família** (5 CC BY 4.0, resto acesso livre) |
| ZAP Gualaxo do Norte (`ide_240208_mg_gualaxon_*`) | **14** (briefing dizia 16) | 1–2.935 feições; nenhuma declara CC |
| CAR/URFBio Rio Doce (`ide_210603_mg_*_riodoce_pol`) | 2 | APPs hídricas: 29.173 feições, **531 MB**; CC BY 4.0 |
| Análise Dinamizada CAR (`ide_210604_mg_analise_car_*_doce_*`) | **9** | maior volume: 910.619 feições (veg 2025); CC BY 4.0 |
| Bônus PAE (`ide_1903_mg_mancha_inundacao_pae_pol`) | 1 | 156 feições, ≥50 MB; **licença não confirmada — não republicar** |

**Licença resumida:** 15 camadas CC BY 4.0 (IEF/FIP-CAR/Análise Dinamizada);
23 com frase "O acesso ao dado é livre" sem CC nomeada (Semad/Dplae, ZAP,
Fundão) — atribuir sempre; republicação integral exige confirmar o detentor.
Nenhuma camada com "repar"/"renova"/"mariana" no typeName.

**Armadilhas medidas:** mancha do Fundão inteira ≈127 MiB — nunca como props
(§5.1); fatiar por bbox/`startIndex`; 10 camadas grandes só têm piso ≥50 MB
(corte de download); robots.txt do geoserver = 404 → coleta permitida com UA
honesto e pausa ≥1,5 s; robots do GeoNetwork (idesisema) **não lido** (503 em
duas tentativas) — reler antes de coleta em escala.

## Fundação Renova — GIS ArcGIS REST + WordPress

| Porta | Medida (12/10/2026) |
|---|---|
| `gis.fundacaorenova.org/arcgis/rest/services` | **API utilizável**, pública (sem token) no serviço `R8_Sites_Publicos/PT_Portal_Transparencia_Tabelas/MapServer`: **87 tables** (PG38 Pontos de Monitoramento, Gestão Financeira por eixo/programa/tipo, Suprimentos…); `maxRecordCount=2000`; query real devolve JSON utilizável |
| Pastas `R02_Tematicos` / `R04_Programas` | **Token Required (499)** — fora do alcance público |
| `portaltransparencia/api/` (config do bundle) | **404** — API própria do SPA não existe mais neste host |
| `transparencia.fundacaorenova.org` (WordPress) | **API utilizável**: `wp-json/wp/v2/` (43 páginas, 203 mídias); robots.txt só veda `/wp-admin/` |
| `www.fundacaorenova.org` | **307 → `reparacaobaciariodoce.com`** (site sucessor, SPA) |
| Informativo Qualidade da Água | 71 PDFs listados (2018–2020) no padrão `…/wp-content/uploads/…` — **3/3 testados terminam em 404** no destino do redirect; nenhum PDF 2021–2026 na página |

⚠️ **Certificado TLS de `gis.fundacaorenova.org` é `CN=gis.samarco.com`** —
cliente padrão recusa (`SEC_E_WRONG_PRINCIPAL`); probes usaram `-k` **só
para medir**. Cliente de produção deve ser decidido com o dono antes de
coletar em escala. `robots.txt` do gis = 404 (sem restrição declarada).

## CKAN do Governo de MG — `dados.mg.gov.br`

Endpoint confirmado (`/api/3/action/status_show` → CKAN 2.9.5); `ckan.mg.gov.br`
não existe. **`robots.txt` proíbe `/api/` para user-agent genérico e pede
Crawl-Delay: 10** — decisões registradas na Fase 0: consultas `package_search`
mínimas (10 chamadas, `rows` pequenos, pausa 10 s), sem crawling de HTML e sem
download de recursos. Coleta pesada é decisão do dono (§11).

| Busca (12/10/2026) | count | Achado |
|---|---|---|
| `repactuação` / `repactuacao` | **0** | — |
| `rio doce` / `mariana` / `fundão` | 1 | `portal_mariana` (mod. **2026-10-07**, 6 recursos CSV/JSON — dataset **já integrado** no repo) |
| `renova` | 0 | — |
| `reparação` | 3 | `portal_mariana`, `iniciativas-judicial-reparacacao-vale-projetos`, `despesa_pessoal_acordo_brumadinho` |

**Não existe dataset novo da Repactuação 2026** — varredura dos 18 datasets
da SEPLAG (organização que publica os acordos) sem nenhum "repactu". O
`portal_mariana` é o acervo vivo da execução em MG; atualização do coletor
(`scripts/coletar-ckan-mg.mts`) é rotina, não descoberta.

## Monitoramento de água — estado

- **InfoHidro (IGAM):** Liferay; `/api`, `/dados`, `/rest` → 404; `/o/api` →
  403. **API não confirmada** — lacuna declarada.
- **Informativos da Renova:** padrão de URL mapeado, mas os arquivos estão
  mortos no site sucessor (404). Coleta só com nova fonte ou pedido de LAI.

## O que entra na Fase 1 (a partir destas medições)

1. **Fase 1b — processos:** lista curada dos 8 CNJ confirmados acima em
   `/riodoce/processos` + consulta ao vivo pela rota `/api/datajud` já
   existente (`lib/judiciario/datajud.ts`); número só entra na tela se
   passou no probe; lacuna do TTAC/STF dita em texto.
2. **Fase 1 — busca:** zona `f: "riodoce"` já declarada; índice de busca do
   portal regenera no build local com Postgres de pé.
3. **Fase 2 — espaciais:** fatiamento das camadas prioridade 1 (Fundão,
   APPs hídricas, ZAPs) com bbox/`startIndex`; agregados versionados, nunca
   GeoJSON bruto como props; licença PAE fechada antes de publicar.
4. **Renova:** ArcGIS REST é coletável com escopo decidido (87 tables,
   tema transparência financeira e monitoramento); TLS pendente de decisão.
