# Proposta — clipping, notícias e linha do tempo numa biblioteca de caso

> **Tipo:** PROPOSTA
> **Domínio:** produto, dados e arquitetura da informação
> **Última medição:** 2026-11-08
> **Leitura estimada:** longa (20–30 min)
> **Relacionados:** [PRODUTO.md](../01-produto/PRODUTO.md), [ARQUITETURA.md](../04-arquitetura/ARQUITETURA.md), [COLETA-ETICA.md](../06-fontes/COLETA-ETICA.md), [REGRAS-DURAS.md](../03-desenvolvimento/REGRAS-DURAS.md), [PROPOSTA-UNIFICACAO-DIREITOS-TERRITORIOS.md](PROPOSTA-UNIFICACAO-DIREITOS-TERRITORIOS.md), [CADERNO-ATIS-PROCESSO-COLETIVO.md](CADERNO-ATIS-PROCESSO-COLETIVO.md)
> **Palavras-chave:** clipping, notícias, linha do tempo, biblioteca do caso, PNAB, PEAB, auxílio emergencial, Brumadinho, deduplicação, taxonomia, coleta ética

## Como ler os números

- **[medido]**: contagem feita em arquivo do repositório nesta data, ou número
  medido por inventário e conferido contra o arquivo citado.
- **[inferido]**: conclusão que segue dos números, sem medição própria.
- **[não dá para concluir]**: o dado falta ou a fonte não permite afirmar.

Nada nesta proposta foi implementado. O documento descreve o que existe, o que
muda e em que ordem. Nenhum número de notícia, documento ou marco foi digitado
de memória: todos saem dos arquivos citados.

## Sumário

