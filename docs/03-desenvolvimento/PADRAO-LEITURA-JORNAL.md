# Padrão de leitura de jornal

> **Tipo:** PADRÃO
> **Domínio:** produto e design
> **Última medição:** 2026-11-10
> **Leitura estimada:** média (8–10 min)
> **Relacionados:** [REGRAS-DURAS.md](REGRAS-DURAS.md), [PADRAO-PAGINA-WIKI.md](PADRAO-PAGINA-WIKI.md), [REGRA-EDITORIAL.md](../01-produto/REGRA-EDITORIAL.md), [QUALIDADES-DA-INFORMACAO.md](../04-arquitetura/QUALIDADES-DA-INFORMACAO.md)
> **Palavras-chave:** hierarquia visual, leitura de jornal, gráfico de barras, conforto visual, resumo de realidade, sumário lateral

## Sumário

- [Por que existe](#por-que-existe)
- [Hierarquia do texto](#hierarquia-do-texto)
- [Blocos de destaque](#blocos-de-destaque)
- [Conforto visual de números](#conforto-visual-de-números)
- [Gráficos de barras](#gráficos-de-barras)
- [Marcas de evidência](#marcas-de-evidência)
- [Sumário lateral](#sumário-lateral)
- [Checklist](#checklist)

## Por que existe

Página longa com um parágrafo gigante não é leitura: é bloco de texto. O
leitor do portal muitas vezes está sob estresse e procura um número, uma
data ou uma frase que responda. A diagramação tem de ajudar a achar — não
obrigar a decifrar.

Este padrão nasce de duas correções do dono, em 09 e 10/11/2026: o resumo de
`/jurisprudencia` tinha um parágrafo único de milhares de caracteres, e os
gráficos de barras deixavam o valor a uma tela de distância do rótulo.

## Hierarquia do texto

1. **H1** é o nome da página; não se repete no corpo.
2. **Lede**: o primeiro parágrafo depois de um H2 vem em corpo maior
   (`text-[1.08rem]`), com no máximo 4 linhas.
3. **H2** separa blocos de assunto. Tem fio superior, respiro
   (`mt-10 pt-6`) e não divide um raciocínio no meio.
4. **H3** divide um H2 em partes menores; não é enfeite.
5. **Parágrafo**: máximo de ~6 linhas no desktop. Se passar, quebre em dois
   ou transforme a lista de números em tabela.
6. **Lista** para enumeração; não use lista para texto corrido.
7. **Largura**: `max-w-[72ch]`. Texto de 100% da tela cansa a vista.
8. **Entrelinha**: `leading-[1.75]`; em título, `leading-tight`.
9. **Fonte mínima**: 12 px na interface; corpo entre 16 e 18 px.

O renderizador do portal (`app/components/ResumoRealidade.tsx`) já aplica
esses tamanhos a `Blocos`. Página nova que exibe markdown deve usar
`MarkdownResumo`, não um `<p>` cru.

## Blocos de destaque

### Cartões de número

Use o bloco `:::numeros` no markdown do resumo:

```
:::numeros
4.515 | Dano moral afastado | 83% dos 5.453 casos
3.664 | Laudo do perito do juízo | 93% dos 3.942 casos
:::
```

Cada linha vira um cartão com valor grande, rótulo e detalhe. Use 2 a 4
cartões no topo de um bloco; mais que isso vira painel.

### Citação de jornal

Linha começando com `>` vira citação de destaque: borda à esquerda, corpo
maior. Use para uma frase-síntese, nunca para um parágrafo inteiro.

```
> **2.030 de 2.391** casos de cerceamento terminaram sem instrução ampliada.
```

### Tabela

- Cabeçalho em caixa alta, 12 px.
- Linhas zebradas (`odd:bg-surface-2/40`).
- Coluna de fonte quando o dado vier de outra página.
- No celular, `overflow-x-auto` dentro do bloco, nunca rolagem da página.

## Conforto visual de números

O problema medido: em uma linha de 1.200 px, o rótulo ficava na coluna da
esquerda e o N na borda direita. O olho tinha de atravessar a tela para
ligar sujeito e valor.

Regra: **rótulo, barra e valor formam um grupo curto**.

- O grupo fica centralizado (`mx-auto`) e com largura máxima de ~48 rem.
- Rótulo com largura limitada (10–14 rem); barra com 8–12 rem; valor
  imediatamente depois da barra.
- Valor e rótulo na mesma linha de leitura; se não couber, empilhe, mas não
  jogue o valor para o canto.
- Em telas pequenas, o grupo ocupa a largura disponível e o valor fica
  abaixo ou ao lado da barra, nunca fora da tela.
- Use `font-tabular` no valor para alinhar os dígitos.

## Gráficos de barras

- A barra é apoio, não o dado. O número visível é obrigatório.
- Largura máxima do conjunto: ~40–48 rem, centralizado.
- Barra proporcional ao maior item; não invente denominador.
- Para barras com rótulo longo, limite o rótulo e ofereça `title` com o
  texto completo.
- Em gráfico de cobertura (1/3, 2/3, 3/3), o N fica dentro da barra; o
  percentual ou a fração, ao lado.
- Nunca use barra que começa no canto da tela e termina no canto oposto.

## Marcas de evidência

O JSON guarda `[medido]`, `[inferido]` e `[não dá para concluir]` para
auditoria. A tela **não** mostra essas marcas (decisão do dono, 09/11/2026):

- o renderizador remove as três, inclusive quando a marca quebra em duas
  linhas;
- parágrafo que só declara limite não é renderizado;
- se a linha tem um fato medido, o fato fica e só a marca sai.

Quem quiser conferir a marca vai ao JSON ou ao dossiê; o leitor comum vê o
texto limpo.

## Sumário lateral

Página longa usa o recurso que já existe: `MiniSumarioLateral` (ou
`CapitulosFlutuantes` no layout raiz).

- Fica fixo no canto superior direito, translúcido.
- Expande na passada do mouse e no foco pelo teclado.
- Marca a seção visível por `IntersectionObserver`.
- Só aparece depois de 350 px de rolagem e em telas `xl`.
- Cada item aponta para um `id` real; a seção tem `scroll-mt-24` para o
  salto parar abaixo da navbar.
- Não crie um segundo componente de sumário: reuse o existente.

### Setas de topo e de próxima seção

Abaixo da lista ficam **duas setas pequenas**, sempre visíveis, só com o
símbolo:

| Seta | Ação | Rótulo no hover e no foco |
|---|---|---|
| ↑ | volta ao topo e devolve o foco a `#conteudo-principal` | **Topo** |
| ↓ | vai à próxima seção; na última, encerra no fim da página | **Próxima seção** |

- O rótulo aparece à esquerda da seta, para não sair da tela.
- A seta tem 28 px e o rótulo usa `text-xs` (12 px), nunca menor.
- O movimento respeita `prefers-reduced-motion`.
- Em tela larga, esse par substitui o botão flutuante `BackToTop`, que fica
  restrito a `xl:hidden`. Dois controles de topo na mesma tela confundem.
- Vale para todo o site: o `CapitulosFlutuantes` monta o widget no layout
  raiz, então toda página com dois ou mais `h2` recebe o par.

## Checklist

- [ ] H1 único e lede de até 4 linhas.
- [ ] Nenhum parágrafo acima de ~6 linhas.
- [ ] H2 com fio e respiro; H3 só quando divide assunto.
- [ ] Números em cartões ou tabela, não escondidos no meio do texto.
- [ ] Rótulo, barra e valor no mesmo grupo curto e centralizado.
- [ ] Barra com N visível; sem valor no canto da tela.
- [ ] Marcas de evidência removidas da tela.
- [ ] Sumário lateral reutilizado, com IDs e `scroll-mt-24`.
- [ ] Celular a 390 px sem rolagem lateral.
- [ ] Fonte de cada número visível por link ou marcador de origem.
