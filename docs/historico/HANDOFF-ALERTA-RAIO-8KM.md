# Handoff: o raio de 8 km × SIGMINE — a lacuna de método que faltava

Este documento é para quem estiver com `apps/web/public/terras/globo/js/config.js`
aberto — **eu não toquei nesse arquivo nem em nada dentro de `js/`**, de
propósito: o dono estava editando `config.js` ao vivo no momento desta entrega
(mesma regra de `docs/HANDOFF-ALERTAS-TERRITORIO.md`, que eu li inteiro como
referência de formato antes de escrever este). O que existe agora são os dois
`.geojson` prontos, o script que os gerou, a proveniência registrada, e o texto
abaixo dizendo exatamente o que colar em cada um dos dois registros do
`config.js`.

Fecha o item 5 da "Ordem sugerida" de `docs/FONTES-TERRITORIO-E-MINERACAO.md` —
a **única lacuna de MÉTODO** que o handoff de alertas deixou declarada em aberto
(§6, último parágrafo: *"O raio de 8 km da FUNAI continua não construído"*).

---

## 0. Por que isto não é "mais um alerta"

Os três alertas que já existem (`alerta-ti-mancha`, `alerta-quilombola-mancha`,
`alerta-territorio-sigmine-*`) só sabem responder **"a terra está DENTRO de
quê"** — interseção real de geometria, sem nenhuma noção de proximidade. E o
próprio projeto já registrou o que essa cegueira custa: as 6 barragens que
pareciam cruzar a **Aldeia Katurama** no teste por bbox estavam, na conta de
verdade, a **450–650 m** da borda da TI. Fora da interseção. Dentro de qualquer
faixa de proteção que se queira desenhar.

Este é o primeiro alerta do projeto que mede **proximidade** — e mede com a
faixa que a norma define, não com um círculo inventado por nós.

O que ele muda, em uma linha: onde o alerta de interseção pura vê **292
sobreposições** (21 de operação + 271 de interesse), a faixa de 8 km vê **2.164
processos minerários distintos**, dos quais **1.899 são invisíveis para o alerta
de interseção** — não encostam no território, e mesmo assim estão dentro da
faixa que aciona a manifestação da FUNAI / Fundação Cultural Palmares.

E a Aldeia Katurama, que dá **zero** em todo alerta de interseção deste projeto,
tem **20 minas em operação** e **114 processos de interesse** dentro dos 8 km.

---

## 1. ⚠️ A armadilha que este documento existe para não deixar repetir

`docs/FONTES-TERRITORIO-E-MINERACAO.md` §3 e §4 já mediram: **o círculo de 8 km e
a ZAS de barragem são dois institutos jurídicos diferentes**, e usar um pelo
outro erra em ordem de grandeza.

| | **Raio de 8 km** | **ZAS / mancha de inundação** |
|---|---|---|
| Norma | Portaria Interministerial 60/2015, Anexo I | Lei 12.334/2010; Res. ANM 95/2022, art. 2º, LI |
| Forma | **círculo em volta da TERRA** | **trecho do VALE À JUSANTE da barragem** |
| Piso | 8 km fora da Amazônia Legal | **10 km de vale**, ou 30 min de onda — o maior |
| Para quê | acionar FUNAI/FCP no licenciamento | salvar vida na emergência |

Medido nas 5 barragens de Brumadinho: o círculo de 8 km **superestima a ZAS real
de 14× a 127×** — e erra a *direção* (inclui morro acima, exclui o vale abaixo
dos 8 km, que é justamente por onde a onda desce).

**Portanto: é proibido usar estas duas camadas para dizer que uma barragem
atinge uma terra.** Para isso existem `alerta-ti-mancha` e
`alerta-quilombola-mancha`, sobre a geometria oficial da FEAM. O raio aqui
responde a **uma** pergunta e só a ela: *"este processo minerário está perto o
bastante da terra para o licenciamento ter de ouvir o órgão indigenista ou
quilombola?"*.

A docstring do script repete este aviso inteiro, para quem chegar pelo código e
não por aqui.

---

## 2. Os arquivos

