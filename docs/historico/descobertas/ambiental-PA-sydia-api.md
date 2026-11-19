# Ambiental PA — a API interna do portal Sydle da SEMAS-PA (consulta-geral, consulta-mapa, atos autorizativos)

> **Tipo:** HISTORICO / descoberta
> **Domínio:** ambiental-PA
> **Data da medição:** 17/11/2026
> **Método:** `GET` simples, sem navegador, sem JS executado (**21 requisições** ao host, 1,5–2 s de pausa)
> **User-Agent usado:** `finweejur/github artur colito` (honesto, sem UA de navegador)
> **Status:** descoberta. **Não** existe coletor. Nada foi gravado em `apps/web/data`, nada foi ao banco.

## Sumário

- [1. Resposta curta](#1-resposta-curta)
- [2. O que foi sondado ao vivo](#2-o-que-foi-sondado-ao-vivo)
- [3. A forma real da API (lida no JS da SPA)](#3-a-forma-real-da-api-lida-no-js-da-spa)
- [4. O token que a página entrega a todo visitante é inválido](#4-o-token-que-a-página-entrega-a-todo-visitante-é-inválido)
- [5. O que dá para ver sem autenticação](#5-o-que-dá-para-ver-sem-autenticação)
- [6. robots.txt: dois blocos contraditórios](#6-robotstxt-dois-blocos-contraditórios)
- [7. Veredito](#7-veredito)
- [8. Armadilhas para quem tentar de novo](#8-armadilhas-para-quem-tentar-de-novo)

## 1. Resposta curta

**Não existe API pública. Fora de alcance.**

O portal `portal-servicos-sistemas.semas.pa.gov.br` é uma SPA **Sydle ONE** (produto comercial). A API interna é real e responde JSON — mas **toda rota de dado exige autenticação**:

- sem token → `401` com `{"error":"authentication_error"}` (32 B);
- com o token que a própria página publica no HTML → `401` com `{"errorDescription":"User unauthorized.","error":"invalid_token"}` (66 B).

Não há como medir registro, campo, filtro por município nem paginação: **não há um único registro acessível**. Por isso **não foi escrito coletor** — escrever `scripts/coletar-semas-pa-atos.py` contra este host produziria um arquivo vazio com cara de sucesso, que é pior que um arquivo ausente.

A suspeita anterior registrada em `ambiental-PA-semas.md` ("os dados vêm de `/api/1/www/…`") está **confirmada e corrigida**: o caminho existe, o formato do caminho não era o que se supunha, e o que falta é credencial.

## 2. O que foi sondado ao vivo

Todas as 21 requisições em 17/11/2026, mesmo host, sem 403 e sem 429. "Corpo" é o tamanho real medido.

| # | URL | Status | Corpo | Leitura |
|---:|---|---:|---:|---|
| 1 | `/consulta-geral` | 200 | 25.311 B HTML | casca da SPA, sem dado (já sabido) |
| 2 | `/api/1/www/paginas` | **404** | 5.932 B `text/html` | não é rota; erro vem como HTML, não JSON |
| 3 | `/api/1/www/datasets` | **404** | 5.932 B `text/html` | idem |
| 4 | `/api/1/www/consultas` | **404** | 5.932 B `text/html` | idem |
| 5 | `/api/1/www/atos-autorizativos` | **404** | 5.932 B `text/html` | idem |
| 6 | `/api/1/www/documentos` | **404** | 5.932 B `text/html` | idem |
| 7 | `/api/1/www/pesquisa` | **404** | 5.932 B `text/html` | idem |
| 8 | `/api/1/www` | **404** | 5.932 B `text/html` | idem |
| 9 | `/api/1/www/search?q=licenca` | **404** | 5.932 B `text/html` | idem |
| 10 | `/api/1/www/com.sydle.ui/Application/getApplicationScripts/v:b75ca721…/es-module-shims.js?fileId=65c4df89…` | 200 | 40.643 B `text/javascript` | **controle**: `/api/1/www/` serve arquivo público |
| 11 | `/api/1/www/_system/_organization/_organizationConfigs` | **401** | 32 B JSON | `{"error":"authentication_error"}` |
| 12 | `/api/1/www/_system/_organization/_get` | **401** | 32 B JSON | idem |
| 13 | `/api/1/www/_system/_organization/_get?_id=000000000000000000000001` | **401** | 32 B JSON | idem — não é o `_id` que falta |
| 14 | `/api/1/www/_system/_organization/_organizationConfigs` **+ Bearer da própria página** | **401** | 66 B JSON | `invalid_token` |
| 15 | `/api/sys/rest/appInfo` | 200 | 88 B JSON | `{"build":"2026-11-06T20:48:35.187377199Z","project":"env-one-cloud","version":"8.38.10"}` |
| 16 | `/robots.txt` | 200 | 2.701 B | ver §6 |
| 17 | `/ui-package/v:7467dd3c…/consulta-geral/build/consulta-geral.esm.js?v=1.1.6` | 200 | 1.524 B | entry do componente da consulta |
| 18 | `/ui-package/v:7467dd3c…/consulta-geral/build/p-B34MV3Vr.js` | 200 | 17.828 B | runtime Stencil, sem URL de API |
| 19 | `/ui-package/v:7467dd3c…/consulta-geral/build/p-1356c9abeb25dae21056ed51.js` | **404** | 70 B texto | `Arquivo não encontrado na rota "build/p-…"` (em português) |
| 20 | `/ui-package/v:d6cb30c1…/ui-api/index.js` | 200 | 595 B | índice que reexporta o chunk |
| 21 | `/ui-package/v:d6cb30c1…/ui-api/chunk-TLCMRSG7.js` | 200 | 127.252 B | **é aqui que a URL da API é montada** |

O item 15 é o achado mais seco: **o mesmo host serve JSON sem token** (`/api/sys/rest/appInfo`). Ou seja, o servidor não bloqueia por IP nem por UA — bloqueia **os métodos de dado**, que são autenticados.

## 3. A forma real da API (lida no JS da SPA)

No `chunk-TLCMRSG7.js` (item 21) a função que monta a rota é literal:

```js
function aa(r){ let {packageIdentifier:e, classIdentifier:t}=r, {_classId:s}=r,
  {methodIdentifier:n}=r, {_id:i}=r, o=[];
  return s ? o=[Zs,s] : t && e && (o=[e,t]), n && (o=[...o,n]), i && o.push(i), o.join("/") }
```

E o prefixo vem do `<script id="ui-dependencies-config">` do HTML:

```
BASE_API_URL = https://portal-servicos-sistemas.semas.pa.gov.br/api/1/
APPLICATION_IDENTIFIER = servicedesk-embedded-servicos-sistemas
ORGANIZATION_IDENTIFIER  = atos-autorizativos
```

Somando as duas coisas e o src do item 10 (que é `/api/1/www/…`), o caminho é:

```
/api/1/{app}/{pacote}/{Classe}/{metodo}[/{_id}][?chave=valor]
```

com `{app}` = `www`.

**Consequência prática:** os chutes que começam a sondagem (`/api/1/www/paginas`, `/datasets`, `/consultas`, …) **não têm a forma da API** — faltam dois segmentos. O 404 deles não diz nada sobre a existência do dado: é a SPA respondendo "não achei essa rota" em HTML de 5.932 B. Quem repetir a sondagem deve partir da forma de 3 segmentos, e não da lista de substantivos.

Os métodos conhecidos por leitura do JS são todos de sistema: `_system/_organization/_organizationConfigs`, `_organization/_get`, `_checkPerm`, `_checkPermBatch`. Os métodos de dado da consulta (município, ato autorizativo, CAR) ficam no bundle do componente `sy-lib-consulta-geral-car`, que **não foi obtido**: o nome `p-1356c9abeb25dae21056ed51.js` (o id declarado no entry) devolve 404 (item 19), e o mapa de chunks só aparece em execução.

## 4. O token que a página entrega a todo visitante é inválido

O HTML de `/consulta-geral` carrega, em texto puro, um JWE de **794 caracteres** em `ui-api.REQUEST_PARAMS.headers.Authorization`, e outro em `service-desk-components.SD_EMBEDDED_GUEST_TOKEN` (usado só em `/one-form-guest`). Ele é servido a **qualquer** visitante: não é sessão de usuário logado e não houve login em nenhum momento.

Mesmo assim **não abre nada**: com ele no cabeçalho, o mesmo endpoint devolve `401 invalid_token` (item 14). O token embutido está vencido/rotacionado; a SPA o renova por um caminho que envolve a camada de autenticação.

**Aqui a sondagem parou**, de propósito. Descobrir e automatizar esse caminho de renovação seria contornar autenticação — o que a regra do repo proíbe, e o que este documento registra em vez de fazer. Nenhum endpoint de login, sessão ou refresh foi tocado.

## 5. O que dá para ver sem autenticação

Só o suficiente para saber que o portal é grande:

| Rota da SPA | Título no HTML |
|---|---|
| `/atos-autorizativos` | Atos Autorizativos |
| `/consulta-geral` | (sem título — conteúdo por componente) |
| `/consulta-mapa` | (sem título) |
| `/suspensos-e-cancelados` | Suspensos e Cancelados |
| `/listagem-tcas` | Listagem de TCAs |
| `/regularizacao-ambiental` | Regularização ambiental |
| `/denuncias-ambientais` | Denúncias Ambientais |
| `/cars-e-pra` | CAR e PRA |
| `/meus-atos-autorizativos`, `/minhas-solicitacoes`, `/minhas-notificacoes` | área do titular (login) |

A lista de rotas vem do `window.SYDLE.app` do HTML. **Nenhuma delas entrega número por HTTP simples**: todas são componentes que consultam a API autenticada.

## 6. robots.txt: dois blocos contraditórios

O mesmo host publica, no mesmo arquivo (2.701 B), dois grupos para `User-agent: *`:

```
User-agent: *
Content-Signal: search=yes,ai-train=no,use=reference
Allow: /
… (bloco da Cloudflare com GPTBot, ClaudeBot, CCBot etc.: Disallow: /) …
User-agent: *
Disallow: /
```

O primeiro permite, o segundo proíbe. Pela regra do repo, **termo ambíguo não vira coleta**: somado ao 401, o host está fora. Registro a contradição para que ninguém leia só a primeira metade do arquivo e conclua que está liberado.

## 7. Veredito

**Fora de alcance — não vira coletor.**

| O que se queria | Situação medida |
|---|---|
| JSON público em `/api/1/www/…` | **Não.** 401 em toda rota de dado; `authentication_error` sem token, `invalid_token` com o token da página |
| Quantos registros | **Não medido** — não há registro acessível |
| Campos | **Não medidos** |
| Filtro por município | **Não testável** — depende de método autenticado |
| Paginação | **Não testável** |
| Atos autorizativos / licenças por município | **Fora de alcance** por esta porta |

O que continua valendo para o Pará, e já está medido em outro lugar:

- **SIMLAM Público** (`monitoramento.semas.pa.gov.br/simlam/`): empreendimentos com município, CNPJ e situação, sem login — é a fonte real (`ambiental-PA-semas.md`).
- **Portal da Transparência Ambiental** (`portaldatransparencia.semas.pa.gov.br`): audiências, EIA e RIMA por API aberta — já é coletor (`ambiental-PA-estudos.md`, `coletar-semas-pa-estudos.py`).

Este documento fecha a terceira porta: **o portal Sydle não é fonte pública**. Não é falha de método nem de UA — é autenticação.

**Custo de retentar:** ~20 requisições para reconferir em 5 minutos. Só vale a pena se a SEMAS publicar uma consulta aberta (sinal: `consulta-geral` passando a devolver HTML com dado, ou aparecer um `/api/1/www/…` público nos devtools de um visitante anônimo).

## 8. Armadilhas para quem tentar de novo

- **404 aqui é HTML de 5.932 B, não JSON.** Checar `Content-Type`, nunca só o status: uma casca de 25 KB com 200 já enganou uma vez.
- **Substantivo solto não é rota.** `/api/1/www/documentos` é 404; a API exige `pacote/Classe/metodo`. Sondar por dicionário de palavras só gasta requisição.
- **O 200 de `/api/sys/rest/appInfo` não é sinal de API aberta.** Serve para provar que o host responde JSON público — e nada além disso.
- **O Bearer do HTML é isca vencida.** Copiá-lo não é login, mas também não abre dado; insistir nele queima o limite de requisições sem resultado.
- **`p-<id>.js` declarado no entry pode não existir** (404 com mensagem em português). Os chunks de componente só aparecem em execução.
- O host roda **Sydle ONE 8.38.10** (`env-one-cloud`, build de 06/11/2026). Se a versão mudar, a forma da URL pode mudar junto.
