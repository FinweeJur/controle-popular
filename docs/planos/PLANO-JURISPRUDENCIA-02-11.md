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

## 5. Correção 4 — página própria por tema de indenização

O que o dono não achou (liquidação individual, auxílio emergencial, PTR, AFE…)
existe **no texto das decisões**, não como campo. Então a página nasce de uma
função pura de casamento de termos, testável, sobre `ementa + resumo`
normalizados.

Estrutura:

- `/jurisprudencia/temas` — hub: todos os temas, N de cada, o que entra e o que
  não entra.
- `/jurisprudencia/temas/[slug]` — N, barras por tribunal/frente/ano, faixa de
  valores, lista filtrada (reusa `TabelaCasos`), nota do que o tema significa e
  link para a fonte.

Taxonomia proposta, com N medido em 02/11/2026:

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

**Regra de publicação:** só vira página própria com **N ≥ 30**. Abaixo disso o
tema entra no hub, agrupado como "poucos casos", com o N real — jamais uma
página vazia.

**`nae` merece cuidado:** zero no acervo não prova que não exista decisão. Antes
de publicar "nenhum caso", rodar varredura de sinônimos ("novo auxílio",
"auxílio emergencial extraordinário", "auxílio financeiro"). Se continuar zero,
o hub diz: "Nenhum caso no acervo até 02/11/2026" — com a data, não como
verdade eterna.

**De onde vem o N:** função `casosPorTema(casos, slug)` em
`lib/jurisprudencia.ts`, com tabela de termos versionada e teste ao lado. Nada
de regex solta dentro de componente.

## 6. Ordem de execução

| # | Entrega | Arquivos | Verificação |
|---|---|---|---|
| 1 | Texto do método + links oficiais | `partes.tsx` (Notas, rodapé de `page.tsx`) | abrir os 3 links; 404 não passa |
| 2 | `Barras` + 8 blocos de estatística | `partes.tsx`, `page.tsx` | conferir N de cada bloco contra o JSON |
| 3 | Tabela estreita (5 colunas + cartão no celular) | `TabelaCasos` | 390 px sem rolagem lateral |
| 4 | Taxonomia + `casosPorTema` com teste | `lib/jurisprudencia.ts` + `.test.ts` | `npx vitest run lib/jurisprudencia.test.ts` |
| 5 | Hub `/jurisprudencia/temas` | rota nova | N do hub = soma dos temas |
| 6 | Páginas de tema (N ≥ 30) + grupo "poucos casos" | rota dinâmica | cada página com N > 0 |
| 7 | Link do hub no topo de `/jurisprudencia` e no `/paraopeba` | — | navegação em 2 cliques |

Antes de entregar: `npx tsc --noEmit`, `npm test`, `rg "text-\[(9|10|11)px\]"
apps/web/app`, e leitura no celular.

## 7. O que não fazer

- Não chamar de "método NACAB" o que é método nosso.
- Não publicar link sem abrir: URL quebrada em página de transparência custa
  mais que a ausência do link.
- Não publicar percentual sem denominador.
- Não criar página de tema com zero caso.
- Não transformar a lista em tabela de 9 colunas no celular.
