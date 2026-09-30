# Plano de mapeamento da mineração ilegal

> **Tipo:** PLANO
> **Domínio:** global (mineração + território + ambiente)
> **Última medição:** 2026-09-30
> **Leitura estimada:** média (10–15 min)
> **Relacionados:** [PLANO-GLOBO-CAVAS-MINERACAO.md](PLANO-GLOBO-CAVAS-MINERACAO.md), [FONTES.md](../06-fontes/FONTES.md), [PRODUTO.md](../01-produto/PRODUTO.md), [AGENTS.md](/AGENTS.md)
> **Palavras-chave:** mineracao ilegal, garimpo, sem cadastro anm, sigmine, mapbiomas, terras indigenas, unidades conservacao, quilombo, embargo, ibama, icmbio, feam, cavas, evidencia, globo, gate

## Sumário

- [O que o dev pediu](#o-que-o-dev-pediu)
- [O problema editorial: "ilegal" é veredito, evidência não é](#o-problema-editorial-ilegal-é-veredito-evidência-não-é)
- [O que já existe (medido em 30/09/2026)](#o-que-já-existe-medido-em-30092026)
- [Fontes por ordem de prioridade](#fontes-por-ordem-de-prioridade)
- [Fases de execução](#fases-de-execução)
- [Regras editoriais específicas](#regras-editoriais-específicas)
- [Riscos e o que NÃO fazer](#riscos-e-o-que-não-fazer)
- [Decisões registradas](#decisões-registradas)
- [Origem](#origem)

## O que o dev pediu

Pedido do dev de 29/09/2026, dentro da frente de memória: **"depois
continuar com plano de mapeamento da mineração ilegal"**. Este documento é
esse plano.

A pergunta do portal é sempre a mesma: **onde há mineração que o satélite
enxerga e o cadastro oficial não autoriza (ou proíbe)?** O que já está no ar
responde em parte — a página [`/mineracao/cavas`](../../apps/web/app/mineracao/cavas/page.tsx)
cruza uma amostra de 120 cavas com a poligonal da ANM e publica três
estados. Este plano leva a resposta do **amostra para o mapa inteiro de MG**,
com as fontes de proibição e proteção no mesmo lugar.

## O problema editorial: "ilegal" é veredito, evidência não é

O portal publica ato oficial e dado público. **Dizer "ilegal" é julgar**, e a
julgadora é a autoridade — o portal aponta, a autoridade apura (regra da
[AGENTS.md § 7](/AGENTS.md)). A página nova, por isso, não usa a palavra
como adjetivo do portal; ela publica **cinco estados de evidência**, cada um
com o que prova e o que não prova:

| Estado | O que é (dado) | O que prova | O que NÃO prova |
|---|---|---|---|
| `sem_cadastro_anm` | centroide da mineração detectada fora de todo polígono da ANM | a ANM não tem cadastro naquele lugar | que não exista processo (o desenho poligonal tem folga) |
| `em_unidade_conservacao` | dentro de polígono de UC (CNUC) | área protegida federal, estadual ou municipal | que a mineração esteja em operação hoje |
| `em_terra_indigena` | dentro de polígono de TI (FUNAI) | área de terra indígena demarcada | que haja garimpo em curso (pode ser área vizinha da borda) |
| `em_territorio_quilombola` | dentro de polígono quilombola (INCRA) | território titulado/protegido | a autoria ou a data da atividade |
| `com_embargo_ibama` | processo do IBAMA com termo de mineração | ato de fiscalização oficial | o desfecho do processo |

Cada ficha traz **fonte, data da coleta e link direto para a fonte**
(regra das seis qualidades, [AGENTS.md § 8](/AGENTS.md)), e a frase fixa:

> Receber sinal não é ilícito. É o convite para conferir na fonte — a
> apuração é da autoridade.

Se uma fonte não responde, o estado não aparece: **lacuna é informação**
([AGENTS.md § 7](/AGENTS.md)).

## O que já existe (medido em 30/09/2026)

Medição reproduzível: `python scripts/etl/cavas/medir-evidencias-mg.py`
(ray casting puro — **números são piso, não total**: centroide fora não
conta; o método vai junto do número na página).

### Camadas do globo já versionadas (MG)

| Camada | Polígonos | Evidência medida em 30/09 |
|---|---:|---|
| `mineracao-sem-cadastro.geojson` (mineração fora da ANM) | 3.869 | 263 dentro de UC · 0 em TI · 0 em quilombo |
| `cavas-monitoradas.geojson` (cavas, janela ativa) | 3.799 | 431 dentro de UC · 18 em quilombo · 0 em TI |
| `terras-indigenas.geojson` (FUNAI) | 16 | camada MG — cobertura parcial a ampliar |
| `unidades-conservacao.geojson` (CNUC) | 387 | todas com município (MG) |
| `territorios-quilombolas.geojson` (INCRA) | 27 | camada MG — cobertura parcial a ampliar |
| `infracoes-embargos.geojson` (IBAMA, acervo do globo) | — | 910 KB, já ligada no globo |

### IBAMA — autos de infração (dados abertos, atualizados em 17/09/2026)

| Medida | Valor |
|---|---:|
| Autos no acervo (`ibama-autos-infracao.json`) | 11.734 |
| Autos de MG | 375 |
| Autos com termo de mineração/garimpo/rejeito no texto | 289 (Brasil) · **11 em MG** |

⚠️ **11 em MG é pouco, e é informação.** Mineração em MG é fiscalizada em
boa parte pela **FEAM** (órgão estadual) — que ainda não tem coletor aqui.
Ver Fase B.

### O que a página de cavas já publica (Fase 3 do plano de cavas)

- Amostra fixa e datada de **120 cavas** (semente 42), com os três estados
  `em_operacao` / `indicio_processual` / `sem_cadastro_anm`
  (`scripts/etl/cavas/fase3-mineracao-mg.py`);
- série 1985→2024 do Monitor da Mineração a 30 m (`cavas-serie-mineracao-mg.json`);
- gate do Chinese-CLIP v2 medido 28/09 (precisão 0,914 no holdout de 88
  negativos); **v3 treinado em 30/09 e PASSOU o gate de 0,70** —
  sobreamostragem no limiar 0,69 com precisão 0,721 em holdout de 794
  ([PLANO-GLOBO-CAVAS-MINERACAO.md](PLANO-GLOBO-CAVAS-MINERACAO.md),
  medições de 30/09).

## Fontes por ordem de prioridade

Ordem de preferência do dev (29/09/2026): movimentos sociais, entidades
acadêmicas, páginas oficiais — e **para evidência de ilegalidade a fonte é
sempre oficial** (ato público é o que sustenta a ficha). Wikipédia, quando
existir, entra só como ponte terciária, nunca no campo `fonte`.

| Fonte | O que dá | Situação |
|---|---|---|
| ANM/SIGMINE + Monitor MapBiomas | poligonal de processos e detecção de mineração | **coletado** (Fase 1 do plano de cavas) |
| CNUC (ICMBio) | unidades de conservação | **camada no globo** (387 MG) |
| FUNAI | terras indígenas | **camada no globo** (16 polígonos MG; +4 pontos medidos 30/09 para ampliar) |
| INCRA | territórios quilombolas | **camada no globo** (27 MG; WFS atual com 23 em 30/09) |
| IBAMA dados abertos | autos de infração/embargos | **coletado** (11.734; 11 de MG com mineração) |
| **FEAM (MG)** | autos de embargo e infração estaduais | **coletado 30/09 via painel do Sisema** — 583.644 autos (agregado); sem campo de tipo, não isola mineração |
| ICMBio | autos de infração e embargos em UC federais | **medido 30/09:** 41.963 autos (1.483 MG) e 14.719 embargos (854 MG) — xlsx + WFS |
| ANM (portarias de suspensão de lavra) | ato de suspensão por processo | **medido 30/09:** só no DOU; contagem automática exige chave de API (cadastro humano) |
| MPF/TJMG | ações e TACs com mineração | fora desta fase; biblioteca já existe em outra frente |

## Fases de execução

### Fase A — cruzamento offline de MG (0,5 dia)

- Gerar `apps/web/data/cavas-evidencias-mg.json`: uma linha por polígono de
  mineração com **agregados** dos cinco estados, mantendo o método declarado
  (centroide, ray casting) e a data de cada camada.
- Varredura de dado pessoal antes do commit (`checar-dado-pessoal-em-dado.py`);
  os autos do IBAMA saem **sem o campo de nome** (o script já o exclui).
- Critério de pronto: script versionado, números batem com a medição de
  cima, CPF scan verde.

**Fase A cumprida em 30/09/2026.** Script
`scripts/etl/cavas/gerar-evidencias-mg.py` → `apps/web/data/cavas-evidencias-mg.json`
(2,0 MB, 7.668 linhas, separador compacto). Números batem com a medição
de cima: sem-cadastro 3.869 (UC 263 · TI 0 · quilombo 0) e
cavas-monitoradas 3.799 (UC 431 · TI 0 · quilombo 18). Cada linha traz
`municipio` (centroide contra os 853 polígonos de MG), `ano`, `area_ha`,
`camada` e os **cinco estados**. CPF scan verde (315 arquivos de dado).

⚠️ **Limite medido do estado de embargo:** o ArcGIS da Pamgia devolveu
**geometria para só 43 dos 403** embargos de MG com termo de mineração —
sem geometria não há teste de centroide. Nenhum centroide de mineração
caiu dentro de embargo (piso **0**), e a ficha precisa declarar isso;
não é "não há embargo em MG" (são 4.692 no estado). Regra "nunca somar
bases diferentes" vale aqui: as duas camadas de mineração compartilham
193 ids, por isso a linha guarda `camada`.

### Fase B — fechar as fontes que faltam (1–2 dias)

Para cada fonte: `robots.txt`, endpoint, contagem em MG, licença, armadilha
— tudo registrado em [FONTES.md](../06-fontes/FONTES.md). Na ordem:

1. **FEAM/MG**: autos de embargo ambiental de MG (o que pega mineração
   estadual — espelha os coletores já feitos de RO, MT, PA, SP);
2. **ICMBio**: autos em UC federais (cruza com as 431 evidências em UC);
3. **ANM**: portarias de suspensão de lavra (DOU/portal da ANM);
4. ampliar as camadas de TI (16) e quilombo (27) se houver fonte mais
   completa — hoje são coberturas parciais, e isso fica escrito.

Critério de pronto: cada fonte com contagem datada em FONTES.md, ou com o
motivo de não ter dado registrado.

**Status medido 30/09/2026** (seção
[FONTES, Fase B](../06-fontes/FONTES.md#embargos-do-ibama-georreferenciados-feam-e-ide-mg--fase-b-3009)):

- **Item 1 — FEAM fechado com coletor:** sem dado aberto bulk (`dados.mg.gov.br`
  com 0 de "auto de infração" e 0 de "embargo"; SIAM só busca por
  número/CPF/nome, sem listagem). Ganho de caminho em dois lugares: (a) o IBAMA
  federal tem embargo georreferenciado **atualizado diariamente** — **91.702 no
  Brasil, 4.692 em MG, 78 em MG com termo de mineração** (ArcGIS Pamgia); (b) o
  **painel do Sisema** (Power BI público) publica os autos estaduais —
  **583.644 autos** (SEMAD 351.630 · IEF 232.013) em `sisema_autos_infracao.py`,
  com agregado versionado. A aba não tem campo de tipo de infração, então
  **não isola mineração** — serve ao acervo ambiental, não ao recorte de cava.
- **IDE-MG sondada:** 1.421 camadas, **nenhuma de embargo** — serve para
  áreas autorizadas FEAM, não para atos.
- **Item 2 — ICMBio fechado:** 41.963 autos (1.483 MG, 2008–2026) e
  14.719 embargos (854 MG, 2009–2026), **WFS da INDE == xlsx local**
  (dupla verificação exata); INDE pede `Crawl-delay: 30`.
- **Item 3 — ANM fechado com motivo:** sem ato de suspensão em dado
  aberto (15 diretórios da ANM varridos; metadados SIGMINE sem
  "suspensão"); DOU automatizado exige chave de API (403 medido) —
  cadastro humano, decisão do dev.
- **Item 4 — TI/quilombo medido:** FUNAI MG = 16 polígonos **+ 4 pontos
  ("Em Estudo", a fase mais vulnerável)** — ampliação sem fonte nova;
  INCRA `quilombolas_mg` = 23 (era 22), contagem nacional não respondeu
  (serviço lento); pendência Pimentel (27 publicados) segue.

**Fase B cumprida** — todos os quatro itens com contagem datada ou
motivo registrado em FONTES.md. Sobram decisões humanas: chave da API do
DOU, raspagem Liferay da FEAM e a pendência Pimentel do INCRA.

### Fase C — página `/mineracao/ilegal` (2 dias)

- As seis qualidades ([AGENTS.md § 8](/AGENTS.md)): busca tolerante a
  acento, filtros por estado/UF/município/ano, ordenação por coluna,
  cartões de topo com agregados medidos, CSV do que está filtrado (sep `;`,
  BOM UTF-8), impressão em CSS vetorial, tags no Seu Nonô.
- Descrição da página **nunca menor que `text-sm`** e, se passar de ~2
  linhas, `ResumoExpandivel` ([AGENTS.md § 5.10](/AGENTS.md)).
- Colunas de tabela: usa `TabelaEstatica` (o padrão das onze listas já no
  ar) — o agregado passa no build, **nunca o array inteiro**
  ([AGENTS.md § 5.1](/AGENTS.md)).
- Critério de pronto: suíte verde, `tsc` limpo, acessibilidade AA conferida.

### Fase D — camadas do globo (1 dia)

- GeoJSON `mineracao-em-uc`, `mineracao-em-quilombo` (e `em-ti` quando a
  camada crescer), gerados pelo mesmo cruzamento da Fase A — **mesmo número
  da página e do globo porque vem do mesmo arquivo** (o que já funciona em
  `/mineracao/cavas`).
- Camadas nascem desligadas (custo de download), com aviso de piso no
  rótulo.
- Critério de pronto: links da página abrem o globo com a camada acesa.

### Fase E — varrer com o gate (2–3 dias, depende do gate v3)

- Aplicar o modelo treinado (gate v3, com 1.920 negativos) na varredura de
  MG da Fase 4 do plano de cavas — o modelo **classifica candidato**, o
  estado de evidência vem das fontes oficiais, nunca do modelo.
- Revisão humana de 100 exemplos antes de publicar qualquer número novo
  (barra de publicação do plano de cavas).

### Fase F — rotina mensal (meio dia)

- Refazer FEAM/IBAMA/ICMBio e a série do Monitor; Telegram de 2–3 linhas ao
  fim ([AGENTS.md § 12](/AGENTS.md)); diff do mês na página.

## Regras editoriais específicas

1. **O número vem do dado; o estado vem da fonte oficial.** O modelo só
   embula candidato.
2. **Piso não é total.** Toda publicação do cruzamento traz o método
   (centroide) e a palavra "piso" na ficha de fonte.
3. **Nunca somar contagens de bases diferentes** (98.050 WFS × 54.890
   SIGMINE × 54.916 zip — [FONTES.md § cavas](../06-fontes/FONTES.md)).
4. **Sem titular de pessoa física** em evidência: processo e ato, não nome.
5. **A frase fixa** "receber sinal não é ilícito" acompanha todo agrupamento
   de evidência, em toda página e camada.

## Riscos e o que NÃO fazer

| Risco | O que fazer |
|---|---|
| Manchete "X mil mineracões ilegais" com piso de centroide | publicar sempre com método e data; nunca no título |
| 431 em UC parecer "431 garimpos" | estado é evidência de cruzamento, não de atividade |
| Camada TI com 16 polígonos (cobertura parcial) parecer total de MG | declaração de lacuna na ficha até a Fase B ampliar |
| Array inteiro como prop de componente (página gigante) | agregado no build + `TabelaEstatica` |
| FEAM sem coletor e o leitor lendo "IBAMA não fiscaliza" | dizer "coleta estadual ainda não faz parte deste mapeamento" |
| Portal rotulado como denúncia | a página convida a conferir; não substitui a autoridade |

## Decisões registradas

- **Dev, 29/09/2026:** seguir com este plano depois da memória; fontes não
  estatais só com citação e link; ordem movimentos → acadêmicas → oficiais;
  Wikipédia só terciária. Para este plano vale a exceção já praticada pela
  casa: **evidência de ilegalidade é sustentada por fonte oficial**, porque
  o sustento é ato público.
- **Dev, 25/09/2026 (plano de cavas, vale aqui):** 100% local para
  inferência; gate com revisão humana de 100 exemplos antes de publicar.
- **Agente, 30/09/2026:** rota sugerida `/mineracao/ilegal` (URL objetiva;
  a frase de cuidado mora no texto da página, não na URL).

## Origem

- Pedido do dev em 29/09/2026 (frente de memória das resistências);
- base: [PLANO-GLOBO-CAVAS-MINERACAO.md](PLANO-GLOBO-CAVAS-MINERACAO.md)
  (fases 0–6) e as medições de 30/09/2026 em
  `scripts/etl/cavas/medir-evidencias-mg.py`.
