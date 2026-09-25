# PLANO — Rastreamento de cavas de mineração no globo 3D

> **Tipo:** PLANO
> **Domínio:** global
> **Última medição:** 2026-09-25
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
| M1 | Copernicus CDSE: cadastro grátis, cota, 1 cena S2 L2A de MG | ⛔ **login não passou (dono, 24/09)**; ✅ **alternativa sem conta medida:** Planetary Computer STAC + token SAS anônimos; cena `S2A_MSIL2A_20260924T131251_R138_T23KNU_20260924T205410`, thumbnail HTTP 200 (3.035.715 bytes) |
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

### Fase 2 — índice de similaridade, método B (3–5 dias)

- **Chinese-CLIP** (encoder de visão) via ONNX na GPU; vetor por recorte;
  índice em numpy ou FAISS CPU (estimativa: 10 mil vetores × 512 dim ≈ 20
  MB).
- Holdout 500 positivos / 500 negativos; limiar escolhido por **precisão
  ≥ 70%**; curva precisão×recall publicada com data.

Critério de pronto: número de precisão e recall medidos + revisão de 100
exemplos. **Se precisão < 70%:** gate de treino fino (LoRA na RTX 3050,
modelo pequeno) ou acionamento da reserva técnica (DINOv2/CLIP) — decisão
do dono por medição na mão, nunca automática.

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
| Monitor da Mineração (MapBiomas) | `transborda`, `lavra_fant`, `inconsiste` | shapefile na plataforma | CC-BY 4.0 | beta; errou no lançamento (03/12/2025); citar "MapBiomas - Monitor da Mineração, acessado em [data]" |
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

## Origem

Pedido do dono em 24/09/2026, no chat da sessão `/cp`. Medições do mesmo
dia no disco e na web. Sinalizado na
[PLANO-FILA-PROXIMA-SESSAO.md](../historico/planos/PLANO-FILA-PROXIMA-SESSAO.md) como item 10
e no [ESTADO.md](../02-estado/ESTADO.md#fila-viva) como B4.
