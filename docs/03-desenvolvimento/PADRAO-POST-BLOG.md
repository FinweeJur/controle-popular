# Padrão de post de serviço no blog

> **Tipo:** DESENVOLVIMENTO
> **Domínio:** blog (`/noticias`)
> **Última medição:** 2026-11-17
> **Leitura estimada:** média (5–15 min)
> **Relacionados:** [PADRAO-PAGINA-WIKI.md](PADRAO-PAGINA-WIKI.md), [QUALIDADES-DA-INFORMACAO.md](../04-arquitetura/QUALIDADES-DA-INFORMACAO.md), [REGRA-EDITORIAL.md](../01-produto/REGRA-EDITORIAL.md), [AGENTS.md](/AGENTS.md)
> **Palavras-chave:** blog, post de serviço, slug, countup, gráfico de barras, tabela interativa, filtro, ordenação, olho, essencial, mobile

## Sumário

- [Quando se aplica](#quando-se-aplica)
- [Slug](#slug)
- [Estrutura do post](#estrutura-do-post)
- [Números que animam](#números-que-animam)
- [Gráfico de barras](#gráfico-de-barras)
- [Tabelas](#tabelas)
- [Fontes e data](#fontes-e-data)
- [Mobile](#mobile)
- [Verificação](#verificação)
- [Anti-padrões](#anti-padrões)
- [Onde mora cada peça](#onde-mora-cada-peça)

## Quando se aplica

Post de **serviço** responde a uma pergunta prática: tem vaga, quanto paga,
qual o prazo, como se inscreve. Edital, concurso, PSS, benefício e programa
público entram aqui.

Análise longa, investigação e relatório técnico continuam no padrão editorial
comum: este documento acrescenta a camada de leitura rápida e a tabela
interativa, não substitui a apuração.

## Slug

O endereço é do leitor, não do sistema.

- Bom: `uemg-abre-83-vagas-para-professor`.
- Ruim: `uemg-pss-2027-ituiutaba-diamantina-83-vagas` (código de edital, ano e
  duas cidades no mesmo nome).
- Sem ano no slug, salvo quando o ano distingue dois certames do mesmo órgão.
- Renomear depois de publicar exige **301 + ponte**: entrada em
  [`lib/redirects/rotas-antigas.ts`](/apps/web/lib/redirects/rotas-antigas.ts)
  e `page.tsx` com `PaginaPonte`, no mesmo commit. Link compartilhado não se
  apaga.

## Estrutura do post

Ordem dos blocos, com o componente pronto:

1. **Chips** de categoria e subfrente.
2. **H1** com `text-3xl sm:text-4xl lg:text-[2.9rem]`.
3. **Subtítulo** com `text-lg sm:text-xl`.
4. **Lead** (primeiro parágrafo) **fora** do `<article>` do `prose`, em
   `text-xl sm:text-2xl`. O leitor apressado lê só ele.
5. **“O essencial”** (`essencial`, 3 a 5 linhas) em `ResumoEssencial`.
6. **Corpo** de 10 a 12 parágrafos para serviço. Frase curta, até 13 palavras.
7. **Olho** (`olho`) em `OlhoArtigo`:
   - citação de edital ou decisão: aspas e fonte colada;
   - frase de efeito com número: `citacao: false`, corpo maior e cor primária.
     Ex.: “73 vagas em Ituiutaba. 10 em Diamantina. 83 no total.”
8. **Tabelas** (`tabelas`) e **gráfico** (`grafico`).
9. **Fontes** e **recomendação para verificar**.

O título visível de cada bloco fica no `<h3>` do componente; o `<caption>`
sr-only existe para o leitor de tela.

## Números que animam

- Use `ContadorAnimado` (ou `MetricaValor`, que lê o texto do JSON) para
  inteiro, decimal, percentual e moeda.
- **Não** anime faixa, aproximação ou texto composto: “19 a 26/11”,
  “~160 mil pessoas” e “6 de 7” ficam estáticos. Animar pedaço de frase dá ao
  número um peso que o dado não tem.
- O componente entrega o valor final no HTML e respeita
  `prefers-reduced-motion`.
- Em tabela, o contador `aria-live` informa quantas linhas sobraram e a soma da
  coluna “Vagas”.

## Gráfico de barras

O campo `grafico` aceita `titulo`, `itens` (`rotulo` + `valor` numérico), `nota`
e `fonte`. O desenho é `GraficoBarrasArtigo`:

- `BarraAnimada` cresce uma vez ao entrar na tela;
- o **percentual fica dentro da barra** e o valor exato ao lado — o padrão de
  02/11/2026;
- o percentual é a fração da **maior** barra; diga isso na nota;
- `fonte` é obrigatória quando há número de ato oficial;
- não repita em tabela os mesmos seis números que o gráfico já mostra. Tabela
  serve para conferir composição e divergência; gráfico, para comparar.

## Tabelas

`tabelas` é uma lista; `tabela` (campo antigo) continua aceito. Regras:

- **Uma tabela por assunto.** Se o leitor precisa cruzar local, área, vagas e
  salário, faça uma tabela unificada em vez de três.
- **Valor uniforme não vira coluna.** “Titulação mínima: especialização”
  repetida em 39 linhas é ruído; vai na nota da tabela. Salário que depende de
  titulação e jornada também vai na nota, com a faixa.
- **Corte coluna que não cabe.** No celular, a tabela precisa caber em 390 px
  ou rolar **dentro do quadro**. A coluna PCD saiu da tabela de vagas porque a
  reserva já está nos cartões e no texto.
- **Interação é padrão:** `TabelaInterativa` entrega busca sem acento, filtro
  por categoria (coluna de texto com 2 a 8 valores únicos), ordenação por
  clique com `aria-sort`, seta visível, contador de linhas e soma de vagas.
  “direito” acha “Direito” e “Ciências Sociais / Direito”.
- Coluna numérica ordena por número, não por texto: “10” não vem antes de “8”.
- Célula aceita link markdown via `TextoComLinks`; link interno continua em
  `next/link`.
- SSR entrega a tabela inteira; sem JavaScript o leitor vê os dados, só não
  filtra.

## Fontes e data

- Cada edital tem **PDF canônico** no bloco de fontes e link no corpo.
- O corpo diz **quando os PDFs foram consultados** (qualidade 8).
- Divergência da fonte é **reportada, não corrigida em silêncio**. Exemplo:
  as parcelas de doutor em 20 h somam R$ 3.917,22 e o total impresso é
  R$ 3.947,22; a nota registra e manda confirmar com o órgão.
- A recomendação para verificar aponta os itens do edital (1.1, 1.2, 13.1) e o
  e-mail oficial.

## Mobile

- `<main>` com `w-full` (regra 5.14). Sem isso, conteúdo largo estica a página.
- Controles da tabela empilham no celular; a tabela rola dentro do quadro.
- Medição: `document.documentElement.scrollWidth === window.innerWidth`.
- Fonte de interface nunca abaixo de 12 px (regra 5.16).

## Verificação

```bash
npx tsc --noEmit
npx vitest run lib/noticias lib/redirects/rotas-antigas.test.ts
npx eslint "app/noticias/[slug]" lib/noticias
npm run auditar:mobile
```

O vigia **`scripts/vigia-post-servico.mts`** roda no pre-commit e em
`lib/noticias/padrao-post.test.ts`: ele exige countup nos cartões, barras com
legenda dentro, tabela interativa com `aria-sort`/`aria-live`, essencial, olho
e slug legível. É a catraca que impede a remoção silenciosa da camada.

No navegador, além do 390 px:

- buscar “direito” e conferir contador e soma;
- ordenar “Vagas” nas duas direções;
- selecionar a faceta de localização;
- conferir que o olho e o gráfico aparecem no HTML (SSR).

## Anti-padrões

- slug técnico com ano, código de edital e duas cidades;
- h1 no mesmo tamanho do corpo;
- 18 parágrafos para responder o que cabe em 12;
- contar “19 a 26/11” como número;
- gráfico sem fonte ou com percentual sem dizer a base;
- tabela de 7 colunas no celular;
- repetir valor uniforme em todas as linhas;
- tabela sem `<caption>`, sem `aria-sort` ou sem contador de filtro;
- renomear slug sem 301 e sem ponte.

## Onde mora cada peça

| Peça | Arquivo |
|---|---|
| Dados do post | `apps/web/data/noticias-portal.json` |
| Tipo do post | `apps/web/lib/noticias/portal.ts` |
| Página | `apps/web/app/noticias/[slug]/page.tsx` |
| Lead, olho e resumo | `SecaoMetricas.tsx`, `ResumoEssencial.tsx`, `OlhoArtigo.tsx` |
| Contador | `app/components/dados/ContadorAnimado.tsx` + `MetricaValor.tsx` |
| Gráfico | `GraficoBarrasArtigo.tsx` + `app/components/dados/BarraAnimada.tsx` |
| Tabela interativa | `TabelaInterativa.tsx` + `lib/noticias/tabela.ts` |
| Lógica de filtro/ordem | `lib/tabela/ordenavel.ts` |
| Links no texto | `TextoComLinks.tsx` |
| Redirecionamento | `lib/redirects/rotas-antigas.ts` + `app/components/PaginaPonte.tsx` |
