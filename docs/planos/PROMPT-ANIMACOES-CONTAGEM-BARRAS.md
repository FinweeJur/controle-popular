# Prompt de handoff — animações de contagem e de barras

> **Tipo:** PROMPT
> **Domínio:** interface e acessibilidade
> **Última medição:** 2026-11-08
> **Leitura estimada:** curta (3-5 min)
> **Relacionados:** [UNIFICACAO-POR-EIXO.md](UNIFICACAO-POR-EIXO.md), [PADRAO-PAGINA-WIKI.md](../03-desenvolvimento/PADRAO-PAGINA-WIKI.md)
> **Palavras-chave:** handoff, animação, count up, barras, acessibilidade, reduced motion

## Sumário

- [Como usar](#como-usar)
- [Por que essas regras](#por-que-essas-regras)

## Como usar

Cole o bloco abaixo na sessão que vai executar. Ele é autossuficiente.

---

```
PAPEL

Você implementa animação de dados no portal Controle Popular (Next.js 16, App
Router, Tailwind), no repositório X:\DevCoder\OpenCode\controle-popular.

OBJETIVO

Toda página mapeada no índice por eixo deve animar, quando o bloco entra na
tela pela primeira vez:

1. números e valores — contagem de 0 até o valor em ~2 segundos;
2. barras de gráfico — crescimento de 0 até o valor no mesmo tempo.

REGRAS INEGOCIÁVEIS

- A animação roda UMA vez por visita ao bloco (não repete ao rolar de volta).
- `prefers-reduced-motion`: sem animação, mostra o número/barra final na hora.
- O número final tem de ser o valor real em pt-BR (use o formatador que a página
  já usa: `formatNumberBR`, `formatCurrencyCompactaBR` etc.). Nunca troque o
  texto por um valor aproximado.
- Sem biblioteca nova. Use `IntersectionObserver` + `requestAnimationFrame`.
- Acessibilidade: o valor acessível é o final, não o intermediário. Enquanto
  anima, `aria-hidden` no número animado e um `<span class="sr-only">` com o
  valor final; ao terminar, remover o `aria-hidden`.
- Nada de fonte abaixo de 12 px (`text-xs` é o mínimo) — o hook "Vigia de
  Tipografia" barra o commit.
- Não quebre SEO: as páginas são renderizadas no servidor; o HTML inicial deve
  trazer o número final (a animação só reescreve no cliente depois de montar).
- CodeScene: função com no máximo 4 argumentos; arquivo com no máximo ~120
  linhas de código por função/arquivo conforme o hook. Quebre em subcomponentes.

ONDE CRIAR

- `apps/web/app/components/dados/ContadorAnimado.tsx` — recebe `valor: number`,
  `formatar: (n: number) => string`, `duracaoMs?: number` (padrão 2000).
- `apps/web/app/components/dados/BarraAnimada.tsx` — recebe `fracao: number`
  (0..1) ou `valor`/`maximo`, e desenha a barra com `transform: scaleX/scaleY`
  ou `width` animada.
- Um hook compartilhado `useEntrouNaTela(ref)` com `IntersectionObserver`
  (`threshold: 0.25`, `once`), em
  `apps/web/app/components/dados/useEntrouNaTela.ts`.

ONDE APLICAR (nesta ordem, um commit por bloco)

1. `app/direitos-em-movimento/servicos/ConteudoSaude.tsx` — cartões de
   `INDICADORES` e o gráfico de leitos.
2. `ConteudoEducacao.tsx` e `ConteudoTrabalho.tsx` — mesmos cartões e séries.
3. `app/jurisprudencia/partes.tsx` (`Cartoes`, `PainelRecorte`) — números do
   painel e barras dos gráficos.
4. `app/ambiental/barragens/page.tsx` e `app/paraopeba/execucao/page.tsx`.
5. `app/congresso/page.tsx` e `app/[municipio]/page.tsx` (indicadores).
6. `app/components/IndiceEixos.tsx` — as contagens `paginasDoEixo` e o número de
   frentes por eixo.

CUIDADOS POR PÁGINA

- Se o número vem de `const` no servidor, o componente animado é client e recebe
  o valor por prop (não recalcule no cliente).
- Gráfico SVG com barras: anime `height`/`y` via atributo no `requestAnimationFrame`
  ou `transform` no `<rect>`; não recrie o SVG por quadro.
- Tabela com muitos números: anime só os destaques (cartões), não cada célula.

VERIFICAÇÃO OBRIGATÓRIA

- `npx tsc --noEmit` (em apps/web)
- `npx eslint <arquivos alterados>`
- `npx vitest run lib/navegacao`
- Teste manual: com reduced-motion ligado, os valores aparecem finais; com
  movimento normal, a contagem dura ~2 s e não repete.
- Inspecionar o HTML inicial (view-source) e confirmar que o número final está lá.

ENTREGA

- Lista de arquivos e páginas alteradas.
- Printou? Descreva o comportamento em cada página.
- O que ficou fora e por quê.
- NÃO faça deploy. Commit por bloco, mensagem em arquivo (`git commit -F`), e
  push só quando o conjunto estiver validado.
```

---

## Por que essas regras

- **Uma vez por visita**: contagem que reinicia a cada rolagem irrita e mente
  sobre o dado.
- **HTML inicial com o valor final**: o robô de busca e o leitor sem JS precisam
  do número; animação é enfeite, não fonte.
- **Acessível é o valor final**: leitor de tela não deve ouvir "1.203… 1.204…".
- **Sem biblioteca**: o portal já tem peso de dados; animação de 2 s não justifica
  dependência nova.
