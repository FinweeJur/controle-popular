# Medições — cavas de mineração no globo 3D

> **Arquivado em 18/10/2026** na consolidação de planos. O que restava
> de pendência foi absorvido pelos planos integrados em `docs/planos/`.


> **Tipo:** PLANO (diário de medições da frente B4)
> **Domínio:** global
> **Última medição:** 2026-10-12
> **Leitura estimada:** longa (> 15 min)
> **Relacionados:** [PLANO-GLOBO-CAVAS-MINERACAO.md](/docs/historico/planos/PLANO-GLOBO-CAVAS-MINERACAO.md), [ESTADO.md](../../02-estado/ESTADO.md), [FONTES.md](../../06-fontes/FONTES.md), [AGENTS.md](/AGENTS.md)
> **Palavras-chave:** mineracao, cava, gate, holdout, treino, chinese-clip, pan-sharpen, revisao-humana, flips-de-rotulo, medicao, satelite, sentinel, cbers

## Propósito

O que já foi medido nesta frente, com data e número. O plano (o que fazer)
vive em [PLANO-GLOBO-CAVAS-MINERACAO.md](/docs/historico/planos/PLANO-GLOBO-CAVAS-MINERACAO.md);
aqui entra só o histórico medido: gates, fechamentos de coleta, revisão
humana e achados de método. A ordem das seções é a ordem das fases do
plano; a data de cada medição está no título.

## Sumário

