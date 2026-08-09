# F0 — Descoberta de fontes e fundações

> **Estado:** concluída em 2026-07-24. Todo endpoint aqui foi chamado ao vivo; o que não funcionou está marcado como bloqueio confirmado, não suposição. Números reproduzíveis com `python -m etl.senado.indicacoes --descobrir --de 2003 --ate 2026`.
>
> **Arquivo histórico, anterior à unificação em monorepo (2026-07-28).** Caminho de repo/banco citado aqui pode ser do `controle-popular-judiciario` separado — no monorepo atual é `etl/judiciario/etl/...`, banco é Neon, não Supabase. O achado de fonte continua valendo, só o mapa de arquivo mudou.

## DoD da F0 (o que esta fase tinha de entregar)

- [x] Repo criado, app Next.js buildando e navegável com dado real
- [x] A hipótese central do produto — "a ementa da Mensagem revela a cota da cadeira" — **medida contra a fonte real**, não assumida
- [x] Todo `[VERIFY]` do plano vira URL que funciona ou descope explícito
- [x] Extrator de cota com suíte de regressão verde (`python -m etl.cota --testar`)

---

## 1. A fonte-espinha-dorsal: Senado, Mensagens de indicação ✅

`GET https://legis.senado.leg.br/dadosabertos/processo?sigla=MSF&ano={ano}&v=1`

REST, JSON, **sem autenticação**. É a mesma API que o `/congresso` já consome (`etl/senado/processos.py`), com as pegadinhas herdadas de lá:

1. devolve **lista na raiz**, não `{dados:[...]}`;
2. `tramitando` é o texto `"Sim"`/`"Não"`, não booleano;
3. **(nova, desta rota)** o `id` do processo **não é derivável** do número da Mensagem — `MSF 2/2025` = `8785648`, `MSF 31/2025` = `8841541`. Extrair sempre da listagem; chutar dá 404.

Toda nomeação a STF, STJ, TST e STM exige aprovação do Senado (CF art. 52, III) e vira uma Mensagem aqui. Filtro correto: `tipoConteudo == "Indicação de Autoridade"` na listagem (ou `conteudo.siglaTipo == "INDICACAO_AUTORIDADE"` no detalhe).

### O que a medição de 24 anos (2003–2026) devolveu

| Métrica | Valor |
|---|---|
| Indicações de autoridade (todas) | **724** |
| Indicações **judiciárias** | **130** |
| Com **cota de origem** resolvida | **72 (55,4%)** |
| Com **antecessor** nomeado na ementa | **54 (41,5%)** |
| Divergências cargo × dispositivo não resolvidas | **0** |

Por tribunal: STJ 40 · STM 36 · TST 35 · STF 19.

### ⭐ O achado que sustenta o produto, e a correção que ele forçou

A hipótese do plano era: *a ementa cita o dispositivo constitucional da vaga, logo a cota sai por regex*. **É verdade — mas incompleta, e a medição revelou o buraco:**

- O **STF não aparecia** na primeira rodada. Motivo estrutural: a cadeira do STF **não tem cota** (CF art. 101 é escolha livre), então a Mensagem **não cita dispositivo nenhum** — 19 de 19 indicações ao STF no período têm `artigos_vistos == []`. Um extrator que dependesse só do dispositivo perdia 100% do STF, o tribunal mais visível do produto.
- **Correção:** o **tribunal** passa a vir do **nome do cargo** (`"para exercer o cargo de Ministro do Superior Tribunal de Justiça"`), que tem cobertura alta; a **cota** vem do dispositivo, com cobertura parcial — e é honesto que seja. Isso levou a detecção de indicações judiciais de 54 → **130**.

### A cobertura de cota é temporal, não uma falha do extrator

| Período | Cota resolvida |
|---|---|
| 2003–2016 | 37/95 (**38%**) |
| **2017–2026** | **35/35 (100%)** |

A fonte **passou a citar o dispositivo constitucional de forma consistente a partir de ~2017**. Para o produto isso é ótimo: as indicações que importam para projeção e alerta são as recentes e as futuras, e nelas a cota é 100%. As antigas sem dispositivo entram com `cota = null` (estado legítimo, "requer revisão"), nunca com chute.

### Bônus não previsto: a cadeia de sucessão vem de graça

42% das ementas judiciais dizem *"na vaga decorrente da aposentadoria do Ministro X"*. `etl/cota.py::extrair_antecessor` colhe `(antecessor, motivo_vacancia)` — insumo direto de `cadeiras`/`ocupacoes` (a entidade durável do plano), sem inferência.

### Dois bugs de regex achados pelo corpus real (não pelos testes sintéticos)

