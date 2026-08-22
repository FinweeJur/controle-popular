# Handoff: ligar as camadas de dinheiro ao globo 3D

Este documento é para quem estiver com `apps/web/public/terras/globo/js/config.js`
e `js/ui/layerspanel.js` abertos — **eu não toquei em nenhum dos dois**, de
propósito: outro agente estava editando os dois arquivos ao vivo, noutro
worktree, no momento desta entrega, e mexer neles teria dado conflito. O que
existe hoje são só os dois arquivos `.geojson` prontos e o texto abaixo,
dizendo exatamente o que entra em cada lugar.

Leia `docs/FONTES-FLUXO-FINANCEIRO.md` primeiro se quiser o "por quê" por trás
dos números — este documento só cobre o "onde" no config.

---

## 1. Os dois arquivos que já existem

```
apps/web/public/terras/globo/dados/camadas/cfem-municipios.geojson
apps/web/public/terras/globo/dados/camadas/cruzamento-dinheiro-ambiental-4cidades.geojson
```

Mesmo formato das camadas já publicadas ali (`FeatureCollection` com `type`,
`name`, `crs`, `features[]`; cada feature com `properties` + `geometry`) —
conferido contra `embargos-ambientais-vales.geojson` e `municipios-mg.geojson`
antes de escrever. Os dois passaram em `python scripts/checar-dado-pessoal.py
--staged`: nenhum CPF, nenhuma pessoa física, só razão social de empresa e
nome de município.

---

## 2. `cfem-municipios.geojson` — entrada no `LAYER_REGISTRY`

10 municípios, polígono = a malha municipal (`geocodigo` = código IBGE,
mesma malha de `municipios-mg.geojson`, os polígonos foram copiados de lá).
`render: 'fill'`.

```js
{
  id: 'cfem-municipios',
  label: 'CFEM — royalty da mineração por município',
  hint: '10 municípios de MG (Vale do Jequitinhonha + Quadrilátero Ferrífero) e quanto arrecadaram de CFEM em 2024 — de R$ 679 mil em Conselheiro Lafaiete a R$ 346,8 milhões em Congonhas.',
  aviso: 'CFEM arrecadada não é o que a prefeitura recebe: a Lei 13.540/2017 reparte entre União, estado, município produtor e afetados, e o relatório de distribuição por município da ANM está vazio (reconfirmado ao vivo em 13/08/2026). NÃO SOME entre municípios: a mesma guia de uma mineradora pode aparecer inteira em duas cidades ao mesmo tempo (medido: SIGMA MINERAÇÃO, R$ 6,29 milhões, em Itinga E em Araçuaí) — somar dobra o número. Cobertura: 10 de 854 municípios de MG, não é o estado inteiro.',
  color: 0xe8c547,   /* proposto: dourado, hue ~85-90 em oklch — combina com "royalty de mineração".
                         CONFIRA o gap de matiz (>11,6°) contra os vizinhos em colors.css antes de
                         fixar; se colidir com --layer-lotes-vagos (hue 102, #c1b237, também
                         dourado/oliva) ajuste a matiz. */
  on: false, render: 'fill', listavel: true,
  // SEM `regioes`: a camada atravessa Jequitinhonha e Quadrilátero Ferrífero
  // (que nem está na lista REGIOES hoje) — mesmo padrão de
  // 'normas-geolocalizadas', que também não filtra por região.
},
```

Cada feature carrega, em `properties`, os dois avisos acima TAMBÉM como texto
(`aviso_nao_e_repasse_prefeitura`, `aviso_nao_somar_entre_municipios`) e um
`cobertura_da_camada` — para o caso de a ficha/inspetor de clique mostrar
propriedades cruas em vez de (ou além d)o `hint`/`aviso` do registro. Campos
por feature: `nome`, `geocodigo`, `uf`, `cfem_arrecadada_2024`,
`cfem_ano_referencia`, `cfem_substancias_2024`, `cfem_serie_desde/ate`,
`cfem_maior_pagador_2024` + valor, `cfem_atraso_medido_meses` (2, medido).

**Se quiser adicionar um `ASSUNTOS` novo** (`config.js` linha ~155): hoje são
5 (`sem-cadastro`, `terra-publica`, `cidade`, `pistas`, `referencia`) e
nenhum cobre "dinheiro". Sugestão: `{ id: 'dinheiro', titulo: 'Dinheiro
público e mineração' }`, com as duas camadas deste handoff dentro. Sem isso,
`layerspanel.js` cai em "outras" com um aviso no console — funciona, só fica
menos organizado.

---

## 3. `cruzamento-dinheiro-ambiental-4cidades.geojson` — entrada no `LAYER_REGISTRY`