- [Medições da Fase 1 — 25/09 (piloto)](#medições-da-fase-1--2509-piloto)
- [Medições da Fase 2 e da fila — 28/09/2026 (parcial: negativos em coleta)](#medições-da-fase-2-e-da-fila--28092026-parcial-negativos-em-coleta)
  - [Fechamento de MG e gate v2 — 28/09/2026 (noite, medido)](#fechamento-de-mg-e-gate-v2--28092026-noite-medido)
  - [Eco do VLM e coleta de negativos — 29/09/2026 (medido)](#eco-do-vlm-e-coleta-de-negativos--29092026-medido)
  - [Fechamento do lote +900 e gate v3 — 30/09/2026 (medido)](#fechamento-do-lote-900-e-gate-v3--30092026-medido)
  - [Revisão humana recuperada e lida — 01/10/2026](#revisão-humana-recuperada-e-lida--01102026)
  - [Modelo v4 pontua os 100 e encurta a fila — 01/10/2026](#modelo-v4-pontua-os-100-e-encurta-a-fila--01102026)
  - [Gate v5 com os rótulos corrigidos — 01/10/2026 (medido)](#gate-v5-com-os-rótulos-corrigidos--01102026-medido)
  - [Handoff — como retomar (01/10/2026, sessão fechando)](#handoff--como-retomar-01102026-sessão-fechando)
  - [Pan-sharpen 2 m e gate v6 — 01/10/2026 (medido)](#pan-sharpen-2-m-e-gate-v6--01102026-medido)
  - [Veredito das 15 dúvidas `revisado` — 01/10/2026 (análise da máquina)](#veredito-das-15-dúvidas-revisado--01102026-análise-da-máquina)
  - [Gate v7 com os 31 flips na pasta certa — 11/10/2026 (medido)](#gate-v7-com-os-31-flips-na-pasta-certa--11102026-medido)
  - [Revisão do filtro de negativos — 11/10/2026 (medido)](#revisão-do-filtro-de-negativos--11102026-medido)
- [Medições da Fase 3 — 29/09/2026](#medições-da-fase-3--29092026)
- [Medições da Fase 5 — 29/09/2026](#medições-da-fase-5--29092026)
- [Medições do preparador da VM (Azure) — 12/10/2026 (medido)](#medições-do-preparador-da-vm-azure--12102026-medido)
- [Rodada de 12/10 fechada e crédito Azure — 13/10/2026 (medido)](#rodada-de-1210-fechada-e-crédito-azure--13102026-medido)
- [Origem](#origem)

## Medições da Fase 1 — 25/09 (piloto)

Tudo abaixo foi medido em 25/09/2026 pelo agente principal, rodando o
piloto de `scripts/coletar-cavas-calibracao.py`. Nada é estimativa.

| O que medir | Valor (25/09) |
|---|---|
| Positivos coletados no piloto | **30** |
| Negativos coletados no piloto | **18** |
| Positivos sem cena CBERS em 18 meses | **4** (ficam para Sentinel-2) |
| Negativos: candidatos aceitos × tentativas | **18 em 39** — o filtro espacial **esgotou** |
| Recorte | 512 × 512 px, **~4,3 km** (512 × 8,4 m/px), JPEG q85, **~70 KB** (M5) |
| Leitura da cena | janela HTTP (range) responde **HTTP 206**; cenas ~**14.276 × 14.648** px a **~8,4 m/px** |
| Cache de datasets abertos | teto de **9 arquivos**; positivos **ordenados por cena** para reaproveitar o cache → **~3× menos leituras** |

**O filtro espacial dos negativos precisa de diluição (medido).** 39
tentativas produziram 18 negativos: o critério "fora de todo polígono e fora
da classe mineração" gasta candidatos mais rápido do que a grade encontra
ponto limpo. Antes do lote de 5 mil, o filtro é revisto — não basta
aumentar `--limite`, o rendimento cai junto. **A revisão foi feita em
11/10 e o veredito foi o contrário do susto:**
[Revisão do filtro de negativos — 11/10/2026](#revisão-do-filtro-de-negativos--11102026-medido).

**4 dos 30 positivos não têm cena CBERS em 18 meses.** Ficam reservados para
Sentinel-2 (10 m); a regra de fallback "CBERS primeiro, Sentinel-2 onde não
houver CBERS" vale, e a contagem deles fica visível no manifesto — lacuna é
informação.

**A radiometria do CBERS varia por cena — e isso matou o limiar de nuvem
único (medido):**

| Cena | Terreno (mediano) | Nuvens |
|---|---:|---|
| `206_133` | 144 DN | 231–484 |
| `205_134` | ~276–400 DN | 800–966 |
| `194_138` | **100% nublada** (medianas de amostragem 790 / 924 / 559) | — |

- **REPROVADO: limiar absoluto único de nuvem (750 DN).** Os três casos
  derrubam o número fixo: na `206_133` as nuvens vão de 231 a 484 — **todas
  abaixo de 750**, o corte deixa nuvem passar; na `194_138` (100% nublada) as
  medianas de amostragem são 790 / 924 / 559 — **uma delas abaixo do corte**;
  só na `205_134` (nuvens 800–966) o número serviria. O corte tem de olhar a
  cena, não o valor fixo.
- **Detector novo: FECHADO EM 25/09 pelo Agente A** — regra combinada de
  5 testes em `medir_nuvem()` (qualquer um que dispara vale nuvem = 1.0):
  (1) legado 750 DN; (2) brilho relativo — acromáticos acima de 1,2× a
  mediana do próprio recorte; (3) acromatismo do recorte — saturação
  ≤ 0,20 em mais de 70% dos pixels; (4) veto de cena — cena amostrada
  (3 janelas de 256 px, cacheada) com acromatismo > 0,80; (5) textura —
  recorte liso (< 0,02) e acromático > 45% (névoa fina sem grão).
  Constantes em `scripts/coletar-cavas-calibracao.py` (linhas 105–111).
- **Revalidação dos 48 do piloto com a regra nova: 28 rejeitados**
  (20 positivos e 8 negativos), 20 aceitos. Os 2 recortes de nuvem que
  passavam antes (`2dc65ee4`, `10f3568a`) agora caem; os 2 conferidos à
  mão (`03044922` — mina visível, `08432325` — área escura, aceitável)
  continuam. JPGs apagados, checkpoint regravado, manifesto reexportado,
  varredura de dado pessoal verde (285 arquivos). Margem apertada
  anotada: acromatismo 0,70 no recorte limpo × 0,717 no nublado —
  primeira coisa a remeçar no lote grande.

## Medições da Fase 2 e da fila — 28/09/2026 (parcial: negativos em coleta)

Lote de trabalho: 2.000 positivos + 381 negativos (coleta de negativos
ainda rodando; meta 10 mil/classe). Split por cena fixo, semente 42
(`scripts/.cache/cavas-treino/split.json`): treino 1.740 (1.555/185),
holdout 466 (445/21), 39 cenas — o holdout planejado de 500/500 não é
atingível sem os negativos da meta.

| Modelo | Precisão | Recall | F1 | tn no holdout |
|---|---|---|---|---|
| Zero-shot B (baseline) | 0,955 | 1,000 | 0,977 | 0 |
| Fine-tune `peso` (pos_weight) | 0,955 | 1,000 | 0,977 | 0 |
| Fine-tune `sobreamostragem` | **0,971** | 0,966 | 0,968 | 8 |

- **Gate ≥ 70% de precisão: PASSOU — mas preliminar.** O holdout é 95,5%
  positivo; chamar tudo de "cava" já dá 0,955. Só a sobreamostragem acerta
  negativos (8/21). Repetir o gate quando os negativos chegarem a ≥ 5 mil.
- VRAM 2,39 GiB (4 GiB); 71 s/época com 1.740 imagens; extrapolação para
  20 mil: 13,5 min/época, 8 épocas ≈ 108 min. Bug corrigido no caminho:
  faltava `@torch.no_grad()` na avaliação e o grafo de autograd derrubava
  a GPU sem necessidade.
- **Triagem VLM (`qwen3-vl:2b-instruct` local, Apache 2.0):** 2.366
  recortes com legenda e escore; média pos 61,3 × neg 57,0, moda 70–75
  nas **duas** classes, 2 erros em 2.366. Solo exposto fora do SIGMINE
  parece mineração para o modelo (247 negativos ≥ 70) — hard negative
  esperado, não bug. **O escore ordena a fila e nunca filtra** (Fase 4:
  o VLM não publica sozinho).
- Fila de revisão gerada por `scripts/montar-fila-revisao-cavas.py`:
  `fila-revisao.jsonl` (2.383 itens, estado inicial *pendente*),
  `amostra-100.jsonl` (estratificada p/ o gate) e a galeria
  `fila-revisao.html` (2.383 miniaturas) — a revisão dos 100 exemplos é
  humana e fica com o dev.

Medições da tarde de 28/09 (mesmo split, coleta de negativos crescendo):

- **Treino v1.5** (338 negativos já no treino): melhor F1 0,972 na
  época 2 (precisão 0,967 / recall 0,978 no limiar 0,5); 59,3 s/época;
  extrapolação 20 mil imagens: 10,4 min/época, 83,5 min p/ 8 épocas.
- **Regra do limiar corrigida** (`309ea5f5`): a regra antiga — maior
  recall entre precisão ≥ 70% — escolhia o limiar 0,05, que chama tudo
  de cava (holdout é 95,5% positivo; precisão 0,955 por base rate,
  tn = 0). Regra nova: precisão ≥ 70% **e**, dentro dela, maior
  acurácia balanceada. Com os pesos de v1.5 escolhe 0,64 (precisão
  0,968, acurácia balanceada 0,646, tn 7 de 21).
- **GO pronto para coletar** (`7f0af4d8`, `93cf92d1`): alvos 1.625,
  exclusão 24.819 bboxes, cenas GO 642 (medido aqui; a outra máquina
  mediu 643) — dry-run em cache descartável: 2 pos + 2 neg com
  `uf: GO`, **zero alvos sem cena CBERS**. Comando na docstring do
  coletor; roda só depois de MG fechar (um escritor por checkpoint).
- **Campo `uf`** agora é gravado em checkpoint e manifesto (MG
  retroativo por `setdefault`) — é dele que o filtro de UF do painel
  vai ler.

### Fechamento de MG e gate v2 — 28/09/2026 (noite, medido)

Coleta de negativos fechou às 20h23: **3.012 recortes** (2.000
positivos + 1.012 negativos). Manifesto regerado e publicado
(`63fee18e`); varredura de dado pessoal verde nos 289 arquivos antes
de cada commit. Fila final: 3.012 itens — alta 345 pos / 698 neg,
média 274/105, baixa 1.380/208; sem-triagem 2, erros do VLM 0.

**Split v2** (mesma regra por cena, semente 42, remontado no
fechamento às 21h37): treino 2.366 (1.442 pos / 924 neg, 222 cenas),
holdout **646 (558 pos / 88 neg, 20 cenas)** — o holdout ganhou 67
negativos (v1 tinha 21).

| Modelo | Limiar | Precisão | Recall | F1 | Acurácia bal. | tn de 88 |
|---|---|---|---|---|---|---|
| Zero-shot B (baseline) | 0,50 | 0,864 | 1,000 | 0,927 | 0,500 | 0 |
| Fine-tune `peso` | 0,62 | 0,879 | 1,000 | **0,935** | 0,562 | 11 |
| Fine-tune `sobreamostragem` | 0,65 | **0,914** | 0,819 | 0,864 | **0,665** | 45 |

- **Gate (precisão ≥ 70% + maior acurácia balanceada): os dois
  passaram; vence `sobreamostragem`** (0,665 × 0,562) — é a única que
  acerta negativo de verdade (45/88 contra 11/88), mesmo perdendo em
  F1 para o `peso`. Zero-shot é trivial: chama tudo de cava e a
  acurácia balanceada fica em 0,500.
- A regra de 5 mil negativos para o gate "definitivo" continua em
  pé; este é o gate intermediário com holdout de 88 negativos.
- Custo medido: 72 s/época em 2.366 imagens, VRAM 2,39 GiB de 4 GiB;
  early stop na época 4 (`peso`) e 7 (`sobreamostragem`) das 8.
- Pendências: revisão humana dos 100 exemplos (dev, atalhos
  "Revisao das cavas" na Área de Trabalho); JPEG corrompido
  `bd8c83af…` sem escore (o treino o descarta sozinho na leitura do
  snapshot); 1 JPG órfão no disco, sem linha no checkpoint.

### Eco do VLM e coleta de negativos — 29/09/2026 (medido)

**Eco do prompt (legenda).** A v1 do prompt escrevia a descrição da
legenda dentro do valor de exemplo do JSON; com temperature 0 o modelo
guloso copiava a instrução inteira: **1.109 de 3.022 recortes (37%)**,
com escore médio 55,0 contra 65,8 dos que vieram certos. A v2
(`scripts/triar-cavas-vlm.py`, `b2dfd995`) deixa o valor vazio e move a
descrição para as Regras; flag `--retri-eco` refaz legenda com eco,
vazia ou sem escore.

**A escala do escore muda com o prompt.** Controle com 40 recortes bons
triados nas duas versões: média 59,9 (v1) → 65,5 (v2), delta +5,6, só
40% idênticos — os cortes 50/70 da prioridade são atravessados. Por isso
a retri foi **completa** (3.022), nunca só dos ecos; a triagem v1 ficou
arquivada em `triagem-v1-<data>.jsonl`. Regra: prompt novo ⇒ retri
completa.

**Resultado da retri (3.015 itens na fila):** eco 0, legenda vazia 0;
sem-triagem 4 (1 positivo com JSON truncado de forma determinística + 3
negativos novos, ainda sem triagem). Sanidade v2 no lote: positivos
66,9 × negativos 63,2 (2.810 com escore) — separação fraca; o escore do
VLM ordena a fila de revisão, quem separa de verdade é o Chinese-CLIP.

**Duas falhas transitórias do Ollama** (HTTP 500 e resposta vazia,
≈199 negativos, 19,8 s cada por causa das 3 tentativas) foram
investigadas: os JPEGs são válidos (512×512, pixels normais) e os
mesmos arquivos respondem bem em teste isolado — era contenção do
modelo local, não o arquivo. Repetidas as rodadas, restaram os 2 casos
determinísticos citados acima.

**Coleta de negativos: bug real, 2 h = zero recorte.** Duas causas,
medidas com instrumentação somente-leitura:
1. o sorteio não excluía janela já coletada e a rodada v1 usou a mesma
   semente 42 — a reamostragem redesenhava os mesmos pontos e cada
   candidato gastava ~30 s para o teste de hash descartar no fim;
2. no empate de hash o `escolher_recorte` devolvia `None` e abandonava
   o candidato inteiro (jogava fora as leituras feitas).

Correções em `scripts/coletar-cavas-calibracao.py` (`943bd091`): índice
das bboxes do checkpoint (grade de 0,02°, ~2,2 km) pula o candidato
antes de abrir a cena; empate de hash tenta a próxima cena. Medido
depois da correção, com semente 43: **+3 negativos em 8 min (~26/h)** —
o candidato custa 15–45 s (1–3 cenas de 512 px, leitura remota), então
+900 ainda pede ~35 h. Próximo ganho mapeado: ordenar os negativos por
cena primária (como os positivos fazem) para aproveitar o cache de
cenas abertas.

**Pendências:** 1 JPEG corrompido fora do checkpoint (o órfão
`bd8c83af…`); 1 positivo com escore nulo por truncamento determinístico;
coleta de +900 negativos em andamento (semente 43).

### Fechamento do lote +900 e gate v3 — 30/09/2026 (medido)

**Coleta (semente 43) fechou às 22h34** de 29/09: **+900 negativos**
(1.020 → 1.920), rc=0 — o ganho da ordenação por cena primária derrubou a
projeção de 35 h para o lote rodar na noite. Manifesto publicado
(`a9b21414`); fila remontada com **3.920 itens** (2.000 pos / 1.920 neg).

**Triagem VLM dos 900 novos:** pico de 202 erros transitórios do Ollama
às 22h34 (mesma contenção de 29/09), corrigidos pela passada seguinte —
estado final por last-wins: **1 erro** (o JPEG corrompido `bd8c83af…`),
4 itens sem escore (truncamento determinístico), **eco 0**.

**Split v3** (por cena, semente 42, arquivado o split v2 antes do treino):
treino 3.126 (1.608 pos / 1.518 neg, 206 cenas); holdout **794 (392 pos /
402 neg, 57 cenas)** — o holdout de negativos passou de **88 → 402**.

| Modelo | Limiar | Precisão | Recall | F1 | Veredito do gate (≥ 0,70) |
|---|---|---|---|---|---|
| Zero-shot B (baseline) | 0,50 | 0,494 | 1,000 | 0,661 | não (≈ prevalência do holdout) |
| Fine-tune `peso` @ 0,50 | 0,50 | 0,654 | 0,796 | 0,718 | — |
| Fine-tune `peso` (limiar do gate) | 0,69 | **0,709** | 0,602 | 0,651 | **PASSOU** |
| Fine-tune `sobreamostragem` @ 0,50 | 0,50 | 0,684 | 0,778 | 0,728 | — |
| Fine-tune `sobreamostragem` (limiar do gate) | 0,69 | **0,721** | 0,691 | 0,706 | **PASSOU** |

- **Gate v3: PASSOU; vence `sobreamostragem` de novo** (0,721 de
  precisão com recall 0,691 no limiar 0,69 escolhido na curva PR).
- **Não comparar 0,914 (v2) com 0,721 (v3):** o holdout v2 tinha 88
  negativos (20 cenas) e o v3 tem 402 (57 cenas); com a metade do
  holdout virando negativo, a precisão na mesma taxa de acerto é menor.
  O número que vale é o v3, sobre a amostra que existe hoje.
- Custo medido: 99–105 s/época em 3.126 imagens, VRAM 2,39 GiB de 4;
  melhor época 5 das 8 (early stop). Extrapolação do próprio script:
  10,6 min por época numa hipotética leva de 20 mil imagens.
- **Regra do plano mantida: 5 mil negativos para o gate definitivo** —
  hoje 1.920; lote 5 (semente 44, +1.200) rodando com fechador
  automático (triagem + remonta + Telegram).
- Pendências: revisão humana dos 100 exemplos (dev, atalho na Área de
  Trabalho; ganhou visualizador de ampliação em `c98f1120`).

### Revisão humana recuperada e lida — 01/10/2026

A folha `amostra-100.html` grava as marcas em **localStorage** (chave
`amostra100-estados`), não em arquivo. Recuperação medida:

- O navegador usado foi o **Brave**; o dado vive em
  `...\Brave-Browser\User Data\Default\Local Storage\leveldb` (blocos
  **Snappy**). Leitor próprio em `Temp\opencode\le-leveldb.py` (usa
  `cramjam`); a chave do SSTable traz 8 bytes de sequência e o valor um
  byte de tipo antes do JSON (que está em **latin-1**).
- Cópia preservada em `scripts/.cache/cavas-calibracao/revisao-humana-dev.json`.
- **Medido: 29 itens decididos** — 7 `descartado`, 14 `publicável`,
  8 `revisado` (= dúvida, pelo texto das legendas).

**Erros de rótulo que a sua revisão revelou (o que o treino precisa ouvir):**

- **1 falso positivo** (rótulo `positivo`, você descartou):
  `325daca75d39c05065437289.jpg`.
- **4 falsos negativos** (rótulo `negativo`, você marcou `publicável`):
  `080c3686307c…`, `9d9f7a45a572…`, `c02e9e6808f0…`, `1de7c0e1dbb0…`.
  Ou seja: há **cava dentro do conjunto de negativos** — isso envenena o
  treino e explica recall.
- **8 casos de dúvida** (não são veredito; o texto diz "fiquei na dúvida se
  é mineração", "parece mais área de plantio") — é a faixa onde o modelo
  deve decidir, não o humano no escuro.

⚠️ **Armadilha nova: a fila anda sob o revisor.** A folha foi **regenerada**
em 30/09 22:02 (split novo) e das 29 marcas só **17** caem na lista atual —
as outras 12 apontam para recortes que saíram da amostra. Preservar o JSON
antes de regerar a folha, senão a revisão se perde.

⚠️ **`revisado` não é veredito binário** — hoje significa "olhei e fiquei na
dúvida". Antes de usar como rótulo, o significado precisa ser fechado com o
dev.

### Modelo v4 pontua os 100 e encurta a fila — 01/10/2026

Rodado o checkpoint **v4 (sobreamostragem, época 6, melhor F1 0,825)** sobre
os 100 da folha, com o mesmo pré-processamento do treino (sem aumento),
limiar 0,64 e `half` na GPU. Script descartável em
`Temp\opencode\pontuar-amostra-100.py`; saída em
`Temp\opencode\cavas\pontuacao-v4-amostra100.json`.

- **Concorda com o rótulo em 84 de 100**; precisão 0,827 / recall 0,860
  nesta amostra (confere com o gate).
- O modelo é **bimodal**: negativos ~0,30, positivos ~0,69–0,9x. **Não há
  item entre 0,45 e 0,64** — a "insegurança" não existe como faixa larga.
- Logo, a fila de revisão cai de **100 para 16** (a discordância), gravada em
  `fila-curta-v4.json` e na folha `scripts/.cache/cavas-calibracao/fila-curta-v4.html`.

**Os 16 se abrem em dois grupos limpos:**

- **9 possíveis falsos negativos** — rótulo `negativo`, mas VLM deu **85** e o
  v4 ficou **0,67–0,69**, logo acima do limiar. Bate com os 4 FN que o dev já
  achou à mão: **há cava dentro do conjunto de negativos**.
- **7 possíveis falsos positivos** — rótulo `positivo`, mas VLM **0** e v4
  **0,30**. Dos 7, **2 o dev já marcou `publicável`** — ou seja, nesses o
  modelo erra e o dev vê a cava.

**Consequência de método:** revisar 16 em vez de 100. Antes do próximo treino,
**corrigir o rótulo dos negativos que são cava** — senão o modelo segue
aprendendo vegetação onde há lavra, e o recall não sobe.

**Feito em 01/10:** a exportação do dev (43 itens decididos) virou correção de
rótulo no `checkpoint.jsonl` (com backup) — **9 flips** (3 positivo→negativo,
6 negativo→positivo), verificados pós-escrita e versionados com motivo em
`scripts/etl/cavas/revisao-humana-gate.json`. As 15 dúvidas (`revisado`)
ficam de fora do flip até veredito.

### Gate v5 com os rótulos corrigidos — 01/10/2026 (medido)

O fechador automático (`Temp\opencode\fecha-treino-v5.ps1`) rodou de
12h51 às 13h38 com os **9 rótulos corrigidos** pela revisão humana e
hiperparâmetros idênticos ao v4. Split v5 (por cena, semente 42): treino
4.067 (1.434 pos / 2.633 neg, 244 cenas), holdout **1.044 (563 pos / 481
neg, 30 cenas)** — o holdout de negativos foi de 402 para 481.

| Modelo | Época melhor | Limiar | Precisão | Recall | F1 | Acurácia bal. | tn de 481 |
|---|---|---|---|---|---|---|---|
| Zero-shot B (baseline) | — | 0,50 | 0,540 | 1,000 | 0,701 | 0,500 | 1 |
| Fine-tune `peso` | 4 | 0,48 | 0,801 | 0,853 | 0,826 | 0,803 | 362 |
| Fine-tune `sobreamostragem` | 4 | 0,64 | **0,811** | **0,886** | **0,847** | **0,823** | 358* |

*tn do `sobreamostragem` no limiar 0,50 é 358; no limiar 0,64 do gate,
recall 0,886 com precisão 0,811.

- **Gate v5: PASSOU; vence `sobreamostragem` de novo** (terceira vez
  seguida: v2, v3 e v5).
- **O ganho esperado dos 6 falsos negativos corrigidos apareceu:** o
  recall do `sobreamostragem` subiu de 0,851 (v4, amostra dos 100, 8 m)
  para **0,886** (v5, holdout de 1.044, 8 m) — amostras diferentes, então
  a comparação é indicativa, não pareada; e a direção bate com a previsão
  do handoff.
- Zero-shot segue trivial: chama tudo de cava (precisão 0,540 = a taxa
  de positivos). Com limiar forçado na margem chega a precisão 0,717 mas
  com recall 0,067 — não serve.
- Custo medido: 127,4 s/época em 4.067 imagens, VRAM 2,39 GiB de 4;
  extrapolação do script: 10,4 min/época numa leva de 20 mil.
- Checkpoint pós-flip: **2.003 positivos / 3.117 negativos**; manifesto
  reexportado (`gerado_em` 01/10) e varredura de dado pessoal verde
  (444 arquivos).
- **Regra dos 5 mil negativos para o gate definitivo segue em pé** —
  hoje 3.117; faltam ~1.900.

### Handoff — como retomar (01/10/2026, sessão fechando)

Fila viva desta frente, em ordem:

1. **✅ Gate v5 concluído em 01/10 13h38: PASSOU** (`gate-v5.veredito.txt`),
   venceu `sobreamostragem` (precisão 0,811 / recall 0,886 no limiar 0,64).
   Números completos na seção
   [Gate v5 com os rótulos corrigidos](#gate-v5-com-os-rótulos-corrigidos--01102026-medido).
2. **🚧 Pan-sharpen 2 m (v6) — lançado 01/10 15:01**: fechador
   `Temp\opencode\fecha-v6.ps1` roda a geração completa (5.120 alvos,
   ~18–26 h) e, com ≥ 95%, o treino v6 automático. Números e descoberta
   de bandas em
   [Pan-sharpen 2 m e gate v6](#pan-sharpen-2-m-e-gate-v6--01102026-medido).
3. **Dúvidas do dev (15 `revisado`)** — legendas dizem "fiquei na dúvida se
   é mineração"; são a faixa onde o modelo 2 m deve decidir. Fechar o
   significado de `revisado` antes de virar rótulo.
4. **Fase E** do plano de mapeamento: liberada só após gate v5 + revisão
   humana confirmada pelo dev (P8/P9).
5. **⚠️ Guara estourou a cota de build** (356,85/250 min, ciclo até 19/out):
   **deploy do portal pode falhar** até o ciclo virar. Vaga de projeto
   sobrando (2.º slot) não serve para o pipeline — não tem GPU.

Artefatos de 01/10: `revisao-humana-dev.json` (todas as marcas),
`fila-curta-v4.html` (folha editável dos 16), `fila-curta-v4.json`,
`pontuacao-v4-amostra100.json` (v4 nos 100 a 8 m), `recortes-2m/` +
`comparacao-pan-2m.html`, leitor de LevelDB do Brave
(`Temp\opencode\le-leveldb.py`, precisa `cramjam`) — a folha grava em
**localStorage do Brave**, não em arquivo.

### Pan-sharpen 2 m e gate v6 — 01/10/2026 (medido)

Piloto do gerador novo (`scripts/etl/cavas/gerar-recortes-2m.py`):
recorte **colorido 512 px a 2 m/px** (~1,02 km de lado) por fusão
Brovey da BAND0 (PAN 2 m) com BAND3/1/2 (8 m), lidas por janela HTTP.

- **Piloto: 20/20 recortes, 14,2–18,2 s/recorte** (com STAC e abertura
  fria de cenas), JPEG ~75 KB médio → 5.120 recortes ≈ **18–26 h**.
  Extrapolado também para disco: ~384 MB (cache fora do git).
- **Dois bugs corrigidos no caminho:** coordenada projetada passada
  onde o código espera geográfica (NaN em todas as janelas) e retomável
  que tratava erro como feito (agora só `status: ok` pula).
- **Radiometria do L2 do WPM: o PAN chega ~1,5× mais brilhante que a
  média RGB** (DN mediano 289 × ~172 na cena 205_134). Brovey de DN
  bruto clareava tudo e dessaturava nuvem/solo. Correção: casar a
  mediana do PAN com a da média RGB antes do ganho, ganho travado em
  [0,5; 2,0].
- **Descoberta de bandas — BAND1 é VERDE e BAND2 é AZUL no L2 do WPM.**
  Medido contra a miniatura oficial do INPE da cena 205_134: sobre
  vegetação o DN é B3 < B2 < B1; com G=B1 o verde domina, como na
  miniatura; com a atribuição antiga (G=B2) a vegetação saía teal.
  **Consequência: o acervo 8 m (v4/v5) foi gerado com G/B trocados.**
  Como a troca vale para TODOS os recortes 8 m, o treino aprendeu com
  uma correlação constante — os gates v2/v3/v5 não ficam invalidados —
  mas a cor do acervo 8 m não é verdadeira. Os recortes 2 m nascem com
  a atribuição correta; o v6 compara contra o v5 no MESMO holdout de
  cenas (split.json do v5 fica imutável).
- **Geometria conferida:** a janela central de 1,02 km bate feature a
  feature com o recorte central do acervo 8 m (mesmo pivô, mesmas
  nuvens, mesma estrada).
- **Fechador `fecha-v6.ps1` lançado 01/10 15:01:** duas passadas de
  geração (a segunda reprisa erros transitórios de rede), verificação
  de rendimento com last-wins por hash, **barra de 95%** para liberar o
  treino, depois treino `peso` + `sobreamostragem` com os mesmos
  hiperparâmetros do v5, dumps `metricas-v6-*`, veredito
  `gate-v6.veredito.txt` e Telegram. **Régua do gate v6: recall do v5
  (0,886) e precisão ≥ 0,70.**

### Veredito das 15 dúvidas `revisado` — 01/10/2026 (análise da máquina)

Pedido do dev: "faça uma nova análise e me dê o veredito você". Método:
recortes **2 m** gerados para as 15 (diretório próprio,
`Temp\opencode\cavas\recortes-2m-duvidas\`, sem brigar com o fechador),
comparação visual 8 m × 2 m lado a lado, escore do v4 e **baseline
MapBiomas por bbox** (método C da barra de publicação). Veredito é da
máquina — **flip de rótulo só com confirmação do dev**.

**Achado de método — WFS 1.1.0 troca os eixos do BBOX:** `BBOX(geom,
lat1,lon1,lat2,lon2)` devolve resultado; `lon,lat` devolve **0
silenciosamente** (medido: positivo com 10 processos numa ordem e 0 na
outra). Armadilha nova para a tabela §6.

**Achado central — as dúvidas positivas são "lavra fantasma":** 6 das 7
janelas positivas têm `lavra_fantasma=True` e `mining_age=0` no Monitor
(ou seja: o cadastro autoriza, mas o MapBiomas não vê lavra ativa).
`mining_age=0` não é quebra da consulta — o Quadrilátero Ferroso
devolve feições na mesma consulta. É o caso real: polígono autorizado
sem atividade visível. **Isso explica a confusão cava × plantio do
dev** — o treino tem positivos que são fazenda na imagem.

| arquivo | tipo | veredito da máquina | evidência |
|---|---|---|---|
| `075c7c0dabdf` | neg | **mantém negativo** | campos regulares, estradas retas; sem bancada |
| `0de2c570ee6d` | neg | **mantém negativo** | represa + mata + estradas rurais; perturbação laranja fora da janela 2 m → observar na Fase 4 |
| `110767792044` | neg | **mantém negativo** | agricultura + mata ciliar (dev e v4 já concordavam) |
| `13a16a7bd26d` | neg | **mantém negativo** | roças com curvas de nível; sem bancada/poça de esteril |
| `140cac3f5c9b` | neg | **mantém, com ressalva** | corredor de solo exposto sem assinatura de lavra; sem processo ANM; sem mining_age → revisar na Fase 4 |
| `1b0316c54c8f` | neg | **mantém negativo** | pasto de morro com erosão (VLM 85 errado) |
| `1f4f8173765f` | neg | **mantém negativo** | mata de encosta com afloramento rochoso |
| `251997d95e58` | neg | **mantém negativo** | grade de silvicultura; anel no 8 m = açude fora da janela 2 m |
| `1a8463abd4d4` | pos | **sem cava visível → flip proposto p/ negativo** | pasto + estrada + rio no recorte; lavra de 1934; lavra_fantasma |
| `1b3edc1b5f05` | pos | **confirma positivo** (confiança média) | clareira branca com material exposto + solo laranja + lâmina d'água — pequena lavra |
| `227101c151fd` | pos | **sem cava visível → flip proposto p/ negativo** | paisagem agrícola; lavra de 2014; lavra_fantasma |
| `2b5e77c6a533` | pos | **sem cava visível → flip proposto p/ negativo** | mancha pálida pequena, insuficiente; lavra_fantasma |
| `315f40338dbb` | pos | **sem cava visível → flip proposto p/ negativo** | mosaico agrícola puro; lavra de 1998; lavra_fantasma |
| `69ba659079ba` | pos | **confirma positivo** (confiança alta) | sítio industrial com bancadas, estéril claro, galpão e estradas no 2 m |
| `757163a50889` | pos | **indecidível → excluir do treino** (ou manter, a critério do dev) | clareira clara grande com estrada, compatível com areia/argila, sem bancada nítida |

Resumo: **8 negativos mantidos, 2 positivos confirmados, 4 flips
propostos, 1 exclusão sugerida.** Nenhuma "cava escondida" nos
negativos em dúvida — os 4 falsos negativos que o dev achou antes não
estão neste conjunto. O ganho real está nos positivos fantasma: tirá-los
do treino ensina o modelo que fazenda não é cava.

### Gate v7 com os 31 flips na pasta certa — 11/10/2026 (medido)

**O bug dos flips, medido e corrigido.** Os flips de 01/10 (9) e de
06/10 (22) mudavam o rótulo no `checkpoint.jsonl` mas **não moviam o
JPEG** para a pasta nova; o loader decide pelo nome da pasta e descartava
o arquivo — `descartados por JPG ausente: 9` no fechador do v5, `42` no
do v6 e `31` no do v7. Em 11/10 os 31 arquivos foram movidos
(`Temp\opencode\cavas\mudanca-pasta-20261011.json` lista os 31 caminhos,
0 achados faltando) e o v7 rodou com **5.120/5.120 na pasta certa**.

| O que medir | Valor (11/10) |
|---|---|
| Snapshot | **5.120/5.120 JPGs decodificados** (2.025 pos / 3.095 neg), **0 descartados** |
| Treino | 4.076 imgs / 244 cenas (1.457 pos / 2.619 neg) |
| Holdout | **1.039** imgs / 30 cenas (563 pos / 476 neg) |
| Coleta nova | 26 recortes entram no **treino** (23 pos / 3 neg); 5 cenas do holdout vetadas |
| AVISO do loader | 5 arquivos do holdout "sumiram" — **causa apurada em 11/10**: são flips de 06/10 que passaram de `negativo/` para `positivo/`; nada se perdeu. Holdout encolheu de 1.044 (v5) para **1.039** (481 → 476 negativos) |
| Custo | 155,9 s/época em 4.076 imgs; early stop na época 8 (paciência 3); 1.475 s no total; VRAM máx. 2,39 GiB |

| Modelo | Limiar | Precisão | Recall | F1 | tp / fp / fn / tn |
|---|---|---|---|---|---|
| Zero-shot B (baseline) | 0,50 | 0,542 | 1,000 | 0,703 | 563 / 475 / 0 / 1 |
| Zero-shot com limiar na margem | +0,0546 | 0,712 | 0,066 | 0,120 | — |
| Fine-tune `sobreamostragem` | 0,65 | **0,794** | 0,851 | 0,822 | 479 / 124 / 84 / 352 |
| Fine-tune `sobreamostragem` | 0,50 | 0,766 | 0,917 | 0,834 | 516 / 158 / 47 / 318 |

- **Gate v7: PASSOU** — precisão 0,794 no limiar 0,65 (escolhido por ser
  a maior acurácia balanceada, 0,795, entre os que cumprem a régua de
  0,70). No limiar fixo 0,50 o F1 é maior (0,834) e a precisão ainda
  passa (0,766).
- **Os 22 flips de 06/10 conferidos um a um (11/10):** as 22 chaves que o
  split de 01/10 ainda chama de `negativo/` (5 no holdout, 17 no treino)
  existem **todas** em `positivo/` — nada sumiu. Conta fechada: 17 entraram
  no treino como positivo, 5 ficaram de fora pela vedação de cena (cenas do
  holdout), e os 26 novos do treino são 17 flips + 9 da coleta nova (6 pos /
  3 neg).
- **Comparação v5 × v7 é indicativa, não pareada:** o holdout mudou
  (1.044 → 1.039) e 31 arquivos trocaram de classe no meio. v5 ficou em
  0,811 / 0,886 no limiar 0,64; v7 em 0,794 / 0,851 no 0,65.
- **⚠️ O v5 não treinou nos 9 flips de 01/10:** o fechador do v5 descartou
  9 por `JPG ausente` — exatamente os arquivos cujo rótulo a revisão
  trocou. A leitura "o ganho dos 6 FN corrigidos apareceu no v5" não se
  sustenta no log dele; o que subiu de v4 para v5 veio de outra causa
  (amostra diferente). Registro para não repetir a leitura.
- Zero-shot continua não servindo (0,542 = taxa de positivos); com limiar
  na margem sobe a precisão e despenca o recall (0,066).
- Artefatos: `Temp\opencode\cavas\treino-v7\` (`metricas.json` 58,5 KB,
  `melhor.pt` 753 MB, `ultimo.pt` 1,44 GB), log em
  `Temp\opencode\cavas\treino-v7.log`.
- **Regra dos 5 mil negativos para o gate definitivo segue em pé** —
  hoje 3.095; faltam ~1.900.

### Revisão do filtro de negativos — 11/10/2026 (medido)

**Pendência cumprida.** A Fase 1 dizia "antes do lote de 5 mil, o filtro é
revisto", com base em 18 aceitos em 39 tentativas. A revisão roda com
`python scripts/medir-filtro-negativos-cavas.py`: sorteia pontos com a
mesma semente 42 e chama o **mesmo** `rejeitado_indice` do coletor — mesma
grade, mesmo código, sem rede e sem baixar recorte.

| O que medir | Valor (11/10) |
|---|---|
| Pontos sorteados | **20.000** (4,3 s, semente 42) |
| Aceitos pelo filtro | **6.797 = 33,98%** |
| Mortos pela exclusão (SIGMINE + classe mineração MapBiomas) | 10.470 = 52,35% |
| Mortos por janela já coletada | 2.067 = 10,33% |
| Mortos pelos dois | 666 = 3,33% |
| Exclusão (cache) | 101.919 bboxes em 462 células de 0,5° |
| Janelas já coletadas | 5.120 em **43.698** células de 0,02° |
| Histórico nos logs de 28/09 | 44,39% (2.700/6.083) e 43,64% (5.970/13.681) |
| Candidato → arquivo salvo | **33,33%** (900 salvos / 2.700 candidatos) |

- **Veredito: o filtro NÃO esgotou.** A leitura do piloto ("esgotou" com
  18 em 39) era uma amostra de 39 pontos; 46% de aceitação não é
  esgotamento.
- **Dupla verificação da queda, por duas contas independentes:** 44,39%
  (28/09) − 33,98% (hoje) = 10,41 pp, e a medição de hoje diz que janela
  já coletada mata 10,33%. As duas contas fecham em 0,08 pp — a exclusão
  continua mortendo os mesmos ~56% e **toda a queda é custo de crescer**.
- **Cabe o lote (conta fechada):** para os 1.900 negativos que faltam
  são ~5.700 candidatos e ~16.800 tentativas contra o teto de 2.004.000
  do coletor — **folga de 120×**. Para `--limite 5000` (reserva de
  15.000 candidatos): 44.137 tentativas, folga de 45×.
- **O gargalo medido é a salvagem, não a sorte de ponto:** 2 de cada 3
  candidatos morrem em nuvem, hash repetido ou falha de cena. Subir
  `--limite` custa leitura de cena, não candidato.
- **Quando mexer de novo (regra gravada):** quando "mortos por janela já
  coletada" passar de ~30% (hoje 10,33%), reduzir `CELULA_COLETADOS`
  (0,02° ≈ 2,2 km) vale mais que mexer na exclusão. Não refazer a
  discussão por intuição.

## Medições da Fase 3 — 29/09/2026

- **Bloqueio medido, e a saída que serviu.** A série Sentinel-2 (método A
  original) ficou **bloqueada pela rede deste PC**: 256 KB do Planetary
  Computer levaram 56 s (≈5 KB/s), 10 MB do INPE estouraram timeout em
  162 s, e 10 MB de speed.cloudflare não terminaram em 180 s. Baixar banda
  de satélite para 4.000 cavas não fecha aqui. Saída usada: camada
  **`pto:mining_age`** do Monitor da Mineração (MapBiomas), que é
  **um polígono por cava com o ano da primeira detecção e a área** — Δ por
  ano sem baixar imagem.
- **Prova de que é 1 linha por polígono:** quadro de 0,2° no Quadrilátero
  Ferroso → 300 feições, **300 geometrias distintas, zero repetidas**. Então
  `ano` = primeira detecção, não ano × polígono. Consequência honesta:
  **Δ de área por cava individual não sai desta camada** — só Δ agregado por
  ano; o Δ por cava continua sendo o método Sentinel, ainda bloqueado.
- **Unidade do campo `area`: hectares** — conferido projetando a geometria
  (SIRGAS 2000 / UTM 21–23S) e medindo por shoelace contra o campo da fonte:
  razão **0,943 em 5/5 feições** (0,84–1,08). Sem esta conferência o número
  sai sem unidade, e número sem método não vai na tela (AGENTS § 8).
- **CSV do WFS é 7× mais rápido que GeoJSON** no mesmo servidor e mesma
  página: **4,9 s / 93 KB** contra **35,4 s / 451 KB**. Coleta paginada de MG
  em 35 páginas de 2.500 (`startIndex` + `sortBy=id`): **86.694 feições**
  em ~7 min — batendo certinho o `numberMatched` do servidor.
- **Série publicada** (`apps/web/data/cavas-serie-mineracao-mg.json`,
  10,9 KB): 40 anos (1985→2024), **86.694 polígonos, 104.186,8 ha** de área
  mapeada (1.041,9 km²). Salto de 2020→2022 (5.403 / 4.972 / 4.846 polígonos)
  e estado `ativa` (última detecção 2024). 1985 é o teto da série — ali
  cabe o que existia antes, tratar como baseline, não como "ano em que tudo
  começou".
- **Divisão fora do SIGMINE bateu com o plano:** 3.869 polígonos com
  `dentro_sigmine=false` (2.589,5 ha) — **o mesmo 3.869 já medido na Fase 1**.
  É a segunda verificação independente.
- **Três estados editoriais, amostra datada**
  (`apps/web/data/cavas-estados-mg.json`, 60,9 KB): **120 cavas com semente
  42** → **84 em operação, 34 indício processual, 2 sem cadastro ANM**.
  Corte por BBOX com buffer de 80 m, fases cruzadas com
  `pto:processos_minerarios`.
- **Achados de servidor a não repetir:** `uf_id`/`municipio_id` voltam
  corrompidos (`[Ljava.lang.Long;@5fcf83ae`) → filtro de UF é **espacial**,
  nunca por campo; `resultType=hits` quebra (JSONDecodeError /
  RemoteDisconnected) → contar por `numberMatched` ou paginando; o `id`
  chega como `mining_age.642279` mas o CQL `id IN (...)` quer **número**
  (`id IN (642279)`, aspas quebram a conexão).

## Medições da Fase 5 — 29/09/2026

**O que foi publicado**

- **Duas camadas no globo**, ambas da mesma fonte da página
  (`pto:mining_age`, MapBiomas, 30 m), geradas por
  `scripts/etl/cavas/fase3-mineracao-mg.py --camadas`:
  | camada | feições | arquivo | área |
  |---|---:|---:|---:|
  | `mineracao-sem-cadastro` | 3.869 | 1.565 KB cru | 2.589,5 ha |
  | `cavas-monitoradas` | 3.799 | 1.811 KB cru | 4.234,4 ha (2024) |
  Teto do plano: GeoJSON gzip < 2 MiB cada — **as duas ficam abaixo até
  cruas** (gzip medido: 125 KB e 170 KB). Entradas em `LAYER_REGISTRY` e em
  `CAMADAS` (assunto `territorio-mineracao`), `on: false` e `pesada: true`
  nos dois: 7.668 polígonos novos não podem entrar em "ligar tudo" de graça.
  Cores conferidas **em OKLCH**, não HSL: 34,65° (21,2° da mais próxima) e
  115,4° (13,4° da mais próxima) — piso do projeto é 11,6°.
- **`proveniencia.json` regenerado**: 54 camadas, origem declarada das duas
  novas, nenhuma caindo em `camadas_sem_origem_declarada`.
- **Página `/mineracao/cavas`**: 8 cartões de topo com números medidos,
  gráfico SVG nativo de Δ área/ano com tabela equivalente em `<details>`,
  os três estados editoriais com contagem, tabela de 120 cavas com busca,
  filtro por estado, ordenação por coluna e CSV do filtrado (`;` + BOM).
- **Verificação verde**: `npm test` (172 arquivos de teste no vitest) e
  `testar-globo.mjs` (153 testes, +7 novos em `js/layers/cavas.test.mjs`,
  que cruza globo × série publicada e derruba se os dois números divergirem).
  `checar-dado-pessoal-em-dado.py` verde nos 462 arquivos de dado.

**O que ficou pendente, escrito em vez de omitido**

- **Deep-link `?camada=`** — ✅ **feito em 29/09**: a página
  `/mineracao/cavas` tem a seção "Onde isso está no mapa" com dois links
  `/terras/globo/?camada=...`, o globo abre a camada pedida
  (`camadaDoEndereco()` em `js/ui/layerspanel.js`, testado), e o inspetor do
  globo ganhou "Ver a série e a tabela no portal". **Segue pendente o
  `idx=`**: destacar a cava individual na tabela não fecha, porque a tabela
  é a amostra de 120 e a maioria dos 7.668 polígonos do globo não está nela.
- **Contexto para o chatbot (regra 5)** — ✅ **feito em 29/09**: seis pedaços
  `cavas:*` em `lib/assistente/acervo.ts`, com os números lidos dos mesmos
  JSONs da página (série, cartões, estado da janela, três estados, lacunas,
  link da ANM). Três testes em `acervo.test.ts` derrubam se o dado sumir ou
  se o número virar texto digitado à mão.
- **Tags derivadas de dado** — ainda não: `AcervoFonte` não tem campo de
  tags; hoje a marcação vive no texto curado.
- **Imagem da data no link externo** e **ressalva de IA visível por item** —
  dependem da série Sentinel, ainda bloqueada (ver medições da Fase 3 e o
  bloco do Sentinel em [FONTES.md](../../06-fontes/FONTES.md)).
- **Filtro por UF e por distância de TI/UC** — fora do escopo desta leva;
  a série cobre só MG e a distância não foi coletada.

## Medições do preparador da VM (Azure) — 12/10/2026 (medido)

Rodada de validação do workflow `cavas-preparador.yml` (input `limite`),
disparada na tarde de 12/10 com os três commits do dia: `04efcac5`,
`6541c7af` e `f1807af7`. **Três runs e nenhum fechou coleta** — mas a
rodada achou as causas-raiz e provou o canal de log por Blob. Todos os
horários abaixo são UTC.

**Os três runs do dia:**

- **3º run — id 38251362873, `04efcac5`, dispatch 12:48.** `preparar`
  success (o `confirm` respondeu Conflict às 12:52:41), `vigiar` failure,
  `desligar` success; VM desligada às 14:13. A VM executou duas vezes
  (12:49 e 13:22) e **as duas morreram**; o heartbeat congelou em
  `progresso-20261012-1322.json`, fase `negativos`, 13:22:10.
- **4º run — id 38262303250, `6541c7af`, dispatch 14:21.** O CMD foi
  entregue à VM (rede +3,6 KB em 14:24) mas **nunca executou**: 72 min sem
  heartbeat; o `confirm` entrou em Conflict às 14:25:40 e ficou 75 min
  nesse estado; o diagnóstico do `desligar` também respondeu Conflict
  (15:38:18); `vigiar` failure; VM desligada 15:50:26; **0 heartbeat novo**.
- **5º run — id 38273534881, `f1807af7`, dispatch 15:53.** Este commit
  introduziu o passo "Reboot de limpeza" e o `confirm` em 3 tentativas;
  `preparar` success. Duas execuções: 15:54:41 (comando residual do run
  anterior) morreu em 7 s com `abortado-rc1`; 16:23:24 (comando do run 5)
  morreu em `abortado-rc128`. **O `enviar_log` novo validou:** nos dois
  casos ele mandou `log-...-inicio.txt` e `log-...-abortado-rc*.txt` para o
  Blob. Canal de log por Blob **funciona** — era o canal que faltava, porque
  o run-command dá Conflict durante toda a coleta.

**Causas-raiz (lidas nos logs do Blob):**

1. `ModuleNotFoundError: No module named 'rasterio'` — **todo** preparador
   desde ao menos 11/10 18:05 morre no 1º candidato negativo, dentro de
   `ler_janela` do coletor (import lazy de `rasterio`). A VM nunca teve
   `rasterio` instalado.
2. `shallow.lock` travado em `/opt/controle-popular/.git` — um fetch
   interrompido (reboot no meio) deixa o lock no lugar, e todo fetch
   seguinte sai com rc128.
3. A fase de positivos saía sempre com `alvos: 0` — **causa achada e
   corrigida no mesmo dia**: a VM gravou um cache `[]` em 11/10 (o WFS
   respondeu sem features uma vez) e o código lia lista vazia como
   resposta válida para sempre. O WFS hoje volta **7.667 poligonais** com
   a mesma CQL (cache local do PC: 7.656). Correção em
   `carregar_positivos` (função nova `ler_cache_positivos`): cache vazio
   vale como ausente e refaz a consulta; a gravação segue incondicional —
   um `[]` novo é ignorado na próxima leitura e o cache se cura sozinho.

**O que a documentação da Azure diz** (learn.microsoft.com, página "Run
scripts in a Linux VM in Azure using action Run Commands", lida em 12/10):

- Um script pode rodar no máximo **90 minutos**; depois disso dá timeout —
  a coleta longa com `limite=500` corria risco.
- O log do handler fica em `/var/log/azure/run-command/handler.log`, dentro
  da própria VM.
- A saída no status blob é limitada a **4 KB** — por isso o preparador
  envia heartbeat e log pelo Blob próprio (SAS de 3 h, só escrita). O SAS
  foi validado hoje: 98 caracteres, começa com `se=`, sem `?` inicial, então
  a URL `...arquivo.json?${SAS}` está correta.
- Estado travado ("Run command extension execution is in progress") tem
  remédio oficial: `az vm run-command invoke --command-id
  RemoveRunCommandLinuxExtension` (a extensão se reinstala sozinha na
  próxima chamada); o workaround comunitário é desligar e ligar a VM.
- O Run Command exige conectividade de saída na porta **443** para
  endereços Azure (tag `AzureCloud`); sem ela o script roda mas não devolve
  resultado.
- Existe a variante **managed run command** (`az vm run-command create`):
  assíncrona, com progresso reportado e saída para blob — candidata a
  evolução futura do workflow. **Decisão do dono; não implementar.**

**Operação medida (rodada de 12/10):**

- **Sonda local durante o run: evitar.** Chamar `az vm run-command` ou
  consultar a extensão **durante** o run correlaciona-se com tempestades de
  conexão 10054 e com operações órfãs — observação operacional, não
  causalidade comprovada. Por isso o monitoramento passou a ser **só pelo
  Blob**.
- O `az` local oscila com `ConnectionResetError` 10054 em rajadas → repetir
  com espera longa. Logs de job só via `gh api .../jobs/<id>/logs`, e só
  para jobs completos.
- Guardas sujas fora do escopo desta rodada (**não mexer**):
  `.claude/launch.json` e `package-lock.json`.
- Pendências aguardando decisão do dono: os 16 itens da lista curta, os 15
  `revisado`, a regra dos 5 mil negativos e a cadência de deploy (só com
  permissão).

## Rodada de 12/10 fechada e crédito Azure — 13/10/2026 (medido)

Fecha os dois runs de 12/10 que ficaram de fora do balanço anterior, registra
os dois consertos que saíram da leitura deles e responde, com número da API,
quanto as tentativas gastaram do crédito da Azure. Horários em UTC.

**Os dois runs restantes de 12/10:**

- **6º run — id 38287381314, `fd01a3fe` (dispatch manual).** `preparar`
  success, `vigiar` falhou após os 72 min, `desligar` cancelou mas a VM
  terminou desligada. A VM executou o preparador às **19:21:35** e morreu em
  ~10 s.
- **7º run — id 38310116776, `62c75454` (cron 12:30).** Mesmo desenho:
  execução às **22:05:47**, morte em ~18 s, `vigiar` esgotou a janela,
  `desligar` encerrou a VM.
- Nos dois o heartbeat ficou `abortado-rc100`, e nos dois o `vigiar` **não
  mostrou esse aborto** (bug 2 abaixo).

**Causa-raiz 4 — dpkg interrompido (a do rc100):**

```
E: dpkg was interrupted, you must manually run 'dpkg --configure -a'
E: Sub-process /usr/bin/dpkg returned an error code (100)
```

O `apt-get install` do bloco de dependências recusou com **rc100** antes de
instalar qualquer coisa. A origem é um apt morto no meio (reboot de limpeza
ou desligamento da VM) deixando o banco do dpkg com pacote pendente — e todo
apt seguinte passa a recusar. A cura é a que o próprio erro pede.

**Causa-raiz 5 — o `vigiar` lia o heartbeat errado:**

`grep -o '<Name>progresso-...' | head -n1` pega o **primeiro** da listagem, e
a listagem sai em ordem lexicográfica com o carimbo de tempo no nome — ou
sempre o **antigo** `progresso-20261012-1322.json`. O `abortado-rc100` dos
runs das 19:21 e 22:05 existia no Blob e ninguém leu.

**Consertos aplicados em 13/10/2026:**

1. `scripts/etl/cavas/preparador-cavas.sh` — `dpkg --configure -a || true`
   antes do `apt-get update` (a receita do próprio erro; quem relata o estado
   final é o apt logo abaixo).
2. `.github/workflows/cavas-preparador.yml` — `tail -n1` no lugar de
   `head -n1`, mais `::warning::` imediato quando o heartbeat diz
   `abortado`, para a causa aparecer na hora em vez de ao fim dos 72 min.

**Crédito Azure e gasto medido (13/10/2026, API do Azure):**

- Conta de cobrança **`Artur Colito`** (MCA Direct, criada **04/10/2026
  20:15**), perfil **`TEKD-AO7U-BG7-PGB`**, moeda **BRL**, dia da fatura 9.
- Crédito, lido em `billingProfiles → spendingLimitDetails`: **US$ 100,00**,
  tipo **`AzureForStudents`**, de **04/10/2026 a 04/10/2027**, status
  `Active`, `spendingLimit: On`.
- Gasto (Cost Management, `ActualCost`, moeda da assinatura): **R$ 43,37 no
  total de 04/10 a 13/10** — nada em agosto ou setembro, porque a conta
  nasceu em 04/10.
  - por dia: 04/10 0,24 · 05/10 2,11 · 06 a 09/10 2,14 cada · 10/10 6,73 ·
    11/10 11,55 · 12/10 10,71 · 13/10 3,46 (dia parcial);
  - por serviço: Azure Container Apps **25,65** · Virtual Network **10,07** ·
    Storage **7,44** · Container Registry 0,18 · Container Instances 0,02 ·
    Load Balancer e banda ≈ 0 · **Virtual Machines 0,00**;
  - por grupo: `cp-app` 38,54 · `me_cp-env_cp-app_spaincentral` 4,80 ·
    `me_cp-env2_cp-app_northcentralus` 0,03.
- **A VM das cavas (`cp-vm`) custou R$ 12,69** — disco P4 LRS **R$ 7,44** +
  IP público estático **R$ 5,24**, cobrados por dia desde 05/10 (primeira
  cobrança) **enquanto a VM existir**: ≈ **R$ 1,27/dia**, ligada ou não.
  O processamento mediu **R$ 0,0000** em todos os dias (medidor
  `B2ats v2 - Free`).
- Leitura: **a coleta em si está saindo de graça.** O que consome o crédito é
  o portal no Container Apps e a mera existência da VM (disco + IP). Rodar
  `limite=10` ou `limite=500` não muda a conta — e apagar a VM quando a fase
  terminar é o único corte relevante (R$ 1,27/dia).
- A API devolve em BRL; o crédito é em USD. O portal (Azure → créditos)
  mostra a conversão exata — pela ordem de grandeza, R$ 43,37 fica perto de
  **US$ 8 dos US$ 100**.

## Rodada de 13/10/2026 — VM reprovada, coleta no PC local (medido)

Três medições do mesmo dia, todas no `home-pc` e na VM `cp-vm`:

### A VM não coletou nada (run 38426396287)

- `az vm run-command` com `--no-wait` **nunca executou** em 80+ minutos:
  `vigiar` completou `completed/failure` ~17:28 UTC, `desligar` desligou a
  VM, o run fechou `completed/failure` às 17:41 UTC;
- os `##[warning] preador abortou` do vigia eram **heartbeat antigo**
  (`progresso-20261012-2205.json`, abortado-rc100 de 12/10) — o run-command
  nem tinha chegado para regravar;
- leitura: sem causa confirmada do atraso do run-command. Enquanto não houver
  causa, **coleta grande roda no PC local**; VM só para teste de caminho.

### Fila de positivos corrigida e coleta local completa (+10)

- causa medida do "0 recortes em 40 minutos": a fila era ordenada por id de
  cena **crescente** e abria em dez/2025–jan/2026 (época de chuva); as 8
  primeiras candidatas foram rejeitadas por nuvem;
- dois consertos em `coletar-cavas-calibracao.py`: ordem **decrescente** e
  salto dos **1.998 alvos já coletados** (antes cada um custava ~45 s de
  leitura para o hash descartar);
- rodada local (`--tipo positivo --limite 10`): **+10 recortes** gravados em
  ~15 minutos, nuvem 7%, cena `CBERS_4A_WPM_20260924_206_141_L2` — os
  primeiros positivos novos desde a coleta de 02/10;
- manifesto: positivo 2.035 · negativo 3.095.

### Negativos: 0 por régua de nuvem, não por bug (diagnóstico)

- rodada `--tipo negativo --limite 10`: 30 candidatos, **0 aceitos**;
- diagnóstico com a mesma semente (`diagnosticar-negativos.py`): das 90
  janelas testadas, **77 rejeitadas por nuvem >20%**, 7 leituras falharam,
  **0 hash duplicado** — a régua funcionou; a amostra estava nublada;
- conserto: reserva de candidatos **×3 → ×10** (100 pontos, baratos em
  memória; a leitura de cena só acontece na aceitação) e ordenação
  decrescente como nos positivos;
- rodada de verificação com o conserto: 100 candidatos sorteados,
  em andamento no fecho desta sessão.

## Treino 2 m com os negativos novos (19/10/2026)

Primeira rodada do `treinar-cavas-2m.py` depois que o cache local passou a ter
negativos limpos. Dado medido no disco: **844 recortes limpos** (nuvem ≤ 0,30),
sendo **207 positivos** e **637 negativos**, em **163 cenas**. Split por cena:
683 no treino (179 pos / 504 neg) e **161 na validação** (28 pos).

Configuração: 6 épocas, `lr` 1e-3, `batch` 8, backbone Chinese-CLIP congelado
(CPU, `torch 2.12.1+cpu`), mesma semente e mesmo split. Três entradas
comparadas: o PNG inteiro (700 px → 224, **6,25 m/px**), recorte central de
448 px (896 m → 224, **4 m/px**) e recorte central de 224 px (448 m → 224,
**2 m/px nativo**). Saída em `%LOCALAPPDATA%\Temp\opencode\cavas\treino-2m\`.

| entrada | melhor época | precisão | recall | F1 | tp/fp/fn/tn |
|---|---|---|---|---|---|
| PNG inteiro (6,25 m/px) | 1 | 0,769 | 0,357 | 0,488 | 10/3/18/130 |
| recorte 448 px (4 m/px) | 5 | 0,600 | 0,536 | 0,566 | 15/10/13/123 |
| **recorte 224 px (2 m/px)** | **5** | **0,548** | **0,607** | **0,576** | 17/14/11/119 |

O pixel nativo confirma a hipótese do plano: F1 sobe de 0,488 para **0,576** e
o recall de 0,357 para **0,607**. A precisão cai no ponto de melhor F1, mas a
época 2 do recorte 224 teve **P 0,857 / R 0,429 / F1 0,571** — um ponto
conservador que o seletor por F1 não guarda.

Leitura: ainda **não comparável ao v12 de 8 m** (F1 0,804, outro holdout) e
**não passa o gate** de precisão ≥ 0,80 no ponto de melhor F1. O gargalo
principal segue sendo dado: dos 2.035 positivos do checkpoint de calibração,
só **532** têm recorte 2 m `ok` (**1.503 ainda sem corte**), e apenas **207**
passam o teto de nuvem. Próximos passos, nesta ordem: cortar mais positivos,
calibrar o limiar com corte de precisão (≥ 0,80) e repetir com
`--recorte 224`.

Consertos no caminho: `modelo.eval()` no backbone congelado (features
determinísticas, sem dropout), `loss.detach().item()` no lugar de
`float(loss)` e a opção `--recorte` no treino.

## Coleta 2 m: fila travada e rasterio (19/10/2026)

Ao começar a cortar mais positivos, dois bloqueios apareceram:

1. **`rasterio` ausente** no Python 3.12 da máquina — o gerador morria em
   todos os 10 alvos. Instalado `rasterio 1.5.2` (o `requirements.txt` já
   pedia) e a leitura voltou.
2. **A fila não andava**: `_ler_cheios` só pulava hash com status `ok`. Os
   **48 hashes `sem-cena`** do começo da lista eram retentados em todo run,
   então os ~1.450 positivos seguintes nunca eram alcançados.

Conserto: `_ler_feitos` agora pula `ok` **e** `sem-cena` por padrão;
`--retentar-sem-cena` volta a tentar (caso uma cena nova apareça). Medido no
mesmo dia, com **1 worker**:

| alvo | resultado | nuvem |
|---|---|---|
| 1º ponto novo | `ok` em **84 s** | **1,000** (inútil) |
| 3 pontos seguintes | `ok` | 0,064 · 0,490 · 0,174 |

Leitura: **1 worker funciona** e respeita o ritmo de 1–2 s por host; o run com
2 workers devolveu 10 `sem-cena` em segundos, sem ler cena (suspeita de limite
do INPE). Custo medido: **~84 s por recorte**, então 100 recortes ≈ 2,3 h.
O corte passou de 532 para **536 positivos `ok`** e de 207 para **209
positivos limpos** (nuvem ≤ 0,30). A fila agora avança.

## Calibração de limiar do 2 m (20/10/2026)

O treino escolhia a época por F1 e guardava P 0,548; para descoberta o limiar
útil é o de maior recall com precisão mínima. `scripts/oficina-cavas/calibrar-2m.py`
relê os pesos salvos e varre o limiar no mesmo split por cena (seed 42).
Limitação: o checkpoint cresceu durante a coleta, então a validação ficou com
**172 recortes (39 positivos)** em vez dos 161 do treino — as cenas novas não
foram vistas pelo modelo, mas o número não é o mesmo holdout.

| piso de precisão | limiar | precisão | recall | tp/fp/fn/tn |
|---|---|---|---|---|
| melhor F1 | 0,38 | 0,490 | 0,641 | 25/26/14/107 |
| ≥ 0,70 | 0,56 | 0,737 | 0,359 | 14/5/25/128 |
| ≥ 0,80 | 0,58 | 0,800 | 0,308 | 12/3/27/130 |
| ≥ 0,85 | 0,68 | 0,857 | 0,154 | 6/1/33/132 |
| ≥ 0,90 | 0,81 | 1,000 | 0,077 | 3/0/36/133 |

Leitura: **P ≥ 0,90 só existe com 7,7% de recall** (3 de 39 positivos). O
G2 do plano (P ≥ 0,80) é alcançável com R ≈ 0,31; para descoberta de 5–10
casos, isso ainda é pouco. O 2 m precisa de mais positivos limpos e negativos
difíceis antes de substituir o 8 m como triagem. JSON:
`%LOCALAPPDATA%\Temp\opencode\cavas\treino-2m\calibracao-2m.json`.

### Segundo treino 2 m em GPU (20/10/2026)

Com ~246 positivos limpos (o lote de 100 ainda estava em andamento), o treino
rodou no Python do Hermes com **CUDA ativa** (RTX 3050), 6 épocas, recorte 224.
Snapshot: treino 768 (221 pos / 547 neg), validação 114 (25 pos). Melhor época
(6): P 0,667 / R 0,480 / F1 0,558 no limiar 0,5.

A calibração por limiar achou P 0,8125 / R 0,500 / F1 0,619 no limiar 0,54;
**nenhum limiar atingiu P ≥ 0,90**. Leitura: acrescentar ~40 positivos sem
negativos difíceis não melhorou a precisão alta — o ponto de 90% que existia
no modelo de 19/10 desapareceu. O gargalo é **negativo difícil e rótulo**, não
volume bruto de positivo. O modelo de 19/10 foi preservado em
`melhor-20261019-rec224.pt`; o de 20/10 está em `melhor.pt`.

### Terceiro treino 2 m: hard negatives (20/10/2026)

O vigia disparou pelo commit do manifesto e treinou de novo, agora com os
primeiros negativos difíceis do v7 (falsos positivos de lavoura, desmate,
cidade e água) além dos 262 positivos. Snapshot: treino 780 (229 pos / 551
neg), validação 124 (33 pos). Melhor época (5): P 0,692 / R 0,545 / F1 0,610
no limiar 0,5.

A calibração por limiar:

| piso de precisão | limiar | precisão | recall | tp/fp/fn/tn |
|---|---|---|---|---|
| melhor F1 | 0,47 | 0,645 | 0,606 | 20/11/13/80 |
| ≥ 0,80 | 0,58 | 0,800 | 0,485 | 16/4/17/87 |
| ≥ 0,90 | **0,64** | **0,917** | **0,333** | **11/1/22/90** |

Leitura: **este snapshot** entrega P 0,917 / R 0,333 no limiar 0,64 — 12
candidatos, 1 falso positivo. Mas a comparação com o modelo de 19/10 está
confundida: o holdout mudou (124 vs 172) e só **~5** dos hard passaram o
filtro de nuvem (negativos limpos 637→642). Não atribuir o ganho só aos hard;
é um ponto de uma rodada, não uma curva. O próximo passo é **congelar o
split** antes de comparar modelos.

### Quarto treino: 26 hard negatives não superaram (20/10/2026)

Com 26 hard negatives, o split por cena mudou (val 117, 24 positivos) e o
melhor F1 caiu para **0,476** (P 0,556 / R 0,417); só ~9 hard passaram o
filtro de nuvem. Não é comparação direta — o holdout é outro —, mas a leitura
é clara: com ~120 recortes de validação, a seleção de época é instável e o
empate entre o primeiro lote e 26 hard não se resolve por volume. **Decisão:**
manter o modelo do **primeiro lote hard** (calibrado P 0,917 / R 0,333) e não
promover o de 26. Antes do próximo treino, congelar o split e
aumentar o holdout (mais cenas), em vez de trocar o conjunto a cada lote.

## Origem

Blocos movidos de [PLANO-GLOBO-CAVAS-MINERACAO.md](/docs/historico/planos/PLANO-GLOBO-CAVAS-MINERACAO.md)
em 11/10/2026, quando o plano chegou a 904 linhas e o dono pediu divisão por
temas. Os textos são os originais, sem reescrita — só o nível de título
subiu um grau (`###` → `##`, `####` → `###`). O plano ficou com ponteiros
para cá, e o que era regra permaneceu lá.