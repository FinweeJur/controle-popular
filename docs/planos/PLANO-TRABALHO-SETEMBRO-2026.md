# 📁 Plano de Trabalho — 2026 Setembro

> **Tipo:** PLANO  
> **Domínio:** gestão, priorização, execução  
> **Status:** ATIVO

---

## 🎯 Visão Geral

Expansão do portal **Controle Popular** com foco em **verificação de dados** e **análises sociais/ambientais** para MG.

---

## ✅ O QUE ENTREGUE NO ÚLTIMO CICLO (09/09/2026)

### 📚 Documentação
- **Novo plano criado:** `PLANO-ANALISE-CONSELHOS-OUTORGAS.md`
  - Métricas sociais, econômicas, educacionais
  - Dupla verificação obrigatória
  - Ranqueamento por custo-benefício
- **Skill criada:** `verificacao-dados-automacao`
  - Bot de cross-check automatizado
  - Detecção de duplicatas e inconsistências
- **Plano executável:** `PLANO-EXPANSAO-AMBIENTAL-OUTORGAS-TELIC.md`
  - Pipeline completo de coleta
  - Schemas de banco (conselhos, outorgas)

### 🗄️ Schemas de Banco
- **`apps/web/lib/db/schema-conselhos.ts`** (175 linhas)
  - Tabela `conselhos_membros` com regimentos
  - Tabela `votacoes_conselho` para análise
  - Tabela `analise_conselhos` com métricas sociais
  - **Zero CPF policy implementado**
  - **Dupla verificação incluída**

- **`apps/web/lib/db/schema-outorgas.ts`** (200 linhas)
  - Tabela `outorgas_agua` principal
  - Tabela `perfis_titulares_outorgas` (concentração)
  - Tabela `estatisticas_bacias` (mapa)
  - Tabela `analise_escassez` (risco hídrico)

### 🤖 Bots de Automação
- **`bots/verifica-dados.mts`** (script funcional)
  - Cross-check de valores entre fontes
  - Validação de códigos IBGE
  - Detecção de duplicatas
  - Geração de relatório JSON
- **`bots/notifica-telegram.mts`** (novo!)
  - Notificação automática ao Telegram
  - Uso: `npx tsx bots/notifica-telegram.mts --titulo "X" --resumo "Y" --status concluido`
- **`bots/orquestrador.mts`** (novo!)
  - Orquestra execução de microetapas
  - Notifica automaticamente ao Telegram
  - Uso: `npx tsx bots/orquestrador.mts --executar --etapa M1`
- **`bots/crosscheck-pdf-api.mts`** (novo! ✅ testado)
  - Cross-check PDF vs API do PNCP
  - Detecta discrepâncias em valores de contratos
  - Uso: `npx tsx bots/crosscheck-pdf-api.mts --pdf file.pdf --processo "006/2026"`
- **`bots/microresumo-escassez-betim.mts`** (novo! ✅ testado)
  - Gera microresumo de escassez hídrica
  - Dados de outorgas, fontes e CBH
  - Uso: `npx tsx bots/microresumo-escassez-betim.mts`
- **`bots/README.md`** (novo!)
  - Documentação completa de todos os bots

### 📊 Scripts de Coleta
|- **`scripts/etl/conselhos/scrape_conselhos_betim.mts`**
  - Coletor inicial para Betim
  - Cálculo de percentagens de representação
  - Microresumos educacionais
|- **`scripts/etl/outorgas/coletar-outorgas-mg.mts`** (novo! ✅ testado)
  - Coletor de outorgas do SIOUT/IGAM
  - Fonte: sistemas.meioambiente.mg.gov.br (55.729 outorgas)
  - Scraping sem dependências externas (regex puro)
|- **`scripts/coletar-pncp-mg.mts`**
  - Coletor de contratos e licitações do PNCP
  - 4 órgãos ambientais MG (SEMAD, FEAM, IEF, IGAM)
  - Retry automático e deduplicação

---

## 📋 PRÓXIMAS MICRO-ETAPAS

### Semana 1 (Prioridade Alta ⭐⭐⭐⭐⭐)

| Micro-ETA | Tarefa | Deadline | Status |
|-----------|--------|----------|--------|
| V1 | Testar script `verifica-dados.mts` com dados reais PNCP | 10/set | ✅ CONCLUÍDO |
| V2 | Validar schema `conselhos_membros` no Neon (migration) | 11/set | ⏳ BLOQUEADO (Neon 402) |
| V3 | Coletar dados reais de conselhos Betim (scraping) | 12/set | ✅ CONCLUÍDO |
| V4 | Cross-check com PDFs oficiais (PNCP, Diário) | 13/set | ✅ CONCLUÍDO |
| V5 | Atualizar AGENTS.md com nova regra de dupla verificação | 14/set | ✅ CONCLUÍDO |

### Semana 2 (Prioridade Média ⭐⭐⭐)

