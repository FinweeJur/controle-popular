# Handoff: alertas de território (indígena/quilombola × barragem/mineração/legislação)

> ## ✅ ENTREGUE em 15/08/2026 — e três números deste documento estavam VENCIDOS
>
> As quatro camadas foram registradas no `config.js` (commit `d1777b3`) e estão
> na tela, na seção "Território indígena, mineração e barragens". **Mas os
> textos propostos aqui não puderam ser colados como estavam**: recontados
> contra os arquivos servidos, os três números tinham mudado.
>
> | Camada | Este documento dizia | Medido em 15/08 |
> |---|---|---|
> | território × SIGMINE operação | 12 sobreposições, 5 TIs + 1 quilombola | **21**, 4 TIs + 6 quilombolas, 1.539 ha |
> | território × SIGMINE interesse | 195 sobreposições, 10 TIs + 13 quilombolas | **271**, 14 TIs + 18 quilombolas, 51.609 ha |
> | quilombola × mancha de inundação | **zero**, com `vazia: true` | **6 sobreposições em 3 territórios** |
>
> ⚠️ **A terceira linha é a que importa.** Colar o texto proposto teria
> afirmado na tela, com cara de medição, que nenhum território quilombola está
> sob mancha de inundação de barragem. O dado diz o contrário: **AMAROS** e
> **MACHADINHO** estão sob barragens da Kinross em Paracatu, e **SÃO SEBASTIÃO**
> sob três da Salitre Fertilizantes em Serra do Salitre (Do Sabão I, Do Sabão II
> e Do Jacó) — a maior atingindo 934,9 ha do território. As cinco estão com
> plano de emergência **"em análise"** na FEAM.
>
> **Por que mudou:** entre 13/08 e 15/08 os territórios quilombolas do INCRA que
> faltavam foram ingeridos, e os alertas, recalculados sobre a base maior,
> deixaram de ser zero. Nada estava errado quando foi escrito — envelheceu em
> dois dias.
>
> **A lição, que vale para o próximo handoff:** documento que carrega texto de
> tela pronto tem prazo de validade curto, porque o dado por baixo continua se
> movendo. Quem colar daqui **reconta no arquivo antes**, sempre. O `aviso` da
> camada de mancha ganhou ainda uma proibição que este documento não previa:
> **não somar as áreas** — as três barragens de Serra do Salitre cobrem a mesma
> parte do território, e somá-las contaria o mesmo chão três vezes.
>
> A cor de `atos-area-protegida-municipios`, deixada como `0x??????` aqui,
> também não foi a proposta: medidos os 30 matizes em uso, o ~115° sugerido
> cairia a 10,2° do verde de "Minas em operação" — as duas camadas mais opostas
> do mapa quase da mesma cor. Ficou `0xeb8dec`. Ver a nota no `config.js`.

Este documento é para quem estiver com `apps/web/public/terras/globo/js/config.js`
e `js/ui/layerspanel.js` abertos — **eu não toquei em nenhum dos dois**, de
propósito: outra frente estava editando os dois arquivos ao vivo, noutro
worktree, no momento desta entrega (mesma regra que já valia para
`docs/HANDOFF-CAMADA-DINHEIRO.md`, que eu li como referência de formato antes
de escrever este). O que existe hoje são os arquivos `.geojson` prontos, os
scripts que os geraram (auditáveis, reproduzíveis) e o texto abaixo, dizendo
exatamente o que entra em cada lugar do `config.js`.

Leia `docs/FONTES-TERRITORIO-E-MINERACAO.md` primeiro se quiser o "por quê"
jurídico por trás de ZAS × raio de 8 km × mancha de inundação — este
documento cobre o "onde" no config e o que foi MEDIDO em cada cruzamento.

Pergunta original do dono do projeto: *"O raio de proximidade de áreas
quilombolas e indígenas está funcionando para além de barragens? E de áreas
de mineração? E de legislações que os afetem — por exemplo o PL que reduziu a
Chapada do Lagoão em Araçuaí?"* — resposta era NÃO nos três eixos até
2026-08-13. Este handoff fecha os três, com o resultado medido de cada um,
seja ele qual for.

---

## 1. Os quatro arquivos que já existem

