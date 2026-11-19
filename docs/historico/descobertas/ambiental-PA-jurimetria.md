# Jurimetria do Pará — o que o judiciário do PA entrega hoje (TJPA, TRF1, MPF, MPPA, DataJud)

> **Tipo:** HISTORICO / descoberta
> **Domínio:** ambiental-PA, judiciário
> **Data da medição:** 17/11/2026
> **Método:** `curl` puro + leitura do bundle JS da SPA (nenhum browser automatizado, nenhum JS executado). **47 requisições**, 1–2 s de pausa por host, User-Agent honesto `finweejur/github artur colito` em todas.
> **Status:** descoberta. **Não existe coletor.** Nada foi gravado em banco, nada em `apps/web/data`, nenhum commit.

## Sumário

- [1. Resposta curta](#1-resposta-curta)
- [2. Regras que valeram nesta sondagem](#2-regras-que-valeram-nesta-sondagem)
- [3. Tabela de URLs sondadas](#3-tabela-de-urls-sondadas)
- [4. TJPA — a API real por trás da SPA](#4-tjpa--a-api-real-por-trás-da-spa)
- [5. Quanto o TJPA tem, medido](#5-quanto-o-tjpa-tem-medido)
- [6. Separar o ambiental: assunto, texto e o que não funciona](#6-separar-o-ambiental-assunto-texto-e-o-que-não-funciona)
- [7. DJe do TJPA](#7-dje-do-tjpa)
- [8. TRF1](#8-trf1)
- [9. MPF e MPPA](#9-mpf-e-mppa)
- [10. DataJud (CNJ)](#10-datajud-cnj)
- [11. O que está bloqueado e por quê](#11-o-que-está-bloqueado-e-por-quê)
- [12. Comparação com o coletor do TJMG que já existe](#12-comparação-com-o-coletor-do-tjmg-que-já-existe)
- [13. Veredito por fonte](#13-veredito-por-fonte)
- [14. Armadilhas para quem tentar de novo](#14-armadilhas-para-quem-tentar-de-novo)
- [15. Lacunas declaradas](#15-lacunas-declaradas)

## 1. Resposta curta

**O TJPA tem, sim, consulta de jurisprudência aberta — e melhor que a do TJMG.** Não é HTML para raspar: é uma SPA Angular com um **BFF JSON público**, sem login, sem chave, sem CAPTCHA, com paginação e facetas. A base declara **650.545 decisões de 2º grau** (451.183 acórdãos + 199.362 decisões monocráticas), sendo 505.717 do Tribunal e 144.828 das Turmas Recursais.

O que ela **não** tem: primeiro grau, campo de comarca/município e assunto preenchido em todo o acervo (só 12,6% das decisões têm assunto, e o vocabulário ambiental é de duas etiquetas: `dano ambiental` e `ambiental`).

O resto do Pará está pior: TRF1 fecha o site inteiro para `User-agent: *` e põe challenge Cloudflare na consulta processual; MPF e MPPA não publicam base de ACP/IC por município; o DataJud cobre o PA (2,28 milhões de processos no TJPA) mas estava intermitente hoje — 429, 504 e busca parcial em 3 de 5 shards.

## 2. Regras que valeram nesta sondagem

- User-Agent `finweejur/github artur colito` em **toda** requisição. Onde o host recusou esse UA, a resposta é "bloqueado" — **não houve troca por UA de navegador** para contornar.
- `robots.txt` lido antes de qualquer coleta. `Disallow: /` do TRF1 foi obedecido e encerrou a frente.
- CAPTCHA/challenge não foi tocado: `processual.trf1.jus.br` devolveu "Just a moment..." e a frente parou ali.
- Nenhum nome de parte nem CPF coletado ou transcrito. O campo `pessoas` da API do TJPA existe e **é PII** — foi lido só como nome de campo, nunca impresso.

## 3. Tabela de URLs sondadas

"Corpo" é o tamanho real medido em bytes, não estimativa.

| # | URL | Status | Corpo | Leitura |
|---:|---|---:|---:|---|
| 1 | `https://www.tjpa.jus.br/robots.txt` | **reset** (curl 56) | 0 | duas tentativas, mesmo resultado |
| 2 | `https://www.tjpa.jus.br/` | **reset** | 0 | o subdomínio `www` recusa nosso UA; não é DNS (porta 443 aberta) |
| 3 | `https://tjpa.jus.br/` | 200 | 153.087 B HTML | apex responde; portal é SPA por menu JS |
| 4 | `https://jurisprudencia.tjpa.jus.br/` | 200 | 31.663 B HTML | casca Angular; título "Jurisprudência do TJPA" |
| 5 | `https://jurisprudencia.tjpa.jus.br/robots.txt` | 200 | 31.663 B HTML | **não existe robots**: o servidor devolve o index para qualquer caminho |
| 6 | `.../bff/api/decisoes/filtros` | 200 | 97.055 B JSON | facetas com contagem — a mina de ouro |
| 7 | `.../bff/api/decisoes/estatisticas` | 404 | 118 B JSON | a rota citada no JS não existe no backend |
| 8 | `.../bff/api/decisoes/recentes?dataInicio=2026-01-01…` | 200 | 304.798 B JSON | jan/2026, acórdãos: **465** |
| 9 | `.../bff/api/decisoes/buscar` (POST) | 200 | 13.513.282 B | busca livre; sem chave, sem CAPTCHA |
| 10 | `https://www.trf1.jus.br/robots.txt` | 200 | 451 B | `User-agent: * / Disallow: /` — **site inteiro fechado** |
| 11 | `https://www.trf1.jus.br/` | 200 | 126.907 B HTML | responde, mas coletar é proibido pelo robots |
| 12 | `https://processual.trf1.jus.br/robots.txt` | **403** | 5.590 B | Cloudflare "Just a moment..." — challenge, parei |
| 13 | `https://jurisprudencia.trf1.jus.br/` | DNS NXDOMAIN | — | host não existe |
| 14 | `https://www.mpf.mp.br/robots.txt` | 200 | 919 B | permite conteúdo; proíbe `/search`, `/login`, `/++api++` |
| 15 | `https://www.mpf.mp.br/servicos` | 200 | 643.394 B HTML | menu de serviços |
| 16 | `https://www.mpf.mp.br/servicos/consultas` | 404 | 154.274 B HTML | caminho não existe |
| 17 | `https://www.mppa.mp.br/robots.txt` | 404 | 796 B HTML | não há robots |
| 18 | `https://www.mppa.mp.br/` | 200 | 113.151 B HTML | portal Lumis |
| 19 | `https://www.mppa.mp.br/consultas.htm` | 200 | 104.173 B HTML | página de navegação, não base de dados |
| 20 | `https://www.mppa.mp.br/consulta-processual-…-00.htm` | 200 | 100.728 B HTML | consulta por número de processo |
| 21 | `https://dje.tjpa.jus.br/` | 200 | 12.551 B HTML | app AngularJS do Diário |
| 22 | `https://dje.tjpa.jus.br/robots.txt` | 404 | 74 B | não há robots |
| 23 | `https://datajud-wiki.cnj.jus.br/api-publica/acesso/` | 200 | 14.683 B HTML | página oficial com a chave pública (não transcrita aqui) |
| 24 | `POST api_publica_tjpa/_search` (1ª) | timeout 45 s | 0 | API pública saturada |
| 25 | `POST api_publica_trf1/_search` | **429** | 11.333 B JSON | `es_rejected_execution_exception`, fila de busca cheia |
| 26 | `POST api_publica_tjpa/_search` (2ª) | 200 em 37,7 s | 1.691 B JSON | **2.280.023** processos; **3 de 5 shards OK** |
| 27 | `POST api_publica_trf1/_search` (2ª) | **504** | 161 B | gateway timeout |
| 28 | `POST api_publica_tjpa/_search` (3ª) | **504** | 161 B | caiu entre uma medição e outra |

## 4. TJPA — a API real por trás da SPA

O bundle `main-2AJV32NA.js` (3.251.775 B) declara a configuração:

```js
var Aa = { production:false, apiBaseUrl:"/bff", iaAgentUrl:"/bff", ssl:true };
apiUrl = `${Aa.apiBaseUrl}/api/decisoes`;
```

Ou seja: `https://jurisprudencia.tjpa.jus.br/bff/api/decisoes/…`. As rotas que interessam:

| Rota | Método | O que devolve | Autenticação |
|---|---|---|---|
| `/filtros` | GET | todas as facetas com `quantidade` | nenhuma |
| `/recentes?dataInicio&dataFim&origem&tipo&orgaoJulgador&page&size` | GET | lista paginada + `totalElements` | nenhuma |
| `/buscar` | POST JSON | busca livre/filtrada, com facets no retorno | nenhuma |
| `/buscar-por-numero-processo` | POST | por número CNJ | nenhuma |
| `/processo/{numero}` | GET | decisões de um processo | nenhuma |
| `/estatisticas` | GET | **404** — citada no JS, ausente no backend | — |

Payload real de `/buscar` (lido no componente, não adivinhado): `query`, `queryType`, `queryScope`, `origem[]`, `tipo[]`, `classe`, `assunto`, `relatores[]`, `orgaoJulgadorColegiado`, `dataJulgamentoInicio/Fim`, `dataPublicacaoInicio/Fim`, `page`, `size`, `sortBy`, `sortOrder`. Datas em ISO (`2025-01-01T00:00:00`).

Campos por decisão (medidos no retorno): `numeroprocesso`, `tipo`, `area`, `origem`, `sistemaorigem`, `classe{nome,codigo}`, `assuntos[]`, `idassunto`, `orgaojulgador{nome}`, `orgaojulgadorcolegiado{nome}`, `competencia`, `especie`, `datajulgamento`, `datadocumento`, `datapublicacao`, `sentidodecisao`, `temas[]`, `indexacao`, `textooriginal`, `textopuro`, `textoementa`, `ementatextopuro`, `pessoas` (**PII**), `binario`, `hashstorage`.

O `totalElements` e o `_source` vêm de Elasticsearch — a resposta ecoa o próprio `consultaUtilizada` (DSL com `aggs`). Isso é bom para auditoria e é o que permite saber que a busca é `FunctionScore` (e que ele falha com `"Cannot get 'Gauss' variant"` quando não há `queryType`).

## 5. Quanto o TJPA tem, medido

Do `/filtros` (contagem vem do próprio índice, não é soma que eu fiz):

| Medida | Valor |
|---|---:|
| Decisões no acervo | **650.545** |
| — origem "Tribunal de Justiça do Estado do Pará" | 505.717 |
| — origem "Turmas Recursais dos Juizados Especiais" | 144.828 |
| Acórdãos | 451.183 |
| Decisões monocráticas | 199.362 |
| Classes distintas | 210 |
| Assuntos distintos | 250 (somando 81.775 decisões = **12,6% do acervo**) |
| Órgãos julgadores colegiados | 49 |
| Relatores | 206 (648.376 decisões) |

Classes líderes: apelação cível 195.543; agravo de instrumento 116.618; recurso inominado cível 110.861; apelação criminal 52.627.

Volume por período, medido com `size=1` em `/recentes`:

| Período | Acórdãos | Observação |
|---|---:|---|
| jan/2026 | **465** | exato (abaixo do teto de 10.000) |
| jan/2025 | **796** | exato |
| 2023, 2024, 2025, 2026 | **10.000** (teto) | **não é contagem**, é o limite técnico da API |

Conclusão de volume: **~470 a ~800 acórdãos por mês**, medido em dois meses. Isso é a base de 2º grau do TJPA inteiro — é um acervo grande, não uma amostra de luxo.

**O teto de 10.000 é a regra mais importante deste documento.** Toda consulta que devolve mais que isso responde `"excedeuLimiteTecnico":true` e `"Mais de 10.000 resultados encontrados. Exibindo os primeiros 10.000 registros."`. Para contar, é preciso fatiar por data, tipo, órgão ou classe — nunca confiar no número bruto de uma busca ampla.

## 6. Separar o ambiental: assunto, texto e o que não funciona

**Pelo assunto (código CNJ), o acervo do PA é pobre.** Nas 250 etiquetas de assunto, as únicas ambientais são `dano ambiental` (147) e `ambiental` (136). Não existe assunto `mineração`, `desmatamento`, `fundiário`, `licenciamento` nem `unidade de conservação`. O assunto mais próximo do tema terra é `arrendamento rural` (66).

**A proporção, com o denominador certo:** 283 decisões (147 + 136) sobre 81.775 decisões que **têm** assunto atribuído = **0,35%**. Isso é **amostra de 81.775 de 650.545** (12,6% do acervo) — não é a proporção do acervo, é a proporção do subconjunto etiquetado. Dizer "0,35% das decisões do TJPA são ambientais" seria erro: 87,4% do acervo não tem assunto e o silêncio não é zero.

**O filtro por assunto não é confiável para termo composto.** Medido: `assunto:"arrendamento rural"` devolve 66 — bate exatamente com a faceta. Já `assunto:"dano ambiental"` devolve **8.657**, contra 147 na faceta. Os dois números não são a mesma medida; o filtro parece casar por termo, não por etiqueta. Consequência prática: **não usar o total de assunto multi-palavra como contagem** sem conferir a faceta.

**Pela busca livre, o número não serve para medir, só para achar.** `query:"ambiental"` em 2025 devolveu 2.681 acórdãos — plausível, mas alto. `query:"dano ambiental"` em 2025 devolveu exatamente 10.000 (teto), o que é impossível num ano com ~800 acórdãos em janeiro: **o filtro de data se perde quando a query tem dois termos**. Teste de sanidade: `query:"apelacao"` em jan/2025 = 776, contra 796 acórdãos no mês — coerente. Teste de controle: `query:"xilofonequantico zzz"` = 0, então a busca em si funciona.

**Amostra de 100 decisões** (retorno de `query:"dano ambiental"`, ordenado por relevância): preenchimento de campo medido item a item.

| Campo | Preenchido em |
|---|---:|
| `classe` | 100/100 |
| `assuntos[]` | 100/100 |
| `sentidodecisao` | 100/100 |
| `textoementa` (> 50 caracteres) | 100/100 |
| `indexacao` | 35/100 |
| `datapublicacao` | 0/100 |
| `temas[]` | 0/100 |
| área | 72 cível, 28 penal |

O `sentidodecisao` vem em texto livre ("Conhecido o recurso e não-provido") — dá para classificar resultado, mas exige normalização, exatamente como o `desfecho` do TJMG hoje majoritariamente `indeterminado`.

**Comarca/município não é campo.** O órgão julgador é o colegiado ou o relator, não a comarca. O município só sai do número CNJ (o segmento de 4 dígitos, ex.: `…8.14.0301` = comarca 0301) ou de leitura do texto. É a mesma limitação do TJMG, onde `comarca` vinha como `BELO`, `Belo Horizonte`, `BRUMADINHO` misturados.

## 7. DJe do TJPA

`https://dje.tjpa.jus.br/` responde 200 (12.551 B), é um app AngularJS (`ng-app="app"`, `ng-view`) com controllers `controllerDiarioGerado`, `controllerVisualizarDiario` e um módulo `comarca`. Não há `robots.txt` (404).

O que **não** consegui medir: os arquivos JS citados no HTML (`app/public/content/…`) devolveram 404 aos dois que tentei, então não achei o endpoint de listagem de edições nem o filtro público por comarca. **Volume diário: não medido.** Não vi CAPTCHA na home.

Leitura honesta: **publicação aberta, sim; mensurável sem browser, não nesta sessão.** O DJe é a única porta para ato de 1º grau no PA, então vale uma segunda tentativa com browser real (não com UA falso).

## 8. TRF1

A 1ª Região cobre o Pará, e é justamente onde a coleta automática morre:

- `https://www.trf1.jus.br/robots.txt` diz `User-agent: *` / `Disallow: /` — **o site inteiro**. Jurisprudência e consulta processual ficam no mesmo domínio. Coletar seria violar o robots; a frente encerra aqui, sem exceção.
- `https://processual.trf1.jus.br/` responde **403 com challenge Cloudflare** ("Just a moment...") até no `robots.txt`. Challenge não se resolve; parou.
- `jurisprudencia.trf1.jus.br` nem existe (NXDOMAIN).

Volume de processos do PA no TRF1: **não medido** — as duas tentativas no DataJud deram 429 e 504. O que existe é o caminho legítimo: pedido de acesso à informação ao TRF1, ou uso do DataJud quando ele estiver de pé (o índice `api_publica_trf1` existe e autenticou).

## 9. MPF e MPPA

**MPF.** O `robots.txt` é civilizado (proíbe só `/search`, `/++api++`, login e edição), então daria para coletar conteúdo. Mas **não há base de ACP/IC com filtro por município**: o serviço público é `consultar-processos-e-manifestacoes`, consulta por protocolo/número, feita para o cidadão acompanhar o próprio caso. Para ação civil pública ambiental no PA, o MPF publica notícia e documento, não registro pesquisável por comarca.

**MPPA.** Sem `robots.txt` (404). A home responde 200; `/consultas.htm` é página de navegação; a "Consulta Processual" é consulta por número, num sistema à parte. Existe portal de transparência e CAO Ambiental, mas **nenhuma base de inquérito civil ou ACP filtrável por município** foi encontrada. Isso é relevante porque o TAC estadual já é mapeado em outra descoberta (`ambiental-PA-mppa-tac.md`) — a via do TAC continua sendo a melhor porta para o MPPA, não a jurimetria.

## 10. DataJud (CNJ)

**Cobre o PA, sim.** Medido hoje:

| Índice | Resultado |
|---|---|
| `api_publica_tjpa` | **200** em 37,7 s, `hits.total` = **2.280.023**, mas `_shards`: 3 OK, **2 falharam** (`es_rejected_execution_exception`) |
| `api_publica_trf1` | **429** (fila cheia) e depois **504** |
| `api_publica_tjpa` (3ª tentativa) | **504** |

Precisa de chave — mas a chave é **pública e está na página oficial** `datajud-wiki.cnj.jus.br/api-publica/acesso/` (não transcrita aqui, de propósito: o repo é público e a chave roda). O `_mapping` continua 403 (proteção de LGPD), então o schema só se conhece pelos `_source` que vierem.

Sobre campos: **não medi o `_source` do TJPA nesta sessão** (as tentativas caíram em 504). O que se sabe com medição é do TJMG, registrada em `docs/historico/fontes/FONTES-CNJ-JUMA.md`: classe, assunto, órgão julgador com `codigoMunicipioIBGE`, data de ajuizamento, grau e movimentos — **sem ementa e sem inteiro teor**. Para o PA, a expectativa é a mesma, mas isso é expectativa, não medição.

O número de 2.280.023 é **piso, não total**: com 2 de 5 shards fora, o `hits.total` conta só o que respondeu.

## 11. O que está bloqueado e por quê

| Fonte | Bloqueio | Natureza |
|---|---|---|
| `www.trf1.jus.br` | `Disallow: /` no robots | **decisão da fonte** — respeitada, frente encerrada |
| `processual.trf1.jus.br` | challenge Cloudflare 403 | anti-bot — **não se contorna** |
| `www.tjpa.jus.br` | reset de conexão para UA honesto | WAF; o apex `tjpa.jus.br` funciona |
| DataJud TRF1 | 429 / 504 | instabilidade do CNJ, não bloqueio |
| DJe TJPA | endpoints não localizados | falta de browser, não falta de permissão |
| MPF / MPPA | não existe base pública de ACP/IC por município | ausência de dado |

Nenhum desses bloqueios pediu — ou recebeu — UA de navegador falso, login, certificado ou CAPTCHA resolvido.

## 12. Comparação com o coletor do TJMG que já existe

O padrão a bater no repo é o do TJMG, hoje espalhado entre `etl/judiciario/etl/tj/tjmg.py` (composição de desembargadores, Playwright), `docs/planos/PLANO-RAG-JURIMETRIA-TJMG.md` (o corpus e o contrato) e o repositório externo `X:\DevCoder\OpenCode\tjmg-jurimetria` (6.672 linhas em 3 temas, 5.426 processos únicos).

| Dimensão | TJMG | TJPA (medido hoje) |
|---|---|---|
| Acesso | busca com CAPTCHA, **humano no loop** (Gate 0 aberto) | **API JSON pública**, sem CAPTCHA |
| Ferramenta | Playwright/browser + repositório separado | `curl` + JSON, sem browser |
| Paginação | postback/cliques | `page`/`size`, com teto de 10.000 |
| Facetas | não há; classificação é posterior | `/filtros` entrega contagem por classe, assunto, órgão |
| Volume | 6.672 linhas (3 temas, curados) | **650.545 decisões** de 2º grau |
| Assunto ambiental | rubrica própria + LLM rotulando | duas etiquetas CNJ; texto livre para o resto |
| Comarca | campo sujo, precisa canonicalizar | não existe; sai do número CNJ |
| Conformidade | bloqueado por CAPTCHA e licença | API aberta; falta decidir licença/termo de uso |

**O que dá para reaproveitar, concretamente:**

1. **O contrato de dados** (`acervo.json`: processo, órgão, data, ementa, `urlEspelho`, `semFonte`) — o TJPA preenche quase tudo, e `urlEspelho` aponta para a própria decisão no portal.
2. **A disciplina de PII** (varredura `sem-cpf-no-repo`, minimização, log sem dado pessoal) — o TJPA tem `pessoas` no retorno; a regra já existe.
3. **O classificador de desfecho com sentinela `indeterminado`** — `sentidodecisao` do TJPA é texto livre, o problema é o mesmo do `desfecho` do TJMG.
4. **O RAG facetado por tema/comarca/ano/resultado** — a faceta do TJPA já vem pronta, o que o TJMG não dá.
5. **A rubrica de temas ambientais e o mapa curado** — reutilizável sem tocar no coletor.

**O que não se reaproveita:** o coletor em si. O TJPA não precisa de browser, de clique em página, nem de humano resolvendo CAPTCHA. Copiar o pipeline do TJMG aqui seria caro e pior.

## 13. Veredito por fonte

| Fonte | Dificuldade | Ganho cívico | Veredito |
|---|---|---|---|
| **TJPA — jurisprudência (`/bff/api/decisoes`)** | baixa (JSON público, facetas, sem CAPTCHA) | alto: 650 mil decisões de 2º grau do PA, com classe, órgão, data e ementa, filtráveis | **integrar primeiro** |
| **TJPA — DJe** | média (SPA sem endpoint localizado) | alto: única janela para ato de 1º grau e comarca | investigar com browser antes de prometer |
| **DataJud — TJPA** | média (chave pública, API instável, sem ementa) | alto: 2,28 mi de processos, com `codigoMunicipioIBGE` do órgão julgador | usar como espinha de contagem, não de texto |
| **DataJud — TRF1** | alta hoje (429/504) | médio: federal no PA, inclusive crimes ambientais | tentar em horário de menor carga |
| **TRF1 — site próprio** | **bloqueada** (robots `Disallow: /`) | alto em teoria | não coletar; pedir acesso ou usar DataJud |
| **MPF** | alta (não há base de ACP por município) | médio | buscar por notícia/documento, não por jurimetria |
| **MPPA** | alta (só consulta por número) | médio | seguir pela via do TAC, já mapeada |
| **CNJ CACOL / painel** | alta (Power BI sem export) | baixo sozinho | não vale; o DataJud é a fonte por trás |

## 14. Armadilhas para quem tentar de novo

1. **`www.tjpa.jus.br` não responde ao UA honesto; `tjpa.jus.br` responde.** Não é o mesmo host. Trocar UA resolve e **é proibido**.
2. **10.000 é teto, não total.** `excedeuLimiteTecnico` só aparece quando estoura; ausência do campo não garante contagem exata em consulta ampla.
3. **Data sozinha funciona; data + query de dois termos se perde** e volta ao teto. Fatiar por `tipo`, `orgaoJulgadorColegiado` ou mês.
4. **`assunto` multi-palavra casa por termo**: `"dano ambiental"` deu 8.657 contra 147 na faceta. Confira sempre contra `/filtros`.
5. **A resposta de `/buscar` é gigante** (13,5 MB num teste com `size` ignorado) porque carrega `textooriginal` e `textopuro` de cada item. Peça `size` pequeno e descarte o texto depois de extrair a ementa.
6. **`datadocumento` e `datapublicacao` não são a mesma coisa**, e `datapublicacao` veio vazio em 100/100 na amostra. Use `datajulgamento` para série temporal.
7. **O acervo é 2º grau.** Não existe sentença de primeira instância aqui; jurimetria de vara/comarca exige DJe ou DataJud.
8. **DataJud não é confiável sob carga**: timeout em 45 s, 429 na fila, 504 no gateway, e `hits.total` parcial quando shard falha. Grave sempre `_shards.failed`.

## 15. Lacunas declaradas

- Volume anual do TJPA **não medido**: só dois meses (jan/2025 = 796; jan/2026 = 465 acórdãos). O resto bateu no teto de 10.000.
- Volume diário do DJe do TJPA **não medido** — endpoints não localizados sem browser.
- Processos do PA no TRF1 **não medidos** (429/504).
- Campos do DataJud para o TJPA **não medidos nesta sessão**; a lista de campos citada é a do TJMG, já registrada em `FONTES-CNJ-JUMA.md`.
- Termo de uso específico do portal de jurisprudência do TJPA **não encontrado**: existe a política de privacidade de navegação (LGPD) no portal institucional, mas nada que autorize ou proíba republicação de ementa. Antes de publicar ementa no portal, decidir isso como se decidiu o Gate 0 do TJMG.
- A proporção ambiental de **0,35%** é sobre as 81.775 decisões com assunto atribuído (12,6% do acervo). **Não é** a proporção do acervo.
