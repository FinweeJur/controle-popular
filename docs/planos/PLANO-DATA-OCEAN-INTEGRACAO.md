# Plano de Integração de Dados — Controle Popular × Data Ocean

> **Tipo:** PLANO
> **Domínio:** dados
> **Última medição:** 2026-09-06
> **Leitura estimada:** longa (> 15 min)
> **Relacionados:** [ESTADO.md](../02-estado/ESTADO.md), [PRODUTO.md](../01-produto/PRODUTO.md), [AGENTS.md](/AGENTS.md)
> **Palavras-chave:** data ocean, cnes, sih-sus, ideb, inep, caged, rais, sinesp, cruzamentos, educacao, sabia

## Sumário

- [Visão Geral](#visão-geral)
- [Plano Estratégico: Cruzamento de Dados, Educação e Integração](#parte-1--plano-estratégico-cruzamento-de-dados-educação-e-integração)
- [Eixos temáticos e cruzamentos propostos](#12-eixos-temáticos-e-cruzamentos-propostos)
- [Componente educativo — O que esses dados dizem juntos?](#13-componente-educativo--o-que-esses-dados-dizem-juntos)
- [Plano Técnico: Implementação, Decisões e Infraestrutura](#parte-2--plano-técnico-implementação-decisões-e-infraestrutura)
- [Tabela de fontes — acesso e status](#26-tabela-de-fontes--acesso-e-status)
- [Cronograma de implementação](#24-cronograma-de-implementação-12-semanas)

## Visão Geral

Este documento propõe um **plano de duas camadas** para expandir o Controle Popular com novas fontes de dados, cruzamentos analíticos e componentes educativos. A estratégia reconhece uma realidade prática: **o Data Ocean da Maritaca AI não é acessível diretamente via API pública**, mas pode ser utilizado como assistente quando o portal opera dentro do ecossistema Sabiá. Para dados sem acesso direto, o plano mapeia alternativas públicas equivalentes (como basedosdados.org, APIs governamentais e ETLs próprios).

---

## PARTE 1 — PLANO ESTRATÉGICO: Cruzamento de Dados, Educação e Integração

---

### 1.1 🎯 Objetivo central

Criar um **painel municipal integrado** que permita a qualquer cidadão, jornalista ou fiscalizador popular entender, em minutos:

1. **O que o dinheiro público financia** no seu município
2. **Como isso se reflete** em indicadores de saúde, educação, segurança e trabalho
3. **Onde estão as discrepâncias** — municípios que recebem muito mas entregam pouco, ou o contrário

---

### 1.2 🗺️ Eixos temáticos e cruzamentos propostos

#### 🏥 Eixo 1 — Saúde

| Dados | Fonte primária | Cruzamento-chave |
|---|---|---|
| Estabelecimentos de saúde (hospitais, UBS, policlínicas) | CNES (dados.gov.br) | `CNES × SIH-SUS` → capacidade instalada vs. produção real de internações |
| Internações (AIH pagas) | SIH-SUS (DataSUS) | `CNES × Censo 2022` → razão habitante/leito por município |
| Profissionais de saúde | CNES (campo `ST_*`) | `CNES × RAIS` → quantos médicos empregados vs. quantos o município precisa |

**Insight educativo:** Municípios com hospital mas poucas internações podem indicar subutilização, falta de especialistas ou problemas de gestão.

---

#### 📚 Eixo 2 — Educação

| Dados | Fonte primária | Cruzamento-chave |
|---|---|---|
| Matrículas, infraestrutura escolar | INEP via basedosdados.org | `Censo Escolar × IDEB` → qualidade × infraestrutura |
| IDEB (nota do ensino básico) | INEP via basedosdados.org | `IDEB × Renda Censo` → impacto da renda no desempenho escolar |
| Cursos superiores, IES | INEP Censo Superior | `IES × RAIS` → formação superior gera emprego local? |

**Insight educativo:** Um município com boa infraestrutura escolar (biblioteca, internet, quadra) mas IDEB baixo sugere problemas pedagógicos, não estruturais.

---

#### 👷 Eixo 3 — Trabalho e Economia

| Dados | Fonte primária | Cruzamento-chave |
|---|---|---|
| Admissões/demissões formais | CAGED via basedosdados.org | `CAGED × PNCP` → empregos gerados por empresas contratadas pelo poder público |
| Estoque de empregos formais | RAIS via basedosdados.org | `RAIS × Remuneração` → salário médio por setor vs. renda domiciliar |
| Movimentação financeira digital | Pix (exclusivo Data Ocean) | `Pix × Bolsa Família` → circulação econômica além do benefício |
| Inflação, Selic, câmbio | BCB API Olinda (pública) | `IPCA × Preço de contratos PNCP` → impacto da inflação nos gastos públicos |

**Insight educativo:** Se empresas que ganham contratos públicos não geram empregos locais, o dinheiro público está "vazando" para fora do município.

---

#### 🚔 Eixo 4 — Segurança Pública

| Dados | Fonte primária | Cruzamento-chave |
|---|---|---|
| Crimes por município (30 tipos) | SINESP VDE (gov.br) | `SINESP × CNES` → pressão sobre hospitais por violência |
| Dados estaduais detalhados | SSP-SP, ISP-RJ, Sejusp-MG | `Segurança × IDEB` → violência afeta evasão escolar? |
| Feminicídio (MG) | Sejusp-MG (tabela separada) | `Feminicídio × Renda` → vulnerabilidade de gênero × pobreza |

**Insight educativo:** Municípios com alta taxa de homicídios e baixa cobertura hospitalar criam um "duplo funil": mais vítimas + menos capacidade de atendimento.

---

#### 💰 Eixo 5 — Governança e Dinheiro Público

| Dados | Fonte primária | Cruzamento-chave |
|---|---|---|
| Contratos públicos | PNCP (já integrado) | `PNCP × CAGED/RAIS` → quem emprega com dinheiro público |
| Transferências federais | Transferegov (já integrado) | `Transferências × Pix` → circulação econômica gerada |
| Orçamento público | SIOP (planejada) | `SIOP × Execução` → dotação vs. gasto real |
| Auditorias e irregularidades | TCU (planejada) | `TCU × PNCP` → fornecedores com histórico de irregularidade |

---

### 1.3 🧠 Componente educativo — "O que esses dados dizem juntos?"

Cada página municipal terá uma seção fixa **"Cruzamentos"** com 3 correlações calculadas automaticamente, apresentadas em linguagem leiga:

```
┌─────────────────────────────────────────────────────────────┐
│  🔗 Cruzamentos para este município                        │
│                                                             │
│  1️⃣  Renda × IDEB → "O município tem renda compatível      │
│      com IDEB 5,8, mas o IDEB real é 4,5 — há uma lacuna     │
│      de 1,3 ponto a ser explicada."                        │
│                                                             │
│  2️⃣  Pix per capita × Bolsa Família → "O volume de Pix      │
│      (R$ 1.200/hab/mês) é 3× o valor do BF (R$ 380).        │
│      Isso indica circulação econômica local além do          │
│      benefício."                                            │
│                                                             │
│  3️⃣  Homicídios × Leitos UTI → "Com 18 homicídios e          │
│      apenas 12 leitos UTI, a razão é 1,5 vítima/leito        │
│      — acima da média estadual (0,8)."                      │
│                                                             │
│  💡 Quer explorar? → [Editor de cruzamentos drag-and-drop]   │
└─────────────────────────────────────────────────────────────┘
```

#### Editor de cruzamentos (drag-and-drop)

Interface tipo Google Data Studio para leigos:
- **Eixo X:** seleciona variável (renda, IDEB, homicídios, Pix, etc.)
- **Eixo Y:** seleciona outra variável
- **Filtro:** UF, faixa populacional, período
- O sistema gera o gráfico e **explica a correlação em linguagem simples** com um LLM (sem jargão estatístico).

---

### 1.4 📱 Princípios de UI/UX e acessibilidade

| Princípio | Aplicação concreta |
|---|---|
| **Leigo primeiro** | Todo gráfico tem: título em linguagem natural + 1 frase explicativa + "o que olhar" destacado |
| **Mobile-first** | Layout responsivo; mapas com zoom de dois dedos; filtros em bottom sheet |
| **Progressive disclosure** | Dados agregados carregam primeiro; detalhe sob demanda (lazy load) |
| **Compartilhável** | Botão "Copiar link do gráfico" → link direto para aquele visível (útil para jornalistas) |
| **Modo "explicar"** | Ícone ℹ️ em cada card abre explicação de 2 frases: "O que é X" + "Por que importa" |
| **WCAG AA** | Contraste mínimo 4.5:1, leitura por screen reader, teclado navegável |
| **Modo escuro** | Reduz consumo de bateria em celular; preserva legibilidade de mapas |

---

### 1.5 📊 Métricas de sucesso (KPIs educativos)

| Métrica | Meta trimestral |
|---|---|
| Tempo médio na página de cruzamentos | < 2 minutos (indica engajamento) |
| Taxa de uso do editor drag-and-drop | > 15% dos visitantes únicos |
| Compartilhamentos de link de gráfico | > 500/mês |
| Acessos mobile vs. desktop | > 55% mobile |
| Feedback qualitativo (NPS/CSAT) | > 7/10 em "entendi os dados" |

---

## PARTE 2 — PLANO TÉCNICO: Implementação, Decisões e Infraestrutura

---

### 2.1 🗺️ Arquitetura de dados — Pipeline híbrido

```
┌─────────────────────────────────────────────────────────────────────┐
│  CAMADA 1: FONTES PÚBLICAS (você controla o ETL)                   │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │ • INEP (Censo Escolar, Censo Superior, IDEB)               │  │
│  │ • RAIS, CAGED (via basedosdados.org BigQuery público)       │  │
│  │ • CNES, SIH-SUS, CFEM, SALIC (dados.gov.br → ETL Python)    │  │
│  │ • BCB (IPCA, Selic, dólar via API Olinda)                   │  │
│  │ • Transferegov, PNCP, Portal da Transparência (APIs)        │  │
│  │ • SIOP, TCU (quando disponíveis)                            │  │
│  └──────────────────────┬──────────────────────────────────────┘  │
│                         │                                        │
│  ┌──────────────────────▼──────────────────────────────────────┐  │
│  │  ETL: Airflow / GitHub Actions / Python scripts             │  │
│  │  • Baixa dados das fontes públicas                          │  │
│  │  • Normaliza (DuckDB / Pandas)                               │  │
│  │  │  → CSVs limpos → Postgres/D1 no Neon                     │  │
│  └──────────────────────┬──────────────────────────────────────┘  │
│                         │                                        │
│  ┌──────────────────────▼──────────────────────────────────────┐  │
│  │  DATA OCEAN (Sabiá como assistente)                         │  │
│  │  • Usado via função-call quando necessário                  │  │
│  │  • Ex: Pix por município, séries IPEA complexas             │  │
│  │  → Retorna JSON → armazenado em cache (Redis/D1 KV)         │  │
│  └──────────────────────┬──────────────────────────────────────┘  │
│                         │                                        │
│  ┌──────────────────────▼──────────────────────────────────────┐  │
│  │  API DO CONTROLE POPULAR (/api/v1/*)                        │  │
│  │  • Consome dados da Camada 1 + resultados do Data Ocean    │  │
│  │  • Retorna JSON agregado para o frontend                    │  │
│  └─────────────────────────────────────────────────────────────┘  │
```

---

### 2.2 📦 Stack tecnológica por camada

| Camada | Tecnologia | Justificativa |
|---|---|---|
| **Ingestão ETL** | Python 3.12 + Airflow (ou GitHub Actions para fontes pequenas) | Flexibilidade para ETLs heterogêneos |
| **Processamento** | DuckDB (para ETLs tabulares) + Pandas | Leve, rápido, SQL-like |
| **Armazenamento** | Neon Postgres (já usado) + D1 para dados estáticos | Manter a arquitetura atual |
| **Cache** | Redis ou D1 KV | Cache de queries agregadas frequentes |
| **API backend** | Next.js API routes (TypeScript) | Já é o stack do portal |
| **Query assistente** | Sabiá função-call (quando disponível) | Para dados exclusivos do Data Ocean |
| **Frontend** | React 18 + Next.js 14 | Já em uso |
| **Visualização** | Recharts (leve, ~15KB gzipped) | Menor bundle que D3; bom para mobile |
| **Mapas** | MapLibre GL JS (~50KB) | Open-source, sem custo de API |
| **CI/CD** | GitHub Actions | Já em uso |

---

### 2.3 🔄 Fluxo de trabalho detalhado por fonte

#### A) Fontes via basedosdados.org (mais fácil)

```
1. Consulta direta no BigQuery público:
   SELECT * FROM `basedosdados.br_inep_censo_escolar.escola`
   WHERE ano = 2024 AND sigla_uf = 'MG'

2. Ou via API REST (quando disponível):
   GET https://api.basedosdados.org/v1/query?q=...

3. Resultado → salva em Postgres local (tabela `edu_escolas_mg`)
```

#### B) Fontes via API governamental (BCB, Transparência)

```
1. Script Python com requests:
   - BCB: GET https://olinda.bcb.gov.br/olinda/servico/sgs/versao/v3/odata/SERIES('433')/Dados
   - Transferegov: GET https://api.transferegov.br/api-de-dados/transferencias
   - PNCP: GET https://api-novo.plataformamaisbrasil.gov.br/... (autenticação necessária)

2. Processa JSON → salva em Postgres
3. Agendamento: GitHub Actions cron (diário/semanal conforme a fonte)
```

#### C) Fontes via download de arquivos (CNES, SINESP VDE)

```
1. Script de download:
   - CNES: wget https://dados.gov.br/dados/conjuntos-dados/cnes/download
   - SINESP VDE: wget https://dados.gov.br/dados/conjuntos-dados/sinesp-vde

2. ETL com Pandas/DuckDB:
   - Normaliza nomes de colunas
   - Converte tipos (string → float/int)
   - Geocodifica (se necessário)
   - Filtra apenas municípios de interesse (MG + capitais)

3. Upload para Postgres:
   - Tabela `saude_cnes` e `seguranca_sinesp`

4. Agendamento: GitHub Actions semanal
```

#### D) Fontes via Data Ocean (quando disponível)

```
1. Função-call via API Maritaca:
   POST /v1/chat/completions
   {
     "model": "sabiá-4",
     "tools": [{
       "type": "function",
       "function": {
         "name": "query_bcb",
         "parameters": {
           "sql": "SELECT municipio_ibge, SUM(vl_recebedor_pf) FROM pix_transacoes_municipio WHERE ano_mes = '2025-06-01' AND municipio_ibge LIKE '31%' GROUP BY 1"
         }
       }
     }]
   }

2. O Sabiá retorna JSON → script salva em cache (Redis/D1 KV)
3. Frontend consulta a API do Controle Popular → que busca o cache
```

---

### 2.4 📋 Cronograma de implementação (12 semanas)

| Semana | Fase | Entregáveis |
|---|---|---|
| **1–2** | **Infra de ETL** | Scripts Python para CNES, SIH-SUS, SINESP VDE; pipeline Airflow básico; tabelas Postgres criadas |
| **3–4** | **INEP + RAIS/CAGED** | Integração via basedosdados.org; endpoints `/api/v1/educacao/municipio/[id]` e `/api/v1/trabalho/municipio/[id]` |
| **5–6** | **Painel municipal v1** | Página de município com visão geral (renda, pop, IDEB, homicídios); mapa temático com toggle de camadas |
| **7–8** | **Cruzamentos automáticos** | Componente "Cruzamentos" com 3 correlações por município; backend de queries parametrizadas |
| **9–10** | **Editor drag-and-drop** | Interface de exploração de dados para leigos; LLM para explicação em linguagem natural |
| **11–12** | **Acessibilidade + mobile** | Testes com screen reader; otimização de bundle (<2MB); modo escuro; bottom sheets no mobile |
| **+contínuo** | **Data Ocean on-demand** | Função-call para Pix/IPEA quando disponível; monitoramento de frescor dos dados |

---

### 2.5 ⚠️ Decisões críticas que precisam de aprovação

| Decisão | Opções | Recomendação | Impacto |
|---|---|---|---|
| **Como consumir INEP/RAIS/CAGED** | (a) ETL próprio a partir de ZIPs do gov.br · (b) Usar basedosdados.org BigQuery | **(b)** — mais simples, já harmonizado | Reduz ~80% do esforço de ETL |
| **Como consumir Pix municipal** | (a) Esperar Data Ocean via Sabiá · (b) Não usar · (c) Estimar via proxies | **(a)** se houver acesso via função-call | Dado exclusivo, alto valor diferencial |
| **Armazenamento de dados agregados** | (a) Só Postgres · (b) Postgres + Redis cache · (c) Postgres + D1 KV | **(b)** para queries frequentes + **D1 KV** para dados estáticos | Melhora performance mobile |
| **Editor de cruzamentos** | (a) Só pré-definidos · (b) Drag-and-drop com LLM · (c) SQL editor para avançados | **(b)** — maior valor educativo | Maior esforço de UI, mas único no mercado |
| **Arquivamento no Archive.org** | (a) Manual · (b) Automatizado via CI | **(b)** — `curl https://web.archive.org/save/` no CI semanal | Garante memória pública do site |
| **Licença dos dados processados** | (a) CC BY 4.0 · (b) ODbL · (c) Proprietário | **(a)** — compatível com dados abertos governamentais | Atrai comunidade e imprensa |

---

### 2.6 📐 Tabela de fontes — acesso e status

| # | Fonte | Acesso | Como consumir | Status no repo | Prioridade |
|---|---|---|---|---|---|
| 1 | CNES | dados.gov.br (CSV) | ETL Python → Postgres | ❌ Não integrado | 🔴 Alta |
| 2 | INEP (Censo Escolar) | basedosdados.org (BigQuery) | Query direto → Postgres | ✅ Parcial (docs) | 🔴 Alta |
| 3 | INEP (IDEB) | basedosdados.org (BigQuery) | Query direto → Postgres | ✅ Parcial | 🔴 Alta |
| 4 | INEP (Censo Superior) | basedosdados.org (BigQuery) | Query direto → Postgres | ❌ Não integrado | 🟡 Média |
| 5 | RAIS | basedosdados.org (BigQuery) | Query direto → Postgres | ❌ Não integrado | 🔴 Alta |
| 6 | CAGED | basedosdados.org (BigQuery) | Query direto → Postgres | ❌ Não integrado | 🔴 Alta |
| 7 | Pix municipal | Data Ocean (exclusivo) | Função-call Sabiá → Cache | ❌ Não disponível | ⚠️ Depende de acesso |
| 8 | IPEA (séries macro/sociais) | Data Ocean / SIDRA | Função-call ou API SIDRA | ❌ Não integrado | 🟡 Média |
| 9 | SINESP VDE | dados.gov.br (Excel) | ETL Python → Postgres | ❌ Não integrado | 🔴 Alta |
| 10 | SSP-SP / ISP-RJ / Sejusp-MG | Sites estaduais (CSV/XLS) | ETL Python → Postgres | ❌ Não integrado | 🟡 Média |
| 11 | SIOP | dados.gov.br | API/CSV → ETL | ❌ Planejada | 🟡 Média |
| 12 | TCU | contas.tcu.gov.br | API/CSV → ETL | ❌ Planejada | 🟡 Média |
| 13 | BCB (IPCA, Selic, dólar) | API Olinda (pública) | REST → Postgres | ✅ Integrado | ✅ Feito |
| 14 | Transferegov | API pública | REST → Postgres | ✅ Integrado | ✅ Feito |
| 15 | PNCP | API pública | REST → Postgres | ✅ Integrado | ✅ Feito |

---

### 2.7 📈 Métricas de sucesso (técnicas)

| Métrica | Meta |
|---|---|
| Tempo de ingestão de dados (ETL completo) | < 30 min por execução |
| Latência da API `/api/v1/cross` (p95) | < 500 ms |
| Tamanho do bundle JS (mobile) | < 2 MB |
| Cobertura de testes unitários dos ETLs | > 80% |
| Frequência de atualização dos dados | Diária (APIs) / Semanal (arquivos) |
| Snapshot de dados versionado | Mensal (git bundle + R2) |

---

### 2.8 🧩 Resumo executivo — o que pedir ao time

1. **Esta semana:** Criar ETLs para CNES e SINESP VDE (Python + DuckDB → Postgres)
2. **Próxima semana:** Integrar basedosdados.org para INEP/RAIS/CAGED via BigQuery público
3. **Semanas 3–4:** Construir o painel municipal com visão geral e mapa temático
4. **Semanas 5–8:** Implementar o componente "Cruzamentos