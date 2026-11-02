# Hierarquia de ação — o que é botão, o que é link

> **Tipo:** GUIA
> **Domínio:** front-end, design system, acessibilidade
> **Última medição:** 2026-11-02
> **Leitura estimada:** curta (5–15 min)
> **Relacionados:** [REGRAS-DURAS.md](REGRAS-DURAS.md), [CONFORMIDADE-MOBILE.md](CONFORMIDADE-MOBILE.md), [AGENTS.md](/AGENTS.md)
> **Palavras-chave:** botao, link, hierarquia, affordance, foco, contraste, celular

## Sumário

- [O problema](#1-o-problema)
- [A regra](#2-a-regra)
- [As três formas](#3-as-três-formas)
- [Checklist](#4-checklist)
- [Como corrigir](#5-como-corrigir)

## 1. O problema

O leitor não deve precisar clicar para descobrir se algo clica. Página cívica
é lida sob estresse: se o cartão parece botão e não é, a pessoa perde o clique
e a confiança. Se o botão parece texto, ela não acha a ação.

## 2. A regra

**A forma segue o efeito.**

| Se o clique… | Elemento | Forma |
|---|---|---|
| leva a outra página | `<a>` / `<Link>` | sublinhado no texto corrido; cartão inteiro quando é card |
| troca o conteúdo da mesma página (recorte, aba) | `<a>` com `href` | pílula com borda e fundo — **é link**, mas parece botão |
| muda estado sem navegar (menu, sanfona, tema) | `<button>` | pílula com borda, estado ativo visível |
| não faz nada | `<div>` | **sem** borda de ação, sem sombra, sem cursor de dedo |

Duas proibições:

1. **Link sem destino visível**: `<a href="#">` ou `onclick` em `<div>`.
2. **Card clicável inteiro** com botão dentro — o clique vira loteria.

## 3. As três formas

- **Ação primária** — uma por tela: fundo `--cp-primary`, texto branco,
  `min-h-11` no celular.
- **Ação secundária** — borda `--cp-border`, fundo `--cp-surface`. É o que a
  faixa de facetas usa (`PainelFacetas`).
- **Texto acionável** — sublinhado, sem fundo. Link dentro de parágrafo.

Estado ativo: fundo primário **e** `aria-current="page"` quando é navegação.
Foco: anel visível em todos os três (nunca `outline: none` sem substituto).

## 4. Checklist

- [ ] Todo `onClick` sem navegação está em `<button>`.
- [ ] Todo `<a>` tem `href` real (nada de `#` oco).
- [ ] Botão só de ícone tem `aria-label`.
- [ ] Alvo de toque com 44 px no celular (`min-h-11`).
- [ ] Texto do botão começa com verbo ("Abrir", "Conferir", "Ir para").
- [ ] O cartão que não clica não tem borda de ação nem sombra de botão.
- [ ] Link de texto corrido continua sublinhado — cor sozinha não basta.

## 5. Como corrigir

O componente de referência é `app/components/PainelFacetas.tsx` (pílula que é
link) e `app/components/NavegacaoSecoes.tsx` (subir, descer, anterior, próxima).
Ao revisar uma página, compare com esses dois antes de inventar estilo novo.

Achado de acessibilidade que exija decisão de produto vai para
[CONFORMIDADE-MOBILE.md](CONFORMIDADE-MOBILE.md#o-que-só-olho-humano-vê), não
para uma correção silenciosa.
