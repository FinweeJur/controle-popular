# Laboratório de dados

> **Tipo:** PRODUTO
> **Domínio:** global (todas as frentes)
> **Última medição:** 2026-09-20
> **Leitura estimada:** baixa (5–10 min)
> **Relacionados:** [PRODUTO.md](../01-produto/PRODUTO.md), [ESTADO.md](../02-estado/ESTADO.md), [MATRIZ-27-ESTADOS-FONTES-PODERES.md](../06-fontes/MATRIZ-27-ESTADOS-FONTES-PODERES.md)
> **Palavras-chave:** laboratorio, explorador, dither, grafico, dock, janelas, seu nono, catalogo, busca

## Sumário

- [Propósito](#propósito)
- [Como funciona](#como-funciona)
- [Catálogo de fontes](#catálogo-de-fontes)
- [Gráficos dither](#gráficos-dither)
- [Seu Nonô no laboratório](#seu-nonô-no-laboratório)
- [Sessão na URL](#sessão-na-url)
- [Buscador alimenta as janelas](#buscador-alimenta-as-janelas)
- [Regras que valem aqui](#regras-que-valem-aqui)
- [Caminho do código](#caminho-do-código)

## Propósito

A `/laboratorio` deixa o leigo comparar dois conjuntos de dado do portal no
mesmo padrão visual, sem escrever código. Critério de pronto (do plano):
o dono monta, em dois cliques, uma comparação tipo "congresso × economia",
com o Seu Nonô acendo os gráficos por botão.

Não é biblioteca de gráfico nova: todo gráfico é SVG/canvas com pontos —
o estilo dither escolhido pelo dono em 20/09/2026 (referência:
amicro — biblioteca MIT, componentes adaptados localmente).

## Como funciona

- **Dock flutuante** (corrente de ícones na base): escolhe o conjunto de
  dados que abre. Clique no ícone ativo fecha a janela dele.
- **Duas janelas independentes** (`LabJanela`): cada uma mostra um conjunto
  com filtro próprio, fonte externa e gráfico dither.
- A página é de servidor; estado de janela vive no cliente
  (`LabExplorador`). Nada de dado grande em props (regra 5.1).

## Catálogo de fontes

`apps/web/lib/laboratorio/dados-catalogo.ts` lista as 22 fontes no
formato `SerieDither[]` — é a porta única do laboratório. Cada entrada
diz: à qual categoria pertence, quelle rota do portal detalha o assunto,
agregados já existentes, filtros e a função que gera a série.

Como entende o dado novo: crie um helper que retorne `SerieDither[]`
(no formato `{ nome, pontos: [{ x, y }] }`) e um objeto no array
`CATALOGO_DADOS`. Números sempre via agregado medido (regra: nada digitado).

## Gráficos dither

Os gráficos são componentes de cliente em
`apps/web/lib/laboratorio/dither-charts/`:

| Tipo | Arquivo | Bonitifica |
|---|---|---|
| Barras | `DitherBarChart.tsx` | default |
| Donut | `DitherDonutChart.tsx` | distribuição |
| Grade de calor | `DitherHeatmapGrid.tsx` | matriz |
| Empilhado | `DitherStackedChart.tsx` | partes de um todo |
| Gauge | `ServerGauge.tsx` | indicadores únicos |
| Crescimento | `DitherGrowthChart.tsx` | séries temporais |

Todos são adaptações (MIT, fonte amicro) renderizadas em canvas com
`framer-motion` — que já estava no projeto. Motor comum em `dither-engine.ts`,
com teste (`dither-engine.test.ts`).

## Seu Nonô no laboratório

`LabSeuNono.tsx` abre e fecha pelo botão "🤖". O painel dá:

1. **Sugestões** prontas de pergunta.
2. **Filtros** (período, UF, categoria, fonte).
3. **Tipo de gráfico** — muda as duas janelas de uma vez.
4. **Camadas de dados** (checkbox por categoria).
5. **Links** para as telas completas de cada frente.
6. **Acessibilidade**: fonte, contraste, animação e narração — cada uma
   com `role="switch"` e `aria-checked`.

Limitação honesta (F5 parcial por design): o Seu Nonô ainda **não**
interpreta texto livre nem conversa na tela; ele controla filtros e
gráficos por botões. A conversa com citação clicável segue as regras do
[PLANO-SEU-NONO-NOTEBOOKLM.md](../planos/PLANO-SEU-NONO-NOTEBOOKLM.md)
para uma fase futura.

## Sessão na URL

F6: arrastar, filtrar e trocar gráfico grava na barra de endereço:

```
/laboratorio?j1=barragens&j2=esg&g=donut
```

`j1` = janela da esquerda, `j2` = da direita, `g` = tipo de gráfico.
Compartilhar o link reabre exatamente a comparação.

## Buscador alimenta as janelas

F4: entrar pelo buscador global com a palavra (ex.: `barragens`) leva a
`/laboratorio?q=barragens`. Os conjuntos com mais batidas sem acento nos
tokenized (`PALAVRAS_DATASET`) abrem já nas duas janelas. O `q` fica
preservado no endereço até o leito mudar de dado.

## Regras que valem aqui

- **Número medido, nunca digitado.** O valor vem do agregado com data.
- **Fonte linkável.** Toda janela aponta a fonte oficial num hyperlink.
- **Sem dependência nova.**: framer-motion e lucide-react apenas.
- **Cor nunca como único canal.** O dither usa forma e rótulo também.

## Caminho do código

```
apps/web/app/laboratorio/     page.tsx (servidor), LabDock, LabJanela,
                              LabExplorador (orquestrador), LabSeuNono
                              lab-dados.ts (resumo* por dataset), tipos.ts
apps/web/lib/laboratorio/     dados-catalogo.ts (22 fontes),
                              dither.ts (barras em pontos + teste),
                              dither-charts/ (6 gráficos + motor + teste)
```