11 pontos (uma licença ambiental por ponto — `render: 'point'`), cada um uma
empresa que tem licença ambiental em algum lugar de MG **e** recebeu
contrato/convênio pago por uma das 4 cidades (Araçuaí, Betim, Diamantina,
Itinga). Coordenada = a da LICENÇA (`ambiental_licenciamento.latitude/
longitude`), que pode ficar em município diferente de quem pagou — isso é
esperado e é o próprio achado (ver `docs/FONTES-FLUXO-FINANCEIRO.md`).

```js
{
  id: 'cruzamento-dinheiro-ambiental-4cidades',
  label: 'Quem tem licença ambiental e recebe dinheiro público',
  hint: '4 empresas que têm licença ambiental em algum lugar de Minas e já receberam R$ 33 milhões em contratos (PNCP) ou convênios federais pagos por Araçuaí, Betim, Diamantina ou Itinga — 11 licenças ambientais ao todo, porque uma mesma empresa (ex. CEMIG) pode ter várias.',
  aviso: 'Cobre só 4 dos 854 municípios de MG (Araçuaí, Betim, Diamantina, Itinga) — os únicos onde contratos/convênios (presos à tabela `municipios`, 6 linhas) já coexistem com o licenciamento ambiental estadual (854 municípios). Ausência de ponto aqui NÃO quer dizer que a empresa não recebe dinheiro público — quer dizer que os outros 850 municípios ainda não têm contrato/convênio coletado para cruzar. O ponto marca ONDE fica a licença ambiental, não a sede de quem pagou. O cruzamento é por RAIZ de CNPJ (8 dígitos): identifica a empresa, mas não distingue matriz de filial.',
  color: 0xd946ef,   /* proposto: magenta/fúcsia, hue ~322 em oklch — sem par no
                         registro hoje (o mais próximo é --layer-noticias, rosa, hue 13.4,
                         gap amplo). CONFIRA antes de fixar, mesmo método do resto do arquivo. */
  on: false, render: 'point', pointSize: 0.007, listavel: true,
  // SEM `regioes`: mistura Jequitinhonha (Araçuaí/Diamantina/Itinga) com
  // Metropolitana (Betim), que nem está nas REGIOES hoje.
},
```

Cada feature carrega `empresa`, `cnpj_raiz`, `setor`, `subsetor`,
`municipio_licenca_nome`, `municipios_pagadores` (array), `valor_total_recebido`,
`quantidade_instrumentos`, `detalhe_instrumentos` (array com
município/instrumento/quantidade/valor por match) e os dois avisos como texto
(`aviso_cobertura`, `aviso_raiz_cnpj`) — mesmo motivo do item 2.

---

## 4. Os números por trás dos dois arquivos, medidos em 13/08/2026

**CFEM 2024** (10 municípios: Araçuaí, Betim ausente — sem CFEM relevante,
Diamantina, Itinga + Itabira, Mariana, Nova Lima, Congonhas, Conselheiro
Lafaiete, Brumadinho, Ouro Preto):

| Município | CFEM arrecadada 2024 |
|---|---:|
| Congonhas | R$ 346.825.175,32 |
| Itabira | R$ 323.389.896,28 |
| Mariana | R$ 266.133.299,29 |
| Nova Lima | R$ 263.912.604,96 |
| Ouro Preto | R$ 143.449.332,16 |
| Brumadinho | R$ 98.947.622,24 |
| Itinga | R$ 9.286.894,81 |
| Araçuaí | R$ 6.367.403,35 |
| Diamantina | R$ 769.617,10 |
| Conselheiro Lafaiete | R$ 679.530,05 |

**Cruzamento cnpj_raiz × dinheiro nas 4 cidades**: 4 empresas (raízes de
CNPJ), 5 instrumentos (4 contratos PNCP + 1 convênio federal), R$
33.028.425,78 no total. Por cidade: Betim (AIR LIQUIDE BRASIL, R$
322.676,40 em 1 contrato; CEMIG GERAÇÃO E TRANSMISSÃO, R$ 20.971.804,32 em 2
contratos; STELLANTIS AUTOMÓVEIS BRASIL, R$ 9.999.990,00 em 1 convênio de
P&D sobre hidrogênio); Diamantina (RIO NOVO SOLUÇÕES URBANAS, R$
1.733.955,06 em 1 contrato de coleta de resíduos). **Araçuaí e Itinga: zero
matches** — não forçado, é o número medido (Itinga não tem NENHUM contrato no
PNCP desde jan/2024, achado já registrado na pesquisa; Araçuaí tem 262
contratos mas nenhum fornecedor bate por `cnpj_raiz` com nenhuma licença
ambiental de MG).
