# Prompt do batch — análise de teses, estatística e jurimetria (Rio Doce)

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

ESTRUTURA OBRIGATORIA (sete secoes, nesta ordem):
1. Nota metodologica: o que e contagem deste acervo e o que e leitura de modelo;
   quantos casos ficaram sem variavel legivel e por que.
2. Retrato quantitativo: favorabilidade, quem recorre, taxa por comarca e por
   relator, onde ha base suficiente e onde nao ha.
3. Teses predominantes e teses perdedoras: para cada uma, N, sentido dominante
   e o que a decisao enfrentou (merito ou preliminar).
4. Divergencias: mesma tese com os dois sentidos, com orgao nomeado dos dois
   lados. Divergencia sem orgao nomeado nao entra.
5. O que a literatura acrescenta e o que ela nao decide: ligue achado cientifico
   a tese juridica sem transformar artigo em prova de processo.
6. Lacunas: o que o acervo nao permite responder.
7. Questoes de pesquisa: tres, com a justificativa de cada uma.

PROIBIDO: adjetivo de valor ("lamentavel", "justo"), previsao de resultado,
tom de parecer, e qualquer frase que sugira que o portal conclui por juiz.
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

taxa de favorável por comarca (mín. 20 casos):
  Governador Valadares 354 casos 35,6% | Mariana 267 26,6%
  Ponte Nova 203 8,9% | Aimorés 187 4,3% | Ipatinga 130 20,8%

taxa de favorável por relator (mín. 50 casos):
  Des.(a) Maria Lúcia Cabral Caruso 1.564 20,3% | Des.(a) Saldanha da Fonseca 477 5,0%
  Des.(a) Juliana Campos Horta 179 0,6% | Des.(a) Octávio de Almeida 77 77,9%
  Des.(a) Monteiro de Castro 59 28,8%

teses mais frequentes (N):
  prescrição da pretensão indenizatória 716 | gratuidade de justiça 338
  inversão do ônus da prova 333 | dano moral 264 | legitimidade 136

valores fixados (onde há número com cara de real): 75 casos, mediana R$ 30.000,
mínimo R$ 0, máximo R$ 850.000. Fora desses, "não consta".

FONTES (25 chaves, DOI conferido na Crossref; citar só estas, por chave):
  água e sedimento: alcantara2020 (10.1016/j.jag.2020.102119) | thompson2019 (10.1016/j.scitotenv.2019.135914) | pacheco2023 (10.1016/j.apgeochem.2023.105644)
  biota e peixe: vergilio2020 (10.1038/s41598-020-62700-w) | parente2020 (10.1016/j.envres.2020.110526) | pacheco2021 (10.1016/j.scitotenv.2021.151157)
  saúde humana: freitas2019 (10.1590/0102-311x00052519) | noal2019 (10.1590/0102-311x00048419) | peixoto2022 (10.1590/1980-549720220002.supl.2)
  pesca e comunidades tradicionais: barreto2020 (10.1590/1807-0310/2020v32214674) | fiorott2017 (10.21664/2238-8869.2017v6i2.p127-146) | lins2025 (10.7440/res91.2025.04)
  governança e participação: melo2024 (10.1016/j.ijdrr.2024.104945) | petesse2024 (10.20950/1678-2305/bip.2024.50.e879) | almeida2024 (10.5130/ccs.v16.i1.8305)
  direito e reparação: losekann2019 (10.1016/j.exis.2019.11.015) | primo2021 (10.3390/ijerph182111346) | ayala2023 (10.5007/2177-7055.2022.e85363)
  território e uso do solo: pereira2019 (10.24221/jeap.4.2.2019.2373.122-129) | laschefski2020 (10.48075/amb.v2i1.23299) | scarpelin2020 (10.33448/rsd-v9i4.2517)
  valoração econômica: barcelos2021 (10.24302/drd.v11.2876) | fernandes2016 (10.1016/j.ncon.2016.10.003) | sanchez2022 (10.2305/iucn.ch.2022.11.pt)
  causa e risco da ruptura: semautor2026 (10.14210/alcance.v33n1(jan/abr).p1-20)
  (semautor2026 é artigo de 2026 cuja exportação não trazia autor;
   a chave é essa mesma — está na lista, é citável, o DOI confere)

LIMITES DESTE RECORTE:
  - 3.818 casos sem recorrente/resultado legíveis: não entram em percentual.
  - valor de indenização só aparece em 75 casos: não serve para média do acervo.
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

## 5. Custo

| Etapa | Chamadas | Entrada | Saída | Custo (sabiazinho batch) |
|---|---:|---:|---:|---:|
| 1. etiquetar | 5.362 | 1,16 M tok | 1,39 M tok | ~R$ 3,37 |
| 1b. só os sem variável | 3.818 | 0,83 M | 0,99 M | ~R$ 2,40 |
| 2. sintetizar | 1 | ~4 mil tok | ~2 mil tok | < R$ 0,02 |

Preço do **sabia-4** não está tabelado em fonte pública que abra sem login:
os valores acima usam o preço do **sabiazinho-4 em batch**, já medido. Se o
sabia-4 custar o dobro, dobra tudo. Confirmar na console antes de enviar.

Como a pergunta é "análise de teses e jurimetria", a etapa 1 pode rodar só nos
**3.818 sem variável legível**: os 1.544 já decididos entram na análise pelas
colunas que a planilha tem. Isso reduz a etapa cara a ~R$ 2,40.

## 6. Aceite (auditável, não retórico)

- [ ] Todo número do texto existe no bloco DADOS — conferido por script.
- [ ] Toda citação do texto existe em FONTES — conferido por script.
- [ ] Nenhuma tese citada com N < 3.
- [ ] Divergência sempre com órgão dos dois lados.
- [ ] A seção 1 declara quantos casos ficaram fora do percentual.
- [ ] Nenhuma conclusão sobre "reparação integral" sem dizer o que não foi medido.

O script de conferência é o mesmo `revisor_academico.py`, estendido para ler o
texto do lote: ele já sabe comparar número publicado com número contado.
