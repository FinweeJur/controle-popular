# Plano — classificar polo e resultado com GLM, junto do resumo

> **Tipo:** PLANO
> **Domínio:** jurisprudência (classificação assistida por IA)
> **Última medição:** 2026-11-02
> **Leitura estimada:** média (5-15 min)
> **Relacionados:** [AGENTS.md](/AGENTS.md), [PLANO-JURISPRUDENCIA-02-11.md](PLANO-JURISPRUDENCIA-02-11.md)
> **Palavras-chave:** jurisprudência, glm, classificação, polo vencedor, resultado do recurso, resumo, custo

## Sumário

- [1. O tamanho do problema (medido em 02/11/2026)](#1-o-tamanho-do-problema-medido-em-02112026)
- [2. O que já existe e serve](#2-o-que-já-existe-e-serve)
- [3. Arquitetura proposta](#3-arquitetura-proposta)
- [4. Rubrica do polo (fechada)](#4-rubrica-do-polo-fechada)
- [5. Custo e ritmo](#5-custo-e-ritmo)
- [6. Coordenação com o home-pc](#6-coordenação-com-o-home-pc)
- [7. Critérios de aceite](#7-critérios-de-aceite)
- [8. O que não fazer](#8-o-que-não-fazer)

Criado: 2026-11-02. Status: aprovado pelo dono ("vamos rodar glm-4 pra além de
resumir categorizar melhor"), coordenação com o home-pc em aberto.

## 1. O tamanho do problema (medido em 02/11/2026)

| Situação | Casos |
|---|---:|
| Total no acervo | 16.834 |
| **Sem polo vencedor** | **14.210** |
| Polo = `indeterminado` | 549 |
| Resultado `nao consta` | 1.549 |
| Resultado `indeterminado` | 462 |
| Com resumo (dá para classificar) | 14.950 |

O polo só existe onde o resumo de mérito foi classificado: Brumadinho (1.111) e
parte do Rio Doce. Nos outros 12.326 casos com resumo, o campo está vazio — e
é isso que faz o gráfico de polo parecer "a maioria é indeterminado".

## 2. O que já existe e serve

`scripts/resumir_acordaos.py` (tjmg-jurimetria) já pede ao modelo um JSON com
`resultado_recurso`, `recorrente`, `merito_responsabilidade`, `danos_pnab_peab`,
`valor_indenizacao` e `acordo`. O CSV `tabelas/brumadinho_resumos.csv` alimenta
o portal.

O que falta:

1. **polo explícito com rubrica.** Hoje o polo é derivado; o pedido tem de vir
   como campo próprio, com definição fechada (ver §4), senão cada rodada
   inventa uma categoria.
2. **cauda de recusa.** `indeterminado` e `nao consta` são respostas válidas,
   mas hoje não se sabe se o modelo recusou ou se o texto não permite decidir.
   Precisa vir `confianca` e `motivo`.
3. **passe para quem já tem resumo e não tem polo** — 12.326 casos. Não é
   resumir de novo: é classificar em cima do resumo que já existe (mais barato e
   mais estável).

## 3. Arquitetura proposta

```
scripts/classificar_polo.py
  entrada: apps/web/data/jurisprudencia-casos.json (casos com resumo e polo vazio/indeterminado)
  chama:   GLM-4.5-flash (ZAI_API_KEY), 4 em paralelo, JSON estrito
  saída:   tabelas/classificacao_polo.csv
           processo,polo,resultado,danos,confianca,motivo,modelo,quando

scripts/gerar_jurisprudencia_casos.py
  aplica o CSV como override do campo polo/resultado
```

Por que CSV e não sobrescrever o JSON: o override é auditável, reversível e
versionado. Se o modelo errar em bloco, apaga-se a linha — não o acervo.

## 4. Rubrica do polo (fechada)

| valor | quando |
|---|---|
| `atingido` | o pedido do atingido foi acolhido no todo, ou a condenação da empresa prevaleceu |
| `empresa` | o pedido do atingido foi rejeitado, ou o recurso da empresa foi provido |
| `parcial` | acolhimento parcial, ou acordo homologado com concessões dos dois lados |
| `indeterminado` | o texto não diz quem venceu; **exige `motivo`** |

Regra de ouro: na dúvida entre `atingido` e `parcial`, responde `parcial` e
explica. Nunca chutar `atingido` para "melhorar o número".

## 5. Custo e ritmo

- 12.326 casos, ~1,5 s por chamada com 4 em paralelo ≈ **1h20 de API**.
- GLM-4.5-flash é o modelo barato da conta ZAI; o gasto é de centavos por
  milhar de casos, mas o dono acompanha.
- **Piloto antes**: 60 casos sorteados, conferência manual de 20, e só então o
  lote inteiro. Se a concordância for abaixo de 80%, o prompt volta para a
  mesa — não se publica classificação ruim em massa.

## 6. Coordenação com o home-pc

| Máquina | Faz | Não faz |
|---|---|---|
| desktop | harvest, classificação GLM, resumo, build, deploy | não coleta os slugs do home-pc |
| home-pc | harvest dos slugs dela | **não roda classificação** (evita dois gastos e duas verdades) |

Ponto de sincronização: o desktop classifica o JSON que ele mesmo regenera
depois do `sincronizar()`. Caso novo que chegue do home-pc entra na fila na
próxima rodada — a fila é "processo com resumo e sem polo".

## 7. Critérios de aceite

- [ ] Piloto de 60 casos com concordância manual ≥ 80%.
- [ ] `indeterminado` cai de 549 para menos de 150, e **todo** indeterminado
      restante tem `motivo`.
- [ ] Polo preenchido sai de 2.624 para ≥ 12.000.
- [ ] Nenhum caso muda de polo sem estar no CSV de override.
- [ ] `npm test` verde e contagem do portal só cresce.
- [ ] Relatório com antes/depois por frente e a taxa de recusa do modelo.

## 8. O que não fazer

- Não classificar sem texto (ementa+resumo vazios) — vira chute.
- Não pedir ao modelo "resolva o caso": ele classifica o que o texto diz.
- Não rodar a classificação no home-pc: é gasto dobrado e divergência de
  critério.
- Não publicar o CSV sem revisão de amostra.
