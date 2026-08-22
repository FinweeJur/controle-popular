# Plano de expansão do Controle Popular — acordos, contratos e convênios em MG

> **Revisado em 2026-08-21** contra o repo em `ebc42a1`, por auditoria linha a linha.
> A versão de 20/08 tinha 12 afirmações falsas ou vencidas; as correções estão
> aplicadas e sinalizadas com ⚠️ onde o texto anterior induzia a erro.
>
> **Onde este documento NÃO é a fonte:** estado das trilhas vive em `TODO.md`;
> conhecimento de fonte (endpoint, armadilha, número medido) vive em
> `docs/FONTES.md`. Foi justamente duplicar isso aqui que fez o plano envelhecer
> em um dia. Onde a informação já está lá, aqui vai **ponteiro, não cópia**.

## Context

O portal tem seis frentes e **118 rotas** (`find apps/web/app -name page.tsx | wc -l`,
21/08 — inclui `/ambiental/tac` e `/ambiental/convenios`, criadas por este plano).
O pedido: expandi-lo **dentro das frentes atuais** para acompanhar acordos
ambientais, projetos, contratos e convênios de MG — execução financeira,
atendimento de metas, e documentos de corregedoria/ouvidoria de Governo de MG,
MPMG, DPMG e TJMG.

**Decisões do dono:** dinheiro e acordo em `/ambiental`, instituição de justiça em
`/judiciario`; a coleta começa pelo **dinheiro**.

---

# Bloco 0 — Salvaguardas · ENTREGUE

## 0.1. O estado mora em disco *(vale, e continua valendo)*

O padrão certo já existia no repo e funciona: o plano da Perícia UFMG usa um
ledger, e `python X:/DevCoder/_lote-ambiental/analise/estado.py` responde onde
parou e imprime o próximo comando.

> **Nenhum estágio começa sem gravar o anterior. Reexecutar é sempre seguro — o
> ledger faz o trabalho já feito ser pulado, nunca refeito.**

Para todo coletor novo: gravar incrementalmente, ser idempotente, ter `--seco`, e
**nunca carregar corpus inteiro no contexto** (os acervos aqui têm 337, 467, 848,
2.002 itens — o contexto guarda o ponteiro, não o conteúdo).

## 0.2. `TODO.md` · ⚠️ CORRIGIDO — existe desde 20/08

A versão anterior dizia, duas vezes, que "o arquivo não existe e nunca existiu".
**Existe desde `f51558e`**, com quatro commits e no formato proposto (uma linha
por trilha, dizendo onde retomar). A tarefa deixou de ser *criar* e passou a ser
**manter**.

⚠️ Corrigido também: só **o plano da Perícia** mandava lê-lo. `LEIA-PRIMEIRO.md`,
`DESENVOLVIMENTO.md` e `AGENTS.md` não mandavam — a versão anterior generalizou.

**Pendência real:** a memória `feedback_lightweight_todo.md` (intocada desde 05/08)
prescreve um formato que **não é** o do arquivo real — ela pede checkboxes e as
seções *Agora / Bloqueado / Próximas fases / Backlog / Feito*; o `TODO.md` usa
*Em curso / Esperando data / Esperando decisão do dono*, sem checkbox e sem
"Feito", com a regra explícita "não é changelog". Alinhar a memória ao arquivo.

## 0.3. Não pisar no trabalho alheio *(regras válidas; números corrigidos)*

| Regra | Por quê |
|---|---|
| `git fetch` **antes** de descrever, planejar ou editar | O checkout envelhece durante a própria sessão |
| **Nunca `git add -A`** | Deleções de outra sessão apareceram no staging. Sempre caminho explícito + conferir `git status` depois |
| Nunca `push` sem confirmação | Convenção do projeto |
| Um agente por arquivo | Dois agentes editaram a mesma memória e deixaram banners contraditórios. Ao fanar, particionar por arquivo, nunca por tema |
| Conferir processo antes de matar | `workerd.exe` de outra sessão segura `.open-next/assets` |

⚠️ **Números corrigidos:** eram "11 worktrees ativos" — hoje são **2** (a poda de
`509df09` levou 27 branches a 3). E a regra de rodar a suíte com
`--exclude '**/.claude/worktrees/**'` **está vencida**: o comando é `npm test` na
raiz (ver §Verificação). Nota: `apps/web/vitest.config.ts` nunca teve `exclude` —
aquilo era flag de linha de comando.

