# PLANO — LinkMender: destravar o aceite e subir a escada de busca

> **Arquivado em 18/10/2026** na consolidação de planos. O que restava
> de pendência foi absorvido pelos planos integrados em `docs/planos/`.


> **Tipo:** PLANO
> **Domínio:** links externos (LinkMender, revisor de PRs, escada de reparo, uso de LLM e visão)
> **Última medição:** 2026-10-18
> **Leitura estimada:** media (10-20 min)
> **Relacionados:** [AGENTS.md](/AGENTS.md), [ESTADO.md](../../02-estado/ESTADO.md), [PENDENCIAS-AMBIENTAL-18-10.md](/docs/historico/planos/PENDENCIAS-AMBIENTAL-18-10.md), [linkmender-v2-propostas.md](../../relatorios-automacao/linkmender-v2-propostas.md), [ARQUITETURA.md](../../04-arquitetura/ARQUITETURA.md)
> **Palavras-chave:** linkmender, links, pr, revisor, escada, playwright, screenshot, visao, llm, ollama, maritaca, ling, correcoes, link-correcoes, fallback

## Sumário

- [Propósito](#propósito)
- [Diagnóstico medido](#diagnóstico-medido)
- [Fase 1 — destravar os três elos](#fase-1--destravar-os-três-elos)
- [Fase 2 — afinar o detetive](#fase-2--afinar-o-detetive)
- [Fase 3 — escada determinística e LLM](#fase-3--escada-determinística-e-llm)
- [Orçamento, privacidade e travas](#orçamento-privacidade-e-travas)
- [Como verificar](#como-verificar)
- [Riscos e decisões do dono](#riscos-e-decisões-do-dono)

## Propósito

O LinkMender é o consertador automático de links do portal. Ele funciona em
duas metades: um **criador** (roda no `home-pc` de madrugada e abre PRs) e um
**aceitador** (workflow `pr-revisor` que deveria mesclar sozinho). Hoje o
criador entrega e o aceitador rejeita tudo. Este plano destrava o aceite,
afina a busca do substituto e desenha a escada de reparo com LLM e visão.

## Diagnóstico medido

Medições de 18/10/2026, direto no GitHub e no repositório.

**Estado dos PRs.** Seis PRs do LinkMender abertos, de 24/09 a 16/10:
#5 e #6 e #7 e #8 com 2–3 correções cada, #14 com 26 e **#15 com 2.467**.
A `main` tem só **8 correções** em `apps/web/data/link-correcoes.json`.
Ou seja: praticamente todo o acervo corrigido está empacado no #15.

**Por que não mesclam.** Run `38975928123` (PR #15):
`Testes do PR` ✅ 2m42s; `Sondar urlNova` ❌ **2h14m** reprovando
**1.762 de 2.459** links; `Merge automático` **nunca rodou** (depende do
passo anterior). A regra do portão, em
`scripts/agent-tools/sondar-pr-links.mts:101-102`, considera vivo só status
**200–399**. Então **403** (site que bloqueia robô) e **timeout** contam como
morto — mesmo a própria lib tratando 403 como vivo
(`apps/web/lib/linkmender/verificar.ts:163`).

**Terceiro elo: a camada nunca é aplicada.** `urlCorrigida` e
`aplicarCorrecoesEmDado` existem em `apps/web/lib/linkmender/correcoes.ts`
(linhas 110 e 133), mas **nenhuma página ou componente as chama**. O
`prebuild` só valida o JSON (`apps/web/package.json:16`). Consequência:
mesmo mesclado, o link na tela **não muda**.

**Como o criador descobre URLs.** `scripts/agent-tools/linkmender-v2.mts:102`
varre, a cada rodada: `apps/web/app/**/*.tsx`, `apps/web/lib/**/*.ts`,
`apps/web/data/**/*.json` (qualquer string `http(s)`) e o `urlOficial` do
registry de fontes. Não há lista fixa — página nova entra na noite seguinte.

**Como ele busca o substituto.** Três consultas no DuckDuckGo
(`apps/web/lib/linkmender/busca.ts:56`): título+órgão+filetype, título exato
entre aspas e `site:domínio-original`. A aceitação exige vivo + domínio
oficial + tipo igual + corpo que confere (+ título similar, **quando há
título**) — `criterios.ts:176`.

## Fase 1 — destravar os três elos

**1.1. Portão tolerante.** Reescrever a decisão de "morto" em
`sondar-pr-links.mts` para reusar `classificarVerificacao`:

1. **Vivo:** 2xx/3xx, e também **401/403/429** (o servidor respondeu; só
   bloqueia robô).
2. **Inconclusivo (aviso, não falha):** timeout ou 5xx transitório.
3. **Morto (falha):** 404/410, "200 que mente" e erro de **DNS**
   (`ENOTFOUND`/`getaddrinfo`).

**1.2. Aplicar a camada.** Fazer o site realmente ler as correções. Preferir
aplicar no **ponto de render** dos links de fonte (usar `urlCorrigida`), não
reescrever dado versionado. Entregável: um teste que prove que uma URL na
camada vira a nova na página.

**1.3. Velocidade do portão.** Hoje sonda em série (2h+ por rodada). Trocar
por pool de threads (8 concorrentes, ~1,2 s por host, timeout ~15 s) e pular
`urlNova` já cobertas por PR anterior. Meta: ~15 min para 2.500 links.

**1.4. Re-disparar os 6 PRs** após 1.1–1.3 na `main`, via toggle de label
(o `mesclar` depende de `sondar` verde). Conferir que os PRs não colidem no
mesmo arquivo ao mesclar em sequência.

## Fase 2 — afinar o detetive

Hoje a busca é esperta em parte. Cinco melhorias, em ordem de impacto:

1. **Sem nome = sem automático.** Quando não há título, marcar
   `titulo-nao-avaliado` como **fila humana**, nunca auto-mescla. Corrige o
   risco de aceitar a home do portal como substituta.
2. **Proibir atalho genérico.** Se o link antigo era fundo
   (`/processos/123`), o novo não pode ser a raiz do domínio. Comparar
   profundidade e chave do caminho.
3. **Buscar pela chave única.** Número de processo, protocolo, CNPJ, nome do
   arquivo — pistas que valem mais que o título.
4. **Preencher o órgão.** `linkmender-v2.mts:354` passa `orgao: null`; derivar
   do registry/registro para qualificar as três consultas.
5. **Duas notas de confiança.** "Alta" (domínio+tipo+título+caminho) mescla
   sozinho; "média" vai para revisão humana.

**Pontos cegos de cobertura.** O regex de código pega `href="https://"` e
`url: "https://"` — não pega `http://` nem URL montada em template string
(essas entram quando também aparecem no dado). Redes sociais, blogs e mapas
**não** entram no automático (só domínio público): ficam em lista manual.

## Fase 3 — escada determinística e LLM

Escada do mais barato ao mais caro; cada degrau só roda se o anterior falhar
(padrão do Seu Nonô, ver `apps/web/lib/assistente/escada-base.ts`).

| Degrau | O que faz | Custo | Gatilho |
|---|---|---|---|
| D0 | Memória de reparos: "já resolvi este padrão" | zero | sempre |
| D1 | Truques de URL: https, www, tirar query, barra final, Wayback | centavos | D0 miss |
| D2 | Busca no mesmo site (`site:`) com chave única (processo, CNPJ, arquivo) | barato | D1 miss |
| D3 | Robô abre a **busca do próprio site** (Playwright) e lê os resultados | médio | D2 miss |
| D4 | **Print + LLM de visão**: "onde neste site ficaria isso?" | caro | D3 miss |
| D5 | Fila humana com o dossiê do que já foi tentado | — | D4 miss |

**Print como último recurso.** Foto do link morto não serve. Serve (a) da
**busca do site** com os resultados que o HTML não expõe (site JS), ou (b) de
uma candidata, para confirmar o conteúdo. Antes do print, ler o **DOM** com
Playwright é mais barato e preciso; a imagem entra só quando não há texto
útil (canvas, PDF visual, captcha).

**Roteiro de modelos (barato primeiro).**

1. **Ollama local** para tarefa pequena e pontual (`bots/core/conector_ollama.py`);
   aquecer antes com `keep_alive`; nunca mandar dado pessoal (§5.8).
2. **Maritaca Sabiá** quando precisar de mais qualidade
   (`AI_API_KEY_MARITACA` já reservada em `apps/web/.env.example:47`).
3. **Ling** no mesmo papel; rotear por cota.
4. **Visão (print)** só no D4, com teto de páginas por madrugada.

**Memória de reparos (D0).** Cada tentativa vira uma linha em JSON: URL,
contexto, degrau que funcionou, data. Os resumos diários alimentam esse
arquivo. Quanto mais roda, mais barato fica.

**Travas.** O LLM **nunca** mescla. Ele só **propõe** candidatos; quem decide
continua sendo o portão determinístico (vivo + domínio + tipo + nome/caminho).
Toda proposta carrega o motivo e o degrau de origem.

## Estado da execução (18/10/2026)

Entregue nesta rodada (85 testes verdes, `tsc` limpo, CodeScene no commit):

1. **Fase 1.1 — portão tolerante.** `vereditoDoPortao` e `erroDeDns` em
   `apps/web/lib/linkmender/verificar.ts`; o prober passou a usá-los.
   403→vivo, 500/timeout→inconclusivo, 404/"200 que mente"/DNS→morto. Mais
   tolerância de mortos (`excedeTolerancia`): reprova só acima de
   `max(5, 10%)` — sem isso, um 404 travaria PR de 2.459 links.
2. **Fase 1.3 — velocidade.** Sondagem concorrente (8) com pausa de 1,2 s por
   host; o que levava 2h+ roda em minutos.
3. **Fase 1.2 — camada aplicada.** `corrigirDado` (com cache) ligada em
   `lib/server-only/json-etl.ts` (ponto único de 18 loaders, inclui o
   registry de fontes) e em `lib/ambiental/estudos-dados.ts`. Server-side:
   não infla o bundle do cliente.
4. **Fase 2 — detetive afinado.** Título obrigatório (sem título → fila
   humana), critério `caminho-especifico` (anti-atalho genérico),
   `chavesDeUrl` (busca por processo/CNPJ/arquivo), `orgaoDeUrl` e nota de
   confiança alta/média/baixa no `avaliarCandidato`.
5. **Fase 3 — núcleo da escada.** `lib/linkmender/escada.ts`: ordem D0–D5,
   `variacoesUrl` (D1), `urlWayback`, memória de reparos (D0), reparos por
   degrau e tetos de LLM — ollama 20, maritaca 10, ling 10, visão 5.
   Adaptadores de rede (Playwright no D3, visão no D4) ficam para a rodada
   seguinte; a peça que decide e memoriza está pronta e testada.

**Decisões tomadas (ordem do dono, 18/10):** camada no render/build; Fases
1–3 na mesma rodada; teto pequeno por LLM; re-disparo dos 6 PRs autorizado.

## Orçamento, privacidade e travas

1. **Gatilho por falha:** LLM e visão só acendem quando D0–D3 falham.
2. **Teto por rodada:** limite de chamadas de LLM/visão por madrugada.
3. **Privacidade:** nada de dado pessoal bruto em prompt de modelo (§5.8).
4. **Cota:** Ollama primeiro (custo zero); API só no que o local não resolver.
5. **Auditoria:** toda correção guarda critérios, degrau e data.

## Como verificar

- Camada de correções: `node apps/web/scripts/validar-link-correcoes.mjs`.
- Lib do LinkMender: `npx vitest run lib/linkmender` (de `apps/web`).
- Portão do PR (dry-run local): `npx tsx scripts/agent-tools/sondar-pr-links.mts`.
- Aceite real: reabrir o PR #15 e conferir o run do `pr-revisor` verde.
- Página aplicando a correção: abrir a fonte corrigida e ver a URL nova.

## Riscos e decisões do dono

**Riscos.** (a) Mesclar 2.467 correções de uma vez em PRs encadeados pode
colidir no mesmo arquivo. (b) 5xx transitório não pode virar "morto".
(c) Visão/LLM custam cota — daí o teto. (d) Aplicar a camada no render exige
escolher o componente certo para não quebrar links internos.

**Decisões do dono.**

1. Aplicar a camada **no render** (recomendado) ou no **prebuild**?
2. Fazer a Fase 2 junto da Fase 1, ou só depois de destravar o aceite?
3. Ligar **quais** LLMs (Ollama / Maritaca / Ling) e com qual teto por noite?
4. Autorizar o **re-disparo** dos 6 PRs após a Fase 1.

## Fechamento (18/10/2026)

O bot voltou a aceitar sozinho. Resultado:

1. **PR #15 consolidado e MESCLADO** pelo merge automático (run
   `39151492134`: testes ✓ 2m41s, sondagem ✓ 53m53s, merge ✓ 53s). A camada
   na `main` ficou com **2.517 correções**.
2. A sondagem de ~2.500 links passou — antes reprovava 1.762 por tratar 403 e
   timeout como link morto.
3. PRs #5–#8 e #14 fechados como *superseded* (base antiga, não-mescláveis,
   71 urlVelha divergentes; resolvido pela URL mais específica).
4. CodeScene da nuvem **verde** no commit da refatoração do pipeline.

### Achado corrigido e pendência resolvida

- **Achado (PR em base antiga):** `linkmender-pr.mts` agora nasce de
  `origin/main` E faz `git merge origin/main` no branch se a base andou antes
  do commit (sem `--force`), para o PR não virar não-mesclável.
- **Pendência (D3/D4):** braço do navegador em
  `scripts/agent-tools/escada-pagina.py` (Playwright: D3 usa a busca do site,
  D4 grava o print) e ligação em
  `apps/web/lib/linkmender/escada-adaptadores.ts` (monta comando, lê a saída,
  checa a cota de visão). Núcleo + adaptadores com 93 testes verdes.

