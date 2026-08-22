# ComunicaBR — coleta de Minas Gerais

> Medido em 15/08/2026 contra `comunicabr.presidencia.gov.br`, sem
> autenticação. Item **N4** de `docs/PLANO-2026-08-15.md`, que traz o mapa da
> API e a nota de correção dos dois erros de medição que quase enterraram esta
> fonte.

## O que foi coletado

| Medida | Valor |
|---|---:|
| Municípios de MG com resposta | **853** (todos) |
| Municípios sem nenhum valor | **0** |
| Itens de indicador | **174.012** |
| **Itens com valor** | **67.566** |
| Itens vazios | 106.446 |
| Ministérios citados como fonte | **21** |
| Duração da coleta | **632 s** (~10,5 min) |

Arquivo: `apps/web/data/comunicabr-31.json`, 2,26 MB.

## O formato do arquivo é compactado, e isso tem motivo

Os 853 municípios respondem com a **mesma estrutura** — as mesmas categorias,
os mesmos subindicadores, os mesmos rótulos. Gravar isso 853 vezes produziria
dezenas de MB de repetição, e o portal tem teto de 3 MiB gzip no Worker.

Então o arquivo guarda:

- `rotulos` — **366** strings únicas (títulos, fontes, referências), internadas;
- `esqueletos` — **1** só, porque a estrutura não variou entre municípios;
- `municipios` — cada um referenciando o esqueleto e os rótulos por índice.

⚠️ **Consequência para quem for ler o arquivo:** percorrer `municipios[].itens`
direto **não acha nada** — os itens não estão lá em forma expandida. Use
`expandirArquivo()` de `apps/web/lib/comunicabr/arquivo.ts`. Uma travessia
ingênua sobre o JSON devolve zero itens e parece que a coleta falhou; foi o que
aconteceu na primeira conferência.

## As lacunas — e o que "vazio" quer dizer, exatamente

> ⚠️ **Duas correções feitas em 15/08/2026, ao ligar o dado na tela**
> (`/dados/comunicabr`), as duas medidas sobre o arquivo INTEIRO:
>
> 1. **O percentual estava invertido.** 106.446 de 174.012 é **61%** vazio —
>    39% é a fatia COM valor. A tela calcula a razão em vez de repetir a frase
>    daqui, e foi o cálculo que apontou a troca.
> 2. **Das quatro categorias abaixo, só UMA é lacuna da fonte em Minas.**
>    Contadas nas 853 cidades (`municipiosComCategoriaZerada`, em
>    `lib/comunicabr/arquivo.ts`): `governo-digital` vem zerada em **853/853**;
>    `desenvolvimento-produtivo` em 7/853, `minha-casa-minha-vida` em 163/853 e
>    `mulheres` em **nenhuma** — os valores dela estão nos `sub_items[]`, o
>    nível que a amostra de 5 municípios abaixo não desceu. É a mesma armadilha
>    3 de `indicadores.ts`, de novo: contar lacuna sem descer inventa lacuna.
>    (Duas categorias que a amostra não flagrou zeram em 727/853:
>    `meio-ambiente` e `infraestrutura`.)
>
> O parágrafo abaixo fica como está, porque a medição AO VIVO que ele descreve
> continua verdadeira e é ela que prova a segunda leitura — a do zero que não é
> zero. O que mudou é o alcance da primeira.

**61% dos itens vieram vazios** (106.446 de 174.012). Mas "vazio" aqui esconde
**duas coisas diferentes**, e a distinção foi medida contra a API ao vivo em
15/08/2026, em 5 municípios (Betim, São Paulo, Belo Horizonte, Contagem e
Uberlândia), todos com 132 itens:

| Município | Com valor | `valorBruto: 0` sem `valor` | Sem nada |
|---|---:|---:|---:|
| Betim | 60 | 34 | **38** |
| São Paulo | 67 | 27 | **38** |
| Belo Horizonte | 67 | 27 | **38** |
| Contagem | 60 | 34 | **38** |
| Uberlândia | 64 | 30 | **38** |

Duas leituras saem daí:

**1. Os 38 "sem nada" são idênticos nos cinco.** Não é lacuna da cidade — é
lacuna da FONTE: o ComunicaBR publica a estrutura da categoria e não publica
valor municipal nenhum para ela. Quatro categorias vêm **zeradas nos cinco
municípios**: `mulheres` (0 de 100 itens), `desenvolvimento-produtivo` (0 de
30), `minha-casa-minha-vida` (0 de 15) e `governo-digital` (0 de 10).

**2. O `valorBruto: 0` sem `valor` NÃO é uma medida de zero** — e é a parte que
varia por cidade (27 a 34). Testado: em **660 itens dos 5 municípios, nenhum
único item exibe zero** (nenhum tem `valor` preenchido com `valorBruto: 0`), e
nenhum tem `valor` sem `valorBruto`. Ou seja, a fonte **nunca mostra um zero**;
aquele `0` é preenchimento padrão de campo não publicado.

Por isso `parDeValor()` anula o `valorBruto` quando não há `valor`. Republicar
aqueles zeros diria **"R$ 0,00 repassado"** onde o governo disse "não se
aplica" — e num portal de transparência essa troca é grave: afirmaria que uma
cidade não recebeu nada quando o que houve foi ausência de publicação.

⚠️ **Consequência**: o arquivo coletado não distingue as duas espécies de vazio
(o `valorBruto` já entra anulado). Para medir a divisão é preciso consultar a
API ao vivo, como foi feito acima. Se a distinção virar necessária na tela, o
coletor precisa guardar uma marca do estado bruto.

As cinco categorias com mais buracos no total de MG:

| Categoria | Itens vazios |
|---|---:|
| educação | 27.394 |
| mulheres | 26.952 |
| desenvolvimento produtivo | 12.310 |
| saúde | 9.998 |
| governo digital | 5.971 |

E três vieram **sem nenhum vazio**: igualdade racial, balança comercial e
segurança pública.

**Isto precisa ir para a tela.** Publicar só os 67.566 itens que têm valor faria
a cobertura parecer completa — quem olhasse "educação" em uma cidade não saberia
se o programa não existe ali ou se o dado não foi publicado. `medirCoberturaUF()`
existe para a página poder dizer o número.

## Ressalva de conteúdo, que vai junto com o dado

O ComunicaBR é **comunicação de governo sobre a própria atuação**. O campo
`fonte` de cada item traz o ministério que declarou o número (são 21: MS, MEC,
MDS, MMA, MINC, MCID, MTUR, MAPA, MDA, MF, MTE, MGI, MCTI, MME, MPS, MDIC, MM,
MEMP, CC, GAIA e Ministério da Fazenda) — **cite-o**. Não apresente como
execução orçamentária auditada: para isso o portal já tem o Portal da
Transparência, e o cruzamento entre os dois é justamente o que dá valor a este
acervo.

## Como refazer

```bash
npx tsx scripts/coletar-comunicabr.mts --uf 31
```

O coletor tem retomada, pausa entre requisições e User-Agent identificando o
projeto. As três armadilhas da API estão tratadas nele e explicadas no §N4 do
plano — resumidas aqui porque as três respondem **HTTP 200**:

1. **Código IBGE de 6 dígitos**, não 7. Com 7, a API devolve 200 com o esqueleto
   vazio e `nome_ibge: null`. O coletor **valida `nome_ibge`**, não o status.
2. O valor está em `indicador.subIndicadores[].items[].valor`, não em
   `indicador.<chave>.descricao`.
3. `&categoria=` e `&categorias=` são aceitos e **ignorados**; o filtro real é
   `&tema=`.

## O que falta

- ~~**Ligar na tela**, com o número de itens vazios visível por município.~~
  Feito em 15/08/2026: `/dados/comunicabr` (índice de Minas, com a lacuna por
  tema e a contagem de cidades zeradas) e `/dados/comunicabr/<código IBGE de 6
  dígitos>` (ficha da cidade, item a item, com os vazios no meio da lista e o
  ministério ao lado de cada bloco). Página própria, fora de `app/[municipio]`,
  pelos três motivos escritos no topo de `app/dados/comunicabr/page.tsx` — o
  principal é que o eixo Cidades cobre as cidades que estão no Postgres e o
  acervo cobre as 853.
- **As outras 26 UFs** — a coleta é por UF (`--uf`), e MG levou 10,5 min.
- **Cruzar com o Portal da Transparência**, que é o que transforma "o governo
  diz que investiu" em "e a execução mostra isto".