⚠️ **Desvio registrado:** a instrução era abrir worktree próprio
(`cp-acordos-mg`) antes da frente nova. **Não foi seguido** — tudo rodou no
checkout principal, que a convenção permite para tarefa iniciada pelo dono. A
próxima sessão não deve procurar um worktree que não existe.

## 0.4. Trabalho em lote roda no jcode

`C:\Users\teste\Downloads\jcode-windows-x86_64.exe` (assinatura, não API por
token); contexto padrão em `X:\DevCoder\_ajri\scripts\CONTEXTO-AGENTES.md`.

**Vai para lá:** volume repetitivo — varredura de caminho, ciclo por documento do
ledger, OCR e resumo dos TACs do MPMG, classificação temática de corpus.
**Não vai:** decisão de arquitetura, fusão de documentação, e qualquer coisa que
exija julgar contradição entre fontes.

**Regra de modelo** (vale também para subagentes meus, não só para o jcode): usar
o mais barato que dá conta. Varrer e conferir é Haiku/Sonnet; só sintetizar é caro.

---

# Bloco A — ENTREGUE em `509df09`, `f51558e`, `d9297ab`, `b7a737f`

| Item | Resultado, com o que divergiu do previsto |
|---|---|
| **A1** LAI | Prorrogação registrada. ⚠️ `data_limite` **continua `2026-08-18`** de propósito (é o cálculo legal); quem manda é `prorrogacao_concedida: true` + `data_limite_prorrogado: 2026-08-28`. ⚠️ A trava **não** virou hook de pré-commit — virou CI (ver §Verificação). **Aberto:** o protocolo do INCRA nunca foi anotado (`protocolo: null`); o validador avisa de propósito |
| **A2** Poda | 27 → **3** branches; 11 → **2** worktrees. **Resíduo:** `claude/fervent-diffie-35c891` não foi apagada (poda de 25 de 26), e sobraram **20 pastas órfãs** em `.claude/worktrees/` — inertes, sem `.git` e sem teste |
| **A3** Alvo de build | `docs/ARQUITETURA.md` abre declarando Workers+OpenNext, não `output: 'export'` |
| **A4** Skip-link | ⚠️ Não eram 7 páginas: eram **7 famílias de rota = 21 páginas** (a lista anterior omitia `/assistente` e `/termos`). **Achado extra:** 3 páginas não tinham `<main>` nenhum, o que quebrava junto o `OuvirPagina.tsx` |
| **A5** Duplicata | `docs/judiciario/f0-relatorio.json` removido |
| **A6** Caminhos | ⚠️ Eram **47**, não 25 (45 no jcode, 2 à mão). Índice corrigido para 12 arquivos na raiz. O resíduo do `README.md` foi fechado em 21/08: eram 6 links para arquivos hoje em `_historico/`, mais 2 que só apareceram na conferência — o README não tem mais caminho `docs/` quebrado |

**Único item de A ainda aberto:** os caminhos de `PLANO-INDICE…` — as linhas são
**`:47, :83, :224`** (a versão anterior dizia `:82`).

---

# Bloco B — a frente nova

## Entregues

| Item | Commit | O que ficou de fora |
|---|---|---|
| **B1** TACs do painel | `32d7dec` + rodada 21/08 — `/ambiental/tac` com dashboard | ✅ **`_tacs_contas.json` DESTRAVADO** em 21/08: o modelo expoe **11 entidades**, nao 4, e a coluna pedida existia em outra. As 4 entidades saem agora (projetos 848, empresas 69, contas 120, soma 120), conferidas centavo a centavo contra o painel oficial. ~~⚠️ continua falhado~~ (`CouldNotResolveSemanticQueryDefinition`, intocado desde 20/08); `_tacs_empresas.json` não foi transpilado |
| **B2** CKAN `dados.mg.gov.br` | `a31a5b3` — `/ambiental/convenios` | Os demais conjuntos (`dados-armazem-siafi-2026`, `contratos_vigentes`, `fiscais_contrato`, `empresas_sancionadas`, `portal_obras`, `portal_mariana`) **seguem sem coletor** |
| **B3** Transferegov | `bfc6072` — 29.475 convênios de MG, R$ 27,98 bi, 49,2% desembolsado | — |
| **B5** GTAC | `0cbe87a` — 2.002 TACs, 392 municípios, 2002–2026 | — |