```
apps/web/public/terras/globo/scripts/calcular_alerta_raio_ti_sigmine.py
apps/web/public/terras/globo/dados/camadas/alerta-raio-territorio-sigmine-operacao.geojson    (328 feições, 398 KiB)
apps/web/public/terras/globo/dados/camadas/alerta-raio-territorio-sigmine-interesse.geojson   (2.285 feições, 2,65 MiB)
```

Mesmo formato `FeatureCollection` (`type`, `name`, `crs`, `features[]`) dos
irmãos, conferido contra `alerta-territorio-sigmine-operacao.geojson` antes de
escrever. Nenhum dos dois chega perto do teto de 25 MiB do Workers Static Assets
nem do corte de ~8 MiB de `scripts/comprimir-camadas-grandes.mjs` — **os dois
ficam crus, sem `comprimida: true`**.

O script é idempotente (reescreve os dois arquivos do zero, rodado duas vezes com
resultado idêntico), roda com o venv `etl/betim/.venv` e usa bbox só como
pré-filtro. `pip install -r etl/betim/requirements.txt` **não traz `shapely`** —
se o venv não existir:

```
python -m venv etl/betim/.venv
etl/betim/.venv/Scripts/python -m pip install shapely ijson psycopg[binary] python-dotenv requests
```

Proveniência já registrada: as duas camadas entraram em `ORIGENS` de
`apps/web/scripts/gerar-proveniencia-globo.mjs` (obtenção `derivada`) e
`dados/proveniencia.json` foi regenerado — 40 camadas, nenhuma com origem não
declarada.

**Este script não toca no banco.** Não há `DATABASE_URL` envolvida (e portanto
nenhum risco de encostar na Neon, que está em HTTP 402): tudo sai de camadas já
publicadas em `dados/camadas/` mais duas camadas do WFS público do IDE-Sisema.

---

## 3. O insumo: a faixa vem PRONTA, não é buffer nosso

| Camada IDE-Sisema | Feições | `dist=8000` |
|---|---:|---:|
| `ide_2004_mg_raio_rest_terras_indigenas_pol` | 80 (16 polígonos × 5 tipologias) | **16** |
| `ide_2006_mg_raio_rest_terras_quilombolas_pol` | 145 (29 territórios × 5 tipologias) | **29** |

45 faixas de 8 km ao todo. A tipologia de `dist=8000` é, nas duas camadas,
*"Empreendimentos pontuais (portos, mineração e termelétricas)"* — conferido nas
45 feições. O script tem uma **trava**: se o IDE republicar a camada com outra
tabela de distâncias, ele PARA em vez de publicar um número calculado sobre a
faixa errada (a de duto, 3 km, ou a de hidrelétrica, 15 km). Mesma regra da
`_CLASSIFICACAO_MANUAL` de `calcular_alerta_area_protegida.py`.

