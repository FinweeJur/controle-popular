# Ambiental PA — EIA/RIMA, audiências e consultas públicas (SEMAS-PA)

> **Tipo:** HISTORICO
> **Domínio:** ambiental / pará
> **Última medição:** 17/11/2026
> **Leitura estimada:** curta (< 5 min)
> **Palavras-chave:** semas-pa, eia, rima, audiência pública, consulta pública, portal da transparência

## Sumário

- [Veredito](#veredito)
- [1. O que foi sondado ao vivo](#1-o-que-foi-sondado-ao-vivo)
- [2. A fonte que funciona: API pública do Portal da Transparência](#2-a-fonte-que-funciona-api-pública-do-portal-da-transparência)
- [3. Contagens medidas](#3-contagens-medidas)
- [4. Campos disponíveis](#4-campos-disponíveis)
- [5. O que está bloqueado e por quê](#5-o-que-está-bloqueado-e-por-quê)
- [6. Onde ficam os estudos em si](#6-onde-ficam-os-estudos-em-si)
- [7. O que NÃO existe paraense equivalente ao INEA](#7-o-que-não-existe-paraense-equivalente-ao-inea)
- [8. Custo do coletor](#8-custo-do-coletor)

## Veredito

**Vira coletor agora.** Dificuldade baixa.

A SEMAS-PA **não tem página de audiências por ano** (nada como `inea.rj.gov.br/eia-rima-2025`).
Mas o **Portal da Transparência Ambiental** expõe uma API JSON pública, sem login, com:

- 25 audiências públicas (2019–2026), todas com município, empreendimento, atividade e data;
- 78 RIMA + 72 EIA em PDF baixável direto;
- paginação de 20 itens, filtro por ano.

Total do universo: 5.128 documentos. Custo de coleta: ~10 requisições de metadados.

## 1. O que foi sondado ao vivo

User-Agent em todas as requisições: `finweejur/github artur colito`.

| URL | Status | Corpo | Achado |
| --- | --- | --- | --- |
| `https://www.semas.pa.gov.br/robots.txt` | 200 | 2.701 B | `User-agent: * / Allow: /` |
| `https://www.semas.pa.gov.br/` | 200 | 592.950 B | portal institucional (CMS próprio) |
| `https://www.semas.pa.gov.br/?s=audiência+pública` | 200 | 592.932 B | **busca interna não funciona** (devolve a home) |
| `https://www.semas.pa.gov.br/sitemap.xml` | 404 | — | sem sitemap |
| `https://www.semas.pa.gov.br/Home/Editais/` | 200 | 118.449 B | só editais de notificação/fiscalização; 0 ocorrências de "audi" |
| `https://www.semas.pa.gov.br/Home/OutrosEditais/` | 200 | 102.055 B | 0 ocorrências de "audi" |
| `https://www.semas.pa.gov.br/Home/Paginas/` | 200 | 173.313 B | 24 páginas temáticas; nenhuma de audiência/consulta |
| `https://www.semas.pa.gov.br/Home/Sistemas/` | 200 | 154.035 B | 0 ocorrências de "audi" |
| `https://www.semas.pa.gov.br/Home/Servicos/` | 200 | 128.536 B | 0 ocorrências de "audi" |
| `https://www.semas.pa.gov.br/Home/Institucional/Colegiados/COEMA/` | 200 | 103.433 B | convocação/atas/resoluções; sem audiências |
| `http://portaldatransparencia.semas.pa.gov.br/` | 200 | 5.942 B | SPA Angular — **esta é a fonte** |
| `https://portal-servicos-sistemas.semas.pa.gov.br/consulta-geral` | 200 | 25.625 B | SPA Sydle (consulta processual); sem lista de audiências |
| `http://sistemas.semas.pa.gov.br/pra/consultaPublica/#/` | link na home | — | consulta pública do PRA (fundiário), outro assunto |
| `https://monitoramento.semas.pa.gov.br/simlam/index.htm` | 200 | 2.378 B | frameset legado, sem conteúdo próprio |
| `https://sistemas.semas.pa.gov.br/licenciamento` | 200 | 6.296 B | só aponta para o Portal da Transparência |
| `https://www.ioepa.com.br/` | 200 | 16.387 B | Diário Oficial: sem busca full-text pública encontrada |
| `https://www.ioepa.com.br/portal/pesquisa.aspx` | 404 | — | — |

Método: baixei `main-es2015.*.js` do portal da transparência (1.098.490 B) e extraí a base da API
(`serverUrl:".../portal-da-transparencia-api/"`) e as rotas de menu (`consultas-e-audiencias-publicas`,
`painel-audiencia-publica`, `relatorio-audiencia-publica`, `estudo-de-impactos-ambientais`).

## 2. A fonte que funciona: API pública do Portal da Transparência

```
GET https://portaldatransparencia.semas.pa.gov.br/portal-da-transparencia-api/api/v1/documentos?id_tipo_arquivo={id}&page={n}
GET https://portaldatransparencia.semas.pa.gov.br/portal-da-transparencia-api/api/v1/documentos/download/{id}
```

- Responde **200** sem cookie, sem token, sem login.
- JSON paginado: `current_page`, `last_page`, `total`, `data[]` (20 itens por página).
- Universo total (`?page=1`, sem filtro): **5.128 documentos**, 257 páginas.
- Filtro por ano funciona: `?id_tipo_arquivo=6&ano=2025&page=1` → 14 itens.
- Filtro por município por nome quebra (`municipio=BELÉM` → 500; espera id numérico).
- Interface humana (SPA): `https://portaldatransparencia.semas.pa.gov.br/#/visao-publica` (200).

Mapa de `id_tipo_arquivo` (varrido 1–120 com 1,5 s entre chamadas):

| id | Tipo | Seção | Itens |
| --- | --- | --- | --- |
| 3 | Relatórios — **atas de audiência pública** | LICENCIAMENTO | 25 |
| 4 | Termo de Referência | LICENCIAMENTO | 51 |
| 5 | **Relatório de Impactos Ambientais (RIMA)** | LICENCIAMENTO | 78 |
| 6 | **Estudos de Impacto Ambiental (EIA)** | LICENCIAMENTO | 72 |
| 1 | Plano Básico Ambiental (PBA) | LICENCIAMENTO | 600 |
| 17 | Julgamentos de Infrações | FISCALIZAÇÃO | 3.914 |
| 18 | Termo de Compromisso Ambiental Físico | CAR | 167 |
| 57 | Relatório de Conciliação Ambiental | PUBLICAÇÕES | 63 |

Não existe tipo chamado "Audiências Públicas". A audiência vem como **ata** dentro de "Relatórios" (id 3),
e o campo `data_audiencia` é o que a identifica.

## 3. Contagens medidas

**Audiências públicas — tipo 3 (25 itens, 127,5 MB de PDF):**

| Ano | Itens |
| --- | --- |
| 2019 | 1 |
| 2021 | 1 |
| 2023 | 9 |
| 2024 | 5 |
| 2025 | 7 |
| 2026 | 2 |

Nenhum item sem `data_audiencia` (25/25), sem município (25/25) ou sem tipologia (25/25).

**RIMA — tipo 5 (78 itens, 2.138.487.304 B ≈ 2,0 GiB):**
2008:1 · 2013:1 · 2014:1 · 2015:1 · 2016:2 · 2017:19 · 2018:2 · 2019:2 · 2020:4 · 2021:1 · 2022:4 · 2023:9 · 2024:1 · 2025:16 · 2026:14

**EIA — tipo 6 (72 itens, 2.394.520.185 B ≈ 2,2 GiB):**
2006:4 · 2017:10 · 2018:4 · 2019:4 · 2020:5 · 2022:4 · 2023:12 · 2024:13 · 2025:14 · 2026:2

Ano recente e ano antigo, como pedido: **2026 tem 14 RIMA e 2 EIA**; **2008 tem 1 RIMA** e **2006 tem 4 EIA**.

## 4. Campos disponíveis

Por documento (JSON):

- `id`, `nome_arquivo`, `tamanho_arquivo`, `caminho_arquivo`
- `ano`, `data`, `data_audiencia`
- `cpf_cnpj`, `nome_razao_social` (empreendimento) — 25/25 preenchidos nas audiências
- `municipio.nome_municipio`, `municipio.uf`, `municipio.id_municipio` (código IBGE)
- `tipologia.nome_tipologia`, `tipologia.nome_atividade`, `tipologia.codigo`, `tipologia.atividade_tipologia`
- `tipo_arquivo.nome`, `tipo_arquivo.secao_filtro`, `tipo_arquivo.campos`

Logo, cada linha de audiência traz: **município, empreendimento, atividade, data e link do PDF** — os cinco
campos que o coletor de Betim produz. E mais: o `uf` está embutido em `municipio.uf` (sempre `PA`).

O que **não** existe: `numero_processo` (0/25 nas audiências) e `numero_licenca`. O vínculo
audiência ↔ EIA/RIMA só é possível por CNPJ + município + tipologia (heurística), não por chave.

## 5. O que está bloqueado e por quê

| Item | Situação | Motivo |
| --- | --- | --- |
| `robots.txt` (todos os subdomínios SEMAS) | `Allow: /` | liberado; mesmos 2,6–2,7 KB em `www`, `portal-servicos`, `sistemas`, `portaldatransparencia` |
| Bots de treinamento de IA | `Disallow: /` | 28 UAs listados (GPTBot, ClaudeBot, CCBot, Bytespider, Google-Extended…) |
| `Content-Signal` | `ai-train=no, use=reference` | coleta para referência/documentação é o caso permitido; **não** treinar modelo |
| Rate limit | `x-ratelimit-limit: 60` | header observado; janela não medida (remaining caiu 60→54 ao longo das chamadas) |
| `/api/v1/documentos/{subtipo}/listar`, `.../listar-privado` | **403** | exigem login de servidor (área administrativa) |
| `/api/v1/painel/{slug}` | 500 | rota só aceita `id_tipo_arquivo` inteiro; com slug faz SQL inválido |
| CAPTCHA / termo de aceite | **não há** | ~70 requisições sem desafio; Cloudflare põe cookie `__cf_bm`, mas não bloqueou |

Nada de login, CAPTCHA ou paywall no caminho da coleta. A interface Sydle
(`portal-servicos-sistemas...`) e o SIMLAM antigo **não** foram usados porque não têm lista de audiências.

## 6. Onde ficam os estudos em si

**Link direto de PDF.** Verificado com download real, não só com header:

| Chamada | Bytes | Magic |
| --- | --- | --- |
| `.../download/1637` (ata de audiência, Castanhal) | 967.576 | `%PDF-` |
| `.../download/620` (RIMA, Itaituba) | 7.965.221 | `%PDF-` |

Os arquivos vivem em `documentos/Relatório de Audiência Pública/<hash>.pdf` (e pastas equivalentes por tipo),
servidos pelo mesmo host. Não é edital nem ata-resumo: é o **EIA/RIMA completo** (um caso chega a 66 MB).

## 7. O que NÃO existe paraense equivalente ao INEA

- Não há URL por ano (`/eia-rima-2025`). Há **uma lista só**, paginada, filtrada por `?ano=`.
- Não há "consulta pública aberta" (período de contribuição). O que a SEMAS publica é a **ata** depois da audiência.
- O Diário Oficial (IOEPA) publica o edital de convocação, mas sem busca full-text pública encontrada
  (2 caminhos sondados, 1 deu 404); seria trabalho por edição diária em PDF — caro, e redundante com a ata.
- Para consulta pública *aberta* (minuta de norma), o caminho é o COEMA (convocação/atas/resoluções, 200),
  não o portal da transparência.

## 8. Custo do coletor

- Metadados de audiências: 2 requisições (`?id_tipo_arquivo=3&page=1..2`) → 25 linhas.
- Metadados de RIMA: 4 requisições · EIA: 4 requisições → 150 linhas.
- PDFs: 1 requisição por documento. 127,5 MB só de audiências; **~4,5 GiB** para EIA+RIMA completos
  (recomendo gravar só a URL e baixar sob demanda).
- Ritmo seguro: 1,5 s entre chamadas (usado na sondagem), dentro do limite de 60.
- Saída sugerida: `etl/pa/dados/ambiental-estudos.json`, com `uf` vindo de `municipio.uf`.

Risco a saber: o `id_tipo_arquivo` é interno e pode ser renumerado; o coletor deve validar pelo **nome**
do tipo (`Estudos de Impacto Ambiental`, `Relatório de Impactos Ambientais`, `Relatórios`+`data_audiencia`)
e falhar alto se não achar, em vez de fixar 3/5/6.
