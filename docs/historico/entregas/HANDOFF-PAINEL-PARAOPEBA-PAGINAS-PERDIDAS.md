# Handoff: as páginas do Painel Paraopeba que não chegaram ao portal

> **Tipo:** HISTORICO
> **Domínio:** paraopeba
> **Última medição:** 2026-08-22
> **Leitura estimada:** curta (< 5 min)
> **Relacionados:** [README.md](../../README.md), [AGENTS.md](/AGENTS.md)
> **Palavras-chave:** historico, handoff, entrega

## Sumário

- [Propósito](#propósito)
- [0. O achado que muda a leitura de tudo abaixo](#0-o-achado-que-muda-a-leitura-de-tudo-abaixo)
- [1. O que falta, por página](#1-o-que-falta-por-página)
- [2. `page-portais` — 69 portais (recusa consciente, mantida)](#2-page-portais-69-portais-recusa-consciente-mantida)
- [3. `page-clipping` — 59 matérias das instituições de justiça (a perda maior)](#3-page-clipping-59-matérias-das-instituições-de-justiça-a-perda-maior)
- [4. `page-educacao` — 48 itens didáticos](#4-page-educacao-48-itens-didáticos)
- [5. Ordem sugerida, se o dono mandar seguir](#5-ordem-sugerida-se-o-dono-mandar-seguir)

## Propósito

Medido em 2026-08-15, rodando `scripts/extrair-clipping-ati.mts` e contando cada array programaticamente sobre o arquivo-fonte. Nada aqui é estimativa. **Fonte medida:** `X:\DevCoder\Projetos html\painel-paraopeba (V1).html` (376.048 bytes, 365.010 caracteres, UTF-8 válido, sem `charset` declarad...

Medido em 2026-08-15, rodando `scripts/extrair-clipping-ati.mts` e contando
cada array programaticamente sobre o arquivo-fonte. Nada aqui é estimativa.

**Fonte medida:** `X:\DevCoder\Projetos html\painel-paraopeba (V1).html`
(376.048 bytes, 365.010 caracteres, UTF-8 válido, sem `charset` declarado).

**Não ingerir nada deste documento sem pedido do dono.** Ele existe para que
o que falta seja uma tarefa com número, não uma lembrança.

---

## 0. O achado que muda a leitura de tudo abaixo

`docs/PLANO-INGESTAO-PARAOPEBA.md` (survey de 2026-08-13) mediu um
`painel-paraopeba.html` de **391.941 bytes** e enumerou seis estruturas:
`NEWS_DATA`, `PORTALS_DATA`, `INST_DATA`, `MILESTONES`, `PAYMENTS`,
`DATA_PANEL`. **O arquivo daquele survey não está mais em disco** — a única
cópia hoje é o `(V1)`, e ele é *anterior*, não posterior:

| Array | `(V1)` medido hoje | O que o portal já carrega | Leitura |
|---|---:|---:|---|
| `NEWS_DATA` | 130 | 149 (`clipping.ts`) | V1 é mais velho |
| `MILESTONES` | 12 | 17 (`linha-do-tempo.ts`) | V1 é mais velho |
| `PAYMENTS` | 8 | 9 (`auxilio.ts`) | V1 é mais velho |

Consequência prática, e é a armadilha desta pasta: **regerar `clipping.ts`,
`linha-do-tempo.ts` ou `auxilio.ts` a partir do `(V1)` apaga dado** — 19
notícias, 5 marcos e 1 pagamento. `scripts/extrair-clipping-ati.mts`
deliberadamente só escreve o arquivo das ATIs por isso.

Consequência para o survey: as quatro estruturas da tabela §1 **existem no
V1, que é mais antigo** que o arquivo pesquisado — ou seja, elas não são
novidade posterior ao survey. Elas simplesmente não foram enumeradas. O
survey mediu seis arrays; o arquivo tem dez.

---

## 1. O que falta, por página

O painel tem 7 páginas. Estado hoje:

| Página do HTML | Estrutura | Itens medidos | Estado no portal |
|---|---|---:|---|
| `page-painel` | `DATA_PANEL` | 17 chaves | parcial |
| `page-dados` | `PAYMENTS` | 8 (portal tem 9) | ingerido (`auxilio.ts`) |
| `page-portais` | `PORTALS_DATA` | **69** | **não ingerido** (recusado, §2) |
| `page-instituicoes` | `INST_DATA` | 18 | ingerido (`atores.ts`) |
| `page-clipping` | `CLIPPING_DATA` | **59** | **PERDIDO** (§3) |
| `page-clipati` | `ATI_DATA` | **46** | ✅ ingerido em 2026-08-15 |
| `page-educacao` | `EDU_*` + inline | **48** | **PERDIDO** (§4) |

---

## 2. `page-portais` — 69 portais (recusa consciente, mantida)

`PORTALS_DATA`, 69 itens, campos `name`, `type`, `abbr`, `description`,
`contact`, `contactLabel`, `url`. Tipos: institucional / imprensa /
movimento / assessoria. Um nome duplicado ("Brasil de Fato", `abbr` `BF` e
`BF2`, contatos diferentes — um formulário, um e-mail).

**Não é perda acidental.** `PLANO-INGESTAO-PARAOPEBA.md` §1 já mediu os
mesmos 69 e recusou com motivo: é lista de assessoria de imprensa, não
conteúdo cívico. A recusa segue de pé e este documento não a reabre.

O que sobrevive hoje: os *nomes* dos portais, como campo `portal` de
`clipping.ts`. Os campos `contact`, `contactLabel`, `abbr` e `description`
não existem em lugar nenhum do repo.

Junto vem um bloco de disparo de e-mail em massa (assunto, corpo pré-pronto,
anexos, botão de envio) — marcação escrita à mão, sem dado por trás. Se um
dia entrar, entra como **ferramenta de pressão**, com decisão de produto
própria, não como ingestão de dado.

## 3. `page-clipping` — 59 matérias das instituições de justiça (a perda maior)

`CLIPPING_DATA`, linha 2330 do HTML. **59 itens**, campos `id`, `inst`,
`tema`, `date`, `group` (36 dos 59), `title`, `source`, `url`, `summary`.

- Por instituição: **MPMG 25 · DPMG 20 · MPF 14**
- Por tema: `ptr_auxilio` 24 · `indenizacao` 11 · `acordo` 9 · `acao_penal` 9 · `consulta_popular` 6
- Período: **2019-04-05 → 2026-05-05** (o portal hoje começa em 2024-04-08)

**Sobreposição medida com `clipping.ts`: 1 URL, 0 títulos.** É acervo novo,
não duplicata — curadoria própria das três IJs signatárias do Acordo, com
classificação temática que `clipping.ts` não tem, e com `group` amarrando 36
matérias ao mesmo evento.

É o maior pedaço de dado cívico ainda de fora, e o mais próximo do que a
frente Paraopeba se propõe. Ingestão análoga à das ATIs: script em
`scripts/`, arquivo `lib/paraopeba/clipping-ij.ts`, campos preservados,
`summary` creditado ao painel-fonte. Cuidado de nomenclatura: a página do
portal hoje chamada "clipping" mostra `NEWS_DATA`, não este array.

## 4. `page-educacao` — 48 itens didáticos

Quatro estruturas, todas ausentes do portal:

| Estrutura | Linha | Itens | Campos |
|---|---:|---:|---|
| `EDU_TIMELINE` | 3093 | **16** | `date`, `color`, `icon`, `title`, `desc` |
| `EDU_FAQ` | 3112 | **9** | `q`, `a` |
| `EDU_GLOSSARIO` | 3124 | **15** | `t`, `d` |
| métricas inline (sem nome de const) | 3169 | **8** | `label`, `value`, `sub` |

- `EDU_TIMELINE` **não é** `linha-do-tempo.ts`. São objetos editoriais
  distintos, e a diferença é de cobertura: `MARCOS_PARAOPEBA` começa em
  2025-03-14, e os **7 eventos pré-2025 não existem no portal** — o
  rompimento (25/01/2019), o Termo da DPMG (abr/2019), a denúncia dos 16
  réus (jan/2020), o Acordo de R$ 37,6 bi (04/02/2021), a FGV assumindo o
  PTR (nov/2021), o anúncio do corte (nov/2024) e a ACP (mar/2025). Um
  acervo sobre a reparação que não contém o rompimento tem um buraco no
  meio.
- `EDU_FAQ` (9 perguntas) e `EDU_GLOSSARIO` (15 verbetes: ERSHRE, PNAB,
  IAC 18, NAE…) não têm equivalente nenhum no repo. É a camada que traduz o
  vocabulário do processo — vale mais que várias notícias.
- Métricas inline: **272 vidas perdidas · ≈160 mil beneficiários do NAE ·
  R$ 133,1 mi/mês · 36 municípios · R$ 37,6 bi (Acordo) · R$ 6,8 bi pagos ·
  7+ anos sem reparação plena · dragagem < 1 km (de 46 km)**. Três já estão
  em `auxilio.ts` **com valores diferentes e mais novos** (o portal traz
  "R$ 21 bilhões+" onde o V1 traz "R$ 6,8 bi"). Ingerir estes 8 números como
  estão **rebaixaria** dado atual. Se entrarem, entram re-apurados na fonte
  primária, não copiados daqui — a mesma ressalva que o survey já fez sobre
  os números-resumo.

---

## 5. Ordem sugerida, se o dono mandar seguir

1. **`CLIPPING_DATA` (59)** — maior volume cívico, método já pronto e
   provado nas ATIs, risco baixo.
2. **`EDU_GLOSSARIO` (15) + `EDU_FAQ` (9)** — barato, e é o que torna o
   resto do acervo legível para quem não é do processo.
3. **`EDU_TIMELINE` pré-2025 (7 eventos)** — fusão com `linha-do-tempo.ts`,
   exige decisão editorial sobre granularidade; não é copiar array.
4. **Métricas (8)** — só com re-apuração; não copiar.
5. **`PORTALS_DATA` (69)** — segue recusado.

Antes de qualquer um deles: **perguntar ao dono se existe versão mais nova
do painel** que o `(V1)`. O survey de 13/08 viu uma, de 391.941 bytes. Se
ela reaparecer, ela é a fonte — e os 46 itens das ATIs devem ser
re-extraídos dela (mesmo script, é só trocar a constante `FONTE`).
