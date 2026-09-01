# Fase 2 — Biblioteca Paraopeba: Classificação + Análise

> **Tipo:** PLANO
> **Domínio:** paraopeba
> **Última medição:** 2026-08-31
> **Leitura estimada:** média (5–15 min)
> **Relacionados:** [docs/01-produto/PRODUTO.md](01-produto/PRODUTO.md), [docs/02-estado/ESTADO.md](02-estado/ESTADO.md), [AGENTS.md](/AGENTS.md)
> **Palavras-chave:** paraopeba, biblioteca, ati, brumadinho, classificacao, temas, auditoria

## Sumário

- [Contexto](#contexto)
- [Problema 1: 210 itens sem temas](#problema-1-210-itens-sem-temas)
- [Problema 2: Análise não conecta com biblioteca](#problema-2-análise-não-conecta-com-biblioteca)
- [Problema 3: Perícia UFMG sub-aproveitada](#problema-3-perícia-ufmg-sub-aproveitada)
- [Checklist de Entrega](#checklist-de-entrega)

## Contexto

O portal tem 3 fontes sobre Brumadinho cruzadas na página `/paraopeba/analise`:
1. **Auditoria AECOM** — 467 documentos, 337 relatórios, 16 eixos temáticos
2. **Perícia judicial UFMG** — 7 documentos do CTC/UFMG
3. **ATIs (biblioteca)** — 645 itens de 3 assessorias (AEDAS 435, Guaicuy 162, NACAB 48)

## Problema 1: 210 itens sem temas

- **Guaicuy** (162 itens): site não expõe classificação temática via REST/HTML
- **NACAB** (48 itens): página lista PDFs sem taxonomy
- Total: 210 itens aparecem na biblioteca mas NÃO podem ser cruzados com os 16 eixos da análise

### Ação: Classificação automática por similaridade de título

1. Ler `apps/web/public/data/biblioteca-ati.json` (JSON bruto)
2. Para cada um dos 210 sem temas, extrair título
3. Tokenizar e comparar com vocabulário TemaAjri (25 temas em `lib/paraopeba/sintese-ajri.ts`)
4. Usar TF-IDF ou similaridade cosine
5. Atribuir tema(s) por threshold (ex: similaridade > 0.3)
6. Validar manualmente os 20-30 mais incertos
7. Atualizar o JSON com os novos temas

## Problema 2: 15 de 26 temas da biblioteca são "desestruturados"

15 temas descrevem WHO (populações: "Eixo Mulheres", "Populacao Negra") ou cláusulas do acordo ("Anexo I.1"), não WHAT. Esses não têm eixo correspondente na análise e são deliberadamente excluídos do cruzamento.

### Ação: Verificar lacunas legítimas

1. Algum eixo da análise deveria ter representação na biblioteca mas não tem?
2. Algum tema da biblioteca deveria ter eixo na análise mas não tem?
3. Produzir tabela de lacunas com justificativa

## Problema 3: Análise integrada precisa de melhoria

Com a biblioteca mais completa (645 → ~645 com temas), a análise pode ser enriquecida:

### Ações
1. Atualizar `lib/paraopeba/sintese-integrada.ts` para incluir novos cruzamentos
2. Adicionar contadores de documentos por eixo na UI (`PainelAnalise.tsx`)
3. Adicionar seção "Achados da ATI sem correspondência na auditoria"
4. Linkar diretamente para os documentos da biblioteca

## Arquivos Chave

| Arquivo | Função |
|---------|--------|
| `apps/web/public/data/biblioteca-ati.json` | JSON bruto dos 645 itens |
| `apps/web/lib/paraopeba/biblioteca.ts` | Leitura + triagem de dados pessoais |
| `apps/web/lib/paraopeba/sintese-integrada.ts` | Cruzamento 16 eixos × 3 fontes |
| `apps/web/lib/paraopeba/sintese-ajri.ts` | 25 temas TemaAjri + bridge table |
| `apps/web/lib/paraopeba/estudo-e-noticia.ts` | Casamento estudo-notícia |
| `apps/web/app/paraopeba/analise/page.tsx` | Página de análise integrada |
| `apps/web/app/paraopeba/analise/PainelAnalise.tsx` | Componente client-side |
| `scripts/coletar-biblioteca-ati.py` | Coletor AEDAS + Guaicuy |
| `scripts/coletar-biblioteca-nacab.mts` | Coletor NACAB |

## Pipeline Sugerido

```
1. Classificar 210 itens (Guaicuy+NACAB)
   → script Python/TS que lê JSON, compara títulos com TemaAjri, atribui temas
   → output: JSON atualizado com novos atributos "temas"

2. Verificar lacunas
   → cruzar 16 eixos × temas da biblioteca
   → produzir tabela de gaps (eixo sem biblioteca / biblioteca sem eixo)

3. Atualizar sintese-integrada.ts
   → incluir novos cruzamentos
   → adicionar contadores

4. Melhorar UI
   → PainelAnalise.tsx: contadores por eixo
   → links para documentos da biblioteca
```

## Notas Técnicas

- PowerSell 5.1 corrompe UTF-8 — usar Node.js ou Python para manipular JSON
- `curl.exe` está quebrado — usar `requests.Session` em Python
- JSON da biblioteca tem ~200KB — cabe em memória tranquila
- TemaAjri vocabulário está em `lib/paraopeba/sintese-ajri.ts` (export `TEMA_AJRI`)
- A bridge table `CASAMENTOS_ESTUDO_NOTICIA` em `lib/paraopeba/estudo-e-noticia.ts` é o padrão para cruzar
- Neon DB está em HTTP 402 até 01/09 — não usar para escrever
