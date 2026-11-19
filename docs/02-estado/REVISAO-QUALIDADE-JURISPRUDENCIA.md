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
- **Ementa recortada deixou de se passar por inteira.** O helper
  `lib/jurisprudencia-ementa.ts` reconhece os três cortes (reticências,
  ~500 da fonte, 12.000 do gerador). Na tela, o rótulo vira “Trecho da
  ementa”, com o número de caracteres e o link para o acórdão ou para a
  busca oficial.
- **84 ementas recuperadas do TJMG.** O coletor
  `scripts/completar-ementas-tjmg.mts` baixou o PDF oficial dos 86 casos com
  link; 84 foram extraídos, com ganho médio de +1.277 caracteres. A camada
  `lib/jurisprudencia-acervo.ts` aplica o texto maior na leitura e sobrevive
  à rotina que regrava o acervo.
- **“Polo vencedor” no lugar de “Polo”.** A coluna, o filtro e o gráfico
  dizem quem ganhou a decisão, e o valor nomeia o papel: “Empresa (ré)”,
  “Atingido (autor)”, “MP (acusação)”, “Réu (defesa)”. O cartão do celular
  explica em uma frase quem recorreu e quem venceu.

[medido — código e páginas em 10/11/2026]

## O que continua em aberto

- **Ementa truncada na origem: 4.971 casos.** O TJMG entrega a ementa
  recortada em ~500 caracteres (4.305 com 500 exatos, 665 com 499) e 1 caso
  do TJES com 2.000. Medido em 10/11/2026.
- **Só 86 desses truncados têm link do acórdão** — 85 do TJMG e 1 do TJES.
  Desses, **84 foram recuperados** e estão em
  `data/ementas-completas.json`; a camada `lib/jurisprudencia-acervo.ts`
  aplica o texto maior na leitura, então a recuperação sobrevive à rotina que
  regrava o acervo.
- **2 casos recuperáveis ficaram de fora, com motivo:** o do TJES precisa de
  revisão manual (o inteiro teor local não tem marcador de ementa) e o
  processo `5005872-55.2017.8.13` tem, na origem, o preâmbulo da Constituição
  colado no lugar da ementa.
- **Os outros 4.885 truncados não têm link e não têm busca anônima.** O
  `pesquisaPalavrasEspelhoAcordao.do` e o `consultaSimples.do` exigem código
  de sessão (HTTP 401). Recuperar exige sessão autenticada — fora das regras —
  ou recoletar a jurisprudência na origem com a paginação que gera os
  parâmetros `numero/sequencial`. Decisão do dono.
- **Truncatura silenciosa é rara:** das 3.971 ementas curtas (< 700) sem
  reticências, só **1** corta no meio de palavra (`0004746-71.2020.8.13`,
  termina em “CIDAD”). As outras 3.970 são curtas de verdade, citação
  numérica de súmula, `***` da fonte ou artefato de extração.
- **Links `/api/inteiro-teor`.** O texto do portal é útil, mas não é fonte
  oficial. A linha “Fonte:” agora oferece a busca do tribunal; o ideal é
  guardar também a URL oficial.
- **Resumos de mérito.** Parte do acervo tem resumo gerado; a revisão humana
  declarada no rodapé ainda não cobre todos os casos.
- **Polo do acervo é o vencedor, não o ativo.** Medido: 2.644 casos
  “empresa · negado” têm `recorrente = atingido`; a empresa venceu porque o
  recurso do atingido foi negado. A tela passou a dizer “Polo vencedor” e a
  nomear o papel de cada lado — “Empresa (ré)”, “Atingido (autor)”,
  “MP (acusação)”, “Réu (defesa)”.

## Checklist de qualidade

- [x] Todo número da página tem fonte e data.
- [x] Link do acórdão não é confundido com busca oficial.
- [x] Caso sem link diz a lacuna em vez de inventar URL.
- [x] Ementa aberta mostra “Fonte:” para conferir na origem.
- [x] Ementa recortada aparece como “Trecho da ementa”, com tamanho e link.
- [x] As 84 ementas recuperáveis do TJMG estão inteiras no ar.
- [x] “Polo vencedor” diz quem ganhou, não quem processou.
- [x] PDF do Tema 1.280 é o documento oficial, não resumo.
- [x] Blog e página de jurisprudência citam o mesmo processo e a mesma tese.
- [ ] Recoletar os 4.885 truncados sem link, com paginação de sessão.
- [ ] Revisão humana dos resumos de mérito pendentes.
