# PENDÊNCIAS 02.10 — o que ficou em aberto no deploy de 02/10/2026

> **Tipo:** PLANO
> **Domínio:** global (UI, conteúdo e dados observados no site depois do deploy `7e642a31`)
> **Última medição:** 2026-10-02
> **Leitura estimada:** media
> **Relacionados:** [AGENTS.md](/AGENTS.md), [ESTADO.md](../02-estado/ESTADO.md), [PLANO-CORRECOES-POS-DEPLOY-02-10.md](PLANO-CORRECOES-POS-DEPLOY-02-10.md), [PLANO-COMPANHEIRO-SEU-NONO.md](PLANO-COMPANHEIRO-SEU-NONO.md)
> **Palavras-chave:** pendencias, governo, tse, metas, mistica, fumaca, campfire, voo, globo, tarifa-social, companheiro, petdex, clicky

## Sumário

- [Propósito](#propósito)
- [Pendências abertas](#pendências-abertas)
- [Entregues nesta janela](#entregues-nesta-janela)
- [Código não commitado](#código-não-commitado)

## Propósito

Fila única dos problemas observados no portal em 02/10/2026, para não se
perderem entre sessões. Complementa o
[PLANO-CORRECOES-POS-DEPLOY-02-10.md](PLANO-CORRECOES-POS-DEPLOY-02-10.md)
(que fechou os itens 1–7).

## Pendências abertas

| # | Problema | Onde | Estado |
|---|---|---|---|
| 1 | **`/governo` — metas repetidas e genéricas** | `app/governo/*`, `data/gestao/governo-*.json` | ⛔ aberto |
| 2 | **Fumaça do campfire da Mística não renderiza** | `app/components/CampfireColonyAnim.tsx` | 🚧 tentativa #2 |
| 3 | **"Voe até aqui" da Mística dava 404** | `lib/globo/voo.ts` | 🚧 corrigido, falta validar no ar |
| 4 | **Notícia da tarifa social genérica** (falta tabela por estado) | `data/noticias-portal.json`, `app/noticias/[slug]/page.tsx` | ⛔ aberto |
| 5 | **Companheiro: solto/andando/voador** e sem painel de código | `app/components/CompanheiroFlutuante.tsx`, `SeuNono.tsx` | 🚧 pronto, não commitado |
| 6 | **Licença da arte da galinha (Petdex)** | `public/companheiro/dingdong-chicken/PROVENIENCIA.md` | ⛔ dono vai contatar o autor |

### 1. `/governo` — metas do TSE genéricas e repetidas

O site (ex.: `https://backup.controlepopular.com.br/governo`) mostra as metas de
governo **repetidas e genéricas**, em vez de específicas e oficiais tiradas do
**TSE**. Fonte dos dados: `apps/web/data/gestao/governo-<uf>.json` (um por UF,
~4 KB cada), lido por `apps/web/lib/gestao/dados.ts` e renderizado por
`app/governo/[uf]/page.tsx` → `components/PainelGestaoClient.tsx`.

Medido em `governo-sp.json`: **5 propostas** por UF, com `tema` e
`trecho_verbatim`, sem `titulo`. O texto parece o **mesmo template** entre
estados. O correto é extrair o trecho verbatim **do PDF do plano registrado no
TSE** (campo `plano_pdf_url`) e marcar página, sem repetir entre entes.

### 2. Fumaça do campfire não renderiza

`CampfireColonyAnim.tsx`: a fumaça é um `<path>` com
`stroke="url(#cp-fumaca-degrade)"`; o degradê usa
`stopColor="var(--cp-primary, …)"` em **atributo** SVG. `var()` não resolve em
atributo de apresentação → o degradê cai para preto e some no céu escuro.
Correção pendente: passar as cores por `style` (não atributo) e revisar a
visibilidade. **Se não resolver nesta 2ª tentativa, remover a fumaça** (decisão
do dono).

### 3. "Voe até aqui" da Mística → 404

O link vinha de `lib/globo/voo.ts::enderecoVoarAte` com base `/terras/globo/`.
O Next responde `/terras/globo/` com **308** e o destino cai em 404. Corrigido
para `/terras/globo/index.html` (mesmo caminho do `GloboIframe.tsx`) e o teste
`lib/globo/voo.test.ts` atualizado. **Falta validar no build/ar.**

### 4. Tarifa social — falta a tabela por estado

A notícia `/noticias/tarifa-social-energia-agua-como-acessar` é genérica. O dono
pede **passo a passo por estado**, com **documentos, telefones, requisitos,
descontos e a concessionária** (de água e de energia). O post só renderiza
`paragrafos` (strings) — não há suporte a tabela no
`app/noticias/[slug]/page.tsx`; é preciso (a) habilitar tabela no renderizador e
(b) **coletar o dado por UF com fonte oficial** (ANEEL + companhias de
saneamento). Regra do portal: telefone só entra se verificado na fonte.

### 5. Companheiro — solto, andando e voando

Mecânica adaptada do Clicky original (farzaa/clicky; porta Bitshank-2338):
bicho **solto** sobre o texto (overlay click-through), **voo em arco bezier**
até o alvo com **anel pulsante** e retorno. Base: a galinha observa os alvos
`data-companheiro-alvo="abrir-pagina"` que a resposta do Seu Nonô marca.
- Feito (não commitado): `CompanheiroFlutuante.tsx` solto/andando/voador;
  `SeuNono.tsx` sem o painel de código do Petdex.
- Decisão do dono: o companheiro **não é um "chatbot 2"** — ele **guia** até a
  página a clicar.

## Entregues nesta janela

Base do [PLANO-CORRECOES-POS-DEPLOY-02-10.md](PLANO-CORRECOES-POS-DEPLOY-02-10.md),
já no ar:

- Rádio (volume, botões, hover, bandeiras), tarifa social (rótulo),
  ajuda (MPF/DPU + 26 UFs), fonte mínima + botões do Seu Nonô, mística
  (1ª tentativa da fumaça), dither otimizado, `/ambiental/tac`,
  `/ambiental/ameacas-americas`, `/biblioteca`.
- Companheiro: galinha do Petdex rodando sozinha (deploy `7e642a31`).

## Painel da home — números (02/10/2026)

- **Volume de dado acrescentado** ao painel da home e ao acervo do Seu Nonô:
  **274 bases, 46.273 registros, 22 temas** (medido de `data/bases-portal.json`,
  não digitado).
- **A soma em R$ 251 bi continua** com a composição nominal: Rio Doce (171) +
  Brumadinho (37,7) + Justiça MG (20,1) + cidades (22,7). Cada parcela precisa de
  **re-verificação na fonte** (valor do acordo/orçamento na data) — fica na fila,
  sem trocar número sem medir.

## Código que estava pendente — commitado

- `CompanheiroFlutuante.tsx` (solta/voo/anel) → `0bf32436`.
- `SeuNono.tsx` (tira o painel de código) → `0bf32436`.
- `lib/globo/voo.ts` + `voo.test.ts` (base `index.html`) → `bef3b442`.
