# Plano — /jurisprudência: método, estatística, tabelas e temas

Criado: 2026-11-02. Status: proposta, aguardando aprovação do dono.
Escopo: `apps/web/app/jurisprudencia/` (page.tsx, partes.tsx), rotas novas de
tema e `apps/web/lib/jurisprudencia.ts`.
Medição: `apps/web/data/jurisprudencia-casos.json`, 02/11/2026 —
**16.834 itens** (14.962 acórdãos + 1.872 súmulas).

## 1. O que a página faz hoje

`page.tsx` (161 linhas) monta: cabeçalho, 4 cartões, atalhos, lista paginada,
súmulas por tribunal, cinco blocos do Brumadinho (polo, resultado, polo×ano,
temas, danos PNAB), valores, notícias, notas e rodapé.

Estatística existe, mas só para o Brumadinho — TJES, Rio Doce, direitos humanos
e as súmulas não têm retrato próprio. E o rodapé atribui o método a terceiro.

## 2. Correção 1 — o método não é o NACAB

Hoje, em `partes.tsx`:

- linha 513: "O polo do Brumadinho é recalculado pela **regra NACAB**";
- linha 523: "não é o universo de 1ª instância nem a **amostra da 18ª Câmara do
  NACAB**".

Não é isso. O acervo é classificado por **método próprio de assessoria jurídica
popular**: leitura da decisão, polo vencedor, resultado do recurso, dano
reconhecido e valor, com revisão humana do que a máquina não fecha. Os
relatórios de assessorias técnicas independentes entram como **referência de
comparação e de crítica** — não como regra aplicada ao nosso dado.

**Texto proposto para as Notas:**

> A classificação é feita pelo portal com método de assessoria jurídica
> popular: leitura da decisão, polo vencedor, resultado do recurso, dano
> reconhecido e valor, com revisão humana do que a automação não fecha. Os
> relatórios de assessorias técnicas independentes — Guaicuy (Paraopeba) e
> NACAB (Brumadinho) — servem de referência e de contraponto; os números deste
> acervo não são os deles, e o recorte é a 2ª instância.

**Links oficiais verificados em 02/11/2026** (HTTP 200):

| Fonte | Link |
|---|---|
| NACAB — Relatório de Pesquisa Jurisprudencial 2023 (PDF, 1,6 MB) | `https://nacab.org.br/wp-content/uploads/2025/07/Relatorio_PesquisaJurisprudencial_2023.pdf` |
| Guaicuy — biblioteca de publicações | `https://guaicuy.org.br/biblioteca/` |
| Análise do portal sobre os dois relatórios | `relatorios/RELATORIO-GUAICUY-NACAB.md` no repo `tjmg-jurimetria` |

⚠️ O link atual do rodapé aponta para esse `.md` no GitHub. O arquivo **existe**
em `origin/master` (conferido), mas um HEAD devolveu 404 do meu terminal —
abrir no navegador antes de publicar. Se falhar, o rodapé passa a citar só os
dois links externos e o caminho do arquivo no repo.

## 3. Correção 2 — mais estatística, com gráfico de barra

Componente novo `Barras` (CSS puro, sem biblioteca): rótulo, barra proporcional,
N e % com denominador explícito. Substitui as tabelas de 3 colunas onde a
leitura é de ranking.

Blocos propostos, todos com N medido:

| Bloco | Dados | N |
|---|---|---|
| Itens por tribunal | TJMG 6.288 · TJES 5.682 · STF 3.728 · STJ 673 · TST 463 | 16.834 |
| Itens por frente | penal 6.182 · riodoce 5.271 · dh 2.398 · súmula 1.872 · brumadinho 1.111 | 16.834 |
| Resultado do recurso | negado 8.463 · provido 2.743 · parcialmente provido 1.176 · desprovido 152 · outros 116 | 12.650 com resultado |
| Polo vencedor | empresa 1.209 · atingido 538 · parcial 328 · indeterminado 549 | 2.624 com polo |
| Temas do acervo | Omissão penal 2.928 · Homicídio 2.133 · Direitos das vítimas 1.928 · Prova testemunhal 1.790 | — |
| Danos PNAB/PEAB | mudança de hábitos 648 · água/abastecimento 273 · perda de renda 271 · outros 256 | — |
| Ano | 2026 4.551 · 2025 2.437 · 2024 2.034 · 2023 1.545 · 2021 1.293 | 15.698 com ano |
| Faixa de valor | decisões com valor numérico: 1.268 (7,5% do acervo) | 1.268 |

Regras: **todo número com N e denominador**; nada de % sobre base ambígua;
valor continua como mediana/Q1/Q3, nunca média (outlier de R$ 200 bi).

## 4. Correção 3 — tabela estreita

A lista (`TabelaCasos`) tem **9 colunas** — Processo, Tribunal, Tipo, Ano,
Órgão/Comarca, Frente, Polo/Resultado, Temas, Ementa — e por isso rola na
horizontal no celular.

Proposta:

- **desktop**: 5 colunas com largura fixa (`w-[9.5rem]`, `w-[6rem]`…):
  Processo · Tribunal/Ano · Polo/Resultado · Temas · Ementa (2 linhas,
  `line-clamp-2`). Órgão e Comarca descem para a linha expandida.
- **celular (390 px)**: a tabela vira lista de cartões empilhados, um por caso.
- as tabelas de estatística que sobrarem viram `Barras` — sem cabeçalho, sem
  rolagem.
- piso de fonte: 12 px (regra 5.16); nada de `text-[11px]` para "caber".

## 5. Correção 4 — painel único com seletor de tema

