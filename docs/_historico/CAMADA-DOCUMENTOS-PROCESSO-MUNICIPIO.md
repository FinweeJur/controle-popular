# Camada "documentos do processo que citam este município"

Entrega de 15/08/2026. A camada existe, o arquivo está gravado, a
proveniência está registrada — **falta só colar as duas entradas em
`js/config.js`**, que este documento traz prontas (seção 4). O `config.js`
não foi editado de propósito: o dono estava editando o arquivo no momento
desta entrega.

| O quê | Onde |
|---|---|
| Script gerador | `apps/web/public/terras/globo/scripts/gerar_camada_documentos_municipio.py` |
| GeoJSON | `apps/web/public/terras/globo/dados/camadas/documentos-processo-municipios.geojson` (53 feições, 193.055 bytes) |
| Proveniência | `apps/web/public/terras/globo/dados/proveniencia.json` + `ORIGENS` em `apps/web/scripts/gerar-proveniencia-globo.mjs` |
| Entrada (única) | `apps/web/lib/paraopeba/documentos.ts` — os 471 documentos já publicados em `/paraopeba/documentos` |

---

## 1. O que entrou, e o que deliberadamente não entrou

**Base:** os **471 documentos que já estão publicados** em
`/paraopeba/documentos`, lidos de `lib/paraopeba/documentos.ts` — o arquivo
que já passou pela régua de `lib/paraopeba/triagem.ts`. O script **não
chama o Solr da UFMG**, não amplia para os 1.293 com campo de local
preenchido, não toca nos 5.814 sem o campo e não reprocessa os tipos
catch-all.

O motivo está escrito na docstring do script, não só aqui: ~90 documentos
do acervo bruto (1,3%) são de tipo explicitamente pessoal e, mesmo sem
PDF, o resumo já traz iniciais e dado de saúde/emprego de vítima
(`docs/PLANO-INTEGRACAO-BRUMADINHO.md`, seção 2.4). **A trava geral de
dado pessoal para acervo ingerido ainda não existe** (adiada para 18/08) —
enquanto ela não existir, esta camada é derivada só do que já é público.

**A camada publica contagem, nunca teor.** Cada feição leva
`documentos_que_citam`, `documentos_por_tipo`, `documentos_por_processo`,
`processos_distintos`, `tipos_distintos` e
`resumos_redigidos_pela_triagem`. **Não leva** `citacao` (o resumo escrito
pela UFMG), nem `titulo`, nem `id` de documento, nem link para documento
individual — o único link é `/paraopeba/documentos`, a página que já
publica a lista com a triagem e a atribuição do lado. Isso não é economia
de bytes: é a regra que `docs/PLANO-INGESTAO-PARAOPEBA.md` (2.4) já tinha
escrito antes de existir camada nenhuma — juntar resumo sensível a um pino
no mapa aumenta a capacidade de re-identificação mais do que o mesmo resumo
solto numa lista. O script tem uma trava final que **aborta** se qualquer
chave proibida (`citacao`, `titulo`, `id`, `authors`, `resumo`,
`summary_pt`, `temas`) aparecer na saída; conferido de novo por busca de
texto no GeoJSON gravado: zero ocorrências.

**Geometria: polígono, não centroide.** Cada feição usa o polígono
municipal de `dados/camadas/municipios-mg.geojson` (malha do IBGE — a mesma
que `cfem-municipios` e `atos-area-protegida-municipios` já usam), casado
por `geocodigo` de 7 dígitos que a própria `documentos.ts` carrega. Nenhum
centroide foi calculado e nenhum ponto foi inventado. Os 53 municípios
acharam polígono: `municipios_sem_poligono` saiu vazia (a chave só aparece
no arquivo se houver o que registrar).

---

## 2. Números medidos nesta execução

Todos saem da rodada real de
`python scripts/gerar_camada_documentos_municipio.py` sobre
`documentos.ts` — nenhum foi digitado à mão, inclusive os totais de
cobertura, que o script lê de `COBERTURA_DOCUMENTOS_PROCESSO`.

| Medida | Valor |
|---|---:|
| Documentos publicados lidos | 471 |
| Documentos com ≥1 município | 471 (100% da base publicada) |
| **Municípios de MG na camada** | **53** |
| Menções documento×município | 1.149 |
| Processos distintos representados | 10 |
| Tipos de documento distintos | 18 |
| Documentos com resumo redigido pela triagem (soma por município) | 62 menções, de 35 documentos |
| Acervo total do processo | 7.107 |
| **Fração do acervo com município identificado** | **471 / 7.107 = 6,6%** |

