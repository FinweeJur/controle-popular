# Ambiental PA — SEMAS: o licenciamento do Pará vira coletor?

> **Tipo:** HISTORICO / descoberta
> **Domínio:** ambiental-PA
> **Data da medição:** 17/11/2026
> **Método:** sondagem ao vivo com `curl` e replay de postback ASP.NET
> **User-Agent usado:** `finweejur/github artur colito` (honesto, sem UA de navegador)
> **Status:** descoberta. Nada foi gravado no banco.

## Sumário

- [1. Resposta curta](#1-resposta-curta)
- [2. O que foi sondado ao vivo](#2-o-que-foi-sondado-ao-vivo)
- [3. SIMLAM Público: a fonte real](#3-simlam-público-a-fonte-real)
- [4. Filtro por município: o ponto crítico](#4-filtro-por-município-o-ponto-crítico)
- [5. Campos disponíveis](#5-campos-disponíveis)
- [6. O que está bloqueado e por quê](#6-o-que-está-bloqueado-e-por-quê)
- [7. robots.txt e termos](#7-robotstxt-e-termos)
- [8. Veredito](#8-veredito)

## 1. Resposta curta

**Vira coletor, mas só pela metade.**

- **Empreendimentos por município: SIM.** Lista pública, sem login, sem CAPTCHA, com coluna `Município` em cada linha. 115.980 registros, 10 por página.
- **Licença em si (tipo, validade): NÃO.** Não existe campo de validade em nenhuma página pública. O grid de títulos (que traria o tipo de licença) veio vazio em 5 de 5 empreendimentos amostrados.
- **Dificuldade: média.** HTML estático, sem JS e sem captcha, mas paginação só por postback ASP.NET (é preciso reenviar `__VIEWSTATE` a cada página).

## 2. O que foi sondado ao vivo

Todas as medições feitas em 17/11/2026, uma requisição por vez, 1–2 s entre chamadas ao mesmo host.

| URL | Status | Corpo | Leitura |
|---|---|---|---|
| `https://www.semas.pa.gov.br/` | 200 | 593.952 bytes | Site institucional. Tem o menu de sistemas. |
| `https://www.semas.pa.gov.br/robots.txt` | 200 | 2.701 bytes | `User-agent: *` → `Allow: /` |
| `https://sistemas.semas.pa.gov.br/` | 200 | chunked, **nunca termina** | Estouro de timeout em 25 s e em 45 s. Não serve para coleta. |
| `https://sistemas.semas.pa.gov.br/licenciamento` | 301 → `…/licenciamento/` | — | Cai no Portal de Segurança |
| `https://sistemas.semas.pa.gov.br/licenciamento/` | 200 | 5.944 bytes | Título `Portal de Segurança` = **login** |
| `https://licenciamento.semas.pa.gov.br/` | **000** | 0 bytes | `curl: (6) Could not resolve host`. **Esse host não existe em DNS.** |
| `https://portal-servicos-sistemas.semas.pa.gov.br/consulta-geral` | 200 | 25.311 bytes | SPA Sydle. Casca vazia sem JS. |
| `https://portal-servicos-sistemas.semas.pa.gov.br/consulta-mapa` | 200 | 25.311 bytes | Mesma casca. Zero dado no HTML. |
| `https://portal-servicos-sistemas.semas.pa.gov.br/atos-autorizativos` | 200 | 25.362 bytes | Texto do corpo: "Esta aplicação requer que o JavaScript esteja ativado". Só API interna. |
| `https://pae-consulta-publica.sistemas.pa.gov.br/` | 200 | 15.365 bytes | Consulta por protocolo **com CAPTCHA** |
| `https://monitoramento.semas.pa.gov.br/robots.txt` | 200 | 2.676 bytes | `User-agent: *` → `Allow: /` |
| `https://monitoramento.semas.pa.gov.br/simlam/index.htm` | 200 | 2.017 bytes | Frameset → `index.aspx` |
| `http://monitoramento.semas.pa.gov.br/simlam/ListarProcessos.aspx` | 200 | 33.831 bytes | **Lista de processos, aberta** |
| `http://monitoramento.semas.pa.gov.br/simlam/ListarEmpreendimento.aspx` | 200 | 41.087 bytes | **Lista de empreendimentos, aberta** |
| `http://monitoramento.semas.pa.gov.br/simlam/ListarDocumentos.aspx` | 200 | 31.348 bytes | Lista de documentos, aberta |
| `http://monitoramento.semas.pa.gov.br/simlam/VisualizarProcesso.aspx?…&id=16706` | 200 | 75.311 bytes | **Detalhe por GET simples** |
| `http://monitoramento.semas.pa.gov.br/simlam/VisualizarEmpreendimento.aspx?id=11355…` | 200 | 35.832 bytes | **Detalhe por GET simples** |
| `https://monitoramento.semas.pa.gov.br/simlamtec/` | 200 | 160 bytes | Redireciona para `simlamtecnico` (técnico, com login) |

Dois alertas de método: `sistemas.semas.pa.gov.br/` devolve 200 mas **não fecha o corpo** (timeout) — 200 com corpo incompleto não é sucesso. E `licenciamento.semas.pa.gov.br` falha no DNS, não é 404.

## 3. SIMLAM Público: a fonte real

`http://monitoramento.semas.pa.gov.br/simlam/` é o SIMLAM Público. É um ASP.NET WebForms, sem JS obrigatório, **sem login e sem CAPTCHA** nas páginas de lista e de detalhe (conferido: string `captcha` ausente em 4 páginas baixadas).

Quatro listas públicas:

| Página | Filtros |
|---|---|
| `ListarProcessos.aspx` | Texto livre, tipo de processo, situação, interessado, CPF/CNPJ do proprietário, CNPJ do empreendimento, nome do empreendimento, nº do documento |
| `ListarEmpreendimento.aspx` | Texto livre, razão social, nome fantasia, CNPJ, I.E., CPF/CNPJ/RG do proprietário, **`ddlMunicipio` com as 144 cidades do PA**, UF |
| `ListarDocumentos.aspx` | CPF e CNPJ do interessado |
| `ListarResponsavelTecnico.aspx` | — |

**Volumes medidos (não estimados):**

| Consulta | Postback com `btnPesquisa` | Resultado |
|---|---|---|
| Processos, sem filtro | 200 | `Foram encontrados 164482 registros` |
| Processos, `txtBusca=Deferido` | 200 | `61048 registros` |
| Processos, `txtBusca=Belem` | 200 | `263 registros` |
| Empreendimentos, sem filtro | 200 | `115980 registros` |
| Empreendimentos, `ddlMunicipio=2428` (Belém) | 200 | `115980 registros` — **filtro ignorado** |

A busca livre é por substring e é frouxa: buscar `Deferido` devolveu linhas com situação `Indeferido`, porque "Deferido" está contido em "Indeferido".

## 4. Filtro por município: o ponto crítico

O `<select name="ctl00$baseBody$ddlMunicipio">` vem **populado no HTML** com os 144 municípios do Pará (Belém = `2428`, Abaetetuba = `2410`, …). Mas ele não filtra nada.

Testes feitos, todos com 200:

1. `ddlMunicipio=2428` sozinho → 115.980 (igual ao total sem filtro). Primeira linha: `Rondon do Pará`.
2. Postback prévio em `btnBuscaAvancada` e depois `ddlMunicipio=2428` → 115.980 de novo.
3. Texto livre `Belem` → 107 registros, mas a coluna Município trouxe `Ananindeua` e `Aurora do Pará`. Ou seja: casa com razão social, não com município.

**Conclusão medida:** não existe consulta pública de licença escopada por município. O município aparece como *coluna* da lista de empreendimentos, não como filtro. Na prática: para recortar por município é preciso baixar a lista inteira e filtrar do lado de cá.

O lado dos processos é pior: `ListarProcessos.aspx` **não tem campo de município nenhum** — nem coluna, nem filtro. As 4 colunas são Nº Processo, Empreendimento, Interessado, Situação.

## 5. Campos disponíveis

Uma página de lista devolve **10 linhas** (medido: 10 ocorrências de `fitNumeroProcesso` na página 1 de 61.048).

Paginação: `1 2 3 … 10 ...`, toda por `__doPostBack('ctl00$baseBody$gv$ctlNN$ctlMM')`. Não há `?pagina=`. Não há export CSV/JSON/XLS. Não há API.

| Campo pedido | Existe? | Onde | Preenchimento medido |
|---|---|---|---|
| Nº do processo | Sim | `ListarProcessos` + `VisualizarProcesso` | 10/10 na página |
| Município | Sim | `ListarEmpreendimento` (coluna) e `VisualizarEmpreendimento` | **8/8 amostrados** |
| Empreendedor / interessado | Sim | todas as listas e detalhes | 10/10 |
| Tipo de licença | Parcial | aba `Títulos` → coluna `Modelo` (Número, Modelo, Situação, Objetivo) | **0 títulos em 5 empreendimentos amostrados** |
| Validade | **Não** | não existe em nenhuma página pública | — |
| Coordenadas | Parcial | `VisualizarEmpreendimento` → `Coordenada` | 7/8 trazem só `DATUM: SIRGAS2000`; **1/8** com N/E reais (ex.: `N: 9087812,08 - E: 533146,71`, datum SAD69) |
| Atividade principal | Campo existe | `VisualizarEmpreendimento` → `Atividade Principal` | **0/9 preenchido** |
| Código IBGE | Campo existe | `VisualizarEmpreendimento` → `IBGE` | **0/8 preenchido** |

Detalhe do empreendimento também traz `Área`, `Porte`, `Data de Fundação`, `Inscrição Estadual`, e abas `Processos`, `Endereços` (com CEP e município), `Proprietários`, `Contatos`.

Os dois detalhes são acessíveis por **GET puro**, sem postback:
`VisualizarProcesso.aspx?UrlRetorno=ListarProcessos.aspx&id=<id>` e `VisualizarEmpreendimento.aspx?id=<id>&UrlRetorno=ListarEmpreendimento.aspx`.

## 6. O que está bloqueado e por quê

| Recurso | Situação | Motivo |
|---|---|---|
| Portal do licenciamento (`/licenciamento/`) | **Fora de alcance** | Redireciona para `portalSeguranca` = login |
| `pae-consulta-publica` (processo administrativo eletrônico) | **Fora de alcance** | Exige nº de protocolo **e CAPTCHA** (`input name="captcha"`) |
| SIMLAM Técnico (`simlamtecnico`) | Fora de alcance | Área do servidor, com login |
| `consulta-geral`, `consulta-mapa`, `atos-autorizativos` (portal Sydle) | **Inacessível por HTTP simples** | Casca de SPA; os dados vêm de `/api/1/www/…`. Sem JS o HTML sai vazio (25 KB de casca) |
| API pública de dados | Não existe | Nenhum endpoint documentado ou descoberto |
| Export CSV/JSON/XLS | Não existe | Nenhum botão e nenhum link nas 4 listas |
| Filtro real por município | Defeito do site | O select existe e é populado, mas o servidor ignora o valor |

Validade de licença não está bloqueada: ela **não é publicada**. Isso é diferente de paywall.

## 7. robots.txt e termos

Os três hosts relevantes usam o bloco padrão do Cloudflare:

```
User-agent: *
Content-Signal: search=yes,ai-train=no,use=reference
Allow: /
```

- **Coleta para indexar e publicar com link: permitida.** É o uso do Controle Popular.
- **Treinar modelo com o conteúdo: proibido** (`ai-train=no`).
- **Nenhuma restrição a agente genérico.** Os `Disallow: /` são só para crawlers de treino (GPTBot, ClaudeBot, CCBot, Bytespider, etc.). Nosso UA não está na lista.
- Não há página de termos de uso no SIMLAM. O `www` não publica termo que proíba raspagem.

## 8. Veredito

> **18/11/2026 — o acesso público fechou.** Medido ao vivo: `ListarProcessos.aspx` e
> `VisualizarEmpreendimento.aspx?id=...` agora devolvem **404**, e `index.aspx` /
> `ListarEmpreendimento.aspx` devolvem a página **"Acesso ao Sistema"** (login, 10.098 B),
> não mais a grade com "Foram encontrados 115.980 registros". O coletor parou na
> página **1.393 de 11.598** com **13.778 empreendimentos em 300 grafias de
> município** (144 existem no PA), já salvos no checkpoint e publicados como
> **parcial** em `semas-pa-empreendimentos.json` (`truncado: true`, total da fonte
> `null` com nota).
>
> Das 13.778 linhas, **13.080 (94,9%)** casam por nome exato com os 144 municípios
> do PA. As que não casam são de dois tipos: nome **truncado pela própria fonte**
> ("São Sebastião da Bo…", "Santa Maria das Bar…") e empreendedor de **outra UF**
> (São Paulo 31, Rio 18, Brasília 15, BH 10). Não é erro do coletor; é o campo.
>
> A tarefa `CP-SIMLAM-PA` continua de hora em hora por 1–2 requisições: se o
> portal reabrir, ela retoma do checkpoint sozinha. Enquanto estiver fechado, o
> coletor aborta com mensagem clara em vez de gravar catálogo vazio.


**Vira coletor agora — mas só do catálogo de empreendimentos por município. Licença fica impossível.**

O que justifica o "agora":

- Aberto: sem login, sem CAPTCHA, sem paywall, robots permite, HTML estático.
- Rende dado cívico útil: 115.980 empreendimentos, cada um com município, CNPJ, I.E. e situação.
- Custo previsível: 11.598 páginas × 2 s ≈ **6h30** para o catálogo inteiro.

O que não justifica esperar nada: **tipo de licença e validade não existem no dado público**. Não é questão de contornar bloqueio — o campo não é publicado. Um coletor que prometa "licenças deferidas em Xinguara" seria mentira.

Recomendação de escopo:

1. Coletor de `ListarEmpreendimento.aspx` com replay de `__VIEWSTATE`/`__EVENTVALIDATION` e sessão única, 1,5 s entre páginas. Saída: `municipio`, `razao_social`, `cnpj`, `inscricao_estadual`, `situacao`.
2. Detalhe por GET só depois da primeira carga, priorizando municípios do escopo do portal, porque 115.980 detalhes a 2 s custariam ~64 h.
3. **Não** construir a promessa "licença" até que a SEMAS publique títulos com validade — ou até o portal Sydle expor API aberta.

**Dificuldade: média.** Nada de JS, nada de captcha, nada de login — só incomoda o protocolo ASP.NET (viewstate por sessão, paginação por `__doPostBack`). Um `requests.Session` de 60 linhas resolve a lista; o HTML é parseável com regex ou BeautifulSoup.

Armadilhas para quem for implementar:

- `sistemas.semas.pa.gov.br/` responde 200 e trava o corpo. Não usar como sinal de saúde.
- `licenciamento.semas.pa.gov.br` não resolve — não perder tempo.
- `ddlMunicipio` aceita o valor e devolve 200 com o total inteiro. **Sempre conferir o número** de `lblQuantidade` contra o total sem filtro; senão o coletor "funciona" trazendo o Pará todo em cada município.
- Acentuação vem em ISO-8859-1 (`Bel&#233;m`, `Munic�pio`). Decodificar como `latin-1`, não UTF-8.