1. **`resto` engolia o artigo seguinte.** Em `"art. 52, inciso III, ... e do art. 111-A, inciso I"`, o match de `art. 52` consumia o `111-A` inteiro e a cota do TST de 2026 se perdia. Corrigido com lookahead negativo que faz `resto` parar antes do próximo `art.`. É a mesma família do bug de alternância ordenada do `/congresso`: funciona no caso simples, falha em silêncio no composto.
2. **Inciso antes do artigo.** Redação antiga real (MSF 101/2011): `"inciso I do parágrafo único do art. 104"`. O extrator só olhava depois do artigo. Corrigido lendo 80 chars antes quando não acha inciso depois. A mesma ementa trazia `"para compor o STJ"` em vez de `"cargo de"` — o `_CARGO` foi ampliado, senão o fallback pegava um "Supremo" citado de passagem e atribuía a vaga ao tribunal errado.

Ambos viraram caso de regressão. `python -m etl.cota --testar` → **22 casos, todos verdes**.

---

## 2. Bloqueios confirmados — testados com User-Agent de browser completo

O plano suspeitava de bloqueio anti-bot nos portais dos tribunais. Reconfirmado com `User-Agent` de Chrome real e `Accept-Language: pt-BR` (para não acusar bloqueio onde era só header pobre):

| Fonte | URL | Resultado real | Leitura |
|---|---|---|---|
| STF — composição | `portal.stf.jus.br/textos/verTexto.asp?servico=sobreStfComposicao...` | **200 servindo página de 404** (corpo: *"404 Desculpe, mas não encontramos"*) | **Soft-404.** É a armadilha do domínio: status 200 com conteúdo de erro. Todo parser tem de validar o corpo, não o status. |
| STF — `ministro.asp` | `stf.jus.br/portal/ministro/ministro.asp` | **404** | — |
| CNJ | `www.cnj.jus.br/` | **503** mesmo com UA de browser | Bloqueio real, não header. Mesma família de LexML/Senado-legado do `/congresso`. |
| `dadosabertos.cnj.jus.br` | — | **DNS não resolve** | Host não existe. |
| Senado — votos de sabatina | `/processo/{id}/votacoes` | **404** + regra: voto é **secreto** | Ver §3. |

> **Armadilha de nomenclatura registrada:** "Justiça Aberta" do CNJ (Provimento 149/2023) é sobre **serventias extrajudiciais (cartórios)**, não magistrados. DataJud/API Pública do CNJ e a DJEN/Comunica API (`comunicaapi.pje.jus.br`, responde 200) são de **metadado processual** — domínio errado para composição de tribunal.

---

## 3. `[VERIFY]` do plano — todos fechados

| # | Item | Desfecho |
|---|---|---|
| 1 | **Voto de sabatina** | **DESCOPE, e é limite da fonte, não do app.** Regimento Interno do Senado, art. 383, VI: sabatina é reunião pública mas **votação secreta**, vedada justificação de voto. Só o **resultado agregado** existe (aprovado/rejeitado + placar) — é o que `resultado` e `data_deliberacao` já entregam. O app mostra o placar, nunca o voto individual, porque ele não existe publicamente. |
| 2 | **Fontes por TJ (5 maiores)** | **Parcialmente resolvido, e CORRIGIDO na F8 (2026-07-25).** Com UA de browser as URLs institucionais respondem 200 (o 404 anterior era URL errada, não anti-bot) — **mas isso testava só a página de MENU, não a de composição.** Verificado ao vivo com Playwright real no TJMG: a listagem de desembargadores (`/institucional/magistratura/desembargadores.htm`) devolve 200 com 74 KB de HTML que **não contém nenhum nome** — a lista é injetada via JS por um widget Lumis CMS; `curl`/`requests` puro nunca vê o dado. **TJMG exige Playwright de verdade**, não é fallback. Testado e funcionando: 148 desembargadores ativos coletados via `etl/tj/tjmg.py --coletar` (paginação por postback JS, filtro "Ativo" explícito). TJSP/TJRS/TJPR ainda não teve a página de composição real testada (só a de menu, na F0) — **não assumir que são mais simples só porque o domínio responde 200**; testar página a página. |
| 3 | **`dados.gov.br`** | **DESCOPE.** API devolve **401** (exige chave de cadastro). Não vale o custo: a fonte de composição dos superiores é curadoria de ~93 registros, mais rápida que integrar e cadastrar. |
| 4 | **Datas de nascimento dos superiores** | **Estratégia definida: curadoria manual.** Os portais biográficos existem (STJ e TST respondem 200 com conteúdo), mas são casca JS/HTML heterogêneo. Para ~93 pessoas nos superiores, semear à mão em `magistrados` é mais rápido e confiável que 5 scrapers frágeis. É insumo crítico (sem nascimento não há projeção) e vira métrica de cobertura na home. |
| 5 | **INLABS/DOU (ato de nomeação, data de posse)** | **DESCOPE para depois.** `inlabs.in.gov.br` responde **302** (exige credencial de cadastro gratuito); `in.gov.br/consulta` responde 200 (HTML de busca). Não é bloqueante: `data_deliberacao` do Senado é proxy suficiente da posse para F2–F7. INLABS entra só se/quando a data exata de posse virar requisito. |

---

## 4. BrasilAPI — avaliado a pedido do usuário

Veredito consistente com a triagem já feita no `/betim` (`brasilapi-integration.md`):

