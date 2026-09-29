# PLANO — Rastreamento de cavas de mineração no globo 3D

> **Tipo:** PLANO
> **Domínio:** global
> **Última medição:** 2026-09-29
> **Leitura estimada:** longa (> 15 min)
> **Relacionados:** [ESTADO.md](../02-estado/ESTADO.md), [FONTES.md](../06-fontes/FONTES.md), [PRODUTO.md](../01-produto/PRODUTO.md), [AGENTS.md](/AGENTS.md), [PLANO-FILA-PROXIMA-SESSAO.md](../historico/planos/PLANO-FILA-PROXIMA-SESSAO.md)
> **Palavras-chave:** mineracao, cava, sigmine, anm, mapbiomas, monitor-mineracao, sentinel-2, satelite, globo-3d, vision, embeddings, similaridade, dino, clip, licenciamento, garimpo, dupla-verificacao

## Sumário

- [O que o dono pediu](#o-que-o-dono-pediu)
- [Descobertas da medição de 24/09](#descobertas-da-medição-de-2409)
- [Resposta sobre os modelos: origem e licença](#resposta-sobre-os-modelos-origem-e-licença)
- [Barra de publicação — regra que não se negocia](#barra-de-publicação--regra-que-não-se-negocia)
- [Arquitetura em seis fases](#arquitetura-em-seis-fases)
- [Detalhe por fase](#detalhe-por-fase)
- [Fontes e licenças](#fontes-e-licenças)
- [Onde vive o código](#onde-vive-o-código)
- [Limites medidos](#limites-medidos)
- [O que NÃO fazer](#o-que-não-fazer)
- [Estimativa e ordem](#estimativa-e-ordem)
- [Decisões registradas](#decisões-registradas)
- [Origem](#origem)

## O que o dono pediu

Pedido de 24/09/2026: no globo 3D, rastrear **cavas de mineração** para
identificar atividade mineral **sem autorização**. O caminho pedido:

1. partir dos locais de mineração **licenciados** (base de treino);
2. "treinar o modelo" com prints dessas áreas;
3. buscar locais **parecidos** no Brasil inteiro com foto de satélite
   atualizada;
4. detectar **mudança pelo histórico** — cava crescente, cava ativa.

Este plano traduz o pedido em etapas mensuráveis. A decisão do dono no mesmo
dia (ver [Decisões registradas](#decisões-registradas)) ajusta o passo 2:
**similaridade primeiro, treino depois** — o modelo pronto já acha parecidos;
treinamos só se a medição de precisão provar que precisa.

## Descobertas da medição de 24/09

Tudo abaixo foi medido no disco hoje. Nada aqui é suposição.

| O que já existe | Onde | Número medido (24/09) |
|---|---|---|
| Globo 3D próprio (three.js r166, estático, sem build) | `apps/web/public/terras/globo/` | 57,70 MB, 143 arquivos |
| Mina em operação em MG (camada do globo) | `dados/camadas/sigmine-operacao.geojson` | 7.090 poligonais |
| Interesse minerário (camada do globo) | `sigmine-interesse.geojson.gz` | 47.830 poligonais, 6,06 MB |
| SIGMINE nacional já coletado | `apps/web/data/sigmine-nacional.json` | 8,85 MB (coletor `scripts/coletar-sigmine-nacional.py --brasil`) |
| Monitor da Mineração do MapBiomas | plataforma pública (beta 1.2) | 257.591 processos; 22.668 (8,8%) com indício (MapBiomas, 03/12/2025) |
| Atributos do Monitor | **GeoServer WFS público** (`plataforma.geoserver.mapbiomas.org/geoserver/pto/wfs`, medido 25/09) | `transbordamento_lavra`, `lavra_fantasma`, `temporal_inconsistency`, `in_restricted_area`, `inappropriate_permission`, `uc_temporal_inconsistency`, `cfem`, `guia_utilizacao`, `nup` |
| Imagem atual no globo | Esri World Imagery (em `js/layers/imagens.js`) | zoom máx. 19, CORS `*` |
| **Satélites brasileiros** | INPE STAC `data.inpe.br/bdc/stac/v1` + AWS `s3://brazil-eosats` (sem conta) | **CBERS-4A WPM 2 m/8 m**, MUX 16 m; **Amazônia-1** 64 m, revisita 5 dias; CC-BY 4.0 |
| Globo já "orbita" o CBERS | `js/layers/satelites.js` (TLE CelesTrak) | Sentinel-2, Landsat-9 e CBERS-4A em órbita simulada |
| GPU desta máquina | `nvidia-smi` | RTX 3050, 4 GB VRAM |
| Disco para cache | drive `X:` | 65,7 GB livres |
| Modelo de visão no repo | — | **nenhum**; LLM hoje é só texto (`lib/chat-comum.ts`, Ollama local) |

Dois fatos mudam o plano:

- **Existem satélites brasileiros, grátis e abertos.** CBERS-4A (2 m na
  câmera WPM) e Amazônia-1 (64 m, revisita 5 dias) são do INPE, baixáveis
  por STAC público e pelo bucket aberto da AWS **sem conta**, com licença
  CC-BY — atribuição ao INPE. CBERS vira a **imagem fina de conferência**;
  Sentinel-2 segue como série histórica.
- **O MapBiomas já faz parte do trabalho.** O Monitor cruza a classe de
  mineração do satélite com a base da ANM e marca `transborda` (lavra além
  do polígono), `lavra_fant` (polígono sem atividade) e `inconsiste`. É
  baseline e dupla verificação — não concorrência.
- **O Monitor já errou na público.** No lançamento (02/12/2025) publicou
  37% de processos inconsistentes; o número certo era 8,8%, e a plataforma
  foi retirada do ar (Agência Brasil, 03/12/2025). Número de modelo erra.
  Daí a barra da próxima seção.

## Resposta sobre os modelos: origem, licença e privacidade

**Privacidade primeiro (decisão do dono, 24/09):** todo modelo roda **local**
neste PC. Peso baixado é arquivo no disco; a análise não manda imagem nem
dado para Meta, OpenAI, Alibaba ou qualquer nuvem. Só sai da máquina quem
for chamado por **API remota** — e esta está vetada no pipeline (ver
[O que NÃO fazer](#o-que-não-fazer)). Mesma regra vale para Ollama: local,
sem chave, sem telemetria.

Nenhum modelo brasileiro de visão existe em aberto — registro honesto.
O Brasil tem modelos de **texto** (BERTimbau/USP; Sabiá da Maritaca,
brasileiro mas por API, sem pesos abertos). Para imagem de satélite, o dono
escolheu os chineses, todos código aberto:

| Modelo | Origem | Licença (medida) | Papel aqui |
|---|---|---|---|
| **Chinese-CLIP** (BAAI) | China | **MIT** (API do GitHub `OFA-Sys/chinese-clip`, medido 25/09) | **primário:** extrair a "impressão digital" da imagem e achar parecidas |
| **Qwen3-VL 2B Instruct** (Alibaba) | China | **Apache 2.0** (card HF, medido 25/09) | **primário:** legenda e escore da fila de revisão, no Ollama local |
| ~~Qwen2.5-VL 3B~~ (Alibaba) | China | ⚠️ **`qwen-research` = só não-comercial** (LICENSE do card, medido 25/09) — **descartado**, não era Apache | substituído pelo Qwen3-VL 2B acima |
| **DINOv2** (Meta) | EUA | Apache 2.0 — código e pesos; reliberado de CC-BY-NC (card `facebook/dinov2-base`) | reserva técnica: entra só se o Chinese-CLIP reprovar no gate de precisão |
| **CLIP** (OpenAI) | EUA | MIT — código e pesos | reserva técnica, mesmo critério |
| **SigLIP** (Google) | EUA | Apache 2.0 (card `google/siglip-base-patch16-224`, medido 25/09) | reserva técnica, mesmo critério |
| **InternVL2.5 2B** (OpenGVLab) | China | MIT (card HF, medido 25/09) | reserva técnica, mesmo critério |

Reserva técnica ≠ escolha: americanos ficam guardados e **não são usados**
a não ser que o medidor de precisão da Fase 2 reprove o chinês — e, nesse
caso, a troca volta ao dono antes de acontecer.

Licença permissiva (MIT/Apache) = pode usar, copiar e adaptar com
atribuição. Chinese-CLIP (encoder Visão) e Qwen3-VL 2B cabem na RTX 3050
de 4 GB. A licença final de cada peso é medida e catalogada em
[FONTES.md](../06-fontes/FONTES.md) na Fase 0 — card do modelo, não blog.

## Barra de publicação — regra que não se negocia

"Sem autorização" é acusação. O portal publica **indício**, nunca sentença.
Concreto, quatro travas (AGENTS § 7):

1. **Palavra certa:** "área com aparência de mineração sem cadastro ANM na
   área" ou "indício de atividade fora da poligonal". Proibido: "ilegal",
   "garimpo ilegal", "crime".
2. **Dupla verificação:** método A (mudança espectral no tempo) + método B
   (similaridade visual) + baseline C (Monitor do MapBiomas). Publica quem
   tem 2 dos 3 batendo — e revisão humana confere antes.
3. **Toda peça é linkável:** data da imagem, fonte, método, ressalva
   "gerado por máquina", link ao processo no SIGMINE/ANM, link do
   visualizador oficial (Copernicus Browser ou Google Earth) e o canal de
   denúncia oficial da ANM.
4. **Junção não vira acusação:** saber que a área aparece no satélite e que
   não tem polígono não prova crime (precedente: incentivador × fornecedor).
   A tela diz o que é coincidência e o que falta conferir.

## Arquitetura em seis fases

```
SIGMINE/ANM (já coletado) ─┐
MapBiomas Coleção 10 ──────┼─→ janelas candidatas ─→ Sentinel-2 (série 2015→2026)
Monitor da Mineração ──────┘         │                    │  + CBERS-4A (fina 2 m)
                                        │          ┌─────────┴─────────┐
                                        │     mudança espectral    embeddings Chinese-CLIP
                                        │        (método A)        (método B, k-NN)
                                        │          └─────────┬─────────┘
                                        │        dupla verificação + revisão humana
                                        └──→ fila de revisão ─→ GeoJSON .gz ─→ globo 3D
                                                                    └─→ /mineraicao/cavas
```

| Fase | O que resolve | Gate (decisão) | Esforço |
|---|---|---|---|
| **0** | Sondagem: conta, licenças, cotas, disco | G0: Monitor entrega nacional? | 1–2 dias |
| **1** | Terreno de calibração (positivos/negativos) | amostra de 200 conferida à mão | 2–3 dias |
| **2** | Índice de similaridade (método B) | precisão ≥ 70% no holdout | 3–5 dias |
| **3** | Mudança no tempo (método A) — "cava crescente" | Δ conferido em 30 cavas | 1 semana |
| **4** | Varredura MG → Brasil | % de cobertura medida e publicada | 1–2 semanas |
| **5** | Publicação no globo + página | dono confere no navegador | 2–3 dias |
| **6** | Rotina mensal + alerta | 1 rodada mensal registrada | 2 dias |

Pipeline roda **offline**, fora da CI, como todo coletor do repo (AGENTS
§ 11). Página de produção **nunca** chama LLM nem API de satélite — ela lê
o GeoJSON pronto.

## Detalhe por fase

### Fase 0 — sondagem e medição (1–2 dias; pode rodar hoje)

Sete medições, todas hoje possíveis sem escrever código de produto:

| # | Medir | Como |
|---|---|---|
| M1 | Copernicus CDSE: cadastro grátis, cota, 1 cena S2 L2A de MG | ⛔ **login não passou (dono, 24/09)**; ✅ **alternativa sem conta medida em 25/09:** Planetary Computer STAC + token SAS anônimos; cena `S2A_MSIL2A_20260924T131251_R138_T23KNU_20260924T205410`, thumbnail HTTP 200 (3.035.715 bytes) |
| M2 | Monitor da Mineração: shapefile baixa? atributos batem? `robots.txt` lido e decisão anotada no coletor | ✅ **medido 25/09:** libera por **GeoServer WFS público** (`pto/wfs`, `GetFeature outputFormat=application/json` — também aceita shape-zip); amostra confirmou os campos-chave (`transbordamento_lavra`, `lavra_fantasma`, `temporal_inconsistency`, `in_restricted_area`, `inappropriate_permission`) + SIGMINE (`processo`, `fase`, `nome`, `subs`, `uso`, `uf`, `area_ha`, `ult_evento`); camadas: `pto:processos_minerarios`, `pto:mv_transbordamento_borda`, `pto:geoserver_filtrada`, `pto:mining_age`. `robots.txt`: plataforma MapBiomas = `Disallow:` vazio (livre); host do GeoServer = **404 (sem robots → permitido por padrão)** — decisão registrada aqui: acessar com UA honesta e pausa ≥ 2 s |
| M3 | Licença de cada peso no card do Hugging Face: Chinese-CLIP (MIT esperado), Qwen2.5-VL (Apache 2.0 esperado); reservas DINOv2/CLIP/SigLIP só registradas | ✅ **medido 25/09:** Chinese-CLIP = **MIT** (API GitHub); **Qwen2.5-VL-3B = `qwen-research` (só não-comercial) — expectativa errada, modelo trocado**; Qwen3-VL-2B = **Apache 2.0**; InternVL2.5-2B = MIT; SigLIP = **Apache 2.0** |
| M4 | Throughput de embedding: crops/s na RTX 3050 (ONNX) | ✅ **medido 25/09:** 188M params, carga 3 s; 100 crops 256 px do CBERS; fp32: 13,3 (batch 4) → 46,4 crops/s (batch 32); **fp16 batch 16 = 48,6 crops/s (melhor)** → 50 mil recortes em **17,2 min**. Pesos = 753.177.983 bytes; hub HF travou (0 MB/12 min) → **curl direto (0,86–3,0 MB/s)**; `.bin` precisou virar `safetensors` (transformers 5.5 bloqueia `torch.load` no torch 2.5, CVE-2025-32434). Método: torch 2.5.1+cu121 (ONNX não medido — otimização opcional, decisão por medição futura) |
| M5 | Orçamento de disco: 50 mil recortes ≈ 15 GB (0,3 MB cada) — cabe em 65,7 GB? cache fica **fora do git**, path em `.gitignore` | ✅ **medido 25/09:** 1.000 recortes reais 512 px JPEG q85 = **70,0 KB médio** (39 s) → 50 mil = **3,34 GB**; 100 mil = 6,68 GB. Cabe com folga nos 65,7 GB do `X:`; estimativa antiga de 15 GB era conservadora (valia se 0,3 MB/corte). Cache: `Temp\opencode\cavas\recortes-m5\` (fora do git) |
| M6 | Termos da Esri: visualização de tile ok; **bulk download proibido** → cómputo só com Sentinel | ✅ **medido 25/09:** Master Agreement E204CW (fev/2024): *"Customer may not otherwise scrape, download, or store Data"*; E300 (nov/2025): *"Programmatic use of session tokens (e.g., exporting volumes of basemap tiles) is not permitted"*. Veredito: **tile da Esri só para exibição no globo; cómputo treino/busca só com Sentinel-2, CBERS e Amazônia-1** (CC-BY) |
| M7 | SIGMINE nacional: colunas de fase e titular, tamanho, cobertura das 27 UFs | ✅ `sigmine-nacional.json` = 274.659 processos (2026-09-16), MG 54.890; colunas `proc,ano,fase,titular,subs,uso,uf,area_ha,ev` |
| M8 | **Satélites brasileiros:** 1 cena CBERS-4A WPM (2 m) e 1 Amazônia-1 baixados via INPE STAC ou `s3://brazil-eosats` (sem conta AWS); medir licença CC-BY e cadência de cenas em MG | ✅ **CBERS medido 24/09:** STAC `data.inpe.br/bdc/stac/v1` responde **sem login**; cena `CBERS_4A_WPM_20260728_199_138_L4` (28/07/2026, MG); BAND2 = 132.603.859 bytes (126,5 MiB) baixada em 140 s; BAND0 (pancromática 2 m) = 2,45 GB; miniatura conferida à mão (vegetação, solo exposto, nuvens). ✅ **Amazônia-1 e cadência medidos 25/09:** coleção `AMZ1-WFI-L4-SR-1` (357 cenas em 2 meses, sem login), thumbnail PNG de 1.285.926 bytes baixado (cena `AMAZONIA_1_WFI_20260919_036_021_L4`); **cadência CBERS-4A WPM sobre MG (12 meses): 661 itens, 125 datas distintas, passo médio 2,9 d, máximo 11 d** |

**Estado da Fase 0 em 25/09 07:45 → CONCLUÍDA em 25/09:** M1–M8 todos
medidos acima (M1 por alternativa sem conta; M3 corrigindo a expectativa
do Qwen; M6 por citação do Master Agreement). **Gate G0: SATISFEITO** —
o Monitor entrega `transbordamento_lavra`/`lavra_fantasma` nacionais por
WFS → baseline obrigatório das fases seguintes (método C da barra de
publicação). **Critério de pronto de G0: tabela M1–M7 preenchida, com
data.** Scripts de apoio (`m4-bench.py`, `m2-attrs.py`, `m5-disco.py`,
`m8-stac.py`) ficam em `Temp\opencode\` — apoio de medição, não produto;
nenhum entra no repo. Pesos do Chinese-CLIP (753 MB) e cache de recortes
também fora do git. Próxima fase: **Fase 1 — terreno de calibração.**

**Nota sobre a API do Copernicus indicada pelo dono (24/09):** o dono
não conseguiu fazer login no Copernicus e indicou o
[`ecmwf-datastores-client`](https://github.com/ecmwf/ecmwf-datastores-client)
como alternativa. Medido no README no mesmo dia: o cliente é Apache 2.0 e
fala com os **ECMWF Data Stores** — o exemplo dele é
`reanalysis-era5-pressure-levels`, ou seja, acervo de **clima** (ERA5),
não imagem óptica de satélite; e ele pede `key` de conta Copernicus, o
**mesmo login que travou**. Veredito: fica catalogado como fonte de dado
climático (útil em frente futura de clima/risco), **não serve para foto
de cava**. Foto de cava hoje sai do CBERS, medido e sem login. Se o
Sentinel-2 histórico travar também, a ordem de tentativa é: Planetary
Computer → AWS Sentinel → conta Copernicus (dono).

**Gate G0:** se o Monitor entregar `transborda`/`lavra_fant` nacionais
prontos, ele vira **baseline obrigatório** de toda fase seguinte. Se não,
entra na fila como pendência e o método A assume o papel sozinho (com
risco maior de falso positivo — anotar).
**Critério de pronto:** tabela M1–M7 preenchida neste documento, com data.

### Fase 1 — terreno de calibração (2–3 dias)

- **Positivos:** polígonos do SIGMINE nacional com fase que autoriza
  extrair (Concessão de Lavra, Permissão de Lavra Garimpeira, Autorização
  de Pesquisa com Guia vigente) → recorte **CBERS-4A WPM (2 m/8 m)**
  preferido, Sentinel-2 (10 m) onde não houver cena CBERS; mediano por
  estação, nuvem < 20%, 512 px.
- **Negativos:** solo exposto que **não** é mina (construção, queimada,
  agricultura), água, floresta — amostragem fora de polígonos e fora da
  classe mineração do MapBiomas.
- **Saída:** manifesto JSON leve (bbox, cena, data, hash) versionado;
  imagens só no cache gitignored.

Critério de pronto: ≥ 5.000 positivos e ≥ 5.000 negativos; amostra de 200
conferida à mão; varredura de dado pessoal se qualquer titular de processo
entrar no dado (AGENTS § 5.2 — o coletor nacional já tem `--scan-cpf`).

**Ampliação para treino (decisão do dono, 25/09):** o dono quer treinar
desde o início, então a meta esticada é **10 mil por classe**. Medido em
25/09: MG tem **7.656 poligonais nas fases extrativas** (WFS do Monitor) —
os 10 mil positivos exigem **outra UF no lote** (GO/AM/PA na fila) ou
complemento com Autorização de Pesquisa com guia (hoje `guia_utilizacao`
  vazio nessa fase no WFS — pendência medida, não suposição). **Medido em
  28/09:** o campo existe, é booleano e tem valor **só em AUTORIZAÇÃO DE
  PESQUISA** (25/25 na amostra: 12 False, 13 True); nas fases extrativas
  segue vazio. O complemento de pesquisa com guia tem dado — o flag da
  guia está lá. Pilot medido:
`scripts/coletar-cavas-calibracao.py` roda com cache retomável; nuvem
heurística local (CBERS não tem `eo:cloud_cover` — medido).

### Medições da Fase 1 — 25/09 (piloto)

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
aumentar `--limite`, o rendimento cai junto.

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

### Fase 2 — treino fino do Chinese-CLIP (4–6 dias; antecipada pelo dono 25/09)

- **Ordem nova:** treinar primeiro, comparar depois. Fine-tune do
  **Chinese-CLIP** (RTX 3050, 4 GB: mistura fp16 + congelar o text tower;
  cabeça de métrica ou LoRA) com os pares positivo/negativo da Fase 1;
  **zero-shot vira linha de base** (mesmo holdout, mesma régua).
- Holdout 500 positivos / 500 negativos **nunca vistos no treino**;
  limiar escolhido por **precisão ≥ 70%**; curva precisão×recall publicada
  com data.
- Vetor por recorte índice em numpy/FAISS CPU (10 mil vetores × 512 dim ≈
  20 MB).

Critério de pronto: número de precisão e recall medidos do modelo treinado
**e** do zero-shot + revisão de 100 exemplos. **Se treinado < 70%:**
acionamento da reserva técnica (DINOv2/CLIP) — decisão do dono por
medição na mão, nunca automática.

### Medições da Fase 2 e da fila — 28/09/2026 (parcial: negativos em coleta)

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
  humana e fica com o dono.

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
- Pendências: revisão humana dos 100 exemplos (dono, atalhos
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

### Fase 3 — mudança no tempo, método A: "cava crescente" (1 semana)

- Série anual mediana Sentinel-2 (2015→2026) por janela; índices NDVI
  (vegetação some), BSI (solo exposto cresce), NDWI (água de cava forma).
- Δ de área por ano → estado da cava: **ativa** (mudou nos últimos 24
  meses), **estável**, **encerrada**.
- Cruzamento com a poligonal ANM → três estados editoriais:
  1. dentro de polígono com fase que autoriza → "em operação";
  2. dentro de polígono sem autorização de extração → "indício
     processual — conferir na ANM";
  3. fora de todo polígono → "sem cadastro ANM na área".
- Borda só conta com o **buffer de 80 m** do critério do próprio
  MapBiomas — arredondamento de polígono não vira transbordo.

Critério de pronto: Δ calculado com data para as 7.090 minas em operação
de MG; 30 cavas conferidas à mão no Copernicus Browser.

#### Medições da Fase 3 — 29/09/2026

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

### Fase 4 — varredura de MG e depois o Brasil (1–2 semanas)

- Pré-filtro barato (classe mineração MapBiomas + solo exposto Sentinel +
  fora de polígono ANM) → embedding → busca k-NN no índice → fila de
  revisão.
- VLM de triagem (**Qwen2.5-VL 3B** quantizado no Ollama local) escreve
  legenda e escore da fila — **nunca publica sozinho**.
- Ordem: MG fecha a calibração; na expansão nacional, **Amazônia e
  garimpo em terra indígena primeiro** (impacto social), depois Cerrado.
- Pausa 1–2 s por host, User-Agent honesto, checkpoint de retomada,
  coleta fora da CI (AGENTS § 11).

Critério de pronto: % de MG varrida medida; fila com N candidatos e estado
(revisado / descartado / publicável) — lacuna é informação: diga quantos
itens vieram sem imagem utilizável.

### Fase 5 — publicação no globo e no portal (2–3 dias)

- **Camadas novas no globo:** `cavas-monitoradas` (Δ recente, método A) e
  `mineracao-sem-cadastro` (candidatos revisados, 2 de 3 métodos).
  GeoJSON gzip **< 2 MiB** cada; entrada em `LAYER_REGISTRY` e no assunto
  `territorio-mineracao` do `js/config.js`; `proveniencia.json` regenerado
  pelo `gerar-proveniencia-globo.mjs`.
- **Página `/mineraicao/cavas` com as 5 coisas da regra do dono** (AGENTS
  § 8): gráfico SVG de Δ área/ano, cartões de topo (candidatos,
  confirmados, cobertura), CSV do filtrado (`;` + BOM UTF-8), filtro (UF,
  estado da cava, distância de TI/UC), ordenação por coluna.
- Cada item: link ao processo ANM, link ao visualizador externo com a
  imagem da data, ressalva de IA visível (decisão 4 do dono), e frase de
  que receber sinal não significa ilícito.
- Deep-link do globo para a página no padrão `?camada=&idx=`; detalhe com
  Leaflet já existe no `detalhe.html` (Esri para o olho humano).
- Verificação: `npm test`, `npx tsc --noEmit`, `scripts/testar-globo.mjs`
  e testes `js/**/*.test.mjs` do globo.

Critério de pronto: o dono abre o globo, clica numa cava, e vê — sem
escrever código — ressalva, data da imagem, fonte, método e link na ANM.

#### Medições da Fase 5 — 29/09/2026

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
- **Página `/mineraicao/cavas`**: 8 cartões de topo com números medidos,
  gráfico SVG nativo de Δ área/ano com tabela equivalente em `<details>`,
  os três estados editoriais com contagem, tabela de 120 cavas com busca,
  filtro por estado, ordenação por coluna e CSV do filtrado (`;` + BOM).
- **Verificação verde**: `npm test` (172 arquivos de teste no vitest) e
  `testar-globo.mjs` (153 testes, +7 novos em `js/layers/cavas.test.mjs`,
  que cruza globo × série publicada e derruba se os dois números divergirem).
  `checar-dado-pessoal-em-dado.py` verde nos 462 arquivos de dado.

**O que ficou pendente, escrito em vez de omitido**

- **Deep-link `?camada=`** — ✅ **feito em 29/09**: a página
  `/mineraicao/cavas` tem a seção "Onde isso está no mapa" com dois links
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
  bloco do Sentinel em [FONTES.md](../06-fontes/FONTES.md)).
- **Filtro por UF e por distância de TI/UC** — fora do escopo desta leva;
  a série cobre só MG e a distância não foi coletada.

### Painel de visualização, linha do tempo e exportação (pedido do dono 25/09)

Pedido literal do dono (25/09/2026): painel **buscável, classificável,
filtrável**, com resumos, contexto de chatbot, tags, datas e metadados;
**linha do tempo de imagens** (botão/scroll passando imagem por imagem
para ver a transformação do território); **copiar/exportar** (geolocalização,
fotos, PDF, envio para ANM ou Polícia Militar); **relatório com fotos**.
Esta seção estende a Fase 5 — as 5 coisas dela continuam valendo.

#### A. Ficha da cava — dados e o que cada um responde

| Pergunta do dono | De onde vem | Regra |
|---|---|---|
| Quando a cava **iniciou**? | Fase 3: primeiro ano com Δ > limiar na série Sentinel (2015→2026) | data + método visíveis; sem série → "sem histórico" |
| Quando **ampliou**? / **encerrou**? / **pico de movimento**? | Δ por ano (NDVI/BSI/NDWI) — datas de cada mudança e ano do maior Δ | estado final: ativa / estável / encerrada (critério da Fase 3) |
| Tamanho em **m² e km²**? | contagem de pixels × resolução² (MapBiomas 30 m = 900 m²/px; CBERS 8,4 m = 70,56 m²/px) ou polígono ANM projetado | **a resolução vem escrita na ficha** — número sem método não vai |
| Qual **minério**? | **só o campo substância do cadastro ANM** (SIGMINE/WFS) | ⚠️ cor e região viram **hipótese visual rotulada** ("sugestão por cor — não é dado da fonte") com dupla verificação; sem fonte → "não sei" (regra editorial § 7) |
| Tem **pesquisa minerária** na região? De quem? Quando? | cruzamento espacial com AUTORIZAÇÃO DE PESQUISA / REQUISIÇÃO (WFS Monitor + SIGMINE): titular, nº do processo, data de requerimento | o que não casar por código → "não casou" na tela (lacuna é informação) |

**Tags** derivadas de dado, nunca à mão: `sem-cadastro-anm`,
`cava-ativa`, `pico-<ano>`, `fora-de-poligono`, `dentro-de-ti-ou-uc`,
`<substância>` do ANM, `mesmo-titular-em-n-cavas`. **Busca** por texto
(processo, município, titular, substância) + filtros (estado da cava,
UF, distância de TI/UC, fase, tamanho) + ordenação por coluna.

#### B. Linha do tempo visual (o slider de imagens)

- Slider com botão ◀/▶ e arraste: cada posição = um ano com imagem
  própria (CBERS/Sentinel), **crossfade** com data impressa na tela e a
  barra de Δ daquele intervalo — o leitor vê a cava crescer.
- **Teto medido e decisão de armazenamento:** 7.090 minas × 10 anos ×
  70 KB ≈ **5 GB — não entra**. Linha do tempo só para as cavas
  **publicadas na fila revisada**; thumbnail **256 px (~25 KB)**; ano só
  se tiver imagem limpa (regra do detector de nuvem); alvo ≤ ~300 KB por
  cava em `public/terras/globo/dados/cavas-timeline/`. Acima do teto →
  link ao Copernicus Browser (histórico externo, Fase 5).
- Nunca baixar Esri; série é própria (Sentinel/CBERS, CC-BY).

#### C. Copiar / exportar / relatório com fotos

1. **Copiar:** coordenadas (graus decimais e DMS), link OSM/Google Maps,
   resumo em texto (processo, município, datas, área, fonte).
2. **Foto:** download do frame com crédito (INPE / "Contains modified
   Copernicus Sentinel data [year]").
3. **PDF — relatório sai com fotos:** impressão pelo próprio navegador
   (print → PDF, **sem biblioteca nova**) com ficha, timeline de fotos
   datadas, área, processo ANM, fontes em formato ABNT e ressalvas.
4. **Enviar para ANM ou Polícia Militar:** o portal **não envia nada** —
   monta o pacote (o PDF + geolocalização + links **oficiais medidos e
   verificados** de denúncia de cada canal) e copia para a área de
   transferência. Frase fixa no pacote: "anexar dado público não é
   acusação — a apuração é da autoridade" (barra da Fase 0 vale).

#### D. Contexto para o chatbot

Hoje o chat é `lib/chat-comum.ts` + Ollama local. Cada cava publicada
gera um bloco `contexto` (JSON leve, mesmo manifesto) que o chat injeta
quando a pergunta é sobre aquela cava: metadados, tags, ressalvas e
links. Regra: o chat só **repete o que está no dado** — número fora do
dado é "não sei, e aqui está o que existe perto".

Critério de pronto: ficha com as 4 datas datadas e com método; área em
m²/km² com resolução escrita; slider passa a timeline de uma cava
publicada sem travar; PDF sai com fotos e fontes; copiar geolocalização
conferido à mão; busca/filtro roda sobre os campos que o acervo tem;
cálculo de área e das 4 datas cobertos por teste em `lib/`

### Fase 6 — rotina mensal (2 dias)

- Rodada mensal fora da CI: cena recente → Δ → camadas atualizadas;
  checkpoint; alerta no Telegram no padrão do `guara-shield-bot.mts`.
- Sem deploy a cada rodada — política do dono: deploy a cada ~5 dias
  (AGENTS § 5.7.1). Camada nova espera o deploy comum.

Critério de pronto: uma rodada mensal completa, com relatório datado.

## Fontes e licenças

| Fonte | O que dá | Acesso | Licença | Cuidado medido |
|---|---|---|---|---|
| SIGMINE / ANM | poligonais e fases dos processos | zip diário, UA de navegador | dados públicos | já coletado; `--scan-cpf` obrigatório |
| Monitor da Mineração (MapBiomas) | `transborda`, `lavra_fant`, `inconsiste` | **GeoServer WFS público** `plataforma.geoserver.mapbiomas.org/geoserver/pto/wfs` (`version=1.1.0` obrigatório; também aceita shape-zip) — medido 25/09 | CC-BY 4.0 | beta; errou no lançamento (03/12/2025); citar "MapBiomas - Monitor da Mineração, acessado em [data]" |
| MapBiomas Coleção 10 | classe mineração 30 m, série 1985→2024 | GEE / downloads | CC-BY 4.0 | Landsat 30 m — não vê cava pequena; é pré-filtro |
| Copernicus Sentinel-2 L2A | série histórica 10 m desde 2015 | CDSE (cadastro grátis, cota) | Copernicus free | ⛔ **login não passou no dono (24/09)** — alternativas sem conta: Planetary Computer, AWS; atribuição "Contains modified Copernicus Sentinel data [year]" |
| ECMWF Data Stores (`ecmwf-datastores-client`) | dado de **clima** (ERA5 etc.), não foto de satélite | cliente Python Apache 2.0, pede chave de conta Copernicus | Apache 2.0 | registrado pelo dono 24/09 como fronte de clima futuro; **não serve para imagem de cava** |
| **CBERS-4A / CBERS-4 (INPE)** | **imagem fina 2 m/8 m (WPM)** e média 16 m (MUX) | INPE STAC `data.inpe.br/bdc/stac/v1` + AWS `s3://brazil-eosats` **sem conta** | CC-BY 4.0 | satélite Brasil–China; atribuir INPE; cadência em MG medida na M8 |
| **Amazônia-1 (INPE)** | 100% brasileiro; 64 m, revisita 5 dias | INPE STAC / catálogo `dgi.inpe.br` | CC-BY (crédito INPE) | resolução grossa: serve de reforço de cobertura, não de detalhe |
| Esri World Imagery | imagem atual para o olho humano | tiles (já no globo) | termos Esri | **bulk download proibido** — nunca baixar em massa |
| IBAMA (embargos) e licenças estaduais | cruzamento de autorização ambiental | já coletados | dados públicos | `licencas-ambientais.geojson` 3,48 MB |
| Copernicus Browser / Google Earth | verificação visual com histórico | link externo | — | levar o leitor lá, não re Hospedar imagem |

Registrar cada uma em [FONTES.md](../06-fontes/FONTES.md) com URL, acesso
medido e armadilha (GUIA do catálogo).

## Onde vive o código

| Caminho | Papel |
|---|---|
| `scripts/etl/cavas/` (novo) | pipeline Python: STAC, recortes, índices, embeddings — offline |
| `apps/web/data/manifesto-cavas.json` | metadados leves versionados (sem imagem) |
| `apps/web/public/terras/globo/dados/camadas/*.geojson.gz` | camadas novas do globo |
| `apps/web/public/terras/globo/js/config.js` | `LAYER_REGISTRY`, `ASSUNTOS`, hints |
| `apps/web/public/terras/globo/dados/proveniencia.json` | origem de cada camada (script irmão `gerar-proveniencia-globo.mjs`) |
| `apps/web/app/mineraicao/cavas/` | página com as 5 coisas |
| `apps/web/app/mineraicao/cavas/[cava]/` | ficha + linha do tempo + exportação (pedido 25/09) |
| `apps/web/lib/cavas/` | área, 4 datas, tags, contexto do chat — lógica pura com testes ao lado |
| `apps/web/public/terras/globo/dados/cavas-timeline/` | thumbnails 256 px da linha do tempo (≤ ~300 KB/cava) |
| `.gitignore` | cache de imagem Sentinel (path medido na Fase 0) |
| `docs/06-fontes/FONTES.md` | fontes novas catalogadas |

## Limites medidos

| Limite | Valor (24/09) | Consequência no plano |
|---|---|---|
| Teto de asset | 25 MiB (folga intencional) | camada nova < 2 MiB gz |
| `apps/web/public/` | 91,76 MB (globo = 57,70) | só `.gz` entra; imagem nunca |
| GPU | RTX 3050, 4 GB | embedding e VLM 3B Q4 cabem; treino grande não |
| Disco `X:` | 65,7 GB livres | cache de ~15 GB cabe; medir na Fase 0 |
| Cena CBERS-4A WPM | BAND2 = 126,5 MiB; pancromática = 2,45 GB (medido 24/09) | recorte sai da cena na hora; cena crua só quando necessário |
| Neon | 94% (470/500 MB), Fase 4 pendente | nada de imagem em banco |
| Custo em produção | 0 (pipeline offline) | página não chama LLM nem satélite |

## O que NÃO fazer

1. **Não chamar de ilegal.** Nem no título, nem no hint do globo.
2. **Não treinar do zero** antes de medir a precisão (decisão 24/09).
3. **Não baixar Esri em massa** — termos de uso; cómputo é com Sentinel.
4. **Não pôr coleção ou imagem em props** de componente de cliente
   (o estrago de 35,5 MiB está no AGENTS § 5.1).
5. **Não publicar sem dupla verificação e revisão humana** (§ Barra).
6. **Não presumir que "fora do polígono = crime"**: conferir SIGMINE
   nacional, grau de precisão do recorte e fase do processo.
7. **Não commitar imagem, cache ou índice binário** — manifesto sim,
   recorte não; varrer dado pessoal antes de commitar dado coletado.
8. **Não chamar modelo por nuvem** (API da OpenAI, Meta, Alibaba/DashScope,
   qualquer "hosted"): imagem de satélite e candidato só saem deste PC se
   passarem pela régua do dono — roda tudo no Ollama local (decisão
   24/09).

## Estimativa e ordem

| Fase | Esforço | Depende de |
|---|---|---|
| 0 — sondagem | 1–2 dias | nada (pode começar hoje) |
| 1 — calibração | 2–3 dias | G0 |
| 2 — similaridade | 3–5 dias | Fase 1 |
| 3 — mudança no tempo | 1 semana | Fase 1 |
| 4 — varredura | 1–2 semanas | Fases 2 e 3 |
| 5 — publicação | 2–3 dias | Fase 4 |
| 5+ — painel, linha do tempo e exportação (pedido 25/09) | 1–2 dias | Fase 5 |
| 6 — rotina | 2 dias | Fase 5 |

**Total: ~4–6 semanas de agente.** MVP útil (Fases 0–3 em MG, com Δ das
7.090 minas) em ~2 semanas. A fila do dono continua mandando: este plano
entra como item **B4** do [ESTADO.md](../02-estado/ESTADO.md#fila-viva) —
a Fase 0, por ser só medição, pode correr em paralelo sem disputar deploy.

## Decisões registradas

- **24/09/2026 (dono):** similaridade primeiro, treino depois; calibrar em
  **MG primeiro** e só então o Brasil; base de imagem **Sentinel-2
  (histórico) + Esri (atual, verificação humana)**.
- **24/09/2026 (dono):** modelos **primários chineses — Chinese-CLIP +
  Qwen2.5-VL**; DINOv2/CLIP/SigLIP só como reserva técnica, e a troca
  volta ao dono. **Nada de API de nuvem de modelo**: pipeline 100% local,
  para que imagem e candidatos não saiam deste PC.
- **24/09/2026 (dono):** aproveitar **satélites brasileiros** — CBERS-4A
  (2 m) como imagem fina de conferência e Amazônia-1 como reforço; ambos
  do INPE, grátis e CC-BY. Sentinel-2 continua como série histórica.
- **24/09/2026:** modelos de origem EUA/China, licença MIT/Apache; não há
  encoder de visão aberto brasileiro — registro para não reabrir pergunta.
- **24/09/2026:** publicação exige dupla verificação (2 de 3 métodos) e
  revisão humana; palavra "ilegal" é vetada.
- **25/09/2026 (dono): treinar desde o início.** O dono mandou treinar
  bastante o modelo logo na Fase 1 para reduzir erro desde o começo —
  a ordem vira: **coletar volume grande (meta esticada: 10 mil por
  classe)** → **fine-tune do Chinese-CLIP na RTX 3050** → medir precisão
  no holdout → só então comparar com o zero-shot. A similaridade sem
  treino cai para **linha de base**, não para mais-valia. O piso do gate
  (precisão ≥ 70%) e a revisão humana continuam valendo. Troca de modelo
  primário (se precisar) continua voltando ao dono.
- **25/09/2026 (dono): painel de visualização completo.** Busca, filtros,
  tags, resumos e ficha com datas (início, ampliação, pico, encerramento),
  área em m²/km², minério do cadastro ANM, pesquisa minerária da região;
  **linha do tempo de imagens** com slider imagem por imagem; copiar/
  exportar (geolocalização, fotos, **PDF com fotos**, pacote para ANM ou
  Polícia Militar com links oficiais); **contexto por cava para o
  chatbot**. Detalhe na seção [Painel de visualização, linha do tempo e
  exportação](#painel-de-visualização-linha-do-tempo-e-exportação-pedido-do-dono-2509).
- **25/09/2026 (dono): sem novos subagentes.** O trabalho do Agente A
  (detector de nuvem) é retomado e terminado pela sessão principal.
- **28/09/2026 (dono): mais fases grandes no home-pc.** O home-pc (PC mais
  fraco) assume rede e código: coleta GO, Fase 3 (série Sentinel) e Fase
  5 (painel). Nesta máquina forte fica só o que exige GPU — treino fino,
  triagem VLM — mais o fechamento da coleta MG em curso. **Cada máquina
  tem cache e checkpoint próprios**; manifesto final une por hash, sem
  duplicar. Um escritor por checkpoint vale por máquina.

## Origem

Pedido do dono em 24/09/2026, no chat da sessão `/cp`. Medições do mesmo
dia no disco e na web. Sinalizado na
[PLANO-FILA-PROXIMA-SESSAO.md](../historico/planos/PLANO-FILA-PROXIMA-SESSAO.md) como item 10
e no [ESTADO.md](../02-estado/ESTADO.md#fila-viva) como B4.
