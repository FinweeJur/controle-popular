# Plano — Hero vivo: abertura animada nos 4 eixos (home revertida)

> **Tipo:** PLANO
> **Domínio:** global (4 eixos; home revertida à capa em 06/10/2026)
> **Última medição:** 2026-10-06
> **Leitura estimada:** média (5–15 min)
> **Relacionados:** [PLANO-IDENTIDADE-VISUAL-HERO-NARRATIVO.md](PLANO-IDENTIDADE-VISUAL-HERO-NARRATIVO.md), [ESTADO.md](../02-estado/ESTADO.md), [AGENTS.md](/AGENTS.md)
> **Palavras-chave:** hero, abertura, vanta, three.js, lenis, react-bits, shiny-text, spotlight-card, magnet, webgl, reduced-motion, acessibilidade

## Sumário

- [Propósito](#propósito)
- [Decisões do dono (05/10/2026)](#decisões-do-dono-05102026)
- [O que foi implementado](#o-que-foi-implementado)
- [Arquitetura de código](#arquitetura-de-código)
- [Cores por tema](#cores-por-tema)
- [Acessibilidade e regras do portal](#acessibilidade-e-regras-do-portal)
- [Dependências e peso](#dependências-e-peso)
- [Riscos e mitigações](#riscos-e-mitigações)
- [Como verificar](#como-verificar)
- [Decisões registradas](#decisões-registradas)
- [Origem / Histórico](#origem--histórico)

## Propósito

Primeira dobra viva nos 4 eixos do portal: tela cheia com apenas o
NOME da página sobre fundo animado (WebGL), seguida do conteúdo de sempre.
Navbar e letreiro ficam ACIMA da abertura. O leitor sob estresse continua
chegando ao dado com o mesmo número de cliques — a abertura é seção, não
obstáculo.

A home entrou em 05/10/2026 e SAIU em 06/10/2026: o dono pediu a volta ao
que era antes — título "CONTROLE POPULAR" em cima da capa da onça, entre
as citações (`app/page.tsx` sem `AberturaHero`, `CapaFrente` com `<h1>`
próprio de sempre). A chave `home: null` permanece no mapa como guarda.

## Decisões do dono (05/10/2026)

| Decisão | Escolha |
|---|---|
| Efeito Vanta | Um por página (dono, 06/10): SEM efeito na home (que depois SAÍU da abertura), DOTS (Terra), BIRDS (Direitos), GLOBE (Estado), NET (Central). CELLS abandonado |
| Abertura | Tela cheia, só o nome da página; texto/foto vêm depois |
| Split Text | DESCARTADO (nome entra de peça única, com brilho Shiny Text) |
| ScrollTrigger | ADIADO (reavaliar depois) |
| Lenis | Global, com botão liga/desliga no rodapé |
| React Bits | ShinyText + SpotlightCard + Magnet (vendor, sem pacote npm) |
| Cores | Lidas dos tokens do tema ativo; troca de tema muda as cores ao vivo |

## O que foi implementado

- `lib/hero-vivo.ts` + `hero-vivo.test.ts` — mapa página→efeito, regra
  `deveRenderCanvas` (reduced-motion, ponteiro, alto contraste) e opções de
  cor por efeito. 16 testes.
- `app/components/abertura/AberturaHero.tsx` — seção tela cheia, `<h1>`
  único, CTA "Role para explorar" (âncora real `#conteudo-principal`),
  IntersectionObserver que mata o efeito fora da tela.
- `app/components/abertura/AberturaCanvas.tsx` — Vanta + three.js do npm
  (opção `THREE`, evita o r134 embutido), import dinâmico por efeito,
  cores normalizadas por canvas 2D (a paleta do portal está em OKLCH),
  recria o efeito quando o tema muda.
- `app/components/react-bits/` — ShinyText, SpotlightCard, Magnet
  (vendoriado de reactbits.dev, MIT, adaptado a tokens e reduced-motion),
  CSS em `react-bits.css`.
- `app/components/rolagem/RolagemSuave.tsx` + `BotaoRolagemSuave.tsx` —
  Lenis raiz, `anchors: true`, toggle no rodapé, localStorage
  `cp_rolagem_suave`, desliga em reduced-motion.
- Integração: `app/page.tsx` (home — ENTROU em 05/10 com
  `CapaFrente.mostrarTitulo={false}` e SAIU em 06/10, revertida à capa
  com `<h1>` na foto da onça), `EixoLayout.tsx` (prop `abertura`, h1→h2
  nos hubs, `main` ganha `id="conteudo-principal"`),
  `direitos-em-movimento/page.tsx` (standalone, recebe a abertura
  direto), SpotlightCard nos grids de indicadores de Terra/Estado/Central.

## Arquitetura de código

```text
apps/web/
├── app/
│   ├── page.tsx                              # home SEM abertura (revertida 06/10)
│   ├── components/
│   │   ├── abertura/AberturaHero.tsx          # "use client", dynamic ssr:false
│   │   ├── abertura/AberturaCanvas.tsx        # Vanta + three do npm
│   │   ├── react-bits/{ShinyText,SpotlightCard,Magnet}.tsx
│   │   ├── react-bits/react-bits.css          # brilho + spotlight (tokens)
│   │   ├── rolagem/RolagemSuave.tsx           # Lenis raiz no layout.tsx
│   │   ├── rolagem/BotaoRolagemSuave.tsx      # toggle no FooterGlobal
│   │   └── eixos/EixoLayout.tsx               # prop `abertura` (só hubs)
│   └── componentes dos 4 eixos (abertura + SpotlightCard)
├── lib/hero-vivo.ts + hero-vivo.test.ts       # lógica pura + 16 testes
└── vanta.d.ts                                 # tipos do Vanta (sem tipos no npm)
```

Estrutura vertical de cada página: navbar + letreiro (intocados) →
abertura 100vh (nome + fundo) → breadcrumb (eixos) → header de conteúdo
(epígrafe/resumo/foto) → conteúdo de sempre.

## Cores por tema

- Fonte única: tokens CSS (`--cp-primary`, `--cp-secondary`, `--cp-bg`),
  lidos com `getComputedStyle` no elemento da seção. Pedido do dono
  (06/10/2026): o efeito usa as DUAS cores do tema — os dois tokens
  existem em todos os 8 temas; o antigo `--eixo-ativo-cor` saiu de cena.
- A paleta do portal está em OKLCH (armadilha do AGENTS): o valor resolvido
  é normalizado por canvas 2D (`fillStyle` serializa para `#rrggbb`),
  com fallback para `color(srgb …)` e `rgb(a)`.
- Troca de tema → efeito destruído e recriado com as cores novas
  (`resolvedTheme` na dependência do `useEffect`).
- Nenhum hex cravado em componente — a paleta mora só no `globals.css`.

## Acessibilidade e regras do portal

| Condição | Comportamento |
|---|---|
| `prefers-reduced-motion: reduce` | Sem canvas, sem brilho, sem magnet, Lenis desligado; tudo visível |
| Tema alto contraste | Sem canvas (`--cp-glow: transparent` trava dupla), sem brilho, sem spotlight |
| `pointer: coarse` (celular) | Sem WebGL — fundo do tema + nome (economia de bateria) |
| Sem WebGL / JS falhou | Fundo `--cp-bg` + nome em HTML do servidor; nada de `opacity: 0` pré-JS |
| Leitor de tela | Canvas `aria-hidden`; `<h1>` real com o nome; CTA é âncora focável |
| Casca persistente (§5.13) | Lenis e abertura não desmontam na navegação; âncoras seguem funcionando |
| H1 único | Hubs com abertura: h1→h2 no header; home (sem abertura): `<h1>` na `CapaFrente`, como antes |

## Dependências e peso

| Pacote | Versão | Papel | Peso aproximado (gzip) |
|---|---|---|---|
| `vanta` | 0.5.24 | efeitos WebGL (MIT) | ~40–60 KB por efeito |
| `three` | 0.156.1 | render WebGL (passado ao Vanta pela opção `THREE`) | ~150 KB |
| `lenis` | 1.x | rolagem suave | ~5 KB |
| `@types/three` (dev) | 0.156.0 | tipos do three | 0 no bundle |

Carregamento: só as páginas COM efeito baixam Vanta/three, via
`next/dynamic` + import dinâmico por efeito (a home nem monta mais o
hero, dono 06/10 — nem three ela carrega). As demais rotas não pagam
nada. TOPOLOGY/TRUNK ficaram de fora (exigiriam p5.js — dependência extra).

## Riscos e mitigações

| Risco | Mitigação |
|---|---|
| Vanta sem manutenção desde 2021 | three do npm pela opção `THREE`; efeito destruído fora da tela; fallback estático sempre presente |
| `npm install` trocou a junção por node_modules real na worktree (~2 GB de disco) | Aceito: isola as dependências novas das outras sessões; não afeta a `main` |
| Lenis briga com âncoras/BackToTop | `anchors: true`; toggle no rodapé; reduced-motion desliga; verificar navegação com Playwright |
| Enjoo de movimento | reduced-motion é lei; lerp 0.12 (padrão Lenis); efeito só com mouse fino |
| Efeito fingir dado | Fundos são DECORATIVOS — sem implicação georreferenciada (regra editorial §7) |
| Cota de build do Guara | Nada disso força deploy; push só testa; deploy fica para a janela de ~5 dias |

### ⚠️ Duas armadilhas descobertas NA VERIFICAÇÃO (05/10/2026)

1. **`destroy()` do Vanta lança `NotFoundError` e derruba a navegação.**
   O `destroy` do Vanta chama `el.removeChild(canvas)` e falha quando o
   canvas já não é filho direto do container (o Vanta mexe no próprio DOM
   durante a vida do efeito). O cleanup do `useEffect` não pode lançar:
   o React tratava o erro como quebra de árvore, **abortava a navegação
   client-side e caía em reload completo** — o áudio do rádio (casca
   persistente, §5.13) morria em todo salto a partir de uma página com
   abertura. Conserto duplo em `AberturaCanvas.tsx`: (a) o Vanta recebe um
   slot imperativo criado por nós (nenhum filho estranho em nó do React);
   (b) `destroy()` embrulhado em `try/catch` — pior caso é um canvas
   órfão que o GC recolhe. Verificado com bisseção Playwright (diag v5–v7)
   e pelo `verificar-radio-navegacao.py`: **0 saltos mataram o áudio**.

2. **`newrelic` empacotado na instrumentation quebra o dev frio (500 em
   toda rota).** A compilação da `instrumentation.ts` não honra
   `serverExternalPackages` (nem o default "externo por padrão"): o
   pacote entrava no bundle, o `shimmer.js` arrastava o `README.md` de
   `lib/subscribers/` num contexto `require("./subscribers/")`, e o
   `ModuleParseError` virava 500 global. A `main` não sentia porque o
   cache do dev estava quente; qualquer clone novo ou `.next` limpo
   rebenta. Conserto em `next.config.ts`: `externals.push(/^newrelic…/)`
   na compilação de servidor via hook `webpack` — Node resolve o APM em
   runtime, que é o correto. O `ContextReplacementPlugin` não serviu: o
   webpack compilado do Next não o exporta.

3. **`window.THREE` precisa existir ANTES do import do efeito do Vanta.**
   Os arquivos `dots`, `birds` e `net` capturam `window.THREE`
   na AVALIAÇÃO do módulo (`let l = window.THREE`) — a opção `THREE:` da
   base é ignorada por eles. Era o motivo de os 4 eixos nascerem no
   fallback estático ("Init error ... reading 'PerspectiveCamera'")
   enquanto o GLOBE funcionava. Corrigido: a biblioteca three é
   preparada (com a GPGPU abaixo) e publicada em `window.THREE` ANTES do
   import do efeito — helper memoizado `bibliotecaThree()`, pré-aquecido
   no mount da abertura para o carregamento não ficar em cascata.

4. **`GPUComputationRenderer` não existe no core do three moderno.** O
   efeito BIRDS usa GPGPU e lê a classe do three capturado; no three
   0.156 ela mora em `three/examples/jsm/misc/` (medido: `import('three')`
   devolve `false` para a classe). Sem anexar, o init do birds falhava a
   cada frame ("reading 'time'"). O helper anexa a classe ao objeto
   publicado em `window.THREE`.

5. **Namespace do three ignora atribuição de propriedade — em silêncio.**
   `t.GPUComputationRenderer = x` num namespace ES/webpack NÃO lança erro
   e o valor continua `undefined` (medido em node). Por isso a biblioteca
   publicada é um clone simples (`Object.assign(Object.create(null),
   modulo)`), não o namespace direto.

6. **Cores por tema: o seletor do portal escreve `data-theme` no `<html>`**
   — componentes que precisam reagir à troca observam o atributo com
   MutationObserver (precedente: `CursorTema.tsx`). O fundo WebGL era
   pintado com a cor do carregamento e nunca mais mudava. Conserto: hook
   `useTemaPortal` (observer) recria o efeito na troca; tema alto
   contraste também ficou reativo (entra/sai do HC monta/desmonta o
   canvas na hora). A seção da abertura pinta `--cp-bg` própria — os
   chunks chegando (5-15s no dev frio; instantâneo em produção) nunca
   deixam a abertura crua.

7. **`PlaneBufferGeometry` não existe mais no three 0.156.** O
   `GPUComputationRenderer` embutido do vanta.birds (vendor para o three
   r134) destrutura o THREE exigindo essa classe; no three novo ela virou
   `PlaneGeometry`. O destructuring deixava `v = undefined` e o init
   quebrava com `TypeError: v is not a constructor` — e o catch do birds
   seguia em frente sem avisar, com o erro seguinte ("reading 'time'")
   repetindo a cada frame. Conserto: alias `PlaneBufferGeometry =
   PlaneGeometry` no objeto publicado (06/10/2026).

8. **`DataTexture` do vendor nasce sem `needsUpdate` — e em three
   moderno isso zera o efeito.** O vendor cria a textura de posição com
   `new DataTexture(data, ...)` e nunca sinaliza o upload. Sem o sinal,
   o three não sobe o array pra GPU; o passThru do init copia preto, os
   render targets ficam zerados e TODOS os pássaros nascem em (0,0,0):
   o efeito roda (draw call ok, `time` avançando, zero erros de console)
   e desenha nada. Bisseção com three 0.156 × vanta.birds puro provou a
   causa (isolado sem patch: PARADO; com patch: 42k pixels animando).
   Conserto: subclasse `DataTextureComUpload` (com `needsUpdate = true`)
   só no CLONE publicado ao Vanta — o three do app não muda (06/10/2026).

9. **Medir movimento de efeito na região errada dá falso "PARADO".** O
   enxame do BIRDS se concentra no centro-direita da dobra; meu script
   media o canto superior esquerdo e via 0 pixels mudando com o efeito
   vivo na tela (prova: esconder o canvas muda 49k pixels). Regra: medir
   a região onde o efeito DEVE aparecer, ou isolar com o diferencial
   canvas visível × escondido — esse diferencial não mente (06/10/2026).

## Como verificar

```bash
# camadas (AGENTS §9)
npx tsc --noEmit                              # em apps/web
npx vitest run lib/hero-vivo.test.ts          # 16 testes da lógica
npx eslint <arquivos do diff>
python scripts/validar-documentacao.py        # este arquivo
python scripts/verificar-radio-navegacao.py   # casca viva (§5.13)
npm test                                      # antes do push
```

À mão: trocar tema (claro/escuro/pequi/alto contraste) com a abertura na
tela — cor do fundo muda sem recarregar; ativar reduced-motion — canvas,
brilho e Lenis somem; celular — versão estática; JS desligado — nome
visível.

## Decisões registradas

- 05/10/2026 — dono aprovou: Vanta (um efeito por eixo), abertura tela
  cheia só com o nome, Lenis global com toggle, React Bits (ShinyText,
  SpotlightCard, Magnet), Split Text descartado, ScrollTrigger adiado.
- 05/10/2026 — CELLS no lugar de TOPOLOGY na Central: TOPOLOGY usa p5.js.
- 05/10/2026 — Direitos (hub standalone) recebe a abertura direto na
  página; SpotlightCard não aplicado ali porque os cartões usam
  `PortaCard` próprio.
- 05/10/2026 — slot imperativo + destroy blindado no Vanta (ver
  "Armadilhas descobertas" em Riscos): navegação client-side preservada,
  áudio da casca vivo (script oficial: 0 mortes).
- 05/10/2026 — `newrelic` como external do servidor no hook `webpack`
  (ver "Armadilhas descobertas"): dev frio volta a funcionar.
- 05/10/2026 — rodada 2 da verificação: dono reportou eixos sem animação,
  cores presas ao tema do carregamento e pediu o ScrollTrigger de descida.
  Consertos: `window.THREE` antes do import do efeito + GPGPU anexada +
  `useTemaPortal` (MutationObserver) + seção pinta `--cp-bg` própria +
  ScrollTrigger de descida no conteúdo (`scrub: true`, sem `pin`).
- 06/10/2026 — rodada 3 do dono (5 pedidos): (1) todo efeito usa a
  primária E a secundária do tema (tokens `--cp-primary`/`--cp-secondary`,
  os dois existem nos 8 temas; saiu o `--eixo-ativo-cor`); (2) home sem
  efeito (hero fica, canvas e pré-aquecimento do three somem); (3) GLOBE
  da home foi para o Estado; (4) NET do Estado foi para a Central;
  (5) CELLS abandonado. Verificado Playwright em pequi e pantanal:
  4 efeitos com as 2 cores certas, home sem slot.
- 06/10/2026 — `glowColor` era chave morta: não existe na fonte do
  vanta 0.5.24 (só no demo antigo). Removida; o globe usa `color` e
  `color2` (medido em `node_modules/vanta/src/vanta.globe.js`).
- 06/10/2026 — rodada 4 do dono: a home SAIU da abertura, volta ao que
  era antes (título em cima da capa da onça, entre as citações).
  Revertidos `app/page.tsx` (sem `AberturaHero`, sem fragmento) e
  `CapaFrente.tsx` (prop `mostrarTitulo` removida, `<h1>` incondicional
  de novo). Os 4 eixos seguem com a abertura; a chave `home: null` fica
  no mapa como guarda.

## Origem / Histórico

- 2026-10-05: plano criado na sessão do hero vivo (worktree `cp-hero-vivo`,
  porta 3048), a partir do pedido do dono de melhorar as hero sections com
  Vanta, GSAP, Lenis e React Bits. GSAP já instalado e `HeroNarrative`
  permanece como precedente de padrões (reduced-motion, sem `pin`).
- 2026-10-06: rodada 3 do dono — novo mapa de efeitos (home sem efeito,
  globe→Estado, net→Central, cells fora) e as duas cores do tema em todo
  efeito. Verificação Playwright 5 páginas × 2 temas: 10/10 OK.
- 2026-10-06: rodada 4 do dono — home devolvida ao que era antes da
  abertura (título em cima da foto da onça, entre as citações); a
  abertura vive só nos 4 eixos. `CapaFrente` volta ao `<h1>`
  incondicional, sem a prop `mostrarTitulo`.