```
apps/web/public/terras/globo/dados/camadas/alerta-quilombola-mancha.geojson
apps/web/public/terras/globo/dados/camadas/alerta-territorio-sigmine-operacao.geojson
apps/web/public/terras/globo/dados/camadas/alerta-territorio-sigmine-interesse.geojson
apps/web/public/terras/globo/dados/camadas/atos-area-protegida-municipios.geojson
```

Mesmo formato `FeatureCollection` (`type`, `name`, `crs`, `features[]`, cada
feature com `properties` + `geometry`) das camadas já publicadas ali —
conferido contra `alerta-ti-mancha.geojson`, `sigmine-operacao.geojson` e
`cfem-municipios.geojson` antes de escrever cada script. Todos abaixo de
~210 KB — nenhum precisa de `scripts/comprimir-camadas-grandes.mjs`.

Os scripts que os geraram, todos em
`apps/web/public/terras/globo/scripts/`, rodáveis de novo a qualquer momento
(idempotentes, reescrevem o arquivo do zero):

```
calcular_alerta_quilombola_mancha.py       -> alerta-quilombola-mancha.geojson
calcular_alerta_territorio_mineracao.py    -> alerta-territorio-sigmine-{operacao,interesse}.geojson
calcular_alerta_area_protegida.py          -> atos-area-protegida-municipios.geojson
```

Cada um tem uma docstring longa explicando o método e por que ele existe —
leia o script antes de rodar de novo, principalmente
`calcular_alerta_area_protegida.py`, que tem uma tabela de classificação
manual (`_CLASSIFICACAO_MANUAL`) que PARA a execução se a base mudar e uma
norma nova bater na regex sem ter sido lida (de propósito: não publica linha
não lida).

Todos rodam com o Python do venv `etl/betim/.venv` (criado nesta sessão —
tinha `psycopg` global mas faltava `shapely`; `pip install -r
etl/betim/requirements.txt` não inclui `shapely` porque só os scripts do
globo usam, não o ETL principal). Se o venv não existir na sua máquina:

```
cd etl/betim && python -m venv .venv && .venv/Scripts/python -m pip install psycopg[binary] python-dotenv shapely requests
```

`apps/web/.env.local` e `etl/betim/.env` (os dois gitignorados) precisam ter
`DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/controle_popular`
(mesma regra desta máquina: **nunca a Neon**) — copiados nesta sessão de
`C:/DevCoder/controle-popular/apps/web/.env.local` (só lido, nunca editado —
é outro worktree).

---

## 2. Correção do classificador — a Lei 726/2025 de Araçuaí achada e consertada

### O achado

A lei que o dono citou de memória (*"o PL que reduziu a Chapada do Lagoão"*)
**já estava coletada**, com fonte oficial:

```
atos_oficiais, id_municipio 3103405 (Araçuaí)
Lei Ordinária 726/2025, publicada 2025-05-27
ementa: "MODIFICA DISPOSIÇÕES DA LEI Nº 89 DE 19 DE DEZEMBRO DE 2007 QUE
        'CRIA A ÁREA DE PROTEÇÃO AMBIENTAL (APA) DA CHAPADA DO LAGOÃO E
        DEFINE O SEU ZONEAMENTO AMBIENTAL (ECOLÓGICO-ECONÔMICO) NO
        MUNICÍPIO DE ARAÇUAÍ-MG E DÁ OUTRAS PROVIDÊNCIAS.'"
link_fonte: https://sapl.aracuai.mg.leg.br/norma/429
temas (antes): ["habitacao_urbanismo"]   <- SÓ ISSO. Sem meio_ambiente.
```

Causa raiz: `etl/temas.py` (classificador de `atos_oficiais.temas`, por
palavra-chave/regex — mesmo módulo usado por câmaras e prefeituras) tinha
`zoneamento` como gatilho de `habitacao_urbanismo` (correto: "zoneamento" no
sentido de plano diretor urbano é mesmo Habitação/Urbanismo), mas
**nenhum** termo de área protegida (APA, unidade de conservação, RPPN,
parque, monumento natural, zoneamento AMBIENTAL) disparava
`meio_ambiente`. Uma norma que redesenha o zoneamento ecológico-econômico
de uma unidade de conservação ficava invisível para quem filtra por Meio
Ambiente.

### O conserto — regra, não linha

