# Lei Rouanet (SALIC) em MG — o que foi medido

> Fonte: API SALIC do Ministério da Cultura, `https://api.salic.cultura.gov.br/api/v1`, pública e sem
> chave. Coleta de **2026-08-15** por
> `scripts/coletar-salic-rouanet.mts`. Todo número desta página saiu dessa
> coleta; nenhum foi estimado.

## Por que esta fonte entrou no portal

O eixo Cidades já responde "quem ganhou contrato desta prefeitura". O SALIC
publica `cgccpf` em cada incentivador — **é a mesma empresa, no outro papel**:
quem vende para o município e quem abate imposto para financiar cultura nele.
A junção por CNPJ é o produto desta fonte; o catálogo de projetos é o caminho
até ela.

## Os números de MG

| Medida | Valor |
|---|---|
| Projetos com UF=MG (total anunciado pela API) | **7.206** |
| Projetos efetivamente coletados | 7.206 |
| Projetos com `valor_aprovado` > 0 | 7.141 |
| Projetos com `valor_captado` > 0 | 2.084 |
| Soma de `valor_aprovado` | R$ 8.600.823.863,65 |
| Soma de `valor_captado` | R$ 1.903.176.880,44 |
| Anos de projeto presentes | 2019–2026 |
| Municípios distintos | 333 |
| Incentivadores domiciliados em MG (anunciado) | **20.785** |
| Incentivadores coletados (após deduplicar) | 20.784 |
| — pessoa jurídica / pessoa física | 2.263 / 18.521 |
| CNPJ/CPF distintos (chave da junção) | 2.261 |
| Registros sem CNPJ/CPF válido (ficam fora da junção) | 18.523 |

### ⚠️ O que estes números NÃO dizem

"Incentivadores de MG" aqui significa **domiciliados em MG**, não
"que doaram para projeto de MG". A pergunta certa — *quantos incentivadores
financiaram projeto mineiro, e com quanto* — **não é respondível hoje**, e a
razão está medida abaixo: o único endpoint que ligaria incentivador a projeto
(`_links.doacoes`) devolveu HTTP 404 em todos os testes. Publicar
`total_doado` de um incentivador de BH como se fosse dinheiro que entrou em
MG seria inventar um número — e ele pareceria certo.

Pela mesma razão, `total_doado` na tabela abaixo é o total **no Brasil**.

E "projeto de MG" também não é exatamente o que parece: **29 dos
7.206 projetos que a API devolveu para `UF=MG` trazem outro valor no
próprio campo `UF`** (RJ, SP, AL, BA, PR). O filtro não foi ignorado — a
armadilha 2 confere isso pelo total — mas "projeto de MG" e "campo UF = MG"
são coisas diferentes na base do MinC. O portal **conta** essa divergência no
cabeçalho do arquivo (`registros_com_campo_uf_diferente_do_filtro`) em vez de
filtrar de novo por conta própria: descartar seria jogar fora projeto que a
fonte afirma ser de MG.

## Top 10 incentivadores domiciliados em MG, por valor doado

Agregado por CNPJ/CPF e **ordenado aqui**, não pela API — `sort` é ignorado
pelo servidor (medido; ver as armadilhas). A coluna "registros somados" mostra
quantas grafias/filiais do mesmo documento foram unificadas.

| # | Incentivador | CNPJ/CPF | Total doado (Brasil) | Registros somados | UF do registro |
|---|---|---|---|---|---|
| 1 | COMPANHIA BRASILEIRA DE METALURGIA E MINERACAO | `33131541000108` | R$ 255.143.462,85 | 1 | MG |
| 2 | CSN MINERACAO S.A. | `08902291000115` | R$ 166.406.370,69 | 1 | MG |
| 3 | CEMIG GERACAO E TRANSMISSAO S.A | `06981176000158` | R$ 138.618.396,94 | 1 | MG |
| 4 | STELLANTIS AUTOMOVEIS BRASIL LTDA. | `16701716000156` | R$ 130.276.134,77 | 1 | MG |
| 5 | CEMIG DISTRIBUICAO S.A | `06981180000116` | R$ 116.308.500,44 | 1 | MG |
| 6 | GERDAU ACOMINAS S/A | `17227422000105` | R$ 98.648.767,91 | 1 | MG |
| 7 | COMPANHIA DE SANEAMENTO DE MINAS GERAIS COPASA MG | `17281106000103` | R$ 73.174.549,79 | 1 | MG |
| 8 | USINAS SIDERURGICAS DE MINAS GERAIS S/A. USIMINAS | `60894730000105` | R$ 72.259.420,58 | 1 | MG |
| 9 | ARCELORMITTAL BRASIL S.A. | `17469701000177` | R$ 71.244.972,29 | 1 | MG |
| 10 | VALLOUREC TUBOS DO BRASIL LTDA. | `17170150000146` | R$ 65.238.843,69 | 1 | MG |

