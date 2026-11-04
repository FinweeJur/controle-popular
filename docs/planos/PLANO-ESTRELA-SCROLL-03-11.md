# Plano — Linha do tempo com "estrela que desce no scroll"

> **Tipo:** PLANO DE INTERFACE  
> **Domínio:** produto  
> **Última medição:** 03/11/2026  
> **Leitura estimada:** curta (2-5 min)  
> **Relacionados:** [REGRAS-DURAS.md](../03-desenvolvimento/REGRAS-DURAS.md), [ESTADO.md](../02-estado/ESTADO.md), [PLANO-PLATAFORMA-RIO-DOCE.md](../historico/planos/PLANO-PLATAFORMA-RIO-DOCE.md)  
> **Palavras-chave:** linha do tempo, estrela, scroll, memoria, paraopeba, europa, congresso, acessibilidade, movimento reduzido

## Sumário

- [O que é](#o-que-é)
- [Mapa das linhas do tempo medidas em 03/11/2026](#mapa-das-linhas-do-tempo-medidas-em-03112026)
- [Decisões](#decisões)
- [Critérios de aceite](#critérios-de-aceite)

## O que é

Reimplementação própria do efeito "scroll-star" (Lightswind — registry deles
responde 401, não há código público). Uma estrela pequena percorre a trilha
vertical da linha do tempo **conforme o scroll da página**, sem dependência
nova, sem `setState` por quadro, sem `position: fixed`.

**Revisão do dono (03/11/2026), depois do primeiro corte:** a estrela não
persegue o scroll de forma solta — fica **certinha no evento relacionado**:
o item que está sob a âncora de 55% da janela, **centralizada
verticalmente** nele, descendo **de evento em evento** com passo controlado
(transição de 240 ms `ease-out`, um salto por item). Antes da seção, presa
no primeiro evento; depois dela, presa no último. O eixo horizontal continua
o traço da linha (mover a estrela para a direita soltaria ela do trilho).

Componentes novos (em `apps/web/app/components/`):

| Arquivo | Papel |
|---|---|
| `ScrollStar.tsx` + `ScrollStar.css` | ilha cliente: trilha da estrela sobre o eixo da linha. Pai precisa ser `position: relative` |
| `LinhaDoTempo.tsx` + `LinhaDoTempo.css` | linha do tempo genérica: `itens: { marco; titulo; texto; href? }[]` — o `href` opcional linkia o título à página da frente (dono, 03/11/2026); `<ol>` com grade `5.5rem minmax(0,1fr)` (coluna única abaixo de 640 px) |
| `lib/estrela-scroll.ts` (+ teste) | cálculo puro do progresso `(janela*0.55 − topoDaTrilha) ÷ altura`, limitado a `[0,1]` |

A estrela é a **estrela de quatro pontas do site do dono**
(`encontrolenirlivre.pages.dev`, pedido de 03/11/2026): caminho único,
`fill="currentColor"`, brilho do ponto com o `--cp-glow` do portal e a mesma
proporção de lá (svg de 0,95rem dentro do ponto de 1,5rem).
O porteiro de movimento é o `useEfeitoPermitido` dos react-bits: com
`prefers-reduced-motion` ou tema alto-contraste, nada se monta e a linha
continua legível.

## Mapa das linhas do tempo medidas em 03/11/2026

| # | Onde | Arquivo | Itens | Decisão |
|---|---|---|---|---|
| 1 | Linha do Tempo das Lutas (`/memoria`) | `app/memoria/LinhaDoTempo.tsx` | ~260 na tela (acervo de 533, filtrável) | ✅ estrela sobre o eixo dos `<ol>` por século |
| 2 | Reparação de Brumadinho (`/paraopeba/linha-do-tempo`) | `app/paraopeba/linha-do-tempo/LinhaDoTempo.tsx` | 23 marcos | ✅ estrela sobre o conector (eixo 8 px) |
| 3 | Litígios transnacionais (`/europa/litigios-transnacionais`, seção 6) | `app/europa/litigios-transnacionais/components/LinhaDoTempo.tsx` | 25 | ✅ ilha cliente sobre o trilho existente |
| 4 | História do município (`/[municipio]/historico`) | `app/[municipio]/historico/page.tsx` | variável, 4 camadas | ✅ mesma ilha |
| 5 | Desenvolvimento do portal (`/historico`) | `app/historico/page.tsx` | 33 — reescrita 03/11: frentes e conteúdos por mês (07–11/2026), no máximo 3 itens de casa em linguagem de leigo, todo marco linkado à página que inaugurou | ✅ vira o componente genérico `LinhaDoTempo` |
| 6 | Tramitação no Congresso (`/congresso/proposicoes/[id]`) | `app/components/LinhaDoTempoTramitacao.tsx` | dinâmico, 15+ | ✅ prop opt-in `estrela`, ligada só na página da proposição |

Onde **não** entra, e por quê (medido, não opinião):

| Onde | Motivo de ficar de fora |
|---|---|
| `/riodoce` | não existe linha do tempo ainda — "Linha do tempo do caso" é a Fase 4 do plano da plataforma, texto `EM_CONSTRUCAO` na home do hub. Quando nascer, usa o componente genérico. Fatos com fonte não se inventam aqui |
| `/paraopeba/auxilio` | é tabela mês a mês de repasses, não timeline; os marcos do auxílio já correm na linha #2 |
| `/empresas/[slug]` §6 | 2–3 fatos sintéticos dentro de um card curto: trilho de ~300 px não percorre nada, a estrela viraria ruído |
| `/paraopeba/vale` | 5 marcos estáticos numa página hoje sem JS próprio; mesmo problema de trilho curto |

## Decisões

- **Sem dependência nova.** `package.json` intacto; o único import externo é o
  `lucide-react` que já é dependência.
- **Cores só por token** (`--cp-border`, `--cp-primary`, `--cp-text-soft`);
  CSS puro junto ao componente, como os react-bits fazem.
- **Um `requestAnimationFrame` por quadro**, nunca um por evento de scroll;
  posição escrita direto no DOM (`style.top`), zero re-render por quadro.
- **Deslocamento da estrela em `rem`** (meio ponto = `0.75rem`) em vez de
  `12px`: o portal tem controle de tamanho de fonte na casca, e `px` solto
  descentralizaria a estrela quando o leitor aumenta a fonte.
- **Mobile é a régua**: trilha e itens sem largura fixa; em 390 px a linha
  genérica vira coluna única; nada toca a casca persistente.
- **Teclado e leitor de tela não encontram a estrela** (`aria-hidden`,
  `pointer-events: none`); os itens seguem em `<ol>`.
- Worktree `estrela-scroll`, porta própria 3050 (registrada em
  `.claude/launch.json`).

## Critérios de aceite

1. A estrela desce pela trilha **de evento em evento** conforme o scroll e
   para presa no último item.
2. Em cada parada, o centro do ponto bate com o centro vertical do item sob
   a âncora de 55%; ao subir, volta com o mesmo passo (240 ms `ease-out`),
   sem saltar itens nem tremer na borda.
3. Fora da seção, fica presa nas pontas e não migra para outra área.
4. Em 390 px: coluna única, estrela no eixo do trilho, sem rolagem lateral
   (`document.documentElement.scrollWidth === clientWidth`).
5. `prefers-reduced-motion: reduce` ou tema alto-contraste: nada se move nem
   aparece.
6. `<ol>` lê todos os itens em ordem; a estrela é invisível ao leitor de tela.
7. Desmontar (troca de rota) remove `scroll`/`resize` e cancela o rAF.
