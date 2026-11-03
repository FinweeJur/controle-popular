# Plano — acervo completo, análise estatística e revisor acadêmico

> **Tipo:** PLANO
> **Domínio:** jurisprudência
> **Última medição:** 2026-11-02
> **Leitura estimada:** media (5-15 min)
> **Relacionados:** [PLANO-ANALISE-TESES-02-11.md](PLANO-ANALISE-TESES-02-11.md), [PLANO-CLASSIFICACAO-GLM-02-11.md](PLANO-CLASSIFICACAO-GLM-02-11.md), [REGRAS-DURAS.md](../03-desenvolvimento/REGRAS-DURAS.md), [QUALIDADES-DA-INFORMACAO.md](../04-arquitetura/QUALIDADES-DA-INFORMACAO.md)
> **Palavras-chave:** acervo, pipeline, resumo, tese, classificação, revisor, metodologia, custo, automático

## Sumário

- [Objetivo](#1-objetivo)
- [O funil, estágio por estágio](#2-o-funil-estágio-por-estágio)
- [O revisor acadêmico](#3-o-revisor-acadêmico)
- [Política de custo](#4-política-de-custo)
- [Placar do acervo em 02/11](#5-placar-do-acervo-em-0211)
- [Critérios de aceite](#6-critérios-de-aceite)
- [O que ainda depende de decisão](#7-o-que-ainda-depende-de-decisão)

## 1. Objetivo

Levar **todo** o acervo coletado até o mesmo estado — resumido, com polo
decidido, com tese extraída — e só então rodar a estatística. Depois, um
revisor independente confere fato, número, coleta, procedimento e metodologia.

Tudo automático. Modelo gratuito por padrão; pagamento só com autorização e
abaixo do teto combinado (§5.17).

## 2. O funil, estágio por estágio

| # | Estágio | Quem faz | Modelo | Custo | Tempo |
|---|---|---|---|---|---|
| 1 | Coleta (harvest) | `harvest_run.py` nas duas máquinas | não usa | 0 | contínuo |
| 2 | Ponte harvest → CSV | `classificar_brumadinho.py`, `preparar_rio_doce.py` | não usa | 0 | minutos |
| 3 | Resumo | `resumir_acordaos.py`, `resumir_doce_*` | grátis | 0 | horas |
| 4 | Polo | `classificar_polo.py` / regra do Brumadinho | GLM grátis / regra | 0 | horas |
| 5 | Tese | `analise_teses.py` (3 lentes) | GLM grátis | 0 | ~1 h por 5,8 mil |
| 6 | Canonização | `canonizar_teses.py` | **regra**, sem modelo | 0 | segundos |
| 7 | Análise | `analisar_teses.py` | **contagem** | 0 | segundos |
| 8 | Acervo publicado | `gerar_jurisprudencia_casos.py` | não usa | 0 | minutos |
| 9 | Revisão | `revisor_academico.py` | **contagem** (+ amostra) | 0 | segundos |

O estágio 2 era o gargalo escondido: a esteira só o rodava quando o harvest
parava. Como o harvest ficou 4 dias sem parar, o CSV do Brumadinho congelou e
o portal publicou 1.111 de 8.791 decisões. Agora `preparar` e `classificar`
rodam em toda volta (são locais, não disputam rede).

## 3. O revisor acadêmico

`revisor_academico.py` não classifica e não escreve análise. Ele reconta.

| Conferência | O que faz |
|---|---|
| Processo único | aponta duplicata no acervo |
| Ficha mínima | exige tribunal, ano e ementa (súmula dispensa ano) |
| Polo por frente | `mp`/`reu` só podem existir no penal |
| Cobertura de tese | compara universo da lente com casos que têm tese |
| Cobertura de polo | mostra o vazio por frente, sem esconder |
| Números do relatório | recalcula o N de cada tese e compara com a tabela publicada |
| Invariantes | nenhuma tese publicada com N < 3 |
| Mudanças | toda mudança com N ≥ 4 nos dois períodos |
| Amostra | 10 casos por lente, sorteio reprodutível, com trecho da ementa |

Saída: `relatorios/REVISAO-ACADEMICA.md` + `relatorios/revisao-academica.json`
(este último é lido pela rotina para dizer no Telegram quantos erros há).

O revisor se recusa a comparar número quando o relatório é mais antigo que o
CSV de tese: avisa "regenere antes de publicar" em vez de acusar erro falso.

## 4. Política de custo

- **Padrão: zero.** Resumo, polo, tese, canonização, análise e revisão usam
  modelo gratuito ou contagem determinística.
- **Pagamento só com autorização prévia** (§5.17): calcular, mostrar o preço,
  esperar o "sim", registrar.
- **Teto combinado pelo dono:** abaixo de R$ 1 por lote. Acima disso, perguntar
  antes mesmo de montar o lote.
- O script de lote imprime o custo estimado e **para** sem `--confirmo-custo`.

Referência de preço (sabiazinho-4, Batch API): tese dos 5,8 mil pendentes
sairia por ≈ R$ 2,71 — acima do teto. Um terço da fila ficaria ≈ R$ 0,90.

## 5. Placar do acervo em 02/11

| Frente | Casos | Sem resumo | Sem polo | Sem tese |
|---|---:|---:|---:|---:|
| brumadinho | 7.220 | 4.188 | 0 | 5.803 |
| penal | 6.182 | 0 | 0 | 1 |
| riodoce | 5.164 | 6 | 278 | 3 |
| dh | 2.376 | 0 | 2.376 | 14 |
| súmula | 1.872 | 1.872 | 1.872 | 0 |
| **total** | **22.814** | **6.066** | **4.526** | **5.821** |

Leitura do placar:

- **Polo vazio não é dívida em dh e súmula**: são 4.248 casos sem "empresa ×
  atingido" por natureza. A dívida real é 278, no Rio Doce.
- **Resumo sem pendência em dh, penal e Rio Doce**: os 6.066 são Brumadinho
  (4.188) e súmula (1.872, que não precisa).
- **Tese**: 5.821, quase todo Brumadinho recém-integrado.

## 6. Critérios de aceite

- [ ] Cobertura de tese ≥ 99% em cada lente.
- [ ] Revisor sem erro de contagem, ficha, duplicata ou invariante.
- [ ] Relatórios refeitos depois da última extração (carimbo de data conferido).
- [ ] Amostra de 30 teses conferida por humano antes de publicar.
- [ ] Nenhum lote pago sem autorização registrada no estado do lote.

## 7. O que ainda depende de decisão

1. **Publicar o bloco de teses** em `/jurisprudencia` (depende da revisão humana).
2. **Acelerar com Maritaca** fora do teto de R$ 1: só com autorização nova.
3. **Tratar os 1.872 casos de súmula** como frente própria na estatística —
   hoje eles entram no acervo mas não em tese.