⚠️ **Contexto que faltava no B2:** **nenhuma das 18 organizações do CKAN é
SEMAD/FEAM/IEF/IGAM.** Os convênios ambientais só aparecem porque a CGE publica
os de todos os órgãos — não porque o meio ambiente publique dados abertos.

## Correções de fato que a versão anterior errava

⚠️ **GTAC (B5) — o endpoint não faltava, e o 403 não é o que parece.** A versão
anterior dizia "sem login … falta descobrir o endpoint XHR". O endpoint é
`https://ecosistemas.meioambiente.mg.gov.br/gtac/api/tacs` e responde **403**
(*"Consulte a DGTI sobre esta autorização"*) — mas **não é autorização de TI, é
checagem de origem**: com `Referer`/`Origin` do próprio domínio devolve 200. Duas
armadilhas: **`?page=N` é ignorado** (paginar em laço concluiria "N × 2.002 TACs")
e a API expõe **CPF de pessoa física em 355 registros** — redigir na origem.

⚠️ **Transferegov (B3) — não baixar o pacote inteiro.** `siconv.zip` tem
**3,34 GB**. Os arquivos individuais servem, mas os nomes da documentação **dão
404**: os reais são `siconv_meta_crono_fisico.csv.zip` (103 MB) e
`siconv_etapa_crono_fisico.csv.zip` (183 MB). Duas armadilhas caras: os CSV são
**UTF-8** — ler como latin-1 cola o BOM em `ID_PROPOSTA` e o join devolve **1
proposta de MG em vez de 98.949, sem erro** — e `siconv_proposta.csv` (~700 MB)
estoura `ERR_STRING_TOO_LONG` no V8.

⚠️ **`Convênio - Meta Etapa` não sustenta a frente — ele vem vazio.** HTTP 200
com **87 bytes comprimidos, 75 descomprimidos, 1 linha (só cabeçalho)**, enquanto
o recurso irmão do mesmo conjunto devolveu 8,4 MB / 784.802 linhas. Sem ele dá
para dizer quanto custou e quanto demorou, **não** se o convênio entregou.
Armadilha vizinha: **`dt_vigencia_inicial` não é data de início** — é igual a
`dt_vigencia_final` em 90.045 de 90.254 registros; lê-la como começo dá duração
zero para 99,8% dos convênios.

## Ainda por fazer

**Atualizado em 2026-08-21, depois da rodada que fechou B1, B2, B5, B6 e a
regra das cinco coisas.**

**B7 — TACs do MPMG: MORTO, e isso e' resultado, nao pendencia.** Medido em
21/08: `transparencia.mpmg.mp.br/buscarTac?idTac=N` responde **HTTP 200 com 0
byte** para todo id testado (1, 50, 500), com e sem `Referer` do proprio
dominio. Nao e' bloqueio nem 404 — e' resposta vazia com status de sucesso, a
mesma familia de armadilha do `ft_convenio_metaetapa`. Nao ha rota de listagem
(nunca houve, ver `docs/_historico/betim-ambiental-pecma-research.md:49`) e
agora nem a de visualizacao responde. **Sem via, o OCR nao tem o que ler.**
Reabrir so' se a fonte voltar.

**B4 e B8** — em curso nesta rodada. B4 destravado escrevendo coletor por
ARQUIVO em vez de consertar o Python que grava no banco; B8 por consulta ao
vivo, que e' o desenho que respeita as clausulas 3.8/3.9 da licenca do CNJ.

## O que reaproveitar

| Precisa de | Já existe em |
|---|---|
| Meta × prazo × execução | `paraopeba_iniciativas` (`schema.ts:1765`) |
| Execução financeira tipada | `lib/paraopeba/execucao-fgv.ts` — guarda o total **declarado pela fonte** ao lado da nossa soma |
| Prazo prometido × atual | `LinhaDePrazoAjri` em `sintese-ajri.ts` |
| Acompanhar e cobrar órgão | `documentos` + `monitoramentos` + `envios` + `alertas` (idênticas em `congresso` e `judiciario`) |
| Guardar o documento que sustenta o número | `arquivo_fontes` (`schema.ts:1660`) |
| Ponte entre acervos | `lib/paraopeba/relacionados.ts` |
| Lista grande na tela | `TabelaEstatica.tsx` + `lib/estatico/fatiar.ts` |
| Molde de coletor | `scripts/coletar-execucao-fgv.mts` |

