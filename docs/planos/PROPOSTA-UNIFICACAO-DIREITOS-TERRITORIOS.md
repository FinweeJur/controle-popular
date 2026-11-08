# Proposta — unificar sem perder página nem leitor (v2, revista)

> **Tipo:** PLANO
> **Domínio:** arquitetura da informação e acessibilidade
> **Última medição:** 2026-11-08
> **Leitura estimada:** media (12-18 min)
> **Relacionados:** [PRODUTO.md](../01-produto/PRODUTO.md), [PADRAO-PAGINA-WIKI.md](../03-desenvolvimento/PADRAO-PAGINA-WIKI.md), [PLANO-JURISPRUDENCIA-ESCOPO-TOTAL.md](PLANO-JURISPRUDENCIA-ESCOPO-TOTAL.md)
> **Palavras-chave:** unificação, arquitetura da informação, acessibilidade, breadcrumb, índice, wikipedia, não perder dado

## Sumário

- [Revisão crítica da v1](#revisão-crítica-da-v1)
- [Modelo novo: geral + específica](#modelo-novo-geral--específica)
- [20 hipóteses de procura](#20-hipóteses-de-procura)
- [O caminho no sistema](#o-caminho-no-sistema)
- [Índice expansível](#índice-expansível)
- [Acessibilidade](#acessibilidade)
- [Regra de ouro contra perda de dado](#regra-de-ouro-contra-perda-de-dado)
- [Fases](#fases)
- [Decisões pendentes](#decisões-pendentes)

## Revisão crítica da v1

A proposta anterior (mesmo dia) errava em quatro pontos:

1. **308 em massa perde trabalho.** Quem já citou `/paraopeba/auxilio` num
   relatório, num processo ou numa matéria passa a cair noutra página. O
   conteúdo não muda de valor por mudar de URL. Redirect só para duplicata real.
2. **Hub vazio é pior que página específica.** Agregador que só lista links
   obriga o leitor a mais um clique para chegar ao dado. A página geral tem de
   **ter o essencial nela** e levar ao resto.
3. **O leitor não pensa em eixo.** Ele procura "quando cai o auxílio", não
   "casos > brumadinho > auxílio". A arquitetura tem de ser testada por pergunta,
   não por organograma.
4. **Preservar é mais barato que migrar.** 348 páginas, 76 no cluster: renomear
   tudo custa semanas e cria 404 em link antigo. Criar por cima custa dias e não
   quebra nada.

## Modelo novo: geral + específica

> **Nada se move. Cria-se a página geral; a específica continua onde está e
> vira botão dentro dela.**

```
GERAL (nova)                         ESPECÍFICA (existente, preservada)
/casos/brumadinho            →  botões para linha-do-tempo, auxílio, execução,
                                   documentos, clipping, perícia, quem atua,
                                   análise, auditoria, correlação, biblioteca
/casos/riodoce               →  botões para processos, índice
/casos/itatiaiaucu           →  botão para jurisprudência?frente=itatiaiaucu
/direitos                    →  botões para os 9 eixos já existentes
/barragens                   →  botões para sigbm, descaracterização, mundo
/atores/popular              →  botões para MAB, ATIs, memória
```

Cada página geral tem quatro blocos, nesta ordem:

1. **O essencial em uma tela** — o que é, o número principal, a data de corte.
2. **Números com dono** — cada número linka para a página que o calcula.
3. **Páginas desta frente** — os botões para as específicas, com uma linha
   dizendo o que há em cada uma.
4. **O caminho de volta** — breadcrumb no topo e "ver tudo em Brumadinho".

Assim o leigo resolve na geral o que é simples e acha a específica quando
precisa do detalhe — sem que ninguém perca a página que já existe.

## 20 hipóteses de procura

Teste feito como leigo, a partir da home. "Falta" é o que hoje atrapalha.

| # | Pergunta do leigo | Porta hoje | Caminho hoje | Falta |
|---:|---|---|---|---|
| 1 | "Quando cai o auxílio?" | `/paraopeba/auxilio` | home → Paraopeba → Auxílio (3) | nada; é a página certa |
| 2 | "Quanto a Vale já pagou?" | `/paraopeba/execucao` | home → Paraopeba → Execução (3) | nome "execução" não é o que ele procura |
| 3 | "O que é o acordo de 2024?" | `/paraopeba/entenda` | home → Paraopeba → Entenda (3) | "entenda" é vago; falta sinônimo "acordo" |
| 4 | "Meu processo está onde?" | `/riodoce/processos` | home → Rio Doce → Processos (3) | Brumadinho não tem página equivalente |
| 5 | "Quem decide o caso?" | `/paraopeba/quem-atua` | home → Paraopeba → Quem atua (3) | não diz o ator por classe |
| 6 | "O que é o MAB?" | `/memoria` | home → Memória (2) | MAB não tem ficha própria |
| 7 | "Sou de Mariana, tenho direito?" | `/riodoce` | home → Rio Doce (2) | hub não tem "o que fazer agora" |
| 8 | "Itatiaiuçu / Serra Azul" | `/jurisprudencia?frente=itatiaiaucu` | home → Jurisprudência → filtro (3) | não há hub; só jurisprudência |
| 9 | "A barragem perto de mim é segura?" | `/ambiental/barragens` | home → Ambiental → Barragens (3) | falta busca por município em destaque |
| 10 | "O que é nível de emergência?" | `/ambiental/barragens/sigbm` | 4 cliques | jargão sem explicação na porta |
| 11 | "A água do rio está boa?" | `/paraopeba` (?) | não há página de água | lacuna real |
| 12 | "Quem são os atingidos?" | `/paraopeba/quem-atua` | 3 cliques | não separa ATI de movimento |
| 13 | "Como denunciar?" | `/direitos-em-movimento/denuncia` | home → Direitos → Denúncia (3) | "direitos em movimento" não é termo de leigo |
| 14 | "Tenho direito à saúde?" | `/direitos-em-movimento/saude-publica` | 3 cliques | concorre com `/ambiental/direitos-humanos` |
| 15 | "O que é a ADPF 1314?" | `/paraopeba/linha-do-tempo` | 3 cliques, sem verbete | sigla sem explicação |
| 16 | "A Vale foi condenada criminalmente?" | `/jurisprudencia/penal` | 2 cliques | penal fora da página de desastres (certo), mas sem ponte |
| 17 | "O que aconteceu em Brumadinho?" | `/paraopeba/entenda` | 3 cliques | falta resumo na porta do hub |
| 18 | "Quero os documentos oficiais" | `/paraopeba/documentos` | 3 cliques | ok |
| 19 | "Notícias de hoje" | `/paraopeba/clipping` | 3 cliques | clipping, notícias e notícias-vale confundem |
| 20 | "Quem é o prefeito / o órgão X" | `/governo`, `/instituicoes` | 2 a 3 cliques | duas portas para a mesma pergunta |

Leitura do teste: **13 das 20** chegam em 3 cliques, mas **7 param em jargão**
("execução", "entenda", "clipping", "ADPF", "direitos em movimento") e **2 não
têm página** (água do rio; processo de Brumadinho). A unificação precisa
resolver jargão e lacuna, não só mover rota.

## O caminho no sistema

Componente único `CaminhoSistema`, com a trilha vinda de um mapa de navegação
(`lib/navegacao/mapa.ts`), não escrita à mão em cada página:

```
Início › Casos › Brumadinho › Linha do tempo
```

Regras:

- **todo nível é link**, menos o último, que leva `aria-current="page"`;
- `<nav aria-label="Você está em">` e `<ol>` — leitor de tela anuncia a posição;
- nível de eixo e de frente são links para as páginas **gerais** (não para
  âncoras mortas);
- página específica mostra a trilha completa: `Início › Casos › Brumadinho › Auxílio`;
- sem breadcrumb em página de formulário ou de erro.

Isso responde ao pedido: o nome do eixo, da frente e da subfrente é hiperlink
até chegar na página, e a volta é um clique em qualquer nível.

## Índice expansível

`/indice` passa a ser a árvore do portal, com `<details>/<summary>` nativo
(functiona sem JavaScript e é acessível por teclado):

```
▸ Comece por aqui          (as 8 páginas gerais, com selo "visão geral")
▸ Casos
   ▸ Brumadinho            (geral)  →  lista as 11 específicas
   ▸ Rio Doce              (geral)  →  lista as 3
   ▸ Itatiaiuçu            (geral)
▸ Direitos                 (geral)  →  9 eixos
▸ Barragens                (geral)
▸ Atores                   (geral)  →  popular, estatal, empresarial, internacional
▸ Movimentos               (geral)
```

Regras:

- **destaque visual e textual** nas páginas gerais: selo “visão geral” e
  primeira posição em cada grupo;
- contagem por ramo (“Brumadinho — 18 páginas”) para o leitor saber o tamanho;
- o índice não duplica conteúdo: ele **leva**;
- busca no índice com o mesmo normalizador do resto do portal.

## Acessibilidade

O que a unificação precisa garantir, além do que já existe:

| Requisito | Como |
|---|---|
| Um `<h1>` por página | a página geral não repete o título no hero e no corpo |
| Ordem de títulos | `h1 → h2 → h3`, sem pular nível |
| Foco visível | anel de foco herdado; índice e botões com `:focus-visible` |
| Alvo de toque | botão de página específica com no mínimo 44×44 px |
| Link descritivo | “Ver o auxílio”, nunca “clique aqui” |
| Cor não é sinal único | selo de ator tem texto, não só cor |
| Teclado | `<details>` nativo; sem `div` clicável |
| Landmarks | `<nav>`, `<main>`, `<footer>`; skip link no topo |
| Idioma | `lang="pt-BR"` e siglas expandidas na primeira aparição |

## Regra de ouro contra perda de dado

1. **Nenhuma página sai do ar** sem antes ter conteúdo equivalente na geral —
   e, mesmo assim, só com 308.
2. **Nenhum dado é reescrito**: a página geral **lê o mesmo dado** da específica.
3. **Toda página específica ganha um “voltar para a visão geral”** no topo.
4. **Checklist por migração**: `rg` por link antigo, 308 respondendo, sitemap
   atualizado, `npm test`, `tsc`, build verde.
5. **Duplicata real é a única que redireciona** — e a decisão é por comparação
   de conteúdo, não por nome parecido.

## Fases

| Fase | Entrega | Critério de pronto |
|---|---|---|
| 0 | mapa de navegação + breadcrumb em 10 páginas piloto | trilha correta nas 10, teclado ok |
| 1 | 5 páginas gerais (Casos, Brumadinho, Rio Doce, Direitos, Barragens) | essencial na página, botões para as específicas, zero redirect |
| 2 | índice expansível com selo “visão geral” | funciona sem JS, contagem por ramo |
| 3 | resolver os 7 jargões do teste | pergunta do leigo leva ao dado em ≤ 3 cliques |
| 4 | lacunas (água do rio, processo de Brumadinho) | página publicada ou lacuna declarada |

## Decisões pendentes

1. As páginas gerais nascem em `/casos`, `/direitos`, `/barragens`, `/atores`?
2. “Comece por aqui” no índice: 8 páginas ou 5?
3. Aceita `308` só para duplicata real (recomendo sim)?
4. Quem mantém o mapa de navegação quando uma página nova entra?

## Origem / Histórico

- **08/11/2026 — v2 revista.** Substitui a migração por redirect em massa pelo
  modelo “geral + específica”, com teste de 20 hipóteses de leigo, breadcrumb
  único e índice expansível. Nada sai do ar.
