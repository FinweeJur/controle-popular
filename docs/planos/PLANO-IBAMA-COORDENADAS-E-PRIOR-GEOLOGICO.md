# Plano IBAMA coordenadas + prior geológico da mineração

> **Tipo:** PLANO
> **Domínio:** ambiental (mineração, treino de cavas, geografia)
> **Última medição:** 2026-10-13
> **Leitura estimada:** média (10–15 min)
> **Relacionados:** [PLANO-MAPEAMENTO-MINERACAO-ILEGAL.md](PLANO-MAPEAMENTO-MINERACAO-ILEGAL.md), [PLANO-GLOBO-CAVAS-MINERACAO.md](PLANO-GLOBO-CAVAS-MINERACAO.md), [MEDICOES-CAVAS-MINERACAO.md](MEDICOES-CAVAS-MINERACAO.md), [FONTES.md](../06-fontes/FONTES.md), [AGENTS.md](/AGENTS.md)
> **Palavras-chave:** ibama, auto de infracao, coordenada, multa, embargo, treino, positivo, geologia, cprm, sgb, sigmine, anm, prior, estratificacao, cava, mineracao ilegal

## Sumário

- [O que o dono pediu](#o-que-o-dono-pediu)
- [Fase 1 — coordenadas do IBAMA viram positivo de treino](#fase-1--coordenadas-do-ibama-viram-positivo-de-treino)
- [Fase 2 — prior geológico e geográfico](#fase-2--prior-geológico-e-geográfico)
- [Fase 3 — conserto da fila da coleta local](#fase-3--conserto-da-fila-da-coleta-local)
- [Regras editoriais e de dado](#regras-editoriais-e-de-dado)
- [Subagentes e ordem de execução](#subagentes-e-ordem-de-execução)
- [Decisões registradas](#decisões-registradas)
- [Origem](#origem)

## O que o dono pediu

Dois pedidos em 13/10/2026, na mesma conversa:

1. **Multas ambientais de mineração ilegal como positivo de treino.** O
   autuado pelo IBAMA é ato oficial de mineração que a autoridade considerou
   irregular — exatamente a classe que o CNN de cavas deve aprender a achar.
   Hoje os positivos do treino vêm só de títulos ANM (mineração **legal**):
   7.656 alvos, medidos em 13/10, divididos em `CONCESSÃO DE LAVRA` 6.942,
   `LAVRA GARIMPEIRA` 375 e `REGISTRO DE EXTRAÇÃO` 339
   (`scripts/.cache/cavas-calibracao/positivos-mg.json`).
2. **Prior geológico e geográfico.** Usar geografia e geologia para dizer
   **onde olhar primeiro**: serras, litologia, títulos de pesquisa mineral,
   estradas e rios organizam a varredura. Não é substituir o satélite; é
   escolher a ordem.

O resultado prático é o mesmo das duas frentes: **uma camada de suspeição**
que guia a coleta de recortes e a ordem de pontuação do modelo, sempre com
os fatores visíveis ao leitor.

## Fase 1 — coordenadas do IBAMA viram positivo de treino

### O que já existe (medido em 30/09/2026)

| Peça | Situação |
|---|---|
| Coletor de autos `scripts/coletar-ibama-autos.py` | baixa o ZIP (~122 MB) e grava `apps/web/data/ibama-autos-infracao.json` (11.734 autos; MG 375; com termo de mineração 11 em MG) |
| Embargos georreferenciados (ArcGIS Pamgia) | 91.702 Brasil · 4.692 MG · 78 MG com termo de mineração |
| Camada no globo `infracoes-embargos.geojson` | já ligada (910 KB) |

### O que falta: as coordenadas dos autos

O IBAMA publica **arquivo separado de coordenadas** (medido 13/10, portal de
dados abertos do IBAMA):

- `coordenada.csv` — latitude/longitude do local da infração, com chave
  `SEQ_AUTO_INFRACAO` para amarrar ao auto principal;
- `enquadramento` e `bioma` — auxiliares que ajudam a filtrar mineração.

### Etapas

1. **Coletor novo** `scripts/coletar-ibama-coordenadas.py`:
   - baixa `coordenada.csv` com `User-Agent` honesto e pausa por host;
   - cruza com os autos já coletados pela chave `SEQ_AUTO_INFRACAO`;
   - filtra `UF = MG` e mineração por termo no enquadramento/descrição
     (`garimpo`, `mineração`, `cava`, `extração de minério`, `rejeito`,
     `barragem`);
   - **descarta o campo de nome/CPF/CNPJ antes de gravar** (regra 5.2 do
     AGENTS: dado pessoal não entra no repositório);
   - grava cache em `scripts/.cache/cavas-calibracao/` e, se o volume
     permitir, um agregado datado em `apps/web/data/`.
2. **Medição de precisão:** contar quantos autos têm coordenada utilizável
   (dentro do bbox de MG, com precisão declarada quando houver). Coordenada
   de centroide municipal **não vira positivo** — entra como lacuna.
3. **Alimentar o treino:** os pontos aceitos viram positivo com fase nova
   `MULTA_IBAMA` (e `EMBARGO_IBAMA` quando o embargo tiver geometria),
   reutilizando o formato de `positivos-mg.json` (`processo`, `fase`,
   `centroide`, `bbox`, `area_ha`).
4. **Regra temporal:** a cena CBERS usada para o recorte precisa ser **depois
   da data do auto** — a cava tem de existir na foto. O coletor já ordena
   cenas por data; a comparação fica explícita no item do checkpoint.

### Critério de pronto

- Coletor versionado, `--dry-run` mostra contagens datadas;
- número de autos MG com mineração e coordenada aceita registrado aqui e em
  [FONTES.md](../06-fontes/FONTES.md);
- varredura de dado pessoal verde (`checar-dado-pessoal-em-dado.py`).

### Medições de 13/10/2026 (coletor pronto)

Coletor `scripts/coletar-ibama-coordenadas.py` executado no mesmo dia:

| Medida | Valor |
|---|---:|
| Autos no acervo do IBAMA | 711.986 |
| Autos de MG | 113.329 |
| Autos MG com coordenada válida | 14.751 (13%) |
| Autos MG com termo de mineração | 3.891 |
| Desses, com coordenada dentro do bbox de MG | **232** |
| Municípios cobertos | 74 (Mariana 20 · Itabirito 17 · Francisco Dumont 12) |
| JSON gerado | `scripts/.cache/cavas-calibracao/multas-ibama-mg.json` (232 linhas, 81 KB) |

Três fatos que mudam o uso:

- **94% dos MG+mineração não têm coordenada na fonte** (3.656 de 3.891) —
  é lacuna do IBAMA, não do filtro;
- 6 linhas da primeira versão tinham `SEQ_AUTO_INFRACAO` vazio (auto com
  número legado tipo `96DPWQ6C`): sem a chave não há junção, então o
  coletor as descarta — a contagem caiu de 238 para 232 por isso;
- a chave de junção é `SEQ_AUTO_INFRACAO` (o número do auto não casa entre
  os dois CSVs);
- o filtro de termo é largo (`mineral` sozinho casa 2.369) — o campo
  `termo_mineracao` ficou gravado em cada linha para calibrar sem
  reprocessar.


## Fase 2 — prior geológico e geográfico

### Ideia

A mineração ilegal não cai no mapa ao acaso. Ela concentra onde **existe
minério**, onde **há acesso** e onde **há conflito fundiário**. Cada fator
vira uma camada; a soma ponderada vira a **ordem de varredura**. O satélite
continua sendo o medidor; o prior só diz **por onde começar**.

### Fontes por fator (todas públicas)

| Fator | Fonte | O que dá |
|---|---|---|
| Litologia | CPRM/SGB — Geologia do Brasil (1:1M e 1:250k) | rochas; ferro em itabirito/canga (Quadrilátero Ferrífero, Espinhaço), ouro em rochas metavulcânicas, esmeraldas no Espinhaço setentrional |
| Potencial geoquímico | CPRM — geoquímica de sedimentos de córrego | anomalias de Au, Fe, Mn, elementis de terras raras |
| Interesse minerário formal | ANM/SIGMINE — títulos de **pesquisa mineral** e lavra | onde alguém já pediu, mesmo sem cava; é o "interesse demonstrado" que o dono citou |
| Acesso | IBGE — malha viária e relevo (SRTM) | distância a estrada e declive facilitam ou atrapalham |
| Água e conflito | ANA (outorgas, já coletado), CAR, UC (CNUC), TI (FUNAI), quilombo (INCRA) | sobreposição com proteção e área de conflito |
| Alerta de mudança | MapBiomas Alerta / DETER | desmatamento novo associado a mineração |

### Etapas

1. **Inventário e medição:** baixar amostras de cada fonte, medir volume e
   precisão em MG, registrar em [FONTES.md](../06-fontes/FONTES.md) antes de
   codificar o cruzamento.
2. **Camada de suspeição:** grade de 1 km sobre MG com escore por fator
   (0–1) e o escore total, gerado por script versionado — nunca número
   digitado à mão.
3. **Dois usos, sempre separados:**
   - **coleta:** estratificar positivos (títulos, multas) e **negativos duros**
     (canga natural sem título, que confunde o modelo);
   - **varredura:** ordenar as células que o CNN pontua, do escore mais
     alto ao mais baixo.
4. **Transparência:** o leitor vê os fatores, não só o escore. A página
   explica "por que olhar aqui primeiro" com as camadas individuais.

### Critério de pronto

- Script de suspeição versionado com pesos declarados no cabeçalho;
- medição datada de quanto da MG cobre cada camada;
- frase fixa na publicação: **o prior indica onde olhar; o achado é o ato
  oficial e a imagem, nunca o escore**.

## Fase 3 — conserto da fila da coleta local

Diagnóstico medido em 13/10/2026, durante a rodada local de `--limite 10`:

- A fila de positivos é ordenada por **id de cena em ordem alfabética**, que
  é ordem de data **crescente** — a coleta começa em **dezembro/2025 e
  janeiro/2026**, plena época de chuva em MG;
- a simulação dos 8 primeiros alvos da fila real deu **0 aceitos**: cenas
  rejeitadas por nuvem (`nuvem=1,00`) ou já coletadas (`dup=True`);
- a coleta andou ~40 minutos sem gravar um único recorte.

### Etapas

1. Ordenar a fila por id de cena em **ordem decrescente** (cenas recentes e
   de estiagem primeiro), mantendo a agrupação por cena.
2. **Pular alvos já coletados** (chave `processo`+`fase` no checkpoint) —
   1.994 de 7.656 já estão, e cada um custa ~45 s de leitura descartada.
3. Registrar a medição da fila antes e depois no cabeçalho do coletor.

### Critério de pronto

- Rodada local de `--limite 10` grava os 10 recortes em menos de 1 hora;
- medição anotada em [MEDICOES-CAVAS-MINERACAO.md](MEDICOES-CAVAS-MINERACAO.md).

### Medições de 13/10/2026 (conserto aplicado)

- Fila reordenada: os 6 primeiros alvos passaram a apontar para a cena
  `CBERS_4A_WPM_20260924` (estiagem), antes eram cenas de dez/2025;
- alvos já coletados pulados na montagem da fila: **1.998**;
- primeira rodada depois do conserto: **+7 recortes em ~10 minutos**
  (checkpoint 5.120 → 5.127), contra 0 recortes em 40 minutos antes.


## Regras editoriais e de dado

1. **Auto de infração é ato oficial, não sentença.** Publicamos o ato e o
   que ele diz; a palavra "ilegal" é da autoridade, não do portal
   (regra do [PLANO-MAPEAMENTO-MINERACAO-ILEGAL.md](PLANO-MAPEAMENTO-MINERACAO-ILEGAL.md)).
2. **Sem titular de pessoa física:** autuado, CPF e CNPJ não entram no
   repositório, no site nem nos prompts de IA.
3. **Piso não é total.** Coordenada ausente ou municipal vira lacuna
   declarada, nunca ponto fabricado.
4. **Nunca somar bases diferentes** (autos IBAMA × embargos FEAM × títulos
   ANM): cada linha guarda a origem.
5. **Modelo rotulado:** qualquer escore de suspeição publicado traz data,
   pesos e a frase de que não é veredito.

## Subagentes e ordem de execução

| Frente | Agente | Entrega |
|---|---|---|
| 1. Coordenadas IBAMA | subagente A | coletor `coletar-ibama-coordenadas.py`, medição MG/mineração/precisão, agregado datado |
| 2. Prior geológico | subagente B | inventário de fontes com medição em MG e esqueleto do script de suspeição |
| 3. Fila da coleta | esta sessão | conserto da ordem + pular já coletados + rodada de prova |

Ordem: as três frentes correm em paralelo. Só a frente 3 mexe no coletor de
cavas; as outras escrevem em arquivos próprios.

## Decisões registradas

- **Dono, 13/10/2026:** seguir com coletor de multas do IBAMA e com o prior
  geológico; usar subagentes para acelerar.
- **Dono, 13/10/2026:** a VM do Azure foi reprovada nesta rodada (ver
  [MEDICOES-CAVAS-MINERACAO.md](MEDICOES-CAVAS-MINERACAO.md)); a coleta
  segue no `home-pc`.
- **Agente, 13/10/2026:** fila da coleta corrigida para ordem decrescente e
  com salto de alvos já coletados — medição do defeito no cabeçalho da
  Fase 3.

## Origem

- Pedido do dono em 13/10/2026 (conversa sobre multas ambientais e uso de
  geologia/geografia para priorizar a busca);
- base: [PLANO-MAPEAMENTO-MINERACAO-ILEGAL.md](PLANO-MAPEAMENTO-MINERACAO-ILEGAL.md)
  (fontes oficiais de ilegalidade) e as medições de 13/10 em
  [MEDICOES-CAVAS-MINERACAO.md](MEDICOES-CAVAS-MINERACAO.md).