Adicionei ao padrão de `meio_ambiente` em `etl/temas.py` (união de
alternativas — regex só CRESCE, nunca perde nada que já batia):

```
área de proteção ambiental | \bapa\b | unidade(s) de conservação |
estação ecológica | parque (estadual|nacional|municipal) | monumento natural |
reserva particular do patrimônio natural | \brppn\b |
reserva (biológica|extrativista|ecológica) | refúgio de vida silvestre |
zoneamento (ambiental|ecológico[- ]econômico)
```

Generaliza a MESMA calibração que `etl/temas_ambientais.py` já usava pras
tags `unidade_conservacao`/`area_protecao_ambiental`/`rppn` de
`ambiental_legislacao` — este arquivo (`atos_oficiais`, câmaras/prefeituras)
só não tinha essas regras ainda.

### Impacto medido — ANTES de aplicar

Comparando o classificador ATUAL (recalculado, não o `temas` já gravado no
banco) contra a versão com a regra nova, sobre as 10.317 linhas de
`atos_oficiais` de hoje:

**24 linhas mudam**, todas GANHANDO `meio_ambiente` — nenhuma perde tema
nenhum (a regra só acrescenta alternativas). Em **4 municípios**:

| Município | Linhas que ganham `meio_ambiente` |
|---|---:|
| São Paulo/SP | 12 |
| Belo Horizonte/MG | 9 |
| Diamantina/MG | 2 |
| Araçuaí/MG | 1 (a própria Lei 726/2025) |

Não é "muitas linhas" (24 de 10.317 = 0,23%) — apliquei direto, sem pausa
para confirmação, como o pedido previa para mudança pequena.

### O script novo: `etl/apis/classificar_temas_atos_oficiais.py`

Não existia backfill para `atos_oficiais.temas` (só para `proposicoes` e
`contratos`, em `etl/temas_backfill.py`) — as normas novas são classificadas
no momento da coleta (`etl/prefeitura/legislacao.py` etc.), mas linhas já
coletadas ficam com a classificação antiga até alguém recalcular. Criei este
script no mesmo molde de `etl/apis/classificar_temas_ambientais.py`
(`--sondar` vs. gravação real, idempotente — recalcula tudo do zero a cada
rodada). **Já rodei e apliquei** (`python -m
etl.apis.classificar_temas_atos_oficiais`, sem `--sondar`):

```
100/10317 linha(s) com `temas` diferente do que já estava no banco
municípios afetados: Araçuaí, Belo Horizonte, Betim, Diamantina, São Paulo
temas GANHOS: Meio Ambiente 31, Educação 16, Cultura/Esporte/Lazer 11,
              Saúde 10, Economia/Desenvolvimento 9, Infraestrutura/Obras 9,
              Habitação/Urbanismo 8, Administração Pública 6,
              Mobilidade/Transporte 4
```

**Por que 100 aqui e 24 no isolamento acima**: o número de 24 isola só o
EFEITO DESTA REGRA NOVA (compara classificador atual × classificador com a
regra, os dois recalculados agora). O número de 100 é o recálculo completo
comparado ao que JÁ ESTAVA no banco — e o banco tinha linhas nunca
classificadas por outros motivos (histórico de coleta, não desta mudança).
Os 76 restantes (100 − 24) são limpeza geral que o recálculo trouxe de
graça, não scope creep desta tarefa: são a mesma regra ATUAL de `etl/temas.py`
(sem a mudança de área protegida) aplicada a linhas que nunca tinham sido
classificadas. Ambos os números estão registrados na docstring do script
para quem for auditar depois.

Confirmado no banco, depois de rodar:

```sql
select id_municipio, numero, temas, link_fonte from atos_oficiais
where ementa ilike '%CHAPADA DO LAGO%';
-- ('3103405', '726', ['habitacao_urbanismo', 'meio_ambiente'], 'https://sapl.aracuai.mg.leg.br/norma/429')
```

---

## 3. Alerta novo: normas que mexem em área protegida

### Cobertura e método

`atos_oficiais` tem legislação coletada de **6 municípios** hoje: Araçuaí,
Belo Horizonte, Betim, Diamantina, Itinga (todos MG) e São Paulo/SP. Uma
primeira varredura por palavra-chave (os mesmos termos de área protegida do
item 2) achou **26 linhas** cuja ementa MENCIONA uma área protegida.