## Top 10 municípios de MG por valor captado

| # | Município | Projetos | Captado |
|---|---|---|---|
| 1 | Belo Horizonte | 3.201 | R$ 1.108.141.376,00 |
| 2 | Brumadinho | 56 | R$ 222.497.803,43 |
| 3 | Ouro Preto | 179 | R$ 131.305.629,98 |
| 4 | Ipatinga | 111 | R$ 44.132.568,42 |
| 5 | Nova Lima | 152 | R$ 43.743.252,40 |
| 6 | Uberlândia | 271 | R$ 25.230.010,20 |
| 7 | Paracatu | 69 | R$ 24.812.071,45 |
| 8 | Araxá | 186 | R$ 24.398.054,76 |
| 9 | Tiradentes | 39 | R$ 22.267.026,20 |
| 10 | Contagem | 136 | R$ 20.694.261,88 |

## As armadilhas — leia antes de escrever qualquer frase com esta fonte

### 1. `sort` é ignorado em silêncio, e isso já produziu um número falso

Cinco variações (`sort=total_doado`, `sort=-total_doado`,
`sort=total_doado&order=desc`, `sort=nome` e sem `sort` nenhum) devolveram
**as mesmas cinco linhas, na mesma ordem**, com valores 648.387.436,40 /
15.000,00 / 350,00 / 9.252.331,33 / 500,00 — uma sequência que não está
ordenada por nada. HTTP 200 nas cinco.

> **NUNCA publique "o maior incentivador é o Banco do Brasil, com
> R$ 648.387.436,40".** Essa frase foi escrita assim uma vez, em
> `docs/PLANO-2026-08-15.md` §N2, e passada ao dono como fato. O valor está
> certo para aquele CNPJ; o que é falso é chamá-lo de máximo — **é a primeira
> linha da ordem natural da API**, não o topo de um ranking. Qualquer ranking
> desta fonte exige varrer a lista inteira e ordenar do nosso lado, que é o que
> `ordenarPorTotalDoado` e `topPorTotalDoado` fazem e o que a tabela acima usa.

### 2. Filtro inexistente devolve 200 com o catálogo inteiro

`?parametro_inexistente_xyz=1&limit=1` → total **113.548**, idêntico à consulta
sem filtro nenhum. A API ignora o que não conhece e responde 200.

**E o próprio portal do MinC cai nessa armadilha:** cada projeto publica
`_links.incentivadores → incentivadores?incentivador_id=<PRONAC>`, e
`incentivador_id` não é filtro reconhecido. Seguir o link publicado do projeto
PRONAC 266269 — um festival de Igarapé — devolve **os 113.548 incentivadores do
Brasil inteiro**, com cara de "os incentivadores deste projeto".
`conferirFiltroHonrado` transforma isso em abort: mede o total sem filtro na
mesma rodada e para se os dois baterem.

### 3. `_links.doacoes` responde 404 em 9 de 9 — a trilha não existe hoje

Testado no Banco do Brasil e nos 8 primeiros incentivadores de MG, sempre
pelo link que a **própria API publica** (nunca montado à mão):
`{"message":"No funding info was found with your criteria","message_code":11}`.

Não é erro de montagem de URL, e derruba a razão original de a fonte ter
entrado no plano: **a trilha incentivador → doação → projeto não é percorrível
hoje**. O que sobra são dois catálogos confiáveis lado a lado, e a junção por
`cgccpf` com o fornecedor de contrato público — que não depende de
`/doacoes`.

### 4. `total_doado` é do incentivador no BRASIL, e não se recorta por UF

Não há parâmetro que peça "quanto este incentivador doou para projeto de MG",
e sem `/doacoes` não há como derivar. Publicar o `total_doado` de um
incentivador domiciliado em BH como "dinheiro que entrou em MG" **inventa um
número que parece certo** — o pior tipo de erro, porque nada na tela o
denunciaria. Onde este relatório mostra `total_doado`, a coluna diz "(Brasil)".

