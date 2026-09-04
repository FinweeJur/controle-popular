# Tema Pequi — a cor do rebrand, e ela vira padrão

> **Tipo:** PLANO
> **Domínio:** planos
> **Última medição:** 2026-09-04
> **Palavras-chave:** pequi, tema, rebrand, hero, marquee, sanfona, epigrafe, citacoes, contraste, oklch
> **Leitura estimada:** média (5–15 min)
> **Relacionados:** [PLANO-COPY-VOZ.md](PLANO-COPY-VOZ.md) · [PLANO-REBRAND-FOTOS-E-POEMAS.md](PLANO-REBRAND-FOTOS-E-POEMAS.md)

## Sumário

- [A decisão do dono](#a-decisao-do-dono)
- [O que é o Pequi](#o-que-e-o-pequi)
- [Peças que já existem (medição 04/09)](#pecas-que-ja-existem)
- [Peças que faltam](#pecas-que-faltam)
- [Portões inegociáveis](#portoes-inegociaveis)
- [Micro-etapas](#micro-etapas)
- [Fora de escopo](#fora-de-escopo)

## A decisão do dono

04/09, depois de ver o hero publicado: **"Não gostei do hero."**
A referência nova é a **prévia v7.1 do rebrand** (a "PEQUI") que o dono colou
inteira: HTML + CSS + JS de uma home em capítulos, com epígrafes de Carolina
Maria de Jesus, Conceição Evaristo, Guimarães Rosa, Itamar Vieira Junior e
MAB, fitas marquee, sanfona das seis frentes, textura de grão e selos.

A ordem do dono: **"Esse será um dos temas de cores disponíveis e o padrão."**

## O que é o Pequi

Paleta escura quente — a cor do fruto do pezeiro do cerrado:

| Token prévia | Uso |
|---|---|
| `--bg #0D0B08` | fundo, quase-preto quente |
| `--bg-2 #100D0A` | fundo alternado (capítulo sóbrio) |
| `--surface #171310` | cartões, painéis |
| `--border #2E2620` | linhas de divisão |
| `--text #F2EADF` | texto, creme |
| `--text-soft #B8AA98` | texto secundário |
| `--accent #F2701D` | laranja-pequi, a cor da marca |
| `--candeia #E4B33C` | amarelo-candeia, só nos versos (epígrafe.verso) |

Tipografia da casa **já é** a da prévia: Clash Display + General Sans
self-hosted (`app/fonts.ts`, woff2 locais). Nada de CDN novo.

## Peças que já existem (medição 04/09)

- **Sistema de temas:** next-themes com `data-theme` em `globals.css`
  (`:root` claro, `[data-theme="dark"]`, `[data-theme="high-contrast"]`).
  Um tema novo é um bloco `[data-theme="pequi"]` e mais nada no núcleo.
- **Seletor:** `THEMES` em `app/congresso/components/ThemeSwitcher.tsx`
  (há cópias por frente) — adicionar linha `{ value: "pequi", label: "Pequi" }`.
- **Padrão hoje:** `defaultTheme="light"` em `app/layout.tsx:129` → vira `pequi`.
- **Voz:** o copy da prévia JÁ FOI publicado no cherry-pick `b3ece62`
  (hero, 6 frentes, "Já aconteceu aqui"). A prévia aprofunda: epígrafes e
  capítulos com citações — o dono mandou **"aproveitar todas as citações aos
  poucos"**, então cada micro-etapa leva uma ou duas, nunca todas de uma vez.
- **Fotos:** Brasil com S no acervo local (`FotoBrasilComS.tsx`), crédito
  "Créditos: Brasil com S", sem corte. A prévia usa 00039, 00433, 00293 —
  conferir se estão no disco ANTES de referenciar.
- **Herói narrativo:** `HeroNarrative.tsx` tem `TemaPortal` tipado
  (`"light" | "dark" | "high-contrast"`) — estender o tipo ou o componente
  fica sem saber o que fazer com o tema novo. Decidir na etapa 1.

## Peças que faltam

1. Bloco de tokens `[data-theme="pequi"]` no `globals.css`.
2. Textura de grão (SVG `feTurbulence` inline em CSS, `opacity .05`,
   `pointer-events: none`) — checar z-index contra modais/toasts do portal.
3. Marquee (fitas "✦ FISCALIZA ✦ OLHO VIVO ✦...") — componente próprio,
   CSS animation + impulso de scroll, `prefers-reduced-motion` desarma.
4. Sanfona das frentes na home (auto-rotação 4,5 s, pausa em hover/foco,
   aba manual sem rotação em reduced-motion).
5. Capítulos em `max-width: 46rem` com epígrafe/princípio/display/ensaio/
   numcard — reestruturar a home atual em cima deles.
6. Fonte "Ícones do Brasil" (glifos Y C P S M E nos selos): **o arquivo não
   está no PC do dono** (consta em memória) e a licença diz *free for personal
   use; conferir antes de produção*. Sem o ttf licenciado, selo usa o
   fallback SVG que a própria prévia já prevê (`.selo svg`).

## Portões inegociáveis

- **Contraste medido no espaço certo.** O repo mede em OKLCH (armadilha
  documentada: medir em HSL inverte a conclusão). `#F2701D` sobre `#0D0B08`
  e `#B8AA98` sobre `#171310` precisam passar AA (texto normal ≥ 4,5:1) ou o
  tom ajusta antes de entrar. O tema atual escuro do portal usa azul; o Pequi
  é outro par de números — medir de novo, não presumir.
- **Alto contraste intocável.** `[data-theme="high-contrast"]` continua
  existindo e vence tudo; Pequi é padrão, não camisa de força.
- **Citação é ato editorial.** Toda epígrafe entra com autor, obra e ano
  conferidos na fonte (não no LLM). Poema do acervo só com autorização
  registrada — o arquivo `CITACOES-AUTORIZADAS.md` ainda NÃO está no repo
  (medição 04/09: zero hits em `git ls-files`); criar como parte da etapa 4.
- **Números da prévia são placeholder** (`[13.177]`, `R$ [5,48 bi]`).
  Só entra número que a tela puxa de constante medida com data.
- **Teto de bundle:** 3 MiB gzip por rota. Grão/marquee/sanfona são CSS
  puro — proibir biblioteca de animação.
- **Sem `--force`, commit por pathspec, mensagem por arquivo** (regras da casa).

## Micro-etapas

Uma por uma, cada uma termina com: testes + tsc → build local quando mexer
em rota → print no Telegram → commit → push.

1. **Tokens + medida.** Bloco `pequi` no `globals.css`, contraste OKLCH
   medido, print do seletor ainda sem o tema (só o CSS entra).
2. **Tema vivo.** `pequi` no `THEMES` dos seletores, `defaultTheme="pequi"`,
   estender `TemaPortal`/ajustar `HeroNarrative` (glow por tema).
3. **Casca da home.** Grão, marquee, tipografia dos capítulos na home
   atual, SEM mudar o conteúdo ainda. Epígrafe 1 (Carolina, hero).
4. **Sanfona das frentes + selos SVG** (sem o ttf ainda). Citações dos
   selos: 1 por capítulo por vez. Criar `CITACOES-AUTORIZADAS.md`.
5. **Capítulos 01-03** (Cidades, Congresso, Judiciário) com numcard lido
   das constantes reais + epígrafes.
6. **Capítulos 04-07 + por-que + manifesto**, registro sóbrio do Paraopeba,
   fotos da prévia nos lugares do acervo.
7. **Fechamento:** varredura WCAG (teclado, reduced-motion, leitor de
   tela), docs atualizadas, deploy pela esteira das 05:50.

## Fora de escopo

- Fonte "Ícones do Brasil" sem licença resolvida (fallback SVG até lá).
- Reescrever as frentes internas (só a home neste plano; frentes vêm depois,
  herdando os tokens).
- Unificar os três ThemeSwitcher em componente único (belezamento à parte;
  este plano só adiciona linha em cada cópia).