Mencionar não é a mesma coisa que MUDAR o status da área — "Dá o nome de
Fulano ao Parque Municipal X" ou o regimento interno do conselho gestor de
um parque não criam, alteram, reduzem nem extinguem nada. Cada uma das 26
foi lida por inteiro e classificada à mão em
`scripts/calcular_alerta_area_protegida.py` (`_CLASSIFICACAO_MANUAL`, com o
motivo escrito ao lado de cada entrada — auditável, não é IA), em 4
categorias:

- **`cria`** — institui área protegida nova (11 normas).
- **`altera_area`** — amplia, reduz ou redefine limite/zoneamento de área já
  existente — inclui a Lei 726/2025 de Araçuaí (3 normas).
- **`processo_em_andamento`** — ainda NÃO mudou a área, mas abre caminho pra
  mudar (ex.: BH/Decreto 18.338/2023, grupo de trabalho "visando a
  ampliação" do Parque do Bairro Trevo — a ampliação de fato veio depois,
  no Decreto 18.489/2023, contada separado) — mesma lógica de
  "requerimento" × "concessão" do SIGMINE: risco futuro, não fato consumado
  (1 norma).
- **`administrativo`** — menciona a área mas não muda seu status: nome de
  logradouro dentro do parque, regimento de conselho gestor, concessão de
  serviço (10 normas). **Fora do alerta principal**, listado à parte em cada
  feição (`normas_administrativas_excluidas`) para quem quiser auditar a
  triagem.
- **`duplicata`** — 1 norma de Diamantina (Lei nº 2924/2004, cria a APA
  "Barragem de Extração") está gravada DUAS VEZES no banco, com `tipo`
  divergente ("Lei Orgânica" numa, "Lei Ordinária" noutra) e ementa quase
  idêntica (uma grafia "da extração", outra "de extração") — mesmo número,
  mesma data, mesma fonte. Achado de qualidade de dado na coleta SAPL de
  Diamantina, não corrigido aqui (fora do escopo desta tarefa) — só
  registrado, e excluída da contagem para não contar a norma 2×.

### Resultado medido

**Minas Gerais inteira: 8 normas** que criam ou alteram área protegida
(inclui o "processo em andamento"), em **3 dos 5 municípios de MG com
legislação coletada**:

| Município | cria | altera_area | processo_em_andamento | total |
|---|---:|---:|---:|---:|
| Belo Horizonte | 2 | 1 | 1 | 4 |
| Diamantina | 3 | 0 | 0 | 3 |
| Araçuaí | 0 | 1 | 0 | 1 |
| Betim | 0 | 0 | 0 | 0 |
| Itinga | 0 | 0 | 0 | 0 |

São Paulo/SP (fora de Minas, mas coletado pelo mesmo `atos_oficiais`): mais
7 normas (6 `cria`, 1 `altera_area`) — aparecem no relatório do script mas
**não entram no GeoJSON**, que é montado sobre a malha municipal de
`municipios-mg.geojson` (SP não tem polígono lá).

Cobertura declarada: **8 de 854 municípios de MG** têm legislação coletada
o bastante para este alerta poder dizer alguma coisa; ausência de norma
para um dos outros 846 não é "não existe" — é "ainda não coletamos a
legislação daquele município". Cada feição do GeoJSON carrega esse aviso em
`properties.aviso` e `properties.cobertura_da_camada`.

### O GeoJSON

`atos-area-protegida-municipios.geojson` — 3 features (Araçuaí, Belo
Horizonte, Diamantina), `Polygon` = malha municipal (mesma de
`municipios-mg.geojson`), `render: 'fill'` esperado. Cada feição carrega
`total_normas_area_protegida`, os totais por categoria, o array `normas`
(cada item com `tipo`, `numero`, `data_publicacao`, `ementa`, `categoria`,
`categoria_label`, `motivo_classificacao`, **`link_fonte`**) e
`normas_administrativas_excluidas` (mesma estrutura, para as excluídas).

Proposta de entrada em `LAYER_REGISTRY` (`config.js`):

