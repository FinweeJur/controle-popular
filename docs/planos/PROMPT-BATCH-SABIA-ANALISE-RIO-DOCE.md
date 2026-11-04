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

FONTES (literatura verificada na Crossref; citar só estas, por chave):
  pinheiro2025  — síntese da dispersão das plumas ao longo da costa brasileira (doi 10.1016/j.marpolbul.2025.119124)
  lopes2025    — avaliação ecotoxicológica de seis anos, rio Doce e área costeira (doi 10.1016/j.envpol.2025.125897)
  soares2025   — revisão sistemática dos impactos ambientais do rompimento (doi 10.1007/s11356-025-36695-8)
  gabriel2021  — contaminação de longo prazo do estuário do rio Doce (doi 10.1016/j.pecon.2021.09.001)
  francini2019 — pluma do rio Doce alcançou o sul do Banco dos Abrolhos (doi 10.1016/j.scitotenv.2019.134038)
  dadalto2020  — mudanças percebidas por comunidades pesqueiras tradicionais (doi 10.1080/00207233.2019.1663628)
  santos2025   — caracterização das comunidades pesqueiras e desafios atuais (doi 10.21664/2238-8869.2025v14i3.7122)
  losekann2021 — governança e participação no desastre do rio Doce (doi 10.1177/00113921211059224)
  zhouri2025   — violência, resistência e vozes de mulheres no desastre (doi 10.1080/01436597.2025.2556011)
  kananizadeh2023 — comparação estatística da qualidade da água marinha (doi 10.1002/ieam.4818)

LIMITES DESTE RECORTE:
  - 3.818 casos sem recorrente/resultado legíveis: não entram em percentual.
  - valor de indenização só aparece em 75 casos: não serve para média do acervo.
  - tese e sentido vêm de regra de termo e leitura de modelo, nessa ordem de
    confiança; divergência só é publicada com N ≥ 3 nos dois sentidos.
```

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
