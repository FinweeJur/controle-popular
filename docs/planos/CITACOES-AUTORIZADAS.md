# Citações Autorizadas — Catálogo Canônico

> **Fonte da verdade em código:** `apps/web/lib/citacoes.ts` (+ componente
> `app/components/Epigrafe.tsx`, variantes `inicio` / `fecho` / `balao`).
>
> **Autorizações:** PLANO-COPY-VOZ.md (tabela de epígrafes, com autor/obra/ano)
> + lote aprovado pelo dono do projeto em 03/09/2026 (Evaristo — *Olhos d'água*,
> Roda Viva, *Poemas da recordação e outros movimentos*, Malê, 2017; Carolina —
> *Quarto de Despejo*, 1960, diário e poema "Não digam que fui rebotalho").
>
> **Regras:**
> 1. Toda citação exibida sai de `lib/citacoes.ts` — nunca de frase inventada
>    ou de memória. Frase nova entra só com fonte completa conferida.
> 2. Atribuição sempre completa: autor, obra e ano/entrevista.
> 3. Poemas entram por **versos selecionados**, nunca o poema inteiro inline —
>    versos completos só no balão ou seção dedicada.
> 4. Distribuição: uma citação no início (border-left), outra no fecho
>    (largura total) ou num balão ao lado do conteúdo. Máx. 2 por página.
> 5. Régua de sensibilidade: Brumadinho/Paraopeba **não recebe** epígrafe
>    literária — só texto do MAB, com atribuição.

## Lote aprovado pelo dono (03/09/2026)

### Conceição Evaristo

| Citação | Fonte | Id em `citacoes.ts` |
|---|---|---|
| "O importante não é ser o primeiro ou primeira, o importante é abrir caminhos." | entrevista ao Roda Viva | `evaristo-abrir-caminhos` |
| "Se ao menos o medo me fizesse recuar, pelo contrário, avanço mais e mais na mesma proporção desse medo. É como se o medo fosse uma coragem ao contrário." | *Olhos d'água* | `evaristo-medo-coragem` |
| "Achava também que qualquer vida era um risco e o risco maior era o de não tentar viver." | *Olhos d'água* | `evaristo-risco-viver` |
| "Eu-mulher em rios vermelhos / inauguro a vida. (...) Eu-mulher / abrigo da semente / moto-contínuo / do mundo." (versos selecionados) | *Poemas da recordação e outros movimentos*, Rio de Janeiro: Malê, 2017 | `evaristo-eu-mulher` |

### Carolina Maria de Jesus

| Citação | Fonte | Id em `citacoes.ts` |
|---|---|---|
| "Escrevo a miséria e a vida infausta dos favelados. (...) Seja o que Deus quiser. Eu escrevi a realidade." | *Quarto de Despejo*, 1960 | `carolina-escrevo-miseria` |
| "Não digam que fui rebotalho, / que vivi à margem da vida. / Digam que eu procurava trabalho, / mas fui sempre preterida. / Digam ao povo brasileiro / que meu sonho era ser escritora, / mas eu não tinha dinheiro / para pagar uma editora." | poema, *Quarto de Despejo*, 1960 | `carolina-rebotalho` |
| "Ah, comigo o mundo vai modificar-se. Não gosto do mundo como ele é." | *Quarto de Despejo*, 1960 | `carolina-mundo-modificar` |
| "O que eu revolto é com a ganância dos homens que espremem uns aos outros como se espremesse uma laranja." | *Quarto de Despejo*, 1960 | `carolina-ganancia` |

## Distribuição atual no portal

| Página | Início | Fecho / Balão |
|---|---|---|
| `/` (home) | `carolina-eu-escrevo` (hero) | — |
| `/sobre` | `carolina-eu-escrevo` · `rosa-travessia` · `evaristo-abrir-caminhos` | — |
| `/ambiental/nossos` (hub) | `birri-utopia` | `carolina-mundo-modificar` (fecho) |
| `/ambiental/conselhos` | `itamar-esperanca-ativa` | `evaristo-risco-viver` (fecho) |
| `/ambiental/direitos-humanos` | `evaristo-escrevivencia` | `carolina-escrevo-miseria` (balão) |
| `/ambiental/litigios-climaticos` | `rosa-coragem` | `evaristo-medo-coragem` (fecho) |
| `/ambiental/nossa-gente` | `itamar-camponeses` | `evaristo-eu-mulher` (balão, versos) |
| `/ambiental/nossos-animais` | `rosa-sertao-forte` | — (régua anti-inflação) |
| `PainelLugar` (todos os lugares) | `itamar-territorio` | — |

## Reservas (não aplicadas, prontas para uso)

- `carolina-fome` — "Quem inventou a fome são os que comem." (reserva Cap. 1/2)
- `carolina-ganancia` — ganância que espreme como laranja (congresso/cidades)
- `carolina-rebotalho` — poema "Não digam que fui rebotalho" (balão dedicado)
- `rosa-carne-sangue` — "ideias arranjadas × carne e sangue" (congresso)
- `carolina-sao-paulo` — classificação de São Paulo (bloco da cidade de SP)
