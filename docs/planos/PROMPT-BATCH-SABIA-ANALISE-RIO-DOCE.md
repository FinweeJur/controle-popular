# Prompt do batch — análise de teses, estatística e jurimetria (Rio Doce)

> **Tipo:** PLANO
> **Domínio:** jurisprudência
> **Última medição:** 2026-11-03
> **Leitura estimada:** media (5-15 min)
> **Relacionados:** [PLANO-ANALISE-INTEGRADA-03-11.md](PLANO-ANALISE-INTEGRADA-03-11.md), [PROMPT-POLO-RIODOCE-ANTIGRAVITY.md](PROMPT-POLO-RIODOCE-ANTIGRAVITY.md), [REGRAS-DURAS.md](../03-desenvolvimento/REGRAS-DURAS.md), [QUALIDADES-DA-INFORMACAO.md](../04-arquitetura/QUALIDADES-DA-INFORMACAO.md)
> **Palavras-chave:** prompt, batch, sabia, jurimetria, teses, guaicuy, nacab, pnab, fontes, custo

## Sumário

- [O que já está pronto](#0-o-que-já-está-pronto-para-esta-análise)
- [Por que duas etapas](#1-por-que-duas-etapas)
- [System prompt](#2-system-prompt)
- [Payload da etapa 2](#3-payload-da-etapa-2-o-que-vai-no-user)
- [Ficha do caso (Guaicuy)](#31-ficha-do-caso--o-que-o-guaicuy-mede-e-entra-na-etapa-1)
- [Como o RAG entra](#4-como-o-rag-entra-e-onde-não-entra)
- [Custo e modalidade](#5-custo-e-modalidade-preço-de-03112026)
- [Aceite](#6-aceite-auditável-não-retórico)

**Não enviado.** Este é o texto que irá ao lote. Precisa da revisão do dono antes
de sair (§5.17) — o custo estimado está no fim.

## 0. O que já está pronto (para esta análise)

| Peça | Estado |
|---|---|
| Acervo Rio Doce | 5.362 casos, 0 sem tese, 0 sem polo, 0 sem resumo |
| Jurimetria determinística | `relatorios/JURIMETRIA-RIO-DOCE.md` + `.json` |
| Teses canônicas | `tabelas/teses-canonico.csv` (regra de termo, sem modelo) |
| Metodologia de referência | NACAB, *Pesquisa Jurisprudencial* (2023), p.5-9 (em `fontes-externas/`) |
| Literatura | 118 artigos verificados na Crossref, na biblioteca dos crimes e no índice do RAG |

Nenhum número desta análise é escrito por modelo: ele recebe os números prontos
e escreve a leitura. É a diferença entre **medir** e **opinar sobre a medida**.

## 1. Por que duas etapas

1. **Etiquetar caso a caso** (5.362 chamadas): cada acórdão recebe mérito
   enfrentado, categoria da tese, argumentos e eixo de dano — prompt em
   `docs/PROMPT-BATCH-SABIA-RIO-DOCE.md`.
2. **Sintetizar** (1 chamada): o modelo recebe a tabela agregada da etapa 1, a
   jurimetria determinística e a lista fechada de literatura, e escreve a
   análise. **É este prompt que está abaixo.**

A etapa 2 é barata. A cara é a etapa 1, e ela só vale se a etapa 2 não inventar.

## 2. System prompt

```
Voce escreve a analise jurisprudencial de um acervo de decisoes do TJMG e do
TJES sobre o desastre do Rio Doce (rompimento da barragem de Fundao, Mariana,
2015). Responda em portugues do Brasil, texto corrido com tabelas, sem enfeite.

REGRA ZERO: o bloco DADOS e a unica fonte de numero. Voce NAO calcula, NAO soma,
NAO arredonda, NAO estima e NAO inventa numero. Se um numero nao esta em DADOS,
voce nao escreve esse numero. Se precisar de um numero que nao existe, escreva
"nao medido" e diga o que faltaria medir.

REGRA UM: o bloco FONTES e a unica fonte de literatura. Cite pelo sobrenome e
ano exatamente como aparece ali. Proibido citar trabalho que nao esteja na
lista, mesmo que voce conheca.

REGRA DOIS: separe sempre tres coisas, e nao misture:
  (a) o que as decisoes dizem  -> sustentado por N e por categoria de tese;
  (b) o que a literatura sustenta -> com a chave da FONTE;
  (c) o que nao se sabe -> declarado como lacuna, sem preencher com plausivel.

REGRA TRES: "reparacao integral" nao e conclusao. Se usar a expressao, diga o
que foi medido e o que nao foi.

REGRA QUATRO: valor de indenizacao so aparece com o N ao lado e com a frase
"casos em que o valor foi localizado". Sem esse N, o numero vira media falsa
do acervo.

ESTRUTURA OBRIGATORIA (sete secoes, nesta ordem):
1. Nota metodologica: o que e contagem deste acervo e o que e leitura de modelo;
   quantos casos ficaram sem variavel legivel e por que.
2. Retrato quantitativo: favorabilidade, quem recorre, taxa por comarca, por
   relator, por camara e por turma, sempre com a base (N decididos) declarada.
3. Teses predominantes e teses perdedoras: para cada uma, N, sentido dominante
   e o que a decisao enfrentou (merito ou preliminar).
4. Divergencias: mesma tese com os dois sentidos, com orgao nomeado dos dois
   lados. Divergencia sem orgao nomeado nao entra.
5. O que a literatura acrescenta e o que ela nao decide: ligue achado cientifico
   a tese juridica sem transformar artigo em prova de processo.
6. Lacunas: o que o acervo nao permite responder.
7. Questoes de pesquisa: cinco, com a justificativa de cada uma.

PROIBIDO: previsao de resultado, tom de parecer e qualquer frase que sugira que
o portal conclui por juiz. Adjetivo que qualifica o FATO e permitido ("dano
grave", "contaminacao persistente"); adjetivo que qualifica a PESSOA nao
("juiz leniente", "empresa cruel").
```

## 3. Payload da etapa 2 (o que vai no user)

```
DADOS (contagem determinística; nenhum número aqui foi escrito por modelo):

universo: 5.362 casos na frente Rio Doce
  com inteiro teor: 2.172
  com tese canônica: 5.362
  com recorrente e resultado legíveis: 1.544
  sem variável legível: 3.818  (motivo: resumo sem recorrente/resultado)

favorabilidade (NACAB p.8; % sobre os 1.544 decidíveis):
  desfavorável ao atingido: 971 (62,9%)
  totalmente favorável: 391 (25,3%)
  parcialmente favorável: 182 (11,8%)

por recorrente (N / favorável a ele / desfavorável a ele):
  atingido: 1.395 / 418 / 774
  empresa:    670 / 155 / 197

taxa de favorável por comarca (mín. 20 casos; base = casos decididos):
  Governador Valadares 354 casos, 225 decididos, 56.0%
  Mariana 267 casos, 191 decididos, 37.2%
  Ponte Nova 203 casos, 75 decididos, 24.0%
  Aimores 187 casos, 142 decididos, 5.6%
  Ipatinga 130 casos, 110 decididos, 24.5%

taxa de favorável por relator (mín. 50 casos; base = casos decididos):
  Des.(a) Maria Lúcia Cabral Caruso 1564 casos, 804 decididos, 39.6%
  Des.(a) Saldanha da Fonseca 477 casos, 361 decididos, 6.6%
  Des.(a) Juliana Campos Horta 179 casos, 6 decididos, 16.7%
  Des.(a) Octávio de Almeida Neves 77 casos, 71 decididos, 84.5%
  Des.(a) Monteiro de Castro 59 casos, 35 decididos, 48.6%

por câmara e por turma: NÃO MEDIDO. O acervo só traz órgão julgador em 1.039
  casos, e neles o resultado está indeterminado; nos 1.544 decididos o campo
  'órgão' guarda o nome do relator. A etapa 1 preenche câmara e turma lendo o
  cabeçalho da ementa; até lá não se publica taxa por câmara.

teses mais frequentes (N):
  prescrição da pretensão indenizatória 716 | gratuidade de justiça 338
  inversão do ônus da prova 333 | dano moral 264 | legitimidade 136

valores fixados (onde há número com cara de real): 75 casos, mediana R$ 30.000,
mínimo R$ 0, máximo R$ 850.000. Fora desses, "não consta".

FONTES — artigos (25 chaves, DOI conferido na Crossref; citar por chave):
  água e sedimento: alcantara2020 (10.1016/j.jag.2020.102119) | thompson2019 (10.1016/j.scitotenv.2019.135914) | pacheco2023 (10.1016/j.apgeochem.2023.105644)
  biota e peixe: vergilio2020 (10.1038/s41598-020-62700-w) | parente2020 (10.1016/j.envres.2020.110526) | pacheco2021 (10.1016/j.scitotenv.2021.151157)
  saúde humana: freitas2019 (10.1590/0102-311x00052519) | noal2019 (10.1590/0102-311x00048419) | peixoto2022 (10.1590/1980-549720220002.supl.2)
  pesca e comunidades tradicionais: barreto2020 (10.1590/1807-0310/2020v32214674) | fiorott2017 (10.21664/2238-8869.2017v6i2.p127-146) | lins2025 (10.7440/res91.2025.04)
  governança e participação: melo2024 (10.1016/j.ijdrr.2024.104945) | petesse2024 (10.20950/1678-2305/bip.2024.50.e879) | almeida2024 (10.5130/ccs.v16.i1.8305)
  direito e reparação: losekann2019 (10.1016/j.exis.2019.11.015) | primo2021 (10.3390/ijerph182111346) | ayala2023 (10.5007/2177-7055.2022.e85363)
  território e uso do solo: pereira2019 (10.24221/jeap.4.2.2019.2373.122-129) | laschefski2020 (10.48075/amb.v2i1.23299) | scarpelin2020 (10.33448/rsd-v9i4.2517)
  valoração econômica: barcelos2021 (10.24302/drd.v11.2876) | fernandes2016 (10.1016/j.ncon.2016.10.003) | sanchez2022 (10.2305/iucn.ch.2022.11.pt)
  causa e risco da ruptura: semautor2026 (10.14210/alcance.v33n1(jan/abr).p1-20)
  (semautor2026 é artigo de 2026 sem autor na exportação; a chave é
   essa, está na lista e o DOI confere)

FONTES — documentos institucionais da biblioteca (citar por chave):
  aedas-41856 — AEDAS, 2026: Livros de Danos Coletivos sofridos pelas Comunidades de Brumadinho e da Região 2 (https://aedasmg.org/documento/livros-de-danos-coletivos-sofridos-pelas-comunidades-par/)
  aedas-41903 — AEDAS, 2025: Balanço da Reparação 2023-2025 (https://aedasmg.org/documento/balanco-da-reparacao-2023-2025-par/)
  aedas-41906 — AEDAS, 2025: Aedas divulga informes sobre auditoria dos estudos socioambientais feitos pela AECOM no mês de dezembro de 2025 (https://aedasmg.org/documento/informes-aecom-1225/)
  guaicuy-entenda-o-acordo-judicia — Guaicuy, 2026: Folder — Entenda o Acordo Judicial de Reparação (https://guaicuy.org.br/biblioteca/publicacoes/entenda-o-acordo-judicial/)
  guaicuy-resolucao-coletiva-inden — Guaicuy, 2025: Como anda o processo de resolução coletiva das indenizações individuais? (https://guaicuy.org.br/biblioteca/videos/resolucao-coletiva-indenizacoes-individuais/)
  guaicuy-entenda-a-decisao-de-sus — Guaicuy, 2025: Entenda a decisão de suspensão das ações individuais de indenização (https://guaicuy.org.br/biblioteca/videos/entenda-a-decisao-de-suspensao-das-acoes-individuais/)
  nacab-boletim-mobilizacao-06-ser — NACAB, sem ano: Mobilização nº 6 — Ser mulher atingida (https://nacab.org.br/wp-content/uploads/2022/03/Boletim-Mobilizacao-06-Ser-mulher-atingida.pdf)
  nacab-reparacao-15-pdf-site-1 — NACAB, sem ano: Jornal Reparação nº 15 (https://nacab.org.br/wp-content/uploads/2026/07/Reparacao-15_PDF-site-1.pdf)
  nacab-reparacao-14 — NACAB, sem ano: Jornal Reparação nº 14 (https://nacab.org.br/wp-content/uploads/2025/05/reparacao_14.pdf)
  ac-003 — MPMG, 2024: MPMG — TAC: Gerdau — R$ 27 mi para Reparação (https://www.mpmg.mp.br/)

LIMITES DESTE RECORTE:
  - 3.818 casos sem recorrente/resultado legíveis: não entram em percentual.
  - valor de indenização só aparece em 75 casos: não serve para média do acervo.
  - por câmara e por turma não é publicado antes da etapa 1: o campo não existe
    no acervo para os casos decididos.
  - tese e sentido vêm de regra de termo e leitura de modelo, nessa ordem de
    confiança; divergência só é publicada com N ≥ 3 nos dois sentidos.
```

## 3.1 Ficha do caso — o que o Guaicuy mede e entra na etapa 1

O *Dossiê das ações individuais de indenização nas Regiões 4 e 5* (Instituto
Guaicuy, 2024) organiza cada ação numa ficha com 11 campos, e o relatório
percorre os mesmos sete eixos por região. Destes, sete exigem leitura do acórdão
e passam a ser pedidos na etapa 1:

| Campo | Valores fechados | Por que importa |
|---|---|---|
| `competencia` | justica_estadual · justica_federal · nao_consta | a federalização muda o foro e o tempo do processo |
| `justica_gratuita` | concedida · negada · nao_requerida · nao_consta | barreira de acesso concreta |
| `acordo` | homologado · proposto_e_recusado · nao_consta | mede solução negociada, não só sentença |
| `provas` | pericia · documental · testemunhal · nenhuma · nao_consta | separa quem perdeu por não provar |
| `ptr_auxilio` | discutido · concedido · negado · nao_consta | auxílio emergencial / PTR atravessa metade dos casos |
| `estado_processo` | sentenca · acordo · recurso · extinto · nao_consta | evita tratar recurso como decisão final |
| `camara` | 1ª Cível · 2ª Cível · 3ª Cível · 4ª Cível · Criminal · Reunidas · Plenário | o acervo só traz câmara em 1.039 casos, e neles o resultado é indeterminado |
| `turma` | Turma Recursal 1..5 · 1º Grupo Criminal · nao_consta | idem |
| `palavras_chave` | 3 a 6 termos curtos, separados por `;` | alimenta o RAG depois, sem reler o acórdão |
| `tempo_duracao` | dias (só se o texto trouxer as duas datas) | se não trouxer, `nao_consta` — não estimar |

O que **não** entra: documentos juntados na petição inicial e "estado do processo
em 1º semestre de 2024". Os dois exigem o processo, não o acórdão. Ficam
declarados como lacuna, no lugar de preenchidos por inferência.

O desenho do Guaicuy é amostral (452 processos, amostra de 318, confiança 99%,
margem 4%). O nosso é censo sobre o que foi coletado — mais forte em cobertura,
mais fraco em homogeneidade, e a nota metodológica tem de dizer isso com todas
as letras.

## 4. Como o RAG entra (e onde não entra)

O RAG **não** é chamado pelo lote: ele alimenta este prompt. A montagem é
determinística e auditável:

1. o script busca no índice os trechos dos 118 artigos por eixo (água, biota,
   saúde, pesca, governança, direito);
2. para cada eixo, seleciona os 2 artigos mais citados do conjunto e monta a
   linha de FONTE com chave, achado de uma linha e DOI;
3. o modelo só pode citar essas chaves.

Assim a citação é rastreável ao artigo e ao DOI conferido — e não a um resumo
que o modelo lembrou de ter visto. Pergunta do leitor ("de onde vem esse
número?") tem resposta em três cliques: frase → chave → DOI.

## 5. Custo e modalidade (preço de 03/11/2026)

Tabela de preço da Maritaca, por milhão de tokens:

| Modalidade | S5 | Sabiá 4 | Sabiá 4 Thinking | Sabiazinho 4 |
|---|---:|---:|---:|---:|
| Padrão (entrada/saída) | 0,50 / 2,50 | 5,00 / 20,00 | 5,00 / 40,00 | 1,00 / 4,00 |
| **Batch (entrada)** | 0,25 | 2,50 | 2,50 | 0,50 |
| **Flex (entrada/saída)** | 0,25 / 1,25 | 2,50 / 10,00 | 2,50 / 20,00 | 0,50 / 2,00 |

**Batch e Flex custam o mesmo por token.** A diferença é operacional:
`batch` é assíncrono, aceita o volume inteiro de uma vez e devolve em até 24 h;
`flex` é síncrono, com limite de taxa e a chamada presa ao processo.

### Por que batch

5.362 casos em `flex` são 5.362 requisições síncronas: o gargalo vira a taxa da
API, não o modelo, e o trabalho fica pendurado em processo vivo. Em `batch` o
arquivo sobe uma vez, o estado fica em disco (`logs/…-lote.json`) e a rotina
baixa sozinha quando conclui — exatamente o que já funciona para polo e tese.
`flex` só se justifica para piloto de 50 a 100 casos, quando se quer ver o
resultado em minutos.

### Custo do universo (5.362 casos; 1,16 M entrada e 1,39 M saída)

| Modelo em batch | Entrada | Saída | Total |
|---|---:|---:|---:|
| Sabiazinho 4 | R$ 0,58 | R$ 2,78 | **R$ 3,36** |
| Sabiá 4 | R$ 2,90 | R$ 13,90 | **R$ 16,80** |
| S5 | R$ 0,29 | R$ 1,74 | **R$ 2,03** |

Etapa 2 (síntese, 1 chamada, ~6 mil tokens) custa menos de R$ 0,05 em qualquer
um dos três.

### Recomendação

- **Etapa 1 (5.362 etiquetas): Sabiazinho 4 em batch — R$ 3,36.** A tarefa é
  estruturada (campo fechado), e é ele que já rotulou polo e tese do acervo.
- **Etapa 2 (síntese): Sabiá 4 em batch — centavos.** É onde a diferença de
  modelo aparece: texto longo, nuance jurídica, cinco questões de pesquisa.

Se a qualidade da etiqueta do Sabiazinho não convencer no piloto de 200, o passo
seguinte é Sabiá 4 **só no que ficou `indeterminado`** (hoje 3.818), não no
universo: R$ 12,00 em vez de R$ 16,80, e sem reler o que já está decidido.

## 6. Aceite (auditável, não retórico)

- [ ] Todo número do texto existe no bloco DADOS — conferido por script.
- [ ] Toda citação do texto existe em FONTES — conferido por script.
- [ ] Nenhuma tese citada com N < 3.
- [ ] Divergência sempre com órgão dos dois lados.
- [ ] A seção 1 declara quantos casos ficaram fora do percentual.
- [ ] Nenhuma conclusão sobre "reparação integral" sem dizer o que não foi medido.

O script de conferência é o mesmo `revisor_academico.py`, estendido para ler o
texto do lote: ele já sabe comparar número publicado com número contado.