**1.149 ≠ 471, e isso é esperado:** um documento cita vários municípios (é
o caso comum — um laudo cita a bacia inteira) e é contado inteiro em cada
um. Somar as contagens entre municípios inventa documento — o `aviso` de
cada feição diz isso, mesma ressalva que `cfem-municipios` já carrega por
outro motivo.

### Os 5 municípios com mais documentos

| # | Município | Documentos que citam | Processos | Tipos |
|---:|---|---:|---:|---:|
| 1 | Brumadinho | 192 | 10 | 11 |
| 2 | São Joaquim de Bicas | 81 | 8 | 11 |
| 3 | Mário Campos | 65 | 8 | 8 |
| 4 | Pará de Minas | 58 | 8 | 10 |
| 5 | Paraopeba | 57 | 8 | 5 |

### Distribuição completa (53 municípios)

| # | Município | Docs | Processos | Tipos | Resumo redigido |
|---:|---|---:|---:|---:|---:|
| 1 | Brumadinho | 192 | 10 | 11 | 28 |
| 2 | São Joaquim de Bicas | 81 | 8 | 11 | 3 |
| 3 | Mário Campos | 65 | 8 | 8 | 4 |
| 4 | Pará de Minas | 58 | 8 | 10 | 3 |
| 5 | Paraopeba | 57 | 8 | 5 | 5 |
| 6 | Pompéu | 49 | 8 | 6 | 1 |
| 7 | Mariana | 46 | 4 | 5 | 0 |
| 8 | Juatuba | 42 | 8 | 9 | 3 |
| 9 | Curvelo | 41 | 8 | 6 | 1 |
| 10 | Betim | 39 | 8 | 8 | 3 |
| 11 | Esmeraldas | 35 | 8 | 7 | 1 |
| 12 | São José da Varginha | 33 | 8 | 4 | 1 |
| 13 | Florestal | 32 | 8 | 7 | 1 |
| 14 | Fortuna de Minas | 30 | 8 | 5 | 1 |
| 15 | Pequi | 29 | 8 | 4 | 1 |
| 16 | Papagaios | 28 | 8 | 5 | 1 |
| 17 | Igarapé | 26 | 7 | 5 | 1 |
| 18 | Maravilhas | 25 | 8 | 5 | 1 |
| 19 | Três Marias | 24 | 10 | 3 | 1 |
| 20 | Felixlândia | 23 | 8 | 5 | 1 |
| 21 | Caetanópolis | 21 | 8 | 5 | 1 |
| 22 | Belo Horizonte | 20 | 6 | 2 | 0 |
| 23 | Sarzedo | 17 | 3 | 2 | 0 |
| 24 | Inhaúma | 15 | 6 | 3 | 0 |
| 25 | Ouro Preto | 12 | 5 | 6 | 0 |
| 26 | Barão de Cocais | 10 | 4 | 2 | 0 |
| 27 | Itabirito | 9 | 4 | 4 | 0 |
| 28 | Morada Nova de Minas | 9 | 5 | 3 | 0 |
| 29 | São Gonçalo do Abaeté | 8 | 5 | 3 | 0 |
| 30 | Abaeté | 7 | 5 | 3 | 0 |
| 31 | Biquinhas | 7 | 5 | 3 | 0 |
| 32 | Nova Lima | 7 | 3 | 3 | 0 |
| 33 | Paineiras | 6 | 5 | 3 | 0 |
| 34 | Cantagalo | 5 | 4 | 2 | 0 |
| 35 | Cachoeira da Prata | 4 | 4 | 1 | 0 |
| 36 | Ibirité | 4 | 4 | 1 | 0 |
| 37 | Martinho Campos | 4 | 4 | 2 | 0 |
| 38 | Conselheiro Lafaiete | 3 | 1 | 1 | 0 |
| 39 | Mateus Leme | 3 | 2 | 1 | 0 |
| 40 | Rio Manso | 3 | 3 | 2 | 0 |
| 41 | Bonfim | 2 | 2 | 1 | 0 |
| 42 | Capim Branco | 2 | 2 | 2 | 0 |
| 43 | Moeda | 2 | 2 | 1 | 0 |
| 44 | Rio Doce | 2 | 1 | 1 | 0 |
| 45 | Santa Cruz do Escalvado | 2 | 1 | 1 | 0 |
| 46 | São Francisco | 2 | 1 | 1 | 0 |
| 47 | Tabuleiro | 2 | 1 | 1 | 0 |
| 48 | Governador Valadares | 1 | 1 | 1 | 0 |
| 49 | Itabira | 1 | 1 | 1 | 0 |
| 50 | Raposos | 1 | 1 | 1 | 0 |
| 51 | Rio Acima | 1 | 1 | 1 | 0 |
| 52 | Sabará | 1 | 1 | 1 | 0 |
| 53 | Santa Bárbara | 1 | 1 | 1 | 0 |