```js
{
  id: 'atos-area-protegida-municipios',
  label: 'Normas que criam ou alteram área protegida',
  hint: '8 normas municipais (Araçuaí, Belo Horizonte, Diamantina) que criam, ampliam ou redefinem o zoneamento de uma área de proteção ambiental, parque ou monumento natural — inclui a Lei 726/2025 de Araçuaí, que modifica o zoneamento da APA da Chapada do Lagoão.',
  aviso: 'Cobre só 3 dos 854 municípios de MG (mais os 5 outros com legislação coletada — Betim e Itinga têm zero normas deste tipo, medido, não é lacuna de coleta). Ausência de um município aqui pode ser "não tem legislação sobre isso" OU "legislação ainda não coletada" — a lista de municípios com coleta ativa está em cada feição. Classificação de cada norma (cria/altera área vs. só administrativo) foi feita lendo a ementa completa à mão, registrada em scripts/calcular_alerta_area_protegida.py.',
  color: 0x??????,  /* proposto: hue ~115,4° — meio da maior lacuna livre do
                        círculo de matiz depois da leva "dinheiro" (102 lotes-vagos
                        -> 128,8 quilombolas = 26,8°), 13,4° de cada vizinha (>11,6°
                        de sobra). Cai num verde-lima que combina com "área
                        protegida/parque" por coincidência, não por escolha —
                        CONFIRA contra colors.css antes de fixar, mesmo método do
                        resto do arquivo. */
  on: false, render: 'fill', listavel: true,
  // SEM `regioes`: Araçuaí/Diamantina são Jequitinhonha, Belo Horizonte é
  // Metropolitana (nem está em REGIOES hoje) -- mesmo padrão de
  // 'cfem-municipios'.
},
```

E em `CAMADAS` (bloco `assunto`): sugiro um `assunto` novo,
`legislacao-ambiental` (`titulo: 'Legislação e área protegida'`) — não acho
que `territorio-mineracao` encaixa bem (esse é sobre risco de barragem/mina
sobre terra indígena/quilombola; isto é sobre o Legislativo municipal mexendo
em zoneamento ambiental, tema distinto o bastante para não misturar, mesmo
raciocínio que criou o assunto `dinheiro` no handoff anterior). Decisão de
quem estiver com `config.js` aberto — os dois caminhos funcionam.

---

## 4. Quilombola × mancha de inundação

Reusa a MESMA abordagem de `scripts/calcular_alerta_ti_mancha.py`
(`shapely.intersects()`/`intersection()` sobre geometria completa, bbox só
como pré-filtro O(1)), estendida a quilombola — script novo:
`scripts/calcular_alerta_quilombola_mancha.py`.

### Cobertura, e por que não é "quilombola de MG inteira"

Este projeto tem quilombola em DOIS arquivos regionais, nunca unificados
num arquivo estadual (diferente de `terras-indigenas.geojson`, que já é as
16 TIs de MG inteira): `territorios-quilombolas.geojson` (2 territórios,
bacia do Paraopeba) + `territorios-quilombolas-vales.geojson` (12
territórios, Vales) = **14 territórios** no total. O script lê os dois e
junta. **Não há confirmação de que isto é a totalidade de MG** — é o que
este projeto ingeriu para as duas regiões já onboardadas. Um território
quilombola fora dessas duas regiões não aparece.

### Resultado medido

**ZERO interseções reais**, nas 2.184 combinações possíveis (14 territórios
× 156 manchas válidas) — `alerta-quilombola-mancha.geojson` sai como
`FeatureCollection` vazia (159 bytes, `features: []`), mesmo padrão de
`alerta-ti-mancha.geojson` (`vazia: true` no `config.js`).

Mesma leitura que já valia para TI × mancha: **"zero hoje" não é "seguro
para sempre"** — a FEAM só publica mancha para 156 das 259 barragens de MG,
e este script não testou proximidade (só interseção real), então um
território a poucas centenas de metros de uma mancha — como a própria
Aldeia Katurama estava do lado indígena — não apareceria aqui mesmo estando
perto. E a ressalva de cobertura do item acima continua valendo com força
total: isto é "as 14 áreas quilombolas que este projeto já ingeriu (bacia +
Vales) não cruzam", não "quilombola de MG inteira está livre de barragem".
Sem uma ingestão estadual completa de território quilombola, não dá para
afirmar mais que isso.

