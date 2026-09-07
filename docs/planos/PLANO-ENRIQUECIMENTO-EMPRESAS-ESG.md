# Plano — Enriquecimento de Empresas com Scraping Documental ESG

> **Tipo:** PLANO
> **Domínio:** empresas
> **Data:** 2026-09-07
> **Prioridade:** alta (decisão do dono, item da fila)
> **Relacionados:** [ESTADO.md](../02-estado/ESTADO.md), [PRODUTO.md](../01-produto/PRODUTO.md), [PLANO-SEU-NONO-NOTEBOOKLM.md](PLANO-SEU-NONO-NOTEBOOKLM.md)
> **Palavras-chave:** scraping, ESG, Vale, documentos, empresas, paraopeba, rio doce, seu-nono, sabia-7b

## Sumário

- [Propósito](#propósito)
- [Estado medido (07/09/2026)](#estado-medido-07092026)
- [O que falta nas páginas de empresas](#o-que-falta-nas-páginas-de-empresas)
- [Fontes ESG disponíveis para scraping](#fontes-esg-disponíveis-para-scraping)
- [Ordem de execução](#ordem-de-execução)
- [Verificação](#verificação)
- [Code review geral identificado](#code-review-geral-identificado)

---

## Propósito

Enriquecer as páginas de empresas do portal (`/empresas` e `/empresas/[slug]`) raspando os documentos disponíveis nos sites oficiais — relatórios ESG, relatórios de sustentabilidade, dados de produção, informações de compliance e documentos públicos — e servir esses documentos via PDF bucket (R2) com hyperlink para o site oficial.

**Regra editorial aplicável (AGENTS.md):** o número vem do dado; o modelo, se houver, só embrulha. Documentos raspados são **ato público** — a fonte é o site oficial, o conteúdo é factual.

---

## Estado medido (07/09/2026)

### O que existe

| Item | Localização | Estado |
|---|---|---|
| Página `/empresas` | `apps/web/app/empresas/page.tsx` | ✅ No ar com 130 entidades |
| Página `[slug]` | `apps/web/app/empresas/[slug]/page.tsx` | ✅ 6 seções renderizadas |
| Dados das entidades | `apps/web/data/empresas-perfil/entidades-completas.json` | ✅ 3.901 linhas, dados realistas |
| Cotacoes Vale | `apps/web/data/vale3-cotacoes.json` | ✅ B3 COTAHIST, 2015-2026 |
| Dados CVM | `apps/web/data/cvm-vale.json` | ✅ ITR/DFP/FRE |
| Noticias Vale | `apps/web/data/noticias-vale.json` | ✅ Radar Mineração |
| Socios Vale | `apps/web/data/socios-vale.json` | ✅ 6 diretores (M8) |
| SIGMINE | `apps/web/lib/empresas/sigmine.ts` | ✅ GeoJSON 6.06 MB |
| Seu Nono Sabia 7B | `etl/finetuning/dataset-seu-nono-v1.jsonl` | ✅ 405 amostras, treino concluído |
| Pipeline de treino | `scripts/treinar-sabia-automacao.py` | ✅ 10/10 golden tests, 0% alucinação |
| Enriquecimento Sabia | `scripts/enriquecer-dataset-sabia.py` | ✅ 442 linhas, 13 exemplos novos |

### O que falta

| # | Falha | Onde | Impacto |
|---|---|---|---|
| 1 | `NOTICIAS_VALE` é array vazio | `apps/web/lib/empresas/noticias.ts:53` | Seção "Notícias & Radar" da Vale fica vazia |
| 2 | Dados ESG são **simulados** (contratos genéricos, linha do tempo falsa) | `apps/web/lib/empresas/entidades-dados.ts:138-256` | Risco editorial: dado inventado é dano |
| 3 | Nenhum documento ESG raspado do site da Vale | `apps/web/data/` | Perda de informação pública relevante |
| 4 | Sem coletor automatizado de documentos ESG | `scripts/` | Depende de handwork manual |
| 5 | Página `/empresas/vale` não existe como slug | `apps/web/app/empresas/[slug]/page.tsx` | Vale não tem página própria de observatório |

---

## O que falta nas páginas de empresas

O código atual gera dados **simulados** para empresas que não existem no array `EMPRESAS`:

```typescript
// apps/web/lib/empresas/entidades-dados.ts:138-164
// Contratos são FICTÍCIOS — "Prestação de serviços estratégicos e infraestrutura"
// Valores são INVENTADOS — "R$ 48.250.000,00"
// TACs são FICTÍCIOS — "Monitoramento contínuo de estruturas geotécnicas"
```

**Isto é armadilha editorial.** Para mineradoras como a Vale, contratos e TACs inventados são especialmente perigosos porque o leitor pode confiar no dado. A página da Vale precisa:

1. **Dados reais da CVM** (ITR, DFP, FRE já existem em `cvm-vale.json`)
2. **Documentos ESG do site** (raspados ou linkados)
3. **Notícias reais de monitoramento** (`NOTICIAS_VALE` está vazio!)
4. **TACs reais** do MPMG/MPF (já coletados em `apps/web/data/tacs_mineradoras.py`)

---

## Fontes ESG disponíveis para scraping

### Vale S.A. — Fontes oficiais mapeadas

| Fonte | URL | Tipo | Status |
|---|---|---|---|
| ESG Portal home | `https://www.vale.com/esg/home` | HTML | ✅ Medido (3432 tokens) |
| Social performance | `https://www.vale.com/social` | HTML | ✅ Medido (2641 tokens) |
| Environment | `https://www.vale.com/environment` | HTML | ✅ Medido (3852 tokens) |
| Integrated Strategy | `https://vale.com/esg/integrated-strategy` | HTML | ⏳ Pagar |
| Nature | `https://vale.com/esg/nature` | HTML | ⏳ Pagar |
| Climate | `https://vale.com/esg/climate` | HTML | ⏳ Pagar |
| Social | `https://vale.com/esg/social` | HTML | ⏳ Pagar |
| Dams | `https://vale.com/dams` | HTML | ⏳ Pagar |
| Document library | `https://vale.com/en/esg/document-library` | HTML | ⏳ Pagar |
| Last updates | `https://www.vale.com/esg/last-updates` | HTML | ⏳ Pagar |
| Tax Contribution Report 2025 | `https://vale.com/documents/d/guest/tax-contribution-report_2025` | PDF | ⏳ Download |
| CDP 2024 | `https://www.vale.com/documents/44618/5301309/...pdf` | PDF | ⏳ Download |
| Vale & Nature 2024 | `https://www.vale.com/documents/44618/436238/...pdf` | PDF | ⏳ Download |
| Production & Sales 2Q26 | `https://www.vale.com/w/vale-production-sales-q2-26-1/` | HTML | ⏳ Pagar |
| ISSB Report 2025 | `https://www.vale.com/w/vale-2025-issb-report-...` | HTML/PDF | ⏳ Pagar |
| GHG Emissions Report 2025 | `https://www.vale.com/w/vale-publishes-its-2025-ghg-emissions-report/` | HTML/PDF | ⏳ Pagar |
| Climate Change Policy | `https://www.vale.com/w/vale-updates-its-climate-change-policy/` | HTML | ⏳ Pagar |
| Upstream Dam Decharacterization | `https://www.vale.com/w/vale-completes-decharacterization-work-on-19th-upstream-dam/` | HTML | ⏳ Pagar |

### O que extrair de cada fonte

Cada fonte tem **campos estruturados** previsíveis:

- **Commitments** → tabela de metas com ano-alvo e valor
- **Dams** → status de descaracterização por estrutura
- **Production & Sales** → números de produção por mineral, trimestre
- **Last Updates** → headline + link + data
- **Document Library** → título + tipo + data + URL do PDF
- **ESG sections** → indicadores com número e unidade

---

## Ordem de execução

### Fase 0 — Corrigir o que é urgente (hoje)

| # | Tarefa | Arquivo | Esforço |
|---|---|---|---|
| 0.1 | Preencher `NOTICIAS_VALE` com notícias reais | `apps/web/lib/empresas/noticias.ts` | 15 min |
| 0.2 | Remover dados fictícios de `entidades-dados.ts` para Vale | `apps/web/lib/empresas/entidades-dados.ts` | 30 min |
| 0.3 | Substituir dados simulados por `cvm-vale.json` + `noticias-vale.json` | `apps/web/app/empresas/[slug]/page.tsx` | 30 min |

### Fase 1 — Coletor de documentos ESG (1-2 dias)

| # | Tarefa | Descrição | Esforço |
|---|---|---|---|
| 1.1 | Criar `scripts/coletar-docs-esg-vale.mts` | Coletor que raspa as URLs mapeadas acima, salva HTML/PDF em `apps/web/data/esg/` | 2h |
| 1.2 | Criar `scripts/download-pdf-esg.mts` | Download de PDFs do Document Library da Vale para bucket R2 | 1h |
| 1.3 | Registrar fonte no registry | Entrada `vale-esg-documentos` em `apps/web/lib/fontes/registry.ts` | 15 min |
| 1.4 | Varredura de dado pessoal | `scripts/checar-dado-pessoal-em-dado.py` sobre arquivos baixados | 15 min |

**O coletor deve:**
- User-Agent honesto (`Controle-Popular/1.0 (controlepopular.com.br)`)
- Pausa de 2s entre requisições
- Salvar tanto HTML quanto PDF
- Gravar metadados em JSON (`fonte`, `url`, `data`, `hash`)
- Não commitar PDF no repositório (vai para R2)

### Fase 2 — Integração com páginas (1-2 dias)

| # | Tarefa | Descrição | Esforço |
|---|---|---|---|
| 2.1 | Nova seção "Documentos ESG" em `/empresas/vale` | Cards com título do documento, data, link R2 ou site oficial | 2h |
| 2.2 | Seção "Compromissos" com metas reais | Tabela extraída do ESG Portal (deadlines, valores) | 1h |
| 2.3 | Seção "Produção e Vendas" | Números reais do relatório de 2Q26 | 1h |
| 2.4 | Badge de "última atualização" | Data do documento mais recente raspado | 30 min |

### Fase 3 — Seu Nono Sabia para análise integrada (2-3 dias)

| # | Tarefa | Descrição | Esforço |
|---|---|---|---|
| 3.1 | Adicionar exemplos de pergunta/resposta sobre ESG da Vale ao dataset | `scripts/enriquecer-dataset-sabia.py` — novo bloco de exemplos | 1h |
| 3.2 | Enriquecer com análise de documentos do Rio Doce | Mesmo modelo, mesma abordagem para a biblioteca do Rio Doce (`/ambiental/mariana`) | 2h |
| 3.3 | Executar treino automatizado | `scripts/treinar-sabia-automacao.py` → validação golden set | 30 min |
| 3.4 | Publicar e verificar | Build no home-pc, deploy, teste | 30 min |

### Fase 4 — Expandir para outras empresas (futuro)

| # | Empresa | Fontes | Prioridade |
|---|---|---|---|
| 4.1 | CSN Mineração | Site CSN + CVM | Média |
| 4.2 | Samarco | Site Samarco + Relatório Renova | Média |
| 4.3 | Petrobras | Site Petrobras + Portal de Transparência | Alta |
| 4.4 | Anglo American | Site AA + CVM | Média |

---

## Code review geral identificado

### Armadilhas encontradas no código de empresas

| # | Armadilha | Severidade | Localização |
|---|---|---|---|
| CR1 | **Dados fictícios em produção** — `entidades-dados.ts` gera contratos e TACs inventados para empresas não cadastradas no array `EMPRESAS` | 🔴 Alta | `apps/web/lib/empresas/entidades-dados.ts:138-256` |
| CR2 | **`NOTICIAS_VALE` vazio** — array vazio na fonte de notícias | 🟡 Média | `apps/web/lib/empresas/noticias.ts:52-53` |
| CR3 | **Simulação de dados sem marcação** — linha do tempo e contratos são gerados por lógica condicional (`isMineracao`) sem indicar que são "dados de exemplo" | 🔴 Alta | `apps/web/lib/empresas/entidades-dados.ts:224-256` |
| CR4 | **Cache de SIGMINE sem invalidção** — `cache` é variável de módulo, não há invalidação entre builds | 🟡 Média | `apps/web/lib/empresas/sigmine.ts:30` |
| CR5 | **`dados.ts` com apenas 2 empresas** — `EMPRESAS` tem apenas Sigma Lithium e Vale; o array `entidades-completas.json` tem 130 mas são entradas genéricas | 🟡 Média | `apps/web/lib/empresas/dados.ts:14-88` |
| CR6 | **`cvm-vale.json` lido no build sem verificação** — se o arquivo estiver vazio ou malformado, a página quebra | 🟡 Média | `apps/web/app/paraopeba/vale/documentos/page.tsx` |
| CR7 | **Notícias de Sigma Lithium são hardcoded** — não vêm de coletor; são lista manual estática | 🟡 Média | `apps/web/lib/empresas/noticias.ts:9-50` |
| CR8 | **Falta de tipagem para `NOTICIAS_VALE`** — o array está vazio mas a tipagem `NoticiaMonitoramento[]` é consistente | 🟢 Baixa | `apps/web/lib/empresas/noticias.ts` |

### Code review de outros arquivos recentes

| # | O que verificar | Status |
|---|---|---|
| CV1 | `scripts/enriquecer-dataset-sabia.py` — o script funciona mas tem `NOVOS_EXEMPLOS` com dados que podem ser verificáveis (valores financeiros). Necessário conferir fonte de cada número. | ⏳ Pendente |
| CV2 | `scripts/treinar-sabia-automacao.py` — pipeline robusto, logs estruturados, mas o "Golden Set" tem números que precisam de fonte verificável. | ⏳ Pendente |
| CV3 | `apps/web/lib/assistente/seu-nono-dados.ts` — 953 linhas de dados determinísticos. Bom. Verificar se algum número não tem fonte. | ⏳ Pendente |
| CV4 | `apps/web/app/empresas/[slug]/page.tsx` — a lógica `processosPorEmpresa` depende de `empresaLegada?.sinonimosSigmine`. Se `empresaLegada` for `undefined` para um slug que existe em `entidades-completas.json`, o filtro pode não encontrar nada. | ⏳ Pendente |
| CV5 | `apps/web/lib/empresas/entidades-dados.ts` — a função `listarTodasEntidades()` combina dados de `entidades-completas.json` (130 empresas) e `EMPRESAS` (2 legadas). A lógica de merge pode duplicar ou perder dados se houver slug conflituoso. | ⏳ Pendente |

### O que o code review NÃO encontrou (verificar manualmente)

| # | Risco | Por que não é automático |
|---|---|---|
| CRX1 | **Dado pessoal em `socios-vale.json`** — o M8 coletou CPF mascarado, mas a guarda não varreu o arquivo resultante | A guarda varre JSON no pre-push, mas não verifica se o JSON já tem CPF |
| CRX2 | **Números no `enriquecer-dataset-sabia.py`** — valores como "R$ 380 milhões", "R$ 14,96 bilhões" são citados sem fonte no script | O script é do dataset de treino, não do site; precisa de fonte |
| CRX3 | **Contratos de Vale em `entidades-dados.ts`** — são fictícios mas parecem reais (CNPJ correto "33.592.510/0001-54") | O CNPJ é real, os contratos são inventados |

---

## Verificação

```bash
# 1. Guarda de dado pessoal
python scripts/checar-dado-pessoal-em-dado.py

# 2. Tipos
npx tsc --noEmit

# 3. Testes
npm test

# 4. Validar documentação
python scripts/validar-documentacao.py

# 5. Build no home-pc (se Neon estiver disponível)
next build

# 6. Contar testes (para atualizar ESTADO.md)
npm test
```

**Baseline de testes em 15/08:** 601 vitest + 121 globo. Remeça antes de citar.

---

## Origem

Este plano é resultado de code review do código de empresas em 07/09/2026. Combina:
- Análise das páginas `apps/web/app/empresas/` e `apps/web/lib/empresas/`
- Levantamento de fontes ESG no site da Vale (web scraping realizado)
- Contexto do modelo Seu Nono Sabia 7B (treino concluído em 07/09)
- Regras editoriais do AGENTS.md e PRODUTO.md

Próximos passos: (1) aprovação do dono, (2) worktree próprio, (3) Fase 0 (correções urgentes), (4) Fase 1 (coletor), (5) build e deploy.
