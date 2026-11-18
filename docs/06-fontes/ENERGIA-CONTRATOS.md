# Energia — contratos, outorgas, leilões e impostos (fase 2)

> **Tipo:** FONTE
> **Domínio:** energia elétrica (regulação federal, tarifa, tributos)
> **Última medição:** 2026-11-18 — todos os endpoints abaixo foram chamados nesta data, com User-Agent honesto `finweejur/github artur colito`, ritmo de 1–2 s por host (10 s na ANEEL, conforme o `Crawl-Delay` do portal)
> **Leitura estimada:** longa (> 15 min)
> **Relacionados:** [FONTES.md](FONTES.md), [COLETA-ETICA.md](COLETA-ETICA.md), [OPERACAO.md](../05-operacao/OPERACAO.md), [AGENTS.md](/AGENTS.md), [REGRA-EDITORIAL.md](../01-produto/REGRA-EDITORIAL.md), coletor `scripts/coletar-siga-mg.py`, contrato do dado `apps/web/lib/energia/energia.ts`
> **Palavras-chave:** energia, ANEEL, SIGA, outorga, leilão, CCEAR, CCEE, PLD, CMO, ONS, CVU, tarifa, bandeira tarifária, PIS, COFINS, ICMS, Confaz, SICONFI, contrato bilateral, sigilo

## Sumário

