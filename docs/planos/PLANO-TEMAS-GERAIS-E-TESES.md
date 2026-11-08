# Plano — temas gerais e processuais na jurisprudência dos desastres

> **Tipo:** PLANO
> **Domínio:** jurisprudência
> **Última medição:** 2026-11-08
> **Leitura estimada:** media (5-15 min)
> **Relacionados:** [PLANO-ANALISE-TESES-02-11.md](PLANO-ANALISE-TESES-02-11.md), [PLANO-JURISPRUDENCIA-ESCOPO-TOTAL.md](PLANO-JURISPRUDENCIA-ESCOPO-TOTAL.md), [QUALIDADES-DA-INFORMACAO.md](../04-arquitetura/QUALIDADES-DA-INFORMACAO.md), [REGRA-EDITORIAL.md](../01-produto/REGRA-EDITORIAL.md), [REGRAS-DURAS.md](../03-desenvolvimento/REGRAS-DURAS.md)
> **Palavras-chave:** tese, tema processual, prova, ônus da prova, gratuidade, nexo causal, prescrição, hegemonia, divergência, súmula, Guaicuy, NACAB, MAB

## Sumário

- [1. O pedido, em três entregas](#1-o-pedido-em-três-entregas)
- [2. O que já existe, medido](#2-o-que-já-existe-medido)
- [3. O problema central: 13 mil casos, 4.545 rótulos](#3-o-problema-central-13-mil-casos-4545-rótulos)
- [4. A saída: rubrica fechada, não rótulo livre](#4-a-saída-rubrica-fechada-não-rótulo-livre)
- [5. A lista de temas — entrega 1](#5-a-lista-de-temas--entrega-1)
- [6. Pipeline, fase por fase](#6-pipeline-fase-por-fase)
- [7. Motor: S5-free, com queda para o pago](#7-motor-s5-free-com-queda-para-o-pago)
- [8. O resumo geral das teses — entrega 2](#8-o-resumo-geral-das-teses--entrega-2)
- [9. O confronto Guaicuy, NACAB e MAB — entrega 3](#9-o-confronto-guaicuy-nacab-e-mab--entrega-3)
- [10. Critérios de aceite](#10-critérios-de-aceite)
- [11. Riscos e armadilhas](#11-riscos-e-armadilhas)
- [12. Cronograma e custo](#12-cronograma-e-custo)
- [13. O que não fazer](#13-o-que-não-fazer)

## 1. O pedido, em três entregas

O dono pediu três coisas encadeadas, e a segunda depende da primeira:

1. **A lista de temas** que aparecem na página, hoje presa à reparação
   (dano moral, mudança de hábitos, auxílio emergencial), ampliada para
   **temas gerais de direito e de processo** — produção de provas, inversão
   do ônus, gratuidade, nexo causal, prescrição e o que mais o acervo
   sustentar.
2. **Catálogo + resumo geral das teses**, descritivo, objetivo, em leitura
   materialista histórico-dialética: qual tese é dominante, qual é
   divergente, desde quando é hegemônica, quais câmaras/turmas a aplicam,
   e como se relaciona com súmulas do STF, do STJ e do CNJ.
3. **Confronto** desse retrato com as teses do **Guaicuy**, do **NACAB** e
   do **MAB** sobre **indenização individual**: o que a jurisprudência
   confirma, o que contradiz e o que simplesmente não decide.

## 2. O que já existe, medido

Medição de 08/11/2026, sobre os arquivos em disco.

| Peça | Onde | Estado |
|---|---|---|
| Acervo da página | `apps/web/data/jurisprudencia-casos.json` | 23.569 casos; 13.135 nas frentes de desastre (brumadinho 7.774 + riodoce 5.361) |
| Teses extraídas | `tjmg-jurimetria/tabelas/teses.csv` | 13.128 linhas, uma por caso |
| Canonização | `tabelas/teses-canonico.csv` | regra de termo, 28 regras para desastre |
| Relatório | `relatorios/TESES-DESASTRE.md` | gerado em 08/11, contagem determinística |
| Catálogo do indeterminado | `apps/web/data/catalogo-frentes.json` | 4 frentes, rubrica própria |
| Agregados Guaicuy/NACAB | `relatorios/agregados-guaicuy-nacab.json` | 2.970 processos, censo |
| Súmulas | `tabelas/sumulas_{stf,stj,tst}.csv` | STF 736, STJ 673, TST 463 |
| **Súmulas do CNJ** | — | **não existe coleta** |

O achado que já está no relatório e sustenta a leitura:

- **Prescrição** é a tese mais frequente (882 casos; 6,7%) e a mais dividida
  — 491 pró-atingido × 344 pró-empresa, com desembargadores exclusivos de
  cada lado.
- **Nexo causal** aparece 130 vezes e em 123 o sentido é pró-empresa. Não é
  tese em disputa; é porta de saída.
- **Auxílio emergencial** virou: era 50×7 pró-atingido antes de 2022 e
  passou a 41×40 pró-empresa depois.
- **Perícia** domina o mérito: 693 "laudo pericial judicial prevalece"
  (678 pró-empresa) + 637 "laudo prevalece sobre particular" (635
  pró-empresa).

## 3. O problema central: 13 mil casos, 4.545 rótulos

O extrator atual pede ao modelo uma tese em **texto livre**, de 3 a 7
palavras. Cada chamada inventa o seu rótulo. Resultado medido:

| Família de tese | Rótulos distintos | Casos cobertos |
|---|---:|---:|
| Perícia / laudo | **419** | 3.254 |
| Ônus da prova | **150** | 669 |
| Prescrição | **165** | 886 |
| Gratuidade | **116** | 425 |
| Nexo causal | **111** | 162 |
| Dano moral | **315** | 719 |
| Legitimidade | **125** | 370 |
| **Total do arquivo** | **4.545** | 13.128 |

Consequência: o relatório publica seis linhas diferentes para a mesma tese
de perícia — "laudo pericial judicial prevalece" (693), "laudo pericial
prevalece sobre particular" (637), "laudo pericial judicial prevalece sobre
particular" (216), "laudo pericial prevalece sobre médicos" (181), "laudo
pericial prevalece sobre documentos médicos" (152), "laudo pericial
prevalece" (90). São **1.969 casos da mesma família partidos em seis
contagens**. Nenhuma delas diz o que o conjunto diz.

A canonização por regra de termo conserta parte, mas a tabela atual tem 28
regras e nenhuma para perícia, ampla defesa, prova diabólica, distribuição
dinâmica, litigância predatória ou valor da causa.

## 4. A saída: rubrica fechada, não rótulo livre

A regra que a prática já impôs neste projeto: **o modelo escolhe de uma
lista, não inventa**.

- Cada tema tem um conjunto fechado de teses possíveis (`tese_id`).
- O modelo devolve `tema`, `tese_id`, `sentido`, `evidencia` (trecho
  literal da ementa, até 280 caracteres), `confianca`.
- `orgao`, `ano`, `polo` e `tribunal` **nunca** vêm do modelo: vêm do
  acervo, por `processo`.
- O que não couber na lista vira `outro` — e o texto livre vai para uma
  coluna separada, que **não entra em contagem**. Assim o caso não some e a
  contagem não mente.

Isso resolve três problemas de uma vez: a fragmentação (419 rótulos viram
5), a auditoria (toda tese tem trecho literal) e a comparação histórica (o
mesmo `tese_id` atravessa os anos).

## 5. A lista de temas — entrega 1

Dezenove temas, medidos por regex sobre os 13.135 casos de desastre. A
coluna "N" é quantos casos citam o termo no texto — é o teto do tema, não a
tese. Com os dois temas de reparação incluídos, a união é **11.710 casos
(89,2%)**; 1.425 não tocam nenhum tema.

### Bloco A — Prova e instrução

| # | Tema | O que decide | N | % |
|---|---|---|---:|---:|
| A1 | Prova pericial | prevalece o laudo judicial, o particular, ou nenhum | 4.544 | 34,6% |
| A2 | Ônus da prova | quem prova o quê; inversão e distribuição dinâmica | 1.110 | 8,5% |
| A3 | Prova diabólica | impossibilidade de produzir a prova que lhe cabe | 268 | 2,0% |
| A4 | Cerceamento de defesa | negativa de prova cerceia o direito | 2.476 | 18,9% |
| A5 | Ampla defesa e contraditório | o contraditório foi observado | 3.779 | 28,8% |
| A6 | Livre apreciação da prova | o juiz está adstrito ao laudo? | 34 | 0,3% |

### Bloco B — Porta de entrada e de saída

| # | Tema | O que decide | N | % |
|---|---|---|---:|---:|
| B1 | Gratuidade de justiça | isenção de custas e honorários | 1.009 | 7,7% |
| B2 | Competência | Justiça Federal × Estadual; prevenção | 289 | 2,2% |
| B3 | Legitimidade | ativa, passiva, Ministério Público | 1.270 | 9,7% |
| B4 | Tutela coletiva | coisa julgada coletiva × ação individual | 616 | 4,7% |
| B5 | Litigância predatória | má-fé, litispendência artificial | 229 | 1,7% |
| B6 | Sobrestamento e repetitivo | suspensão por tema repetitivo | 405 | 3,1% |
| B7 | Prescrição e decadência | prazo, termo inicial, interrupção | 2.293 | 17,5% |
| B8 | Coisa julgada | acordo homologado, TAP, trânsito | 878 | 6,7% |
| B9 | Valor da causa | impugnação e base de honorários | 103 | 0,8% |

### Bloco C — Mérito e causalidade

| # | Tema | O que decide | N | % |
|---|---|---|---:|---:|
| C1 | Nexo causal | a barragem causou o dano alegado? | 2.079 | 15,8% |
| C2 | Responsabilidade objetiva e risco integral | fundamento da responsabilidade | 1.120 | 8,5% |
| C3 | Dano moral | cabimento e quantum | 7.104 | 54,1% |
| C4 | Dano material e lucros cessantes | o que se prova do prejuízo | 1.764 | 13,4% |
| C5 | Honorários e custas | sucumbência e princípio da causalidade | 768 | 5,8% |

### Bloco D — Reparação (o que já existe)

| # | Tema | O que decide | N |
|---|---|---|---:|
| D1 | Auxílio emergencial e PTR | pagamento, cumulação, cobrança | 745 |
| D2 | Acordo de reparação e TAP | interpretação e extensão | — |
| D3 | Reassentamento | realocação de famílias | — |
| D4 | Danos PNAB/PEAB (12 categorias) | matriz de danos | — |

Os temas D já estão na página e no relatório Guaicuy/NACAB. **Não são
refeitos**: entram como bloco de comparação, para que o leitor veja o peso
relativo do processual e do material.

## 6. Pipeline, fase por fase

### F0 — Medir (feito)

Contagem por regex, determinística, sobre o JSON do portal. Saída:
`tabelas/temas-gerais-medicao.json`, com N por tema e por ano. Custo zero.

### F1 — Rubrica fechada (feito em 08/11)

`rubricas/temas-gerais-v1.json`: 22 temas, **79 teses fechadas**. Nenhuma
tese foi inventada — todas saíram do vocabulário que já aparecia nos 4.545
rótulos, ordenado por frequência.

### F2 — Piloto (feito em 08/11)

19 casos, um por tema, no S5-free, custo zero. Resultado medido:

| Métrica | Valor |
|---|---:|
| Achados gravados | 52 |
| Temas decididos | 43 |
| `nao_decide` (tema citado, não decidido) | 9 (17%) |
| Evidência literal conferida na ementa | 36 (84%) |
| Depois de corrigir a régua | **39 de 41 (95%)** |

Três defeitos apareceram no piloto e foram corrigidos:

1. **Evidência vinha do resumo, não da ementa.** 7 de 43 (16%) existiam
   apenas no texto gerado por modelo. Agora o prompt recebe só a ementa e a
   conferência é contra ela.
2. **Mesmo trecho servindo a dois temas** — o modelo reaproveitou a frase do
   laudo para "prova pericial" e para "contraditório". Trecho repetido agora
   vira `evidencia_ok=0`.
3. **Tema detectado por boilerplate.** "Ampla defesa e contraditório"
   disparava em 28,8% do acervo porque toda ementa fala da "observância do
   contraditório". A detecção foi estreitada para falta/nulidade de
   contraditório.

Régua final de evidência: literal na ementa, mínimo de 25 caracteres e 3
palavras. A tentativa de exigir "verbo decisório" foi descartada — a ementa
é syllabus descritivo, e a tese aparece como "CERCEAMENTO DE DEFESA.
INEXISTÊNCIA.".

Vazão medida: **8 casos em 4,8 s com concorrência 4** (2,4 s por caso).
Para 11,7 mil casos: 2 a 4 horas, conforme o limite de 60 RPM do gratuito.

### F3 — Lote

**11.710 casos** com ao menos um tema detectado (medido na fila em 08/11),
uma chamada por caso, multi-rótulo. Checkpoint linha a linha
(`tabelas/temas-gerais.csv`), retomável. Motor: S5-free; queda para o pago
só quando o degrau gratuito falhar (ver §7).

### F4 — Auditoria de evidência

`auditar_evidencia.py` adaptado: confere **linha a linha** se o trecho
citado existe na ementa. O que não existir sai, `confianca` vira `baixa` e
o caso volta para a fila. Foi assim que o catálogo do Rio Doce caiu de
41,3% para 36,2% — número menor e verdadeiro.

### F5 — Agregação determinística

`agregar_temas_gerais.py` calcula, sobre o CSV auditado:

- **Dominância**: tese com ≥ 60% do tema, com N ≥ 30.
- **Divergência**: dois lados com ≥ 3 casos cada, excluindo `outro`.
- **Hegemonia**: primeiro ano em que a tese passa de 60% e não cai abaixo
  disso em nenhum ano seguinte com N ≥ 5.
- **Órgãos**: câmara/turma de cada lado, com os exclusivos separados dos
  compartilhados (o relatório atual já faz isso e é o que evita dizer
  "briga entre câmaras" quando a divergência é interna).
- **Súmulas citadas**: regex `[Ss]úmula\s*(?:n[º°.]?\s*)?(\d+)` no texto,
  casada com os catálogos do STF, STJ e TST; CNJ entra depois da coleta.

Saída: `relatorios/temas-gerais.json` + `TEMAS-GERAIS.md`.

### F6 — Redação

O resumo (§8) é escrito com os números do JSON na mão. Nenhum número é
escrito pelo modelo: o modelo interpreta a tabela, não conta.

### F7 — Publicação

Página própria `/jurisprudencia/teses`, ligada a partir de
`/jurisprudencia`. Se o conteúdo passar de 10 blocos, divide em
`/jurisprudencia/teses/processual` e `/jurisprudencia/teses/merito`.

## 7. Motor: S5-free, com queda para o pago

A cadeia de `tjmg-jurimetria/scripts/provedores.py` já é a combinada em
04/11/2026:

| Degrau | Modelo | Custo | Contexto |
|---|---|---|---|
| 1 | `S5-free` (Maritaca) | R$ 0 | 1 M |
| 2 | `glm-4.5-flash` (Z.AI) | R$ 0 | curto |
| 3 | `deepseek-v4.1-flash-free` (OrcaRouter) | R$ 0 | 32 k |
| 4 | `S5` (Maritaca) | **pago** | 1 M |
| 5 | `deepseek-v4-flash` | **pago** | 32 k |

O dono autorizou a queda para o pago quando o gratuito falhar. Para isso
funcionar, duas correções são obrigatórias no motor:

1. `MAXIMO_DEGRAUS = 3` **hoje impede o pago de ser alcançado**: os três
   primeiros degraus são gratuitos, o contador estoura e a cadeia para antes
   do degrau 4. Precisa virar parâmetro (`--permitir-pago`) e não teto fixo.
2. `permitir_pago=True` só pode ser ligado depois de o teto de gasto
   (`--teto-reais`) ser gravado em `logs/temas-gerais-gasto.json`. Ao
   atingir o teto, a cadeia para e o caso fica pendente — nunca estoura em
   silêncio.

Preço do S5 (medido na tabela do provedor em 08/11/2026): **US$ 0,50 por
milhão de entrada e US$ 2,50 por milhão de saída**. Por caso, com ~2.300
tokens de entrada e ~300 de saída: **US$ 0,0019 ≈ R$ 0,011**.

### Custo por cenário

| Cenário | Casos | Custo |
|---|---:|---:|
| Só gratuito | 10.572 | R$ 0 |
| 25% cai no pago | 2.643 | ~R$ 28 |
| 100% cai no pago | 10.572 | ~R$ 110 |
| Teto proposto | — | **R$ 150** |

### Ritmo

O gratuito tem 60 requisições por minuto. Com concorrência 4 e ~10 s por
chamada, a vazão medida fica entre 16 e 30 casos por minuto: **6 a 11 horas
para os 10.572**. O volume é sequencial por natureza; paralelizar mais
esbarra no limite da oferta gratuita.

## 8. O resumo geral das teses — entrega 2

Texto descritivo e objetivo, em leitura materialista histórico-dialética.
Isso não é enfeite de linguagem: é o método que explica por que a tese
dominante é dominante.

### Estrutura

1. **Base material da litigiosidade.** O que produziu 13 mil decisões: 19
   municípios, 2 barragens, um acordo de reparação e um sistema judicial
   que recebe sempre o mesmo conflito. Quem litiga (atingido 62,4% dos
   recursos), quem ganha (empresa 52,1%) e o que isso diz sobre o acesso.
2. **Teses dominantes.** Para cada tema: a tese, o N, o percentual, desde
   quando é hegemônica, quais órgãos a sustentam.
3. **Teses divergentes.** O par de lados (não a tese solta), os órgãos
   exclusivos de cada lado e a diferença entre divergência **entre** câmaras
   e divergência **dentro** da mesma câmara.
4. **Periodização.** O corte de 2022 é o que o acervo sustenta hoje, mas a
   hegemonia precisa de ano próprio: a tese que vira majoritária em 2023
   não é a mesma que era majoritária em 2020.
5. **Mediação institucional.** Súmulas do STF, do STJ e do CNJ que a
   decisão cita; e as que **deveria** citar e não cita. O silêncio também é
   dado.
6. **Contradição principal.** O processual como filtro do material: o
   acórdão que não decide o dano porque prescreveu, porque a coisa julgada
   do TAP alcança, porque a perícia não veio. É aí que a tese jurídica
   opera como relação social.
7. **Confronto com as entidades.** §9.

### Regras de escrita

- Cada afirmação leva marca: `[medido]`, `[inferido]` ou `[não dá para
  concluir]`.
- Proibido: "indenização média", "taxa de sucesso", causa sem contagem.
- Toda divergência publica o par de lados com N, nunca a tese solta.
- Nenhuma tese com N < 3.
- Frente com menos de 30 casos mostra lista de processos, não percentual.

## 9. O confronto Guaicuy, NACAB e MAB — entrega 3

### O que já está em casa

| Documento | Origem | Estado |
|---|---|---|
| Prescrição e Matriz de Danos no Caso Paraopeba e Três Marias | NACAB, 2021 | PDF linkado na biblioteca |
| Dossiê Acesso à Justiça | Guaicuy, 2024 | PDF linkado |
| Danos coletivos e socioeconômicos das Regiões 4 e 5 | Guaicuy, 2025 | PDF linkado |
| Indenizações individuais (série Águas Gerais) | Guaicuy, 2023-2025 | vídeos |
| **MAB** | — | **não está na biblioteca** |

O resumo que a biblioteca guarda desses itens é genérico ("relatório técnico
independente produzido pela assessoria..."), não a tese. **A tese precisa
sair do documento primário.**

### Como extrair

1. Baixar os PDFs (com UA honesto `finweejur/github artur colito`, 1–2 s
   por host, respeitando `robots.txt` e termos).
2. Extrair o texto e recortar os trechos que formulam tese sobre
   indenização individual (palavras-âncora: "indenização individual",
   "dano individual", "reparação integral", "matriz de danos",
   "prescrição", "nexo causal", "cada atingido").
3. Cada tese da entidade vira uma linha com: `entidade`, `documento`,
   `página`, `tese` (uma frase), `trecho literal`.
4. **Confronto**: para cada tese da entidade, três colunas — `confirmada`
   (tese dominante no tribunal coincide), `contrariada` (dominante vai no
   sentido oposto) e `não decidida` (o acervo não tem caso com N ≥ 3).

### O MAB

Não há documento do MAB na biblioteca. Antes de citar, decidir com o dono:

- **Opção A**: coletar do site do MAB, com a mesma regra de coleta ética.
- **Opção B**: usar o que o MAB fala **através** do acervo — há 212 itens
  com menção ao MAB na biblioteca, mas quase todos são boletim de terceiro.
- **Opção C**: publicar o confronto só com Guaicuy e NACAB, e declarar a
  ausência do MAB na página.

A opção C é a única que não inventa. A A é a melhor, se o site permitir.

## 10. Critérios de aceite

- [ ] A lista de temas tem N, denominador e data de medição em cada linha.
- [ ] Nenhum `tese_id` fora da rubrica entra em contagem.
- [ ] Toda tese publicada tem evidência literal conferida linha a linha.
- [ ] Cobertura da fila ≥ 95%; abaixo disso, a página diz o percentual real.
- [ ] Divergência só com dois lados de N ≥ 3 e órgãos nomeados.
- [ ] Hegemonia só com N ≥ 5 em todos os anos citados.
- [ ] Nenhum número escrito pelo modelo.
- [ ] Toda súmula citada existe no catálogo do tribunal e o número bate.
- [ ] Nenhum CPF, nome de pessoa física ou dado pessoal no texto publicado.
- [ ] O confronto com as entidades tem link para o documento e página.

## 11. Riscos e armadilhas

| Risco | Mitigação |
|---|---|
| S5-free devolve JSON truncado | `max_tokens` 9.000, `reasoning_effort: none`, validação por esquema |
| Limite de 60 RPM derruba o lote | concorrência 4, pausa adaptativa, retomada por checkpoint |
| Rótulo fechado engessa o que o caso diz | `outro` + texto livre em coluna que não conta |
| Câmara julgada pelo nome do relator | usar `orgao` (câmara) e relator separados; divergência por órgão |
| Súmula citada de memória pelo modelo | só entra a que o regex achar no texto da decisão |
| Confundir "cita a súmula" com "aplica a súmula" | duas colunas: `cita` e `aplica` (esta exige trecho) |
| Período curto parece tendência | hegemonia exige N ≥ 5 por ano e estabilidade |
| Documento do MAB inexistente | declarar a ausência em vez de parafrasear terceiro |

## 12. Cronograma e custo

| Etapa | O que entrega | Tempo | Custo |
|---|---|---|---|
| F0 | medição por regex | feito | R$ 0 |
| F1 | rubrica fechada (22 temas, 79 teses) | feito | R$ 0 |
| F2 | piloto de 19, 95% de evidência | feito | R$ 0 |
| F3 | lote de 11.710 | 2–4 h | R$ 0–150 |
| F4 | auditoria de evidência | 1 h | R$ 0 |
| F5 | agregação | 1 h | R$ 0 |
| F6 | redação do resumo | 1 sessão | R$ 0 |
| F7 | página | 1 sessão | R$ 0 |
| F8 | documentos das entidades | 1 sessão | R$ 0 |

**Teto de gasto: R$ 150.** O lote para ao atingir o teto e o restante fica
pendente para a rodada seguinte.

## 13. O que não fazer

- Não rodar o lote inteiro antes do piloto de 15.
- Não pedir ao modelo para "agrupar rótulos" — ele repete o que escreveu.
- Não publicar tese de perícia em seis linhas separadas.
- Não misturar a lente de desastre com direitos humanos ou penal.
- Não tratar "cita a súmula" como "aplica a súmula".
- Não usar média de indenização.
- Não citar tese do MAB sem documento do MAB.
- Não deixar o modelo escrever número.