### 5. Barra final devolve 301 para HTML `iso-8859-1`, e o `Location` desce para http

`/api/v1/projetos/?UF=MG` redireciona para a versão sem barra. Quem segue o
redirect cego sai do TLS sem perceber e recebe HTML de Apache, que vira
`JSON.parse` explodindo longe da causa. `montarUrl` nunca põe barra final e o
coletor usa `redirect: "manual"`.

**O mojibake não nasce na rota JSON.** Medido: o corpo JSON é ASCII puro — o
servidor escapa "Brasília" com escape unicode, nenhum byte acima de 127. Ele
nasce em `?format=csv`, que devolve UTF-8 cru (lido como latin-1 vira
`BrasÃ­lia`), e no HTML do 301 acima, que se declara `iso-8859-1`. Por isso a
trava de U+FFFD fica em `decodificarCorpo`, e não no formato de saída.

### 6. Os hashes de `_links` não são identidade

O MESMO incentivador (BANCO DO BRASIL SA, `00000000000191`) veio com `self`
terminando em três hashes diferentes para `?limit=1`, `?limit=2` e
`?limit=1&offset=0`. O hash é função da CONSULTA, não do registro — guardá-lo
como id "funciona" na mesma sessão e apodrece na seguinte. Nenhum `_links` é
gravado nos arquivos; a chave estável é `cgccpf`.

## Dado pessoal: o que a fonte mascara, e o que ela deixou passar

**Este é o achado mais importante desta rodada, e ele quase passou.**

A fonte mascara CPF no campo de documento: pessoa física chega como
`cgccpf: "***008317**"`. Na coleta completa de MG, **1.885 dos
7.206 projetos** e **18.518 dos 20.784 incentivadores** vieram
mascarados assim. Fácil concluir que a fonte protege o dado. **Ela não
protege.**

**A fonte não mascara o campo de NOME, e o CPF vai por extenso ali.** Medido
nos dois arquivos: **210 CPFs em `proponente` dos projetos e 5 em `nome` dos
incentivadores**, no formato `"<NOME COMPLETO DA PESSOA> <11 dígitos>"`, e
**todos os 215 são válidos por mod-11** — CPF de gente de verdade, colado ao
nome de quem ele identifica, prestes a entrar num repositório PÚBLICO.

Nenhuma proteção do portal olhava para lá: `conferirSemCpf` lê só `cgccpf`,
`normalizarCgccpf` também. Quem pegou foi `scripts/checar-dado-pessoal.py` —
o hook — depois de os arquivos já estarem escritos em disco. É a mesma classe
do vazamento de CPF dentro de ementa oficial que este repositório já teve: **o
dado pessoal não estava no campo de dado pessoal, estava no texto ao lado.**

Mais 5 incentivadores trouxeram `cgccpf` de 11 dígitos **sem máscara**, com DV
errado — nenhum guarda de mod-11 do repositório dispararia por eles. "Não passa
no dígito verificador" não é promessa de que o número não identifica ninguém:
pode ser CPF digitado errado no cadastro do MinC, que continua apontando para a
pessoa certa por aproximação.

**O que o portal faz.** `redigirDocumentosSoltos` varre **todo campo de texto
de todo registro** — e não uma lista de campos suspeitos, que estaria sempre um
campo atrasada — e troca toda sequência de exatamente 11 dígitos por
`***REDIGIDO***`. Nesta coleta: **210 nos projetos e 10 nos
incentivadores**. O nome da pessoa FICA — quem propôs projeto com imposto
renunciado é informação pública; o documento dela não é.

A marca diz **quem apagou**: imitar a máscara do MinC (`***008317**`) faria o
portal fingir que a origem fez o que ele mesmo fez. O número fica no cabeçalho
de cada arquivo (`documentos_redigidos_pelo_portal`) — se ele crescer, a origem
mudou. E se aparecer CPF válido no próprio `cgccpf`, `conferirSemCpf` aborta a
coleta e nada é gravado.

CNPJ de 14 dígitos e a máscara de 6 não são tocados: medido, as únicas
sequências de 11 dígitos fora de `cgccpf`/`PRONAC` nos dois arquivos são os
215 CPFs — os outros números longos do acervo têm 8 dígitos.

