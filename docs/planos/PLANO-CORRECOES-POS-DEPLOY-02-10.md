# PLANO — Correções pós-deploy de 02/10/2026

> **Tipo:** PLANO
> **Domínio:** global (UI, dados e desempenho, observados após o deploy `278e6430`)
> **Última medição:** 2026-10-02
> **Leitura estimada:** media
> **Relacionados:** [AGENTS.md](/AGENTS.md), [ESTADO.md](../02-estado/ESTADO.md), [OPERACAO.md](../05-operacao/OPERACAO.md), [PLANO-COMPANHEIRO-SEU-NONO.md](PLANO-COMPANHEIRO-SEU-NONO.md)
> **Palavras-chave:** correcoes, pos-deploy, companheiro, galinha, petdex, radio, bandeira, mistica, fumaca, fonte, seu-nono, tarifa-social, ajuda, dither, desempenho

## Sumário

- [Propósito](#propósito)
- [Ranking por custo](#ranking-por-custo)
- [Item 3 — Fumaça da mística](#item-3--fumaça-da-mística)
- [Item 5 — Tarifa social](#item-5--tarifa-social)
- [Item 4 — Fonte mínima e botões do Seu Nonô](#item-4--fonte-mínima-e-botões-do-seu-nonô)
- [Item 2 — Rádio](#item-2--rádio)
- [Item 7 — Dither do laboratório](#item-7--dither-do-laboratório)
- [Item 1 — Companheiro automático](#item-1--companheiro-automático)
- [Item 6 — Ajuda a direitos](#item-6--ajuda-a-direitos)
- [Ordem de execução](#ordem-de-execução)
- [Decisões registradas](#decisões-registradas)

## Propósito

Os sete problemas abaixo foram observados no site depois do deploy `278e6430`
(02/10). Cada um tem a causa já medida no código, o custo estimado e o caminho
de correção. A ordem é por **menor custo**: entrega rápida primeiro.

## Ranking por custo

| Ordem | Item | Custo | Resumo |
|---:|---|---|---|
| 1 | 3. Fumaça da mística | ~15 min | a fumaça só "respira" (opacidade); não sobe |
| 2 | 5. Tarifa social | ~30 min | dado existe; é descompasso de rótulo/rota |
| 3 | 4. Fonte mínima + botões Seu Nonô | ~1–2 h | 1 violação nova + reusar componentes prontos |
| 4 | 2. Rádio | ~2–4 h | 4 itens pequenos + 1 médio (corte na navegação) |
| 5 | 7. Dither | ~1–2 h | otimizar o canvas (decisão do dono) |
| 6 | 1. Companheiro automático | ~meio dia | web sem pareamento + arte da galinha |
| 7 | 6. Ajuda a direitos | ~1–2 dias | MPF/DPU fácil; 26 UFs exige coleta |

## Item 3 — Fumaça da mística

**Sintoma:** a fumaça ao lado da Mística do Dia não sobe.
**Causa:** `CampfireColonyAnim.tsx` anima só a opacidade
(`@keyframes cp-fumaca-respira`, `:110-113`); não há translação.
**Correção:** acrescentar `translateY` ao keyframe (a fumaça sobe e some no
topo pelo degradê já existente). Respeitar `prefers-reduced-motion` (`:114`).
**Arquivo:** `apps/web/app/components/CampfireColonyAnim.tsx`.

## Item 5 — Tarifa social

**Sintoma:** a página exibida no índice não fala de tarifa social de água e
energia.
**Causa:** descompasso de rótulo. `TopNav.tsx:123` e `indice/page.tsx:320`
rotulam "Ajuda & Tarifa Social" apontando para `/direitos-em-movimento/ajuda`,
que só tem a rede de proteção (`SeletorRedeGeral`). O dado existe:
`apps/web/data/noticias-portal.json` (slug `tarifa-social-energia-agua-como-acessar`)
e os canais em `apps/web/data/canais-informacao-lai.json`.
**Correção:** separar os dois — "Tarifa Social" aponta para a notícia (ou para
`/direitos-em-movimento/informacao`); "Ajuda" mantém a rede.
**Arquivos:** `TopNav.tsx`, `app/indice/page.tsx`,
`app/direitos-em-movimento/page.tsx`.

## Item 4 — Fonte mínima e botões do Seu Nonô

**Fonte:** a regra §5.10 manda piso `text-sm` na descrição sob o título.
- Violação real nova: `app/assembleias/page.tsx:63` (`text-xs sm:text-sm`).
- Epígrafe: `app/empresas/conglomerados/page.tsx:101` (`text-xs`) — é citação,
  não descrição; decidir se entra na regra.
- ~8 páginas legadas (`[municipio]/prefeitura/*`, `governo/[uf]`, `guia`,
  `congresso/votacoes`).
- `empresas/fortunas` já está conforme.

**Botões:** hoje há perguntas só como texto. Já existe o componente
`BotaoPerguntarNono.tsx` e o evento global `"abrir-seu-nono"` com
`detail.pergunta` (`SeuNono.tsx:997-1009`).
- `LabSeuNono.tsx:279` (5 botões mortos) e `:447` (texto puro).
- `ambiental/crise-climatica/PainelCriseClimaticaClient.tsx:1100`.
- 2 links mortos `/assistente?pergunta=` (`america-latina`, `biblioteca`).

**Correção:** subir para `text-sm`/`ResumoExpandivel`; trocar texto por
`BotaoPerguntarNono`.

## Item 2 — Rádio

- **Corte ao navegar:** o player vive no layout raiz e não remonta; o corte vem
  de `<a href="/...">` internos (recarga completa) em ~5 arquivos
  (`app/ambiental/layout.tsx:43`, `funcaosocialterra/Cabecalho.tsx:53`,
  `app/indice/page.tsx:476`, `historico/page.tsx:91`). Trocar por `next/link`.
- **Volume:** não existe; criar `input[type=range]` + mute ligado a
  `audioRef.current.volume`.
- **3 botões → 1:** fundir arrastar (`PlayerRadio.tsx:305`), play/nome (`:317`)
  e chevron (`:342`) num só.
- **Hover do índice:** os helpers de atraso (`:67-89`) são código morto; o
  `onMouseLeave` (`:233`) fecha na hora. Ligar o atraso e deixar o volume
  visível no hover.
- **Bandeiras (decisão do dono):** emoji regional-indicator não rende no
  Windows; trocar por imagem (`flagcdn.com/<iso>.svg`) em `PlayerRadio.tsx:282`
  e `PainelRadio.tsx:225,298`.

## Item 7 — Dither do laboratório

**Sintoma:** `/laboratorio` quase trava; muito CPU/rede.
**Causa:** `lib/laboratorio/dither-charts/*` roda rAF **perpétuo** redesenhando
milhares de `fillRect` com `Math.random()` por frame (`DitherBarChart.tsx:95`,
`DitherHeatmapGrid.tsx:85`); o `hoveredIdx` está nas deps do efeito (`:111`) e
recria o loop a cada mouse; Bar e Heatmap ignoram o gate de visibilidade.
**Decisão do dono:** **otimizar o canvas** (menos trabalho que trocar por SVG,
mantém o visual). Cortes: `hash()` estável no lugar de `random`, pausar fora
da tela/aba oculta, tirar `hoveredIdx` das deps e limitar a ~15 fps.

## Item 1 — Companheiro automático

**Decisão do dono:** o bichinho **web** roda sozinho, **sem código e sem
app**, com a arte da **galinha**.
**Causa dos dois sintomas:**
- O site só **gera** o código; quem digita é o app desktop
  (`SessaoCompanheiro.tsx:154`, `CompanheiroFlutuante.tsx:124`). Sem app, o
  pareamento não existe.
- A galinha (`dingdong-chicken`) é arte de terceiros do Petdex, **gitignored**
  no fork; o site fixa `preguica.png` (`CompanheiroFlutuante.tsx:95`).
**Correção:**
- Remover/recolher o painel de código do site; o bichinho sempre presente.
- Bundlar a arte da galinha em `apps/web/public/companheiro/` e trocar o `src`.
- ⚠️ **Licença:** a arte do Petdex é de terceiros. Confirmar a licença antes de
  versionar, ou gerar uma galinha própria no padrão da preguiça/onça.
- `companion/` (espelho do fork) sai do caminho automático.

## Item 6 — Ajuda a direitos

**Sintoma:** a rede de ajuda está restrita a MG.
**Causa:** fonte única `apps/web/lib/betim/redeProtecao.ts` só tem órgãos de MG.
**Correção:**
- Fácil: acrescentar **MPF** e **DPU** (abrangência federal).
- Médio/grande: **Defensorias** e **MPs dos 26 estados** exigem coleta por UF +
  curadoria de fonte oficial. Ver `lib/ambiental/capacidade-institucional.ts`
  e a rota `/instituicoes` antes de raspar de novo.
**Arquivos:** `redeProtecao.ts`, `components/SeletorRedeGeral.tsx`.

## Ordem de execução

1. Item 3 (fumaça) — 15 min.
2. Item 5 (tarifa social) — 30 min.
3. Item 4 (fonte + botões) — 1–2 h.
4. Item 2 (rádio) — 2–4 h.
5. Item 7 (dither) — 1–2 h.
6. Item 1 (companheiro) — meio dia (depende da licença da galinha).
7. Item 6 (ajuda) — 1–2 dias.

## Decisões registradas

- **Bandeiras:** trocar emoji por imagem (flagcdn).
- **Dither:** otimizar o canvas, não trocar por SVG.
- **Companheiro:** web sozinho, sem código e sem app; arte da galinha
  (confirmar licença do Petdex antes de versionar).