- [O que esta frente entrega, e o que ela não entrega](#o-que-esta-frente-entrega-e-o-que-ela-não-entrega)
- [A regra de ouro: preço de contrato bilateral é sigiloso](#a-regra-de-ouro-preço-de-contrato-bilateral-é-sigiloso)
- [ANEEL — dados abertos](#aneel--dados-abertos)
  - [SIGA: usinas, outorgas, potência e prazo](#siga-usinas-outorgas-potência-e-prazo)
  - [Atos de outorga de geração](#atos-de-outorga-de-geração)
  - [Resultado de leilões de geração](#resultado-de-leilões-de-geração)
  - [Tarifas de aplicação das distribuidoras](#tarifas-de-aplicação-das-distribuidoras)
  - [Componentes tarifárias (onde moram os tributos)](#componentes-tarifárias-onde-moram-os-tributos)
  - [Bandeiras tarifárias](#bandeiras-tarifárias)
- [ONS — CMO, o primo público do PLD](#ons--cmo-o-primo-público-do-pld)
- [CCEE — bloqueio medido, não contornado](#ccee--bloqueio-medido-não-contornado)
- [MME — o que existe, e o que não existe](#mme--o-que-existe-e-o-que-não-existe)
- [Impostos: PIS/COFINS e ICMS](#impostos-piscofins-e-icms)
- [Leis federais do setor](#leis-federais-do-setor)
- [Como o preço se forma](#como-o-preço-se-forma)
- [Coletor entregue nesta fase](#coletor-entregue-nesta-fase)
- [Armadilhas medidas](#armadilhas-medidas)
- [Decisões registradas e próximos passos](#decisões-registradas-e-próximos-passos)

## O que esta frente entrega, e o que ela não entrega

O painel de energia quer responder três perguntas de cidadão:

1. **Quem gera energia em Minas, com que título e até quando?** — sai do SIGA
   e dos atos de outorga.
2. **Por quanto a energia foi vendida, e em que regime?** — sai do resultado
   de leilões (preço público, por empreendimento) e **não** sai para contrato
   bilateral.
3. **Quanto disso chega na conta como tarifa e imposto?** — sai das tarifas
   homologadas, das componentes tarifárias, das bandeiras e da arrecadação
   federal/estadual.

O que o portal **não** publica, por não existir em fonte pública: preço de
contrato bilateral, margem de comercializador, custo de aquisição de cada
distribuidora por usina.

## A regra de ouro: preço de contrato bilateral é sigiloso

Ambiente de Contratação Livre (ACL) é negociação privada entre gerador e
consumidor/comercializador. Nem a ANEEL nem a CCEE publicam o preço por
contrato: o que existe é **preço médio de referência** (boletins de mercado,
índices privados) e o **PLD**, que é preço de liquidação de diferenças — não
preço de contrato.

Consequência editorial: qualquer número de "preço da energia em Minas" no
portal tem de dizer **de onde vem**:

| Número | Origem | Status |
|---|---|---|
| Preço de leilão (R$/MWh) | ANEEL, resultado de leilões | público, por empreendimento |
| Preço-teto e deságio | ANEEL, mesmo arquivo | público |
| PLD | CCEE | público em tese; acesso bloqueado para este host (ver [CCEE](#ccee--bloqueio-medido-não-contornado)) |
| CMO | ONS, dados abertos | público, CSV/Parquet |
| Tarifa homologada | ANEEL, REH | público |
| Preço de contrato bilateral | nenhum órgão | **sigiloso** |

> ⚠️ Nunca apresentar preço de leilão como "preço que o mineiro paga". Leilão
> define o custo de compra da distribuidora por 15–30 anos (medido: mínimo 15,
> máximo 30 anos em `MdaDuracaoContrato`); a conta do cidadão ainda recebe
> transmissão, distribuição, encargos e tributos.

## ANEEL — dados abertos

Portal: <https://dadosabertos.aneel.gov.br> (CKAN). Licença de todos os
conjuntos medidos: **ODbL 1.0** (Open Data Commons Open Database License) —
uso livre com atribuição e compartilhamento igual. **Nenhum conjunto exige
cadastro nem token.**

| Conjunto | Formato | Volume medido (18/11/2026) | Atualização |
|---|---|---|---|
| SIGA — empreendimentos de geração | CSV / XML | 7,9 MB · 25.046 linhas | diária (conjunto datado 2026-11-01) |
| Atos de outorga de geração | CSV | 14,5 MB · 60.754 linhas | mensal (mod. 2026-11-01) |
| Resultado de leilões de geração | CSV | 423 kB · 1.552 linhas | por leilão (último: 2025-08-22) |
| Tarifas de aplicação das distribuidoras | CSV / XML / Parquet | 82,6 MB · 303.694 linhas | diária |
| Componentes tarifárias | CSV / Parquet por ano | 200–343 MB/ano em CSV · 3,6–5,1 MB/ano em Parquet | anual, 31 recursos |
| Bandeiras tarifárias | CSV | 6,5 kB (acionamento) · 7,2 MB (conta bandeira) | mensal |

### SIGA: usinas, outorgas, potência e prazo

- **Dataset:** <https://dadosabertos.aneel.gov.br/dataset/siga-sistema-de-informacoes-de-geracao-da-aneel>
- **Arquivo usado:** `siga-empreendimentos-geracao.csv` (o UUID do recurso muda
  quando a ANEEL republica; o coletor resolve pela API `package_show`).
- **Formato:** CSV com `;`, aspas duplas, **UTF-8 com BOM**, decimal com
  vírgula. 23 colunas.
- **Volume medido:** 7.883.527 bytes · 25.046 linhas no Brasil · **1.300 com
  `SigUFPrincipal = MG`** · 1.299 CEG distintos (há 1 repetido na origem).
- **Campos que importam:** `NomEmpreendimento`, `CodCEG`, `SigTipoGeracao`
  (UHE/PCH/CGH/UFV/UTE/EOL), `DscFaseUsina` (Operação/Construção),
  `DscTipoOutorga` (Concessão/Autorização/Registro), `MdaPotenciaOutorgadaKw`,
  `MdaPotenciaFiscalizadaKw`, `MdaGarantiaFisicaKw`, `DatEntradaOperacao`,
  `DatInicioVigencia`, `DatFimVigencia`, `DscMuninicpios`, `DscSubBacia`.
- **Distribuição em MG (medida):** UFV 574 · UTE 446 · CGH 142 · PCH 67 ·
  UHE 54 · EOL 17. Fase: Operação 946 · Construção não iniciada 350 ·
  Construção 4.
- **O que não tem:** preço, contrato, comprador, tarifa. SIGA é cadastro
  técnico-regulatório, não comercial.

### Atos de outorga de geração

- **Dataset:** <https://dadosabertos.aneel.gov.br/dataset/atos-de-outorgas-de-geracao>
- **Arquivo:** `atos-outorgas-aneel.csv` — 14.518.845 bytes · 60.754 linhas ·
  20 colunas · **latin-1** (não UTF-8; ver [armadilhas](#armadilhas-medidas)).
- **Cobertura:** 2015-01-06 a 2026-10-28 · **7.981 linhas com `SigUF = MG`**.
- **Tipos de ato:** despacho 49.725 · resolução 7.952 · pleito 1.481 ·
  portaria 739 · termo aditivo 453.
- **Para que serve:** é o **histórico** do título (transferência de
  titularidade, suspensão, ampliação), enquanto o SIGA mostra só o estado
  atual. É aqui que aparece "a outorga foi suspensa em tal data".
- **Limite:** o arquivo traz `NomAgente` (empresa) — dado de pessoa jurídica,
  não de pessoa física; mesmo assim o portal publica só contagem por ato, não
  a lista de nomes.

### Resultado de leilões de geração

- **Dataset:** <https://dadosabertos.aneel.gov.br/dataset/resultado-de-leiloes>
- **Arquivo:** `resultado-leiloes-geracao.csv` — 422.878 bytes · 1.552 linhas ·
  26 colunas · **latin-1**.
- **Campos de preço:** `VlrPrecoLeilao` (R$/MWh), `VlrPrecoTeto`,
  `VlrDesagio` (%), `VlrPrecoDolar` (quando o leilão é indexado ao dólar),
  `MdaDuracaoContrato` (15–30 anos).
- **Medição:** preço de leilão de R$ 0 a R$ 604/MWh no Brasil (mediana
  R$ 135/MWh); **77 linhas com UF principal MG**, preços de R$ 60 a
  R$ 402/MWh. Último leilão no arquivo: 2025-08-22. Tipos: A-3, A-4, A-5,
  A-6, Estruturante, FA (fontes alternativas) e LER (reserva).
- **Limite:** cobre o **ambiente regulado**. Leilão não registra o preço do
  contrato bilateral posterior.

### Tarifas de aplicação das distribuidoras

- **Dataset:** <https://dadosabertos.aneel.gov.br/dataset/tarifas-distribuidoras-energia-eletrica>
- **Arquivo:** `tarifas-homologadas-distribuidoras-energia-eletrica.csv` —
  82.613.216 bytes · 303.694 linhas · 17 colunas · **UTF-8 com BOM**.
- **Cobertura medida:** 116 distribuidoras, histórico desde 2010
  (`DatInicioVigencia` mais antigo: 2010-02-03). **CEMIG-D: 8.108 linhas**,
  vigência mais recente 2026-05-28.
- **Colunas de preço:** `VlrTUSD` e `VlrTE` (R$/MWh ou R$/kW conforme
  `DscUnidadeTerciaria`), segmentadas por `DscSubGrupo` (B1, B3, A2…),
  `DscModalidadeTarifaria` (Convencional, Branca, Verde, Azul) e `DscClasse`.
- **Atenção:** cada linha é uma **combinação** de subgrupo × modalidade ×
  classe × posto tarifário. Filtrar sem escolher o recorte devolve 30 linhas
  "residenciais" para a mesma data. O arquivo tem 82 MB porque guarda
  **treze anos** de homologações.

### Componentes tarifárias (onde moram os tributos)

- **Dataset:** <https://dadosabertos.aneel.gov.br/dataset/componentes-tarifarias>
- **31 recursos**, um CSV e um Parquet por ano (2012 em diante). CSV de
  200–343 MB por ano; **Parquet de 3,6 a 5,1 MB por ano** — usar Parquet é a
  diferença entre baixar 2 GB e 60 MB.
- **Para que serve:** abre a tarifa em parcelas — custo de energia, TUST,
  distribuição, encargos setoriais e **PIS/COFINS/ICMS**. É a única fonte
  pública que mostra o peso do tributo **dentro** da tarifa homologada.
- **Limite:** não é o valor arrecadado; é o percentual/parcela embutido na
  tarifa daquela distribuidora naquele processo.

### Bandeiras tarifárias

- **Dataset:** <https://dadosabertos.aneel.gov.br/dataset/bandeiras-tarifarias>
- **Acionamento:** `bandeira-tarifaria-acionamento.csv` — 6.499 bytes ·
  143 linhas · colunas `DatCompetencia`, `NomBandeiraAcionada`,
  `VlrAdicionalBandeira` (R$/MWh). Medido: novembro/2026 = **Verde, R$ 0**.
- **Adicional:** `bandeira-tarifaria-adicional.csv` — 1.968 bytes (histórico
  dos valores por cor).
- **Conta bandeira:** `bandeira-tarifaria-conta-bandeira.csv` — 7.161.133
  bytes (arrecadação/repasse por distribuidora).
- **Para que serve:** explica por que a conta sobe num mês sem mudança de
  tarifa homologada. É o item mais volátil do painel.

## ONS — CMO, o primo público do PLD

- **Portal:** <https://dados.ons.org.br> (CKAN) · `robots.txt` com
  `Disallow: /api/` e `Crawl-Delay: 10`, mesma leitura registrada para a ANEEL
  (a API é a interface documentada do dado aberto; ver
  [decisões](#decisões-registradas-e-próximos-passos)).
- **Conjunto:** `cmo-semanal` —
  <https://dados.ons.org.br/dataset/cmo-semanal> · 68 recursos · licença
  **CC-BY** · `metadata_modified` 2026-11-18 22:00 (quase tempo real).
- **Formato:** CSV, Parquet e XLSX por ano, servidos em
  `ons-aws-prod-opendata.s3.amazonaws.com`. Exemplo medido:
  `CMO_SEMANAL_2026.csv`.
- **O que é:** Custo Marginal de Operação por submercado (SE/CO, S, NE, N),
  em R$/MWh, semana a semana. É a base física do PLD.
- **Por que entra no painel:** o PLD é da CCEE e está bloqueado (abaixo); o
  CMO é do ONS, é aberto e explica o mesmo fenômeno — a energia mais cara que
  o sistema precisou despachar.

## CCEE — bloqueio medido, não contornado

- **Tentativa:** `https://dadosabertos.ccee.org.br/` em 18/11/2026, com UA
  honesto → **HTTP 403** com página "acesso bloqueado / access blocked",
  `Error code: 0.868041c9.1795040782.6ee0a9bc`, pedindo revisão do time de
  Segurança/TI da CCEE.
- **Leitura:** é WAF de borda (política de segurança), não `robots.txt`. Não
  há `robots.txt` acessível para ler: a resposta é a própria página de
  bloqueio.
- **Decisão:** **não contornar.** Sem UA de navegador falso, sem laço de
  retentativa. PLD e relatórios de liquidação ficam fora do painel até a CCEE
  liberar acesso programático ou o dono pedir formalmente (a CCEE atende em
  `atendimento@ccee.org.br` / 0800 591 4185, conforme a própria página).
- **O que se perde:** PLD horário/semanal oficial e o relatório de liquidação
  do mercado de curto prazo.
- **Substituto parcial:** CMO do ONS (acima) e, para contratos regulados, o
  resultado de leilões da ANEEL.

## MME — o que existe, e o que não existe

- **Dados abertos do MME:** <https://dadosabertos.mme.gov.br> responde 200,
  mas o CKAN tem **5 conjuntos** em 18/11/2026: Luz para Todos, Sistema Vetor,
  atos de outorga ligados a processos minerários, atos de enquadramento no
  REIDI e o SIE Brasil (descontinuado, 0 recursos). **Não há conjunto de
  leilões nem de planos.**
- **Página de leilões:** `https://www.gov.br/mme/pt-br/assuntos/leiloes`
  devolve **404**; `leiloes-de-energia` também. O `robots.txt` do `gov.br/mme`
  libera tudo (`Disallow:` vazio). O resultado de leilão, esse sim, está na
  ANEEL — é lá que o painel lê.
- **Plano Nacional de Energia (PNE):** publicado pela **EPE**, não pelo MME:
  <https://www.epe.gov.br/pt/leiloes-de-energia/leiloes> (200) e
  <https://www.epe.gov.br/pt/publicacoes-dados-abertos/publicacoes/Plano-Nacional-de-Energia-2050>
  (200). É PDF/estudo, sem CSV — serve para texto de contexto, não para série.
- **Portarias:** ficam em páginas `gov.br` (HTML/PDF), sem API. Para o painel,
  portaria entra como citação com data e link, nunca como número calculado.

## Impostos: PIS/COFINS e ICMS

### PIS/COFINS — Receita Federal, arquivo por UF (verificado)

- **Arquivo:** <https://www.gov.br/receitafederal/dados/arrecadacao-estado.csv>
  — **200 · 2.424.865 bytes · 8.667 linhas · 45 colunas · latin-1**.
- **Estrutura:** `Ano`, `Mês`, `UF` e 42 colunas de tributo, entre elas
  `COFINS`, `COFINS - DEMAIS`, `CONTRIBUIÇÃO PARA O PIS/PASEP`,
  `PIS/PASEP - DEMAIS` (as colunas "total" vêm vazias nos meses recentes;
  o valor está nas colunas "DEMAIS").
- **Cobertura medida:** desde 2000; **último mês: setembro/2026**. MG: 321
  linhas. Valores em reais, decimal com vírgula (o arquivo não traz
  dicionário).
- **Exemplo medido (MG, set/2026):** `COFINS - DEMAIS` R$ 2.188.261.952,00 e
  `PIS/PASEP - DEMAIS` R$ 607.283.362,80.
- **Limite:** é arrecadação **total** do tributo na UF, de todos os setores —
  não existe recorte "energia elétrica". Para dizer "quanto do PIS/COFINS vem
  da conta de luz" seria preciso cruzar com a componentes tarifárias e a
  arrecadação total, e mesmo assim é rateio estimado, não medido.
- **Página-mãe:** <https://www.gov.br/receitafederal/pt-br/acesso-a-informacao/dados-abertos/receitadata/arrecadacao>
  (200). As páginas internas montam o link do arquivo por JavaScript: o URL
  estável acima foi descoberto por medição, não por navegação.
- **Plataforma nacional:** a API nova do `dados.gov.br`
  (`/api/publico/conjuntos-dados/...`) respondeu **401 — exige chave**. Não é
  caminho para coletor sem credencial.

### ICMS — Tesouro Nacional (verificado) e Confaz (regras)

- **Arrecadação por estado (recomendado):** API SICONFI do Tesouro,
  <https://apidatalake.tesouro.gov.br/ords/siconfi/tt/rreo>, **sem token**.
  Consulta medida:
  `.../tt/rreo?an_exercicio=2025&nr_periodo=6&co_tipo_demonstrativo=RREO&no_anexo=RREO-Anexo%2003&id_ente=31`
  (31 = MG) → 420 itens JSON; conta `ICMS` = **R$ 7.094.343.937,28** na coluna
  `MR-11` (acumulado até o 6º bimestre de 2025).
- **Credenciamento de entes:** `.../tt/entes` → 866.510 bytes de JSON com
  `cod_ibge`, `uf`, `esfera`, `populacao`. Útil para casar o nome do município
  com o código IBGE do portal.
- **Regra de ICMS (alíquota):** Confaz,
  <https://www.confaz.fazenda.gov.br/legislacao/convenios_arrecadacao> (200) —
  convênios de arrecadação, ICMS retido na fonte, tributos estaduais. É
  **HTML com PDFs**, sem CSV: serve para citar a regra, não para série.
- **Limite:** o RREO entrega o ICMS **arrecadado** pelo estado, não o ICMS
  **da energia**. O recorte setorial não é público em série aberta.

## Leis federais do setor

| Lei | O que estabelece | Link verificado em 18/11/2026 |
|---|---|---|
| 10.848/2004 | Lei de Comercialização de Energia Elétrica: cria o ACR/ACL, leilões, CCEAR | <https://www.lexml.gov.br/urn/urn:lex:br:federal:lei:2004-03-15;10848> — 200, título "Lei de Comercialização de Energia Elétrica" |
| 9.074/1995 | Concessões e permissões; produtor independente; autoprodução | <https://www.lexml.gov.br/urn/urn:lex:br:federal:lei:1995-07-07;9074> — 200 |
| 8.987/1995 | Regime de concessão e permissão de serviço público (tarifa, equilíbrio econômico) | <https://www.lexml.gov.br/urn/urn:lex:br:federal:lei:1995-02-13;8987> — 200 |
| 14.182/2021 | Desestatização da Eletrobras e contratação de energia de reserva | <https://www.lexml.gov.br/urn/urn:lex:br:federal:lei:2021-07-12;14182> — **503** nas duas datas testadas |

- **Planalto:** `planalto.gov.br` **não respondeu** a este host em 18/11/2026
  (`http` e `https`, conexão derrubada, code 000, com UA honesto). O
  [FONTES.md](FONTES.md) já registra que o Planalto responde só a UA de
  navegador — o que este repositório **não** usa. Por isso a citação aponta
  para o LexML, que é a referência oficial de URN de legislação federal.
- **Congresso:** o portal já indexa o Congresso Nacional para proposições; a
  lei sancionada continua sendo lida no LexML/Planalto, não na ficha de
  tramitação.
- **Pendência:** 14.182/2021 ficou sem link estável (LexML em 503). Antes de
  publicar texto sobre Eletrobras, abrir a lei à mão e citar com data de
  acesso.

## Como o preço se forma

A cadeia tem seis elos. Cada elo tem uma fonte pública — e um ponto em que o
dado **deixa** de ser público.

```
outorga  →  leilão / CCEAR  →  despacho (CMO)  →  PLD  →  CVU  →  tarifa + impostos
  SIGA        ANEEL            ONS              CCEE    ONS/CCEE   ANEEL / RFB / SICONFI
público     público          público          bloqueado  parcial   público (agregado)
```

1. **Outorga.** A ANEEL dá o título: concessão (UHE, 30–35 anos), autorização
   (PCH, CGH, UFV, UTE) ou registro (micro e minigeração). O título define
   potência, prazo e se a usina pode vender energia. Fonte: SIGA e atos de
   outorga — `fimVigencia` é a data que devolve o rio ao processo.
2. **Leilão.** No ambiente regulado, a distribuidora compra por leilão
   (A-3 a A-6, LER, fontes alternativas). O edital fixa o **preço-teto**; o
   gerador dá lance; sai o **preço de leilão** (R$/MWh), o **deságio** e o
   **prazo do contrato** — 15 a 30 anos no arquivo medido. Esse preço é
   público e por empreendimento, o que é raro no setor elétrico.
3. **CCEAR.** O contrato que nasce do leilão (Contrato de Comerciação de
   Energia no Ambiente Regulado) amarra volume e preço por décadas. É o que
   faz a conta do cidadão demorar a sentir uma queda de preço de leilão: o
   contrato antigo continua valendo até vencer.
4. **Despacho e CMO.** Quem decide qual usina liga é o ONS, por ordem de
   mérito (mais barata primeiro). O custo marginal da última usina acionada é
   o **CMO**, publicado semanalmente por submercado — dado aberto, CSV/Parquet.
5. **PLD.** A CCEE converte o custo em **preço de liquidação de diferenças**,
   semanal, limitado por piso e teto. É o preço do mercado de curto prazo, não
   o da conta. *(Acesso programático bloqueado nesta data; ver seção da CCEE.)*
6. **CVU.** Cada térmica declara seu **custo variável unitário** ao ONS/CCEE:
   combustível + O&M. O CVU decide se a térmica entra no despacho — e é a
   razão pela qual uma térmica a óleo pode definir o preço de todo o
   submercado numa semana seca.
7. **Tarifa.** A ANEEL homologa a tarifa da distribuidora em REH: `VlrTE`
   (energia) + `VlrTUSD` (uso do fio), com parcela A (custo de energia e
   transmissão, repassado) e parcela B (distribuição, reajustada por IPCA e
   fator X). Por cima: encargos (CDE), **bandeira tarifária** do mês e
   tributos.
8. **Impostos.** PIS/COFINS (federal, ~9,25% na conta, embutido nas
   componentes tarifárias) e ICMS (estadual, alíquota de ~18% em MG). O
   arquivo de componentes tarifárias mostra o percentual dentro da tarifa; a
   arrecadação por UF mostra o total recolhido — nunca "o imposto da energia"
   isolado.

**Exemplo com números medidos (18/11/2026):**

| Elo | Número | Onde foi medido |
|---|---|---|
| Leilão MG | R$ 60 a R$ 402/MWh (77 linhas) | `resultado-leiloes-geracao.csv` |
| Leilão BR | mediana R$ 135/MWh, máximo R$ 604/MWh | mesmo arquivo |
| Contrato | 15 a 30 anos | `MdaDuracaoContrato` |
| Bandeira | novembro/2026 = verde, R$ 0/MWh | `bandeira-tarifaria-acionamento.csv` |
| Tarifa CEMIG-D (B1 baixa renda, vigência 2026-05-28) | TUSD R$ 418,31 + TE R$ 308,76 | `tarifas-homologadas-...csv` |
| COFINS em MG (set/2026) | R$ 2,19 bi no mês, todos os setores | `arrecadacao-estado.csv` |
| ICMS em MG (até o 6º bi/2025) | R$ 7,09 bi | SICONFI RREO Anexo 03 |

> **Regra editorial:** esses números não se somam. Leilão é R$/MWh de energia;
> tarifa é R$/MWh com fio, encargo e imposto; arrecadação é reais do estado
> inteiro. Somar ou comparar direto produz manchete falsa.

## Coletor entregue nesta fase

`scripts/coletar-siga-mg.py` — sem dependência externa (só biblioteca padrão):

```bash
python scripts/coletar-siga-mg.py                 # baixa o CSV e grava o recorte
python scripts/coletar-siga-mg.py --limite 100    # recorte menor
python scripts/coletar-siga-mg.py --entrada arq.csv  # usa CSV já baixado
```

- Resolve a URL do recurso pela API CKAN (o UUID muda quando a ANEEL
  republica), com URL fixa de reserva.
- Filtra `SigUFPrincipal = MG`, ordena por potência outorgada e publica até
  **300 usinas**, com **piso de 10 por tipo** — sem o piso, o corte puro por
  potência publicaria 238 solares e **zero CGH/PCH**, justamente onde nasce
  conflito de bacia.
- Grava `apps/web/data/energia/usinas-mg.json` (~156 kB), com `fonte` e
  `coletadoEm` em **toda linha**.
- Não copia `DscPropriRegimePariticipacao` (nome do titular, às vezes pessoa
  física); guarda só o marcador `REG`/`PIE`.
- Coleta vazia não sobrescreve arquivo bom.

Contrato do dado e funções de leitura: `apps/web/lib/energia/energia.ts`.
Teste: `apps/web/lib/energia/energia.test.ts` (`npx vitest run lib/energia`).

## Armadilhas medidas

| Armadilha | O que aconteceu | Remédio |
|---|---|---|
| **Encoding muda por arquivo** | SIGA é **UTF-8 com BOM**; atos de outorga, leilões e arrecadação da RFB são **latin-1**. Ler tudo como UTF-8 estoura `UnicodeDecodeError` no meio do arquivo | Decodificar com fallback explícito (o coletor tenta `utf-8-sig`, cai para `latin-1`) |
| **`robots.txt` da ANEEL/ONS diz `Disallow: /api/`** | Portal aberto que documenta a API do CKAN na própria home, mas bloqueia `/api/` para crawler | Uma chamada de API por execução, `Crawl-Delay: 10` respeitado, decisão registrada no cabeçalho do coletor |
| **Cloudflare em `git.aneel.gov.br`** | As planilhas de resultado de leilão (`.xlsx`, 210.703 bytes) respondem **200 no HEAD** e **desafio "Just a moment…" no GET** | Não contornar. O CSV equivalente existe no CKAN, que é a fonte usada |
| **CCEE bloqueia o host** | HTTP 403 com código de erro do WAF | Documentado; PLD fora do painel até liberação |
| **`dados.gov.br` API nova pede chave** | 401 em `/api/publico/...` | Usar o arquivo direto do `gov.br/receitafederal/dados/` |
| **Paginação de tarifa** | 303 mil linhas, 82 MB, 13 anos, 116 distribuidoras | Filtrar por `DatInicioVigencia` + `DscBaseTarifaria` + classe antes de qualquer conta |
| **Componentes tarifárias em CSV** | 200–343 MB por ano | Baixar o **Parquet** (3,6–5,1 MB/ano) |
| **CEG repetido** | 1.300 linhas em MG, 1.299 códigos CEG distintos | Não usar CEG como chave única sem tratar duplicata |
| **Data sentinela** | SIGA usa `''` e datas antigas para "sem data"; 545 linhas MG sem `fimVigencia` | Tratar como ausente, nunca como "venceu" |
| **Planalto derruba conexão** | code 000 com UA honesto | Citar LexML e anotar a data de acesso |

## Decisões registradas e próximos passos

**Decisões desta fase (18/11/2026):**

1. **SIGA como fonte do painel de usinas.** É a única base pública com
   potência, outorga, município e prazo na mesma linha.
2. **Leilão da ANEEL como fonte de preço público.** O `xlsx` do
   `git.aneel.gov.br` está atrás de desafio de navegador; o CSV do CKAN tem o
   mesmo conteúdo, com `VlrPrecoLeilao` por empreendimento.
3. **CMO do ONS no lugar do PLD** enquanto a CCEE bloquear o host.
4. **PIS/COFINS e ICMS entram como arrecadação agregada**, com rótulo
   explícito de que não há recorte setorial público.
5. **Recorte de 300 usinas com piso de 10 por tipo** — payload sob controle
   (regra 5.1) sem apagar fonte do mapa.

**O que falta:**

- **PLD oficial**: depende de liberação da CCEE (pedido formal ao dono).
- **CCEAR por usina**: o resultado de leilão dá o preço de estréia; o contrato
  vigente reajustado ano a ano não está em base aberta.
- **ICMS da energia**: só existe o total estadual; o recorte setorial exigiria
  LAI ao estado.
- **Lei 14.182/2021**: link estável pendente (LexML 503).
- **Página pública**: esta fase entrega dado, coletor e teste — a UI é fase
  seguinte.