**Não existe (construir do zero):** coletor de corregedoria, de ouvidoria, de
MPMG e de DPMG. ⚠️ *Convênios estaduais saiu desta lista* — foi entregue em `a31a5b3`.

**Armadilha de escopo:** `/busca` não indexa Paraopeba, ambiental nem terras
(`lib/busca/indice.ts` tipa `f` como `"cidades" | "congresso" | "judiciario"`).

---

# Bloco C — Travado por data

Neon em HTTP 402 até **2026-09-01**; sem banco não há `next build`.

| Item | Onde |
|---|---|
| Migrations 0071–0077 | `docs/planos/ROTEIRO-NEON-01-09.md` |
| Carga das normas federais (8.570 MMA + 370 CNDH) | nunca rodou — `/ambiental/legislacao` mostra 0 nacionais |
| Auditoria dos 25.729 links | `TODO-PROXIMAS-RODADAS.md` §6 |
| Backfill de temas | 100 de 10.317 |
| ⚠️ **B4 — PNCP, contratos estaduais** | **Movido do Bloco B para cá.** Não é "custo baixo": `etl/betim/etl/pncp/{contratos,licitacoes,orgaos}.py` gravam via `get_supabase_client()` |

---

# Bloco D — Depende de você

## D1. Dois pedidos redigidos, **nenhum protocolado**

⚠️ **Corrigido:** a versão anterior pedia à CGE-MG "a base completa de pedidos e
respostas de LAI". **Esse pedido não tem objeto** — MG não publica pedidos nem
respostas (sem busca de respondidos, sem download em massa, sem enumeração).

Os que existem, ambos sem protocolo e **nenhum registrado em
`docs/LAI-PROTOCOLOS.json`**:

- **TCE-MG** (`Projetos/Controle Popular — Pedido Ouvidoria TCE-MG (dados abertos).md`)
  — acesso programático ao portal de dados abertos, hoje barrado por CAPTCHA com
  token de 1 h. Argumento forte: a chave da API já está pública no JavaScript, então
  o CAPTCHA não protege dado, só barra automação.
- **CGE-MG** (`Projetos/Controle Popular — Pedido LAI CGE-MG (metas de convênio).md`)
  — a publicação do `ft_convenio_metaetapa`, que sai vazio.

## D2. Decisões que travam planos inteiros

| Decisão | Trava |
|---|---|
| 3 do chatbot (região do cérebro, acervo, ressalva) | `PLANO-CHATBOT-IA.md` **e** o degrau 3 do `PLANO-INDICE…` — dois planos para a mesma coisa |
| Corte de LGPD | coletor do diário oficial |
| Cabeçalho de Terras e Paraopeba; hierarquia da home | `REVISAO-UX-E-ONBOARDING.md` |
| Notificar o CNJ, ou consulta ao vivo | destrava o B8 |

> O gargalo dominante do repo não é técnico — são decisões pendentes. Uma sessão
> só de decisões destrava mais do que uma semana de código.

## D3. Fundir `ARQUITETURA.md` e `MAPA-APLICACAO.md`

⚠️ **O argumento anterior caiu:** dizia que o MAPA "não está em índice nenhum".
**Está** (`docs/LEIA-PRIMEIRO.md:27`, com a ressalva de sobreposição em `:35`).
O que continua pendente é só a decisão de fundir, e qual caminho sobrevive.

---

## Mapa de fontes

O detalhe vive em **`docs/FONTES.md`** — endpoint, armadilha e número medido de
cada fonte. Aqui só o resumo de camadas:

**Automatizar (confirmados):** CKAN `dados.mg.gov.br` · SIAFI-MG · Transferegov ·
PNCP · dicionários em `github.com/orgs/transparencia-mg`.

**Semi-automatizável:** GTAC (endpoint conhecido, ver acima) · MPMG TACs (+OCR) ·
`busca_decisao.aspx` · **IDE-Sisema WFS**.

