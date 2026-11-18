# Design System — Controle Popular

> **Tipo:** ARQUITETURA
> **Domínio:** global
> **Última medição:** 2026-11-18
> **Leitura estimada:** média (5–8 min)
> **Relacionados:** [PADRAO-VISUAL.md](PADRAO-VISUAL.md), [REGRAS-DURAS.md](../03-desenvolvimento/REGRAS-DURAS.md), [ARQUITETURA.md](ARQUITETURA.md), [modelo da sanfona](../design-system/sanfona.modelo.html)
> **Palavras-chave:** design system, componente, sanfona, accordion, details, summary, animação, pulse, hover, acessibilidade, reduced motion, tokens

## Sumário

- [Para que serve](#para-que-serve)
- [Princípios que valem para todo componente](#princípios-que-valem-para-todo-componente)
- [Sanfona que se anuncia (regra 5.21)](#sanfona-que-se-anuncia-regra-521)
- [Onde o componente mora](#onde-o-componente-mora)
- [Repositório público](#repositório-público)
- [Como usar no portal](#como-usar-no-portal)
- [Como levar para outro site](#como-levar-para-outro-site)
- [Checklist de componente novo](#checklist-de-componente-novo)
- [Migração pendente](#migração-pendente)
- [Origem / Histórico](#origem--histórico)

## Para que serve

Este documento é a **fonte única do vocabulário visual** do portal. Se um
componente novo precisa de animação, de estado de hover ou de uma seta, ele
segue o que está aqui — não inventa. O padrão existe por um motivo medido: na
auditoria do Paraopeba (18/11/2026) os blocos de tema eram `<summary>` só com
texto, e o leitor não sabia que havia conteúdo dentro.

Regra prática: **componente que parece botão tem de se comportar como botão** —
alvo de clique, hover, foco, estado visível e, quando abre, sinal de que abriu.

## Princípios que valem para todo componente

| Princípio | O que significa na prática |
|---|---|
| **Nativo antes de JavaScript** | `<details>`/`<summary>`, `<select>`, `<dialog>` resolvem com teclado, leitor de tela e sem hidratação. Só troque por React quando o nativo não der conta. |
| **Movimento é escolha** | Toda animação decorativa para em `prefers-reduced-motion: reduce`. Pulso, giro e transição nunca são o único sinal de estado. |
| **Estado sempre visível** | Fechado, aberto, hover, foco e carregando têm aparência própria. Cor nunca é o único indicador. |
| **Alvo de toque ≥ 36 px** | O celular é a régua (regra 5.14). Ícone pequeno ganha área de toque no contêiner. |
| **Texto de interface ≥ 12 px** | Regra 5.16. Para encurtar card, reduza padding/leading, nunca a fonte. |
| **Tokens, não cor solta** | Use `var(--cp-primary)`, `var(--cp-surface)`, `var(--cp-border)`. A cor muda com o tema; hex fixo quebra o contrato. |
| **Um lugar para o CSS** | Efeito compartilhado mora em `app/globals.css` (classe `cp-*`), não copiado em cada componente. |

## Sanfona que se anuncia (regra 5.21)

**Regra do dono, 18/11/2026.** Todo bloco expansível que esconde conteúdo
precisa **anunciar que é expansível**. A referência é
`app/components/sistema/SanfonaTema.tsx`.

### Anatomia

```
┌───────────────────────────────────────────────────────────────┐
│  Título do bloco                            ABRIR      ( ▼ )  │  ← summary = alvo do clique
├───────────────────────────────────────────────────────────────┤
│  conteúdo revelado (só quando aberto)                         │
└───────────────────────────────────────────────────────────────┘
```

1. **Linha inteira clicável** — `<summary>` ocupa toda a largura, com
   `cursor-pointer` e `list-style: none` (sem o triângulo do sistema).
2. **Seta num selo redondo** — seta para baixo, gira 180° ao abrir.
3. **Pulso no selo** — anel suave enquanto fechado; para ao abrir e em
   `prefers-reduced-motion`.
4. **Microtexto “Abrir/Fechar”** — no desktop. No celular a seta basta.
5. **Hover e foco** — fundo `surface-2` no hover; anel de foco visível no
   teclado (`focus-visible`), porque o alvo real é o `summary`.

### Estados

| Estado | Como se vê |
|---|---|
| Fechado | borda neutra, selo com anel pulsando, “ABRIR” |
| Hover | borda com tom do acento, fundo levemente mais claro |
| Foco (teclado) | anel de foco no `summary`, sem depender do mouse |
| Aberto | borda de acento, seta girada, “FECHAR”, corpo com divisória |

### Acessibilidade

- O `<details>` nativo já expõe “expandido/recolhido” ao leitor de tela.
- Os textos “Abrir/Fechar” são `aria-hidden` (redundantes com o estado nativo).
- A arte da seta é `aria-hidden`; o título carrega o conteúdo.
- Nada depende de hover para abrir: toque, teclado (Enter/Espaço) e leitor de
  tela funcionam igual.

## Onde o componente mora

| Peça | Caminho |
|---|---|
| Componente React (portal) | `apps/web/app/components/sistema/SanfonaTema.tsx` |
| CSS do selo e do pulso | `apps/web/app/globals.css` (bloco “SANFONA QUE SE ANUNCIA”, classe `.cp-sanfona-seta`) |
| Modelo para outros sites | [`docs/design-system/sanfona.modelo.html`](../design-system/sanfona.modelo.html) |

O arquivo `.html` do modelo é autossuficiente: abre no navegador, não tem
build, não tem JavaScript e não depende de nada do portal.

## Repositório público

O mesmo material vive num repositório paralelo, aberto para outros sites:
**<https://github.com/FinweeJur/controle-popular-design>** (galeria em
<https://finweejur.github.io/controle-popular-design/>). Lá estão os 8 temas
extraídos de `globals.css`, a sanfona portável, o select com respiro e as oito
qualidades da informação.

Regra de sincronia: mudou tema, componente ou regra aqui? Atualize o repo
público na mesma tarefa — os dois são a mesma promessa.

## Como usar no portal

```tsx
import SanfonaTema from "@/app/components/sistema/SanfonaTema";

<SanfonaTema titulo="Flora e vegetação">
  <p>Conteúdo revelado ao abrir.</p>
</SanfonaTema>
```

Variante para disclosures pequenos dentro de ficha (sem caixa, com a mesma
seta e o mesmo giro):

```tsx
<SanfonaTema variante="linha" titulo={`Relacionados (${total})`}>
  <ul>…</ul>
</SanfonaTema>
```

Regras de conteúdo:

- título curto, frase de leitura direta; nada de frase inteira no `summary`;
- não aninhar sanfona dentro de sanfona — se precisar, o conteúdo quer página
  própria;
- conteúdo começa em `<p>`/`<ul>`, sem repetir o título;
- `className` só para espaçamento externo (ex.: `mt-3`).

## Como levar para outro site

1. Abra `docs/design-system/sanfona.modelo.html` e copie o bloco `<style>`.
2. Troque os valores de `:root` (`--sf-*`) pelos tokens do site novo.
3. Copie a marcação `<details class="sanfona">…</details>`.
4. Confira os três testes de mesa: teclado (Tab + Enter), celular (390 px) e
   `prefers-reduced-motion` ligado no sistema.

O componente React do portal é a versão “com Tailwind”; o modelo HTML é a
versão “portável”. Mudou um? Atualize o outro na mesma tarefa.

## Checklist de componente novo

- [ ] Existe equivalente nativo? (detalhes, select, dialog, input)
- [ ] Alvo de toque ≥ 36 px e texto ≥ 12 px
- [ ] Hover **e** foco visíveis, com `focus-visible`
- [ ] Animação para em `prefers-reduced-motion`
- [ ] Cores por token (`--cp-*`), nunca hex solto
- [ ] CSS compartilhado em `globals.css` com prefixo `cp-`
- [ ] Medido no celular a 390 px, sem rolagem lateral
- [ ] Documentado neste arquivo antes de replicar pelo site

## Migração pendente

A sanfona padrão começou pela auditoria do Paraopeba. As demais páginas com
`<details>` simples seguem a fila abaixo — migrar **quando a página for
editada**, sem lote gigante:

1. `/paraopeba/vale`, `/paraopeba/entenda`, `/paraopeba/execucao`
2. `/ambiental/barragens`, `/ambiental/copam`, `/ambiental/licenciamento`,
   `/ambiental/estudos`, `/ambiental/nossos`
3. `/editais` (painel) e `/noticias/[slug]` (transcrição)
4. Componentes de ficha (`PainelDialogo`, `ResumoRealidade`, `IndiceEixos`)

## Origem / Histórico

- **18/11/2026 — nasce o design system.** A sanfona da auditoria ganhou seta,
  hover, pulso, microtexto e foco; o padrão virou componente
  (`SanfonaTema`), modelo portável (`docs/design-system/sanfona.modelo.html`)
  e regra 5.21. Medição: `/paraopeba/auditoria`, selo de 31 px, anel pulsando,
  seta girando 180° ao abrir.
