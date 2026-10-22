# Capítulos e âncoras: teto da rolagem medido — achado e correção (15/10/2026)

> **Tipo:** RELATORIO
> **Domínio:** navegação (âncoras, sumário, capítulos, sticky)
> **Última medição:** 2026-10-15
> **Leitura estimada:** curta (5-10 min)
> **Relacionados:** [PLANO-CI-RAG-INGESTAO-UNIDADES.md](../historico/entregas/PLANO-CI-RAG-INGESTAO-UNIDADES.md), [PADRAO-PAGINA-WIKI.md](../03-desenvolvimento/PADRAO-PAGINA-WIKI.md), [ESTADO.md](../02-estado/ESTADO.md)
> **Palavras-chave:** âncora, scroll-margin, navbar, sticky, subnav, capítulos, sumário, celular, overshoot, lenis

## Sumário

- [O que o dono viu](#o-que-o-dono-viu)
- [Varredura do top 100](#varredura-do-top-100)
- [As duas causas raiz](#as-duas-causas-raiz)
- [A correção-padrão](#a-correção-padrão)
- [Depois da correção](#depois-da-correção)
- [Não-bugs identificados no caminho](#não-bugs-identificados-no-caminho)
- [Como remedir](#como-remedir)

## O que o dono viu

O widget de Capítulos e o sumário descem a página mais do que deveriam ao
escolher uma seção — o título chega escondido atrás da barra fixa do topo.
PC e celular, em várias páginas. (Relato de 15/10/2026; o fix parcial de
14/10 — `scroll-margin-top: 6rem` em `h2[id], h3[id]` — só não estava na
produção, que roda imagem de 14/10 16:07, anterior ao commit das 18:02.)

## Varredura do top 100

Playwright contra o servidor local, 200 medições (100 rotas × 2 visores:
desktop 1280 e celular 390 — o celular usa o sumário do rodapé, que é o
caminho tocável; o pontinho lateral só existe em `xl`). Antes da correção:

| Visor | PASS | Curta (sem 2 headings — por design) | Falha |
|---|---|---|---|
| desktop | 61 | 32 | 7 |
| celular | 44 | 24 | **31** |

As falhas do celular formavam duas famílias medidas (não é achismo — print em
`scripts/verificar-capitulos-rolagem.py`, saída em `/tmp`):

1. **Hub com subnav (`/central`, `/estado-e-economia`, `/terra-e-territorios`,
   `/nossos-rios`, `/nossas-serras`, saude, educacao):** topo tem DUAS barras
   `sticky top-0` — header 97 px + subnav de chips 173 px. O `6rem` (~105 px)
   parava o título 68 px dentro da subnav. `top=105, nf=173`.
2. **Âncora de `<section>` (`/cidades`, `/ambiental/mariana`, legislacao,
   instituicoes, contatos, recomendacoes, governo, indice, informacao):** o
   sumário linka ids que não são h2/h3 — a regra `h2[id], h3[id]` não alcança
   `<section id="grafico-…">`. Medido: `scroll-margin-top: 0px` → título
   colado no topo, atrás do header. `top=0/-14/-37/-45`.

## As duas causas raiz

1. **Constante não serve a duas casas.** Header + subnav empacotada no
   celular fazem 173 px de teto; a página simples tem 97 px. Um valor fixo
   ou cova o hub ou abre buraco na simples.
2. **Regra casada ao tipo de elemento, não ao papel.** Âncora é âncora
   qualquer que seja a tag; a regra só conhecia heading.

## A correção-padrão

Uma fonte de verdade por página, medida — não adivinhada:

- `app/components/rolagem/ChaoRolagem.tsx` (novo, montado no layout raiz):
  mede a maior barra `sticky/fixed` colada em `top: 0` e publica em
  `--cp-chao` no `<html>`; recalcula na montagem, em cada navegação e no
  resize (empacotamento muda a altura). Não depende do Lenis — vale com
  rolagem nativa e `prefers-reduced-motion`.
- `globals.css`: `h2[id], h3[id], main [id] { scroll-margin-top: var(--cp-chao, 6rem) }`
  — cobre qualquer id âncora dentro do `main`, não só heading. O `6rem` fica
  de fallback até o JS rodar.

## Depois da correção

| Visor | PASS | Curta (por design) | Sobra |
|---|---|---|---|
| desktop | 61 | 25 | 2 undershoot + 12 «SEM-WIDGET» explicados abaixo |
| celular | **75** | 24 | 1 «SEM-SUMARIO» explicado abaixo |

**OVERSHOOT: zero nos dois visores** — a queixa do dono acaba aqui. A
remedição por caso convergiu os números: hub no celular aterrissa a
185 px com subnav aberta; âncora de `<section>` a 109 px.

## Não-bugs identificados no caminho

Registrados para ninguém caçar fantasma na próxima varredura:

- **«SEM-WIDGET»/«SEM-SUMARIO» (12+1):** páginas com menos de 2 headings
  REAIS (a coleta ignora header, sumário e as seções `data-ignorar-indice`)
  não ganham widget nem sumário — decisão medida em 14/10, não regressão.
  O classificador do teste contou h3 onde o widget só aceita h2.
- **Undershoot `/terra-e-territorios/vales` (top=310):** o heading fica perto
  do fim do documento — não há rolagem possível para colá-lo no teto.
  Título visível; física, não bug.
- **`/estado-e-economia` desktop «760»:** leitura tirada com o Lenis ainda
  animando; a 6 s de espera o alvo converge para 120 px (teto certo).

## Como remedir

```
python scripts/verificar-capitulos-rolagem.py            # roda contra :3199
```

Sai `resultados.jsonl` + prints na pasta temporária; o resumo imprime a
tabela por visor e só as falhas. Para produção, apontar `BASE` para
`https://www.controlepopular.com.br` DEPOIS do próximo `azure-mirror`
(a imagem no ar é anterior a este fix — §5.7.1, deploy a pedido do dono).