Proposta de entrada em `LAYER_REGISTRY` (mesmo padrão de `alerta-ti-mancha`,
`vazia: true` e cor reaproveitada de `var(--danger)`):

```js
{
  id: 'alerta-quilombola-mancha',
  label: 'Território quilombola atingido por mancha de barragem',
  hint: 'Interseção de geometria de verdade entre os 14 territórios quilombolas já ingeridos neste projeto (bacia do Paraopeba + Vales) e as 156 manchas de inundação de barragem da FEAM. Hoje o resultado é zero.',
  aviso: '"Zero hoje" não é "seguro para sempre" (mesma ressalva de alerta-ti-mancha) — e esta camada cobre só 14 territórios quilombolas de duas regiões, não a totalidade de MG: não existe ainda um arquivo estadual único de território quilombola neste projeto.',
  color: 0xfb8a82, /* var(--danger) — mesma regra de alerta-ti-mancha */
  on: false, render: 'fill', listavel: true, vazia: true,
},
```

---

## 5. Território (indígena + quilombola) × mineração (SIGMINE)

Script novo: `scripts/calcular_alerta_territorio_mineracao.py`. Cruza os 30
territórios de entrada (16 TIs + 14 quilombolas, mesma malha completa do
item 4 — nunca bbox) com os DOIS lotes do SIGMINE **separadamente**, nunca
somados (docs/FONTES-TERRITORIO-E-MINERACAO.md §2 e §4: overlap com
OPERAÇÃO é fato consumado, overlap com INTERESSE é risco futuro/papel
protocolado — misturar os dois apagaria a distinção jurídica).

Malha COMPLETA nos dois lados: nenhum bbox como resposta final — o
documento de pesquisa já tinha registrado o falso positivo de bbox nas 6
barragens de São Joaquim de Bicas que pareciam cruzar a Aldeia Katurama e
ficavam, na conta real, a 450–650 m de distância. Este script não repete
esse erro: toda linha do resultado passou por `intersects()`/`intersection()`
de verdade.

### `sigmine-operacao` (fato consumado) — 12 interseções reais

| Território | Tipo | Empresa | Substância | Fase | Área da interseção |
|---|---|---|---|---|---:|
| Krenak de Sete Salões | TI (Delimitada) | Scherrer & Merklein Ind. e Com. Ltda. | Água mineral | Concessão de Lavra | 50,06 ha |
| Krenak de Sete Salões | TI (Delimitada) | GEOMETA LTDA | Minério de berílio | Concessão de Lavra | 0,35 ha |
| Xacriabá | TI (Delimitada) | ICIL Ind. e Com. Itacarambi S/A | Calcário | Concessão de Lavra | 84,07 ha |
| Xacriabá | TI (Delimitada) | Mineração Peruaçu Ltda | Manganês | Concessão de Lavra | 218,82 ha |
| Xacriabá | TI (Delimitada) | A.R.G. S.A. | Calcário dolomítico | Licenciamento | 5,16 ha |
| Xacriabá | TI (Delimitada) | MINAVE Comércio e Serviços Ltda. | Calcário | Licenciamento | 4,52 ha |
| Xacriabá | TI (Delimitada) | SERRAN Ind. e Com. Ltda | Areia | Licenciamento | 20,16 ha |
| Caxixé | TI (Delimitada) | SLATE BRAZIL Exportação Ltda | Areia | Licenciamento | 9,00 ha |
| Caxixé | TI (Delimitada) | AJM Mineração Ltda | Areia | Concessão de Lavra | 0,36 ha |
| Aldeia Escola Floresta | TI (Regularizada) | CERAMICA SANTA CLARA LTDA | Argila | Licenciamento | 3,03 ha |
| território quilombola #5 (Vales) | Quilombola | GRANSENA Exportação e Comércio Ltda | Granito | Concessão de Lavra | 256,73 ha |
| território quilombola #5 (Vales) | Quilombola | GRANSENA Exportação e Comércio Ltda | Granito | Concessão de Lavra | 551,27 ha |

**5 terras indígenas** (de 16) e **1 território quilombola** (de 14) têm
lavra EM OPERAÇÃO sobreposta hoje — 807,5 ha somados de área de interseção
só nos dois polígonos de granito sobre o território quilombola #5. Isto é
fato consumado, não risco: há extração autorizada de verdade acontecendo
dentro do perímetro de terras com direito originário/titulação.

