# Plano ativo — Cavas: MVP de 5 a 10 candidatos

> **Tipo:** PLANO
> **Domínio:** mineração (cavas, modelo de visão, dados territoriais)
> **Última medição:** 2026-10-23
> **Leitura estimada:** média (5–15 min)
> **Relacionados:** [MEDICOES-CAVAS-MINERACAO.md](../historico/planos/MEDICOES-CAVAS-MINERACAO.md), [ESTEIRA-CAVAS.md](../historico/planos/ESTEIRA-CAVAS.md), [PLANO-GLOBO-CAVAS-MINERACAO.md](../historico/planos/PLANO-GLOBO-CAVAS-MINERACAO.md), [PLANO-MAPEAMENTO-MINERACAO-ILEGAL.md](../historico/planos/PLANO-MAPEAMENTO-MINERACAO-ILEGAL.md), [FONTES.md](../06-fontes/FONTES.md), [REGRA-EDITORIAL.md](../01-produto/REGRA-EDITORIAL.md), [PLANO-INTEGRADO-AMBIENTAL-E-DADOS.md](PLANO-INTEGRADO-AMBIENTAL-E-DADOS.md), [ESTADO.md](../02-estado/ESTADO.md), [AGENTS.md](../../AGENTS.md)
> **Palavras-chave:** cavas, mineracao, mvp, cbers, pan-sharpen, 2m, 8m, chinese-clip, anm, semad, ibama, embargo, gold-set, funil, revisao-humana, automacao, logon

## Sumário

