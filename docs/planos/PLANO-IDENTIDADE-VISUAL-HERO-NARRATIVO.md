# Plano de identidade visual e hero narrativo

> **Tipo:** PLANO
> **Domínio:** global
> **Última medição:** 2026-09-03
> **Leitura estimada:** média (5–15 min)
> **Relacionados:** [PRODUTO.md](../01-produto/PRODUTO.md), [ESTADO.md](../02-estado/ESTADO.md), [ARQUITETURA.md](../04-arquitetura/ARQUITETURA.md), [AGENTS.md](/AGENTS.md)
> **Palavras-chave:** identidade visual, hero, scroll-driven, gsap, parallax, athos bulcao, neon, design system, acessibilidade, reducao-de-motion, home

## Sumário

- [Propósito](#propósito)
- [Contexto: o que a outra sessão entregou](#contexto--o-que-a-outra-sessão-entregou)
- [Onde entra no app](#onde-entra-no-app)
- [Decisões de integração](#decisões-de-integração)
- [Paleta e tokens](#paleta-e-tokens)
- [Arquitetura de código](#arquitetura-de-código)
- [Roadmap em fases](#roadmap-em-fases)
- [Critérios objetivos de validação](#critérios-objetivos-de-validação)
- [Riscos e mitigações](#riscos-e-mitigações)
- [Checklist de entrega](#checklist-de-entrega)
- [Decisões registradas](#decisões-registradas)
- [Origem / Histórico](#origem--histórico)

## Propósito

Responder como aplicar no portal o pacote de identidade visual
**"Controle Popular — mosaico vivo"** produzido por outra sessão de IA:
um hero com narrativa de scroll, parallax de mouse, módulos geométricos
inspirados em Athos Bulcão e acentos neon, sem quebrar as regras que
fazem deste portal um lugar seguro para quem chega sob estresse.

## Contexto: o que a outra sessão entregou

Em `C:\Users\Home\Downloads` há cinco arquivos criados em 2026-09-03:

| Arquivo | Tamanho | Conteúdo |
|---|---|---|
| `resposta.md` | 16,3 KB | Plano de identidade visual (conceito, paleta, tipografia, módulos, animações, roadmap) |
| `resposta (1).md` | 16,3 KB | Cópia idêntica de `resposta.md` |
| `resposta (2).md` | 24,1 KB | Especificação técnica (estrutura de pastas, hooks, critérios de sucesso, resumo para continuação) |
| `resposta (3).md` | 26,8 KB | Assets brasileiros CC0 (fauna, biomas, vídeos, sons) + `HeroNarrative.tsx` completo |
| `App.js` | 11,8 KB | Protótipo funcional (React + GSAP via CDN): parallax de mouse, split-text, botão neon |

**Síntese da proposta estética.** Três correntes que se encontram:

1. **Athos Bulcão** como DNA modular: formas primárias (círculo, triângulo)
   fragmentadas e repetidas, como azulejos.
2. **Neovision 2027** como acento: neon quente (magenta, ciano, verde-limão)
   sobre base terrosa, glow orgânico, grid diagonal.
3. **Festas populares e biomas brasileiros** como conteúdo: fauna geométrica
   (tamanduá, arara, capivara, lobo-guará), cerrado em camadas parallax.

O comportamento proposto: **o scroll conta a história** (timeline por seção)
e **o mouse revela profundidade** (4 camadas com velocidades diferentes).

**O que o protótipo já prova.** O `App.js` roda sem build (React + GSAP por
CDN) e demonstra: parallax de mouse em 3 camadas com `requestAnimationFrame`,
split-text do título com easing `back.out`, underline que cresce, botão com
glow neon, módulo Bulcão e tamanduá em SVG puro. O `HeroNarrative.tsx` da
`resposta (3).md` é a versão "produção" pensada para Next.js, com
`prefers-reduced-motion` e CSS variables.

## Onde entra no app

O portal é um monorepo Next.js 16 (`apps/web`). A home da marca fica em
`apps/web/app/page.tsx`: hoje começa direto no título "Dados públicos que dá
para usar" e lista as frentes e cidades. **Não há vitrine visual da marca.**

Pontos de inserção possíveis, em ordem de prioridade:

| Prioridade | Local | Por quê |
|---|---|---|
| 1 | Home (`apps/web/app/page.tsx`) | É a porta do portal e a única página sem abertura visual; o hero narrativo cabe como primeira seção, com o conteúdo atual (frentes, cidades) logo abaixo, intacto |
| 2 | Cabeçalho municipal (`apps/web/app/[municipio]/page.tsx`) | Já existe um hero com radial-gradient e busca; pode ganhar variação temática por bioma depois (Fase 2), sem trocar a busca de lugar |
| 3 | Páginas de zona (`/ambiental`, `/paraopeba` etc.) | Variações do padrão por frente (ex.: onda de rio no Paraopeba), só depois que a Fase 1 validar o componente na home |

**Regra de ouro**: o hero é *embrulho visual* do que já existe. Ele não
esconde, não substitui e não atrasa o acesso aos dados. A home precisa
continuar listando frentes e cidades com um clique a menos de distância do
que hoje.

## Decisões de integração

### 1. GSAP entra como dependência

O dono liberou: o teto antigo de 3 MiB gzip de bundle não vigora mais
(novo estágio com Cloudflare Tunnel). `gsap` (+ `ScrollTrigger`) entra em
`apps/web`. Ele pesa ~23 KB gzip somado ao bundle — irrelevante no novo
estágio, e é a biblioteca que o protótipo já usa.

### 2. Componente isolado e carregado sob demanda

O hero vira um componente `"use client"` único, importado na home com
`next/dynamic`. Motivo: a home é server component e o hero não deve pagar o
custo de hidratação de animação em página nenhuma que não a home.

### 3. Redução de motion é lei, não enfeite

O portal lê `prefers-reduced-motion` e o tema alto contraste. O componente:

- desliga parallax, split-text e timeline quando `prefers-reduced-motion: reduce`;
- no tema alto contraste, remove glow, gradientes decorativos e padrões de
  fundo — sobra texto com os tokens do tema (7:1 medido);
- no celular (`pointer: coarse`), o parallax de mouse não existe; a história
  continua contada pelo scroll (fade-in simples).

### 4. Paleta da proposta vira acento, nunca base

O portal tem design system com três temas (claro, escuro, alto contraste) e
cores medidas por WCAG. A paleta Bulcão/neon entra como **novos tokens de
acento decorativo**, mapeados por tema, e nunca como canal único de
informação. Detalhe na seção [Paleta e tokens](#paleta-e-tokens).

### 5. Primeira dobra sem foto pesada

O `HeroNarrative.tsx` original coloca `cerrado-panorama.jpg` como fundo da
primeira dobra. Neste portal, a primeira dobra precisa carregar rápido
(LCP) — quem chega pode estar denunciando uma barragem. Decisão: a primeira
dobra usa gradiente + SVG inline (módulos e fauna), que são leves; fotos de
bioma entram só em seções abaixo da dobra, em `next/image` com
`priority={false}` e carregamento preguiçoso.

### 6. Nenhum número novo inventado

O subtítulo do hero não cria estatística. Texto institucional apenas
(quem somos, o que fazemos). Se algum número entrar (ex.: "6 cidades"),
ele vem de constante medida (`listarCidades()` na home), nunca digitado.

## Paleta e tokens

A proposta original sugere, fora do design system do portal:

| Cor proposta | Hex | Função na proposta |
|---|---|---|
| Azul Bulcão | `#2A5CAA` | Azulejaria, bordas |
| Terracota | `#C6714B` | Base terrosa |
| Amarelo cerrado | `#D4B46A` | Base terrosa |
| Magenta neon | `#FF20C5` | CTA, glow |
| Ciano elétrico | `#00F0FF` | CTA, glow |
| Branco neve | `#F6F6F6` | Fundo claro |

**Problema medido**: magenta e ciano puros não passam 4,5:1 sobre fundo
claro (texto), e o portal mede contraste por regra. Eles só podem ser:

- glow/borda sobre superfícies escuras (decorativo);
- cor de elemento não-textual com rótulo ao lado (nunca canal único);
- texto pequeno, sempre na versão escurecida do matiz que passa no tema.

**Tradução para os tokens do portal** (`globals.css` usa `--cp-*` com
`@theme inline` mapeando `--color-*`):

| Token atual | Papel no hero |
|---|---|
| `--color-primary` (azul) | Módulo Bulcão, títulos de destaque |
| `--color-accent` (verde) | Segundo módulo, fauna |
| `--color-tertiary` (ocre) | Terceiro módulo, tom terroso |
| `--color-text` / `--color-text-soft` | Todo texto |
| `--color-surface` / `--color-bg` | Fundos de seção |

Padrão decorativo (círculo fragmentado, onda serra, tamanduá) é desenhado
em SVG inline usando `currentColor` e `color-mix` com os tokens acima, para
que **os três temas herdarem a correção de contraste sem código novo por
tema**. Apenas o glow neon ganha token próprio `--color-glow` por tema
(ex.: no alto contraste ele vira `transparent`).

## Arquitetura de código

```text
apps/web/
├── app/
│   ├── components/
│   │   └── HeroNarrative.tsx        # novo, "use client", portado de HeroNarrative.tsx
│   │   └── HeroNarrativePatterns.tsx # novo: SVGs (BulcaoCircle, onda, tamandua)
│   ├── page.tsx                     # home: importa o hero com next/dynamic
│   └── globals.css                  # + tokens --color-glow por tema
├── public/assets/biomas/            # novo: fotos CC0 otimizadas (webp/avif)
└── package.json                     # + gsap
```

**Componente** em `apps/web/app/components/HeroNarrative.tsx`, adaptado do
`resposta (3).md` e do `App.js`:

1. `"use client"`, refs no container.
2. `useParallaxMouse` com `requestAnimationFrame` (4 camadas no desktop,
   0 no `pointer: coarse`/reduced-motion).
3. Timeline GSAP + ScrollTrigger com `scrub: true`, presa ao scroll da
   própria seção (sem `pin` na home, para não prender quem quer dados).
4. Split-text no título com fallback estático (se JS falhar, o texto já
   está visível; nada de `opacity: 0` sem classe de pronto).
5. Classes semânticas em PT, aria-hidden nos SVGs decorativos, `aria-label`
   na fauna quando for ilustrativa.
6. Botão CTA "Conhecer as frentes" que rola para a primeira seção de
   conteúdo — âncora real, não decoração.

**Testes**. O padrão do repo é lógica pura em `lib/` com teste ao lado.
As funções que o hero usa e que merecem teste (ex.: cálculo de camada por
`pointer`, lista de módulos por tema) moram em
`apps/web/lib/hero-narrativo.ts` + `hero-narrativo.test.ts`. O componente
em si não tem teste unitário; é validado pelos critérios objetivos abaixo.

## Roadmap em fases

| Fase | Entregável | Tempo | Depende de |
|---|---|---|---|
| 0 | `npm i gsap` em `apps/web`; baseline de testes (npm test + tsc) antes de mexer | 0,5 dia | nada |
| 1 | `HeroNarrative` portado e vivo na home, com reduced-motion, tokens e sem foto na dobra; home segue listando frentes e cidades | 1–2 dias | Fase 0 |
| 2 | Variação temática por zona/município (paleta por bioma; ex.: tema Paraopeba com onda) via tokens | 1–2 dias | Fase 1 validada |
| 3 | Fauna expandida (arara, capivara, lobo-guará) + fotos CC0 de biomas abaixo da dobra em `next/image` | 1–2 dias | Fase 1 |
| 4 | (Opcional) som ambiente com botão de ligar, desligado por padrão, sem autoplay | 0,5–1 dia | Fase 3 |

Cada fase é commitável sozinha. A Fase 1 é o coração do plano: sem ela,
nada do resto justifica tocar no portal.

## Critérios objetivos de validação

### Comportamento

| Critério | Meta | Como medir |
|---|---|---|
| Scroll ↔ animação | Sincronia sem "pulo" (`scrub: true`) | Rolar devagar e observar; timeline no DevTools |
| Parallax de mouse | 4 camadas com velocidade visivelmente diferente (ratio ≥ 1,5x entre adjacentes) | Inspecionar `transform` com o mouse parado em pontos distintos |
| Retorno suave | Ao sair do container, camadas voltam com easing (0,4s+) | Observação visual |
| Mobile | Sem parallax de mouse; conteúdo ainda revela no scroll | Emulador de celular no DevTools |
| Home intacta | Frentes, cidades, busca e rodapé continuam acessíveis abaixo do hero | Contagem de links/âncoras antes e depois |

### Acessibilidade

| Critério | Meta | Como medir |
|---|---|---|
| `prefers-reduced-motion` | Nenhuma animação roda; tudo visível | Ativar no SO/DevTools e conferir estado final |
| Tema alto contraste | Sem glow, sem padrão decorativo; texto 7:1 | Trocar tema e medir (regra do AGENTS: injetar `transition: none` antes de medir) |
| Teclado | Hero não cria armadilha de foco; CTA é um link/âncora focável | Navegar com Tab |
| Contraste | Texto ≥ 4,5:1 nos temas claro e escuro | Medir com o validador de contraste usado no repo |
| Leitor de tela | SVG decorativo com `aria-hidden`; título é `<h1>` real | Passar leitor de tela / inspecionar ARIA |

### Qualidade

| Critério | Meta |
|---|---|
| `npm test` | Verde (suíte inteira, incluindo a nova `hero-narrativo.test.ts`) |
| `npx tsc --noEmit` | Verde |
| LCP da home | Não piora além do aceitável (primeira dobra sem foto bitmap) |
| Documentação | `python scripts/validar-documentacao.py` verde; fase entregue move o plano para `historico/entregas/` |

## Riscos e mitigações

| Risco | Mitigação |
|---|---|
| Motion vira enjoo ou atrapalha leitura sob estresse | `prefers-reduced-motion` obrigatório; sem `pin` na home; parallax só em `(hover: hover) and (pointer: fine)` |
| Hero atrasa LCP da home | Primeira dobra sem bitmap; `next/dynamic`; SVGs inline |
| Paleta neon quebra contraste | Neon só decorativo; texto sempre com token medido; alto contraste limpa tudo |
| Bundle cresce sem necessidade | `gsap` entra só na home via dynamic; resto das rotas não importa o hero |
| Home "vira vitrine" e esconde dado | Checklist de home intacta; hero é seção, não overlay; CTA rola para o conteúdo |
| SVG decorativo polui leitor de tela | `aria-hidden` + fauna com `aria-label` descritivo quando ilustrativa |
| Fotos CC0 com licença errada | Só Wikimedia Commons CC0/CC BY-SA com atribuição anotada; registrar origem ao lado do asset (padrão do repo) |

## Checklist de entrega

Para considerar **"atingido o objetivo"**:

- [ ] Fase 0: `gsap` instalado, testes verdes antes de qualquer mudança
- [ ] HeroNarrative na home com título, subtítulo, CTA e módulos SVG
- [ ] Scroll-driven timeline sincronizada com o scroll da seção
- [ ] Mouse parallax em 4 camadas no desktop; desligado em mobile
- [ ] `prefers-reduced-motion` respeitado: sem animação, tudo visível
- [ ] Alto contraste: sem glow nem padrão decorativo, texto legível
- [ ] Home continua listando frentes e cidades abaixo do hero
- [ ] SVG decorativo com `aria-hidden`; CTA é âncora real
- [ ] `npm test` e `npx tsc --noEmit` verdes
- [ ] Documentação validada e plano movido para `historico/entregas/`

## Decisões registradas

- **GSAP liberado** — dono, 2026-09-03: o teto de 3 MiB gzip não vigora
  mais; novo estágio usa Cloudflare Tunnel. `gsap` entra em `apps/web`.
- **Primeira dobra sem bitmap** — o portal atende leitor sob estresse; a
  primeira dobra usa gradiente + SVG inline para não pesar o LCP.
- **Paleta Bulcão/neon vira acento decorativo** — os três temas existentes
  continuam donos do contraste; neon nunca é canal único de informação.
- **Hero é seção da home, não overlay** — conteúdo atual permanece intacto
  abaixo, com um clique a menos de distância do que hoje.
- **resposta.md e resposta (1).md são cópias idênticas** — usar uma só como
  referência; a outra é redundância de download.

## Origem / Histórico

Este plano absorve e sintetiza cinco arquivos criados por outra sessão de
IA em 2026-09-03, ainda presentes em `C:\Users\Home\Downloads`:

- `resposta.md` e `resposta (1).md` — plano de identidade visual (cópias idênticas);
- `resposta (2).md` — especificação técnica e resumo para continuação;
- `resposta (3).md` — assets brasileiros CC0 e `HeroNarrative.tsx`;
- `App.js` — protótipo funcional (React + GSAP via CDN).

Os originais não entram no repositório: ficam no Downloads como fonte. Na
Fase 1, o código portado para `apps/web/app/components/HeroNarrative.tsx`
substitui o `App.js` como referência de implementação.