`território quilombola #5 (Vales)` é o 6º território (índice 5, contagem
zero-based) de `territorios-quilombolas-vales.geojson` — o arquivo de
origem não carrega nome/etnia/município nas `properties` (só `area_ha`),
então o alerta não tem como nomear o território melhor do que isso; ver
`territorio_arquivo_origem`/`territorio_indice_origem` na feição de saída
para quem for abrir o arquivo de origem e conferir qual é.

### `sigmine-interesse` (risco futuro) — 195 interseções reais

Muito mais espalhado: **quase todos os territórios têm alguma sobreposição**
com processo de interesse minerário (requerimento de pesquisa/lavra,
disponibilidade) — 13 dos 14 territórios quilombolas e 10 das 16 terras
indígenas. Os mais expostos:

| Território | Interseções |
|---|---:|
| território quilombola #5 (Vales) | 45 |
| Krenak de Sete Salões | 32 |
| Caxixó | 18 |
| Xacriabá | 15 |
| território quilombola #2 (Vales) | 14 |

Por fase: 134 são `AUTORIZAÇÃO DE PESQUISA` (a mais preliminar — "pesquisa
autorizada", não pedido de extrair), 20 `REQUERIMENTO DE PESQUISA`, 16
`DISPONIBILIDADE`, 12 `REQUERIMENTO DE LAVRA` (já é pedido pra extrair),
resto menor. **Nenhuma linha aqui é mina** — é pressão/interesse futuro
sobre o território, e a maioria (154/195) nem chegou a pedir lavra ainda.

### Os GeoJSONs

`alerta-territorio-sigmine-operacao.geojson` (12 features) e
`alerta-territorio-sigmine-interesse.geojson` (195 features) — mesma
estrutura de `alerta-ti-mancha.geojson` (uma feição por par
território×processo que realmente se sobrepõe, geometria = a INTERSEÇÃO
recortada, não o território nem o polígono SIGMINE inteiros). Propriedades:
`territorio_tipo` (`terra_indigena`/`quilombola`), `territorio_nome`,
`territorio_etnia`, `territorio_fase`, `territorio_municipio` (só para TI —
`null` para quilombola, ver nota acima), `sigmine_fonte`
(`operacao`/`interesse`), `sigmine_processo`, `sigmine_nome`, `sigmine_subs`,
`sigmine_fase`, `sigmine_uso`, `area_intersecao_ha`.

Proposta de entrada em `LAYER_REGISTRY`:

```js
{
  id: 'alerta-territorio-sigmine-operacao',
  label: 'Terra indígena/quilombola atingida por mina em operação',
  hint: '12 interseções reais entre terra indígena/quilombola e lavra EM OPERAÇÃO (SIGMINE) — 5 terras indígenas (Krenak de Sete Salões, Xacriabá, Caxixé, Aldeia Escola Floresta) e 1 território quilombola. Interseção de geometria de verdade, malha completa, não bbox.',
  aviso: 'Isto é FATO CONSUMADO: extração autorizada de verdade sobreposta ao território. Para processo ainda não autorizado a extrair, ver "Terra indígena/quilombola sob interesse minerário" — as duas camadas NUNCA devem ser somadas, são categorias jurídicas diferentes.',
  color: 0xfb8a82, /* var(--danger) — mesma regra semântica de alerta-ti-mancha: risco calculado sobre camadas que já existem, fato consumado, não uma fonte de dado nova */
  on: false, render: 'fill', listavel: true,
},
{
  id: 'alerta-territorio-sigmine-interesse',
  label: 'Terra indígena/quilombola sob interesse minerário',
  hint: '195 interseções reais entre terra indígena/quilombola e processo de INTERESSE minerário (requerimento de pesquisa/lavra, disponibilidade — não é mina). 10 de 16 terras indígenas e 13 de 14 territórios quilombolas têm alguma sobreposição.',
  aviso: 'Isto NÃO é extração em curso — é papel protocolado na ANM, risco/pressão futura. 134 das 195 nem chegaram a pedir lavra (são só "autorização de pesquisa"). Para extração já autorizada, ver "atingida por mina em operação".',
  color: 0xe2a138, /* var(--caution) — mesmo âmbar de checagem-g0: "atenção, ainda não é fato consumado" -- CONFIRA antes de fixar, mesmo método do resto do arquivo */
  on: false, render: 'fill', listavel: true,
},
```

---

## 5b. Entradas em `CAMADAS` (bloco de `assunto`, para o painel)

As três camadas do item 4 e 5 encaixam no `assunto: 'territorio-mineracao'`
que já existe (mesmo grupo de `terras-indigenas`/`alerta-ti-mancha`/
`sigmine-operacao`/`sigmine-interesse`) — não precisa de `assunto` novo,
diferente da camada de área protegida do item 3:

```js
{
  id: 'alerta-quilombola-mancha', assunto: 'territorio-mineracao',
  label: 'Território quilombola atingido por mancha de barragem',
  hint: 'Interseção de geometria de verdade entre os 14 territórios quilombolas ingeridos (bacia do Paraopeba + Vales) e as 156 manchas de inundação da FEAM. Resultado hoje: zero.',
  aviso: '"Zero hoje" não é "seguro para sempre" — e cobre só 14 territórios de duas regiões, não MG inteira.',
  fontes: ['alerta-quilombola-mancha'],
},
{
  id: 'alerta-territorio-sigmine-operacao', assunto: 'territorio-mineracao',
  label: 'Terra indígena/quilombola atingida por mina em operação',
  hint: '12 interseções reais — 5 terras indígenas e 1 território quilombola com lavra JÁ EM OPERAÇÃO sobreposta.',
  aviso: 'Fato consumado, nunca somar com o "interesse minerário" (categoria jurídica diferente).',
  fontes: ['alerta-territorio-sigmine-operacao'],
},
{
  id: 'alerta-territorio-sigmine-interesse', assunto: 'territorio-mineracao',
  label: 'Terra indígena/quilombola sob interesse minerário',
  hint: '195 interseções reais — 10 terras indígenas e 13 territórios quilombolas com algum processo de interesse (não é mina) sobreposto.',
  aviso: 'Papel protocolado na ANM, não extração em curso. Para extração de verdade, ver "atingida por mina em operação".',
  fontes: ['alerta-territorio-sigmine-interesse'],
},
```

E a do item 3, se `legislacao-ambiental` virar o `assunto` escolhido:

```js
{
  id: 'atos-area-protegida-municipios', assunto: 'legislacao-ambiental',
  label: 'Normas que criam ou alteram área protegida',
  hint: '8 normas municipais em MG (Araçuaí, Belo Horizonte, Diamantina) que criam, ampliam ou redefinem área de proteção ambiental, parque ou monumento natural.',
  aviso: 'Cobre só municípios com legislação já coletada — 3 de 854 têm alguma norma deste tipo, mais 2 (Betim, Itinga) medidos em zero.',
  fontes: ['atos-area-protegida-municipios'],
},
```

---

## 6. Resumo para quem só quer os números

| Alerta | Resultado medido | Cobertura |
|---|---|---|
| TI × mancha de inundação (já existia) | 0 interseções reais | 16 TIs × 156 manchas (de 259 barragens) |
| Quilombola × mancha de inundação (novo) | **0 interseções reais** | 14 territórios (2 regiões) × 156 manchas |
| TI + quilombola × SIGMINE operação (novo) | **12 interseções reais** — 5 TIs + 1 quilombola | 30 territórios × 7.090 polígonos |
| TI + quilombola × SIGMINE interesse (novo) | **195 interseções reais** — 10 TIs + 13 quilombolas | 30 territórios × 47.830 polígonos |
| Normas que mexem em área protegida (novo) | **8 normas em MG** (3 municípios de 5 com coleta) | atos_oficiais, 6 municípios coletados |
| Classificador `meio_ambiente` de `atos_oficiais` | 24 linhas corrigidas (regra), 100 no recálculo completo | 10.317 atos oficiais, 6 municípios |

O "raio de 8 km" da FUNAI (empreendimento pontual → oitiva obrigatória,
Portaria Interministerial 60/2015) continua **não construído** — é o item 5
da seção "Ordem sugerida" de `docs/FONTES-TERRITORIO-E-MINERACAO.md`,
diferente do que este handoff entrega (que é sobreposição REAL, não raio de
proximidade). Fica como lacuna declarada para a próxima rodada.