- ✅ **`/feriados/v1/{ano}`** — único uso real: base da contagem de prazo (os 20 dias do art. 94 § único para nomeação a partir da lista tríplice). **Insuficiente sozinho** — falta recesso forense e feriados forenses/estaduais, que entram por tabela própria. Adotar na F4, não antes.
- ⚠️ **`/ibge/uf/v1`** — 27 linhas; seed manual resolve, e o `/betim` já integra o IBGE direto.
- ❌ Todo o resto (CNPJ, CEP, bancos, câmbio, FIPE, PIX, taxas…) — fora do domínio.

Não é fonte estrutural deste projeto.

---

## 5. Disciplina de coleta (herdada do `/congresso`)

1. ETLs pesados em **série, nunca em paralelo** — dois na mesma API dobram o risco de throttle.
2. Backfill histórico é o maior gerador de requisições — isolar, de preferência via GitHub Action (IP fresco). Aqui o backfill inteiro são ~24 requisições, então é trivial; a regra fica escrita para quem ampliar.
3. Diagnóstico de throttle: chamar o endpoint cru, sem o `retry` mascarando o status.
4. **Soft-404 é o inimigo do domínio** (o `/dadosabertos/` do STF prova). Validar corpo, não status; parser que não acha a estrutura esperada **falha alto**, nunca grava vazio.

---

## 7. `magistrados.url_foto` — investigado em 2026-08-09, sem endpoint achado

Mesma dificuldade da §2 (STF soft-404, CNJ 503), reconferida especificamente
para foto — não repetir esta busca sem ler isto primeiro:

| Fonte | URL testada | Resultado real | Leitura |
|---|---|---|---|
| STF | `portal.stf.jus.br/ministros/` | **200 servindo página de 404** (HTML carrega o bundle `erro-404-*.js`) | Soft-404, mesma armadilha da §2 — confirma que persiste em 2026. |
| STJ | `www.stj.jus.br/sites/portalp/Institucional/Ministros` | 200, mas só tem 1 foto de GRUPO (Pleno) | Por ministro só existe um link "Site Individual" cujo destino é montado por JS (`clsMinistrosSiteLink`) — não resolvido; pode ou não levar a uma foto individual, não confirmado. |
| STJ | `www.stj.jus.br/web/verMinistrosSTJ?parametro=1` | 200, 128 KB de HTML | Sem foto, sem nome dos 4 ministros que interessam aqui (Antonio Carlos Ferreira, Villas Bôas Cueva, Sebastião Reis Júnior, Marco Aurélio Bellizze não aparecem no parâmetro 1 — provável paginação/agrupamento não mapeado). |
| TSE | `www.tse.jus.br/o-tse/ministros`, `/o-tse/composicao` | **302** (redirect) | Não seguido adiante — fora do orçamento desta investigação. |
| CNJ | — | 503 (§2, não retestado) | Segue valendo. |

**Contraste com `vereadores.foto_url` (TSE, resolvido no mesmo dia):** lá existe
UMA API (`divulgacandcontas.tse.jus.br/divulga/rest/v1/candidatura/buscar/...`)
que devolve a foto de qualquer um dos candidatos por um único padrão de
chamada — 23 de 23 vereadores confirmados. Para magistrados **não existe
equivalente conhecido**: são 3 tribunais (STF/STJ/TSE) com portais
diferentes, nenhum com API de foto aberta encontrada até agora.

**Caminho que resta:** curadoria manual, mesma disciplina de
`etl/judiciario/etl/dados/*.json` (que já faz isso pra nome/data de
nascimento/cadeira) — achar, verificar com `curl`/HEAD que a URL responde
imagem (`Content-Type: image/*`, HTTP 200) e documentar a fonte por pessoa
no próprio JSON. São 17 linhas (10 STF + 7 só-TSE, das quais 4 são, na
origem, ministros do STJ). Opção mais rápida ainda não tentada: fotos da
Agência Brasil/EBC (empresa pública federal, uso liberado CC-BY, é o que a
imprensa usa para ministros do STF) — ainda exige verificação pessoa a
pessoa, mas pode desempacar mais rápido que insistir nos portais dos
tribunais.

---

## 8. Artefatos gerados nesta fase

| Arquivo | O que é |
|---|---|
| `etl/cota.py` | Extrator determinístico de tribunal + cota + antecessor. 22 casos de regressão. |
| `etl/senado/indicacoes.py` | ETL das Mensagens. Modo `--descobrir` (mede, não grava) e `--ano` (grava, exige `DATABASE_URL` — Neon no monorepo atual). |
| `docs/f0-corpus-indicacoes.json` | As 724 indicações analisadas (corpus completo, para inspeção). |
| `docs/f0-relatorio.json` | Resumo agregado — é o que a home lê; nenhum número da tela é digitado à mão. |
| `regras/regras.json` | Régua canônica (idades, cotas por tribunal, prazos), versão 1.0.0. Lida por `lib/regras.ts` e pelo ETL. |
| `app/page.tsx`, `app/metodologia/page.tsx` | Home mostrando a medição da F0 + metodologia derivada da régua. |