O dono quer **uma página só**, que alterna entre os temas no clique — não um
hub com páginas filhas. É o desenho certo para este acervo: o dado é o mesmo
conjunto, muda o recorte.

### Como fica

`/jurisprudencia` vira o painel. O topo ganha uma faixa de **botões de tema**
(links), cada um com o N ao lado:

```
[Todos 16.834] [Dano moral 1.141] [Perda de renda 568]
[Indenização individual 566] [Dano material 462] [Auxílio emergencial 376]
[Lucros cessantes 341] [Acordo/TTAC 80] [Reassentamento 57]
[Pensão mensal 37] [Pagamento emergencial 12] [PTR 11] [NAE 0]
```

Clicar em "Auxílio emergencial" troca **todos** os blocos ao mesmo tempo —
contadores, barras, tabela — e o endereço fica `?tema=auxilio-emergencial`.
O estado mora na URL: dá para compartilhar, voltar pelo histórico e funciona
sem JavaScript.

Abaixo da faixa, os filtros que já existem (tribunal, frente, ano, resultado,
polo) continuam, também como links, combinando com o tema.

### Por que não é um componente de cliente

Regra 5.1 do AGENTS: coleção de 16.834 casos não vai como prop de cliente.
O painel é **renderizado no servidor**; o clique é um link (5.13), a casca não
desmonta e a página não recarrega inteira. Painel com `useState` segurando o
acervo seria exatamente o que a regra proíbe — e travaria o celular.

### O problema de desempenho que isso expõe

`partes.tsx` importa `jurisprudencia-casos.json` **inteiro: 40,7 MB**. Hoje a
página já paga isso; com um painel que re-renderiza a cada clique, o custo
aparece em cada navegação.

Proposta: gerar, no build, um **arquivo compacto do painel** —
`jurisprudencia-painel.json` com só o que o painel usa (id, processo, tribunal,
frente, tipo, ano, polo, resultado, temas, danos_pnab, valor e 200 caracteres
de ementa). Estimativa: 6–8 MB em vez de 40,7. O arquivo completo continua
servindo a página do caso e o diálogo de ementa.

Ganho: menos memória por instância, build mais curto e clique mais rápido.
O gerador entra em `apps/web/scripts/` e roda junto do `gerar_jurisprudencia_casos.py`.

### Os temas vêm do texto, com N medido

O que o dono não achou (liquidação individual, auxílio emergencial, PTR, AFE)
está **no texto das decisões**, não como campo. Então a lista de temas nasce de
uma função pura de casamento sobre `ementa + resumo` normalizados, testável:

| slug | rótulo | casos | com valor |
|---|---|---:|---:|
| `dano-moral` | Dano moral | 1.141 | 185 |
| `perda-renda` | Perda de renda | 568 | 70 |
| `indenizacao-individual` | Indenização individual e liquidação | 566 | 216 |
| `dano-material` | Dano material | 462 | 102 |
| `auxilio-emergencial` | Auxílio emergencial / AFE / AE | 376 | 129 |
| `lucros-cessantes` | Lucros cessantes | 341 | 92 |
| `acordo-reparacao` | Acordo de reparação / TTAC | 80 | 14 |
| `reassentamento` | Reassentamento | 57 | 40 |
| `pensao-mensal` | Pensão mensal | 37 | 4 |
| `pagamento-emergencial` | Pagamento emergencial | 12 | 6 |
| `ptr` | PTR — transferência de renda | 11 | 2 |
| `nae` | NAE | 0 | 0 |

Todos aparecem na faixa, inclusive os pequenos: o botão mostra o N real, e
quem clica vê 12 casos — não uma página vazia. `NAE` só é exibido como zero
depois de varredura de sinônimos ("novo auxílio", "auxílio emergencial
extraordinário"), com a data da medição na nota.

**De onde vem o N:** `casosPorTema(casos, slug)` em `lib/jurisprudencia.ts`, com
a tabela de termos versionada e teste ao lado.

## 6. Ordem de execução

| # | Entrega | Arquivos | Verificação |
|---|---|---|---|
| 1 | Texto do método + links oficiais | `partes.tsx` (Notas, rodapé de `page.tsx`) | abrir os 3 links; 404 não passa |
| 2 | Gerador do arquivo compacto do painel | `apps/web/scripts/gerar-painel-juris.mts` | tamanho < 10 MB e mesmos 16.834 |
| 3 | `Barras` + 8 blocos de estatística | `partes.tsx`, `page.tsx` | conferir N de cada bloco contra o JSON |
| 4 | Tabela estreita (5 colunas + cartão no celular) | `TabelaCasos` | 390 px sem rolagem lateral |
| 5 | Taxonomia + `casosPorTema` com teste | `lib/jurisprudencia.ts` + `.test.ts` | `npx vitest run lib/jurisprudencia.test.ts` |
| 6 | Faixa de botões de tema (links, estado na URL) | `partes.tsx` | clicar 3 temas e comparar N com o JSON |
| 7 | Link do painel no `/paraopeba` e no rodapé | — | navegação em 2 cliques |

Antes de entregar: `npx tsc --noEmit`, `npm test`, `rg "text-\[(9|10|11)px\]"
apps/web/app`, e leitura no celular.

## 7. O que não fazer

- Não chamar de "método NACAB" o que é método nosso.
- Não publicar link sem abrir: URL quebrada em página de transparência custa
  mais que a ausência do link.
- Não publicar percentual sem denominador.
- Não criar página de tema com zero caso.
- Não transformar a lista em tabela de 9 colunas no celular.