> **Se você for coletar outra UF, ou outra fonte do MinC, assuma que isto se
> repete.** Não confie na máscara do campo de documento como prova de que a
> fonte protege dado pessoal — confira o campo de nome.

Consequência prática para a junção: ela só existe para pessoa jurídica, que é
justamente o lado que interessa. Quem doou R$ 100 não é alvo de um portal de
controle de dinheiro público corporativo.

## Como os arquivos estão gravados

`apps/web/data/rouanet-mg-projetos.json` e
`rouanet-mg-incentivadores.json`, lidos no **build** (nada disto vai para o
bundle do cliente). Formato compactado por `lib/estatico/compactar.ts`:
`esqueleto` com os nomes de campo uma vez, `dicionarios` com os rótulos
repetidos, e `linhas` com um vetor por registro.

**Não indexe `linhas` por posição à mão — use `expandir()`.** A posição muda
quando uma coluna entra, e o erro seria silencioso.

Medido: 3.532.764 B + 4.363.729 B = **7.896.493 B** com um objeto por linha,
contra **2.441.531 B** compactado — 69,1% a menos, mesmos 27.990 registros.

## As medidas cruas da sonda

- **projetos com UF=MG** — 7206
- **incentivadores no Brasil** — 113548
- **incentivadores domiciliados em MG** — 20785
- **filtro inexistente (parametro_inexistente_xyz=1)** — 113548 — IGUAL ao total sem filtro: a API ignora o que não conhece e devolve tudo com HTTP 200
- **barra final em /projetos/** — HTTP 301 -> http://api.salic.cultura.gov.br/api/v1/projetos?UF=MG&limit=1 (content-type text/html; charset=iso-8859-1)
- **hash do "self" do mesmo incentivador (cgccpf 00000000000191) em duas consultas** — DIFERENTE (26a6be973577… vs eee72f1a7f88…) — o hash é da consulta, não do registro
- **hash de `self` vs `doacoes` no mesmo item** — DIFERENTE — concatenar o id do self para montar /doacoes dá 404
- **GET no link `_links.doacoes` publicado** — HTTP 404 — {"message":"No funding info was found with your criteria","message_code":11}
- **sort=total_doado muda a ordem?** — NÃO — as mesmas 5 linhas na mesma ordem (648387436.4037, 15000.0016, 350, 9252331.3291, 500); o ranking tem de ser feito aqui
- **corpo JSON tem byte acima de 127?** — NÃO — o servidor escapa acento (\u00ed); o mojibake não nasce na rota JSON
- **corpo CSV (?format=csv) tem byte acima de 127?** — SIM — UTF-8 cru; lido como latin-1 vira "BrasÃ­lia"
- **_links.incentivadores do projeto PRONAC 266269** — 113548 — o CATÁLOGO INTEIRO. O link publicado usa "incentivador_id=<PRONAC>", que não é filtro reconhecido

## A tela: por que ela NÃO foi feita nesta rodada

Esta rodada entregou **o dado e este documento**, de propósito. A tela não
entrou, e o motivo não é falta de tempo:

1. **A trilha incentivador → projeto não existe pela API hoje** (armadilha 3).
   Sem ela, a tela mostraria dois catálogos lado a lado com cara de fluxo de
   dinheiro — e o leitor concluiria sozinho que o `total_doado` daquele
   incentivador foi para aqueles projetos. Seria a armadilha 4 servida em HTML.
   Próximo passo: LAI ao MinC perguntando se `/doacoes` foi desligado ou mudou
   de rota, e procurar o dump da Rouanet em `dados.gov.br`.
2. **A junção com o fornecedor de contrato público** — o motivo de a fonte
   estar aqui — ainda não foi feita: cruzar `cgccpf` dos incentivadores contra
   os CNPJ de fornecedor que o eixo Cidades já guarda. **Não depende do item 1**
   e é o que torna a página diferente de mais um catálogo. Esta é a próxima
   tarefa óbvia.

**Quando a tela for feita, o caminho já está decidido:** índice estático fatiado
(`lib/estatico/fatiar.ts`) + `app/[municipio]/components/TabelaEstatica.tsx`,
como as nove rotas que já usam esse par. **A coleção nunca vai como props de
componente de cliente** — foi assim que `/ambiental/legislacao` chegou a
35,5 MiB contra o teto de 25 MiB da Cloudflare, uma inflação de 7,5×. Os dois
arquivos são lidos no **build**, nunca em runtime, e nada deles entra no bundle
do cliente.
