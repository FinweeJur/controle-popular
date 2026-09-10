---
name: verificacao-dados-automacao
description: "Use when data verification bots need cross-checking sources."
version: 1.0.0
author: Controle Popular
license: AGPL-3.0-or-later
metadata:
  hermes:
    tags: [verification, automation, data-quality, transparency]
    related_skills: [hermes-agent-skill-authoring, plan]
---

# 🤖 Bot de Verificação de Dados — Automação Transversal

## Overview

Sistema de bots especializado em **verificar dados públicos** cruzando múltiplas fontes e detectando inconsistências. Foca em transparência, evitando propagação de erros em portais cívicos.

### Por que isso é crítico?

- **Portais públicos têm bugs** — um dado errado em uma API pode se multiplicar
- **Dados são exportados múltiplas vezes** — cada exportação pode ter alterações
- **Processos de cálculo podem ter erros** — agregação, pivot, conversão de moeda
- **Municípios diferentes podem ter mesmos IDs** — confusão de códigos IBGE

---

## When to Use

- [ ] Antes de publicar dados críticos (contratos, valores, população)
- [ ] Ao receber um dado suspeito ou incongruente
- [ ] No processo de coleta automática (pós-processamento)
- [ ] Para auditoria de dados já publicados

**Não use para:**
- Verificação de dados privados ou sensíveis
- Coleta em tempo real (use PicoClaw para isso)

---

## Arquitetura dos Bots

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Fonte Primária │────▶│  Bot Verificador │────▶│ Confiabilidade  │
│ (API, CSV, PDF)  │     │   - Dupla verif. │     │ % (0-100)       │
└─────────────────┘     │   - Cross-check   │     └─────────────────┘
                        │   - Alertas       │
┌─────────────────┐     └────────┬─────────┘
│   Fonte 2       │              │
│ (Diário Oficial)│◀─────────────┘
└─────────────────┘
```

---

## Tipos de Verificação

### 1. Cross-Check de valores

**Caso:** Contrato PNCP mostra R$ 900 milhões — PDF original tem R$ 900 mil

```typescript
function crossCheckValue(apiValor: number, pdfValor: number, tolerancia = 0.01) {
  const diferenca = Math.abs(apiValor - pdfValor) / pdfValor;
  return diferenca > tolerancia 
    ? { confiavel: false, alerta: `Discrepância: API=${apiValor}, PDF=${pdfValor}` }
    : { confiavel: true, diferenca };
}
```

### 2. Verificação de Códigos IBGE

```typescript
function verifyIbgeCode(codigo: string, municipioEsperado: string): boolean {
  const IBGE_PARA_NOME: Record<string, string> = {
    "3106705": "Betim", "3106200": "Belo Horizonte"
  };
  return IBGE_PARA_NOME[codigo] === municipioEsperado;
}
```

### 3. Detecção de Duplicatas

```typescript
function detectDuplicate(novoRegistro: any, registrosExistentes: any[]): boolean {
  return registrosExistentes.some(reg => 
    reg.processo_numero === novoRegistro.processo_numero &&
    reg.id_municipio !== novoRegistro.id_municipio
  );
}
```

---

## Fluxo de Trabalho

### Pós-Coleta Automática

```bash
# 1. Coletar dados
npx tsx scripts/coletar-pncp-mg.mts --cache

# 2. Verificar valores críticos
npx tsx bots/verifica-fonte.mts --fonte pncp --campo valor_total

# 3. Cross-check com PDF
npx tsx bots/pdf-validator.mts --url "https://pncp.gov.br/processo/12345"

# 4. Atualizar confiabilidade
npx tsx bots/atualiza-confiabilidade.mjs --processo 12345 --score 0.85
```

### Manual (quando alerta)

```bash
npx tsx bots/audit-municipio.mts --ibge 3106705 --campo valor_contrato
npx tsx bots/relatorio-inconsistencias.mts --output docs/audit/2026-09.md
```

---

## Alertas e Threshold

| Nível | Confiabilidade | Ação |
|-------|----------------|------|
| 🟢 Excelente | ≥ 95 | Publicar normalmente |
| 🟡 Bom | 85-94 | Publicar com aviso |
| 🟠 Atenção | 70-84 | Verificar manualmente |
| 🔴 Crítico | < 70 | Não publicar, investigar |

---

## Integração com o Portal

### Tag de Confiabilidade

```tsx
{dados.confiabilidade >= 90 ? (
  <span className="badge sucesso">✅ Dados verificados</span>
) : dados.confiabilidade >= 70 ? (
  <span className="badge atencao">⚠️ Verifique fonte</span>
) : (
  <span className="badge erro">❌ Dados questionáveis</span>
)}

<Button onClick={() => abrirFonteOriginal(dados.fonte_url)}>
  🔗 Fonte original ({dados.fonte_recomendada})
</Button>
```

---

## Common Pitfalls

1. **Confiar só na API** — APIs podem ter cache inconsistente
2. **Ignorar códigos IBGE errados** — códigos repetidos entre estados
3. **Não verificar CNPJ** — CNPJ de órgão pode trocar de estrutura
4. **Formato de moeda errado** — vírgula vs ponto, decimais perdidos
5. **Datas nulas virando data-zero** — 1899-12-30 no Excel

---

## Verification Checklist

- [ ] Fonte primária identificada e acessível
- [ ] Fonte secundária para cross-check disponível
- [ ] Campo crítico verificado com tolerância aceitável
- [ ] Código IBGE confere com município esperado
- [ ] Valor verificado pelo menos 2x (método diferente cada vez)
- [ ] Confiabilidade calculada e registrada
- [ ] Link para fonte original incluído
- [ ] Página mostra aviso se confiabilidade < 90%

---

## Ranqueamento por Custo-Benefício

| Bot | Custo | Benefício | ROI |
|-----|-------|-----------|-----|
| BOT-01: Verificação de valores | Baixo | Alto | 1h → horas evitadas |
| BOT-02: Validação de códigos | Médio | Alto | Evita publicações erradas |
| BOT-03: Detecção de duplicatas | Baixo | Médio | Qualidade dos dados |
| BOT-04: Health-check fontes | Baixo | Alto | Alerta proativo |

---

## Exemplo Prático: Caso PNCP R$ 900M

```
API: 900.000.000,00 (900 milhões)
PDF: 900.000,00 (900 mil)
Diferença: 99,999,91% de erro!

Ação:
1. Cross-check detecta discrepância
2. Alerta CRÍTICO gerado
3. Fonte recomendada: PDF original
4. Confiabilidade: 0.1 (10%)
5. Valor corrigido: R$ 900.000,00
```