# Imóveis da União sem destinação nos Vales — o que existe hoje naquele lugar

> **Tipo:** HISTORICO
> **Domínio:** global
> **Última medição:** 2026-08-22
> **Leitura estimada:** curta (< 5 min)
> **Relacionados:** [README.md](../../README.md), [AGENTS.md](/AGENTS.md)
> **Palavras-chave:** historico, documentacao

## Sumário

- [Propósito](#propósito)
- [São 25, não 24 — e o 25º é o mais interessante](#são-25-não-24-e-o-25º-é-o-mais-interessante)
- [Como a verificação foi feita](#como-a-verificação-foi-feita)
- [Resultado por nível de confiança](#resultado-por-nível-de-confiança)
- [Os três achados que importam](#os-três-achados-que-importam)
- [Tabela](#tabela)
- [O que NÃO foi possível verificar, e por quê](#o-que-não-foi-possível-verificar-e-por-quê)
- [Defeitos de cadastro encontrados de passagem](#defeitos-de-cadastro-encontrados-de-passagem)

## Propósito

Verificação em fontes públicas dos imóveis da União cadastrados pela SPU nas mesorregiões dos Vales do Mucuri e do Jequitinhonha cujo regime de utilização contém **"Sem Destinação Definida"**. Dado bruto: `spu-imoveis-uniao-vales.geojson` (154 imóveis) do repositório `terras-devolutas`. Saída est...

Verificação em fontes públicas dos imóveis da União cadastrados pela SPU nas
mesorregiões dos Vales do Mucuri e do Jequitinhonha cujo regime de utilização
contém **"Sem Destinação Definida"**. Dado bruto: `spu-imoveis-uniao-vales.geojson`
(154 imóveis) do repositório `terras-devolutas`. Saída estruturada:
[`dados/spu-sem-destinacao-verificacao.json`](dados/spu-sem-destinacao-verificacao.json).

Pesquisa feita em **15/08/2026**. Todas as datas de acesso no JSON são dessa data.

## São 25, não 24 — e o 25º é o mais interessante

A interface do app afirma **24**. O número exato depende do critério:

| Critério | Quantos |
| --- | ---: |
| Regime **exatamente igual a** `Sem Destinação Definida` | **24** |
| Regime **contendo** `Sem Destinação Definida` | **25** |

A diferença é o RIP `5371000185006` (Teófilo Otoni, Distrito de Mucuri), cujo
regime é `Em Processso de Destinação · Sem Destinação Definida` — o imóvel tem
**duas utilizações** cadastradas, uma sem destinação (início 04/03/2024) e outra
em processo de destinação (início 30/01/2025). O ponto `·` é o separador que o
próprio pipeline usa quando um RIP carrega mais de um regime.

Os 24 da interface não estão errados; estão respondendo a outra pergunta. Mas o
imóvel que ficou de fora é justamente o de maior valor de fiscalização: 4,2 ha,
antigo acampamento do DNER, e com a destinação reaberta em 2025. **Este documento
trabalha com os 25.**

## Como a verificação foi feita

Quatro caminhos, nesta ordem de peso:

1. **Cadastro oficial da SPU.** O CSV de origem da camada — exportado do
   [Painel de Transparência Ativa da SPU](https://qlik-publico.paineis.gov.br/extensions/transparencia-ativa/transparencia-ativa.html),
   aba *Imóveis da União*, filtro UF = MG — traz colunas que a camada publicada
   descarta de propósito: **`Endereço`** (com número), **`Nível de Precisão`** da
   coordenada, datas de cadastro e de início de utilização, e área do terreno em m².
   Os 25 RIPs foram localizados nas 4.336 linhas de MG. Isso resolveu o
   logradouro de **todos os 25** com fonte oficial.
2. **Busca por RIP** em editais, diários oficiais e processos. Nenhuma busca por
   RIP isolado retornou resultado útil (ver a seção do que não deu).
3. **Busca por "município + bairro + logradouro"** com termos como *imóvel da
   União*, *SPU*, *cessão*, *terreno da União*, e por notícias e história local
   do bairro.
4. **Geocodificação reversa** de cada coordenada pelo Nominatim/OpenStreetMap
   (`zoom=18`, `addressdetails=1`), a 1 requisição por segundo, com User-Agent
   identificando a pesquisa. 24 coordenadas distintas para 25 imóveis.

### A coordenada da SPU não serve para dizer o que há no lote

Esta é a lição metodológica da rodada, e ela vale para qualquer uso futuro desta camada.

O campo `Nível de Precisão` do cadastro entrega o problema por escrito. A
distribuição exata entre os 25:

| Nível de Precisão (cadastro SPU) | Quantos |
| --- | ---: |
| `Manual - Na porta ou na sede do imóvel rural` | 17 |
| `Manual - Na rua ou na via de acesso rural` | 4 |
| `Manual - No Município` | 2 |
| `Geocodificado - Endereço completo encontrado` | 1 |
| `Manual - No Centro do imóvel` | 1 |

Os **2 imóveis marcados `Manual - No Município` — Medina e Caraí — têm coordenada
que aponta a cidade, não o imóvel.** Para esses, o logradouro devolvido pelo
Nominatim é ruído: em Medina ele devolve *Rua Professor Querubim Quirino* quando o
cadastro diz outra rua inteiramente.

E o problema não se limita a eles:

- Em **Itaobim**, os dois lotes ficam na mesma rua segundo o cadastro, e o
  Nominatim devolve **duas ruas diferentes**, nenhuma delas a correta — ambos com
  precisão declarada boa (`Na porta ou na sede` e `Na rua ou na via de acesso`).
- Em **Araçuaí**, a precisão é a melhor da tabela, `Geocodificado - Endereço
  completo encontrado`, mas o ponto cai numa **rodovia** (BR-342/MGC-342) e o
  endereço cadastral é rua urbana.

Ou seja: **precisão declarada alta não garante coordenada utilizável.** Nos lotes
de Teófilo Otoni, onde há muitos registros na mesma rua, as coordenadas se
comportam bem; fora dali, não.

Conclusão prática: **o campo `logradouro_osm` do JSON é o logradouro mais próximo
da coordenada, não o endereço do imóvel.** Ele está lá para auditoria do método,
não como resposta. Onde ele diverge do cadastro, o `observacoes` do registro diz.

### Endereço com número: por que não está publicado aqui

O pipeline que gera a camada descarta o endereço de propósito, e a justificativa
está escrita nele: entre os 4.336 registros de MG há 295 casas e 272 imóveis sob
"Inscrição de Ocupação" — imóvel da União onde alguém mora —, e publicar a porta
de uma casa ocupada num mapa é apontar para uma família.

Os 25 deste recorte **não** são registros de "Inscrição de Ocupação". Ainda assim,
um deles é cadastrado como tipo **`Casa`**, e a Portaria SPU 2/2017 (abaixo) prova
que lotes dominiais da União no Centro de Itaobim são **moradia de famílias de
baixa renda**. Diante disso, este documento e o JSON registram **o logradouro, sem
o número de porta**. O RIP vai completo em cada registro: qualquer pessoa consulta
o endereço exato na fonte oficial pelo RIP. Não se esconde nada da fiscalização —
apenas não se republica a porta num arquivo mapeável.

*(As strings do JSON estão sem acento, por escolha, para sobreviverem a
re-codificação; a prosa deste `.md` está acentuada.)*

## Resultado por nível de confiança

| Confiança | Quantos | O que significa |
| --- | ---: | --- |
| `alta` | **1** | fonte oficial nomeia o imóvel e o que existe nele |
| `media` | **14** | fonte oficial ou local nomeia o logradouro/o conjunto, mas não este RIP |
| `baixa` | **9** | só o endereço cadastral e/ou a inferência pela coordenada |
| `nao_encontrado` | **1** | nada encontrado além do cadastro |

## Os três achados que importam

### 1. O acampamento do DNER no Distrito de Mucuri (RIP `5371000185006`) — confiança alta

O **próprio cadastro da SPU grava o endereço terminando em "DNER"**. A história
local do distrito registra que o DNER instalou ali acampamento com **22 casas de
funcionários, escola, almoxarifado e o canteiro de obras da ponte sobre o Rio
Mucuri**, mantido depois da inauguração da rodovia em 1963. A área cadastrada,
42.142,25 m², é compatível com um acampamento desse porte.

É o único dos 25 com regime composto, e a destinação **voltou a andar em 2025**.
De todos, é o que mais pede acompanhamento.

### 2. Itaobim: a União já mandou doar os lotes às famílias que moram neles — e eles continuam "sem destinação"

A **Portaria SPU nº 2, de 19/01/2017** (DOU nº 16, 23/01/2017, seção 1, p. 60)
autorizou a doação dos imóveis dominiais da União localizados nas **Ruas Tonico
Murta e Paraíba e Praça Tiradentes, Centro de Itaobim** — área total 4.034,39 m²,
nove matrículas do Registro de Imóveis de Medina — para **regularização fundiária
de interesse social**, com a finalidade específica de reconhecer o direito à
moradia das **famílias ocupantes**, com renda de até 5 salários mínimos.

Os dois imóveis do recorte ficam nessa mesma rua, são dominiais, foram
**cadastrados em setembro e outubro de 2021 — quatro anos depois da portaria — e
seguem como "Sem Destinação Definida"**. Ou a doação de 2017 não se completou, ou
são outros lotes da mesma quadra que ficaram de fora dela. A portaria nomeia a rua
e a classe do imóvel, **não os RIPs**: por isso a confiança é `media` e não `alta`.

Se a leitura se confirmar, "sem destinação" aqui não quer dizer terreno vazio:
quer dizer casa de família sem título.

### 3. Rua Engenheiro Celso Murta: 12 dos 25 imóveis estão na mesma rua, o eixo rodoviário federal de Teófilo Otoni

Doze dos 25 — quase metade — são lotes miúdos e contíguos numa única rua, repartida
no cadastro entre os bairros *Doutor Laerte Laender* e *Olga Prates Corrêa*. Na
mesma rua:

- o **DNIT** mantém **Unidade Local (nº 208) e galpão (nº 286)**, segundo a própria
  planilha de bens imóveis do DNIT, que registra a situação como *"B — em
  regularização junto a SPU/MG"* sob o RIP `5371.00017.500-0`;
- a história local registra que **a área onde hoje fica o DNER foi doada por Olga
  Prates Corrêa**, a homenageada do bairro.

O RIP do DNIT é **vizinho de sequência** dos RIPs do recorte, mas **não é nenhum
deles**. O conjunto é compatível com a antiga **vila residencial do DNER** em volta
da unidade rodoviária — porém nenhum documento encontrado nomeia um destes 12 RIPs
e diz o que ocupa o lote hoje. Daí `media`, não `alta`.

**Ressalva importante:** o OpenStreetMap marca uma **Polícia Rodoviária Federal**
na Rua Engenheiro Celso Murta, nº 218, e três coordenadas do recorte caem sobre
esse ponto. Mas a **PRF publica sua unidade operacional de Teófilo Otoni na BR-116,
km 278** — endereço diferente. A associação desses lotes com a PRF **não está
confirmada** e não deve ser afirmada.

## Tabela

Ordenada por confiança. O texto completo de cada item, com todas as fontes e datas
de acesso, está no JSON.

| RIP | Município | Bairro (cadastro) | Área (ha) | Logradouro mais próximo (OSM) | O que é hoje | Confiança |
| --- | --- | --- | ---: | --- | --- | --- |
| `5371000185006` | Teofilo Otoni | Distrito de Mucuri | 4.21 | Rodovia Santos Dumont | Antigo acampamento do DNER (22 casas, escola, almoxarifado, canteiro da ponte do Rio Mucuri) | **alta** |
| `4665010001098` | Itaobim | CENTRO | 0.06 | Rua do Prédio | Lote dominial na R. Tonico Murta, alcançado pela Portaria SPU 2/2017 (doação às famílias ocupantes) | **media** |
| `4665010001250` | Itaobim | CENTRO | 0.08 | Rua Dirceu Gomes Soares | Lote dominial na R. Tonico Murta, mesmo perímetro da Portaria SPU 2/2017 | **media** |
| `5371000685009` | Teofilo Otoni | DOUTOR LAERTE LAENDE | 0.01 | Rua Engenheiro Celso Murta | Lote na R. Eng. Celso Murta, eixo do DNIT / antigo DNER | **media** |
| `5371000765002` | Teofilo Otoni | DOUTOR LAERTE LAENDE | 0.11 | Rua Engenheiro Celso Murta | Lote na R. Eng. Celso Murta, eixo do DNIT / antigo DNER | **media** |
| `5371001335001` | Teofilo Otoni | DOUTOR LAERTE LAENDE | 0.05 | Praça Chiquito Correira | Lote na R. Eng. Celso Murta, eixo do DNIT / antigo DNER | **media** |
| `5371010001633` | Teofilo Otoni | OLGA PRATES CORREA | 0.03 | Rua Engenheiro Celso Murta | Lote na R. Eng. Celso Murta, eixo do DNIT / antigo DNER | **media** |
| `5371010001714` | Teofilo Otoni | OLGA PRATES CORREA | 0.02 | Praça Chiquito Correira | Lote na R. Eng. Celso Murta, eixo do DNIT / antigo DNER | **media** |
| `5371010002281` | Teofilo Otoni | OLGA PRATES CORREA | 0.02 | Praça Chiquito Correira | Lote na R. Eng. Celso Murta, eixo do DNIT / antigo DNER | **media** |
| `5371010002362` | Teofilo Otoni | OLGA PRATES CORREA | 0.03 | Rua Engenheiro Celso Murta | Lote na R. Eng. Celso Murta, eixo do DNIT / antigo DNER | **media** |
| `5371010002524` | Teofilo Otoni | DOUTOR LAERTE LAENDE | 0.02 | Rua Engenheiro Celso Murta | Lote na R. Eng. Celso Murta, eixo do DNIT / antigo DNER | **media** |
| `5371010002605` | Teofilo Otoni | DOUTOR LAERTE LAENDE | 0.02 | Rua Engenheiro Celso Murta | Lote na R. Eng. Celso Murta, eixo do DNIT / antigo DNER | **media** |
| `5371010003091` | Teofilo Otoni | DOUTOR LAERTE LAENDE | 0.05 | Rua Engenheiro Celso Murta | Lote na R. Eng. Celso Murta, eixo do DNIT / antigo DNER | **media** |
| `5371010003172` | Teofilo Otoni | OLGA PRATES CORREA | 0.05 | Rua Engenheiro Celso Murta | Lote na R. Eng. Celso Murta, eixo do DNIT / antigo DNER | **media** |
| `5371010003253` | Teofilo Otoni | DOUTOR LAERTE LAENDE | 0.05 | Rua Engenheiro Celso Murta | Lote na R. Eng. Celso Murta, eixo do DNIT / antigo DNER | **media** |
| `4067000025006` | Aracuai | Itatiaia | 0.04 | BR-342;MGC-342 | Terreno na R. Hilda Carmona; proprietário é autarquia/fundação federal, não a União direta | **baixa** |
| `4259000055004` | Carai | - | 9.6 | Rua Doutor Waldo Brito | Terreno de 9,6 ha no km 748 da BR-116 (Rio-Bahia), localidade Marambaia | **baixa** |
| `5371000135009` | Teofilo Otoni | topázio | 25.8 | Rodovia Santos Dumont | Fazenda de 25,8 ha no lugar Mestre Campo de Baixo | **baixa** |
| `5371000165005` | Teofilo Otoni | CENTRO | 0.02 | Rua Francisco Sá | Terreno na esquina da R. Francisco Sá com a BR-116, Centro | **baixa** |
| `5371010000904` | Teofilo Otoni | SAO CRISTOVAO | 0.03 | Rua Edmar Neves | Lote na R. Eng. Edmar Neves (Vila Ramos / São Cristóvão) | **baixa** |
| `5371010001552` | Teofilo Otoni | VILA RAMOS | 0.01 | Rua Edmar Neves | Lote na R. Eng. Edmar Neves (Vila Ramos / São Cristóvão) | **baixa** |
| `5371010002109` | Teofilo Otoni | SAO CRISTOVAO | 0.02 | Rodovia Santos Dumont | Lote na R. Eng. Edmar Neves (Vila Ramos / São Cristóvão) | **baixa** |
| `5371010002443` | Teofilo Otoni | VILA RAMOS | 0.03 | Rua Edmar Neves | Lote na R. Eng. Edmar Neves (Vila Ramos / São Cristóvão) | **baixa** |
| `5371010002958` | Teofilo Otoni | SAO CRISTOVAO | 0.03 | Rua Edmar Neves | Lote na R. Eng. Edmar Neves (Vila Ramos / São Cristóvão) | **baixa** |
| `4827010001128` | Medina | CENTRO | 0.01 | Rua Professor Querubim Quirino | Não encontrado | **nao_encontrado** |

## O que NÃO foi possível verificar, e por quê

**Nenhum RIP retornou resultado em busca direta.** Buscas pelo número do RIP, cru
e no formato `NNNN.NNNNNNNN-D`, em editais, diários oficiais e processos, não
devolveram nada para nenhum dos 25. O RIP é identificador de cadastro interno; ele
aparece em atos administrativos que citam o imóvel, mas os atos que encontramos
(Portaria SPU 2/2017, planilha do DNIT) descrevem os imóveis **por logradouro e
matrícula**, não por RIP. Cruzar RIP com ato oficial exigiria consulta processual
que não é pública por busca aberta.

**A consulta cadastral por RIP na SPU exige autenticação.** O serviço "Consultar
Dados Cadastrais de Imóvel da União" (`sistema.patrimoniodetodos.gov.br`) é
requerimento com login. Não foi usado — a regra da pesquisa é fonte pública, sem
login.

**Duas páginas de história local respondem HTTP 403 a acesso automatizado.** As
páginas do *Redescobrindo os Vales* sobre o Distrito de Mucuri e sobre o bairro
Olga Prates Corrêa bloqueiam requisição automática. O conteúdo citado veio do
**índice do buscador**, não da leitura direta da página, e isso está marcado no
campo `titulo` de cada evidência no JSON. O bloqueio **não foi contornado**. Quem
quiser conferir abre a URL no navegador.

**A notícia do "Feirão de Imóveis SPU+" e a portaria de Reurb-S de 2025 estão
atrás de conteúdo restrito.** As páginas do gov.br que listariam os imóveis
ofertados e os 79 núcleos urbanos informais elegíveis a Reurb-S retornam
"É necessário autenticar para visualizar essa página". Se algum dos 25 está nessas
listas, não foi possível saber.

**Não se confirmou o uso atual de nenhum imóvel fora de Teófilo Otoni e Itaobim.**
Para Medina, Caraí e Araçuaí não há notícia local, ato administrativo ou registro
que diga o que existe no lote. Em Medina o resultado é `nao_encontrado`; em Caraí e
Araçuaí sobrou apenas o endereço cadastral, com a coordenada comprovadamente
imprecisa. **Verificação em campo, ou LAI à SPU/MG citando os RIPs, é o próximo
passo** — não há caminho puramente documental aberto para esses três.

## Defeitos de cadastro encontrados de passagem

Não eram o objetivo, mas apareceram e ficam registrados:

- **Duplicidade de porta.** Os RIPs `5371010000904` e `5371010001552` estão
  cadastrados no **mesmo número** da Rua Engenheiro Edmar Neves, com **áreas
  diferentes** (276,23 m² contra 62,10 m²) e com o **bairro trocado** entre os dois
  registros (um diz *São Cristóvão* com "Vila Ramos" no endereço, o outro diz
  *Vila Ramos*). São dois imóveis para o cadastro.
- **Terreno de marinha a 200 km do mar.** O RIP `5371010001552` tem conceituação
  `Marinha com Nacional Interior`. Teófilo Otoni não é município litorâneo; a
  marcação de marinha é erro da fonte.
- **Bairro que mudou de nome dentro do endereço.** O RIP `5371001335001` traz no
  próprio campo de endereço a expressão *"antigo Bairro Olga Prates Correa"* — a
  SPU registra a troca no texto livre, o que explica por que o mesmo trecho de rua
  aparece sob dois bairros diferentes na camada.
- **Bairro vazio.** O imóvel de Caraí (9,6 ha, o segundo maior do recorte) tem o
  campo bairro preenchido com `-`.
