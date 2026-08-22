# Plano: ingestão do Painel Paraopeba e do acervo geocodificado da UFMG

> **Tipo:** HISTORICO
> **Domínio:** paraopeba
> **Última medição:** 2026-08-22
> **Leitura estimada:** curta (< 5 min)
> **Relacionados:** [README.md](../../README.md), [AGENTS.md](/AGENTS.md)
> **Palavras-chave:** historico, plano, entregue

## Sumário

- [Propósito](#propósito)
- [Resposta curta](#resposta-curta)
- [1. Fonte 1 — O Painel Paraopeba](#1-fonte-1-o-painel-paraopeba)
- [2. Fonte 2 — Os dados geocodificados do processo (UFMG, Solr)](#2-fonte-2-os-dados-geocodificados-do-processo-ufmg-solr)
- [3. Ordem sugerida — maior ganho para quem foi atingido, menor esforço primeiro](#3-ordem-sugerida-maior-ganho-para-quem-foi-atingido-menor-esforço-primeiro)
- [4. O que este plano NÃO decide](#4-o-que-este-plano-não-decide)
- [5. Lacunas declaradas](#5-lacunas-declaradas)

## Propósito

Duas fontes, pedidas juntas pelo dono, medidas separadamente porque não têm nada em comum tecnicamente: uma é um arquivo HTML estático entregue à mão (`painel-paraopeba.html`, 380 mil caracteres), a outra é um índice Solr vivo da UFMG já mapeado em `docs/PLANO-INTEGRACAO-BRUMADINHO.md`. Este docu...

Duas fontes, pedidas juntas pelo dono, medidas separadamente porque não têm
nada em comum tecnicamente: uma é um arquivo HTML estático entregue à mão
(`painel-paraopeba.html`, 380 mil caracteres), a outra é um índice Solr vivo
da UFMG já mapeado em `docs/PLANO-INTEGRACAO-BRUMADINHO.md`. Este documento
segue o mesmo padrão de rigor: tudo abaixo foi aberto, chamado ou contado de
verdade em 2026-08-13. Onde não confirmei, está escrito que não confirmei.

Lido antes de escrever: `docs/PLANO-INTEGRACAO-BRUMADINHO.md`,
`docs/FONTES-TERRITORIO-E-MINERACAO.md`, `apps/web/lib/betim/redeProtecao.ts`,
`apps/web/app/direitos-em-movimento/ajuda/page.tsx`,
`apps/web/lib/betim/paraopeba.ts`, `supabase/betim/migrations/0057_ref_municipios_mg.sql`,
`scripts/checar-dado-pessoal.py`.

---

## Resposta curta

| # | Pergunta | Achado |
|---|---|---|
| 1 | Onde o Painel encaixa sem virar silo? | **Não encaixa inteiro em lugar nenhum.** Ele mistura três coisas de valor muito diferente: uma lista de imprensa (ferramenta de assessoria, não conteúdo cívico), um clipping de notícias (envelhece), e um diretório de atores institucionais (isso sim tem valor cívico). Só a terceira parte merece ingestão. |
| 2 | Quantas entradas são novas frente a `redeProtecao.ts`? | **Medido: 16 das 18 organizações de `INST_DATA` não existem em `redeProtecao.ts` de forma alguma.** As outras 2 (MPMG, DPMG) já têm entrada — genérica, não específica do caso Brumadinho. Das 69 entradas de `PORTALS_DATA`, **60 são imprensa** (categoria que `redeProtecao.ts` nem tem) e as 4 que sobram (MAB, AEDAS, NACAB, Guaicuy) duplicam `INST_DATA`. |
| 3 | O clipping de 149 notícias entra como está? | **Não.** Entra como acervo datado (com corte visível) ou não entra — nunca como página "atual". Justificativa na seção 1.3. |
| 4 | Os números-resumo (R$ 21 bi, auxílio emergencial) têm fonte primária no portal? | **Não hoje.** O programa que esses números descrevem (Novo Auxílio Emergencial / PNAB, dez/2025 em diante) **não tem nenhum pipeline no portal** — `lib/betim/paraopeba.ts` cobre um programa diferente e já encerrado (PTR/Acordo 2021, migration 0022). Não publicar sem re-apurar na FGV/TJMG diretamente. |
| 5 | Licença/autoria do Painel? | **Não declarada no arquivo — checado, não presumido.** Sem meta `author`, sem rodapé de crédito, sem aviso de copyright/licença em lugar nenhum das 2.900+ linhas. Cada notícia individual cita sua fonte (`source`/`portal`), mas o painel em si não diz quem o construiu. Pergunta em aberto para o dono, não decidida aqui. |
| 6 | O índice da UFMG tem campo de local? | **Sim, um: `places`.** Medido ao vivo hoje: 1.293 dos 7.107 documentos (18,2%) têm o campo preenchido; só 471 documentos (6,6% do total) trazem um valor que bate, por nome normalizado, com um dos 853 municípios de MG. O resto é nome de barragem, comunidade, rio, bacia ou região — não é campo de município puro. |
| 7 | Dá para virar camada de mapa? | **Sim, como camada fraca e assim rotulada — não como geocodificação de verdade.** Sem lat/lon (confirmado, de novo, hoje: nenhum campo de coordenada em `fl=*`). O valor é "quantos documentos citam este município", não "onde o processo aconteceu". |

---

## 1. Fonte 1 — O Painel Paraopeba

### 1.1 Confirmação da estrutura (o dono já tinha mapeado certo)

Reabri o arquivo (`painel-paraopeba.html`, 391.941 bytes) e contei cada
array programaticamente, não de olho:

| Array | Contagem medida | Bate com o que o dono descreveu? |
|---|---:|---|
| `NEWS_DATA` | **149** itens | Sim |
| `PORTALS_DATA` | **69** itens | Sim |
| `INST_DATA` | **18** itens (3 judiciário + 3 MP + 1 gestora + 6 movimento/ATI + 4 poder público) | Sim |
| `MILESTONES` | **17** marcos | Sim |
| `PAYMENTS` | **9** registros mensais | Sim |
| `DATA_PANEL` | 8 pares número/legenda (não é lista) | Sim |

Confirmado também o achado do dono sobre coordenada: não existe `lat`/`lng`
em lugar nenhum do arquivo — vasculhei o texto inteiro atrás de padrão de
coordenada e o único "lat" que aparece é dentro de "relator"/"relatando".
**Não há camada de mapa possível a partir deste arquivo.**

`NEWS_DATA.portalType` medido por contagem real (não pela legenda do
app): `institucional` 12, `imprensa` 81, `movimento` 16, `assessoria` 40 —
soma 149, bate. `PORTALS_DATA.type`: `institucional` 5, `imprensa` **60**,
`movimento` 1, `assessoria` 3 — soma 69, bate.

### 1.2 O que cada parte do Painel realmente é — e por que elas não são a mesma coisa

O Painel mistura três públicos diferentes, cada um com destino próprio:

- **`PORTALS_DATA` (69, das quais 60 imprensa) é uma lista de assessoria de
  imprensa** — nome do veículo, e-mail de pauta ou formulário de contato,
  descrição de cobertura. Serve para QUEM QUER PAUTAR um jornalista (Folha,
  Reuters, The Guardian, Al Jazeera, Mining Watch Canada...). Isto não é
  conteúdo cívico para quem chega no Controle Popular atrás de "o que
  aconteceu" ou "onde peço ajuda" — é ferramenta de trabalho de uma equipe
  de comunicação (provavelmente de uma das ATIs, dado que Guaicuy, AEDAS e
  NACAB aparecem tanto em `PORTALS_DATA.assessoria` quanto em `INST_DATA`).
  **Não tem onde entrar no portal hoje, e não deveria: o portal não tem
  seção "lista de imprensa para pautar".**
- **`NEWS_DATA` (149) é clipping — notícia sobre o caso, com data e
  fonte.** Tem valor histórico real, mas envelhece (seção 1.3).
- **`INST_DATA` (18) é o diretório de quem atua na reparação** — é a única
  parte com formato parecido ao de `redeProtecao.ts` (`nome`, `role`,
  `contacts[]`). É a parte que vale a pena medir contra o que o portal já
  tem — seção 1.4.

### 1.3 O clipping envelhece — decisão, não perpetuação

Medido: `NEWS_DATA` vai de **2024-04-08 a 2026-07-30** — a notícia mais
recente tem cerca de duas semanas (hoje é 2026-08-13), a mais antiga mais de
dois anos. O array é hardcoded no HTML, sem API, sem RSS, sem endpoint por
trás — é um snapshot manual de quem monta o painel.

**Decisão: acervo datado, nunca página "ao vivo".** Três frases justificam:

1. Não existe fonte estruturada por trás para alimentar atualização
   automática — os 69 portais de origem são 69 sites diferentes, sem API
   comum. Prometer atualização automática seria escrever um cheque que o
   projeto não pode descontar.
2. A doutrina do projeto (já em prática noutras partes do portal) é: dado
   que não se atualiza sozinho e é apresentado como se fosse atual é mentira
   silenciosa. Um clipping de "até 30/07/2026" rotulado como tal é honesto;
   o mesmo clipping sem data visível na tela é enganoso a partir do dia
   seguinte.
3. **A alternativa melhor que ingerir é linkar.** O próprio Painel diz, em
   duas entradas (`PORTALS_DATA` e `INST_DATA`), que o Instituto Guaicuy
   "Mantém o Painel da Reparação atualizado" — ou seja, já existe uma fonte
   viva, mantida por quem tem informação de primeira mão (a ATI), em
   `guaicuy.org.br`. Reproduzir 149 notícias congeladas no Controle Popular
   compete com essa fonte viva em vez de apontar para ela.

**Proposta**: se o clipping entrar, entra como arquivo histórico
("cobertura midiática de abr/2024 a jul/2026, coletada por [autoria a
confirmar — seção 1.5]") linkado a partir da seção que
`docs/PLANO-INTEGRACAO-BRUMADINHO.md` (2.8) já identificou —
`/[municipio]/meio-ambiente/paraopeba` — com um link de saída para o Painel
da Reparação do Guaicuy como a fonte que continua viva. Nunca como página
que parece atualizada.

### 1.4 Sobreposição medida com `redeProtecao.ts`

`redeProtecao.ts` tem hoje 3 blocos: `LAI_ESTADUAL` (3 itens: CGE-MG, TCE-MG,
MPMG), `LAI_FEDERAL` (5 itens: Fala.BR, INCRA, IBAMA, ANA, ANM) e
`REDE_ITENS` (22 itens: Defensoria, MPMG e seus CAOs, delegacias
especializadas de BH, CRAS/CREAS/Conselho Tutelar, ALMG-CDH, RENAP,
DAJ-UFMG, SAJ-PUCMinas, CNDH, três OABs). Total: **30 itens curados**, todos
identificados por organização.

Cruzei cada organização de `INST_DATA` (18) e da fatia não-imprensa de
`PORTALS_DATA` (`movimento`+`assessoria`+`institucional`, 9 itens) contra o
nome de organização em `redeProtecao.ts`:

| Organização do Painel | Já existe em `redeProtecao.ts`? |
|---|---|
| MPMG — Procuradoria de Justiça | **Sim** — como `rede-mpmg` (canal de denúncia genérico), não como parte do caso Brumadinho |
| DPMG — Defensoria Pública MG | **Sim** — como `rede-defensoria-mg` (atendimento genérico), não como parte do caso |
| ALMG (só em `PORTALS_DATA`, portal de imprensa) | Parcial — `redeProtecao.ts` tem ALMG-CDH (Comissão de Direitos Humanos), função diferente da do Painel (contato de imprensa) |
| TJMG (vara específica), STF, STJ, MPF, FGV, MAB, AEDAS, NACAB, Instituto Guaicuy, ABA, Ascotélite, IEM, Prefeitura de Brumadinho, Câmara dos Deputados, AGU, Presidência da República | **Não — 16 organizações, zero sobreposição** |

**Resultado: 16 das 18 organizações de `INST_DATA` (88,9%) são inteiramente
novas para o portal.** Nenhuma delas aparece em `LAI_ESTADUAL`,
`LAI_FEDERAL` ou `REDE_ITENS` sob nenhum nome. Das 69 entradas de
`PORTALS_DATA`, a sobreposição real é ainda menor: as 60 de imprensa não têm
equivalente algum (`redeProtecao.ts` não tem categoria de imprensa), e as 9
que sobram são as mesmas organizações já contadas em `INST_DATA`.

### 1.5 Onde entram, e onde não entram — por natureza do item, não por atalho

Nem todo item novo de `INST_DATA` serve ao mesmo propósito de
`redeProtecao.ts`. `redeProtecao.ts` é doutrinariamente "onde eu busco ajuda
concreta agora" (telefone, endereço, prazo) — não é "quem são os atores de
um processo judicial". Aplicando esse filtro aos 16 novos:

- **Servem ao padrão de `redeProtecao.ts` (contato acionável para quem foi
  atingido)**: AEDAS, NACAB, Instituto Guaicuy (as três ATIs — o item que
  motivou a tarefa: "onde buscar ajuda" para quem foi atingido é
  literalmente a assessoria técnica da sua região), MAB (organização,
  contato de articulação) e FGV (0800 032 8022 — dúvida sobre pagamento,
  telefone confirmado no próprio `INST_DATA`).
- **Não servem** — são atores institucionais do processo, não canais de
  atendimento ao atingido: TJMG (vara específica), STF, STJ, MPF (a
  Procuradoria Regional, não um canal de atendimento), Câmara dos
  Deputados, AGU, Presidência da República, Prefeitura de Brumadinho, ABA e
  IEM (associações autoras da ação, sem canal de contato próprio — `IEM` e
  `Ascotélite` têm `contacts:[]` vazio no próprio Painel).
- **Duas organizações (MPMG, DPMG) já têm entrada genérica**: a melhor
  ação aqui não é duplicar, é considerar (decisão de UI, não decidida
  aqui) se a entrada existente ganha uma `nota` mencionando o caso
  Brumadinho especificamente.

**Conclusão de encaixe**: os 5 itens acionáveis (AEDAS, NACAB, Guaicuy, MAB,
FGV) não cabem bem na taxonomia de `Necessidade` de `redeProtecao.ts` — não
existe `"reparacao_barragem"` nem equivalente entre as 11 necessidades
atuais, e forçar em `meio_ambiente_terras` esconderia o motivo real de
alguém procurar. **Proposta**: os 5 entram como uma seção "Quem atua na
reparação" dentro de `/[municipio]/meio-ambiente/paraopeba` — a página que
`docs/PLANO-INTEGRACAO-BRUMADINHO.md` (2.8) já identificou como o lugar
natural para conteúdo de Brumadinho — e não em `redeProtecao.ts`. Isso
resolve "sem virar silo" ao estender uma página que já existe, sem forçar
taxonomia que não serve.

### 1.6 Números sem procedência — o que cada um precisa antes de publicar

`DATA_PANEL.note` já confessa a própria fragilidade: "Valores baseados em
decisões judiciais, manifestações da FGV e comunicados do TJMG até junho de
2026" — isto é uma AGREGAÇÃO feita por quem montou o Painel, não uma fonte
única citável. Medido contra o que o portal já ingere:

- **`lib/betim/paraopeba.ts`** (migration 0022, `etl/apis/fgv_paraopeba.py`)
  já traz dado real da FGV — mas é o **PTR/Acordo Geral de Reparação de
  2021**, encerrado em outubro de 2025 (confirmado pelo próprio
  `MILESTONES` do Painel: `"2025-10-01: Encerramento PTR"`.
- **O programa que os números do `DATA_PANEL` descrevem majoritariamente —
  o Novo Auxílio Emergencial (PNAB, Lei 14.755/2023, a partir de
  dez/2025) — não tem NENHUM pipeline no portal hoje.** Confirmado: busca
  por "auxílio emergencial"/"NAE"/"novo_auxilio" no código do portal não
  achou tabela nem coletor.

**O que cada número precisaria, antes de publicar:**

| Número do Painel | Fonte primária a buscar |
|---|---|
| `R$ 21 bilhões+` (total histórico) | Não é um número — é soma de três programas diferentes (auxílio 2019–2021, PTR 2021–2025, Novo AE dez/2025+). Decompor e citar cada um separado, com fonte própria. |
| `162 mil` beneficiários do NAE | Relatório da FGV citado pelo próprio Painel ("162.061 em maio/2026") — buscar o relatório FGV real, não repetir o número do Painel |
| `R$ 133,1 mi/mês` (NAE) | Portal `ptr.fgv.br` / comunicados FGV — mesmo domínio que `PORTALS_DATA` já lista como fonte institucional |
| `R$ 1,05 bi+` acumulado Novo AE | Atribuído no próprio Painel ao Ibram — buscar o dado do Ibram, não repassar de segunda mão |
| `Crítico — PGR contra` (status judicial) | Isto é interpretação, não número — não publicar como se fosse dado, é leitura editorial do andamento da ADPF 1314 |

Nenhum destes deve ser publicado citando "Painel Paraopeba" como fonte —
mesma doutrina que rejeitaria citar Wikipédia como fonte primária de um
número financeiro.

### 1.7 Licença e autoria — não encontrado, não presumido

Vasculhei o arquivo inteiro: `<head>` só tem `charset` e `viewport` (sem
`meta name="author"`, sem `generator`); busquei por
`autor|copyright|©|direitos reservados|licença|elaborado por` no arquivo
inteiro — os únicos resultados são as fontes de CADA notícia individual
(`source:"Instituto Guaicuy"`, `source:"Portal MPMG"` etc.), nunca uma
declaração sobre quem construiu o painel em si. O `<title>` é "Painel
Paraopeba — Cobertura Midiática".

**Não decidido aqui, porque não posso decidir**: se este arquivo foi
construído pelo dono, por uma das ATIs (o texto interno soa como ferramenta
de assessoria de imprensa de uma ATI — ver 1.2), ou baixado de terceiro.
Antes de republicar qualquer trecho — sobretudo o clipping (1.3) e a lista
de imprensa (1.2, que decidimos não ingerir de qualquer forma) — o dono
precisa confirmar a origem. Os itens individuais (nome de órgão, telefone,
URL) são fato, não obra protegida — isso pode entrar independente da
resposta. O que depende da resposta é publicar o PAINEL como está (design,
os 149 resumos escritos, a curadoria de quais 69 portais entraram).

---

## 2. Fonte 2 — Os dados geocodificados do processo (UFMG, Solr)

### 2.1 O campo de local existe — medido ao vivo, hoje

Reconfirmei o endpoint (`http://plataforma.projetobrumadinho.ufmg.br/solr/platform/select`)
está no ar: `numFound: 7107`, igual ao medido em
`docs/PLANO-INTEGRACAO-BRUMADINHO.md`. Esse documento tinha marcado
`places` como lacuna ("vi na estrutura, não medi"). Medido agora:

```
q=places:*  →  numFound: 1293   (18,2% dos 7.107 documentos)
```

`places` é um array de string livre, não um campo estruturado com
`municipio`/`uf` separados. Amostra real (`fl=id,process_number,title,places`):

```json
{"id":"61128496", "places":["bacia hidrográfica do rio paraopeba","brumadinho-mg",
  "são joaquim de bicas-mg","mário campos-mg","betim-mg","juatuba-mg",
  "florestal-mg","esmeraldas-mg","pará de minas-mg"]}
```

Confirmado de novo, em dois documentos completos (`fl=*`) de processos
diferentes: **não existe campo de coordenada, `lat`, `lon`, `municipio` nem
`comarca` no schema.** `places` é o único campo geográfico que o índice
tem.

### 2.2 Qualidade medida do campo — é pista, não geocodificação

Facetei `places` por inteiro: **482 valores distintos, 3.470 menções** (um
documento pode citar vários lugares). Cruzei cada um dos 482 valores,
normalizado (minúsculo, sem acento, sufixo `-mg` removido), contra os 853
municípios de `apps/web/public/terras/globo/dados/camadas/municipios-mg.geojson`:

| Medida | Valor |
|---|---:|
| Valores distintos em `places` | 482 |
| ...dos quais batem com nome de município de MG | **81** |
| Menções que batem com município | 1.153 de 3.470 (33,2%) |
| **Documentos com ≥1 valor batendo em município** | **471 de 7.107 (6,6% do total; 36,4% dos 1.293 com `places` preenchido)** |
| Documentos com `places` preenchido mas SEM nenhum valor de município | 822 |
| Processos (dos 16) com ≥1 documento georreferenciável por município | **10** |

Os 401 valores que não batem são nome de barragem (`barragem vi`, 311
menções; `barragem bi`, 250), comunidade (`comunidade de ponte das
almorreimas`, 104), rio/bacia (`rio paraopeba`, `bacia do rio das velhas`),
região administrativa (`região 2`, `rmbh`), sítio arqueológico, ou o mesmo
município grafado sem padronizar (`mario campos` sem acento e sem `-mg`,
coexistindo com `mário campos-mg`) — a UFMG não normalizou o campo, é
anotação humana/IA de apoio à busca dentro da própria Plataforma, não um
gazetteer.

**Municípios mais citados** (por nº de documentos, não de menções):
Brumadinho (194), São Joaquim de Bicas (81), Mário Campos (67), Pará de
Minas (58), Paraopeba (57), Pompéu (49), Mariana (46), Juatuba (42),
Curvelo (41), Betim (39) — coerente com a geografia real da bacia do
Paraopeba, o que dá confiança de que o campo, apesar de sujo, tem sinal
real.

### 2.3 Proposta honesta: camada fraca, com taxa de cobertura publicada

Isto responde diretamente a ambas as perguntas do dono:

1. **Sim, dá para virar camada** — join por nome normalizado entre
   `places` e `ref_municipios_mg`/`municipios-mg.geojson`, contando
   documentos por `id_ibge`. O padrão de normalização já existe no projeto
   (`ref_municipios_mg` usa `pg_trgm`/`similarity()` para bater nome de
   fonte externa contra os 853 municípios — mesma receita, mesmo
   catálogo).
2. **Mas cobre só 6,6% do acervo diretamente**, e é caracterização por
   TAG, não por local do fato: um documento marcado "brumadinho-mg" pode
   ser sobre um evento em Brumadinho, ou sobre uma pessoa residente lá, ou
   sobre um trecho que apenas MENCIONA Brumadinho — o campo não distingue.
   **Rótulo obrigatório na camada: "documento que CITA este município",
   nunca "documento SOBRE este município" nem "evento neste município".**
3. Para os 5.814 documentos sem `places` (81,8%), a alternativa que o dono
   cogitou — inferir município a partir de `summary_pt` por regex/NLP — é
   tecnicamente possível, mas é **inferência nova, não extração de campo
   existente**, e precisa da mesma régua que o projeto já aplica em outro
   lugar (taxa de erro medida e publicada, como no vazio cadastral):
   sortear uma amostra (mesma ordem de grandeza do passo 2 da seção 3 de
   `docs/PLANO-INTEGRACAO-BRUMADINHO.md`, ~200 documentos), rodar a
   inferência, conferir à mão, publicar precisão/recall junto da camada, e
   marcar cada documento inferido com `places_fonte: "inferido"` distinto
   de `places_fonte: "ufmg"` — nunca misturar as duas proveniências sem
   rótulo.

**Ordem recomendada**: primeiro ingerir só os 471 documentos com `places`
batendo em município (campo já existe, zero inferência nova, custo
imediato), rotulado como cobertura parcial. Medir a inferência sobre o
resto como segunda etapa, só se o ganho justificar o trabalho de amostragem
e auditoria.

### 2.4 O que muda na etapa de dado pessoal

`docs/PLANO-INTEGRACAO-BRUMADINHO.md` (seção 3) já mediu o risco real deste
acervo — ~90 documentos (1,3%) de tipo pessoal, e resumo que pode conter
iniciais e dado de saúde mesmo em tipos "catch-all" — e já propôs a régua de
triagem (filtro por `type`, amostragem estratificada, varredura textual de
CPF sobre `summary_pt`, nunca publicar `authors` como texto livre buscável).
**Este plano de geocodificação usa o MESMO acervo — a régua já vale, sem
reabrir.**

O que a geocodificação acrescenta ao risco, especificamente: hoje
`checar-dado-pessoal.py` varre `*.py`/`*.ts`/`*.md`/`*.json`/`*.html`
rastreados no git via `git grep`, com regra de CPF mod-11 e padrões de
segredo — mas **não pega "L.H.M.G." nem texto livre sensível**, e essa
lacuna já estava registrada. Uma camada de mapa por município tem um risco
adicional específico que o documento anterior não cobriu: **juntar um
resumo sensível a um PINO NO MAPA aumenta a capacidade de re-identificação**
mais do que o mesmo resumo solto numa lista — a mesma lógica de
`docs/FONTES-TERRITORIO-E-MINERACAO.md` (seção 1.3) sobre não aumentar a
precisão de `remanejamento_pto` para não apontar residência específica.

**Regra proposta para esta camada, adicional à régua já existente**: a
camada de mapa mostra CONTAGEM por município (`Brumadinho: 194 documentos`)
e, no máximo, `type`/`theme_pt` agregados — nunca lista `title`/`summary_pt`
individual navegável a partir do pino sem primeiro passar pelo filtro de
`type` pessoal e pela amostragem da seção 3 do documento anterior. Contagem
agregada por município não expõe o resumo de ninguém; lista de documento por
documento, sim.

### 2.5 Licença e citação

Já resolvido em `docs/PLANO-INTEGRACAO-BRUMADINHO.md` (seção 2.7), não
reaberto aqui: processo coletivo é público por natureza (CPC art. 189,
LOMAN), a Plataforma já publica o acervo, e a regra de atribuição já
proposta ("Plataforma Brumadinho UFMG" com link ao documento de origem, e
resumo citado como citação, não reescrito) vale igual para a camada
geográfica — é o mesmo dado, só agrupado por município em vez de por
processo.

---

## 3. Ordem sugerida — maior ganho para quem foi atingido, menor esforço primeiro

1. **`INST_DATA` → seção "Quem atua na reparação" em
   `/[municipio]/meio-ambiente/paraopeba`** (seção 1.5): 5 organizações
   acionáveis (AEDAS, NACAB, Guaicuy, MAB, FGV), zero dado pessoal
   envolvido, zero ambiguidade de licença (são fatos institucionais:
   nome, telefone, site). Maior ganho imediato para quem foi atingido e
   está lendo o portal — "quem eu procuro" é a pergunta mais direta que
   este material responde.
2. **Camada "documentos que citam este município" a partir dos 471
   documentos já geocodificáveis do Solr** (seção 2.3, primeira etapa):
   campo já existe na UFMG, zero inferência nova, dado agregado (contagem),
   sem exposição de resumo individual. Reaproveita `ref_municipios_mg`, que
   já existe.
3. **Link de saída para o Painel da Reparação do Guaicuy**, em vez de
   ingerir o clipping de 149 notícias — custo quase zero (é um link), maior
   honestidade que replicar conteúdo que vai desatualizar no dia seguinte.
4. **Decisão do dono sobre autoria do Painel** (seção 1.7) antes de
   qualquer publicação que cite o Painel como fonte de texto (resumos de
   notícia, curadoria de portais) — os fatos isolados (nome de órgão,
   telefone) do item 1 já podem seguir sem esperar essa resposta.
5. **Amostragem para inferir município nos 5.814 documentos sem `places`**
   (seção 2.3, segunda etapa) — maior esforço (amostragem +
   auditoria manual + medição de taxa de erro), maior cobertura. Só depois
   dos itens acima, e só se o ganho de cobertura (de 6,6% para
   potencialmente muito mais) justificar o trabalho.
6. **Números do `DATA_PANEL`/`PAYMENTS`** (seção 1.6): não entram até
   re-apurados na fonte primária (FGV/Ibram) — é o item de maior esforço
   relativo (exige um coletor novo, programa ainda não coberto pelo
   portal) para um ganho que hoje o portal já entrega parcialmente via
   `paraopeba.ts` para o programa anterior.

---

## 4. O que este plano NÃO decide

- Se a entrada de MPMG/DPMG em `redeProtecao.ts` ganha uma `nota`
  mencionando o caso Brumadinho — decisão de conteúdo, não de fonte.
- O nome exato da nova `Necessidade` (se um dia a "reparação por barragem"
  virar categoria própria) — mesma classe de decisão de UI que
  `docs/PLANO-INTEGRACAO-BRUMADINHO.md` (seção 5) já deixou em aberto para
  a zona de busca.
- Se a segunda etapa da geocodificação (inferência por texto, seção 2.3)
  vale o esforço — depende de quanto peso o dono quer dar a cobertura
  completa vs. 6,6% honesto e pronto.
- Se o clipping de 149 notícias entra mesmo como arquivo histórico, ou fica
  só o link para o Guaicuy — depende da resposta de autoria (seção 1.7).

---

## 5. Lacunas declaradas

- **Autoria/licença do Painel não identificada** (seção 1.7) — vasculhado
  o arquivo inteiro, nenhuma declaração encontrada. Pergunta em aberto ao
  dono, não resolvida por suposição.
- **Não confirmei se os 9 valores de `PAYMENTS` (Novo Auxílio Emergencial,
  dez/2025–ago/2026) batem com os comunicados reais da FGV** — só medi que
  não existe pipeline no portal para eles hoje. Conferir contra
  `ptr.fgv.br` é passo futuro, não feito aqui.
- **Não medi taxa de erro de nenhuma inferência textual** — porque não fiz
  nenhuma inferência textual; a seção 2.3 só usa o campo `places` que a
  UFMG já preenche. Se a segunda etapa (inferir os 5.814 documentos sem
  `places`) for adiante, a taxa de erro é o primeiro produto a gerar, antes
  da camada.
- **Não abri as 60 URLs de `PORTALS_DATA.imprensa`** para verificar se
  ainda respondem — decidido que a categoria inteira não entra no portal
  (seção 1.2), então a verificação individual não teria valor para este
  plano.
- **Os 401 valores de `places` sem correspondência em município** (barragem,
  comunidade, rio, bacia, região) não foram classificados um a um — dá para
  extrair valor deles no futuro (ex. "documentos que citam a Barragem VI"),
  mas fica fora do escopo desta rodada, que era especificamente
  geocodificação por município.

---

*Levantado em 2026-08-13. `NEWS_DATA`, `PORTALS_DATA`, `INST_DATA`,
`MILESTONES`, `PAYMENTS` contados programaticamente sobre o arquivo
entregue, não por leitura visual. O endpoint Solr da UFMG foi chamado ao
vivo nesta data (`q=places:*`, facet completo de `places`, `fl=*` em dois
documentos, facet de `process_number`) — as contagens da seção 2 são
medidas diretas sobre a resposta, não estimativas. O cruzamento contra
município usa os 853 nomes de
`apps/web/public/terras/globo/dados/camadas/municipios-mg.geojson`. O que
não foi confirmado está marcado como tal.*
