# Unificação por eixo — o que juntar, o que preservar, o que falta

> **Tipo:** PLANO
> **Domínio:** arquitetura da informação
> **Última medição:** 2026-11-08
> **Leitura estimada:** media (8-12 min)
> **Relacionados:** [PROPOSTA-UNIFICACAO-DIREITOS-TERRITORIOS.md](PROPOSTA-UNIFICACAO-DIREITOS-TERRITORIOS.md), [PRODUTO.md](../01-produto/PRODUTO.md)
> **Palavras-chave:** eixos, frentes, mapa de navegação, duplicata, lacuna, Brasil de Fato

## Sumário

- [Como a divisão foi feita](#como-a-divisão-foi-feita)
- [Os 14 eixos](#os-14-eixos)
- [O que unificar em cada eixo](#o-que-unificar-em-cada-eixo)
- [Lacunas declaradas](#lacunas-declaradas)
- [O que NÃO se mexe](#o-que-não-se-mexe)
- [Como manter](#como-manter)

## Como a divisão foi feita

Os eixos seguem a lógica de editoria que o leitor já reconhece de veículo de
movimento popular — inspiração no Brasil de Fato: **Direitos, Meio ambiente,
Movimentos, Terra, Trabalho, Saúde, Educação, Cidades, Política, Economia,
Justiça, Internacional**. O portal acrescenta dois que são a razão de existir
dele: **Casos** (os desastres) e **Dados**.

A diferença em relação à proposta anterior: antes o eixo era o *produto* do
portal (barragens, atores, transparência); agora o eixo é o *assunto que o
leitor procura*. Barragens virou frente de Meio ambiente; Atores virou frente de
Justiça e Economia; Transparência virou Dados.

O mapa vive em `apps/web/lib/navegacao/mapa.ts`: 9 eixos, 34 frentes,
`caminhoDe()` para a trilha e `paginasDoEixo()` para a contagem.

## Os 9 eixos

| Eixo | Frentes | Rotas | Estado da porta |
|---|---|---:|---|
| Casos | Brumadinho, Rio Doce, Itatiaiuçu | 21 | proposta |
| Direitos | Em movimento, Memória, Saúde, Educação, Trabalho, Globais, Comparados | 26 | proposta |
| Meio ambiente | **Territórios e mapa**, Função social, Barragens, Licenciamento, Fiscalização, Conflitos, Clima | 27 | no ar (`/ambiental`) |
| Cidades | Índice, Município | 2 (+68 municipais) | no ar |
| Política | Congresso, Assembleias, Governo, Eleições | 15 | no ar |
| Economia | Empresas, Contas públicas | 13 | no ar |
| Justiça | Tribunais, Jurisprudência, Instituições, Presídios | 16 | no ar |
| Internacional | Europa, América do Norte, América Latina | 8 | no ar |
| Dados | Dados abertos, Meus dados | 3 | no ar |

## O que unificar em cada eixo

### Casos — a maior duplicação

- **Duplica**: `/paraopeba/vale` e `/empresas/vale` falam da mesma empresa;
  `/paraopeba/noticias` e `/paraopeba/clipping` e `/paraopeba/noticias-vale` são
  três recortes do mesmo fluxo.
- **Juntar**: uma página geral `/casos` que responde "o que aconteceu" nos três
  casos, com número e data de corte.
- **Preservar**: todas as 18 de `/paraopeba` e as 3 de `/riodoce`, como botões.

### Direitos — três portas para o mesmo assunto

- **Duplica**: `saude-publica` (em movimento) e `ambiental/direitos-humanos`;
  `direitos-globais/america-latina` e `america-latina`.
- **Juntar**: `/direitos` geral com os eixos (saúde, moradia, água, trabalho,
  educação, segurança, informação) e a contagem de acórdãos por direito.
- **Preservar**: as 23 rotas de direitos, como frentes.

### Terra entrou em Meio ambiente, com o mapa na frente

Território é a mesma pergunta que barragem: onde o risco está e quem vive ali.
Manter dois eixos separava o mapa do risco.

- **Fusão**: "Terra e território" virou as duas primeiras frentes de Meio
  ambiente — **Territórios e mapa** (com `destaque: true`) e Função social.
- **Destaque**: o mapa do território abre o eixo. A frente aponta para
  `/terra-e-territorios` e para o globo 3D (`/funcaosocialterra/mapa`).
- **Ganho**: 9 eixos, e o mapa deixa de ser um canto do portal.
- **Preservar**: as 5 rotas de terra, intactas.

### Meio ambiente — já é um eixo, falta a porta de barragens

- **Duplica**: `ambiental/barragens` e `ambiental/barragens-globais` e
  `mineracao/*` respondem à mesma pergunta em três lugares.
- **Juntar**: uma frente "Barragens" dentro de Meio ambiente, com a pergunta
  "a barragem perto de mim é segura?" na primeira dobra.
- **Preservar**: as 48 rotas de `/ambiental`.

### Por que Movimentos deixou de ser eixo

MAB aparecia em `/memoria` (verbetes) e em `/direitos-em-movimento` (serviços):
dois nomes para a mesma história. Memória das lutas é **direito em movimento**,
não assunto paralelo.

- **Fusão**: `/memoria` vira frente de Direitos, ao lado de "Direitos em
  movimento".
- **Ganho**: 10 eixos. "Direitos" passa a cobrir o que se conquista, o que se
  perde e quem luta — num lugar só.
- **Preservar**: `/memoria` inteira, com busca, filtros e CSV.

### Por que Trabalho, Saúde e Educação deixaram de ser eixos

Decisão de 08/11/2026: eram três eixos de uma frente só, e cada um abria uma
porta para uma página que já vivia em Direitos. O portal ficava com 14 eixos —
demais para o leitor escolher.

- **Fusão**: viraram **frentes de Direitos** (Saúde, Educação, Trabalho), com o
  mesmo endereço canônico (`/direitos-em-movimento/saude-publica` etc.).
- **Ganho**: 11 eixos, e "Direitos" passa a ser a resposta para "tenho direito a
  quê?", com seis frentes (em movimento, saúde, educação, trabalho, globais,
  comparados).
- **Custo**: nenhum dado muda; só o índice e a trilha.
- **Regra mantida**: cross-listing é permitido; página duplicada não.

### Cidades — o maior volume, nenhuma duplicação

- 68 páginas de município + 28 de estado. Não fundir: são o mesmo conteúdo por
  recorte. Só padronizar a trilha.

### Política — Congresso e Assembleias

- **Duplica**: `/congresso/parlamentares` e `/assembleias/[uf]` apresentam
  parlamentar por casa.
- **Juntar**: `/politica` com as duas frentes e um índice único de parlamentar.
- **Preservar**: as 22 do Congresso e as 2 de Assembleias.

### Economia — empresas e contas

- **Duplica**: `empresas/vale` e `paraopeba/vale`; `estado-e-economia/orcamento`
  e `governo/[uf]`.
- **Juntar**: `/economia` com Empresas e Contas públicas.
- **Preservar**: as 6 de empresas e as 6 de estado-e-economia.

### Justiça — tribunais, jurisprudência, instituições

- **Duplica**: `judiciario/jurisprudencia` e `/jurisprudencia`;
  `judiciario/instituicoes` e `/instituicoes`.
- **Juntar**: `/justica` com as quatro frentes; `/jurisprudencia` continua sendo
  a página do acervo (é o dado), não um índice.
- **Preservar**: as 22 do Judiciário.

### Internacional — cinco portas

- **Duplica**: `internacional`, `europa`, `eua`, `canada`, `america-latina`,
  `transparencia-internacional` e `direitos-globais`.
- **Juntar**: `/internacional` com três frentes (Europa, América do Norte,
  América Latina) e o link para direitos globais.
- **Preservar**: todas; o recorte é geográfico e tem fonte própria.

### Dados — ferramenta, não assunto

- **Juntar**: `/dados` com dados abertos e "meus dados".
- Não entra no menu principal; entra no rodapé e no índice.

## Lacunas declaradas

Duas do teste das 20 perguntas continuam sem página:

1. **"A água do rio está boa?"** — não há página de qualidade da água do
   Paraopeba. Existe dado de barragem, não de água.
2. **"Meu processo de Brumadinho está onde?"** — só o Rio Doce tem
   `/riodoce/processos`.

Lacuna declarada é informação: enquanto não houver coleta, a página geral diz
"não medimos" com a data — em vez de sumir com a pergunta.

## O que NÃO se mexe

`/jurisprudencia` (dado), `/busca`, `/temas`, `/indice`, `/grafo`, `/painel`,
`/congresso` (produto próprio), `/eleicoes` e as 68 páginas de município.

## O que já está no ar (fase 0 e 2)

- **Mapa**: `apps/web/lib/navegacao/mapa.ts` — 9 eixos, 34 frentes, `caminhoDe()`
  e `paginasDoEixo()`, com testes em `mapa.test.ts` (8 casos: trilha, prefixo
  antigo, porta do eixo, rota fora do mapa, query string, slug único, rota de
  entrada e contagem por eixo).
- **Trilha**: `CaminhoSistema` lê o mapa e desenha "Início › Eixo › Frente › Página".
  Todo nível é link; o último leva `aria-current="page"`. Está em 8 páginas:
  `/riodoce`, `/riodoce/processos`, `/paraopeba/linha-do-tempo`, `/paraopeba`,
  `/jurisprudencia`, `/congresso`, `/empresas` e `/memoria`. As trilhas escritas
  à mão nessas páginas saíram.
- **Índice expansível**: `IndiceEixos` na página `/indice`, com "Comece por aqui",
  `<details>` nativo, contagem por eixo e selo **mapa** na frente em destaque
  (Territórios, que abre o Meio ambiente).
- **Referências**: `apps/web/lib/navegacao/referencias.ts` — 10 links verificados
  do MAB e do Brasil de Fato, por eixo. Eixo sem cobertura não ganha bloco de
  enfeite.

Faltam trilha nas portas de eixo ainda propostas (`/casos` e `/direitos`) e nas
páginas de menor tráfego.

## Como manter

1. Página nova entra em `EIXOS` com eixo, frente e `rotas`.
2. Trilha vem de `caminhoDe()`; não se escreve breadcrumb à mão.
3. Índice expansível lê `EIXOS`; não tem lista paralela.
4. `paginasDoEixo()` alimenta a contagem do índice — se divergir da realidade, o
   mapa está desatualizado.

## Origem / Histórico

- **08/11/2026 — 10 → 9 eixos.** Terra vira Meio ambiente, com o mapa do
  território em destaque na abertura do eixo.
- **08/11/2026 — 11 → 10 eixos.** Movimentos vira frente de Direitos:
  memória das lutas é direito em movimento, não eixo separado.
- **08/11/2026 — 14 → 11 eixos.** Trabalho, Saúde e Educação viram frentes de
  Direitos: eram portas para páginas que já moravam lá.
- **08/11/2026 — criado.** Substitui a divisão por produto (barragens, atores,
   transparência) pela divisão por assunto que o leitor procura, inspirada na
   editoria do Brasil de Fato.