- [1. O pedido, em uma frase](#1-o-pedido-em-uma-frase)
- [2. Estado atual medido](#2-estado-atual-medido)
- [3. Modelo de dados único](#3-modelo-de-dados-único)
- [4. Taxonomia temática fechada](#4-taxonomia-temática-fechada)
- [5. Regras de cruzamento automático](#5-regras-de-cruzamento-automático)
- [6. Coleta automatizada ética](#6-coleta-automatizada-ética)
- [7. Páginas públicas](#7-páginas-públicas)
- [8. Plano por fases](#8-plano-por-fases)
- [9. Riscos e limites](#9-riscos-e-limites)
- [10. Pendências que exigem decisão do dono](#10-pendências-que-exigem-decisão-do-dono)

## 1. O pedido, em uma frase

Unificar clipping, notícias e linha do tempo numa **biblioteca do caso
Brumadinho/Paraopeba**, com filtro temático fechado, coleta automatizada de
notícias e dois acervos irmãos — **notícias** e **documentos** — que se
alimentam sem duplicar o mesmo fato.

O caso é o de Brumadinho: rompimento da barragem B1 da Vale, em 25/01/2019, e
a reparação que corre até hoje. [medido: `linha-do-tempo.ts`] PNAB, aqui, é a **Política Nacional de Direitos
das Populações Atingidas por Barragens** (Lei 14.755/2023) — não a Política
Nacional Aldir Blanc, que usa a mesma sigla em outro contexto. PEAB é a
**Política Estadual dos Atingidos por Barragens de Minas Gerais** (Lei estadual
23.795/2021). [medido: `apps/web/lib/direitos-globais/dispositivos.ts` e
`apps/web/lib/judiciario/jurimetria/taxonomia.ts`]

## 2. Estado atual medido

### 2.1 Notícias, clipping e linha do tempo

A frente `/paraopeba` tem **18 arquivos `page.tsx`**: 16 telas de conteúdo e
2 pontes (`/paraopeba/indice` e `/paraopeba/noticias-vale`). [medido] Os três
arquivos de clipping ficam em `apps/web/public/data/`; os de radar e blog,
em `apps/web/data/`.

| Rota | Arquivo/fonte | Itens | Período coberto | Estado |
|---|---|---:|---|---|
| `/paraopeba/noticias?fonte=bacia` | `apps/web/data/noticias-paraopeba.json` | 48 | 06/09/2026 a 30/10/2026 | radar diário; coleta de 01/11/2026 [medido] |
| `/paraopeba/noticias?fonte=vale` | `apps/web/data/noticias-vale.json` | 60 | 30/05/2019 a 30/10/2026 | quatro feeds; 8 URLs comuns com a bacia; os 60 também aparecem em `/paraopeba/correlacao` [medido] |
| `/paraopeba/noticias-vale` | ponte | 0 | — | 301/ponte para `?fonte=vale`; a rota antiga não é mais conteúdo [medido] |
| `/paraopeba/clipping` | `clipping-paraopeba.json` (149) + `clipping-ati.json` (46) + `clipping-ij.json` (59) | 254 | 05/04/2019 a 30/07/2026 | acervo curado à mão; 220 URLs únicas; repetições internas de 2, 7 e 22 URLs; 3 URLs repetidas entre arrays [medido] |
| `/paraopeba/linha-do-tempo` | `apps/web/lib/paraopeba/linha-do-tempo.ts` | 23 | 25/01/2019 a 30/07/2026 | manual; nenhum marco alimentado automaticamente; 2 marcos repetidos em `/paraopeba/vale`; só 1 data veio do clipping (`d01`) [medido] |
| `/noticias` | `apps/web/data/noticias-portal.json` | 204 | 06/09/2026 a 09/10/2026 | blog do portal; 69 visíveis, 135 filtrados como radar-editais [medido] |
| `/novidades` | `noticias-portal.json` + `novidades.json` | 86 | — | 69 posts visíveis + 17 novidades [medido] |
| `/paraopeba/correlacao` | `noticias-vale.json` | 60 | — | repetição dos 60 da Vale, em outro recorte [medido] |

Somando os dois recortes, `/paraopeba/noticias` mostra **108** itens; 8 URLs
são comuns entre eles. [medido]

O que já funciona bem:

- O clipping tem **três curadorias com autoria diferente** — imprensa,
  assessorias técnicas (ATIs) e instituições de justiça (MPMG, MPF, DPMG).
  Isso é ativo, não duplicata. [medido: cabeçalhos de `clipping.ts`,
  `clipping-ati.ts` e `clipping-ij.ts`]
- O radar guarda **título, veículo, data e link** e, quando o feed oferece,
  o resumo do próprio feed; nunca o corpo da matéria. O clipping guarda resumo
  escrito por quem montou o painel-fonte. O portal não reescreve o texto de
  terceiro. [medido]
- A linha do tempo tem 23 marcos com ator, cor editorial, fonte e descrição.
  É o melhor conteúdo narrativo do caso. [medido]
- `/paraopeba/analise` já cruza **13 notícias da ATI com documentos** e
  distribui **16 eixos** temáticos. É o protótipo do cruzamento que esta
  proposta generaliza. [medido: `apps/web/app/paraopeba/analise/page.tsx` e
  `apps/web/lib/paraopeba/sintese-integrada.ts`]

### 2.2 Bibliotecas e documentos

| Rota | Arquivo/fonte | Itens | O que é | Estado |
|---|---|---:|---|---|
| `/paraopeba/biblioteca` | `biblioteca-ati.json` (645) + `biblioteca-pro-brumadinho.json` (129) + 14 teses | 788 | publicações das ATIs, documentos oficiais do Acordo e teses do caso | os 645 das ATIs também aparecem em `/ambiental/crimes-socioambientais` via `biblioteca-desastres.json` (936) [medido] |
| `/paraopeba/documentos` | `apps/web/public/data/documentos-paraopeba.json` | 471 | autos do processo judicial da reparação, índice Solr da Plataforma Brumadinho UFMG | 471 IDs e 471 links únicos; cobre 6,6% do acervo de 7.107 [medido] |
| `/paraopeba/pericia` | acervo da perícia UFMG | 445 | documentos da perícia judicial | 21 recebem tema controlado; o resto é edital, papelada e lista de equipe [medido: `temas-acervo.ts`] |
| `/biblioteca` | `biblioteca-unificada.json` (458) + 336 teses | 794 | biblioteca geral e acervo acadêmico | o texto da página mede **882**; a diferença de 88 é exatamente 424 − 336 teses; [inferido] o texto soma todas as teses, a tabela soma só a fatia `unificada` |
| `/ambiental/crimes-socioambientais` | `biblioteca-desastres.json` | 936 | documentos de Brumadinho (645) e Mariana (291) | contém os 645 das ATIs; é visão agregada, não acervo independente [medido] |
| sem rota | `biblioteca-desastres-unificada.json` | 1.081 | base maior que a publicada | contém os 936; não é renderizada [medido] |
| `/ambiental/estudos` | — | 1.016 audiências + 2.439 estudos | audiências públicas e estudos ambientais | existe, mas não entra na biblioteca do caso [medido] |
| `/jurisprudencia` | `jurisprudencia-casos.json` | 23.569 | acórdãos e decisões | 17.387 sem frente penal; 2.492 números com inteiro teor [medido] |
| `/judiciario/jurisprudencia` | índice próprio | 44.812 | TJMG (25.615) + TJES (19.197) | 2.970 processos do TJMG [medido] |
| sem rota | `cnj-atos.json` | 5.887 | atos do CNJ, 2.623 normativos | nenhuma rota renderiza [medido] |
| sem rota | `noticias-desastres.json` | 108 | radar de Mariana/Brumadinho/atingidos BA/ES | módulo existe em `lib/ambiental/desastres-noticias.ts`; nenhuma página o importa [medido] |
| sem rota | `noticias-tribunais.json` | 41 | notícias de tribunais | usado só em `/jurisprudencia/partes.tsx` [medido] |
| sem rota | `noticias-radar/dados.compact.json` | 24 | snapshot de 16/09/2026 | órfão [medido] |

Somar as cinco coleções principais de documentos — processo (471), ATIs (645),
Pró-Brumadinho (129), desastres (936) e unificada (458) — dá **2.639 linhas**.
Dessas, **1.874 títulos únicos** e **1.994 pares título+URL únicos** [medido].
É a medida que justifica uma entidade canônica: cerca de uma em cada quatro
linhas é a mesma coisa vista por outra porta. A diferença de 645 entre 2.639 e
1.994 é exatamente a sobreposição ATI → desastres: o resto não repete URL.
O título único é teto de dedupe, não piso: pode juntar documentos distintos
que têm o mesmo nome.

### 2.3 O diagnóstico em sete linhas

1. **Duplicação sem identidade.** 254 linhas de clipping são 220 URLs; 216
   linhas de radar são 182 URLs — 8 comuns entre bacia e Vale, 19 entre bacia
   e desastres, 15 entre Vale e desastres; os 645 itens das ATIs estão
   inteiros dentro dos 936 de desastres. [medido]
2. **Tema não é taxonomia.** O clipping geral tem **278 tags livres**; a
   biblioteca das ATIs tem **26 temas livres**; só **270 dos 645** itens têm
   tema controlado, e **375 não têm**. [medido]
3. **O mesmo campo mistura coisas diferentes.** As 278 tags incluem portal
   ("O Tempo"), ator ("Vale", "MAB"), instituição ("TJMG", "STF"), tema
   ("PNAB", "auxílio") e processo ("ADPF 1314"). [medido]
4. **Portal não é entidade.** Há **101 rótulos brutos** de portal e **97
   normalizados**; ainda sobram duplicatas como "Guaicuy" e "Instituto
   Guaicuy", "MPF" e "Ministério Público Federal". [medido]
5. **Notícia não tem data de edição, processo nem documento relacionado.**
   Só o blog tem `atualizadoEm`, que é atualização do post, não data de edição
   da matéria. Os coletores de radar guardam `data` de publicação e nada mais.
   [medido]
6. **A linha do tempo é uma ilha.** 23 marcos, nenhum com `tema_ids`,
   `documento_ids` ou `noticia_ids`; só 1 data foi emprestada do clipping.
   [medido]
7. **Coleta sem higiene comum.** Os três coletores usam User-Agents
   diferentes, não leem `robots.txt`, não têm pausa por host nem checkpoint.
   A rotina diária roda só o coletor do Paraopeba. [medido:
   `scripts/coletar-noticias-paraopeba.py`,
   `scripts/coletar-noticias-desastres.py`,
   `apps/web/scripts/coletar-noticias-vale.mts`,
   `scripts/executar-rotina-noticias.ps1`]

## 3. Modelo de dados único

### 3.1 As sete entidades

| Entidade | Papel | Chave estável |
|---|---|---|
| `Noticia` | matéria, nota, release ou post de terceiro | `noticia:<fonte>:<hash>` ou `noticia:<hash-da-url>` |
| `Documento` | relatório, lei, recomendação, audiência, decisão, ementa, acordo, deliberação, prestação de contas, estudo | `documento:<fonte>:<id-nativo>` |
| `Evento` | fato datado da linha do tempo | `evento:<caso>:<data>-<slug>` |
| `Processo` | processo judicial ou administrativo | `processo:<número CNJ só com dígitos>` |
| `Portal` | veículo, órgão ou instituição que publicou | `portal:<slug>` |
| `Tema` | assunto fechado, filtrável | `tema:<slug>` |
| `Sujeito` | população ou recorte de quem o item fala | `sujeito:<slug>` |

`Vinculo` é a aresta entre duas entidades — não é uma oitava entidade de
conteúdo, é a ligação com tipo, confiança e método.

Os campos e nomes abaixo são a **proposta**. O que existe hoje, com o nome que
existe hoje, está na seção 2.

### 3.2 Notícia

```ts
interface Noticia {
  id: string;
  url_original: string;
  url_canonica: string | null;      // null quando só existe URL de agregador
  url_agregador?: string | null;
  portal_id: string;
  titulo: string;
  resumo: string | null;
  resumo_origem: "fonte" | "portal" | "modelo" | null;
  data_publicacao: string;          // ISO com fuso; ou YYYY-MM
  precisao_data: "dia" | "mes" | "ano";
  data_edicao: string | null;       // só quando a fonte declara
  verificado_em: string;
  hash_conteudo: string;
  caso_id: string;
  tema_ids: string[];
  sujeito_ids: string[];
  ator_ids: string[];
  processo_ids: string[];
  documento_ids: string[];
  evento_ids: string[];
  tipo_fonte: "imprensa" | "ati" | "instituicao_justica" | "movimento" | "oficial" | "agregador";
  status: "coletada" | "sugerida" | "revisada" | "publicada" | "arquivada";
  confianca_vinculo: "confirmado" | "alto" | "medio" | "baixo" | null;
  ocorrencias: Ocorrencia[];
}
```

`data_edicao` não é inventada: vem de `dateModified`/`article:modified_time`
quando o feed ou a página permitida declarar. Sem isso, fica `null` e a tela
diz "edição não informada". Baixar a página do artigo para caçar essa data só
se os termos permitirem. [inferido]

`Ocorrencia` é o que impede a perda de curadoria quando duas fontes apontam
para a mesma matéria:

```ts
interface Ocorrencia {
  fonte_id: string;
  url_original: string;
  coletado_em: string;
  hash_conteudo: string;
  colecao: "radar" | "curado" | "ati" | "ij" | "desastres" | "outro";
}
```

Uma notícia pode ter várias ocorrências e continuar sendo **uma** linha. É
assim que o mesmo fato noticiado por MPMG, MPF e DPMG não vira três notícias:
vira uma `Noticia` com três `Ocorrencia` e o campo editorial `grupo` preservado
como `grupo_fato` no vínculo. [inferido a partir de `clipping-ij.ts`, que já
agrupa 36 das 59 publicações em 13 fatos]

### 3.3 Documento

```ts
type TipoDocumento =
  | "relatorio_tecnico"
  | "lei"
  | "recomendacao"
  | "audiencia_publica"
  | "decisao_judicial"
  | "ementa"
  | "acordo"
  | "deliberacao"
  | "prestacao_contas"
  | "estudo"
  | "peticao"
  | "ata"
  | "oficio"
  | "laudo"
  | "prova"
  | "manifestacao"
  | "outro";

interface Documento {
  id: string;
  tipo: TipoDocumento;
  titulo: string;
  resumo: string | null;
  resumo_origem: "fonte" | "portal" | "modelo" | null;
  data: string | null;
  precisao_data: "dia" | "mes" | "ano";
  orgao: string;
  numero: string | null;            // lei, recomendação, processo, acórdão
  processo_id: string | null;
  caso_id: string;
  tema_ids: string[];
  sujeito_ids: string[];
  fonte_id: string;
  url: string;
  arquivo_url: string | null;       // PDF ou página oficial
  hash_conteudo: string;
  status: "publicado" | "sugerido" | "arquivado";
  relator?: string;
  comarca?: string;
  resultado?: string;
  documento_ids?: string[];         // ementa -> decisão; decisão -> autos
}
```

O campo `tipo` é fechado. "Relatório técnico", "lei", "recomendação",
"audiência pública", "decisão judicial" e "ementa" deixam de ser texto livre
e passam a ser filtro. [inferido: hoje `documentos-paraopeba.json` tem 1
"decisão", 1 "relatório técnico" e 3 "estudo técnico" entre 471 itens; o tipo
é texto da fonte, não categoria do portal — medido]

### 3.4 Evento

```ts
interface Evento {
  id: string;
  data: string;                     // YYYY-MM-DD ou YYYY-MM
  precisao_data: "dia" | "mes";
  titulo: string;
  descricao: string;
  tipo:
    | "rompimento" | "acordo" | "decisao" | "liminar" | "pagamento"
    | "audiencia" | "norma" | "protesto" | "laudo" | "outro";
  caso_id: string;
  tema_ids: string[];
  ator_ids: string[];
  documento_ids: string[];
  noticia_ids: string[];
  fonte_ids: string[];
  status: "publicado" | "sugerido";
  confianca: "confirmado" | "alto" | "medio" | "baixo";
}
```

O evento não copia título de notícia nem de documento. Ele tem texto próprio,
curto, e aponta para as duas pontas. A data mantém a precisão da fonte: `2020-01`
continua mês, nunca vira `2020-01-01`. [medido: regra já existe em
`formatarDataMarco`]

### 3.5 Como os três se ligam por IDs estáveis

```
Noticia ──documento_ids──▶ Documento
   │                           │
   └────evento_ids────▶ Evento ◀──documento_ids──┘
                           │
                           └──processo_ids──▶ Processo
```

- **Notícia → documento:** a matéria cita a lei, a decisão, o relatório ou o
  número do processo. O vínculo é `menciona` ou `trata_de`.
- **Notícia → evento:** a matéria noticia o fato. O vínculo é `mesmo_fato`.
- **Documento → evento:** a decisão, a lei ou o laudo é o documento daquele
  fato. O vínculo é `documenta`.
- **Evento → processo:** o fato corre num processo. O vínculo é `decorre_de`.
- **Documento → documento:** ementa → decisão → autos. O vínculo é
  `fundamenta` ou `publicado_em`.

```ts
interface Vinculo {
  id: string;
  origem: { tipo: "noticia" | "documento" | "evento" | "processo"; id: string };
  destino: { tipo: "noticia" | "documento" | "evento" | "processo"; id: string };
  relacao:
    | "menciona" | "trata_de" | "documenta" | "decorre_de"
    | "publicado_em" | "mesmo_fato" | "fundamenta";
  confianca: "confirmado" | "alto" | "medio" | "baixo";
  metodo: "manual" | "regra" | "modelo";
  revisado_por: string | null;
  revisado_em: string | null;
}
```

Os arrays `documento_ids`, `noticia_ids` e `evento_ids` dentro das entidades
são **índice derivado**, para a tela não fazer N consultas. A fonte de verdade
é a tabela `Vinculo`; um teste de paridade impede que os dois discordem.
[inferido]

IDs nunca são índice de array. O clipping atual usa `id: 1..149`, que quebra
se a ordem mudar; a proposta troca por hash de URL ou ID nativo da fonte.
[medido: `clipping.ts` usa número sequencial; `clipping-ati.ts` usa `pj01`;
`clipping-ij.ts` usa `m01`; `documentos.ts` usa o ID da UFMG]

### 3.6 Onde o dado mora

| Camada | Caminho | Papel |
|---|---|---|
| Canônica | `apps/web/data/acervo-caso/*.json` | uma linha por entidade, versionada, diffável; gerada por script |
| Publicada | `apps/web/public/data/acervo-caso/*.json` | fatias lidas no build, no padrão `ASSETS.fetch` + fallback de disco |
| Código | `apps/web/lib/acervo/*.ts` | tipos, taxonomia, dedupe, consultas e testes |
| Revisão | `apps/web/data/acervo-caso/sugestoes.json` | fila de vínculos sugeridos, com confiança e método |
| Auditoria | `apps/web/data/acervo-caso/revisao.jsonl` | quem aprovou, quando, o que mudou |

Não há migração para Postgres nesta fase. O volume atual — 2.639 linhas de
documentos e 216 de notícia — cabe em JSON versionado, e o build lê no disco.
Se a fila de revisão passar de alguns milhares de itens por semana, aí sim
`Processo`, `Sugestao` e `Revisao` viram tabelas. [inferido]

## 4. Taxonomia temática fechada

### 4.1 Dois eixos, não um

O erro atual é usar um campo só para responder três perguntas: **sobre o quê**
(tema), **quem** (sujeito) e **quem publicou** (portal/ator). A proposta separa:

- `tema_ids[]` — assunto. Fechado. Toda notícia, documento e evento usa a
  mesma lista.
- `sujeito_ids[]` — população ou recorte. Fechado. "Quilombolas", "indígenas",
  "pescadores", "atingidos", "mulheres", "crianças", "população negra".
- `ator_ids[]` — quem age: Vale, BHP, Samarco, MAB, FGV, TJMG, STF, Ibram,
  MPMG, MPF, DPMG, ATIs, CNDH.
- `portal_id` — quem publicou. Um por item.

Assim, "quilombolas" e "indígenas" continuam filtráveis, como o dono pediu,
mas não se confundem com "saúde" ou "PNAB". [inferido: a própria
`temas-ati.ts` já registra que rótulo de população não é assunto]

### 4.2 Lista fechada de temas

| Grupo | Slug | Rótulo | Termos de busca e sinônimos |
|---|---|---|---|
| Reparação e dinheiro | `auxilio-emergencial` | Auxílio emergencial, PTR e NAE | auxílio, PTR, NAE, parcela, FGV, pagamento, Novo Auxílio |
| Reparação e dinheiro | `indenizacao` | Indenização individual | indenização, dano moral, PID, acordo individual, valor |
| Reparação e dinheiro | `acordo-reparacao` | Acordo de reparação | Acordo Judicial, R$ 37,6 bi, repactuação, Comitê Gestor |
| Reparação e dinheiro | `execucao-pagamentos` | Execução e pagamentos | execução, repasse, prestação de contas, orçamento |
| Reparação e dinheiro | `programas-compensacao` | Programas de compensação | projeto, compensação, PEABP, educação ambiental |
| Normas e justiça | `pnab` | PNAB | Lei 14.755/2023, ADPF 1314, NAE, direitos dos atingidos |
| Normas e justiça | `peab` | PEAB/MG | Lei 23.795/2021, Política Estadual dos Atingidos |
| Normas e justiça | `direitos-humanos` | Direitos humanos | CNDH, CIDH, ONU, REDESCA, recomendação, missão |
| Normas e justiça | `acao-penal` | Ação penal | denúncia, réu, TRF6, oitiva, pena, homicídio |
| Normas e justiça | `acao-civil-publica` | Ação civil pública | ACP, tutela, liminar, processo coletivo |
| Normas e justiça | `acesso-justica` | Acesso à justiça | Defensoria, assistência jurídica, gratuidade |
| Saúde e ambiente | `saude` | Saúde | ERSHRE, saúde pública, saúde mental, contaminação |
| Saúde e ambiente | `agua-saneamento` | Água e saneamento | Paraopeba, abastecimento, qualidade da água, esgoto |
| Saúde e ambiente | `pesca` | Pesca | pescador, área de pesca, renda da pesca, rio |
| Saúde e ambiente | `seguranca-barragem` | Segurança de barragem | B1, SIGBM, ANM, descaracterização, risco, emergência |
| Saúde e ambiente | `meio-ambiente` | Meio ambiente | fauna, flora, rejeito, recuperação, biodiversidade |
| Saúde e ambiente | `territorio-reassentamento` | Território e reassentamento | deslocamento, reassentamento, área urbana, área rural |
| Saúde e ambiente | `patrimonio-cultura-memoria` | Patrimônio, cultura e memória | memória, cultura, bem atingido, museu, acervo |
| Povos e sociedade | `povos-comunidades-tradicionais` | Povos e comunidades tradicionais | quilombola, indígena, geraizeiro, vazanteiro, PCT |
| Povos e sociedade | `participacao-controle-social` | Participação e controle social | audiência, consulta, comitê, conselho, ATI |
| Povos e sociedade | `conflito-violencia` | Conflito e violência | ameaça, criminalização, protesto, conflito |
| Povos e sociedade | `trabalho-renda` | Trabalho e renda | emprego, CAGED, renda, formação, trabalho |
| Povos e sociedade | `educacao` | Educação | escola, educação ambiental, formação, universidade |
| Economia e empresa | `mineracao-empresas` | Mineração e empresas | Vale, BHP, Samarco, mineração, ESG, acionista |
| Economia e empresa | `clima-desastres` | Clima e desastres | clima, risco climático, Mariana, outros desastres |
| Economia e empresa | `transparencia-dados` | Transparência e dados | LAI, dados abertos, prestação de contas, auditoria |

São **26 temas** em **seis grupos**. A lista é fechada: tema novo entra por
decisão editorial, com teste e registro de mudança, nunca por tag livre de
coletor. [inferido: 26 é o mesmo tamanho da lista livre atual, mas com
fronteiras definidas]

### 4.3 Sujeitos fechados

`atingidos`, `quilombolas`, `indigenas`, `pescadores`, `povos-tradicionais`,
`mulheres`, `criancas-adolescentes`, `populacao-negra`,
`pessoas-com-deficiencia`, `familiares-vitimas`, `trabalhadores`.

A barra de filtro mostra "Tema" e "Povos e sujeitos" separados. O dono que
procura "quilombolas" acha no segundo; quem procura "saúde" acha no primeiro;
quem procura "quilombolas e saúde" combina os dois. [inferido]

### 4.4 O mesmo tema classifica notícia, documento e evento

Exemplo com o auxílio:

| Entidade | Título | `tema_ids` | `caso_id` | `processo_id` |
|---|---|---|---|---|
| Notícia | "TJMG restaura o Novo Auxílio Emergencial" | `auxilio-emergencial`, `pnab`, `acao-civil-publica` | `brumadinho` | `processo:<CNJ>` |
| Documento | "Decisão que restabelece o NAE" | `auxilio-emergencial`, `pnab`, `acao-civil-publica` | `brumadinho` | idem |
| Evento | "TJMG restaura o auxílio" (13/11/2025) | `auxilio-emergencial`, `pnab`, `acao-civil-publica` | `brumadinho` | idem |

O CNJ real de cada decisão entra na F5. O exemplo mostra o formato do vínculo,
não afirma que este processo específico é o da decisão. [inferido]

O filtro `?tema=auxilio-emergencial` devolve os três. O filtro
`?tema=pnab` devolve os três também, porque a decisão aplica a lei. O filtro
`?tema=indenizacao` não devolve nenhum dos três, porque indenização individual
é outro assunto. [inferido a partir do marco de 13/11/2025 e do vocabulário
atual]

Outro exemplo, com documento oficial:

| Entidade | Título | `tema_ids` | `sujeito_ids` |
|---|---|---|---|
| Notícia | "CNDH cobra reparação e saúde mental em Brumadinho" | `direitos-humanos`, `saude`, `pnab` | `atingidos` |
| Documento | "Relatório da Missão do CNDH nas Bacias do Doce e Paraopeba" | `direitos-humanos`, `saude`, `pnab` | `atingidos` |
| Evento | "CNDH publica relatório da missão" | `direitos-humanos`, `saude`, `pnab` | `atingidos` |

Os títulos das duas tabelas são ilustrativos; mostram a classificação, não
afirmam que exista uma manchete com esse texto. [inferido]

### 4.5 Como classificar sem inventar

1. **Título primeiro.** O assunto principal está na manchete. O resumo entra
   só quando o título não basta.
2. **Corpo da matéria nunca é lido.** Os coletores não baixam o texto; a
   classificação trabalha com título, resumo de feed e metadados.
3. **Termo ambíguo exige contexto.** "Vale" só conta como empresa quando não
   é "Vale do Javari"; "Mariana" só conta como caso quando não é "atacante
   Mariana"; "reparação" não conta quando é "preparação". A armadilha já está
   medida nos coletores. [medido: comentários de
   `apps/web/scripts/coletar-noticias-vale.mts`]
4. **Máximo de três temas por item**, com um `tema_principal` para o cartão.
   Mais que isso é tag, não classificação.
5. **Modelo só sugere.** Regra determinística decide; modelo local pode
   propor tema com `metodo: "modelo"` e etiqueta visível. Nenhum tema entra
   publicado só por modelo.
6. **Sem tema é resposta.** Item que não casa fica `tema_ids: []` e aparece
   no filtro "Sem tema". O contador de sem tema é publicado; esconder isso
   faria a cobertura parecer maior do que é. [medido: 375 dos 645 itens das
   ATIs estão nessa situação hoje]

## 5. Regras de cruzamento automático

### 5.1 O fluxo

```
coletor → normaliza → deduplica → classifica → grava sugestão
   → fila de revisão → publica entidade + vínculo → página lê o vínculo
```

Nada é publicado direto no acervo canônico. O coletor escreve em
`entrada/`; o normalizador escreve em `sugestoes.json`; a revisão promove para
`noticias.json`, `documentos.json` ou `eventos.json`. [inferido: mesma lógica
do `status` já usada em `jurisprudencia-casos.json`, que tem `status:
"aprovado"`]

### 5.2 Deduplicação

Ordem de chaves, da mais forte para a mais fraca:

1. **URL canônica igual** → mesma `Noticia`; a segunda vira `Ocorrencia`.
2. **Hash de conteúdo igual** → mesma `Noticia`; mantém a ocorrência.
3. **Título normalizado + portal + data de publicação iguais** → mesma
   `Noticia`.
4. **Título normalizado + data iguais, portais diferentes** → mesmo
   `grupo_fato`, mas **duas** `Noticia`, porque a autoria é diferente.
5. **Tema + caso + janela de 7 dias** → candidato a vínculo com evento, não
   a fusão de notícias.

Normalização de URL:

- host minúsculo, sem `www.`;
- caminho sem barra final;
- remover `utm_*`, `fbclid`, `gclid`, `mc_cid`, `mc_eid`, `igshid`;
- preservar `id`, `p`, `story`, `noticia` e parâmetros que mudam o conteúdo;
- Google Notícias: a URL é do agregador, não do veículo. Guardar a URL do
  agregador em `url_agregador`, deixar `url_canonica: null`, usar
  `titulo + portal + data` como chave secundária e **nunca** tratar a URL do
  Google como URL do artigo. [medido: os itens de `noticias-paraopeba.json` e
  `noticias-desastres.json` apontam para `news.google.com/rss/articles/...`]

Normalização de título:

- minúsculas, sem acento, pontuação removida, espaços colapsados;
- remover sufixo de portal quando ele repete o `portal_id`
  (" - Diário do Comércio", " | O Tempo");
- não remover palavras de conteúdo ("Vale", "Brumadinho", "auxílio").

Hash:

```
sha256(
  titulo_normalizado + "\n" +
  data_publicacao + "\n" +
  portal_id + "\n" +
  resumo_normalizado.slice(0, 280)
)
```

O hash não usa o corpo da matéria, porque o corpo não é coletado. Também não
usa a URL do Google, porque ela muda. Snippet diferente entre feeds não prova
matéria diferente; por isso URL e título+portal+data vêm antes do hash.
[inferido]

### 5.3 Regras de vínculo

| Regra | Origem → destino | Condição | Confiança |
|---|---|---|---|
| R1 | Notícia → Processo | título ou resumo contém número CNJ válido | `alto` |
| R2 | Notícia → Documento | cita número de lei, recomendação, acórdão ou documento | `alto` |
| R3 | Notícia → Evento | título contém termo do evento e data dentro de ±1 dia | `alto` |
| R4 | Notícia → Evento | mesmo tema + mesmo caso + data dentro de ±7 dias | `medio` |
| R5 | Documento → Evento | documento é decisão, lei, acordo ou laudo com data igual ou ±1 dia | `alto` |
| R6 | Documento → Evento | mesmo tema + mesmo caso, sem data explícita | `medio` |
| R7 | Notícia → Documento | mesmo tema + mesma janela, sem identificador | `baixo` |
| R8 | Notícia → Notícia | título+data iguais, portais diferentes | `grupo_fato`, não fusão |

R1 e R2 são os únicos que podem publicar sem revisão humana, porque o
identificador é objetivo. R3 e R5 só publicam sem revisão quando a data é
exata e o título nomeia o fato; fora disso, entram na fila como `alto`. R4, R6
e R7 sempre vão para a fila. [inferido]

### 5.4 Confiança e revisão

| Nível | O que significa | Publica? | Onde aparece |
|---|---|---|---|
| `confirmado` | humano aprovou, ou documento oficial nomeia o fato | sim | biblioteca e linha do tempo |
| `alto` | identificador objetivo (processo, lei, número) ou data ±1 dia | sim, com selo | biblioteca e linha do tempo |
| `medio` | tema + caso + janela, sem identificador | não | fila de revisão |
| `baixo` | só tema em comum | não | fila, expira em 90 dias |
| `descartado` | revisão rejeitou | não | auditoria |

A fila de revisão mostra, para cada sugestão: entidade de origem, destino,
regra, confiança, trecho que casou, data e botões **aprovar**, **rejeitar**,
**trocar tema**, **fundir** e **separar**. Toda ação grava uma linha em
`revisao.jsonl` com revisor, data e antes/depois. [inferido]

### 5.5 Uma notícia em três lugares sem duplicar

Exemplo real do acervo: a decisão do TJMG de 13/11/2025 que restaura o NAE.

1. **Notícias.** A matéria entra em `Noticia` com
   `id: noticia:<fonte>:<hash>`, `tema_ids: ["auxilio-emergencial", "pnab"]`,
   `caso_id: "brumadinho"`.
2. **Clipping.** A mesma linha aparece em `/paraopeba/clipping` porque
   `ocorrencias[].colecao = "curado"`. A página filtra por coleção; não há
   cópia.
3. **Linha do tempo.** O evento `evento:brumadinho:2025-11-13-tjmg-restaura-auxilio`
   tem `noticia_ids: ["noticia:..."]`. O cartão mostra "Notícias deste fato
   (1)".
4. **Biblioteca.** A aba `Notícias` lê a mesma `Noticia`; a aba `Documentos`
   lê a `Documento` da decisão; a aba `Eventos` lê o `Evento`.

Se a mesma matéria foi publicada por MPMG, MPF e DPMG, há **uma** `Noticia`
com três `Ocorrencia` e um `grupo_fato`; o cartão mostra "3 publicações". O
contador de notícias não infla. [inferido; baseado no `grupo` de
`clipping-ij.ts`, que já agrupa 36 das 59 publicações em 13 fatos]

**Regra de ouro:** a notícia existe **uma vez**, com ID estável e URL canônica.
`/paraopeba/noticias`, `/paraopeba/clipping`, `/paraopeba/linha-do-tempo` e
`/paraopeba/biblioteca` são quatro leituras da mesma linha; nenhuma delas cria
cópia. O mesmo vale para documento e evento.

### 5.6 Relatório de deduplicação

Toda rodada grava `relatorio-dedupe.json` com:

- linhas de entrada por fonte;
- linhas canônicas por entidade;
- fusões feitas (URL, hash, título);
- itens mantidos separados por autoria;
- itens sem tema;
- itens sem data;
- links quebrados.

O relatório é público em `/paraopeba/biblioteca?aba=sobre` e vira teste de
paridade: se a contagem mudar sem explicação, o teste falha. [inferido: mesmo
padrão das coberturas literais de `COBERTURA_*`]

## 6. Coleta automatizada ética

### 6.1 Regras que valem para todo coletor

1. **User-Agent honesto:** `finweejur/github artur colito`. Nada de UA de
   navegador, UA vazio ou identidade de terceiro. [medido: regra global do
   `AGENTS.md`; os três coletores atuais usam outras strings]
2. **Ler antes de acessar:** termos de uso, `robots.txt`, `sitemap.xml`,
   documentação pública e licença. Registrar a decisão em
   `apps/web/data/acervo-caso/fontes-coleta.json`.
3. **Respeitar:** `Disallow`, `Crawl-delay`, limite de requisições e área
   autenticada. Termo que proíbe coleta automatizada encerra a fonte.
4. **Ritmo:** 1–2 s entre requisições por host; sequencial por host; sem
   paralelismo entre páginas do mesmo domínio. Se o `Crawl-delay` for maior,
   vale o maior.
5. **Checkpoint:** guardar `ETag`, `Last-Modified`, última data e cursor por
   fonte em `estado-coleta.json`. Rodada interrompida retoma do ponto, não
   recomeça.
6. **Fora da CI:** coleta roda na máquina, não no build pago. A rotina atual
   das 02:30 já é local. [medido: `scripts/executar-rotina-noticias.ps1`]
7. **Sem burla:** nada de login, CAPTCHA, paywall, rate limit ou IP rotativo.
8. **Sem corpo de matéria:** título, resumo de feed, portal, data e link. O
   texto completo não é baixado nem armazenado.
9. **Dado pessoal:** triagem antes de gravar; CPF por mod-11; nome de vítima
   em obituário é redigido; nada de CPF bruto em prompt de IA.

### 6.2 Portais já usados no repositório

Estes já aparecem em coletor, clipping ou dado versionado. A coluna "checagem"
diz o que falta; **nenhum** foi checado nesta proposta, porque a tarefa não
permite coleta. [medido: arquivos citados]

| Portal/fonte | Como entra hoje | Checagem pendente |
|---|---|---|
| MAB (`mab.org.br`) | feed em `coletar-noticias-paraopeba.py` | termos e robots [não medido] |
| Agência Brasil (EBC) | feed no mesmo coletor | licença e termos [não medido] |
| Google Notícias | RSS de busca | termos do agregador; só RSS, sem scraping [não medido] |
| AEDAS, ADAI, Guaicuy | feeds de taxonomia | termos e robots; são parte interessada [não medido] |
| Radar Mineração | feed em `coletar-noticias-vale.mts` | termos e robots [não medido] |
| G1 Minas Gerais | feed no mesmo coletor | termos e robots [não medido] |
| Portal da Cidade Brumadinho | clipping e radar | termos e robots [não medido] |
| O Fator, O Tempo, Migalhas, Conjur, Brasil de Fato, Estado de Minas, Diário do Comércio | clipping e radar | termos e robots; alguns podem ter paywall [não medido] |
| UOL, R7, Metrópoles, Poder360, GGN, CNN Brasil, BH 24 Horas, Folha Vitória, Século Diário, O Globo, A Gazeta | radar via Google Notícias | termos e robots; verificar se o link do agregador é aceitável [não medido] |
| TJMG, MPMG, MPF, DPMG, STJ, STF, ALMG, Agência Minas, Portal MG | clipping institucional | TJMG e MPMG não têm RSS (404 medido em 14/08/2026, registrado no código); checar termos e API [medido: comentário de `radar.ts` e `PLANO-TRANSPARENCIA-JUSTICA.md`] |
| Vale, BHP | clipping e radar | termos e robots; fonte corporativa [não medido] |
| CNDH, ONU, REDESCA, CIDH | biblioteca de direitos humanos | termos e licença [não medido] |

### 6.3 O que muda nos coletores

- Um módulo comum de coleta: UA, pausa, retry, `robots.txt`, checkpoint e
  log por host.
- `coletar-noticias-paraopeba.py`, `coletar-noticias-desastres.py` e
  `apps/web/scripts/coletar-noticias-vale.mts` passam a usar o mesmo UA e a
  mesma pausa. [medido: hoje usam três strings diferentes]
- A rotina diária passa a chamar os três coletores, não só o do Paraopeba.
  [medido: `executar-rotina-noticias.ps1` chama apenas
  `coletar-noticias-paraopeba.py`]
- Cada fonte nova entra primeiro em `--seco`, com relatório de 10 itens, e só
  depois grava. [inferido]
- Limite por rodada: 60 itens por fonte, como o radar da Vale já faz. [medido:
  `noticias-vale.json` guarda até 60]

### 6.4 Frequência e retenção

- Coleta diária para radar; semanal para a biblioteca. O clipping curado
  continua manual, por rodada editorial, porque a curadoria é o valor dele.
- Metadado de notícia fica para sempre; não há motivo para apagar título,
  data e link. O corpo nunca é guardado.
- Documento oficial fica para sempre, com hash e URL.
- Link quebrado não é apagado: vira `link_status: "morto"` e a tela avisa.
- Revisão de link mensal, com relatório de quantos morreram. [inferido]

## 7. Páginas públicas

### 7.1 `/paraopeba/noticias` — notícias e clipping

Uma página, dois recortes, filtros iguais.

- **Recorte `radar`:** 48 da bacia + 60 da Vale; varredura automática.
- **Recorte `curado`:** 254 do clipping; acervo com autoria.
- **Recorte `todos`:** os dois, com selo em cada cartão.

Filtros na URL, renderizados no servidor:

```
?acervo=radar|curado|todos
?tema=auxilio-emergencial
?sujeito=quilombolas
?caso=brumadinho
?portal=o-tempo
?de=2025-01-01&ate=2026-11-08
?q=texto
?pagina=2
```

Cada cartão mostra:

- título;
- resumo de até 2 linhas, com selo `resumo da fonte` ou `resumo do portal`;
- portal;
- data de publicação;
- data de edição, quando existir; quando não, "edição não informada";
- chips de tema e sujeito;
- "Ver na fonte" (link externo);
- "Documentos relacionados (N)" e "Na linha do tempo (N)".

O topo mostra: total, quantos são radar, quantos são curados, quantos estão
sem tema e a data da última coleta. O botão "Sem tema" é filtro, não rodapé.

O que **não** entra: texto completo, foto de terceiro, cópia de ementa inteira.
[inferido: regra editorial do portal]

### 7.2 `/paraopeba/linha-do-tempo` — o fato, com as duas pontas

A página mantém os 23 marcos e ganha:

- filtro `?tema=`, `?sujeito=`, `?ator=`, `?periodo=`, `?tipo=`;
- cada marco com chips de tema e ator;
- "Notícias deste fato (N)" e "Documentos (N)";
- quando não há vínculo, a frase "sem notícia ou documento vinculado" — a
  lacuna é informação;
- o CSV atual continua, agora com colunas de tema e IDs.

O marco continua manual. A sugestão automática entra na fila; não altera a
linha do tempo publicada sem revisão. A coleta pode **propor** evento novo
quando a notícia descreve um fato datado (R3), mas quem aprova é a revisão.
[inferido]

### 7.3 `/paraopeba/biblioteca` — a biblioteca do caso

A rota já existe e já se chama biblioteca. Ela é ampliada, não substituída.
Quatro abas:

**Aba `Notícias` (N)** — a lista catalogada que o dono pediu. Colunas:

| Campo | Origem | Observação |
|---|---|---|
| Título | `Noticia.titulo` | — |
| Resumo | `Noticia.resumo` | selo de origem |
| Portal | `Portal.nome` | entidade canônica |
| Data de publicação | `Noticia.data_publicacao` | com precisão |
| Data de edição | `Noticia.data_edicao` | `null` quando a fonte não declara |
| Link | `Noticia.url_original` | abre a fonte |
| Tema | `tema_ids` | chips filtráveis |
| Caso | `caso_id` | Brumadinho por padrão |
| Processo | `processo_ids` | quando houver |

O "arquivo" da notícia é o **registro catalográfico**, não o HTML da matéria:
título, resumo, portal, datas e link. O arquivo do documento oficial pode ser
o PDF da fonte, por link, sem cópia. [inferido]

**Aba `Documentos` (N)** — a segunda biblioteca. Filtros por tipo:

`relatório técnico`, `lei`, `recomendação`, `audiência pública`,
`decisão judicial`, `ementa`, `acordo`, `deliberação`, `prestação de contas`,
`estudo`, `petição`, `ata`, `ofício`, `laudo`, `prova`, `manifestação`,
`outro`.

Cada linha mostra: título, resumo, tipo, órgão, data, número, tema, processo,
link e "Notícias que citam (N)". As coleções existentes viram subfiltros:
`ATIs`, `Pró-Brumadinho`, `Processo UFMG`, `Perícia UFMG`, `Jurisprudência`,
`Direitos humanos`, `Estudos e audiências`. [medido: essas coleções já existem
nos arquivos citados]

**Aba `Eventos` (23)** — a linha do tempo em forma de índice, com data,
título, tema e links para notícias e documentos.

**Aba `Sobre`** — fontes, contagens, método, data da última coleta, o que
ficou de fora e quantos itens estão sem tema. É a aba que impede o acervo de
parecer completo quando não está.

A página não carrega 788 ou 2.639 linhas como prop de cliente. Renderiza no
servidor, 50 por página, com contagem e facetas calculadas no build. [inferido:
regra 5.1 do `AGENTS.md`]

### 7.4 Como as três páginas se ligam

- **Notícia → biblioteca:** "Ver ficha na biblioteca" leva a
  `/paraopeba/biblioteca?aba=noticias&id=...`.
- **Notícia → linha do tempo:** "Na linha do tempo (N)" leva ao evento
  `#evento-...`.
- **Evento → notícias:** `/paraopeba/noticias?evento=...`.
- **Evento → documentos:** `/paraopeba/biblioteca?aba=documentos&evento=...`.
- **Documento → notícias:** `/paraopeba/noticias?documento=...`.
- **Filtro compartilhado:** `?tema=` e `?caso=` funcionam nas três páginas.
  Quem está em "auxílio emergencial" na biblioteca troca de aba sem perder o
  filtro. [inferido]

A alimentação é nos dois sentidos, mas não é cópia: o evento aponta para a
notícia e para o documento; a notícia aponta para o evento e para o documento;
a biblioteca lê os três. Corrigir o título de uma notícia aparece nas três
portas, porque todas leem a mesma linha. [inferido]

### 7.5 O que não muda

- `/paraopeba/clipping` continua no ar como acervo curado, com a mesma URL.
- `/paraopeba/documentos` continua no ar como visão dos autos do processo.
- `/paraopeba/biblioteca` é ampliada; o conteúdo das ATIs e do Pró-Brumadinho
  continua acessível, agora como subfiltro.
- `/biblioteca` (geral) continua separada; não é a biblioteca do caso.
- `/noticias` (blog) continua sendo o blog do portal, não clipping.
- `/memoria` continua sendo a linha do tempo histórica das lutas, não a linha
  do tempo do caso.
- Nenhuma URL antiga é apagada. [inferido: modelo "geral + específica" de
  `PROPOSTA-UNIFICACAO-DIREITOS-TERRITORIOS.md`]

### 7.6 Acessibilidade e payload

- `<main>` com `w-full`; teste em 390 px sem rolagem lateral.
- Texto de interface nunca abaixo de 12 px; descrição sob `<h1>` em `text-sm`.
- Data em `<time datetime>`; filtros com `<label>`; `aria-current` na aba.
- Tabela longa com `overflow-x-auto`.
- Nada de coleção grande como prop de cliente; paginação no servidor.
- O filtro funciona sem JavaScript, porque o estado está na URL. [inferido:
  padrão do `PainelFacetas` atual]

## 8. Plano por fases

| Fase | Entregável | Pré-requisito | Critério de aceite |
|---|---|---|---|
| **F0 — Contrato** | `lib/acervo/tipos.ts` + `temas.ts` + `sujeitos.ts` + testes de lista fechada | nenhum | `tsc` verde; teste falha se tema fora da lista entrar |
| **F1 — Ensaio de normalização** | `scripts/acervo/normalizar.mjs --seco` lê os JSONs atuais e grava `relatorio-normalizacao.json` | F0 | 100% das linhas de entrada mapeadas; 0 perda; relatório de duplicatas por URL, hash e título |
| **F2 — Acervo canônico** | `data/acervo-caso/{noticias,documentos,eventos,portais,processos,vinculos}.json` + `public/data/acervo-caso/` | F1 | origem e canônico explicados no relatório; IDs únicos; todo tema na lista; todo vínculo tem confiança e método |
| **F3 — Biblioteca do caso (MVP)** | `/paraopeba/biblioteca` com abas Notícias e Documentos, filtros e paginação | F2 | 788 + 471 linhas de origem mapeadas; duplicatas fundidas; contagem por tipo; 390 px; sem prop de coleção inteira |
| **F4 — Notícias unificadas** | `/paraopeba/noticias` com `?acervo=`, `?tema=`, `?caso=`, `?periodo=` e selo radar/curado | F2 | 108 do radar + 254 do clipping acessíveis; filtro compartilhável |
| **F5 — Linha do tempo enriquecida** | 23 marcos com `tema_ids`, `documento_ids`, `noticia_ids` e filtros | F2 | 23/23 com ao menos um tema; links abrem a biblioteca; CSV atualizado |
| **F6 — Cruzamento assistido** | `sugerir-vinculos.mjs` + fila de revisão + `revisao.jsonl` | F2, F5 | sugestões por regra; 0 vínculo `medio` publicado sem revisão; auditoria legível |
| **F7 — Coleta ética** | módulo comum de coleta; UA único; robots; pausa; checkpoint; `fontes-coleta.json` | F2 | rodada completa dos três coletores; 1–2 s por host; retomada testada; nada na CI |
| **F8 — Expansão documental** | PNAB, PEAB, CNDH, audiências públicas, decisões e ementas com tipo e tema | F0, F2 | cada tipo com N > 0; todo documento com URL, data e fonte; sem cópia de PDF de terceiro |
| **F9 — Operação** | verificador de links, relatório mensal de cobertura e selo de dados desatualizados | F6, F7 | link morto detectado; relatório publicado; página avisa a data da coleta |

Dependências:

```
F0 → F1 → F2 → F3 → F4 → F5 → F6 → F9
              └→ F7 ────────────────┘
              └→ F8
```

F7 e F8 podem correr em paralelo com F3–F6, desde que a taxonomia (F0) e o
acervo (F2) estejam prontos. F9 é a última porque depende de vínculo e coleta
estáveis. [inferido]

Ordem recomendada para a primeira entrega: **F0, F1, F2, F3**. É o menor
conjunto que já mostra a biblioteca do caso com notícias e documentos, sem
tocar em coletor nem em linha do tempo. F4 e F5 vêm depois, porque dependem do
mesmo acervo, mas mudam páginas que já têm leitor.

## 9. Riscos e limites

| Risco | Evidência | Mitigação |
|---|---|---|
| **Notícia é fonte secundária** | O próprio coletor diz que notícia não é fato oficial; o dado é "que algo foi noticiado" [medido] | Cartão sempre com portal, data e link; documento oficial quando existir; nunca tratar notícia como prova |
| **Data de edição pode mudar** | RSS não traz `dateModified`; só o blog tem `atualizadoEm` [medido] | Guardar `data_publicacao` e `verificado_em`; `data_edicao` só quando a fonte declarar; revisão não sobrescreve, versiona |
| **Link pode morrer** | Nenhum verificador de link no fluxo atual [medido] | `link_status` mensal; aviso na tela; não apagar o metadado; opcional espelho R2 para documento oficial |
| **Viés de portal** | 101 rótulos de portal, muitos são parte interessada (MAB, ATIs, Vale) [medido] | `tipo_fonte` e `nota` por portal; "parte interessada" visível; nunca somar como consenso |
| **Direito autoral** | O acervo atual guarda título, resumo e link, não o corpo [medido] | Manter a regra: título, resumo próprio curto, link; sem foto, sem PDF de matéria, sem transcrição |
| **Duplicata falsa** | Mesmo título pode ser fatos diferentes ("auxílio de agosto" em anos distintos) [inferido] | Dedupe por URL + data + portal; título sozinho nunca funde; revisão humana em caso de dúvida |
| **Classificação falsa** | "Vale do Javari", "atacante Mariana", "preparação" já entraram por radical [medido nos comentários dos coletores] | Termo de lugar no título; negativos; confiança; revisão; "sem tema" honesto |
| **Dado pessoal** | Notícia pode trazer nome, CPF, endereço; acervo de documentos já teve 35 resumos redigidos [medido] | Triagem antes de gravar; mod-11; redigir nome de vítima; nada de CPF em prompt |
| **Payload** | 788 itens na biblioteca e 2.639 linhas somadas; cliente atual recebe arrays [medido] | Paginação no servidor; 50 por página; sem coleção inteira como prop |
| **Escopo escorrega para Mariana/Rio Doce** | `biblioteca-desastres` já tem 291 itens de Mariana [medido] | `caso_id` desde o início; biblioteca do caso Brumadinho primeiro; Mariana depois, com o mesmo schema |
| **Coleta vira corrida** | Não há pausa nem checkpoint hoje [medido] | Módulo comum; 1–2 s; sequencial por host; limite por rodada; monitorar 429 |
| **Contagem divergente** | `/biblioteca` mede 794 nos arquivos e 882 no texto; a diferença é 424 − 336 teses [medido] | Uma única função de contagem; teste de paridade; o texto passa a declarar qual fatia soma |
| **Ementa inteira é obra de terceiro** | O acervo de jurisprudência tem 23.569 ementas [medido] | Guardar resumo próprio e link; ementa completa só se a fonte for pública e a licença permitir; decisão do dono |

## 10. Pendências que exigem decisão do dono

1. **Escopo do caso.** Só Brumadinho/Paraopeba na primeira biblioteca, ou já
   incluir Mariana/Rio Doce e Itatiaiuçu? Recomendação: Brumadinho primeiro,
   com `caso_id` pronto para os outros. O acervo de desastres já tem 291 itens
   de Mariana; misturar agora dobra o escopo e a revisão. [medido]
2. **Política de publicação.** O radar publica automaticamente e o vínculo
   espera revisão? Ou tudo espera revisão? Recomendação: notícia automática
   com título, data e link; vínculo automático só quando há número de processo
   ou lei; o resto na fila. [inferido]
3. **Rota da biblioteca.** Ampliar `/paraopeba/biblioteca` com abas, ou criar
   `/paraopeba/acervo`? Recomendação: ampliar a rota que já se chama
   biblioteca, para não criar uma terceira porta. [inferido]
4. **Resumo próprio.** O portal pode escrever resumo de matéria de terceiro,
   com etiqueta, ou só usar o snippet da fonte? Recomendação: resumo próprio
   de até 2 linhas, etiquetado e revisado; snippet só quando a licença da
   fonte permitir. [inferido]
5. **Arquivamento.** Guardar só metadado e link, ou espelhar documento oficial
   no R2 e notícia em serviço de arquivo? Recomendação: metadado para notícia;
   R2 só para documento oficial já público. [inferido]
6. **Modelo pago.** A classificação fica em regra + Ollama local, ou autoriza
   lote pago para os itens sem tema? Recomendação: regra + Ollama; lote pago
   só com custo calculado e "sim" prévio. [inferido: regra 5.17]
7. **Retenção.** Notícia fica para sempre ou expira? Recomendação: metadado
   para sempre; corpo nunca; documento oficial para sempre. [inferido]
8. **Dado órfão.** O que fazer com `noticias-desastres` (108, sem rota),
   `noticias-radar` (24), `biblioteca-desastres-unificada` (1.081) e
   `cnj-atos` (5.887, sem rota)? Recomendação: a biblioteca do caso absorve o
   que for do caso; o resto ganha página ou é declarado fora de escopo.
   [medido]

## O que já existe e o que muda

| Já existe | Muda |
|---|---|
| 254 itens de clipping em três curadorias | viram `Noticia` com `ocorrencias[]`; nenhuma curadoria se perde |
| 108 itens de radar (48 bacia + 60 Vale) | entram na mesma entidade; 8 URLs comuns deixam de contar duas vezes |
| 108 itens de desastres sem rota | entram na biblioteca com `caso_id`; a rota passa a existir |
| 23 marcos manuais | ganham tema, ator e vínculos com notícia e documento |
| 788 itens da biblioteca do Paraopeba | viram a aba `Documentos`; 645 ATIs deixam de ser cópia dos 936 |
| 471 autos do processo UFMG | viram `Documento` tipo `petição`, `decisão`, `ata`, `laudo` |
| 23.569 casos de jurisprudência | entram por referência, não por cópia; ementa e link |
| 1.016 audiências e 2.439 estudos | entram como tipos próprios, com link oficial |
| 9 relatórios de direitos humanos, 2 do CNDH | entram como `relatorio_tecnico`; recomendação destacada dentro deles vira `recomendacao` |
| `/paraopeba/analise` com 13 notícias e 16 eixos | vira a primeira prova de que o cruzamento funciona |
| 278 tags livres e 26 temas livres | são substituídos por 26 temas + 11 sujeitos; portal e ator ganham entidade própria |

O ganho não é "ter mais uma página". É ter **uma linha por fato**, com três
portas de leitura — notícia, documento e tempo — e a mesma resposta em todas.
[inferido]

## Origem / Histórico

- **08/11/2026 — proposta escrita.** Medição feita no worktree
  `resumos-realidade`, sem coleta na internet e sem implementação. Números de
  inventário conferidos contra os arquivos citados; números de notícia,
  documento e marco medidos nesta data.