| Micro-ETA | Tarefa | Deadline | Status |
|-----------|--------|----------|--------|
| O1 | Testar coletor SIOUT (outorgas Betim) | 17/set | ✅ CONCLUÍDO |
| O2 | Validar schema `outorgas_agua` no Neon | 18/set | ⏳ BLOQUEADO (Neon 402) |
| O3 | Gerar microresumo de escassez hídrica Betim | 19/set | ✅ CONCLUÍDO |
| O4 | Criar route `/conselhos/mg` (lista MG) | 21/set | ✅ CONCLUÍDO |

### Semana 3 (Prioridade Média ⭐⭐⭐)

| Micro-ETA | Tarefa | Deadline |
|-----------|--------|----------|
| S1 | Seed de 10 cidades-beta no banco | 24/set |
| S2 | Criar route `/ambiental/outorgas/mg` | 25/set |
| S3 | Integração com cronjob (coleta automática) | 26/set |
| S4 | Dashboard `/admin/verificacao` | 28/set |

### Semana 4 (Fechamento ⭐⭐)

| Micro-ETA | Tarefa | Deadline |
|-----------|--------|----------|
| D1 | Testar com dados reais de 5 cidades | 01/out |
| D2 | Ajustar tolerâncias e limiares | 03/out |
| D3 | Documentar em FONTES.md | 05/out |
| D4 | Handoff para outros projetos | 06/out |

---

## 🏆 RIQUENSSO POR CUSTO-BENEFÍCIO

### Top 3 Valores da Semana

1. **🤖 Bot Verificação de Dados** (V1) — **ROI ⭐⭐⭐⭐⭐**
   - Previne propagação de erros
   - 1 script → horas de auditoria evitadas
   - **Justificativa:** O caso do PNCP R$ 900M mostrado pelo usuário é exatamente o cenário que este bot resolve

2. **📊 Schema de Conselhos Membros** (V2) — **ROI ⭐⭐⭐⭐⭐**
   - Estrutura dados sociais para análise
   - Foco em representação gov vs sociedade civil
   - **Justificativa:** Base para análises de democratização da participação

3. **💧 Schema de Outorgas** (O2) — **ROI ⭐⭐⭐⭐**
   - Mapa de escassez hídrica
   - Detecção de concentração
   - **Justificativa:** Dados ambientais críticos para comunidades afetadas

---

## ⚠️ ARMADILHAS IDENTIFICADAS

| Armadilha | Solução | Status |
|-----------|---------|--------|
| CPF em LaTeX PDF | Máscara automática | ✅ Implementado |
| Código IBGE 6×7 dígitos | Validação automática | ✅ Script criado |
| Dados de outro município | Cross-check por IBGE | ✅ Bot detecta |
| Valores em PDF vs API | Cross-check automático | ✅ Bot implementado |
| Duplicatas de processo | Detecção por chave | ✅ Bot implementado |

---

## 📚 HISTÓRIA DOS CASOS PROCESSADOS

### Caso PNCP R$ 900M

**Problema:** Portal mostrava R$ 900 milhões — PDF original mostrava R$ 900 mil

**Solução Implementada:**
1. Bot `verifica-dados.mts` cross-check automático
2. Alerta CRÍTICO gerado
3. Fonte recomendada: PDF original
4. Confiabilidade atualizada: 0.3 → valor corrigido

**Lição:** Sempre cross-check valores críticos com fonte secundária

---

## 🔗 LINKS ÚTEIS

- **Skill de Verificação:** `skills/productivity/verificacao-dados-automacao/SKILL.md`
- **Plano Detalhado:** `docs/planos/PLANO-ANALISE-CONSELHOS-OUTORGAS.md`
- **Plano de Expansão:** `docs/planos/PLANO-EXPANSAO-AMBIENTAL-OUTORGAS-TELIC.md`
- **Plano de Trabalho:** `docs/planos/PLANO-TRABALHO-SETEMBRO-2026.md`
- **Resumo de Planos:** `docs/planos/RESUMO-PLANOS.md`
- **Bot Verificação:** `bots/verifica-dados.mts`
- **Bot Notificação:** `bots/notifica-telegram.mts`
- **Bot Crosscheck:** `bots/crosscheck-pdf-api.mts`
- **Bot Escassez:** `bots/microresumo-escassez-betim.mts`
- **Orquestrador:** `bots/orquestrador.mts`
- **README Bots:** `bots/README.md`
- **Schema Conselhos:** `apps/web/lib/db/schema-conselhos.ts`
- **Schema Outorgas:** `apps/web/lib/db/schema-outorgas.ts`
- **Catalogo Conselhos:** `apps/web/lib/conselhos/catalogo.ts`
- **Dados Conselhos:** `apps/web/data/conselhos/conselhos-analise.json`
- **Dados Outorgas:** `apps/web/data/outorgas/outorgas-mg.json`
- **Auditoria:** `docs/audit/`

---

> ✨ *"Dados sem verificação são só números; dados verificados são ferramentas de transformação."*