A cauda é longa e rasa: 16 dos 53 municípios têm 3 documentos ou menos, e
6 têm exatamente 1 (22 têm 20 ou mais). **Uma cidade com 1 documento não é "quase não
atingida"** — é uma cidade que apareceu uma vez no campo de local de um
acervo cujo campo de local está preenchido em 18,2% dos documentos.

### Por tipo de documento (soma das menções, todos os municípios)

| Tipo | Menções |
|---|---:|
| extraprocessual | 491 |
| documentos comprobatórios | 314 |
| outros documentos | 200 |
| petição | 67 |
| documento de comprovação | 12 |
| manifestação da promotoria | 10 |
| manifestação da defensoria pública | 9 |
| manifestação da advocacia pública | 9 |
| petição inicial | 7 |
| estudo técnico | 6 |
| ata de audiência | 6 |
| informações prestadas | 6 |
| ofício | 3 |
| termo | 3 |
| contestação | 2 |
| relatório técnico | 2 |
| decisão | 1 |
| juntada | 1 |

### Por processo (soma das menções)

| Processo | Menções |
|---|---:|
| 5036296-26.2020.8.13.0024 | 231 |
| 5010709-36.2019.8.13.0024 | 177 |
| 5087481-40.2019.8.13.0024 | 175 |
| 5071521-44.2019.8.13.0024 | 171 |
| 5044954-73.2019.8.13.0024 | 146 |
| 5026408-67.2019.8.13.0024 | 119 |
| 5095958-18.2020.8.13.0024 | 76 |
| 5095960-85.2020.8.13.0024 | 44 |
| 5036162-96.2020.8.13.0024 | 8 |
| 5036254-74.2020.8.13.0024 | 2 |

São **10 dos 16 processos** que o índice da UFMG cobre — os outros 6 não
têm nenhum documento com município identificado nesta fatia. Mais uma
face do mesmo viés: a camada não é um retrato do processo, é um retrato de
onde o campo de local foi preenchido.

---

## 3. O viés, escrito para a tela (não só para este documento)

O texto abaixo está, em versão integral, na propriedade `aviso` de **cada
feição** do GeoJSON, e em versão curta no `aviso` da entrada de `config.js`
(seção 4):

> **Só 471 dos 7.107 documentos do acervo (6,6%) têm município
> identificado.** O campo de local é texto livre da própria UFMG,
> preenchido em 18,2% do acervo, e a maior parte do que está lá é nome de
> barragem, comunidade, rio ou bacia — não município. **Este mapa mostra
> onde o acervo CITA, não onde o dano FOI: município ausente do mapa não é
> município não atingido.** E "cita" não é "é sobre": um documento marcado
> com um município pode tratar de um evento ali, de pessoa residente lá, ou
> só mencionar o nome de passagem.

Três consequências práticas que o texto acima já cobre e que valem repetir
para quem for mexer na UI:

1. **Nunca ranquear município por gravidade** com este número. O ranking
   aqui é de citação, não de dano.
2. **Nunca somar** as contagens entre municípios (1.149 ≠ 471).
3. **O polígono é a unidade de contagem**, não a extensão de nada — o
   município inteiro pintado não diz que o documento fala do município
   inteiro nem que o fato ocorreu ali.

---

## 4. Texto exato para colar em `js/config.js`

⚠️ **`js/config.js` não foi editado por esta entrega** (o dono estava
editando o arquivo). São duas entradas, nos dois registros, com os textos
abaixo.

### 4.1 `LAYER_REGISTRY` — junto do bloco das 8 camadas de Brumadinho

