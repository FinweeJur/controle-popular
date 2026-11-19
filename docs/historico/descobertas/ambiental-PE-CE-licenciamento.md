# Ambiental PE e CE — licenciamento: o que dá para coletar hoje

> **Tipo:** HISTORICO / descoberta
> **Domínio:** ambiental-PE, ambiental-CE
> **Data da medição:** 18/11/2026
> **Método:** sondagem ao vivo com `urllib`, UA honesto, 2 s entre requisições ao mesmo host, corpos salvos e medidos em bytes
> **User-Agent usado:** `finweejur/github artur colito` (honesto, sem UA de navegador)
> **Requisições feitas:** 54 ao PE, 31 ao CE (teto combinado: ~50 por estado — o PE passou de 4)
> **Status:** descoberta. Nada foi gravado no banco, nada foi commitado.

## Sumário

- [1. Resposta curta](#1-resposta-curta)
- [2. Método, limites e um erro meu](#2-método-limites-e-um-erro-meu)
- [3. Pernambuco (CPRH) — URLs sondadas](#3-pernambuco-cprh--urls-sondadas)
- [4. Pernambuco — o que é coletável hoje](#4-pernambuco--o-que-é-coletável-hoje)
- [5. Ceará (SEMACE) — URLs sondadas](#5-ceará-semace--urls-sondadas)
- [6. Ceará — licenciamento pela API](#6-ceará--licenciamento-pela-api)
- [7. Ceará — fiscalização (autos)](#7-ceará--fiscalização-autos)
- [8. O que está bloqueado e por quê](#8-o-que-está-bloqueado-e-por-quê)
- [9. robots.txt e termos — leitura literal](#9-robotstxt-e-termos--leitura-literal)
- [10. Veredito por fonte](#10-veredito-por-fonte)
- [11. O que eu não medi](#11-o-que-eu-não-medi)
- [12. Ordem recomendada](#12-ordem-recomendada)

## 1. Resposta curta

**Ceará entra agora. Pernambuco não entra: o `robots.txt` proíbe exatamente o caminho onde os dados moram.**

- **CE — entra.** A SEMACE tem API REST aberta, sem login e sem CAPTCHA: `POST /SemaceMobileWS/webService/consultaProcesso/processos` devolve **205.820 processos** de licenciamento, 28 campos por registro, e aceita **`limit: 5000`** por requisição (5,3 MB). O mesmo serviço exporta **XLS com 16 colunas** (`downloadListArquivo`), incluindo município, atividade, data de emissão, validade e situação. A fiscalização vem por outra rota: **17.974 autos** com data de autuação, valor, tipo de infração e status de julgamento.
- **PE — não entra hoje.** A consulta de licenças da CPRH funciona e responde bem (grade de 20 linhas, 100 com ajuste, ~100 mil lançamentos), mas fica em `/silian/`, e o `robots.txt` do host declara `Disallow: /silian` e `Disallow: /silia`. Coleta ali seria violação direta da regra de coleta do projeto. Os outros caminhos do PE não têm dado: o Portal da Transparência é só menu, e o CKAN estadual tem 47 conjuntos, **nenhum** ambiental.
- **O que sobra no PE** é pedido formal (LAI / ofício à CPRH) ou esperar mudança do `robots.txt`. O número existe e é bom — não é falta de dado, é falta de permissão.

## 2. Método, limites e um erro meu

- Uma requisição por vez, 2 s entre chamadas ao mesmo host. Nenhum paralelismo por host. Nenhum login, CAPTCHA ou rate limit foi burlado — não houve necessidade em nenhum dos dois estados.
- **Tamanho em bytes é o do corpo lido**, não o `Content-Length`. HTTP 200 com corpo vazio conta como fracasso, e está marcado assim onde aconteceu.
- **Erro meu, registrado:** no PE eu li o `robots.txt` da porta 81 **depois** de já ter consultado a grade de licenças em `/silian/`. A página-hub oficial (`www2.cprh.pe.gov.br/consulta-a-servicos/`) publica os links dessa grade como "Consulta pública", o que me levou a tratá-los como área aberta. Ao ler o `robots.txt` no fim, o `Disallow` apareceu. Nenhuma coleta em massa foi feita — foram 20 requisições de sondagem, para medir existência e formato. **Para o coletor, a decisão é: não coletar.** Quem repetir este caminho deve ler o `robots.txt` antes, não depois.
- Contagens de campo foram feitas sobre o corpo baixado, com `json` da biblioteca padrão.
- **Nenhum CPF e nenhum nome de pessoa física aparece neste documento.** As duas fontes do CE devolvem `cpfCnpj` e nome do interessado em texto claro; isso está tratado na seção 8 e é obrigação do coletor sanitizar antes de gravar.

## 3. Pernambuco (CPRH) — URLs sondadas

| URL | Status | Corpo | Leitura |
|---|---|---|---|
| `https://transparencia.pe.gov.br/robots.txt` | 200 | 124 B | WordPress; só `Disallow: /wp-admin/` |
| `https://transparencia.pe.gov.br/gestao-ambiental` | 200 | 346.520 B | 301 → `/gestao-estadual/gestao-ambiental/`; **é menu, não dado** |
| `https://www2.cprh.pe.gov.br/robots.txt` | 200 | 122 B | mesmo `robots.txt` de WordPress |
| `https://www2.cprh.pe.gov.br/` | 200 | 156.723 B | site institucional da CPRH |
| `https://www.cprh.pe.gov.br/` | **000** | 0 B | timeout na 443 (host antigo sem HTTPS servindo) |
| `http://www.cprh.pe.gov.br/` | 200 | 156.723 B | 301 → `www2.cprh.pe.gov.br` |
| `https://www2.cprh.pe.gov.br/consulta-a-servicos/` | 200 | 86.119 B | **hub oficial**: 15 links de consulta, 8 deles para sistemas em outras portas |
| `http://www.cprh.pe.gov.br:81/robots.txt` | 200 | 104 B | **`Disallow: /notastecnicas`, `/silia`, `/silian`, `/pmapper`** |
| `https://sistemas.cprh.pe.gov.br:8383/robots.txt` | 404 | 208 B | sem `robots.txt` publicado |
| `http://…:81/silian/grid_licenca_1/grid_licenca_1.php` | 200 | 105.557 B | grade "Consulta por licenciamento ambiental": formulário com 9 filtros |
| `…grid_licenca_1.php` POST `nmgp_opcao=busca` | 200 | 1.066 B | só um auto-submit para o passo 2 |
| `…grid_licenca_1.php` POST `nmgp_opcao=pesq` | 200 | 60.624 B | **20 registros**, 6 colunas |
| `…grid_licenca_1.php` POST `rec=21` | 200 | 60.453 B | 20 registros novos, zero repetição |
| `…grid_licenca_1.php` POST `nmgp_quant_linhas=100` | 200 | 203.125 B | **100 registros por página, funciona** |
| `…grid_licenca_1.php` POST `rec=100000` e `rec=300000` | 200 | 60.652 B | mesma última página (registros de 2014): **acervo ≈ 100 mil lançamentos** |
| `http://…:81/silian/grid_autoinfra/grid_autoinfra.php` | 200 | 88.006 B | "Consulta por auto de infração": exige **nº do auto + CPF/CNPJ + razão social** |
| `http://…:81/silia/con_pesqprocesso_portal/con_pesqprocesso_portal.php` | 200 | 119.212 B | consulta por processo (um por vez) |
| `http://…:81/silia/control_consulta_licenca/control_consulta_licenca.php` | 200 | 301 B | casca vazia (frame), não é consulta |
| `https://sistemas.cprh.pe.gov.br:8383/portal/grid_tec_busca/` | 200 | 24.679 B | "Consultar processos": exige **tipo de pessoa + CPF/CNPJ + nº do processo** |
| `…/silian/detalhe_licenca/detalhe_licenca.php` POST com `idlicenca` | 200 | 835.429 B | **ignora o parâmetro e devolve sempre o 1º registro da sessão** (testado 3×, 3 formatos de `parms`) |
| `…/silian/detalhe_licenca/detalhe_licenca.php` POST com `idprocesso` | 200 | 8.663.823 B | outro aplicativo, 8,6 MB por página |
| `https://dados.pe.gov.br/robots.txt` | 200 | 122 B | aberto (WordPress) |
| `https://dados.pe.gov.br/api/3/action/package_list` | 200 | 1.712 B | **47 conjuntos: todos fiscais/financeiros, nenhum ambiental** |
| `https://dados.pe.gov.br/api/3/action/package_search?q=licenca+ambiental` | 200 | 215 B | `count: 0` |
| `https://dados.pe.gov.br/api/3/action/package_search?q=CPRH` | 200 | 215 B | `count: 0` |
| `https://www2.cprh.pe.gov.br/publicacoes-de-avaliacao-de-impacto-ambiental-2/` | 200 | 85.760 B | só links de EIA/RIMA, RAS, audiência pública — sem lista de licenças |
| `https://www2.cprh.pe.gov.br/sitemap.xml` | 200 | 2.403 B | 301 → `wp-sitemap.xml` |

## 4. Pernambuco — o que é coletável hoje

**Tecnicamente: a grade de licenças. Juridicamente: nada, por causa do `robots.txt`.**

### 4.1 A grade de licenças (medida, não autorizada)

`grid_licenca_1.php` é um aplicativo ScriptCase. A busca é em dois passos: `POST` com `nmgp_opcao=busca` devolve um auto-submit, e o segundo `POST` com `nmgp_opcao=pesq` devolve a grade. Sessão por cookie, sem login.

O que uma busca vazia devolve — **20 linhas por padrão, 100 com `nmgp_quant_linhas=100`**:

| Coluna da grade | Exemplo de forma |
|---|---|
| Licença | `01.09.01.000001-4` |
| Processo | `000064/2009` |
| Razão Social | nome do empreendedor (pessoa jurídica ou física — sanitizar) |
| CNPJ / CPF | documento, sem máscara de proteção |
| Tipo | `AUT`, `LP`, `LI`, `LO`, `RLO`, `PLI` |
| Emissão | `15/01/2009` |

Paginacão por `POST` com `nmgp_opcao=rec&rec=<offset>`; os offsets são absolutos e não repetem registro (testado em `rec=21`). Pedir `rec=100000` e `rec=300000` devolve a mesma página final, o que coloca o acervo na casa de **~100 mil lançamentos**.

O que a grade **não** tem: município, atividade, validade. Os filtros de Região de Desenvolvimento e Município existem no formulário, mas o de município é um `<select>` carregado por AJAX a partir da região; mandar o código IBGE cru (`2611606`) não estreitou o resultado de forma comprovável, então **não confirmo filtro por município**.

### 4.2 A página de detalhe é um beco

A grade oferece link para `detalhe_licenca.php`, que traria Município, Tipologia, Porte, Validade e o texto de Caracterização. O aplicativo **ignora o identificador** enviado: com `idlicenca`, com a string exata do link (`nmgp_lig_edit_lapis?#?S?@?idlicenca?#?…`) e com `idprocesso`, as três tentativas devolveram o **primeiro registro da sessão**. Além disso, 835 KB por página (é um formulário que carrega listas de opções inteiras) e 8,6 MB na variante por processo. Ou seja: mesmo que a permissão existisse, buscar município por registro custaria centenas de GB.

### 4.3 Autos de infração

`grid_autoinfra.php` exige **nº do auto + CPF/CNPJ + razão social** — é consulta nominal, não listagem. Não serve para coleta em massa nem se o `robots.txt` permitisse.

### 4.4 Dados abertos do estado

`dados.pe.gov.br` é CKAN e responde bem, mas os 47 conjuntos são despesa, receita, contratos, diárias, servidores. Busca por "licenca ambiental" e por "CPRH" devolve `count: 0`.

## 5. Ceará (SEMACE) — URLs sondadas

| URL | Status | Corpo | Leitura |
|---|---|---|---|
| `https://servicos.semace.ce.gov.br/robots.txt` | 404 | 12.010 B | **sem `robots.txt`** (404 com HTML do app) |
| `https://servicos.semace.ce.gov.br/consultaProcesso` | 200 | 12.167 B | **casca**: JSF/PrimeFaces com `<div id="root">` e bundle React; formulário vazio no HTML |
| `https://servicos.semace.ce.gov.br/consultaProcessoFiscalizacao` | 200 | 12.228 B | mesma casca |
| `https://servicos.semace.ce.gov.br/consultaDoc` | 200 | 17.023 B | mesma casca (documentos digitais) |
| `https://servicos.semace.ce.gov.br/home` | 200 | 15.820 B | mesma casca |
| `https://servicos.semace.ce.gov.br/SemaceMobileWeb/resources/bundle.js?v=18` | 200 | 3.140.484 B | **revela a API**: `URL_BASE = //host/SemaceMobileWS/webService/` |
| `https://www.semace.ce.gov.br/` | 200 | 268.268 B | 301 → `www.ce.gov.br/semace/` (portal do estado) |
| `https://www.semace.ce.gov.br/robots.txt` | 404 | 140.098 B | devolve o HTML do portal, não `robots` |
| `https://www.ce.gov.br/robots.txt` | **403** | 199 B | WAF barra |
| `https://dados.ce.gov.br/` | **403** | 2.714 B | WAF barra a home |
| `https://dados.ce.gov.br/api/3/action/package_search?q=licenca+ambiental` | **403** | 2.714 B | WAF barra até a API CKAN pública |
| `https://transparencia.ce.gov.br/robots.txt` | 200 | 40.407 B | 301 → `cearatransparente.ce.gov.br`; não é `robots`, é a SPA |
| `GET …/consultaProcesso/infofilters` | 200 | 115.747 B | **184 cidades, 402 atividades, 125 tipos de licença, 129 UCs** |
| `POST …/consultaProcesso/processos` com `{"filter":{}}` | **500** | 455 B | filtro vazio é rejeitado |
| `POST` idem com o objeto de filtro no formato do app | 200 | 10.900 B | **`totalRegistro: 205.820`**, 10 registros |
| `POST` idem com `limit: 1000` | 200 | 1.066.793 B | **1.000 registros** |
| `POST` idem com `limit: 5000` e `pagina: 1` | 200 | 5.316.586 B | **5.000 registros** numa resposta |
| `POST` idem com `limit: 5000` e `pagina: 0` | **504** | 0 B | gateway estourou; páginas grandes são instáveis |
| `POST` idem com `cidadeId: [1122]` | **500** | 455 B | filtro por município, no formato de lista, quebra |
| `POST` idem com `cidade: "Abaiara"` | 200 | 176 B | zero registro: filtro por nome também não pega |
| `POST …/consultaProcesso/downloadListArquivo` (`limit: 20`) | 200 | 12.288 B | **XLS BIFF de verdade**, 16 colunas |
| `POST …/fiscalizacao/findProcessosFiscalizacao` (`{"filter":{"numeroDocumento":null}}`) | 200 | 9.877 B | **`totalRegistro: 17.974`**, 10 autos |
| `POST …/fiscalizacao/downloadListArquivo` | **500**, depois **504** | 455 B, 92 B | exportação da fiscalização está quebrada hoje |

## 6. Ceará — licenciamento pela API

### 6.1 A chamada que funciona

O app é React; o dado nunca vem no HTML. O `bundle.js` (3,1 MB) expõe estes caminhos:

```
URL_BASE = //servicos.semace.ce.gov.br/SemaceMobileWS/webService/
  consultaProcesso/infofilters                  GET
  consultaProcesso/processos                    POST  (pagina, limit, filter)
  consultaProcesso/downloadListArquivo          POST  -> XLS
  consultaProcesso/downloadListArquivoPdf       POST  -> PDF
  consultaProcesso/findHistoricoAndDocumentos   GET   (?processoId=&spu=)
  consultaProcesso/geraLicencaPDF               GET   (?processoid=&grupoprocessoid=)
  consultaProcesso/shape                        GET   (?spu=)
  fiscalizacao/findProcessosFiscalizacao        POST
  fiscalizacao/downloadListArquivo              POST  (quebrado hoje)
  fiscalizacao/findInfoFilters                  GET
  publicacao/publicacoes, publicacao/findDocumentos, publicacao/infofilters
```

Duas armadilhas de protocolo, ambas medidas:

1. `Content-Type` tem de ser **`text/plain`** (é o que o app manda). Com `application/json` o servidor responde **415**.
2. O `filter` **não aceita objeto vazio nem parcial**: `{"filter":{}}` dá 500. Tem de ir o objeto completo que o app monta — 30 chaves, com `null`/listas vazias nos campos sem critério, incluindo `digital`, `digitalFilter`, `unidadesConservacoes: ""`, `marker` e `page`. Com esse objeto, a busca vazia passa.

### 6.2 O que uma página devolve

Busca sem critério, `limit: 10`: `totalRegistro: 205.820`. Com `limit: 1000`, 1.000 registros e 1,07 MB. Com `limit: 5000`, 5.000 registros e 5,3 MB — ou seja, **42 requisições de 5.000 cobrem os 205.820** (na prática, lotes de 1.000 são mais estáveis; ver o 504 na seção 5).

Os 28 campos por processo:

`processoId`, `spuId`, `tipoProcessoID`, `grupoProcessoId`, `tipoProcesso`, `siglaTipo`, `interessado`, `dataCadastro`, `cpfCnpj`, `cidade`, `cidadeId`, `localizacao`, `licencaId`, `empreendimento`, `empreendimentoId`, `empreendimentoLocalizacao`, `empreendimentoAtividade`, `dataEmissao`, `dataValidade`, `atividade`, `digital`, `fatorGerador`, `latitude`, `longitude`, `situacao`, `apenasUC`, `zona`, `area`, `atividades`.

Exemplo real, com os campos pessoais removidos:

```
processoId 0000547662 | spuId 08399125/2023 | siglaTipo LAC
tipoProcesso "Licença Ambiental por Adesão e Compromisso"
cidade Abaiara (cidadeId 1122) | licencaId 19449/2023
empreendimentoAtividade "Criação de animais sem abate (Bovinocultura e Bubalinocultura)"
dataCadastro 2023-10-16 | dataEmissao 2023-11-20 | dataValidade 2026-11-20
situacao ... | latitude -7,3297 | longitude ... | digital true
```

As siglas mais frequentes numa amostra de 1.000: `LAC` (343), `RENLO` (157), `LO` (75), `REGLO` (57), `LI` (36), `AUTAMB` (32), `DESMAT` (29), `LP` (27), `LMT` (23), `LA` (16). A amostra de 1.000 cobre poucas cidades — a ordenação do servidor agrupa, então **não** dá para inferir distribuição municipal de uma página.

### 6.3 O XLS, que é o caminho mais barato

`POST consultaProcesso/downloadListArquivo` com `{"filter": <objeto completo>, "limit": N}` devolve um `.xls` BIFF (12.288 B para 20 linhas). As 16 colunas, lidas do próprio arquivo:

`SPU`, `INTERESSADO`, `CPF/CNPJ`, `ATIVIDADE`, `ABERTURA`, `PROCESSO`, `TIPO`, `CIDADE`, `ENDEREÇO`, `DOCUMENTO`, `DATA EMISSÃO`, `DATA DE VALIDADE`, `SITUAÇÃO`, `LATITUDE`, `LONGITUDE`, `UNIDADE DE CONSERVAÇÃO`, `ZONA`.

Esse é o formato que serve à página pública: município, atividade, tipo, emissão, validade e situação numa linha só. Não medi um `limit` grande nessa rota (o JSON já deu 504 numa faixa alta), então o coletor deve fatiar.

### 6.4 O de-para de municípios e atividades

`infofilters` (115 KB, sem login) entrega `cidades` com `idCidade`, `descricaoCidade` e **`codigoIbge`** — 184 municípios do CE. Isso é o que permite casar o registro com a malha do IBGE sem trabalho de adivinhação. Também traz `atividades` (402, com `codigo`, `descricao`, `nomeAtividade`), `tiposLicenca` (125) e `unidadesConservacoes` (129).

## 7. Ceará — fiscalização (autos)

`POST fiscalizacao/findProcessosFiscalizacao` com `{"filter":{"numeroDocumento":null}}` responde **sem exigir critério**: `totalRegistro: 17.974`, 10 autos por página.

Campos: `processoId`, `spuId`, `tipoProcessoId`, `tipoProcesso`, `numeroDocumento`, `dataCadastro`, `cliente`, `cpfCnpj`, `endereco`, `cidadeId`, `cidade`, `estado`, `descricao`, `coordutmme`, `coordutmmn`, `dataAutuado`, `valor`, `tipoInfracao`, `dae`, `statusJulgamento`, `fundamentacao`.

É a fonte mais forte dos dois estados para controle social: **valor da multa, tipo de infração, data da autuação e status do julgamento** por município. A exportação em XLS dessa rota devolveu **500** e depois **504** — o JSON funciona, o arquivo não.

## 8. O que está bloqueado e por quê

| Fonte | Situação | Por quê |
|---|---|---|
| PE — grade de licenças (`:81/silian/`) | **proibida** | `robots.txt` do mesmo host: `Disallow: /silian` |
| PE — consulta de processo (`:81/silia/`) | **proibida** | `robots.txt`: `Disallow: /silia` |
| PE — autos de infração (`:81/silian/grid_autoinfra`) | **proibida e inviável** | `Disallow` + exige nº do auto e CPF/CNPJ |
| PE — detalhe de licença | **inacessível** | devolve sempre o 1º registro da sessão; 835 KB por página |
| PE — Portal da Transparência (`/gestao-ambiental`) | **vazio** | é menu com dois links externos; nenhum dado próprio |
| PE — filtro por município na grade | **não confirmado** | `<select>` dependente carregado por AJAX; código IBGE cru não estreitou |
| PE — `dados.pe.gov.br` | **vazio para o tema** | 47 conjuntos, zero ambiental |
| CE — `www.ce.gov.br`, `dados.ce.gov.br` | **bloqueado por WAF** | 403 na home, no `robots.txt` e na API CKAN pública |
| CE — portal JSF (`/consultaProcesso`) | **não serve** | HTML é casca; o dado está na API e é lá que se coleta |
| CE — filtro por município na API | **não funciona** | `cidadeId: [...]` → 500; `cidade: "Nome"` → 0 registro. **Filtrar do nosso lado, pelo campo `cidade`** |
| CE — export XLS da fiscalização | **quebrado hoje** | 500 e 504 em duas tentativas |

**Dado pessoal — obrigação de sanitização (os dois estados).** CE devolve `interessado`, `empreendimento` (muitas vezes o nome da pessoa física) e `cpfCnpj` em texto claro; a fiscalização devolve `cliente` e `cpfCnpj`. PE devolve razão social e CNPJ/CPF na grade. Regra do projeto: CPF nunca é gravado nem exibido, apenas CNPJ de 14 dígitos é mantido. O coletor do CE **tem** de passar por `checar-dado-pessoal-em-dado.py` antes de qualquer carga.

## 9. robots.txt e termos — leitura literal

**Pernambuco**

```
# http://www.cprh.pe.gov.br:81/robots.txt
User-agent: *
Disallow: /notastecnicas
Disallow: /silia
Disallow: /silian
Disallow: /pmapper
```

`transparencia.pe.gov.br` e `www2.cprh.pe.gov.br` têm `robots.txt` de WordPress, abertos, só com `/wp-admin/` fora. **O problema é a porta 81**, onde moram os sistemas de consulta.

**Ceará**

- `servicos.semace.ce.gov.br/robots.txt` → **404**. Não há diretriz publicada.
- `www.ce.gov.br/robots.txt` e `dados.ce.gov.br` → **403** (WAF).
- Não encontrei termo de uso que proíba acesso automatizado à API. Ainda assim: é servidor público, então 2 s entre chamadas, lotes moderados e UA honesto continuam valendo.

## 10. Veredito por fonte

| Fonte | Veredito | Dificuldade | Ganho cívico em uma frase |
|---|---|---|---|
| CE — `consultaProcesso/processos` (JSON) | **integrar agora** | baixa | 206 mil processos de licenciamento com município, atividade, emissão e validade em 42 requisições. |
| CE — `consultaProcesso/downloadListArquivo` (XLS) | **integrar agora** | baixa | O mesmo acervo já tabulado em 16 colunas, sem escrever parser de HTML. |
| CE — `fiscalizacao/findProcessosFiscalizacao` (JSON) | **integrar agora** | baixa | 18 mil autos com valor de multa, tipo de infração e status de julgamento por município. |
| CE — `consultaProcesso/infofilters` | **integrar agora** | baixa | De-para oficial de 184 municípios com código IBGE, base para publicar por cidade. |
| CE — `downloadListArquivo` da fiscalização | **espera** | média | Export está com 500/504; o JSON cobre o mesmo dado hoje. |
| PE — grade `/silian/grid_licenca_1.php` | **impossível hoje** | alta | `robots.txt` proíbe o caminho; só LAI/ofício ou mudança de política libera. |
| PE — autos `/silian/grid_autoinfra.php` | **impossível** | alta | Proibido por `robots` e ainda exige documento do autuado: consulta nominal, não listagem. |
| PE — Portal da Transparência `/gestao-ambiental` | **impossível** | — | Não tem dado, tem menu. |
| PE — `dados.pe.gov.br` | **impossível** | — | 47 conjuntos fiscais, nenhum ambiental. |
| CE — `dados.ce.gov.br` | **impossível** | — | WAF devolve 403 na API pública. |

## 11. O que eu não medi

- **Total de licenças do PE.** O acervo está na casa de 100 mil (offset 100.000 cai na última página), mas não fiz busca binária de fronteira porque a fonte está barrada por `robots`.
- **Filtro por município no PE.** O código IBGE cru não estreitou a amostra; descobrir o código interno exigiria engenharia reversa do AJAX — trabalho sem uso, já que o caminho é proibido.
- **Detalhe por registro no PE.** As três tentativas devolveram o primeiro registro da sessão. Não insisti.
- **Um `limit` grande no XLS do CE.** O JSON deu 504 numa faixa alta; não arrisquei um arquivo de dezenas de MB.
- **A última página do CE.** 205.820 ÷ 5.000 = 42ª página arredondada. Não abri a página 41 para confirmar.
- **`dados.ce.gov.br` por outro caminho.** O 403 pode ser específico do UA; não tentei UA alternativo, e não tentei porque contornar WAF estaria fora da regra.
- **Termos de uso escritos.** Não achei página de termos na API do CE; registrei a ausência em vez de presumir permissão.

## 12. Ordem recomendada

1. **CE — licenciamento pelo XLS** (`downloadListArquivo`), fatiado, com CPF/razão social de pessoa física suprimidos na entrada do parser.
2. **CE — fiscalização pelo JSON**, que é o dado com maior apelo de controle social (multa, tipo, julgamento).
3. **CE — `infofilters`** versionado como de-para de municípios (código IBGE).
4. **PE — só depois de resposta a pedido formal** à CPRH/SIC-PE pedindo liberação das consultas ou arquivo aberto mensal. Enquanto o `robots.txt` estiver assim, coletar é violar a regra do projeto.
