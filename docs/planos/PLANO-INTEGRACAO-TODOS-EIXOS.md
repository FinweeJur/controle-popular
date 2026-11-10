# Plano — integração de todos os eixos e subfrentes

> **Tipo:** PLANO
> **Domínio:** produto, dados e arquitetura da informação
> **Última medição:** 2026-11-09
> **Leitura estimada:** média (12–18 min)
> **Relacionados:** [PRODUTO.md](../01-produto/PRODUTO.md), [ARQUITETURA.md](../04-arquitetura/ARQUITETURA.md), [PLANO-TEMAS-GERAIS-E-TESES.md](PLANO-TEMAS-GERAIS-E-TESES.md), [PROPOSTA-CLIPPING-NOTICIAS-LINHA-DO-TEMPO.md](PROPOSTA-CLIPPING-NOTICIAS-LINHA-DO-TEMPO.md), [REGRAS-DURAS.md](../03-desenvolvimento/REGRAS-DURAS.md)
> **Palavras-chave:** eixos, subfrentes, índice, análise integrada, página longa, tabelas, gráficos, S5-free

## Sumário

- [1. O pedido](#1-o-pedido)
- [2. Diagnóstico medido](#2-diagnóstico-medido)
- [3. O que existe e o que falta](#3-o-que-existe-e-o-que-falta)
- [4. Arquitetura alvo](#4-arquitetura-alvo)
- [5. Contrato de página](#5-contrato-de-página)
- [6. Dados, texto e regras](#6-dados-texto-e-regras)
- [7. Ondas de execução](#7-ondas-de-execução)
- [8. Subagentes e escopo de arquivo](#8-subagentes-e-escopo-de-arquivo)
- [9. Riscos](#9-riscos)
- [10. Decisões do dono](#10-decisões-do-dono)
- [11. Ordem imediata](#11-ordem-imediata)

## 1. O pedido

O dono quer que **todos os eixos e subfrentes mapeados no índice** deixem de ser
uma lista de nomes e passem a ser uma leitura longa, com informação das páginas
relacionadas: tabelas, gráficos, textos, seções, cards e botões. O leitor deve
achar o assunto descendo o feed, sem voltar ao índice a cada clique.

O pedido nasceu no Rio Doce, mas **não é só do Rio Doce**. Vale para os nove
eixos do mapa de navegação e para as 31 frentes que o índice lista hoje.

## 2. Diagnóstico medido

O índice usa `lib/navegacao/mapa.ts` (`EIXOS`) e o componente
`IndiceEixos`. A medição de 09/11/2026:

| Eixo | Frentes | Páginas mapeadas |
|---|---:|---:|
| Casos | 3 | 21 |
| Direitos | 7 | 21 |
| Meio ambiente | 7 | 28 |
| Cidades | 2 | 2 |
| Política | 4 | 15 |
| Economia | 2 | 13 |
| Justiça | 4 | 16 |
| Internacional | 3 | 8 |
| Dados | 2 | 3 |
| **Total** | **31** | **127** |

[medido — `lib/navegacao/mapa.ts`, 09/11/2026]

As 31 frentes, com a rota principal e o número de rotas que o mapa conhece:

| Eixo | Frente | Rota principal | Rotas |
|---|---|---|---:|
| Casos | Brumadinho | `/paraopeba` | 18 |
| Casos | Rio Doce | `/riodoce` | 3 |
| Casos | Itatiaiuçu | `/jurisprudencia?frente=itatiaiaucu` | 0 |
| Direitos | Direitos em movimento | `/direitos-em-movimento` | 5 |
| Direitos | Saúde | `/direitos-em-movimento/saude-publica` | 1 |
| Direitos | Educação | `/direitos-em-movimento/educacao` | 1 |
| Direitos | Trabalho e renda | `/direitos-em-movimento/trabalho-e-renda` | 2 |
| Direitos | Memória das lutas | `/memoria` | 1 |
| Direitos | Direitos globais | `/direitos-globais` | 9 |
| Direitos | Direitos comparados | `/direitos-comparados` | 2 |
| Meio ambiente | Territórios e mapa | `/terra-e-territorios` | 5 |
| Meio ambiente | Função social | `/funcaosocialterra` | 1 |
| Meio ambiente | Barragens | `/ambiental/barragens` | 7 |
| Meio ambiente | Licenciamento | `/ambiental/licenciamento` | 5 |
| Meio ambiente | Fiscalização | `/ambiental/autuacoes` | 4 |
| Meio ambiente | Conflitos | `/ambiental/conflitos-globais` | 3 |
| Meio ambiente | Clima e risco | `/ambiental/clima-risco` | 3 |
| Cidades | Cidades | `/cidades` | 1 |
| Cidades | Página do município | `/cidades` | 1 |
| Política | Congresso | `/congresso` | 9 |
| Política | Assembleias estaduais | `/assembleias` | 2 |
| Política | Governo | `/governo` | 3 |
| Política | Eleições | `/eleicoes` | 1 |
| Economia | Empresas | `/empresas` | 8 |
| Economia | Contas públicas | `/estado-e-economia` | 5 |
| Justiça | Tribunais e varas | `/judiciario/tribunais` | 7 |
| Justiça | Jurisprudência | `/jurisprudencia` | 3 |
| Justiça | Instituições | `/instituicoes` | 3 |
| Justiça | Presídios e números | `/judiciario/numeros` | 3 |
| Internacional | Europa | `/europa` | 3 |
| Internacional | América do Norte | `/eua` | 3 |
| Internacional | América Latina | `/america-latina` | 2 |
| Dados | Dados abertos | `/dados` | 2 |
| Dados | Meus dados | `/meus-dados` | 1 |

[medido — `lib/navegacao/mapa.ts`, 09/11/2026]

### 2.1 Dois catálogos, dois vocabulários

Além do mapa de 9 eixos, existe o catálogo editorial de **4 eixos e 31
subfrentes** (`lib/eixos/catalogo.ts`: direitos, terra, estado, central). Ele
alimenta `/central`, `/estado-e-economia`, `/terra-e-territorios`, `/sobre` e
os componentes de ficha. O mapa de 9 eixos alimenta o `/indice`.

Os dois não são o mesmo recorte. "Meio ambiente" no mapa reúne barragens,
licenciamento, fiscalização, conflitos e clima; no catálogo editorial, parte
disso cai em "terra" e parte em "central". O plano **não apaga** nenhum dos
dois: o mapa de 9 é a navegação; o catálogo de 4 é a camada editorial.

[medido — `lib/eixos/catalogo.ts` e `lib/navegacao/mapa.ts`]

### 2.2 O que o índice entrega hoje

O `/indice` lista os 9 eixos em `<details>`, cada um com as frentes e a
contagem de páginas. É navegação, não leitura: não há número, tabela, gráfico
ou análise por eixo. A página tem 343 KB de HTML e nenhuma seção de dado.

[medido — `/indice`, 09/11/2026]

## 3. O que existe e o que falta

O que já existe e pode ser reaproveitado:

- **Resumo de realidade** por rota (`data/resumos-realidade`): 58 resumos
  verificados; 3 inconclusivos fora do ar.
- **Análise integrada** em `/paraopeba/analise` e `/ambiental/rio-doce/analise`.
- **Jurimetria** com 22 temas e 79 teses, agregados por caso.
- **Biblioteca** com 794 itens em `/biblioteca` e 788 em `/paraopeba/biblioteca`.
- **Cliping, notícias e MAB** com 254 + 108 + 975 itens.
- **Linha do tempo** de Brumadinho (23 marcos) e, em construção, a do Rio Doce.
- **Gráficos** de barras em `/paraopeba/analise`, `/ambiental/mariana`,
  `/paraopeba/execucao` e no globo 3D.

O que falta, por eixo:

| Eixo | Página longa | Tabelas/gráficos | Análise | Resumo por frente |
|---|---|---|---|---|
| Casos | parcial (Brumadinho e Rio Doce) | sim | sim | parcial |
| Direitos | não | não | não | parcial |
| Meio ambiente | não | parcial | parcial | parcial |
| Cidades | não | sim (por município) | não | não |
| Política | não | parcial | não | parcial |
| Economia | não | parcial | não | parcial |
| Justiça | não | parcial | parcial | parcial |
| Internacional | não | não | não | não |
| Dados | não | não | não | não |

[inferido a partir das rotas e dos dados medidos; a W0 confirma item a item]

## 4. Arquitetura alvo

### 4.1 Uma página por eixo

Nova rota `/eixos/<slug>` para cada um dos 9 eixos. Cada página é longa e
contém:

1. **Hero** com o nome do eixo, uma frase de propósito e a contagem de frentes.
2. **O eixo em números** — 4 a 8 cards com contagem medida (páginas, registros,
   fontes, período).
3. **Frentes** — um card por frente, com o que a página responde e um botão.
4. **Tabela comparativa** das frentes (dado, período, fonte, atualização).
5. **Gráfico** de barras do que é comparável (registros por frente, por ano ou
   por tema), sempre com N visível.
6. **Análise do eixo** — 3 a 6 parágrafos escritos no S5-free max, com marca
   `[medido]`/`[inferido]` e fonte por afirmação.
7. **Últimas análises e notícias** do eixo (3 a 6 cartões).
8. **Mapa das frentes** — botões para todas as rotas.

### 4.2 O índice como feed

O `/indice` passa a ter, abaixo dos cards de eixo, um **feed por eixo**: cada
seção mostra os números do eixo, 3 cartões de frente, uma tabela curta e um
botão "Abrir o eixo". O leitor acha o assunto descendo, sem abrir 9 páginas.

### 4.3 Contrato das frentes

Toda página de frente que ainda não tem recebe, nesta ordem:

- `ResumoRealidadeBox` (se houver resumo verificado);
- bloco "Em números" com 3 a 6 contagens medidas;
- uma tabela com fonte por linha;
- um gráfico de barras quando houver série comparável;
- "O que esta página responde" e "O que ela não responde";
- mapa de subfrentes do eixo.

## 5. Contrato de página

Componentes a criar/reutilizar, todos server-side:

| Componente | Papel |
|---|---|
| `SecaoEixo` | hero + números + frentes + análise |
| `CartaoFrente` | card de frente com rota, descrição e N |
| `NumerosFrente` | grade de cards de contagem |
| `TabelaFonte` | tabela com coluna de fonte e link |
| `Barras` | barras horizontais com N dentro (já existe) |
| `MapaFrentes` | grade de botões do eixo |
| `ResumoEixo` | markdown do S5-free, com marcas e fontes |

Nada de coleção grande como prop de cliente (regra 5.1). Tabela longa pagina
no servidor; gráfico recebe só o agregado.

## 6. Dados, texto e regras

- **Números**: só de contagem medida. Cada seção declara a fonte e a data.
  Onde não houver, escrever "não medido" — nunca estimar.
- **Texto**: S5-free com raciocínio no máximo (`maritacaai/S5-free#high`),
  custo zero. Um parágrafo por seção, no máximo seis por eixo.
- **Modelo não escreve número**: a prosa recebe a tabela pronta e só interpreta.
- **Fonte visível**: link oficial ou marcador `dados da página` / `tabela medida`.
- **Sem duplicar acervo**: cada eixo linka a página que já tem o dado; não
  copia a lista inteira.
- **Celular**: 390 px, sem rolagem lateral falsa; tabela com `overflow-x-auto`.
- **Custo**: zero. Nenhum lote pago sem autorização.

## 7. Ondas de execução

| Onda | Entregável | Critério de aceite |
|---|---|---|
| **W0 — contrato** | `lib/eixos/paginas.ts` com os 9 eixos e as 31 frentes; componentes `SecaoEixo`, `CartaoFrente`, `NumerosFrente`, `TabelaFonte`, `MapaFrentes`; teste da lista fechada | `tsc` verde; teste falha se uma frente do mapa ficar sem página |
| **W1 — 9 páginas de eixo** | `/eixos/casos`, `/eixos/direitos`, `/eixos/meio-ambiente`, `/eixos/cidades`, `/eixos/politica`, `/eixos/economia`, `/eixos/justica`, `/eixos/internacional`, `/eixos/dados` | cada página com hero, >= 4 cards, >= 1 tabela, >= 1 gráfico, >= 1 análise S5-free, mapa de frentes; 390 px; `tsc` |
| **W2 — frentes prioritárias** | enriquecer 12 frentes: Casos (Brumadinho, Rio Doce), Meio ambiente (barragens, licenciamento, fiscalização), Justiça (jurisprudência, tribunais), Política (congresso), Economia (empresas), Direitos (saúde, educação), Cidades | cada frente com resumo, números, tabela, gráfico quando houver série, "o que responde" e fonte |
| **W3 — índice feed** | `/indice` com seção por eixo: números, 3 cartões, tabela curta e botão | feed completo sem quebrar o índice atual; navegação por teclado |
| **W4 — demais frentes** | as 19 frentes restantes com o mesmo contrato | nenhuma frente do mapa sem página enriquecida |

Ordem: W0 → W1 → W2 → W3 → W4. W1 pode começar por **Casos** e **Meio
ambiente**, que já têm dado e análise.

## 8. Subagentes e escopo de arquivo

Para não haver conflito, cada subagente escreve só na sua pasta:

| Subagente | Arquivos | Entrega |
|---|---|---|
| **A — contrato e componentes** | `apps/web/lib/eixos/paginas.ts`, `apps/web/app/components/eixos/*` | W0 |
| **B — eixos 1 a 3** | `apps/web/app/eixos/casos/*`, `.../direitos/*`, `.../meio-ambiente/*` | W1 (Casos, Direitos, Meio ambiente) |
| **C — eixos 4 a 6** | `apps/web/app/eixos/cidades/*`, `.../politica/*`, `.../economia/*` | W1 (Cidades, Política, Economia) |
| **D — eixos 7 a 9** | `apps/web/app/eixos/justica/*`, `.../internacional/*`, `.../dados/*` | W1 (Justiça, Internacional, Dados) |
| **E — índice feed** | `apps/web/app/indice/page.tsx` + componente novo | W3, depois de W1 |

O hub `/indice` e o mapa de subfrentes ficam com o agente principal, para não
serem editados por dois subagentes ao mesmo tempo.

## 9. Riscos

| Risco | Mitigação |
|---|---|
| Duplicar o que a frente já mostra | eixo linka; não copia lista |
| Número de modelo | prosa recebe tabela pronta; número só de contagem |
| Página longa demais | paginação no servidor e seções com âncora |
| Divergência entre 4 eixos editoriais e 9 de navegação | mapa de 9 é navegação; catálogo de 4 é camada editorial; teste de paridade |
| Frente sem dado | bloco "não medido" e link para a fonte; não inventar |
| Conflito de arquivo entre subagentes | escopo por pasta, definido acima |
| Deploy no meio | só depois de `tsc` e revisão; deploy é manual |

## 10. Decisões do dono

1. **Rota dos eixos**: `/eixos/<slug>` ou `/indice/<slug>`? Recomendação:
   `/eixos/<slug>`, para não misturar o mapa com a página de leitura.
2. **Escopo da W1**: os 9 eixos de uma vez ou começar por Casos, Meio
   ambiente, Direitos e Justiça? Recomendação: os 4 primeiros, depois os 5.
3. **Texto**: S5-free max em todos os eixos ou só nos 4 primeiros?
   Recomendação: todos; é custo zero e mantém a voz.
4. **Catálogo de 4 eixos**: manter como camada editorial ou substituir pelo
   mapa de 9? Recomendação: manter; o custo de migrar é maior que o ganho.

## 11. Ordem imediata

1. Commit e push deste plano.
2. W0: contrato e componentes.
3. W1: eixos Casos, Direitos, Meio ambiente e Justiça.
4. Rio Doce: concluir clipping, linha do tempo e análise integrada (já em
   execução por subagentes).
5. Revisão, `tsc`, deploy com ordem do dono.
