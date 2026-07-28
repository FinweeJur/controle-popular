# Que modelo pode analisar — resultado medido

Conjunto: `etl/benchmark/casos.json` — 30 PLs reais da Câmara, 10
garantistas / 10 reducionistas / 10 técnicos, gabarito por julgamento
humano sobre a ementa. Runner: `python -m etl.benchmark`.

## Resultados

| Modelo | Global | Garantista | **Reducionista** | Técnico | Descarte | Citação inventada |
|---|---|---|---|---|---|---|
| Sonnet (via subagente) | **29/30 = 97%** | 10/10 | **9/10** | 10/10 | 0% | 0 |
| `llama3.1:8b-instruct-q4_K_M` (Ollama local) | 18/30 = 60% | 5/10 | **3/10** | 10/10 | 28% | 0 |

## O 8B local está REPROVADO para produção

Não é imprecisão, é **inversão**. A matriz de confusão do 8B:

```
                  garantista    reducionista    tecnico
garantista                 5               0          5
reducionista               6               3          1     ← o problema
tecnico                    0               0         10
```

**6 dos 10 projetos que restringem direitos foram classificados como
garantistas** — o rótulo oposto. Num portal cujas seções são "Alertas" e
"Bons exemplos", isso não é um erro tolerável: colocaria a maioria dos PLs
restritivos justamente na vitrine de bons exemplos, e esvaziaria a seção
que existe para alertar. Análise errada com aparência de fundamentada é
pior do que análise nenhuma, porque a fundamentação empresta credibilidade
ao erro.

O viés é de positividade: o modelo lê quase tudo como benéfico. É a
hipótese (b) do `F0-discovery §4.2` — descartada para o Sonnet (lá era
viés de amostra), **confirmada para o 8B**.

### O que o 8B acerta

- **Técnicas: 10/10.** Não inventa direito onde não há; a regra 3 do prompt
  funciona nele.
- **Zero citação inventada**, com 28% de descarte na validação. Ou seja:
  os guarda-corpos da rubrica seguram o que ele produz de ruim. O problema
  não é fabricação, é **julgamento**.

Por isso o 8B continua útil como *pré-filtro* barato ("isto é técnico ou
tem direito em jogo?"), mas não pode decidir a direção.

## Decisão (2026-07-23)

1. **Nenhuma análise do 8B vai para o site.** As 2 que haviam sido gravadas
   foram apagadas do banco — uma já aparecia em `/bons-exemplos`.
2. **O caminho de produção é modelo forte via `etl.exportar_prompts` +
   `etl.importar_analises`** (assinatura Max ou API própria), que usa o
   prompt idêntico ao do ETL e os mesmos guarda-corpos na volta.
3. `LLM_PROVIDER=ollama` segue como padrão no `.env.example` só porque é o
   que roda sem chave — **não porque seja adequado**. Quem rodar
   `python -m etl.analise` com ele está gerando dado que não deve publicar.

## Antes de aprovar qualquer modelo novo

Rodar `python -m etl.benchmark` e exigir, nesta ordem:

1. **recall de reducionista ≥ 80%** — é a métrica que decide; acurácia
   global engana (chutar "garantista" sempre já dá 33% num conjunto
   balanceado, e foi o que o 8B praticamente fez);
2. zero citação não rastreável;
3. técnicas ≥ 90% (não inventar direito onde não há).