Colar depois de `brumadinho-restauracao` (última da família B1) e antes de
`terras-indigenas`:

```js
  // A nona linha da família Brumadinho, e a única que não vem de geometria:
  // é o ACERVO JUDICIAL contado por município. Fonte:
  // apps/web/lib/paraopeba/documentos.ts — os 471 documentos que o portal já
  // publica em /paraopeba/documentos, já triados por lib/paraopeba/triagem.ts.
  // Gerada por scripts/gerar_camada_documentos_municipio.py, documentada em
  // docs/CAMADA-DOCUMENTOS-PROCESSO-MUNICIPIO.md.
  //
  // A camada leva CONTAGEM (por tipo de documento e por processo), nunca
  // teor: resumo, título e id de documento ficam na página, onde a triagem
  // de dado pessoal e a atribuição à UFMG aparecem junto. Juntar resumo
  // sensível a um pino no mapa aumenta a re-identificação mais do que o mesmo
  // resumo numa lista (docs/PLANO-INGESTAO-PARAOPEBA.md, 2.4) — mesma lógica
  // do cuidado com `remanejamento_pto`, logo acima.
  //
  // Cor: âmbar da ressalva, SEM hue nova. O círculo de matiz está cheio —
  // medidas as 29 hues em uso, a maior lacuna que resta é 18,25°, que daria
  // 9,1° de folga, abaixo do piso de 11,6° que css/tokens/colors.css usa
  // desde 30/07 (e as vizinhas dessa lacuna seriam a mancha de inundação e
  // --fiction: os dois piores). Âmbar é exatamente o que esta camada é —
  // "ressalva, dado parcial", nas palavras de colors.css. É a irmã mais
  // clara de --caution (oklch 0.82 0.139 75, mesmo matiz, um degrau acima —
  // o recurso que --layer-vazio-curvelo já usa) para não colar no âmbar de
  // "Terra indígena/quilombola sob interesse minerário", que fica nesta
  // mesma seção. L .845 sairia da gama do sRGB neste matiz — medido.
  // Ver seção 4.3 de docs/CAMADA-DOCUMENTOS-PROCESSO-MUNICIPIO.md.
  {
    id: 'documentos-processo-municipios', label: 'Documentos do processo que citam o município',
    hint: '471 documentos do processo judicial da reparação de Brumadinho que citam, pelo nome, um município de Minas — 53 municípios ao todo, de Brumadinho (192 documentos) a seis cidades com 1. A ficha traz a contagem por tipo de documento e por processo; a lista, com resumo e link para o original, fica em /paraopeba/documentos.',
    aviso: 'Só 471 dos 7.107 documentos do acervo (6,6%) têm município identificado — o campo de local da Plataforma UFMG é texto livre, preenchido em 18,2% do acervo, e a maior parte do que está lá é nome de barragem, comunidade, rio ou bacia, não município. Este mapa mostra onde o acervo CITA, não onde o dano FOI: município ausente daqui NÃO é município não atingido. "Cita" também não é "é sobre" — o documento pode tratar de um evento ali, de pessoa residente lá, ou só mencionar o nome. Não some as contagens entre municípios: um mesmo documento cita vários e é contado inteiro em cada um (1.149 menções para 471 documentos).',
    color: 0xf8b651, /* oklch(0.82 0.139 75) — irmã mais clara de --caution: ressalva/dado parcial, sem colar no âmbar do interesse minerário. Ver docs/CAMADA-DOCUMENTOS-PROCESSO-MUNICIPIO.md §4.3 */ on: false, render: 'fill', listavel: true,
  },
```

### 4.2 `CAMADAS` — assunto `territorio-mineracao`

Colar depois da linha `brumadinho-restauracao` do bloco `CAMADAS` e antes
de `terras-indigenas`:

```js
  {
    id: 'documentos-processo-municipios', assunto: 'territorio-mineracao',
    label: 'Documentos do processo que citam o município',
    hint: '471 documentos do processo judicial da reparação de Brumadinho que citam, pelo nome, um município de Minas — 53 municípios, de Brumadinho (192 documentos) a seis cidades com 1. A ficha traz a contagem por tipo de documento e por processo; a lista completa, com resumo e link para o original, fica em /paraopeba/documentos.',
    aviso: 'Só 471 dos 7.107 documentos do acervo (6,6%) têm município identificado. O mapa mostra onde o acervo CITA, não onde o dano FOI: município ausente daqui NÃO é município não atingido. "Cita" não é "é sobre", e as contagens não se somam entre municípios (1.149 menções para 471 documentos, porque um documento cita vários).',
    fontes: ['documentos-processo-municipios'],
  },
```