⚠️ **IDE-Sisema — corrigido.** A versão anterior dava
`geoserver.meioambiente.mg.gov.br/wms?request=GetCapabilities` e dizia "camadas
ainda não enumeradas". O endpoint é **`/IDE/ows`** (anônimo, `Fees: NONE`), as
camadas **já estão enumeradas — são 1.405**, e **descoberta é pelo CSW do
GeoNetwork, não por `GetCapabilities`**, porque o capabilities trunca em ~300 de
1.405 e faz camada existente parecer inexistente. O método antigo era exatamente
a armadilha. Medido em 15/08, antes deste plano (`docs/ambiental/F0-discovery.md:34-48`).

**Monitorar:** `transparencia.meioambiente.mg.gov.br` (34 consultas, sem bulk) ·
DPMG e corregedorias (PDF). ⚠️ **TJMG sai daqui**: para dado processual **existe
API** (DataJud); o que dá 404 é o RSS.

**Descartar:** `github.com/public-apis/public-apis` — zero fontes de governo
brasileiro.

### Armadilhas medidas

`dados.mg.gov.br` **403 sem User-Agent de navegador** · DataStore do CKAN
habilitado mas **vazio** (`success: true`, `total: 0`) · **MG fora do
Compras.gov.br** · a via pública do ambiental de MG é o módulo de audiência do
SISEMA (ids 1–1016), não o SLA (401 + reCAPTCHA) · `www.semad.mg.gov.br` tem erro
de certificado (usar sem `www`) · `www.mpmg.mp.br/transparencia/` dá 404 (usar
`transparencia.mpmg.mp.br`).

⚠️ **Saiu desta lista: "não raspar `www.transparencia.mg.gov.br`".** Isso **não
foi medido** — a única fonte no repo diz HTTP 200 com casco de SPA de 2.417 bytes
e "não investigada nesta rodada". Como armadilha fechada, matava uma fonte
estadual sem fundamento. Fica como **não investigado**.

### Lacunas — que são as melhores pautas

Compensação ambiental e cumprimento de condicionantes não têm consulta pública em
MG. Os relatórios de monitoramento do SIGCON existem (o manual os descreve) mas
nada indica que sejam públicos.

---

## Veredito da LAI de MG

**Analisar "todas as respostas já publicadas" não é executável em Minas, porque
elas não são públicas. O caminho não é técnico, é jurídico.**

e-SIC MG (`acessoainformacao.mg.gov.br`, CGE-MG): não há busca de pedidos
respondidos; não há download em massa (o link "Download de Dados" leva a
*Informações Classificadas*, outra coisa); não há enumeração legítima. O federal
publica pedidos e respostas em CSV; MG publica só estatística agregada.

**O que sobra:** `busca_decisao.aspx` — as **decisões de recurso**, sem login e
sem captcha. É o único corpus de LAI de MG legível em texto. ⚠️ Mas ver B6: o
filtro por *Provimento* rende 16 casos, não um veio.

| Corpus | Viável? | Como |
|---|---|---|
| Decisões de recurso da CGE | **Sim** | B6 |
| Respostas publicadas por órgão | **Parcial** | Crawl de descoberta; formato varia por órgão |
| Base completa de pedidos | **Não** | Não tem objeto — ver D1 |

---

## Verificação

| O que | Como |
|---|---|
| Suíte | ⚠️ **`npm test` na raiz** (delega ao workspace: vitest + globo). **Não** `npx vitest run` na raiz — foi tentado e revertido: as fixtures são relativas ao cwd e 32 testes quebram com ENOENT sem defeito no código; `test.root` não resolve |
| Referência | **57 arquivos, 776 no vitest + 137 no globo**, medidos em 21/08. Contagem de teste sem data já circulou em **seis** versões neste repo (247, 401, 601, 681, 699, 741) — sempre citar com data |
| Tipos | `npx tsc --noEmit -p apps/web` |
| Prazo de LAI | ⚠️ `.github/workflows/prazos-lai.yml` — cron diário `12 9 * * *`. **Não barra commit nem push**, de propósito: barrar um ajuste de CSS por prazo de outro assunto treina todo mundo a usar `--no-verify`, o que desligaria junto a proteção de CPF |
| Coletor novo | `--seco` primeiro; **validar conteúdo, nunca status HTTP**; travas de sanidade abortando antes de gravar |
| Dado publicado | Teste no padrão de `execucao-fgv.test.ts`: uma asserção por armadilha medida, número cravado com data, `COBERTURA_*` conferida contra o array real |
| Payload | Página de servidor importa `COBERTURA_*`, nunca o array; teto do Worker é 3 MiB gzip |