- [Propósito e escopo](#propósito-e-escopo)
- [Definição operacional do MVP](#definição-operacional-do-mvp)
- [Estado medido](#estado-medido)
- [Funil em cinco etapas](#funil-em-cinco-etapas)
- [Lacuna do gold set](#lacuna-do-gold-set)
- [Automação desejada](#automação-desejada)
- [Riscos e regra editorial](#riscos-e-regra-editorial)
- [Cronograma e critérios de pronto](#cronograma-e-critérios-de-pronto)
- [Origem e histórico](#origem-e-histórico)

## Propósito e escopo

Este é o plano ativo da frente de cavas. Ele substitui a continuação dos
planos arquivados e responde a uma pergunta menor e mais útil que "quantas
cavas ilegais existem no Brasil": **quais 5 a 10 áreas têm evidência
suficiente de atividade mineral sem autorização para virar um dossiê
conferível por uma pessoa?**

O recorte do MVP é Minas Gerais. A varredura nacional fica para depois de o
funil provar que encontra o que promete. O prazo realista é de **4 a 8
semanas**, contando coleta, treino, varredura, confirmação e redação dos
dossiês.

O que este plano **não** faz:

1. não publica contagem de "cavas ilegais";
2. não chama o resultado de crime;
3. não treina nem infere em nuvem;
4. não varre o Brasil inteiro antes de fechar o piloto de MG;
5. não usa o gold set como treino.

A regra editorial completa está em
[REGRA-EDITORIAL.md](../01-produto/REGRA-EDITORIAL.md) e a barra de publicação
em [PLANO-GLOBO-CAVAS-MINERACAO.md](../historico/planos/PLANO-GLOBO-CAVAS-MINERACAO.md)
(linhas 115–133). A palavra **"ilegal" é vetada** em título, chamada, legenda,
ficha, camada do globo e resposta do chatbot. O vocabulário permitido é
"indício de atividade fora da poligonal", "área com aparência de mineração
sem cadastro ANM na área" e "sem autorização identificada na fonte".

## Definição operacional do MVP

MVP pronto significa **5 a 10 candidatos** com evidência de atividade sem
autorização, cada um passando por:

1. **2 de 3 métodos**: A (mudança temporal), B (similaridade visual em 2 m)
   e C (baseline do Monitor da Mineração/MapBiomas).
2. **Revisão humana** de um revisor que não participou da geração da fila.
3. **Checagem oficial** em ANM/SIGMINE, SEMAD e IBAMA: processo, fase,
   embargo, auto ou ausência declarada.
4. **Confiança de 90% caso a caso**, com rubrica de quatro itens: imagem
   datada e limpa; geometria de cava visível em 2 m; 2 de 3 métodos; consulta
   oficial sem cadastro ou com inconsistência compatível. 90% significa 4/4
   itens e segunda leitura. **Não é intervalo de confiança estatístico.**
5. **Dossiê** com data, fonte, método, link oficial, ressalva de máquina e
   frase fixa: "receber sinal não é ilícito; a apuração é da autoridade".

Com n=10 não existe precisão estatística. O plano mede **confiança caso a
caso** e registra o método; quem ler o dossiê precisa conseguir refazer o
caminho. A tentativa de vender "precisão de 90%" com dez casos seria número
inventado — e número inventado é dano, não marketing.

Critério de reprovação: se o funil não chegar a 5 candidatos com 2 de 3
métodos e checagem oficial, o MVP não fecha. Publica-se o que foi medido
(cobertura, fila, motivos de descarte), não um número inflado.

## Estado medido

Tudo abaixo foi medido no disco ou no Agendador entre 19 e 20/10/2026. A
coluna "fonte" aponta o arquivo e a linha; o que não tem linha é medição
desta rodada e está identificado como tal.

| O que | Número medido | Fonte |
|---|---|---|
| Modelo 8 m v12 (hard negatives, peso 1,5) | F1 **0,804** · P **0,850** · R **0,764** · 76 falsos positivos em 476 negativos | [ESTEIRA-CAVAS.md:68–73](../historico/planos/ESTEIRA-CAVAS.md) |
| Modelo 2 m, recorte 224 px | F1 **0,576** · P **0,548** · R **0,607** · holdout 161 (28 positivos) | [MEDICOES:895–899](../historico/planos/MEDICOES-CAVAS-MINERACAO.md) |
| Modelo 2 m, ponto conservador (época 2) | P **0,857** · R **0,429** · F1 **0,571** | [MEDICOES:902–904](../historico/planos/MEDICOES-CAVAS-MINERACAO.md) |
| Limiar 2 m para P ≥ 0,90 | limiar **0,81** · P **1,000** · R **0,077** (3/39) | [MEDICOES: calibração 20/10](../historico/planos/MEDICOES-CAVAS-MINERACAO.md) |
| Modelo 2 m 20/10 (246 limpos, GPU) | F1 **0,619** · P **0,812** · R **0,500** no limiar 0,54; **P ≥ 0,90 inalcançável** | [MEDICOES: segundo treino 20/10](../historico/planos/MEDICOES-CAVAS-MINERACAO.md) |
| 2 m, split congelado, **sem hard no treino** | F1 **0,629** · P **0,520** / R **0,796**; P ≥ 0,80: P 0,818 / R 0,367; P ≥ 0,90: R 0,082 | [MEDICOES: split congelado 20/10](../historico/planos/MEDICOES-CAVAS-MINERACAO.md) |
| 2 m, split congelado, **com hard no treino** | F1 **0,660** · P **0,689** / R **0,633**; P ≥ 0,80: P 0,812 / R 0,531; P ≥ 0,90: R 0,102 | [MEDICOES: split congelado 20/10](../historico/planos/MEDICOES-CAVAS-MINERACAO.md) |
| 2 m, 21/10, hard completo + automático | F1 **0,613** · P **0,885** / R **0,469**; P ≥ 0,90 em 0,67 com **R 0,163** (8/0/41/110) | [MEDICOES: retreino automático 21/10](../historico/planos/MEDICOES-CAVAS-MINERACAO.md) |
| Base 2 m limpa | 844 recortes: 207 positivos, 637 negativos, 163 cenas | [MEDICOES:884–887](../historico/planos/MEDICOES-CAVAS-MINERACAO.md) |
| Positivos 2 m | 536 `ok`; **209 limpos** em 19/10 | [MEDICOES:941](../historico/planos/MEDICOES-CAVAS-MINERACAO.md) |
| Positivos limpos | **305** (G1 atingido em 23/10) | medição local; supervisor de coleta |
| Positivos 2 m pendentes | **~1.400** (1.503 sem corte em 19/10, menos o avanço de 20/10) | [MEDICOES:909](../historico/planos/MEDICOES-CAVAS-MINERACAO.md) |
| Auditoria humana dos 30 mais fortes | **0/30** eram cava sem autorização; rio, lago, ilha, cidade, irrigação, pasto, desmate e nuvem | [ESTEIRA:40–48](../historico/planos/ESTEIRA-CAVAS.md) |
| Falsos positivos do modelo | 1.109 de 3.137 negativos pontuados como cava em score ≥ 0,65 | [ESTEIRA:40–48](../historico/planos/ESTEIRA-CAVAS.md) |
| Assinatura de "chão pelado" | mediana de solo nu **0,97** tanto em cava real quanto em falso positivo | [ESTEIRA:50–54](../historico/planos/ESTEIRA-CAVAS.md) |
| Automação | 2 tarefas de 4 h: uma coleta negativo 8 m; outra aponta para `.cmd` inexistente; vigia de treino não está rodando (Startup existe, tarefa do Agendador ausente) | Agendador em 20/10; intenção em [`coleta.cmd:2`](../../scripts/oficina-cavas/coleta.cmd) e [`setup-vigia-treino-2m.py:34`](../../scripts/oficina-cavas/setup-vigia-treino-2m.py) |

**Atualização 23/10:** G1 de positivos atingido (**305 limpos**). O
supervisor retreinou sozinho com **975 limpos**: F1 **0,630**; P
**0,810** / R **0,515**; P ≥ 0,90 no limiar 0,62 com **R 0,288**
(19/2/47/108). O modelo melhorou com o G1; o gargalo agora é o gold
set.

**Status da execução em 23/10:** G1 de positivos atingido — **305
limpos**. O supervisor retreinou sozinho com 975 limpos: F1 0,630;
P 0,810 / R 0,515; P ≥ 0,90 em 0,62 com R 0,288. O manifesto tem
2.901 recortes e a shortlist do gold set, 60 linhas (24 positivos +
10 controles + reservas). O gargalo agora é revisar os atos e
confirmar os casos; o encanamento está pronto.

Leituras que mudam o plano:

- **O 8 m é o melhor modelo hoje, mas não é o produto.** P 0,850 é bom para
  triagem; ainda assim, 76 falsos positivos em 476 negativos viram fila de
  revisão grande demais para um MVP de 5 a 10 casos.
- **O 2 m é a direção certa, com holdout pequeno.** O F1 0,576 não é
  comparável ao 0,804 do 8 m porque o holdout é outro e tem 28 positivos
  ([MEDICOES:906](../historico/planos/MEDICOES-CAVAS-MINERACAO.md)). O ponto
  conservador P 0,857/R 0,429 é útil para descoberta, não para contagem.
- **O ciclo automático já roda.** O supervisor treinou e calibrou
  sozinho com 934 limpos: F1 **0,613**; P **0,885** / R **0,469**;
  P ≥ 0,90 no limiar 0,67 com **R 0,163** (8/0/41/110). O manifesto
  tem 2.901 recortes. O hard ajuda, mas o 90% continua sendo uma fila
  de alta precisão, não um veredito; o gargalo agora é gold set e
  confirmação.
- **Com o G1, o modelo subiu de novo.** 305 positivos limpos (975
  no total): F1 **0,630**; P **0,810** / R **0,515**; P ≥ 0,90 em
  0,62 com **R 0,288** (19/2/47/108). A fila de alta precisão
  melhorou, mas ainda é fila; o próximo ganho vem do gold set, não
  de mais um lote de positivos.
- **O topo da fila atual é falso positivo.** 0/30 na auditoria humana é o
  dado mais importante da frente: o modelo aprendeu "chão pelado com borda"
  e confunde cava com lavoura, desmate e cidade. O MVP só fecha com 2 m,
  negativos difíceis e revisão humana.

## Funil em cinco etapas

O funil é deliberadamente estreito. Cada etapa tem um gate que pode reprovar
o MVP; gate reprovado não se contorna com número.

| Etapa | O que faz | Gate | Números e estimativa | Prazo |
|---|---|---|---|---|
| **1. Dados** | Congela o conjunto 2 m rotulado; corta só o que falta para o gate | **G1 atingido:** 305 positivos limpos e 673 negativos limpos, por cena | 305 positivos e 673 negativos em 23/10; sem corte extra até o gold set | concluído |
| **2. Modelo** | Treina 2 m no recorte 224; calibra limiar por precisão | **G2:** P ≥ 0,80 no holdout por cena, com R reportado; se não passar, 8 m v12 fica como triagem e 2 m como confirmação | Base de 844 recortes; treino já roda em CPU; 6 épocas é o ponto de partida | 3–5 dias |
| **3. Varredura** | 8 m v12 pontua as janelas de MG fora do SIGMINE; 2 m reconfere o topo | **G3:** 3.869 janelas pontuadas; top 200 reconferidas em 2 m; top 40 na fila humana | 3.869 janelas (`mining_age` com `dentro_sigmine=false`, [FONTES:845](../06-fontes/FONTES.md)); 200 cortes 2 m ≈ 4,7 h a 84 s cada | 1–2 semanas |
| **4. Confirmação** | 2 de 3 métodos + revisão humana + checagem ANM/SEMAD/IBAMA | **G4:** 40 revisadas; 10–15 na lista curta; cada uma com método e consulta oficial registrados | 40 × ~20 min ≈ 13 h de revisão; documentação oficial consome mais que a imagem | 1–2 semanas |
| **5. Dossiê** | Redige 5–10 dossiês com imagem, data, fonte, método, link e ressalva | **G5:** 5–10 dossiês; 100% com 2 de 3 métodos + checagem oficial; aprovação do dono | 3–5 dias de redação e revisão; deploy só com ordem | 3–5 dias |

### Etapa 1 — Dados

- Cortar 2 m apenas até **G1**, não o backlog inteiro. A fila tem ~1.450
  positivos pendentes; processar todos custaria ~34 h de máquina a 84 s por
  recorte ([MEDICOES:940](../historico/planos/MEDICOES-CAVAS-MINERACAO.md)) e
  não melhora o MVP depois de 300/300.
- Um worker só. Dois workers devolveram 10 `sem-cena` em segundos, sem ler
  cena, na suspeita de limite do INPE
  ([MEDICOES:938–940](../historico/planos/MEDICOES-CAVAS-MINERACAO.md)).
- Nuvem é filtro, não verdade: o primeiro ponto novo de 19/10 veio `ok` com
  nuvem 1,000, inútil
  ([MEDICOES:933–936](../historico/planos/MEDICOES-CAVAS-MINERACAO.md)).
- Manifesto leve versionado; PNG e cache fora do git. Varredura de dado
  pessoal antes de commitar qualquer dado coletado (AGENTS § 5.2).

### Etapa 2 — Modelo

- Treinar com `--recorte 224` (2 m nativo), backbone congelado, seed e split
  por cena iguais aos da medição de 19/10.
- Escolher o limiar por **precisão**, não por F1: o seletor por F1 guarda o
  ponto de P 0,548; o ponto conservador de P 0,857/R 0,429 é o que interessa
  para descoberta ([MEDICOES:902–904](../historico/planos/MEDICOES-CAVAS-MINERACAO.md)).
- Se G2 não passar, **não insistir no 2 m como classificador único**: usar o
  8 m v12 (P 0,850) como triagem e o 2 m como confirmação visual/geométrica.
  Essa é a arquitetura de duas esteiras já desenhada em
  [ESTEIRA-CAVAS.md:100–134](../historico/planos/ESTEIRA-CAVAS.md).
- Negativos difíceis entram no treino: lavoura, desmate, cidade, açude, rio,
  nuvem. Sem isso o modelo volta a chamar chão pelado de cava. A fonte
  `--fonte hard` do gerador corta os **1.109 falsos positivos do v7** (hash,
  bbox e score) com label 0; rodar depois do lote positivo, priorizando o
  topo por score.

### Etapa 3 — Varredura

- Universo inicial: **3.869** feições `mining_age` com `dentro_sigmine=false`
  em MG ([FONTES:845](../06-fontes/FONTES.md)). Não é o Brasil; é o piloto.
- 8 m v12 pontua todas as janelas. O topo (200) é recortado em 2 m. O topo do
  2 m (40) vai para revisão humana.
- Custo medido: 84 s por recorte 2 m; 100 recortes ≈ 2,3 h
  ([MEDICOES:940](../historico/planos/MEDICOES-CAVAS-MINERACAO.md)). 200
  recortes ≈ 4,7 h, header incluso.
- Toda falha entra no relatório: `sem-cena`, nuvem, cena velha, leitura
  falhou. Lacuna é informação.
- A varredura roda offline, fora da CI, com pausa de 1–2 s por host e UA
  honesto (AGENTS § Pesquisa na internet).

### Etapa 4 — Confirmação

- **Método A (mudança temporal):** série anual do Monitor/MapBiomas e,
  quando houver, Sentinel-2. O Sentinel segue bloqueado pela rede deste PC
  ([PLANO-GLOBO:299–305](../historico/planos/PLANO-GLOBO-CAVAS-MINERACAO.md));
  a série `mining_age` é o substituto medido, não o ideal.
- **Método B (similaridade visual):** embedding Chinese-CLIP no recorte 2 m,
  comparação com o banco de cavas autorizadas e com negativos difíceis.
- **Método C (baseline oficial):** `transbordamento_lavra`,
  `lavra_fantasma`, `temporal_inconsistency` e `inappropriate_permission` do
  Monitor ([PLANO-GLOBO:58](../historico/planos/PLANO-GLOBO-CAVAS-MINERACAO.md)).
- **Checagem oficial:** processo e fase no SIGMINE/ANM; licença ou auto na
  SEMAD; embargo, auto ou ausência no IBAMA. Guardar o identificador e a
  data da consulta, não o nome de pessoa física.
- **Revisão humana:** revisor vê imagem 2 m, série temporal, polígono ANM e
  ato oficial. Divergência entre dois revisores volta para a fila; não se
  resolve por votação.

### Etapa 5 — Dossiê

Cada dossiê tem, no mínimo:

1. coordenada, município e data da imagem;
2. recorte 2 m e recorte de contexto;
3. estado dos três métodos (A/B/C), com o que passou e o que falhou;
4. processo ANM ou "sem cadastro na área"; consulta SEMAD e IBAMA com data;
5. ressalva de que a análise é gerada por máquina e revisada por humano;
6. frase fixa "receber sinal não é ilícito";
7. link para o visualizador oficial e para o canal de denúncia da autoridade.

Nada de "crime", "garimpo ilegal" ou "operação". O dossiê é convite para
conferir, não sentença.

## Lacuna do gold set

O holdout atual não mede o que o MVP precisa medir. Ele separa **cava
autorizada** de **ponto fora de todo SIGMINE**, não **irregular confirmado**
de **falso positivo**. Prova disso: o modelo chama 1.109 negativos de cava e
0 dos 30 mais fortes eram cava sem autorização
([ESTEIRA:40–48](../historico/planos/ESTEIRA-CAVAS.md)).

**O gold set de casos ilegais/irregulares confirmados ainda não existe.**
Sem ele, o funil pode ser medido por precisão de modelo, mas não por acerto
de caso real. É a maior lacuna do plano.

### O que já existe para montar

| Fonte | O que dá | Limite medido |
|---|---|---|
| IBAMA/embargos | 4.692 embargos em MG; **78** com termo de mineração | geometria para só 43 dos 403 embargos de MG testados ([PLANO-MAPEAMENTO:144–147](../historico/planos/PLANO-MAPEAMENTO-MINERACAO-ILEGAL.md)) |
| ICMBio | 14.719 embargos; **854** em MG | ato federal, não cobre a maior parte da mineração estadual |
| SEMAD/Sisema | **583.644** autos estaduais | sem campo de tipo; não isola mineração ([PLANO-MAPEAMENTO:174–178](../historico/planos/PLANO-MAPEAMENTO-MINERACAO-ILEGAL.md)) |
| ANM | portarias de suspensão e autos | sem bulk aberto; DOU automatizado exige chave de API (403 medido) ([PLANO-MAPEAMENTO:184–187](../historico/planos/PLANO-MAPEAMENTO-MINERACAO-ILEGAL.md)) |

Não somar essas bases. São atos diferentes, com coberturas diferentes
([PLANO-MAPEAMENTO:254–255](../historico/planos/PLANO-MAPEAMENTO-MINERACAO-ILEGAL.md)).

**Medição de 20/10 para o gold set:** 232 autos do IBAMA em MG têm coordenada
(225 processos, 74 municípios, 2007–2026), mas são só **6,0%** dos 3.891 autos
MG com termo; 403 embargos de mineração foram testados e **43** têm geometria
válida. O cruzamento com as cavas detectadas achou **11/232 autos** e
**1/43 embargos** a ≤ 500 m. Doze autos caem dentro de bbox do treino e
**devem ser excluídos** para não vazar. A proposta é 24 positivos (14 recentes
com imagem + 10 históricos) + 10 controles legais, com dedup de 1 km e no
máximo 2 casos por município.

**Shortlist de 21/10:** 60 linhas — 24 positivos primários (14
recentes + 10 históricos), 10 controles e 26 reservas. Base 277 →
244 elegíveis; 33 excluídos (12 em treino, 20 sem termo, 1 fora de
MG). Fontes: 22 autos IBAMA, 17 embargos IBAMA, 1 embargo SEMAD e
20 controles MapBiomas/ANM. Lacunas: 0 controle com cava confirmada,
0 ICMBio, 1 SEMAD e 6 recentes sem imagem CBERS. CSV em
`scripts/.cache/cavas-2m/gold-set/`, sem nome/CPF/CNPJ.

**Enriquecimento de 23/10:** 34/34 casos localizados no acervo local
— 17 autos IBAMA, 6 embargos IBAMA, 1 SEMAD e 10 processos ANM;
0 coordenada a mais de 2 km; 10 controles com fase/área ANM. As
imagens 2 m estão em `scripts/.cache/cavas-2m/gold-set/imagens/`.
Falta a revisão visual e a licença/fase oficial de cada positivo.

### Construção proposta

- **Meta:** 20 a 30 casos confirmados com geometria e documento oficial,
  mais 10 controles (cava autorizada sem mudança relevante).
- **Composição:** 10–15 de IBAMA/ICMBio com geometria; 10–15 de SEMAD/ANM
  com documento e coordenada. Se uma fonte não der 10, registra-se o motivo;
  não se completa com suposição.
- **Método:** selecionar por ato oficial, conferir a coordenada no 2 m,
  ler o documento, registrar o desfecho. Dois revisores por caso.
- **Uso:** avaliar o funil em modo cego; **nunca treinar** no gold set.
  Separar por município ou cena para não vazar.
- **Se der menos de 20 casos:** não se calcula precisão. O relatório diz
  "sem medida de precisão; confiança caso a caso" e o MVP segue com 5–10
  dossiês, sem número agregado.
- **Prazo:** 1–2 semanas, em paralelo ao funil. É dependência do G4, não do
  G1.

## Automação desejada

### Estado atual

- Há **duas tarefas de 4 h** no Agendador. Uma coleta negativos 8 m
  (`coleta.cmd:2`); a outra aponta para um `.cmd` que não existe no disco.
  As duas podem competir pelo mesmo cache.
- O **vigia de treino 2 m não está rodando**. O script e o instalador
  existem (`setup-vigia-treino-2m.py`); há um `.bat` na pasta Startup, mas
  nenhum processo ativo e nenhuma tarefa no Agendador em 20/10. O `.bat` com
  `start` solto e sem log torna a falha invisível.
- Resultado: a coleta 2 m depende de alguém lembrar de rodar; o treino não
  dispara sozinho; e a tarefa quebrada falha em silêncio.

### Desenho

1. **Coleta 2 m no logon.** Uma entrada na pasta Startup
   (`ControlePopular_Coleta2m.cmd`, porque o Agendador deste PC nega sem
   admin), que chama `coleta-2m.cmd` e o supervisor. Python absoluto, um
   worker, lote de 24 e retomada pelo checkpoint. Chama o gerador 2 m
   (`scripts/oficina-cavas/gerar-recortes-2m-rotulados.py`), não o coletor
   8 m.
2. **Treino e calibração no logon.** O `.bat` do vigia
   (`ControlePopular_VigiaTreino2m.bat`) roda com `--sem-treino`: ele só
   regenera o manifesto publicado. Quem treina é o
   `supervisor-treino-2m.py` (`ControlePopular_Treino2m.cmd`): espera 20
   recortes limpos novos, roda o treino no split congelado, calibra por
   limiar, salva estado e artefatos com carimbo e avisa no Telegram. O
   treinador tem lock próprio.
3. **Locks contra duplicidade.** Locks próprios em
   `scripts/.cache/cavas-2m/{coleta-2m,supervisor,supervisor-treino,vigia,treino}.lock` (PID + timestamp), mais a opção
   "não iniciar nova instância" do Agendador. O lock do `oficina.py` é do
   cache 8 m (`cavas-calibracao`) e não deve ser reutilizado aqui: ele
   bloquearia a coleta 8 m. Se o lock estiver tomado, sair com código 0 e
   registrar no log. Um escritor por cache.
4. **Não reprocessar o backlog.** Pular `ok` e `sem-cena` por padrão
   ([MEDICOES:929](../historico/planos/MEDICOES-CAVAS-MINERACAO.md)) e pular
   os 1.998 alvos já coletados
   ([MEDICOES:862–864](../historico/planos/MEDICOES-CAVAS-MINERACAO.md)).
   Parar em G1; o backlog de ~1.450 não é meta do MVP.
5. **Consertar as duas tarefas de 4 h.** Apagar a que aponta para `.cmd`
   inexistente; manter no máximo uma coleta 8 m, se ainda for necessária,
   com caminho absoluto e teste `--consultar`/`--testar`
   ([`setup-vigia-treino-2m.py:20–23`](../../scripts/oficina-cavas/setup-vigia-treino-2m.py)).
6. **Log e batimento.** Logs em `docs/relatorios-automacao/logs/`
   (`coleta-2m.log`, `vigia-2m.log`, `treino-2m.log`), heartbeat
   por estágio e alerta no Telegram em 2–3 linhas quando falhar.

### Ordem de conserto
1. Instalar o supervisor de treino no Startup.
2. Rodar `supervisor-treino-2m.py --max-ciclos 1` para criar o estado.
3. Conferir os locks de coleta, vigia e treino.
4. Só então deixar o loop ligado no logon.

1. Corrigir o `.bat` do vigia para gravar log e não usar `start` solto.
2. Criar `coleta-2m.cmd` e a entrada de Startup da coleta.
3. Testar o supervisor com `--meta` já atingido (sai sem coletar).
4. Rodar um ciclo `--once --dry-run` do vigia.
5. Conferir os locks (`coleta.lock`, `supervisor.lock`, `vigia.lock`).
6. Só então deixar o loop ligado no logon.

## Riscos e regra editorial

| Risco | Evidência medida | Mitigação |
|---|---|---|
| **Falso positivo** | 1.109 de 3.137 negativos pontuados como cava; 0/30 confirmados por humano ([ESTEIRA:40–48](../historico/planos/ESTEIRA-CAVAS.md)) | 2 m, negativos difíceis, 2 de 3 métodos, revisão humana e checagem oficial; publicar 5–10, não contagem |
| **Viés de "chão pelado"** | mediana de solo nu 0,97 em cava real e em falso positivo ([ESTEIRA:50–54](../historico/planos/ESTEIRA-CAVAS.md)) | separar por geometria (parede, degrau, água no fundo) em 2 m; não usar cor como prova |
| **Nuvem** | 77 de 90 janelas rejeitadas por nuvem em uma rodada; primeiro ponto 2 m veio com nuvem 1,000 ([MEDICOES:872–875 e 933–936](../historico/planos/MEDICOES-CAVAS-MINERACAO.md)) | filtro de nuvem, data visível, recorte descartado não entra no dossiê |
| **Nuvem de modelo e custo** | pipeline local; página lê GeoJSON pronto ([PLANO-GLOBO:159–161 e 505–520](../historico/planos/PLANO-GLOBO-CAVAS-MINERACAO.md)); VM Azure custa ~R$ 1,27/dia enquanto existir ([MEDICOES:829–837](../historico/planos/MEDICOES-CAVAS-MINERACAO.md)) | nenhuma imagem ou candidato em API de terceiro; inferência no PC; apagar a VM ao fim |
| **Custo da varredura 2 m** | 84 s por recorte; 100 ≈ 2,3 h; 1 worker ([MEDICOES:938–940](../historico/planos/MEDICOES-CAVAS-MINERACAO.md)) | 8 m como triagem; 2 m só no top 200; parar em G1; não varrer o Brasil |
| **Regra editorial** | "ilegal" é veredito, não evidência ([PLANO-MAPEAMENTO:39–62](../historico/planos/PLANO-MAPEAMENTO-MINERACAO-ILEGAL.md)) | vocabulário de indício; 2 de 3 + humano; fonte, data e método em toda peça; frase fixa; aprovação do dono |
| **Gold set ausente** | holdout atual não tem irregular confirmado; 0/30 na auditoria | construir 20–30 casos com ato oficial; se não houver, não calcular precisão |
| **Automação duplicada** | duas tarefas de 4 h, uma quebrada; vigia ausente | locks, uma tarefa por função, caminho absoluto, teste `--once --dry-run` |

### Regra editorial em uma linha

O modelo **aponta candidato**; o estado de evidência vem da fonte oficial.
A publicação diz "sem cadastro ANM na área" ou "indício de atividade fora da
poligonal", nunca "ilegal". Quem julga é a autoridade.

Regras práticas:

1. Toda peça tem data da imagem, fonte, método e ressalva de máquina.
2. Toda peça tem link para o processo na ANM ou a declaração de que não há
   cadastro na área.
3. Nenhum nome de pessoa física; processo e ato, não titular.
4. Nenhuma contagem agregada sem método e sem gold set.
5. Divergência entre revisores não se resolve por média; volta para a fila.

## Cronograma e critérios de pronto

| Semana | Frente | Entrega |
|---|---|---|
| 1 | Dados + conserto da automação | Tarefas de logon registradas; G1 a caminho; gold set iniciado |
| 2 | Dados + modelo | 300/300 limpos; primeiro treino 2 m com limiar por precisão |
| 3 | Modelo + varredura | G2 decidido; 3.869 janelas pontuadas em 8 m |
| 4 | Varredura + confirmação | Top 200 em 2 m; top 40 na fila humana |
| 5–6 | Confirmação + gold set | 40 revisadas; 10–15 na lista curta; 20–30 casos de ouro |
| 7–8 | Dossiê + revisão | 5–10 dossiês; aprovação do dono; publicação só com ordem |

**Total: 4–8 semanas.** O caminho de 4 semanas só existe se a coleta 2 m
andar sem falha de rede e o gold set já tiver casos suficientes. O caminho
realista é 6–8.

Critérios de pronto do MVP:

1. 5–10 dossiês, cada um com 2 de 3 métodos, revisão humana e checagem
   ANM/SEMAD/IBAMA.
2. Confiança de 90% caso a caso registrada na rubrica; nenhuma alegação de
   precisão estatística com n=10.
3. Nenhuma ocorrência da palavra "ilegal" em texto publicado.
4. Toda imagem com data, fonte e atribuição; todo dado pessoal varrido.
5. Automação rodando no logon, com lock, sem duplicar coleta e sem
   reprocessar o backlog inteiro.
6. Relatório de lacunas: quantas janelas ficaram sem imagem, quantas foram
   descartadas por nuvem e quantos casos o gold set não cobriu.

O que não fazer:

- não publicar "X cavas ilegais" nem "X mil minerações";
- não treinar no gold set;
- não usar API de modelo em nuvem;
- não rodar dois workers na coleta 2 m;
- não varrer o Brasil antes de fechar MG;
- não tratar "fora do polígono" como crime;
- não commitar imagem, cache ou índice binário.

## Origem e histórico

Este plano consolida, em 20/10/2026, o que restava de ativo nos planos
arquivados de cavas:

- [PLANO-GLOBO-CAVAS-MINERACAO.md](../historico/planos/PLANO-GLOBO-CAVAS-MINERACAO.md)
  — arquitetura, barra de publicação e fases 0–6;
- [ESTEIRA-CAVAS.md](../historico/planos/ESTEIRA-CAVAS.md) — duas esteiras,
  inspeção humana de 15/10 e o achado do "chão pelado";
- [MEDICOES-CAVAS-MINERACAO.md](../historico/planos/MEDICOES-CAVAS-MINERACAO.md)
  — diário de gates, coleta 2 m, 209 → 222 limpos e fila travada;
- [PLANO-MAPEAMENTO-MINERACAO-ILEGAL.md](../historico/planos/PLANO-MAPEAMENTO-MINERACAO-ILEGAL.md)
  — estados de evidência, fontes oficiais e limites do embargo.

O que mudou em relação aos planos arquivados: o alvo deixou de ser "mapear a
mineração ilegal no Brasil" e passou a ser "produzir 5 a 10 dossiês
conferíveis em MG". O funil, o gold set e a automação de logon são as três
peças novas. As regras editoriais continuam as mesmas: indício, não sentença;
fonte oficial, não inferência; revisão humana, não número de modelo.
