# Revisão de qualidade — jurisprudência

> **Tipo:** REVISÃO
> **Domínio:** produto e dados
> **Última medição:** 2026-11-10
> **Leitura estimada:** curta (5–7 min)
> **Relacionados:** [ESTADO.md](ESTADO.md), [PADRAO-LEITURA-JORNAL.md](../03-desenvolvimento/PADRAO-LEITURA-JORNAL.md), [QUALIDADES-DA-INFORMACAO.md](../04-arquitetura/QUALIDADES-DA-INFORMACAO.md), [REGRA-EDITORIAL.md](../01-produto/REGRA-EDITORIAL.md)
> **Palavras-chave:** jurisprudência, TJMG, fonte oficial, link, ementa, qualidade da informação, revisão

## Sumário

- [O que foi medido](#o-que-foi-medido)
- [O que a tela mostrava](#o-que-a-tela-mostrava)
- [O que foi corrigido](#o-que-foi-corrigido)
- [O que continua em aberto](#o-que-continua-em-aberto)
- [Checklist de qualidade](#checklist-de-qualidade)

## O que foi medido

- **23.569** casos no acervo de jurisprudência.
- **15.180** têm link externo (`http`/`https`).
- TJMG: **13.023** casos; **7.824** com link oficial `www5.tjmg.jus.br`; **5.199** sem link.
- TJES: **2.492** casos com `link`; parte aponta para a rota interna
  `/api/inteiro-teor`, que serve o texto do portal, não o site do tribunal.
- O acórdão do Tema 1.280 (REsp 2124701/MG) foi incluído como PDF oficial de
  2 páginas em `public/docs/jurisprudencia/`.

[medido — `data/jurisprudencia-casos.json`, 10/11/2026]

## O que a tela mostrava

1. O número do processo só virava link quando `caso.link` era externo. Nos
   5.199 casos TJMG sem link, o número era texto morto.
2. A sanfona da ementa não trazia nenhuma linha de fonte. Quem abria o texto
   não tinha como conferir a decisão no tribunal.
3. O diálogo antigo `EmentaDialog` ficou sem uso quando a leitura virou
   sanfona; ele também não tinha fonte.
4. O buscador estático (`/jurisprudencia/index.html`) tem o campo `l` com
   links oficiais para parte dos casos, mas a lista principal não o consulta.

[medido — `LinhaCaso.tsx`, `EmentaDialog.tsx`, `public/jurisprudencia/dados-*.js`]

## O que foi corrigido

- Novo `lib/jurisprudencia-fonte.ts` separa **link do acórdão** de **busca
  oficial**:
  - link externo → “Conferir no TJMG/TJES”;
  - sem link, mas com página oficial → “Buscar no TJMG/TJES”, com aviso de
    que o número não vai na URL;
  - sem link e sem busca cadastrada → “fonte oficial não informada”.
- `LinhaCaso` mostra a linha “Fonte:” na sanfona da ementa e no cartão do
  celular; o número do processo só linka quando o destino é o acórdão.
- `/jurisprudencia` ganhou o bloco do **Tema 1.280/STJ**, com a tese literal,
  o que a decisão resolve, o que não resolve e a sanfona “Abrir PDF” do
  acórdão oficial.
- Post no blog explica a decisão, com link para o PDF e para a página de
  jurisprudência.
- O resumo de `/jurisprudencia` foi repaginado em hierarquia de jornal:
  cartões de destaque, H2 com fio, parágrafos curtos, tabela e citações.
- O sumário lateral (`MiniSumarioLateral`) foi ligado à página e às seções,
  com `scroll-mt-24`.

[medido — código e páginas em 10/11/2026]

## O que continua em aberto

- **Backfill dos 5.199 casos TJMG sem link.** A busca oficial resolve a
  conferência manual, mas não é o link do acórdão. O buscador estático tem
  **4.473 registros com `l`**: **4.017 links únicos** (3.985 TJMG, 32 TJES) e
  **456 ambíguos** (mesmo processo, mais de um acórdão). Aproveitar esse campo
  exige confirmar o acórdão, não só o processo.
- **Links `/api/inteiro-teor`.** O texto do portal é útil, mas não é fonte
  oficial. A linha “Fonte:” agora oferece a busca do tribunal; o ideal é
  guardar também a URL oficial.
- **Resumos de mérito.** Parte do acervo tem resumo gerado; a revisão humana
  declarada no rodapé ainda não cobre todos os casos.
- **Ementa inteira.** O teto de 12.000 caracteres marca corte com `[…]`; quem
  precisa do texto completo usa o link do tribunal.

## Checklist de qualidade

- [x] Todo número da página tem fonte e data.
- [x] Link do acórdão não é confundido com busca oficial.
- [x] Caso sem link diz a lacuna em vez de inventar URL.
- [x] Ementa aberta mostra “Fonte:” para conferir na origem.
- [x] PDF do Tema 1.280 é o documento oficial, não resumo.
- [x] Blog e página de jurisprudência citam o mesmo processo e a mesma tese.
- [ ] Backfill dos 5.199 casos TJMG sem link.
- [ ] Revisão humana dos resumos de mérito pendentes.