**Sem `regioes`, e o motivo é medido:** os 53 municípios atravessam a bacia
do Paraopeba (Brumadinho, Betim, Juatuba…) e a do Rio Doce (Mariana, Rio
Doce, Santa Cruz do Escalvado, Governador Valadares — o processo cita
Mariana como precedente). Declarar `regioes: ['bacia']` esconderia a
segunda metade de quem filtrasse por região, e declarar as duas afirmaria
um recorte que a fonte não tem. Mesma decisão, pelo mesmo tipo de razão,
que `cfem-municipios` e `normas-geolocalizadas` já registram.

### 4.3 Por que `territorio-mineracao`, e por que o âmbar da ressalva

**Assunto — recomendado: `territorio-mineracao`.** É onde as 8 camadas de
Brumadinho já moram, e quem liga "Brumadinho — área REALMENTE atingida" é
exatamente quem procura "o que o processo diz sobre a minha cidade". A
seção se chama "Território indígena, mineração e barragens", e o rompimento
da B1 já é, de fato, seu terceiro tema.

Contra-argumento registrado, não escondido: a seção já tem 18 linhas — a
maior de longe (a segunda tem 5) — e um acervo judicial não é território
nem mineração. **Criar um assunto novo (`'brumadinho'`, "O rompimento da
B1 e a reparação") foi considerado e NÃO é proposto agora por uma razão
só: ele nasceria certo com 9 linhas (as 8 da Semad + esta), o que é uma
reorganização das 8 existentes — decisão do dono sobre camadas que já estão
publicadas, não efeito colateral de uma camada nova.** Se essa
reorganização acontecer, esta linha vai junto com a família B1, não com
`sigmine-*`.

**Cor — recomendada: `0xf8b651`, a irmã mais clara de `--caution`.** Conferida contra
`css/tokens/colors.css` de duas formas:

1. **Conversão validada.** O conversor oklch→sRGB usado aqui reproduz
   exatamente os hex que o próprio arquivo declara: `--caution`
   `oklch(0.754 0.139 75)` → `#e2a138`, `--layer-cfem`
   `oklch(0.754 0.139 88.5)` → `#d3a931`, `--danger`
   `oklch(0.754 0.139 25)` → `#fb8a82`. Só depois disso os candidatos novos
   foram medidos.
2. **O círculo de matiz está cheio — medido, não sentido.** Conjunto usado:
   as hues de `colors.css` (13,4 / 25 / 55,9 / 75 / 88,5 / 102 / 128,8 /
   146,05 / 163,2 / 181,9 / 202,7 / 223,5 / 232,7 / 248,85 / 265 / 279,25 /
   293,5 / 311,75 / 330 / 351,7) **mais** as 8 calculadas na leva de
   Brumadinho, que só vivem nos comentários de `config.js` (2,55 / 40,45 /
   65,45 / 115,4 / 172,55 / 192,3 / 213,1 / 340,85), **mais** a de
   `atos-area-protegida-municipios`. A maior lacuna restante é **18,25°**
   (entre 311,75 e 330, e entre 293,5 e 311,75) — o meio dá **9,1° de
   folga**, abaixo do piso de **11,6°** que `colors.css` fixou como
   precedente (`--danger` × `--layer-noticias`). E as duas vizinhas dessa
   lacuna são `--layer-mancha-inundacao` (irmã de tela desta camada) e
   `--fiction` (o slot reservado a dado fictício) — os dois piores vizinhos
   possíveis. **Não existe hue nova honesta para esta camada.**

   *Nota medida, sobre a camada dos outros, não sobre esta:* o comentário
   de `atos-area-protegida-municipios` declara hue **298,8°**, mas o hex que
   ele fixa (`0xeb8dec`) mede **oklch(0,774 0,164 326,65)** — L e C fora da
   família (.754/.139) e a **3,2° de `--fiction`** (329,88). Não corrigi
   (a camada é de outra entrega e `config.js` está fora do meu escopo), e
   **a conclusão acima não depende disso**: com 298,8 ou com 326,65 no
   conjunto, a maior lacuna continua sendo 18,25° e a folga 9,1°.
3. **Âmbar é o significado certo.** `colors.css` define `--caution` como
   "ressalva, dado parcial", e esta camada é a definição de dado parcial:
   6,6% do acervo, e "cita" em vez de "é sobre". O precedente de reusar
   token semântico em vez de inventar cor já existe cinco vezes no registro
   de hoje (`checagem-g0` e `alerta-territorio-sigmine-interesse` →
   `--caution`; `alerta-ti-mancha`, `alerta-quilombola-mancha` e
   `alerta-territorio-sigmine-operacao` → `--danger`).

**Ressalva honesta:** isto faz a **terceira** camada `fill` + `listavel` em
âmbar (`checagem-g0`, `alerta-territorio-sigmine-interesse` e esta). O
precedente do embargo (comentário de `--layer-embargos`) alerta contra
colar duas camadas na mesma cor — mas aquele caso era diferente: um FATO
(auto de infração lavrado) vestindo a cor da ressalva. Aqui as três dizem a
mesma coisa: "leia a ressalva antes de concluir". Duas delas, porém,
ficariam na MESMA seção (`alerta-territorio-sigmine-interesse` e esta, em
`territorio-mineracao`) — e é aí, e só aí, que a repetição incomoda de
verdade: ligadas juntas, "território sob interesse minerário" e "documentos
que citam o município" seriam dois âmbares sobrepostos com significados
sem relação.

**Por isso a proposta é a irmã mais clara do mesmo matiz**, e não o âmbar
puro — o mesmo recurso que `--layer-vazio-curvelo` já usa para dizer "mesmo
método, outro recorte", aqui dizendo "mesma ressalva, outra camada":

| Opção | Valor | Quando escolher |
|---|---|---|
| **Proposta** | `0xf8b651` = `oklch(0.82 0.139 75)` | mantém o significado do âmbar e não se confunde com a camada de interesse minerário, que fica na mesma seção |
| Alternativa | `0xe2a138` = `var(--caution)` | se o dono preferir zero valor de cor novo no arquivo; aceita os dois âmbares na mesma seção |

`oklch(0.82 0.139 75)` = `#f8b651`, medido com o mesmo conversor validado.
**Não use L .845** (o degrau exato do par `vazio-bacia`/`vazio-curvelo`):
neste matiz ele sai da gama do sRGB (R = 256,8, seria clipado, e a cor
publicada deixaria de ser a cor declarada) — medido, não presumido. L .82 é
o degrau mais alto que cabe: separação de 0,066 em L contra os 0,091 do par
do vazio. Menor, e é o máximo honesto aqui.

### 4.4 Ícone (opcional, e fora do escopo desta entrega)

`js/ui/icones.js` não foi tocado (fora do escopo). Sem entrada lá,
`criarIconeCamada` devolve `null` e a linha cai no marcador de forma+cor de
sempre — não quebra. Se quiser ícone sem escrever SVG novo, uma linha em
`ICONE_POR_CAMADA` resolve com um ícone já definido no arquivo:

```js
  'documentos-processo-municipios': 'scroll-text',
```

(`'gavel'` seria mais preciso, mas não está entre as definições atuais —
exigiria copiar o miolo do `lucide-static`, com a conferência que o
cabeçalho de `icones.js` exige.)

---

## 5. Proveniência

`ORIGENS` em `apps/web/scripts/gerar-proveniencia-globo.mjs` ganhou a
entrada `documentos-processo-municipios`, marcada **`derivada`** (e não
`automatica`) de propósito: o script não chama serviço externo nenhum —
ele conta o que o portal já publica.

`dados/proveniencia.json` foi atualizado com a entrada nova (feições 53,
bytes 193.055, sha256, mtime), e `gerado_em_utc` passou para a data desta
camada, que é a mais recente do acervo — que é exatamente a regra do
gerador.

**Duas sessões no mesmo worktree, e como isso apareceu aqui.** Enquanto
esta camada era gerada, outra sessão trabalhava no MESMO worktree
(camadas `alerta-raio-territorio-sigmine-*` e `js/config.js`). Por isso a
entrada desta camada foi primeiro inserida à mão em `proveniencia.json`,
na posição exata que o gerador daria (ordem alfabética de arquivo, entre
`devolutas-arrecadadas` e `embargos-ambientais-vales`) — rodar a geração
completa naquele instante teria arrastado camadas ainda não versionadas da
outra sessão para dentro do manifesto.

O que ficou no repositório, porém, é a **rodada completa**: a outra sessão
rodou `node scripts/gerar-proveniencia-globo.mjs` logo depois, já com as
`ORIGENS` das duas camadas dela e a desta, e o commit `df02693` levou o
manifesto inteiro regenerado — **incluindo, sem alteração, a entrada desta
camada** (53 feições, 193.055 bytes, sha256
`9e105f1d…`, `obtencao: "derivada"`). Conferido depois do fato: o sha256
do manifesto bate com o do arquivo em disco.

⚠️ **O mesmo commit `df02693` levou junto os arquivos desta entrega**
(script, GeoJSON, `ORIGENS` e este documento), que estavam no índice do
git no momento em que a outra sessão fez `git commit`. Nada se perdeu e
nada foi alterado — mas a mensagem daquele commit fala do handoff de
alertas, não desta camada. Registrado aqui porque a mensagem de commit
deixou de ser o lugar onde a história desta camada está: ela está neste
documento. **Lição operacional, já anotada em outros repos do projeto:
duas sessões no mesmo worktree compartilham o índice do git — quem
trabalha em paralelo commita por caminho (`git commit <path>`), nunca
confia no índice inteiro.**

---

## 6. Lacunas declaradas

- **53 municípios aqui, 81 valores de `places` batendo com nome de
  município no plano.** `docs/PLANO-INGESTAO-PARAOPEBA.md` (2.2) mediu, no
  Solr cru, 81 valores distintos de `places` que batem com município de MG,
  e Brumadinho com 194 documentos; a base publicada (`documentos.ts`) tem
  53 municípios e Brumadinho com 192. **A divergência é real e não foi
  investigada aqui** — investigar exigiria reconsultar o Solr, que esta
  tarefa proíbe. A hipótese provável (e **não confirmada**) é que a
  ingestão que gerou `documentos.ts` usou um casamento mais estrito que a
  medição exploratória do plano — variantes sem acento ou sem sufixo `-mg`
  ("mario campos") teriam entrado na contagem do plano e não na ingestão,
  sem derrubar o total de documentos, que continua 471 dos dois lados.
  Quem for fechar isso: comparar o normalizador da ingestão com o do plano,
  não olhar o mapa.
- **12 menções de tipo "documento de comprovação" estão na base
  publicada.** `ehTipoPessoal` (em `lib/paraopeba/triagem.ts`) casa
  "comprovante", "identificação" e "declaração" — "comprova**ção**" não
  bate, e o plano de fato lista "documento de comprovação" (504 docs no
  acervo) como tipo distinto de "comprovante de residência". **Não é
  decisão desta entrega** (a base publicada é o que é, e `lib/paraopeba/*`
  está fora do escopo), e nesta camada o risco é nulo — só o NOME do tipo e
  uma contagem entram no GeoJSON. Fica registrado como item para a trava
  geral de 18/08 olhar.
- **Nenhuma inferência de município por texto foi feita** — os 5.814
  documentos sem campo de local continuam fora, como
  `docs/PLANO-INGESTAO-PARAOPEBA.md` (2.3, segunda etapa) recomenda: a taxa
  de erro medida é o primeiro produto a gerar, antes da camada.
- **A camada não foi vista rodando no globo** — `config.js` não foi
  editado, então ela ainda não aparece no painel. O GeoJSON foi validado
  como JSON, conferido feição a feição (53 polígonos, todos com geometria
  da malha do IBGE) e medido em bytes, mas o teste visual acontece depois
  de colar as entradas da seção 4.
- **Peso: 193 KB, sem compressão** — bem abaixo do limiar de ~8 MiB que
  `scripts/comprimir-camadas-grandes.mjs` justifica, e da ordem de
  `normas-geolocalizadas` (436 KB). Não leva `comprimida`.

---

*Gerado em 15/08/2026. Toda contagem deste documento saiu da execução real
de `scripts/gerar_camada_documentos_municipio.py` sobre
`apps/web/lib/paraopeba/documentos.ts` nesta data — nenhuma foi copiada de
plano anterior. Os hex de cor foram calculados com um conversor
oklch→sRGB validado contra três tokens já declarados em
`css/tokens/colors.css`.*
