# Plano — Hero vivo: abertura animada nas 5 páginas nobres

> **Tipo:** PLANO
> **Domínio:** global (home + 4 eixos)
> **Última medição:** 2026-10-05
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

Primeira dobra viva nas 5 páginas nobres do portal: tela cheia com apenas o
NOME da página sobre fundo animado (WebGL), seguida do conteúdo de sempre.
Navbar e letreiro ficam ACIMA da abertura. O leitor sob estresse continua
chegando ao dado com o mesmo número de cliques — a abertura é seção, não
obstáculo.

## Decisões do dono (05/10/2026)

| Decisão | Escolha |
|---|---|
| Efeito Vanta | Um por página: GLOBE (home), DOTS (Terra), BIRDS (Direitos), NET (Estado), CELLS (Central) |
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
- Integração: `app/page.tsx` (home, `CapaFrente.mostrarTitulo={false}`),
  `EixoLayout.tsx` (prop `abertura`, h1→h2 nos hubs, `main` ganha
  `id="conteudo-principal"`), `direitos-em-movimento/page.tsx`
  (standalone, recebe a abertura direto), SpotlightCard nos grids de
  indicadores de Terra/Estado/Central.

## Arquitetura de código

```text
apps/web/
├── app/
│   ├── page.tsx                              # home: <AberturaHero> antes do <main>
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

- Fonte única: tokens CSS (`--cp-primary`, `--eixo-ativo-cor`, `--cp-bg`,
  `--cp-glow`), lidos com `getComputedStyle` no elemento da seção.
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
| H1 único | Home: `CapaFrente.mostrarTitulo={false}`; hubs: h1→h2 no header |

## Dependências e peso

| Pacote | Versão | Papel | Peso aproximado (gzip) |
|---|---|---|---|
| `vanta` | 0.5.24 | efeitos WebGL (MIT) | ~40–60 KB por efeito |
| `three` | 0.156.1 | render WebGL (passado ao Vanta pela opção `THREE`) | ~150 KB |
| `lenis` | 1.x | rolagem suave | ~5 KB |
| `@types/three` (dev) | 0.156.0 | tipos do three | 0 no bundle |

Carregamento: só as 5 páginas com abertura baixam Vanta/three, via
`next/dynamic` + import dinâmico por efeito. As demais rotas não pagam
nada. CELLS no lugar de TOPOLOGY (Topology exigiria p5.js — dependência
extra evitada).

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

## Origem / Histórico

- 2026-10-05: plano criado na sessão do hero vivo (worktree `cp-hero-vivo`,
  porta 3048), a partir do pedido do dono de melhorar as hero sections com
  Vanta, GSAP, Lenis e React Bits. GSAP já instalado e `HeroNarrative`
  permanece como precedente de padrões (reduced-motion, sem `pin`).