**O equivalente quilombola existe e foi usado.** `FONTES-TERRITORIO-E-MINERACAO.md`
§4 registrava a camada `ide_2006_...` numa linha só ("há também o equivalente
para quilombolas"), sem contagem; o handoff de alertas não a mencionava. Chamada
de verdade hoje: 145 feições, mesma estrutura, mesmas 5 tipologias, 29
territórios. Por isso as camadas se chamam `...-territorio-...` e não `...-ti-...`
— mesma convenção de nome dos irmãos `alerta-territorio-sigmine-*`, que também
juntam TI e quilombola numa camada só, com `territorio_tipo` distinguindo. (O
script mantém o nome que a tarefa pediu, `calcular_alerta_raio_ti_sigmine.py`.)

O órgão que se manifesta muda com o tipo de território, e está gravado em cada
feição (`orgao_manifestacao`): **FUNAI** para terra indígena, **Fundação Cultural
Palmares** para território quilombola.

### ⚠️ A faixa é um DISCO, não um anel — medido

Conferido na Aldeia Katurama: a faixa tem **222,6 km²** contra **3,48 km²** de
TI, e contém **100%** da terra. Ou seja: um processo que **já se sobrepõe** ao
território também cai dentro da faixa. Sem tratar isso, ler os dois alertas
juntos contaria o mesmo processo duas vezes.

Por isso toda feição carrega `ja_sobrepoe_territorio_publicado` (bool, sempre
preenchido, medido contra os 43 polígonos de território publicados neste projeto,
com a mesma regra do irmão: interseção de **área > 0**, encostar de borda não
conta) e `distancia_ao_territorio_m`.

---

## 4. O que foi medido

Tudo abaixo saiu de execução real (duas rodadas, resultado idêntico). Nada
estimado.

### 4.1 Resumo

| | `operacao` (fato consumado) | `interesse` (papel protocolado) |
|---|---:|---:|
| Pares processo × faixa | **328** | **2.285** |
| Processos distintos da ANM | 289 | 1.875 |
| …que **NÃO** sobrepõem território (novos) | **269** | **1.630** |
| …que já sobrepõem (já estão no alerta de interseção) | 20 | 250 |
| Territórios atingidos | 30 de 43 | 39 de 43 |
| Área somada dentro da faixa | 51.474,6 ha | 993.001,3 ha |

Os 20 e os 250 batem com as camadas irmãs (`alerta-territorio-sigmine-operacao`
tem 21 feições, `-interesse` tem 271): a diferença é que lá a contagem é por
**par polígono-de-território × processo** — um processo que cruza duas poligonais
do mesmo território conta duas vezes —, e aqui é por processo. Serve como
conferência cruzada de que as duas contas estão vendo o mesmo mundo.

**As duas linhas nunca se somam.** Operação é extração autorizada; interesse é
papel protocolado na ANM que pode nunca virar nada. Somar apagaria a distinção
jurídica que `FONTES-TERRITORIO-E-MINERACAO.md` §2 chama de correção mais
importante do levantamento.

### 4.2 Mina EM OPERAÇÃO a menos de 8 km — por território

12 das 15 terras indígenas de MG e 18 dos 28 territórios quilombolas têm lavra
autorizada dentro da faixa.

| Território | Tipo | Pares | Sendo só na faixa (não tocam a terra) |
|---|---|---:|---:|
| Kiriri de Caldas | TI | 51 | 51 |
| PIMENTEL | Quilombola | 45 | 45 |
| BAÚ | Quilombola | 23 | 21 |
| Krenak de Sete Salões | TI | 21 | 19 |
| **Aldeia Katurama** | TI | **20** | **20** |
| Fazenda Boa Vista - MG | TI | 15 | 15 |
| FAMILIA TEODORO DE OLIVEIRA E VENTURA | Quilombola | 13 | 13 |
| LUIZES | Quilombola | 13 | 13 |
| Muã Mimatxi (Fazenda Modelo Diniz) | TI | 12 | 12 |
| Xacriabá | TI | 11 | 5 |

(+ AMAROS 11, MACHADINHO 10, NOGUEIRA 10, SAO DOMINGOS 9, LAPINHA 9, Caxixó 8,
Aldeia Escola Floresta 8, Krenak 7, MANGUEIRAS 6, GURUTUBA 6, QUILOMBO 5,
Xakriabá Rancharia 4, MAROBA DOS TEIXEIRA 3, TABUA 2, e 6 territórios com 1.)

Por fase: **203 Concessão de Lavra**, 106 Licenciamento, 15 Lavra Garimpeira, 4
Registro de Extração. Substâncias mais frequentes: areia (78), granito (26),
argila (26), zircônio (25), calcário (17), bauxita (17).

**Os mais próximos que NÃO tocam a terra** — a faixa é o único alerta do projeto
que os enxerga:

| Distância | Território | Titular | Substância | Fase |
|---:|---|---|---|---|
| **73 m** | MACHADINHO e SAO DOMINGOS (Paracatu) | KINROSS BRASIL MINERACAO S/A | minério de ouro | Concessão de Lavra |
| 228 m | BAÚ (Araçuaí) | BONTEMPI IMOVEIS LTDA | granito | Concessão de Lavra |
| 415 m | Kiriri de Caldas | COMPANHIA BRASILEIRA DE ALUMINIO | zircônio | Concessão de Lavra |
| 757 m | PIMENTEL (Pedro Leopoldo) | Wellington Higor Fonseca Me | areia | Licenciamento |
| 780 m | Kiriri de Caldas | MINERACAO CALDENSE LTDA | bauxita | Concessão de Lavra |
| 908 m | **Aldeia Katurama** | Dragagem Flausino Ltda ME | ouro | Licenciamento |
| 937 m | Caxixó | APARECIDA DA COSTA FREITAS | areia | Licenciamento |
| 1.026 m | **Aldeia Katurama** | Água Mineral Aguaí Ltda | água mineral | Concessão de Lavra |

Mediana de distância nesta camada: **4,9 km**. 8 processos a menos de 1 km, 28 a
menos de 2 km.

### 4.3 Interesse minerário a menos de 8 km

**Todas as 15 terras indígenas** e 24 dos 28 territórios quilombolas. Os mais
expostos: BAÚ 284 (226 só na faixa), Krenak de Sete Salões 220 (183), Aldeia
Katurama 114 (112), AUSENTE 99, Kiriri de Caldas 95, PIMENTEL 92, Krenak 91,
LAGOA GRANDE 88, Fazenda Boa Vista 87, MACHADINHO 84.

Por fase: 1.319 Autorização de Pesquisa, 286 Disponibilidade, **243 Requerimento
de Lavra** (já é pedido para extrair — 211 deles sem tocar o território), 241
Requerimento de Pesquisa, 61 Direito de Requerer a Lavra, 61 Requerimento de
Licenciamento, 36 Requerimento de Lavra Garimpeira, 27 Apto para Disponibilidade,
11 Requerimento de Registro de Extração.

Substâncias: granito (437), minério de ouro (306), areia (238), **minério de
lítio (167)**, minério de ferro (153), "dado não cadastrado" (142), quartzito
(88). O lítio aparece na faixa de **12 territórios** — BAÚ, Krenak, Krenak de
Sete Salões, Hãm Yîxux, Mundo Verde/Cachoeirinha, Aldeia Escola Floresta, LAGOA
GRANDE, MAROBA DOS TEIXEIRA, MARQUES, MUMBUCA, PORTO CORÍS e QUILOMBO.

Os mais próximos sem tocar a terra chegam a **3, 4 e 8 metros** da borda
(LAPINHA/areia, Maxacali/granito, Krenak/gema, TABUA/areia). 162 processos a
menos de 1 km.

### 4.4 Os quatro territórios com NADA dentro dos 8 km

**BOA ESPERANÇA, MOTA, SANTANA e SETE LADEIRAS e TERRA DURA** (todos quilombolas)
não têm nenhum processo minerário, de operação ou de interesse, dentro da faixa.
Nenhuma terra indígena de MG está nessa condição — **as 15 têm ao menos interesse
minerário dentro dos 8 km**.

---

## 5. Método, e o que ele não faz

- **Interseção real de geometria** (`shapely.intersects()`/`intersection()`)
  sobre a malha completa dos dois lados. Bbox só como pré-filtro — aqui via
  `STRtree`, que é o mesmo pré-filtro por caixa dos scripts irmãos, só que em
  árvore (45 faixas × 47.830 polígonos = 2,2 milhões de pares; o laço puro fica
  caro, a árvore resolve em 0,8 s).
- **A geometria gravada é a interseção recortada** — o pedaço do processo
  minerário que cai dentro da faixa —, não o processo inteiro nem a faixa
  inteira. Simplificada com a mesma régua das outras camadas (0,0002°, ~22 m);
  a decisão de "cruza ou não" e a distância usam a malha completa.
- **O par faixa↔terra é casado por geometria**, não por nome: os nomes do IDE e
  os do INCRA divergem ("BREJO DE CRIOULOS" × "BREJO DOS CRIOULOS", "NOGUEIRA" ×
  "TQ Nogueira"). Candidata é a terra ≥99% contida na faixa; o nome só desempata
  entre candidatas; as partes de mesmo nome entram unidas (MAROBÁ DOS TEIXEIRA
  tem 5 poligonais — medir distância até uma só superestimaria o afastamento).
- **Casamento medido**: 16 de 16 faixas de TI, 22 de 29 quilombolas. As 7 sem par
  (BOA ESPERANÇA, CRUZEIRINHO, FAMILIA TEODORO DE OLIVEIRA E VENTURA, MOTA,
  PAU D'ARCO E PARATECA, SANTANA, SÃO JOSÉ DA SERRA) são territórios que o IDE
  tem e a camada `territorios-quilombolas` deste projeto ainda não. **Elas
  continuam gerando alerta normalmente** — o que falta nelas é só a distância,
  que sai `null`, nunca um número inventado.
- **`area_dentro_da_faixa_ha` é medida nossa** (aproximação de mapa em graus,
  mesma dos irmãos) e pode divergir uns 0,5% de `area_processo_ha`, que é o
  número declarado pela ANM. Os dois campos ficam lado a lado de propósito.

### O que este alerta NÃO afirma

A Portaria 60/2015 organiza a participação dos órgãos intervenientes no
licenciamento que ela rege. **Quem licencia cada processo minerário — a União ou
o Estado — não está neste dado e não foi medido.** A saída diz "está dentro da
faixa de 8 km", que é um fato geométrico verificável; ela **não** diz "este
licenciamento foi obrigado a ouvir a FUNAI e não ouviu". A segunda afirmação
exigiria o processo de licenciamento de cada empreendimento, que não está em base
aberta — fica como próximo passo, e é bom alvo de LAI.

---

## 6. Para colar em `config.js`

### 6.1 A cor — medida, e o achado que veio junto

Regra do arquivo: nova cor é o meio da maior lacuna do círculo de matiz, com piso
de **11,6°** de cada vizinha (o precedente `--danger` × `--layer-noticias`).

**Medi os 30 matizes em uso hoje no `LAYER_REGISTRY` — e não há mais lugar.** A
maior lacuna livre em OKLCH é **17,29°** (128,79° `territorios-quilombolas` →
146,08° `sigmine-operacao`): o meio dela ficaria a 8,6° de cada vizinha, **abaixo
do piso**. Segunda maior: 17,22°. Terceira: 16,41°. O círculo fechou.

Então vale a regra que o próprio `colors.css` já escreveu para os alertas:

> *"O alerta de TI × mancha de inundação NÃO tem cor própria, de propósito —
> usa `var(--danger)`. É risco CALCULADO sobre duas camadas que já existem, não
> uma fonte de dado nova, e reaproveitar o slot semântico de perigo é mais
> honesto do que inventar mais uma cor."*

**Proposta: a irmã mais CLARA da cor do alerta correspondente**, usando o único
precedente de distinção por claridade que o arquivo tem
(`--layer-vazio-bacia` L .754 → `--layer-vazio-curvelo` L .845, documentado como
*"mesmo método, outro recorte"* — que é exatamente a relação entre estas camadas
e as irmãs de interseção):

| Camada nova | Cor | Irmã de interseção |
|---|---|---|
| `alerta-raio-territorio-sigmine-operacao` | `0xffa79e` = `oklch(0.845 0.139 25)` | `0xfb8a82` `var(--danger)` |
| `alerta-raio-territorio-sigmine-interesse` | `0xffbe59` = `oklch(0.845 0.139 75)` | `0xe2a138` `var(--caution)` |

Cada raio fica visualmente amarrado ao seu par ("perto" é a versão clara de
"dentro"), sem hue nova e sem colidir com nenhuma das 30 já em uso. Conversão
OKLCH→hex conferida reproduzindo cinco tokens conhecidos do arquivo (`--accent`
#38bdf8, `--danger` #fb8a82, `--caution` #e2a138, `--layer-quilombolas` #94c05b,
`--layer-vazio-curvelo` #d0baff) — todos exatos.

> **Achado de brinde, para quem cuida da paleta.** A nota de 15/08 em `config.js`
> sobre a cor de `atos-area-protegida-municipios` diz *"a maior lacuna livre é
> 276,9° → 320,6°"* e fixa 298,8° — números que **não são os de OKLCH**. A cor
> escolhida (`#eb8dec`) tem matiz OKLCH **326,65°**; 299° é o matiz dela em
> **HSL**. Aquela conta foi feita em HSL, e `css/tokens/colors.css` declara a
> paleta inteira em OKLCH. Não é urgente — a cor resultante é legível e não
> colide —, mas as duas medições não são intercambiáveis, e a próxima cor será
> medida contra uma régua ou contra a outra. As cores propostas acima passam nas
> duas: em HSL elas ficam em 5,6° e 36,5°, a mais de 12° de qualquer vizinha.

### 6.2 `LAYER_REGISTRY`

Colar logo depois de `alerta-territorio-sigmine-interesse` — a ordem "o que está
dentro antes do que está perto" é a mesma lógica de "o que já acontece antes do
que pode acontecer" que o bloco vizinho já usa.

```js
  // --- O mesmo cruzamento, agora por PROXIMIDADE (14/08/2026) --------------
  //
  // Primeiro alerta do projeto que mede DISTÂNCIA, e não sobreposição. Motivo:
  // "zero interseções" nunca foi "zero risco" — as 6 barragens que pareciam
  // cruzar a Aldeia Katurama estavam a 450-650 m da borda, fora de todo alerta
  // que este mapa sabia calcular até agora. Ver docs/HANDOFF-ALERTA-RAIO-8KM.md.
  //
  // A faixa NÃO é buffer nosso: é a camada de raio de restrição que o
  // IDE-Sisema publica pronta (ide_2004_... para TI, ide_2006_... para
  // quilombola), campo `dist`, filtrada em 8.000 m — a distância que o Anexo I
  // da Portaria Interministerial 60/2015 fixa para EMPREENDIMENTO PONTUAL
  // (portos, mineração, termelétricas) fora da Amazônia Legal.
  //
  // ⛔ NÃO REUSAR ESTA FAIXA PARA BARRAGEM. O círculo de 8 km superestima a ZAS
  // real de 14× a 127× (medido nas 5 barragens de Brumadinho) e erra a direção:
  // inclui morro acima e exclui o vale abaixo dos 8 km, que é por onde a onda
  // desce. Para barragem existem alerta-ti-mancha e alerta-quilombola-mancha,
  // sobre a geometria oficial da FEAM.
  //
  // A faixa CONTÉM o território (é disco, não anel), então parte do que aparece
  // aqui já aparece nos dois alertas de interseção. Cada feição traz
  // `ja_sobrepoe_territorio_publicado` para separar um do outro — os números dos
  // textos abaixo são só os que NÃO sobrepõem.
  {
    id: 'alerta-raio-territorio-sigmine-operacao', label: 'Mina em operação a menos de 8 km de terra indígena/quilombola',
    hint: '328 cruzamentos entre a faixa de restrição de 8 km e lavra JÁ EM OPERAÇÃO — 289 processos distintos da ANM, dos quais 269 nem encostam no território e por isso não aparecem em nenhum outro alerta deste mapa. Atinge 12 das 15 terras indígenas de MG e 18 dos 28 territórios quilombolas. O mais próximo: uma concessão de lavra de ouro da Kinross a 73 m dos quilombos MACHADINHO e SÃO DOMINGOS, em Paracatu. A Aldeia Katurama, que dá zero em todo alerta de sobreposição, tem 20 minas em operação dentro da faixa.',
    aviso: 'A distância de 8 km é o critério do Anexo I da Portaria Interministerial 60/2015 para acionar a manifestação da FUNAI (terra indígena) ou da Fundação Cultural Palmares (quilombola) no licenciamento — está na ficha de cada feição, em orgao_manifestacao. Estar dentro da faixa é fato geométrico; NÃO é afirmação de que aquele licenciamento específico deixou de ouvir o órgão (quem licenciou cada processo, União ou Estado, não está neste dado). E esta faixa NÃO serve para barragem: para risco de rompimento, ver as camadas de mancha de inundação — círculo não é vale.',
    color: 0xffa79e, /* irmã mais clara de var(--danger), que é a cor de "atingida por mina em operação": mesmo método, outro recorte — precedente de --layer-vazio-bacia/--layer-vazio-curvelo. Não há hue nova disponível: a maior lacuna do círculo hoje é 17,3°, abaixo do piso de 11,6° por vizinha. */ on: false, render: 'fill', listavel: true,
  },
  {
    id: 'alerta-raio-territorio-sigmine-interesse', label: 'Interesse minerário a menos de 8 km de terra indígena/quilombola',
    hint: '2.285 cruzamentos entre a faixa de 8 km e processo de INTERESSE minerário — 1.875 processos distintos, dos quais 1.630 não encostam no território. TODAS as 15 terras indígenas de MG e 24 dos 28 territórios quilombolas têm algum. 243 já são requerimento de lavra (pedido para extrair) e 167 são de lítio, em 12 territórios diferentes. Há processos a 3, 4 e 8 metros da borda da terra.',
    aviso: 'Não é mina: é papel protocolado na ANM, e 1.319 dos 2.285 são só autorização de pesquisa. Nunca some esta camada com "mina em operação a menos de 8 km" — são categorias jurídicas diferentes. Parte destes processos também sobrepõe o território e já aparece em "sob interesse minerário"; o campo ja_sobrepoe_territorio_publicado, na ficha, diz quais.',
    // pesada: 2.285 polígonos de preenchimento numa camada só. O comentário de
    // `sigmine-interesse` mede que "ligar tudo" soma umas 1.900 áreas somando as
    // outras ~21 linhas — esta sozinha passa disso, e a triangulação de
    // `geojsonToFilled` roda na thread principal. Continua alcançável pela
    // chave dela, uma a uma. Se a medição no celular mostrar que cabe, tirar.
    color: 0xffbe59, /* irmã mais clara de var(--caution), a cor de "sob interesse minerário" — mesma regra da camada acima */ on: false, render: 'fill', listavel: true, pesada: true,
  },
```

### 6.3 `CAMADAS` (bloco de `assunto`)

As duas encaixam no `assunto: 'territorio-mineracao'` que já existe — mesmo grupo
das irmãs, nenhum assunto novo. Colar logo depois de
`alerta-territorio-sigmine-interesse`, antes de `alerta-quilombola-mancha`:

```js
  {
    id: 'alerta-raio-territorio-sigmine-operacao', assunto: 'territorio-mineracao',
    label: 'Mina em operação a menos de 8 km de terra indígena/quilombola',
    hint: '328 cruzamentos com a faixa de restrição de 8 km da Portaria 60/2015 — 269 processos que nem encostam no território e não aparecem em nenhum outro alerta. 12 terras indígenas e 18 territórios quilombolas. O mais próximo é uma lavra de ouro da Kinross a 73 m de dois quilombos de Paracatu.',
    aviso: 'Círculo em volta da TERRA, para acionar FUNAI/Fundação Cultural Palmares no licenciamento — não serve para barragem: para risco de rompimento existe a mancha de inundação, que desce o vale.',
    fontes: ['alerta-raio-territorio-sigmine-operacao'],
  },
  {
    id: 'alerta-raio-territorio-sigmine-interesse', assunto: 'territorio-mineracao',
    label: 'Interesse minerário a menos de 8 km de terra indígena/quilombola',
    hint: '2.285 cruzamentos com a mesma faixa de 8 km — 1.630 processos que não encostam no território. TODAS as 15 terras indígenas de MG e 24 dos 28 territórios quilombolas. 243 são requerimento de lavra; 167 são de lítio.',
    aviso: 'Papel protocolado na ANM, não extração. Nunca somar com a camada de mina em operação.',
    fontes: ['alerta-raio-territorio-sigmine-interesse'],
  },
```

---

## 7. Lacunas declaradas desta entrega

1. **7 faixas quilombolas sem par no acervo do projeto** — o IDE publica raio
   para 29 territórios e `territorios-quilombolas.geojson` tem 27 poligonais de
   22 nomes. Elas geram alerta, mas sem distância. Fechar isso é reingerir o
   INCRA, não mexer neste script.
2. **Quem licencia cada processo** (União × Estado) não está no SIGMINE — sem
   isso, não dá para dizer que a manifestação era obrigatória *naquele* caso.
   Alvo de LAI.
3. **A faixa é a de MG.** Território que atravesse divisa de estado tem a faixa
   cortada na fronteira, porque a camada é estadual.
4. **PCTs não indígenas e não quilombolas continuam fora** — geraizeiros,
   vazanteiros, apanhadoras de flores sempre-vivas, povos de terreiro. Não há
   base geográfica oficial aberta (FONTES §5.1), e portanto não há raio para
   eles. Ausência aqui é lacuna de dado, não ausência de povo.
5. **A faixa em si não é publicada como camada visual.** Hoje só o cruzamento
   vai para o mapa; desenhar o disco de 8 km em volta de cada terra seria uma
   camada nova (`raio-restricao-8km`), com o risco pedagógico de ser lida como
   "zona de risco de barragem" — o erro que este documento inteiro existe para
   impedir. Decisão de quem cuida do painel, não tomada aqui.

---

*Medido e rodado em 14–15/08/2026. Toda contagem deste documento saiu de execução
real do script, duas vezes, com resultado idêntico. O que não foi medido está
escrito como não medido.*
