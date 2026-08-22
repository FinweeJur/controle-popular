# Crítica adversarial — o que não se sustenta

Confer contra as fontes com scripts próprios (dumps em `C:\Users\teste\AppData\Local\Temp\claude\C--Users-teste-Documents-Obsidian-Vault\187c81cb-ff06-4c21-b502-414df83fc936\scratchpad\crit\`: `pend2022.txt`, `pend2023.txt`, `ach2026.txt`, `p2026.txt`, `p2023.txt`, `p2022.txt` — os três últimos extraídos dos PDFs originais com `pdftotext`).

---

## 0. DEFEITO QUE ATINGE AS CINCO LEITURAS: o JSON de 2026 perde ~45% do relatório, e o que se perdeu é o melhor achado

`cnj-inspecao-tjmg-2026.json` tem 222.055 caracteres em `achados`. Conferindo contra `p2026.txt` (extração direta do PDF de 1.388 páginas):

| Bloco do PDF | Está no JSON? | Tamanho no PDF |
|---|---|---|
| **Cap. 7 — Precatórios**, item `7.6. Achados` | **não** | 20.585 chars |
| **Cap. 7**, item `7.7. Determinações` | **não** | 6.414 chars |
| Cap. 7, item `7.8. Recomendações` | sim (429 chars) | — |
| **Cap. 8 — Unidades Administrativas** (16 unidades: SEGOVE, SECAUD, DIRGED, CECONTI, DEARHU, GEPER, Gerência da Magistratura, GEDAC, DIRCONT, DIRFIN, **OUVIDORIA**, DEPLAG, CEGINP, CESUS, DENGEP) | **nenhuma seção** | 173.414 chars, **32 subseções "Achado" e 9 blocos "Determinações"** |
| **Cap. 9 — TI**, `9.9 Recomendações` | consta **vazio** | 2.211 chars, ≥4 achados |
| **Cap. 9**, `9.10 Determinações` | **não** | — |

**O que se perdeu inclui a frase que o projeto inteiro estava procurando.** Em `7.6. Achados`, sob o título literal *"Não cumprimento de determinações nas inspeções ano 2019, 2022 e 2023"*, o CNJ escreve:

> "passados sete anos desde a primeira inspeção, não foram adotadas providências efetivas pela Presidência do Tribunal de Justiça de Minas Gerais"

Isto é a cadeia **2019→2022→2023→2026** declarada pelo próprio CNJ, na mesma unidade (Precatórios) que a LEITURA 2 já havia marcado como "candidata mais forte do lote" na PONTE. A LEITURA 1 saiu caçando "determinação cobrada pela terceira vez" e achou apenas indícios indiretos (7.13.4, 4.5); a resposta explícita, em quarta cobrança, estava no PDF e fora do JSON. E `7.7. Determinações` traz o número que faltava: R$ 2.619.358.218,32 (grafado no PDF como "R$ 2.619.358,218,32", com vírgula espúria) que beneficiários sem impedimento não sacaram.

**Consequências para o texto:**
- A LEITURA 3 afirma: *"101 seções vieram vazias — no relatório do CNJ isso costuma significar 'nada a apontar'"*. Para 9.9 isso é comprovadamente falso, e o cap. 8 inteiro nem seção vazia gerou. **Corrigir**: as seções vazias/ausentes são, ao menos em parte, falha de extração, não silêncio do CNJ.
- A LEITURA 5 constrói a Lacuna 1 sobre transparência correicional/ouvidoria sem saber que o achado `8.12.2.3 Ausência de Sistema de Ouvidoria` do próprio CNJ diz: *"a inexistência de um sistema próprio de ouvidoria para o recebimento e tratamento dos chamados"* no TJMG.
- **Nada de 1º/2º grau muda** — o cap. 6 (unidades judiciárias) e o cap. 4 (gabinetes) estão íntegros no JSON, e conferi 20 seções contra os cabeçalhos do PDF. O buraco é administrativo + precatórios + TI.

**Correção**: reprocessar o PDF antes de publicar. Enquanto isso, nenhuma frase do tipo "o CNJ não apontou nada em X" pode sair, e o eixo Precatórios precisa ser reescrito.

---

## 1. Citação que não existe, ou existe com outras palavras

Fiz grep de **todas** as citações literais das cinco leituras. **Boa notícia: nenhuma citação inventada.** Todas as 8 da LEITURA 1, as 6 da LEITURA 2, as ~15 da LEITURA 3, as da LEITURA 4 e as da LEITURA 5 existem no texto-fonte. Ressalvas de transcrição, por ordem:

**1.1 — LEITURA 1, citação nº 7 (seção 9.5.2), alterada dentro das aspas.**
Publicado: *"...como as recomendações **não têm** caráter de obrigatoriedade, não será reiterada."*
Fonte: `não **tem** caráter de obrigatoriedade, não será reiterada **a recomendação**.`
Duas mudanças silenciosas: concordância corrigida e final truncado sem reticências. **Correção**: transcrever literal com `[sic]`, ou parafrasear fora de aspas. O achado analítico em cima dela (o `mencionaReiterada:1` pegou "reiterada" dentro de "não será reiterada") **é correto e é o melhor achado metodológico das cinco leituras** — conferi o flag no JSON, é a única seção com `mencionaReiterada:1` de 52.

**1.2 — LEITURA 1, §5, sigla trocada dentro de aspas.**
Publicado: *"na Inspeção realizada pelo CNJ no ano de 2019"*. Fonte (1.4): `na Inspeção realizada pelo **Conselho Nacional de Justiça** no ano de 2019`.

**1.3 — LEITURA 3, §4, verbo trocado dentro de aspas.**
Publicado: a Corregedoria recomenda *"estimular a replicação"*. Fonte (6.59.5): `**Estimule** a replicação do fluxo automatizado de agendamento de advogados e advogadas (via Google Agenda/Meet)`. Infinitivo por imperativo dentro de aspas.

**1.4 — LEITURA 2, citação nº 3: correta.** Publicou *"Ainda pende a implantação **[do]** mecanismo…"*; a fonte de fato omite o "do" (`Ainda pende a implantação mecanismo de monitoramento efetivo`), e o colchete marca a inserção. É a única das cinco leituras que fez isso direito.

---

## 2. Número que a fonte não sustenta

**2.1 — LEITURA 5, Lacuna 2: a afirmação é FALSA. Matar a seção inteira.**

Publicado: *"Tempo médio de tramitação por tribunal estadual não existe em dado aberto"* — porque só existiria `tptotst` (TST) entre as 1.314 variáveis.

O que medi: as duas premissas menores conferem (`Variaveis.csv` tem 1.315 linhas; `tptotst` é a única descrição que contém a palavra "tramitação" ligada a tempo). **Mas a conclusão é falsa**, e a prova está no *mesmo scratchpad que a LEITURA 5 usou*, no arquivo `JN_23-Jun-2026.csv` que ela baixou e não abriu. Esse CSV tem 1.314 colunas, uma linha por tribunal por ano, e uma família inteira de variáveis de tempo que o CNJ rotula sem escrever "tempo": `TpBaix*` (tempo dos baixados), `TpCp*` (tempo dos pendentes), `TpDec*` (tempo até a decisão), cada uma com sufixo `m` (Média), `md` (Mediana), `dp` (Desvio Padrão) e `p` (Nº de Processos), desdobradas por 1º grau / 2º grau / JE / TR e por criminal, não-criminal, execução fiscal.

Valores reais do TJMG, extraídos por mim desse CSV:

| Variável | 2020 | 2023 | 2025 |
|---|---|---|---|
| `tpbaixccrim1m` (criminal c/ sentença, 1º grau, média em dias) | 1.137,7 | 1.214,4 | **911,8** |
| `tpbaixextfisc1m` (execução fiscal, 1º grau) | 2.235,4 | 2.064,4 | **2.231,9** |
| `tpbaixcrim2m` (criminal, 2º grau) | 212,8 | 147,0 | **154,2** |

São 108 variáveis `tp*` preenchidas para o TJMG em cada ano de 2020 a 2025. O grep da LEITURA 5 falhou porque procurou a palavra na descrição ("TpBaixCCrim1 - Média" não diz "tempo"), não a variável.

O aviso *"há uma coleta rodando neste momento que pode derrubar esta afirmação"* estava certo — a coleta derruba. **Correção**: a Lacuna 2 não é lacuna. Se sobrar alguma matéria aqui, é a oposta e bem menor: *o CNJ publica o tempo médio por tribunal, mas com nomes de variável que ninguém decifra sem o dicionário, e o dicionário não usa a palavra "tempo"*. Isso é achado de usabilidade, não de omissão, e não sustenta o título.

**2.2 — LEITURA 5, Lacuna 1: o boletim mais recente identificado está errado.**

Publicado: *"a entrada mais recente listada é o 'Boletim da 9ª Sessão Ordinária do CNJ de 09/05/2023'"*, com *"127 boletins mapeados"*.

Medi em `boletim.html` (286.369 bytes, o mesmo arquivo citado): **129 entradas únicas**, não 127. E a entrada de data mais recente é **"Boletim da 8ª Sessão Ordinária do CNJ de 23/05/2023"** — 14 dias depois da 9ª (09/05/2023). O índice do CNJ está com a numeração fora de ordem, o que é curioso por si só, mas o texto publicado nomeia como "mais recente" um boletim que não é.

**A afirmação central sobrevive**: as 129 entradas cobrem 2014–2023 continuamente e param em maio/2023; não há nada de 2024/2025/2026. **Correção**: trocar para "a entrada mais recente é o Boletim da 8ª Sessão Ordinária, de 23/05/2023" e "129". Vale registrar que a página é montada por Elementor sem paginação no HTML servido — não achei marcação de paginação, mas não posso descartar carregamento por AJAX, e a frase publicada ("na primeira página do índice") já admite isso; ou se retira a ressalva depois de conferir num navegador, ou se abranda o título.

**2.3 — LEITURA 5, Lacuna 1: "dois itens do tipo 'Apuração – Infração disciplinar – Desembargador'" são três.**
Na pauta de 18/08/2026 (`pauta_18ago2026.html`) contei três: item 5 (TJRJ, processos 3002903-44 e 3002996-07), item 6 (TJPE, "Apuração – Infração Disciplinar – Desembargador"), item 8 (TJRJ, Carbono Oculto). Detalhe a favor: o número truncado `3002996-07.2026.8.19.**000**` (3 dígitos finais, quando deveriam ser 4) **é erro do próprio CNJ** e a LEITURA 5 transcreveu fielmente — mantenha assim, com `[sic]`.

**2.4 — LEITURA 4: a contagem de prazos não fecha nem consigo mesma.**
Publicado: *"119 menções: 30d=23, 60d=10, 90d=55, 120d=23, 180d=4"*. A soma dá **115**, não 119. E ao recontar com o padrão que reproduz exatamente quatro dos cinco valores (`N (por extenso) dias`), obtenho **120d = 19**, não 23 — total 111. Nenhum critério de contagem produz simultaneamente 30=23, 60=10, 90=55, 180=4 e 120=23. **Correção**: 30=23, 60=10, 90=55, 120=19, 180=4, total 111.

**2.5 — LEITURA 4: "103 unidades" inclui dois baldes genéricos que a própria leitura diz ter excluído.**
Contei 103 valores distintos de `unidade` — mas dois deles são `"VARAS"` e `"GABINETES"`, os rótulos das 5 seções sem unidade identificada. A leitura diz "eu as excluí do ranking por unidade" e depois publica "103" na frase para o portal. **São 101 unidades reais.** Corrigir a frase-âncora do portal.

**2.6 — LEITURA 1: DIRSEP a 83% de não-cumprimento não se sustenta, e a seção não tem veredito do CNJ.**
Publicado: *"DIRSEP (5 de 6 = 83%)"*, no topo do ranking de taxa de não-cumprimento, com a justificativa *"5 de 6 itens ainda em prazo futuro (dez/2023, 1º trim/2024)"*.

Li a 9.3.2 inteira. Dos 6 itens: (I) reporta **resultado consumado** — 417 lotes homologados em 212 editais, pregões 22% melhores que a meta, tomadas de preços 17%, concorrências 27%; (ii) descreve monitoramento já em operação (GECOMP/COALI, marcadores SEI + planilha); (III) remete à SEGOVE com a Portaria TJMG 6344/2023 **já publicada**; (IV) piloto IMGC aprovado, extensão "até dezembro de 2023"; (V) contrato estimado para "primeiro trimestre de 2024"; (VI) parcial (parecer pendente, mas dois contratos PCD vigentes). **Só (IV) e (V) têm prazo futuro — dois, não cinco.** E o texto inteiro da 9.3.2 é "Medidas adotadas" pela própria unidade: **o CNJ não emite veredito nenhum ali**. Pela própria taxonomia da LEITURA 1, esses itens pertencem a "sem veredito explícito", não ao ranking de descumprimento. **Correção**: tirar DIRSEP do topo do ranking; se ficar, ficar como "6 itens sem veredito do CNJ".

Efeito colateral: o ranking do §4 perde seu primeiro colocado, e a soma 98/42/14/2 = 156 precisa ser refeita.

**2.7 — LEITURA 1: SECAUD "2 de 2 = 100%" amacia mal um dos dois itens.**
O item (ii) diz `A determinação **não foi plenamente atendida** devido a déficits de pessoal` — parcial, não zero. Só o item (v) é `não foi atendida`. 100% é forte demais para 1 não-atendida + 1 parcialmente atendida.

**2.8 — LEITURA 3, item 3: a decomposição está grudada no número errado.**
Publicado: *"5.226 incidentes já instaurados e pendentes de decisão pelo juízo há mais de 90 dias, **incluindo pedidos de progressão de regime, livramento condicional, indulto e término de pena**"*.

Na 6.70.4 há **dois** números distintos no meio aberto: **3.967** "pendências de incidentes vencidos", e *esses* sim vêm decompostos (39 progressão semiaberto, 921 progressão aberto, 495 livramento, 849 indulto, 119 prescrição, 1.544 término de pena); e **5.226** "incidentes já instaurados e pendentes de decisão... há mais de 90 dias", que o relatório **não** decompõe. A leitura colou a decomposição de um no outro. O resto do item está certo, inclusive "o mais antigo desde 29/1/2018" (autos 0369680-85.2003.8.13.0024). O §2 da mesma leitura usa os dois números **corretamente** (444 no fechado/semiaberto, 3.967 no aberto) — é só o item 3 da lista principal que precisa de conserto.

**2.9 — LEITURA 3, item 9: "pelo menos 5 unidades com números creditados".** São 4 com número (17.907 na 1ª de Garantias, 18.384 na 2ª de Garantias, 3.860 no Tribunal do Júri-Sumariantes, 3.312 no 2º Juizado de Violência Doméstica); a quinta (4º Juizado, 6.42.4) diz `mais de cinco mil processos`, sem número creditado. O intervalo publicado "~3.300 a ~18.400" está certo para as quatro.

**2.10 — LEITURA 3, §3 e §5: "8 unidades" com inconsistência estatística, "por causa da migração PJe→Eproc".**
Contei **6 seções** com divergência estatística explícita / painel do CNJ (6.10.4, 6.24.4, 6.28.4, 6.37.5, 6.52.5, 6.61.4). E, mais importante: **o relatório não atribui a divergência à migração**. A 6.24.4 explica a diferença por **datas de referência distintas** (formulário extraído do PJe em 23/02/2026 vs. Painel CNJ com referência 24/03/2026); a menção a PJe/Eproc está na *determinação* (integrar as duas plataformas ao BI), não no diagnóstico. Apenas 2 seções (6.10.4 e 6.24.4) tocam em sistemas. **Correção**: "6 unidades" e cortar a causa; a citação-âncora (`"evidenciando problema sistêmico de padronização metodológica"`) confere literalmente e basta sozinha.

**Números que confirmei e estão corretos** (recontei um a um): os 147 processos com réu preso >60 dias em 6 gabinetes (9+24+9+19+42+44, seções 4.4/4.8/4.9/4.17/4.22/4.28); os "quase 500 presos/mês" — e aqui o relatório é **mais forte** que a leitura, ver §7 abaixo; 46% dos presos em flagrante; 1.084 audiências/mês; 5.226 e 3.967 e 444 e 1.544; 6.862 processos e 1.187 conclusos com 234 >120 dias e Meta 6 em 0% em Nova Lima; 217 vs 557/536/620 denúncias nos quatro juizados; 13 unidades com perícia de insanidade mental; 5 gabinetes com Meta 1 não atingida; a Meta 1 metodologicamente questionada em exatamente 2 varas criminais (6.37.5 e 6.52.5, mesma frase). Toda a coluna "Volume" da tabela da LEITURA 4 reproduz exatamente (10.269 / 8.819 / 8.208 / 6.791 / 5.356 / 4.792 / 4.715 / 4.334), assim como a coluna de determinações (3ª Fazenda = 8, o máximo).

---

## 3. Achado atribuído à unidade errada

Conferi 20 atribuições contra os cabeçalhos do PDF (`p2026.txt`), não 8. **Duas erradas.**

**3.1 — LEITURA 3, item 9: os 3.860 processos NÃO são do 4º Juizado de Violência Doméstica.**
Publicado: *"por exemplo, no 4º Juizado de Violência Doméstica, 'outros 3.860 processos' ficam anos entre delegacia e Ministério Público"*.

O trecho com 3.860 está na seção **6.14.4**, cujo `unidade` no JSON é o balde genérico `"VARAS"`. Fui ao PDF: o cabeçalho de 6.14 (p. 478) é **`6.14. TRIBUNAL DO JÚRI - 1º E 2º SUMARIANTE DE BELO HORIZONTE`** — e o próprio texto cita "1º Sumariante" e "2º Sumariante", que não existem em juizado de violência doméstica. A seção do 4º Juizado é a **6.42.4**, e ela diz `mais de cinco mil processos`, sem o 3.860. **Correção**: o número é do Tribunal do Júri – 1º e 2º Sumariante de BH.

Este é exatamente o modo de falha que o projeto já conhece: cabeçalho quebrado ⇒ `unidade` genérica ⇒ a leitura preencheu de memória com a unidade vizinha.

**3.2 — LEITURA 4: a "redistribuição de inquéritos por sorteio" não é da 1ª Vara de Garantias, e o argumento central da leitura cai com ela.**
Publicado, como prova de que volume mede a coisa errada: *"1ª Vara de Garantias de BH é #3 em volume, mas zero menções a termo de gravidade (#41) — o texto é longo porque descreve com detalhe um problema processual (**redistribuição de inquéritos por sorteio**), não porque acumula vários problemas graves."*

Grep de "sorteio" em todo o JSON: as duas únicas ocorrências estão na seção **6.55.4 — 11ª VARA CRIMINAL DA COMARCA DE BELO HORIZONTE**, não em 6.9.4. A 6.9.4 é o oposto do que a frase diz: preso levado ao presídio e só conduzido à custódia no dia seguinte; monitoramento implementado só no dia posterior em 46% dos flagrantes, o que o CNJ traduz em `quase 500(quinhentos) presos são incluídos mensalmente no sistema prisional desnecessariamente`; ausência de exame de corpo de delito prévio; decisão da custódia tomada em gabinete sem prova de ciência do preso; fiança policial sem custódia. **Correção**: apagar a frase e trocar o exemplo — a 1ª Vara de Garantias é o pior caso possível para ilustrar "volume alto sem gravidade".

E veja o §4.1 abaixo: o "#41 em gravidade" também é artefato de métrica.

**Atribuições que conferi e estão certas**: 6.9.4 e 6.25.4 = 1ª e 2ª Varas de Garantias; 6.70.4 = VEP-BH; 6.15.4 = 2º Juizado de Violência Doméstica; 6.22.4 = 2ª Vara Criminal e Execução Penal de Nova Lima; 6.24.4 = 2ª Vara da Fazenda Pública de Sete Lagoas; 6.6.5 = 1ª Vara da Fazenda Pública (BDMG); 6.59.5 = 24ª Vara Cível de BH; 6.66.4 = Tribunal do Júri Presidente de BH; 6.69.4/6.69.5 = Vara da Infância e Execuções Penais de Betim; 7.8 = Precatórios; 3.4 = Corregedoria-Geral; e os 6+1 gabinetes nominados (4.4 Bruno Terra Dias, 4.8 Edison Feital Leite, 4.9 Eduardo Machado Costa, 4.10 Enéias Xavier Gomes, 4.17 Jaubert Carneiro Jaques, 4.22 Júlio César Lorens, 4.28 Paulo de Tarso Tamburini Souza) — inclusive a 4.17, que o JSON rotula `"GABINETES"` e cujo titular só se descobre no PDF. A LEITURA 4 acertou os sete nomes.

**3.3 — LEITURA 3, §3: "2 câmaras cíveis (10ª e 12ª)" na videoconferência são três, e a 10ª aparece duplicada.**
As quatro seções com o achado são 4.16.4 (**10ª Câmara Cível**), 4.29.4 (**15ª Câmara Cível**), 4.31.4 (**12ª Câmara Cível**) e 4.33.4 (**10ª Câmara Cível** de novo). **Correção**: três câmaras — 10ª, 12ª e 15ª — apontadas a partir de quatro gabinetes.

---

## 4. Ranking sem ressalva de viés, ou com ressalva decorativa

**4.1 — LEITURA 4: a métrica de gravidade não mede gravidade, e a leitura publica um ranking com ela.**

O regex declarado é `grave/gravíssim/urgênc/urgente/sensibilidade institucional/vulnerável/impunidade`. **Ele não pega a palavra "gravidade"** — que é o substantivo que o CNJ mais usa. Prova direta: a 6.9.4 escreve `Considerando a **gravidade** de tal situação, determina-se à Presidência...` e mesmo assim marca **0** e cai para "#41". A 6.15.4 usa "gravidade" mais duas vezes (`Apesar da gravidade clara da situação`, `Mesmo diante da gravidade da situação`) e a 6.25.4 uma. O caso que a leitura escolheu para provar sua tese é justamente o falso zero da métrica.

**4.2 — LEITURA 4: "Fazenda Pública = perfil administrativo, sem risco a pessoas" é confusão de formato com conteúdo.**

O relatório de 2026 é escrito em **dois registros diferentes**. Um é narrativo (`determina-se à Presidência que...`), das varas criminais/garantias/execução; o outro é telegráfico em bullets (`Achado: ... Determinação: ...`), das varas de Fazenda Pública, Empresarial, Cível e Tributária. Medi a correlação:

- 36 seções em formato bullet ⇒ **1** termo de gravidade no total
- 46 seções em formato narrativo ⇒ **28** termos de gravidade

Ou seja: a "gravidade zero" da Fazenda Pública é quase inteiramente explicada por quem escreveu a seção e como, não pelo que a vara faz. A leitura já viu que **volume** é artefato — mas tratou **gravidade** como substantiva e montou em cima dela a tese "Fazenda concentra descumprimento burocrático, sem risco a pessoas". **Correção**: a tabela por tipo de unidade não pode sair sem dizer que o relatório mistura duas metodologias de redação, e as colunas de gravidade das duas famílias não são comparáveis.

**4.3 — LEITURA 4: o único indício de viés de seleção não é indício do que ela diz.**

Publicado: *"Um único trecho (seção 3.4) sugere que ao menos parte das unidades citadas ali foi apontada por 'desempenho reiteradamente crítico em indicadores estruturais' — ou seja, já eram suspeitas antes da inspeção começar. Isso é um indício de que a amostra é dirigida a quem já parecia problemático."*

A citação existe literalmente. Mas li a 3.4 inteira: as unidades ali nomeadas são **Paracatu, São Sebastião do Paraíso, Igarapé, Uberaba, 1º e 2º JE de Governador Valadares, 2ª Fazenda de Juiz de Fora**, mais 8 comarcas de 1ª entrância e 7 de 2ª. **Nenhuma delas está entre as 101 unidades inspecionadas.** São unidades que a Corregedoria Nacional mandou a Corregedoria local monitorar por 120 dias, identificadas por questionário — não amostra da inspeção. O trecho não diz nada sobre como as 101 foram escolhidas. **Correção**: a ressalva de viés continua válida e necessária, mas fica sem esse apoio; o honesto é dizer que **não há informação nenhuma** sobre o critério de seleção, ponto — o que a própria leitura já diz duas linhas antes.

**4.4 — O que está certo aqui e merece sobreviver.** A frase para o portal da LEITURA 4, tirando o "103", é a melhor coisa produzida pelas cinco leituras e resolve o critério 4: nomeia os rankings concorrentes, diz que o CNJ não informa o universo nem o critério, e recusa explicitamente o rótulo "pior vara do TJMG". Não é decorativa: o texto seguinte não a contradiz. A ressalva de viés da LEITURA 1 (§4, "o ranking mede o que foi escrutinado") e a da LEITURA 2 (§4, "BH tem mais seções neste arquivo, não mais problemas") também aguentam.

---

## 5. Afirmação jurídica sem o ato, ou com o ato errado

**5.1 — LEITURA 5, Lacuna 3: a Resolução CNJ nº 215/2015 não se aplica à Defensoria Pública.**

Publicado: *"checamos o anexo de transparência da Resolução CNJ nº 215/2015 ... e ele cobra três coisas ... Nenhuma delas é 'publicar relatório com números'. Ou seja: nem a Res. CNJ 215/2015 nem ... as normas correicionais equivalentes do Ministério Público exigem a publicação desses números. Não é, portanto, descumprimento de norma."*

A **conclusão está certa e é exatamente a postura que o critério 5 exige** — a leitura recusou dizer "descumpre" onde não há dever. Mas o ato citado não alcança o órgão. Li `cnj215.txt` (84.710 bytes): o art. 1º diz que a Resolução rege o acesso à informação e a transparência **"dos órgãos do Poder Judiciário e serviços auxiliares"**. A palavra "Defensoria" **não aparece uma única vez** no texto inteiro; "Ministério Público" também não. A Defensoria Pública é função essencial à justiça (CF, art. 134), fora do rol do art. 92 e fora do controle do CNJ (CF, art. 103-B, §4º). **Correção**: as normas que efetivamente incidem sobre a Ouvidoria da DPMG são a LC 80/1994 (art. 105-A a 105-C) e a LAI (Lei 12.527/2011) — e é contra elas que se deve checar se há ou não dever de publicar números. Publicar "checamos a Res. CNJ 215/2015 e ela não obriga a DPMG" é citar ato inaplicável, e um leitor jurídico vai ver isso de imediato.

**5.2 — LEITURA 5: a relação entre 215/2015 e 432/2021 está invertida.**
Publicado: *"Resolução CNJ nº 215/2015 (que **incorpora**, para o item Ouvidoria, as exigências da Resolução CNJ nº 432/2021, art. 5º)"*. Uma resolução de 2015 não incorpora exigências de 2021. O que existe (e confirmei no arquivo) é o **anexo/checklist de transparência**, onde os itens 24, 25 e 26 (OUV) remetem a `Resolução CNJ nº 432/2021, art. 5º` e o item 23 remete a `Art. 41, III, da Resolução CNJ nº 215/2015`. **Correção**: "o anexo de transparência aplicado pelo CNJ, que para o item Ouvidoria remete à Res. 432/2021, art. 5º".

**5.3 — LEITURA 5: a leitura substantiva dos três itens confere.** Os itens 24/25/26 são exatamente registro de denúncia, acompanhamento de denúncia e avaliação do serviço — nenhum exige relatório numérico; e o item 23 (relatório estatístico anual de pedidos de informação) é justamente o que a DPMG cumpre. O contraste que a matéria quer fazer está bem fundado *na lógica interna da norma* — só precisa ser reancorado numa norma que valha para Defensoria.

**5.4 — LEITURA 3, §2: as fundamentações normativas conferem.** `art. 8º, VII, "f", da Resolução CNJ n. 213/2015` para o corpo de delito e `art. 1º da Resolução CNJ n. 213/2015` para a fiança policial estão no texto do CNJ, não foram acrescentados pela leitura; o `art. 91 da LEP` e o `art. 35 do CP` idem. Nenhuma afirmação jurídica de autoria da leitura.

---

## 6. Nome de pessoa física particular

**Nenhum vazou.** Conferi:

- 2022: nenhum CPF nas 24 seções (confirmado), e os quatro nomes citados são agentes públicos em função — Des. Maria Aparecida de Oliveira Grossi Andrade, Des. Osvaldo Oliveira Araújo Firmo, Des. Vítor Inácio Peixoto Parreira Henriques, juiz Afrânio José Fonseca Nardy. Todos sinalizados como decisão editorial, corretamente.
- 2023: a juíza **Karen Castro dos Montes** (1ª Vara Cível de Itabira) aparece verbatim no relatório e a LEITURA 1 sinalizou sem decidir. Correto.
- 2026: `cpfsRedigidos: 6` no JSON, e nenhum CPF entrou em nenhuma leitura.
- LEITURA 5 manteve fora do texto os desembargadores requeridos nos processos disciplinares — **correto e importante**.

**Duas observações para o sintetizador, não defeitos das leituras:**

**6.1 —** A pauta de 18/08/2026 nomeia magistrados como requeridos em apuração disciplinar **ainda não julgada**. A LEITURA 5 fez certo em omitir. Mas ela publica os dois números de processo do item 5 — que levam direto ao nome numa busca. Se o portal publicar os números, publicou o nome por via oblíqua. Ou se tiram os números, ou se assume a nomeação conscientemente.

**6.2 —** O mesmo desembargador aparece com **duas grafias** nas duas fontes: `Vítor Inácio Peixoto **Parreira** Henriques` (2022, seção 6.21.3) e `Vitor Inácio Peixoto **Parreiras** Henriques` (2023, seção 6.35.5). Cada leitura copiou a sua fonte corretamente; o portal precisa unificar, ou vai parecer que são duas pessoas.

E um cruzamento que vale como resultado: a LEITURA 2 classificou esse gabinete como "candidata mais fraca" para reaparecer em 2023, porque em 2022 declarou cumprimento total (`houve cumprimento do que foi determinado`). A LEITURA 1 encontrou o mesmo gabinete em 2023 com **4 de 4 recomendações não atingidas** (`foi informado que não foi possível atingir o resultado esperado`). **A autoavaliação de 2022 não se sustentou em 2023** — é uma das melhores pontes disponíveis, e nasceu do choque entre as duas leituras.

---

## 7. Suavização ou dramatização

**7.1 — LEITURA 3, item 1: amaciou o achado mais grave do relatório.**
Publicado: *"se o juiz concede liberdade com monitoramento eletrônico, ela volta ao presídio e 'somente no dia posterior é implementado o monitoramento e feita a efetiva soltura' — isso em 46% dos presos em flagrante, ~500 pessoas/mês."*

O `~500` está apresentado como cálculo da leitura (46% × 1.084). **Não é cálculo dela: é conclusão escrita pelo CNJ**, e em termos muito mais duros:

> "conclui-se que, em média, quase 500(quinhentos) presos são incluídos mensalmente no sistema prisional **desnecessariamente**. A rotina é claramente contraproducente."

E adiante: `o preso — beneficiado com liberdade provisória — é levado de volta ao presídio, no qual permanece claramente indevidamente por mais uma noite`. **Correção**: usar a frase do CNJ. Aqui o texto original bastava e a paráfrase enfraqueceu.

**7.2 — LEITURA 3, item 2: a citação é do relatório de 2023, reproduzida em 2026.**
`nenhuma medida efetiva é adotada pelo juízo, seguindo irregularmente o cumprimento da pena` está dentro de um bloco que a 6.70.4 abre com `Naquela oportunidade foi asseverado que:` — é o CNJ citando o próprio relatório de novembro/2023. A leitura acerta ao dizer "problema já apontado em inspeção de novembro/2023 e ainda não resolvido", e o texto de 2026 conclui `foi observado durante esta inspeção que o problema persiste`. Mas a citação, do jeito que sai, lê-se como redação de 2026. **Correção**: atribuir a citação a 2023 e a persistência a 2026 — o que, aliás, deixa o achado mais forte.

**7.3 — LEITURA 3, item 7 e §2: a ressalva sobre o CERESP está certíssima, mantenha.**
Confirmei: a 6.69.4 tem 291 caracteres e trata só de edital de vaga de servidor. O diagnóstico da superlotação não está no achado; `mitigar a grave violação de direitos em curso` só aparece na recomendação 6.69.5.2, dirigida à **Presidência**, não à vara. A leitura disse exatamente isso e resistiu a inflar. Idem a nota de que a mesma vara é elogiada (`busque a manutenção das excelentes práticas de gestão de acervo e fluxo processual`) e cobrada por algo fora do seu controle — conferi as duas citações, ambas literais.

**7.4 — Nenhuma dramatização encontrada.** Não achei um adjetivo de autoria das leituras substituindo o texto do CNJ. Os termos duros que aparecem (`alarmante`, `gargalo crítico`, `epicentro`, `afronta ao princípio constitucional`, `sensação de impunidade`, `problema generalizado e que demanda atuação imediata`) são todos do relatório. O §4 da LEITURA 3, que lista os quatro elogios explícitos, é um contrapeso honesto e as quatro citações conferem literalmente.

---

## 8. Veredito por leitura

**LEITURA 2 (pendencias-2022) — sólida.** É a única sem defeito material. Conferi: `total:24` = `len(pendencias)`; a duplicata de `7.34.3` com textos contraditórios existe mesmo (324 e 96 chars) e ela recusou escolher qual prevalece; a distribuição 12 BH + 3 gabinetes + 2 Ouro Preto + 2 Sete Lagoas + 1 Itabira + 4 cúpula fecha em 24; as 6 citações são literais; o uso de `[do]` para marcar inserção; a desconfiança dos três flags automáticos, com os quatro casos testados um a um, confere (7.10.3 e 7.15.3 falso-positivos, 7.29.4 e 8.2 verdadeiros); os 531 processos da 6.17.3 e os 279 da 6.21.3 conferem; a ressalva de viés é honesta. A PONTE previu Precatórios como candidata mais forte — e o §0 acima mostra que ela acertou em cheio, contra um texto que ela não podia ver.

**LEITURA 1 (pendencias-2023) — sólida no qualitativo, frágil no ranking.** As 8 citações existem (2 com retoque, §1.1 e §1.2); a lista de 16 seções sobre processos parados existe integralmente no JSON; os 6 cabeçalhos `Quantidade de determinações pendentes` (9.1=2, 9.2=2, 9.3=6, 9.4=3, 9.5=2, 9.6=5) conferem e a conferência declarada "bateu em 5 de 6" é verdadeira; a DET58 duplicada em 1.4 e 9.6.2 existe (`despesas sem empenho prévio`, item iv lá e item v cá); as 4 recomendações do gabinete 6.35.5 são i–iv e nenhuma foi atingida. **Consertar antes de publicar**: DIRSEP 83% (§2.6), SECAUD 100% (§2.7), e as duas citações retocadas.

**LEITURA 3 (achados-2026) — a mais rica e a que mais precisa de conserto pontual.** Praticamente todos os números-chave sobrevivem à recontagem. **Consertar**: os 3.860 do Tribunal do Júri (§3.1, grave — é atribuição errada), a decomposição colada no 5.226 (§2.8), as câmaras da videoconferência (§3.3), as "8 unidades" e a causa da divergência estatística (§2.10), o `~500` que devia ser citação do CNJ (§7.1), a citação de 2023 apresentada como de 2026 (§7.2), e a premissa de que seção vazia = nada a apontar (§0).

**LEITURA 4 (ranking-2026) — método certo, execução com dois furos que derrubam a demonstração.** A tese ("volume é métrica errada") está certa e é valiosa; a coluna de volume e a de determinações reproduzem exatamente. Mas a métrica de gravidade não pega "gravidade" (§4.1), o exemplo-âncora da 1ª Vara de Garantias descreve outra unidade e inverte o conteúdo (§3.2), o formato do relatório confunde-se com o perfil da unidade (§4.2), o indício de viés não indicia (§4.3), os prazos não somam (§2.4) e o 103 do portal são 101 (§2.5). **Recomendação**: rodar de novo com o regex corrigido e trocar o exemplo antes de qualquer publicação. A frase final para o portal, corrigido o número, pode ficar.

**LEITURA 5 (materia-lacunas) — uma lacuna morre, uma perde o ato, uma sobrevive com correções.**
- **Lacuna 2: derrubada** (§2.1). A refutação está no arquivo que a própria leitura baixou.
- **Lacuna 3: conclusão certa, ato errado** (§5.1, §5.2). Além disso, atenção: `dpmg_ouv.html` traz no corpo `"Seu navegador não suporta JavaScript, ou não está ativado!"` e `dpmg_transp_ouv.html` renderiza **944 caracteres de texto visível** no total. Já `dpmg_transp_lai.html` tem 6 referências a `.xlsx` no HTML servido. O contraste "publica XLSX de LAI, não publica nada de ouvidoria" pode ser real, mas está medido comparando uma página cuja lista é renderizada no servidor com outra que pode renderizar no cliente — exatamente o modo de falha que a própria leitura admitiu para o menu do MPMG e não aplicou ao seu título. **Reconferir em navegador antes de publicar.** As medições de bytes (116.517 e 44.107), a ausência de "relatório" e de PDF nas duas, os 74.379 bytes e 2 PDFs da página de PAD do TJMG e a ocorrência única de "disciplinar" no MPMG: todas reproduzidas exatamente por mim.
- **Lacuna 1: sobrevive**, com o boletim mais recente corrigido para a 8ª Sessão de 23/05/2023, 129 entradas, três itens de pauta e não dois. E, se o §0 for reprocessado, ela ganha um reforço enorme: o próprio CNJ registra `Ausência de Sistema de Ouvidoria` no TJMG, no capítulo 8 que a extração perdeu.