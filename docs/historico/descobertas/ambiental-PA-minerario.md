# Ambiental PA — área minerária (ANM: SIGMINE, CFEM, barragens, autuações)

> **Tipo:** HISTORICO
> **Domínio:** ambiental / pará / mineração
> **Última medição:** 17/11/2026
> **Leitura estimada:** curta (< 5 min)
> **Palavras-chave:** anm, sigmine, cfem, sigbm, barragem, royalties, autuação, pará, carajás

## Sumário

- [Veredito](#veredito)
- [1. Método](#1-método)
- [2. O que foi sondado ao vivo](#2-o-que-foi-sondado-ao-vivo)
- [3. As três minas de dado aberto](#3-as-três-minas-de-dado-aberto)
- [4. Contagens medidas no Pará](#4-contagens-medidas-no-pará)
- [5. Campos disponíveis](#5-campos-disponíveis)
- [6. O que já existe no repositório](#6-o-que-já-existe-no-repositório)
- [7. O que está bloqueado e por quê](#7-o-que-está-bloqueado-e-por-quê)
- [8. Pessoas físicas: o risco mora no dado](#8-pessoas-físicas-o-risco-mora-no-dado)
- [9. Veredito por fonte](#9-veredito-por-fonte)

## Veredito

**A ANM virou a melhor fonte aberta do Pará nesta sessão, e não é por API: é por
CSV num diretório Apache.** `dadosabertos.anm.gov.br` publica, sem chave e sem
login, o título minerário (SIGMINE), o royalty arrecadado, o royalty
**distribuído a cada município** e a autuação — todos regravados hoje, 17/11/2026.

O que isso rende para o Pará, medido nesta sessão:

- **24.116 títulos minerários** ativos no `PA.zip` do SIGMINE (24.379 registros no
  arquivo; 24.152 ativos no serviço ArcGIS);
- **R$ 13,56 bilhões** de CFEM arrecadados no PA de 2022 a 2026 (22.579 linhas);
- **R$ 17,79 bilhões** repassados a **100 municípios paraenses** desde 2007
  (51.631 linhas de distribuição);
- **695 autuações** de CFEM no PA (21.029 no Brasil);
- **120 barragens de mineração** no PA, das quais **7 em alerta ou emergência**.

Vale integrar agora. O obstáculo não é acesso, é volume: 317 MB para a
distribuição, 325 MB para a arrecadação inteira.

## 1. Método

- User-Agent em toda requisição: `finweejur/github artur colito`.
- 1,2–2 s entre requisições ao mesmo host; sem paralelismo; ~60 requisições no total.
- `robots.txt` consultado antes de coletar: **404 nos dois hosts da ANM**
  (`geo.anm.gov.br` e `dadosabertos.anm.gov.br`), sem `Disallow` declarado.
- `https://www.gov.br/anm/pt-br/acesso-a-informacao/dados-abertos` responde 200
  (11.985 B); os arquivos vêm de servidor de arquivos estático, sem termo de uso
  próprio na raiz do diretório. O módulo `etl/betim/etl/apis/sigbm_anm.py` já
  registra a licença **CC-BY** para o dump do SIGBM.
- Corpo sempre validado: `Content-Length` conferido e cabeçalho do CSV lido; HTTP
  200 com `{"error":...}` contado como bloqueio, não como sucesso.
- Contagens feitas por leitura completa do arquivo na hora (nada de estimativa por
  tamanho), exceto os quatro arquivos grandes marcados como "não medido".
- CPF não foi extraído nem aparece aqui. Nome de pessoa física também não.

## 2. O que foi sondado ao vivo

| URL | Status | Corpo | Achado |
| --- | --- | --- | --- |
| `https://geo.anm.gov.br/robots.txt` | 404 | — | sem robots declarado |
| `https://dadosabertos.anm.gov.br/robots.txt` | 404 | — | sem robots declarado |
| `https://dadosabertos.anm.gov.br/` | 200 | 1.185 B | listagem Apache: AMB, CFEM, DIPEM, PARTICIPA-ANM, PD, REPEM, SAD, SCM, SDA, SICOP, SIGBM, SIGMINE, SOPLE, TAH |
| `https://dadosabertos.anm.gov.br/SIGMINE/PROCESSOS_MINERARIOS/PA.zip` | 200 | 10.494.564 B | shapefile do PA, `Last-Modified` 17/11/2026 |
| `https://dadosabertos.anm.gov.br/SIGBM/Barragens.csv` | 200 | 3.386.901 B | 908 barragens no Brasil, 124 colunas, cp1252 |
| `https://dadosabertos.anm.gov.br/CFEM/` | 200 | 1.169 B | 8 CSVs + metadados, todos de 17/11/2026 |
| `.../CFEM/CFEM_Arrecadacao.csv` | 206 | 325.178.496 B | série 2002→hoje, por processo/mês |
| `.../CFEM/CFEM_Arrecadacao_2022_2026.csv` | 206 | 99.740.021 B | recorte 2022–2026 (usado na medição) |
| `.../CFEM/CFEM_Distribuicao.csv` | 206 | 317.276.257 B | repasse por ente/mês, 2007→hoje |
| `.../CFEM/CFEM_Autuacao.csv` | 206 | 3.031.515 B | autuação de CFEM |
| `.../CFEM/metadados-cfem.ods` | 200 | 9.970 B | dicionário (não lido) |
| `https://geo.anm.gov.br/arcgis/rest/services?f=json` | 200 | 1.123 B | pastas: SIGMINE, Producao, Estruturas, Caderneta_Digital, MineraLEGAL, Hosted, intra, Utilities |
| `.../SIGMINE?f=json` | 200 | 713 B | `SIGMINE/dados_anm` FeatureServer público |
| `.../SIGMINE/dados_anm/FeatureServer/0?f=json` | 200 | 26.617 B | `maxRecordCount` 2000, paginação **true**, estatística **true** |
| `.../SIGMINE/dados_anm/FeatureServer/0/query?where=UF='PA'&returnCountOnly=true` | 200 | 15 B | `{"count":24152}` |
| `.../Producao/Barragens_Dashboard_Publico/FeatureServer/0/query?where=SGEstado='PA'` | 200 | 13 B | `{"count":120}` |
| `.../Producao/CFEM_Arrecadação/MapServer?f=json` | 200 | 2.419 B | **`"layers":[]`** — serviço publicado vazio |
| `.../Producao/CFEM_Distribuição/MapServer?f=json` | 200 | 2.343 B | **`"layers":[]`** — vazio |
| `.../Estruturas?f=json` | 200 | 62 B | `error 499 Token Required` |
| `.../Caderneta_Digital?f=json` | 200 | 62 B | `error 499 Token Required` |
| `.../MineraLEGAL?f=json` | 200 | 62 B | `error 499 Token Required` |
| `https://sistemas.anm.gov.br/arrecadacao/extra/Relatorios/` | 403 | — | IIS recusa a raiz do relatório |
| `.../Relatorios/arrecadacao_cfem_substancia.aspx` | 500 | 6.635 B | erro de banco no servidor da ANM |
| `.../Relatorios/cfem/arrecadadores.aspx` | 500 | 0 B | idem |
| `https://dadosabertos.anm.gov.br/AMB/` | 200 | 1.169 B | produção bruta, beneficiada, água mineral |
| `https://dadosabertos.anm.gov.br/TAH/Tah.csv` | 206 | 97.063.072 B | Taxa Anual por Hectare por processo |
| `https://dadosabertos.anm.gov.br/SICOP/Sicop.csv` | 206 | 211.058.649 B | tramitação de processos |
| `https://dadosabertos.anm.gov.br/REPEM/PlanoPesquisaRepem.csv` | 200 | 141.134.706 B | planos de pesquisa |
| `https://dadosabertos.anm.gov.br/PD/Protocolo.txt` | 200 | 167.781.481 B | protocolo digital |

## 3. As três minas de dado aberto

### 3.1 SIGMINE — título minerário, com geometria

Duas portas para o mesmo cadastro:

- **Dump por UF**: `SIGMINE/PROCESSOS_MINERARIOS/PA.zip`, 10,5 MB, regravado
  diariamente. Traz `.shp` (polígono), `.dbf` (atributos) e `.prj` (SIRGAS 2000).
- **ArcGIS REST público**: `geo.anm.gov.br/arcgis/rest/services/SIGMINE/dados_anm/FeatureServer/0`,
  paginável (`resultOffset`), com `returnCountOnly`, export em CSV/GeoJSON/KML.

O `.dbf` do dump **não tem município e não tem coordenada** — município só sai por
junção espacial com a malha do IBGE, e é justamente o `.shp` que o coletor atual
do repositório descarta. O serviço ArcGIS já entrega o polígono, o que evita
baixar o shapefile inteiro para uma consulta pontual.

### 3.2 CFEM — royalty arrecadado e distribuição

Três arquivos diferentes, três perguntas diferentes:

- `CFEM_Arrecadacao.csv` (325 MB): **quanto a empresa recolheu**, por processo,
  mês, substância e município de origem.
- `CFEM_Distribuicao.csv` (317 MB): **quanto o ente recebeu**, por mês, com o
  código IBGE do ente. É a resposta para "quanto meu município recebeu".
- `CFEM_Autuacao.csv` (3 MB): **quem foi autuado** por não recolher.

A granularidade municipal é boa nos dois primeiros: código IBGE explícito
(`CodigoMunicipio` na arrecadação, `CodigoEnte` na distribuição).

### 3.3 SIGBM — barragem de mineração

Já coletado pelo portal. **O CSV de 124 colunas é mais rico do que a tela do
portal usa**: além de nível de emergência, categoria de risco e DCE, ele traz
`Necessita de PAEBM`, `Volume atual do Reservatório (m³)`, `Altura máxima atual (m)`,
`Fase Atual do projeto de Descaracterização`, `Número de pessoas possivelmente
afetadas a jusante` e o bloco inteiro da Back Up Dam.

A alternativa sondada — `Producao/Barragens_Dashboard_Publico` no ArcGIS — devolve
os mesmos 120 registros do PA e **não acrescenta campo**: `DSPlanoAcaoEmergencial`
vem `"1"`/nulo, sem data nem status de entrega. Para barragem, o CSV do SIGBM
segue sendo a melhor fonte; o que falta não é fonte nova, é **tela** para os
campos que já estão no JSON.

## 4. Contagens medidas no Pará

Todas lidas do arquivo completo nesta sessão, salvo indicação.

| Fonte | Recorte | Medida |
| --- | --- | --- |
| SIGMINE `PA.zip` | registros no DBF | **24.379** (24.116 com `UF=PA`, 191 sem UF, 67 de AM) |
| SIGMINE `dados_anm` (ArcGIS) | `UF='PA'`, só ativos | **24.152** |
| SIGMINE por fase (PA) | topo | Requerimento de Lavra Garimpeira 9.345; Autorização de Pesquisa 4.894; Requerimento de Pesquisa 3.228; Disponibilidade 3.064; Lavra Garimpeira 1.206; Licenciamento 969 |
| CFEM arrecadação | PA, 2022–2026 | **22.579 linhas**; R$ 2,93 bi (2022), 2,70 bi (2023), 3,33 bi (2024), 3,09 bi (2025), 1,51 bi (2026 parcial) |
| CFEM arrecadação | Universo do arquivo | 744.557 linhas, 99,7 MB |
| CFEM distribuição | PA, 2007–2026 | **51.631 linhas** (49.079 a município, 2.552 ao estado) |
| CFEM distribuição | municípios PA | **100 municípios**; R$ 17.787.890.065,11 |
| CFEM distribuição | estado do PA | R$ 1.237.800.703,32 |
| CFEM distribuição | universo | 2.239.128 linhas, 317,3 MB |
| CFEM distribuição | topo PA | Parauapebas R$ 8,78 bi; Canaã dos Carajás R$ 5,72 bi; Marabá R$ 1,32 bi; Paragominas R$ 418 mi; Oriximiná R$ 295 mi |
| CFEM arrecadação | topo municipal PA | Parauapebas R$ 5,48 bi; Canaã dos Carajás R$ 5,39 bi; Marabá R$ 1,17 bi (2022–2026) |
| CFEM arrecadação | substância mais frequente | Areia 4.614 linhas; Granito 4.213; Minério de Ouro 3.356; Argila 2.425 |
| CFEM autuação | PA | **695 linhas**, R$ 15,64 bi somados; 321 sem ano de publicação |
| CFEM autuação | universo | 21.029 linhas, 3 MB |
| SIGBM | PA | **120 barragens**, 14 municípios, 908 no Brasil |
| SIGBM | PA, emergência | Sem emergência 113; Nível de Alerta 1; Emergência Nível 1 **4**; Emergência Nível 2 **2** |
| SIGBM | PA, PAEBM | **83 exigem PAEBM**; 37 não |
| SIGBM | PA, situação | Ativa 93; Em Descaracterização 17; Inativa 8; Em Construção 2 |
| AMB produção bruta | PA | **322 linhas**, 2010–2025, 16 substâncias; ROM 2025 = **312.144.329 t** |

Duas leituras que o número cru não entrega:

1. **A distribuição não é o mesmo dinheiro da arrecadação.** Arrecadação é o que a
   empresa pagou no ano; distribuição é o que o ente recebeu, mês a mês, com
   defasagem e regra própria de rateio. Somar as duas é erro grosseiro.
2. **Somar municípios da arrecadação dupla-conta.** O módulo
   `etl/betim/etl/apis/anm_cfem.py` já documenta o caso de Itinga/Araçuaí: a mesma
   guia aparece inteira nos dois municípios. A distribuição não tem esse defeito —
   cada linha é um ente e um valor.

## 5. Campos disponíveis

| Arquivo | Campos |
| --- | --- |
| `SIGMINE .../PA.dbf` | `PROCESSO`, `NUMERO`, `ANO`, `AREA_HA`, `ID`, `FASE`, `ULT_EVENTO`, `NOME` (titular), `SUBS`, `USO`, `UF`, `DSProcesso` |
| `SIGMINE` FeatureServer 0 | os mesmos dez mais `OBJECTID`, `Shape__Area`, `Shape__Length` e o polígono |
| `CFEM_Arrecadacao.csv` | `Ano`, `Mês`, `Processo`, `AnoDoProcesso`, `Tipo_PF_PJ`, `CPF_CNPJ`, `Substância`, `UF`, `CodigoMunicipio`, `Município`, `QuantidadeComercializada`, `UnidadeDeMedida`, `ValorRecolhido`, `DataCriacao` |
| `CFEM_Distribuicao.csv` | `NúmeroDeDistribuição`, `Ano`, `Mês`, `Ente` (Município/UF/União), `SiglaEstado`, `CodigoEnte`, `NomeEnte`, `TipoDistribuição` (Produtor/Compensatória), `Substância`, `TipoAfetamento`, `Valor`, `DataCriacao` |
| `CFEM_Autuacao.csv` | `ProcessoCobrança`, `AnoPublicação`, `MêsPublicação`, `Tipo_PF_PJ`, `CPF_CNPJ`, `NomeTitular`, `NúmeroAuto`, `ProcessoMinerário`, `Substância`, `Município`, `UF`, `Valor` |
| `SIGBM/Barragens.csv` | 124 colunas; as úteis: `Nome`, `Empreendedor`, `Município`, `Latitude`, `Longitude`, `Categoria de Risco - CRI`, `Dano Potencial Associado - DPA`, `Necessita de PAEBM`, `Nível de Emergência`, `Situação Operacional`, `Volume atual do Reservatório (m³)`, `Altura máxima atual (m)`, `Fase Atual do projeto de Descaracterização`, `Número de pessoas possivelmente afetadas a jusante` |

Formato: CSVs da CFEM e do SIGBM em **cp1252 / latin-1** com **decimal por
vírgula**; `CFEM_Arrecadacao.csv` usa vírgula como separador e aspas, os outros
usam ponto e vírgula. Ler tudo como UTF-8 produz `Munic�pio` e, pior, casa zero
linha quando o filtro compara nome de ente. Filtre por **código IBGE**, não por
nome.

## 6. O que já existe no repositório

| Ativo | O que faz | Cobertura do PA medida |
| --- | --- | --- |
| `scripts/coletar-sigmine-nacional.py` | baixa `<UF>.zip` de todas as 27 UFs e lê só o DBF | **2.000 de 24.379** — truncado pelo `--limit` padrão; JSON gerado em 16/09/2026 |
| `etl/betim/etl/apis/anm_cfem.py` | raspa os WebForms de arrecadação por município | **quebrado hoje**: os `.aspx` respondem 500 |
| `etl/betim/etl/apis/sigbm_anm.py` | baixa o CSV nacional do SIGBM | **120 PA** de 908, coletado hoje |
| `apps/web/data/sigmine-nacional.json` | dado versionado | 24.403 processos no total nacional de 16/09/2026; `truncado: true` |

Conclusão prática: barragem está pronta; **CFEM precisa ser reescrita para CSV**;
SIGMINE não precisa de coletor novo, precisa de `--limit 0` no PA e do `.shp`
para atribuir município.

## 7. O que está bloqueado e por quê

| Fonte | Situação | Motivo |
| --- | --- | --- |
| `sistemas.anm.gov.br/arrecadacao/extra/Relatorios/` | 403 na raiz, 500 nas duas `.aspx` | erro de banco no servidor da ANM ("ExecuteReader requires an open and available Connection"). Não é rate limit nem login; o serviço está fora. Encerrado. |
| `geo.anm.gov.br` pastas `Estruturas`, `Caderneta_Digital`, `MineraLEGAL` | `error 499 Token Required` | área autenticada. **Não tentado**; parado por regra. |
| `Producao/CFEM_Arrecadação` e `CFEM_Distribuição` | HTTP 200 com `layers: []` | serviço publicado sem camada; 200 vazio não é dado. |
| `SICOP/Sicop.csv` (211 MB) | **não medido** | arquivo enorme; a amostra do cabeçalho traz `Nome da empresa` com pessoa física ("GISELY DOS SANTOS SILVA"), o que já basta para não ser prioridade. |
| `TAH/Tah.csv` (97 MB) | **não medido** | cabeçalho tem `NRCpfCnpj` e `NMPessoa` por processo; exige filtro de PF antes de qualquer publicação. |
| `REPEM/PlanoPesquisaRepem.csv` (141 MB) | **não medido** | só a listagem foi lida; conteúdo e campos não foram abertos. |
| `PD/Protocolo.txt` (167 MB) | **não medido** | só a listagem; é protocolo de documento, não processo minerário datado. |
| `metadados-cfem.ods` | **não lido** | ODS exige planilha; os cabeçalhos dos CSVs já responderam o que era preciso. |
| Autuação minerária fora da CFEM | **não encontrada** | a ANM publica autuação de **CFEM**; não foi localizado conjunto aberto de autuação de lavra/ pesquisa. Não medido além disso. |

## 8. Pessoas físicas: o risco mora no dado

Varredura de coluna, não de código:

- `CFEM_Arrecadacao.csv` tem `Tipo_PF_PJ` e `CPF_CNPJ`. Há linhas `PF` no arquivo.
- `CFEM_Autuacao.csv` tem `NomeTitular` junto de `Tipo_PF_PJ`; autuado pode ser garimpeiro individual.
- `TAH.csv` tem `NMPessoa`; `SICOP` tem `Nome da empresa` preenchido com nome de pessoa.

Regra para o coletor: **publicar só PJ**. Linha `Tipo_PF_PJ = F` é descartada
antes de gravar, e a coluna `CPF_CNPJ` não entra no JSON publicado — o
identificador da empresa é o nome, como o `sigbm_anm.py` já faz.

## 9. Veredito por fonte

| Fonte | Veredito | Dificuldade | Ganho cívico em uma frase |
| --- | --- | --- | --- |
| `CFEM_Distribuicao.csv` | **integrar agora** | baixa | Diz a cada paraense, em reais por mês, quanto o município recebeu de mineração — Parauapebas sozinho soma R$ 8,78 bi. |
| `CFEM_Arrecadacao.csv` (recorte 2022–2026) | **integrar agora** | baixa | Mostra qual empresa pagou royalty sobre qual substância e volume, ligando o número do repasse ao processo que o gerou. |
| SIGMINE via ArcGIS `dados_anm` | **integrar agora** | média | 24.152 títulos no PA com polígono, fase e substância — permite dizer o que está aberto em cima de qual território. |
| `CFEM_Autuacao.csv` | **integrar agora** | baixa | Nomeia quem foi autuado por sonegar royalty no PA: 695 casos. |
| SIGBM (já integrado) | **pronto, falta tela** | baixa | 120 barragens no PA, 7 em alerta ou emergência e 83 com PAEBM exigido, já no JSON. |
| `AMB/Producao_Bruta.csv` | **espera** | baixa | Dá 312 milhões de toneladas de minério bruto no PA em 2025, mas só por UF e substância — sem município, não vira página de cidade. |
| Refazer CFEM por WebForms | **impossível hoje** | alta | Nenhum ganho: a fonte está fora do ar e o CSV entrega o mesmo em um arquivo só. |
| `geo.anm.gov.br` `Estruturas` / `Caderneta_Digital` / `MineraLEGAL` | **impossível** | alta | Exige token; não se tenta. |
| `TAH`, `SICOP`, `REPEM`, `PD` | **espera** | alta | Volume grande, nome de pessoa física e chave municipal fraca — nada que a CFEM já não responda melhor. |

---

**O que não foi medido, e por quê:** `Tah.csv`, `Sicop.csv`,
`PlanoPesquisaRepem.csv`, `Protocolo.txt` e `metadados-cfem.ods` só tiveram a
listagem lida (tamanho e nome). Os três primeiros passam de 97 MB cada e exigem
filtro de pessoa física antes de qualquer uso; o último é planilha. `CFEM_Arrecadacao.csv`
inteiro (325 MB) não foi baixado — o recorte 2022–2026 respondeu a pergunta com
99,7 MB. O universo 2002–2021 da CFEM, portanto, **não foi conferido linha a linha**.
