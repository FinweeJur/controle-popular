<!-- GERADO POR scripts/agentes/consolidar-relatorios.mts — NÃO EDITE À MÃO. -->

# Relatórios finais de agentes — inventário

> **Tipo:** ESTADO
> **Domínio:** global (coordenação de agentes, entregas e pendências)
> **Última medição:** 2026-10-18
> **Leitura estimada:** média (5–15 min)
> **Relacionados:** [ESTADO.md](ESTADO.md), [RADAR-HOTSPOTS.md](RADAR-HOTSPOTS.md), [PLANO-RADAR-AGENTES-HOTSPOTS-18-10.md](../planos/PLANO-RADAR-AGENTES-HOTSPOTS-18-10.md), [GUIA-DE-DOCUMENTACAO.md](../GUIA-DE-DOCUMENTACAO.md)
> **Palavras-chave:** agentes, subagentes, relatorios, resumo, entregas, handoffs, worktrees, pendencias, inventario

## Sumário

- [Propósito](#propósito)
- [Como ler](#como-ler)
- [Cobertura da varredura](#cobertura-da-varredura)
- [Subagentes com resumo final](#subagentes-com-resumo-final)
- [Sessões do opencode](#sessões-do-opencode)
- [Entregas e handoffs](#entregas-e-handoffs)
- [Planos com pendência aberta](#planos-com-pendência-aberta)
- [Worktrees e linhas de trabalho](#worktrees-e-linhas-de-trabalho)
- [Relatórios automáticos](#relatórios-automáticos)
- [Documentos de domínio](#documentos-de-domínio)

## Propósito

Juntar num lugar só o que cada agente entregou e o que ficou aberto.
O documento é **gerado**: a fonte é a transcrição, o handoff ou o plano.
Para decidir prioridade, use o [RADAR-HOTSPOTS.md](RADAR-HOTSPOTS.md).

## Como ler

- **Subagentes:** o resumo é a declaração final do próprio agente.
  Confira o commit e o arquivo antes de tratar como fato.
- **Entregas e handoffs:** documento datado; o número vale para a data dele.
- **Planos:** só entram os que têm sinal de pendência aberta.
- **Worktrees:** mostram trabalho que existe no disco e pode não estar na `main`.
- **Sessões do opencode:** o extrato de prompt e conclusão mora em
  [opencode-sessoes-cp.md](../relatorios-automacao/opencode-sessoes-cp.md).
- **Transcrição bruta** fica fora do repo; o inventário guarda o resumo.

## Cobertura da varredura

| Fonte | Encontrados |
|---|---|
| Transcrições de subagente | **9** |
| Entregas e handoffs | **36** |
| Planos com pendência aberta | **3** |
| Worktrees | **9** |
| Relatórios automáticos | **22** |
| Documentos de domínio | **17** |

**Cobertura de agentes (18/10/2026):** 9 transcrições de
subagente em arquivo + as sessões do opencode no extrato
[opencode-sessoes-cp.md](../relatorios-automacao/opencode-sessoes-cp.md)
(`npm run radar:opencode`, local, sem custo de modelo). O resto do trabalho
de agente aparece nos handoffs, planos e worktrees. O extrato é lido do banco
local; não roda na CI.

Gerado em: 2026-10-18T19:18:33.576Z

## Subagentes com resumo final

### 2026-08-22 — controle-popular · worktree cultura-gastos

- **Agente:** `agent-a0ed7316403bacd84`
- **Commit:** (sem commit declarado)
- **Transcrição (fora do repo):** `C:\Users\teste\.claude\projects\X--DevCoder-controle-popular--claude-worktrees-cultura-gastos\2f41eff2-a724-4ab1-b971-2fccf5b60bd3\subagents\agent-a0ed7316403bacd84.jsonl`

**Tarefa:** I'm investigating whether the "controle-popular" repo (a Brazilian civic-transparency project) already has any integration with PNCP (Portal Nacional de Contratações Públicas — Brazil's national public-contracts portal), before building new work in this area. This repo uses a workflow where parallel feature tracks are developed in separate git worktrees, each on its own branch, later merged into main. Known…

**Resumo final:** Findings Bottom line: PNCP integration is not new — it's extensive, mature, and already merged into main. All three feature worktrees inherit it identically. More importantly, the exact "Wesley Safadão / R$900 milhões" scenario you described has already been investigated and closed out, with a concrete fix shipped. Below is the detail, worktree by worktree. Shared baseline (present identically in main, cp-acordos-mg, cp-ambiental-estudos, chatbot-poc) Two separate PNCP integrations already exist: 1. Per-city municipal contracts/licitações ETL — etl/betim/etl/pncp/{client,contratos,licitacoes,orgaos}.py, writing to Supabase for the 6 portal cities (Araçuaí, BH, Betim, Diamantina, Itinga, SP). Rendered via apps/web/lib/betim/contratos.ts, apps/web/lib/betim/licitacoes.ts, pages under apps/web/app/[municipio]/prefeitura/{contratos,licitacoes}/. 2. A separate, narrower state-level feed — apps/web/lib/ambiental/pncp-mg.ts + scripts/coletar-pncp-mg.mts + static etl/betim/dados/pncp-mg.json, scoped to 4 MG environmental agencies (SEMAD/FEAM/IEF/IGAM), with documented coverage caveats (licitações are a declared partial slice, not the full total). The Wesley Safadão case is already fully investigated and resolved as a historical finding, not an open question: - docs/_historico/auditoria-2026-08-11.md (lines 44-50): a R$900-million "WS Shows/Wesley Safadão" contract in Araçuaí was found and checked directly against PNCP. Verbatim conclusion: "conferido direto no PNCP: é o valor que a própria prefeitura publicou no federal. Não corrigimos número oficial por conta própria." — i.e., verified as the value the municipality itself published federally; not treated as a units/parsing bug in this codebase. The real gap identified was methodological: the outlier-value alert requires ≥3 same-category contracts to compute a baseline, and this was effectively a group-of-1 (or, more precisely, fell outside the 2-year rolling baseline window), so no alert fired. - etl/betim/etl/alertas.py lines 139-198: Rule 11, added 2026-08-11 specifically because of this finding, with a long code comment reciting the exact case (R$900mi vs. the city's entire R$181.1mi annual revenue, ~5x). It closes the gap not by re-parsing the value, but by adding an absolute-outlier check (contract value 50% of the municipality's annual realized revenue from SICONFI/RREO) that doesn't depend on category group…

**Arquivos declarados:**
- (não declarados no resumo)

### 2026-08-22 — controle-popular

- **Agente:** `agent-a5a128f72faea66e2`
- **Commit:** `014b59509230`
- **Transcrição (fora do repo):** `C:\Users\teste\.claude\projects\X--DevCoder-controle-popular\0609ebcc-a009-4fbd-9b06-cce44e4e4960\subagents\workflows\wf_3a4c236d-2c1\agent-a5a128f72faea66e2.jsonl`

**Tarefa:** Tarefa: provar o pipeline de embeddings do chatbot (RAG) -- SO a metade "vetorizar + buscar", sem geracao de resposta (isso fica para quando houver credencial de API, que nao existe ainda). Worktree (trabalhe SO aqui): X:\DevCoder\controle-popular\.claude\worktrees\chatbot-poc Regras da casa (X:\DevCoder\controle-popular), nao-negociaveis -- leia AGENTS.md e docs/DESENVOLVIMENTO.md inteiros antes de comecar, mas…

**Resumo final:** Implementado apps/web/lib/assistente/embeddings/: cliente do Ollama local (vetorizar/vetorizarLote contra POST /api/embed, nomic-embed-text), chunking por paragrafo com fallback de janela deslizante (fatiarTexto), similaridade de cosseno (similaridadeCosseno), e uma demonstracao fim-a-fim (demonstracao.ts) sobre um documento REAL ja versionado no repo -- as 4 normas federais de etl/betim/dados/legislacao-mma.json cuja ementa cita a barragem de Fundao (Mariana/MG, 2015). O teste (demonstracao.test.ts) roda de verdade contra o Ollama local desta maquina: fatia o documento em 4 pedacos (um por norma), vetoriza, e 3 perguntas reais vencem no pedaco esperado com score de cosseno medido. Nenhuma chamada a Maritaca/DeepSeek, nenhuma geracao de resposta, nenhuma UI -- so a metade vetorizar+buscar, conforme escopo. Commitado localmente na branch chatbot-poc (nao pushado).

**Arquivos declarados:**
- `X:\DevCoder\controle-popular\.claude\worktrees\chatbot-poc\apps\web\lib\assistente\embeddings\ollama.ts`
- `X:\DevCoder\controle-popular\.claude\worktrees\chatbot-poc\apps\web\lib\assistente\embeddings\ollama.test.ts`
- `X:\DevCoder\controle-popular\.claude\worktrees\chatbot-poc\apps\web\lib\assistente\embeddings\pedacos.ts`
- `X:\DevCoder\controle-popular\.claude\worktrees\chatbot-poc\apps\web\lib\assistente\embeddings\pedacos.test.ts`
- `X:\DevCoder\controle-popular\.claude\worktrees\chatbot-poc\apps\web\lib\assistente\embeddings\similaridade.ts`
- `X:\DevCoder\controle-popular\.claude\worktrees\chatbot-poc\apps\web\lib\assistente\embeddings\similaridade.test.ts`
- `X:\DevCoder\controle-popular\.claude\worktrees\chatbot-poc\apps\web\lib\assistente\embeddings\demonstracao.ts`
- `X:\DevCoder\controle-popular\.claude\worktrees\chatbot-poc\apps\web\lib\assistente\embeddings\demonstracao.test.ts`

### 2026-08-22 — controle-popular · worktree cultura-gastos

- **Agente:** `agent-a741a90aafa3f99e7`
- **Commit:** (sem commit declarado)
- **Transcrição (fora do repo):** `C:\Users\teste\.claude\projects\X--DevCoder-controle-popular--claude-worktrees-cultura-gastos\2f41eff2-a724-4ab1-b971-2fccf5b60bd3\subagents\agent-a741a90aafa3f99e7.jsonl`

**Tarefa:** I need to understand how the "controle-popular" web app (apps/web) organizes different subject-matter sections of its portal, so I can figure out how to add a NEW section for "Cultura" (municipal culture spending) consistently with existing conventions. This repo uses a workflow where parallel feature tracks live in separate git worktrees on separate branches. Please investigate across these paths: -…

**Resumo final:** Findings: How "controle-popular" organizes portal zonas, and whether "Cultura" is planned All three paths (main, cabecalho-zonas, home-orientacao) share identical docs/planos/ contents and near-identical lib/zonas.ts — the only zona-relevant divergence is that cabecalho-zonas (9 commits, not merged to main) adds a layout.tsx to Paraopeba and a manual header to Terras, which is directly useful as a "how to onboard an existing zona onto the shared nav" reference. 1. Home page + outrasZonas() — the Zona data structure - Home page: apps/web/app/page.tsx (component Hub). Renders ZONAS_PUBLICADAS.map(...) in a grid gap-5 sm:grid-cols-2 lg:grid-cols-3 — today that's 6 cards (the "cidades" card is special-cased to list actual cities instead of linking to one URL). - Everything lives in apps/web/lib/zonas.ts: ts export type ZonaId = | "cidades" | "congresso" | "judiciario" | "ambiental" | "terras" | "paraopeba"; export interface Zona { id: ZonaId; href: string; // absolute path; used with raw <a, NEVER the per-zona <Link etiqueta: string; // e.g. "Estadual · Meio ambiente em Minas Gerais" nomeCurto: string; // 1-2 words, for nav/footer titulo: string; // headline for the big home card descricao: string; // long paragraph for the home card resumo: string; // short sentence for cross-link blocks itens: string[]; // 4 bullet points on the home card cor: string; // CSS var, e.g. "var(--cp-tertiary)" — never a literal hex publicada: boolean; // false = built & routable, but hidden from home/cross-links } export const ZONAS: Zona[] = [ / 6 entries today / ]; export const ZONAS_PUBLICADAS = ZONAS.filter(z = z.publicada); // what public screens read export function outrasZonas(atual: ZonaId): Zona[] { return ZONAS_PUBLICADAS.filter(z = z.id !== atual); } outrasZonas() feeds apps/web/app/components/OutrasFrentes.tsx ("As outras frentes" cross-link block at the bottom of every zona) and, per docs/planos/REVISAO-UX-E-ONBOARDING.md, the zona header nav bars — this replaced hand-written sibling-zona link lists that rotted every time a new zona shipped. publicada: false is the documented mechanism for scaffolding a new zona (code + routes) before it's announced on the home grid. 2. Reference zona — Paraopeba (fuller example than Terras) I picked Paraopeba over Terras/Função Social da Terra because Terras (apps/web/lib/terras/: just alertas.ts + camadas.ts + 2 tests, plus 4 files…

**Arquivos declarados:**
- (não declarados no resumo)

### 2026-08-22 — controle-popular

- **Agente:** `agent-a8a22ad94675c262f`
- **Commit:** `4fdbfc7`
- **Transcrição (fora do repo):** `C:\Users\teste\.claude\projects\X--DevCoder-controle-popular\0609ebcc-a009-4fbd-9b06-cce44e4e4960\subagents\workflows\wf_3a4c236d-2c1\agent-a8a22ad94675c262f.jsonl`

**Tarefa:** Tarefa: dar cabecalho enxuto de navegacao as zonas Funcao Social da Terra e Paraopeba, que hoje nao tem nenhum. Worktree (trabalhe SO aqui): X:\DevCoder\controle-popular\.claude\worktrees\cabecalho-zonas Regras da casa (X:\DevCoder\controle-popular), nao-negociaveis -- leia AGENTS.md e docs/DESENVOLVIMENTO.md inteiros antes de comecar, mas aqui vao as que mais mordem: - Trabalhe SO dentro do worktree indicado abaixo…

**Resumo final:** Cabecalho enxuto (molde de /congresso) adicionado as duas zonas que nao tinham nenhum. Paraopeba (11 subpaginas medidas, nao as 9 do briefing -- nenhuma em tela cheia) recebeu layout.tsx de zona completo com nav de 11 links, deliberadamente sem footer nem BuscaUniversal (razoes documentadas no proprio arquivo, ver decisoes tecnicas). Funcao Social da Terra (hub + /alertas + /mapa, este ultimo o globo 3D em tela cheia com HUD nos 4 cantos do canvas) recebeu um componente Cabecalho.tsx manual, importado pelas 3 paginas -- nao layout.tsx -- apos verificar NA PRATICA (nao supor) que o HUD do globo vive isolado dentro do proprio <iframe e nunca colide com um cabecalho de portal mais alto. De quebra, corrigido um gap de acessibilidade preexistente (main sem id/tabIndex) em /paraopeba/pericia, achado ao verificar que o skip-link teria alvo unico em toda a zona.

**Arquivos declarados:**
- `X:\DevCoder\controle-popular\.claude\worktrees\cabecalho-zonas\apps\web\lib\paraopeba\basePath.ts (novo)`
- `X:\DevCoder\controle-popular\.claude\worktrees\cabecalho-zonas\apps\web\lib\paraopeba\link.tsx (novo)`
- `X:\DevCoder\controle-popular\.claude\worktrees\cabecalho-zonas\apps\web\app\paraopeba\layout.tsx (novo -- o cabecalho da zona Paraopeba)`
- `X:\DevCoder\controle-popular\.claude\worktrees\cabecalho-zonas\apps\web\app\funcaosocialterra\Cabecalho.tsx (novo -- componente manual, nao layout.tsx)`
- `X:\DevCoder\controle-popular\.claude\worktrees\cabecalho-zonas\apps\web\app\funcaosocialterra\page.tsx (mudado -- liga Cabecalho, corrige 2 comentarios que ficaram falsos)`
- `X:\DevCoder\controle-popular\.claude\worktrees\cabecalho-zonas\apps\web\app\funcaosocialterra\alertas\page.tsx (mudado -- liga Cabecalho)`
- `X:\DevCoder\controle-popular\.claude\worktrees\cabecalho-zonas\apps\web\app\funcaosocialterra\mapa\page.tsx (mudado -- troca cabecalho ad-hoc pelo Cabecalho compartilhado)`
- `X:\DevCoder\controle-popular\.claude\worktrees\cabecalho-zonas\apps\web\app\paraopeba\pericia\page.tsx (mudado -- id/tabIndex que faltavam no main, achado durante a verificacao)`

### 2026-08-22 — controle-popular

- **Agente:** `agent-a9db7fae1131e7996`
- **Commit:** `5cd03a1973bd`
- **Transcrição (fora do repo):** `C:\Users\teste\.claude\projects\X--DevCoder-controle-popular\0609ebcc-a009-4fbd-9b06-cce44e4e4960\subagents\workflows\wf_3a4c236d-2c1\agent-a9db7fae1131e7996.jsonl`

**Tarefa:** Tarefa: escrever o coletor do Diario Oficial (D1, plataforma SIGPub) para Diamantina-MG -- Prefeitura e Camara. Worktree (trabalhe SO aqui): X:\DevCoder\controle-popular\.claude\worktrees\diario-oficial Regras da casa (X:\DevCoder\controle-popular), nao-negociaveis -- leia AGENTS.md e docs/DESENVOLVIMENTO.md inteiros antes de comecar, mas aqui vao as que mais mordem: - Trabalhe SO dentro do worktree indicado abaixo…

**Resumo final:** Escrevi o coletor etl/betim/etl/camaras/sigpub.py para o diario oficial de Diamantina-MG via SIGPub/AMM-MG (Prefeitura + Camara), depois de reconferir ao vivo com curl.exe o mecanismo de busca que dois relatos do repo descreviam de forma contraditoria: confirmei que a migration 0077 estava certa no mecanismo geral (GET, precisa de sessao + CSRF token reutilizavel), mas corrigi uma presuncao errada dela -- a pagina de detalhe da materia NAO tem campo de "pagina", so de "edicao". Portei o classificador de tipo classificarAto.ts para Python (etl/betim/etl/diario.py), validado 70/70 contra a mesma fixture real que o teste TypeScript usa. Rodei o coletor de verdade em modo --sondar (sem tocar banco, ja que este worktree nao tem DATABASE_URL) e medi 196 materias reais da Prefeitura e 11 da Camara so em julho/2026, com a paginacao conferida contra o total que a propria fonte declara em cada consulta. Fiz 4 commits locais na branch diario-oficial (nenhum push, nenhuma gravacao em banco).

**Arquivos declarados:**
- `X:\DevCoder\controle-popular\.claude\worktrees\diario-oficial\etl\betim\etl\diario.py`
- `X:\DevCoder\controle-popular\.claude\worktrees\diario-oficial\etl\betim\etl\diario_test.py`
- `X:\DevCoder\controle-popular\.claude\worktrees\diario-oficial\etl\betim\etl\camaras\sigpub.py`
- `X:\DevCoder\controle-popular\.claude\worktrees\diario-oficial\supabase\betim\migrations\0079_sigpub_entidade_diamantina.sql`

### 2026-08-22 — controle-popular

- **Agente:** `agent-aa4452f8f3c4ee2f8`
- **Commit:** `d44d9dc`
- **Transcrição (fora do repo):** `C:\Users\teste\.claude\projects\X--DevCoder-controle-popular\0609ebcc-a009-4fbd-9b06-cce44e4e4960\subagents\workflows\wf_3a4c236d-2c1\agent-aa4452f8f3c4ee2f8.jsonl`

**Tarefa:** Tarefa: adicionar uma linha de orientacao acima do grid de 6 cards da home, para quem so quer achar a propria cidade. Worktree (trabalhe SO aqui): X:\DevCoder\controle-popular\.claude\worktrees\home-orientacao Regras da casa (X:\DevCoder\controle-popular), nao-negociaveis -- leia AGENTS.md e docs/DESENVOLVIMENTO.md inteiros antes de comecar, mas aqui vao as que mais mordem: - Trabalhe SO dentro do worktree indicado…

**Resumo final:** Adicionada a linha de orientacao acima do grid de 6 cards da home (apps/web/app/page.tsx), conforme decisao 8 do dono (22/08, docs/ESTADO.md item 26) e a redacao candidata de docs/planos/REVISAO-UX-E-ONBOARDING.md secao 7 ("A home tem seis cards + um banner"). O texto "Procurando sua cidade? O primeiro card abaixo é o seu." foi inserido entre o </header e o <div do grid; nenhum dos 6 cards, o banner "Direitos em Movimento" ou a secao "Por que mais de um portal" foram tocados. Dois commits locais na branch home-orientacao (b9c9bb1 para page.tsx, d44d9dc para .claude/launch.json), sem push.

**Arquivos declarados:**
- `X:\DevCoder\controle-popular\.claude\worktrees\home-orientacao\apps\web\app\page.tsx`
- `X:\DevCoder\controle-popular\.claude\worktrees\home-orientacao\.claude\launch.json`

### 2026-08-09 — controle-popular · worktree ambiental-f0

- **Agente:** `agent-a7ea6bf1f7ecb72d7`
- **Commit:** (sem commit declarado)
- **Transcrição (fora do repo):** `C:\Users\teste\.claude\projects\X--DevCoder-controle-popular--claude-worktrees-ambiental-f0\b35a519f-d1d9-4349-8f53-15e0f5f6fee1\subagents\agent-a7ea6bf1f7ecb72d7.jsonl`

**Tarefa:** Você está pesquisando fontes de dados públicos para o projeto "Controle Popular" (repo em X:\DevCoder\controle-popular\.claude\worktrees\ambiental-f0 — leia arquivos aí à vontade, é um git worktree normal). É uma investigação, NÃO escreva nem edite nenhum arquivo, não crie nada, não toque em banco de dados (NÃO defina DATABASE_URL, não rode nenhum ETL de escrita). CONTEXTO: leia docs/ambiental/F0-discovery.md §6…

**Resumo final:** Investigation complete. Here is the structured findings report. --- Achados: IGAM/SEMAD — água e outorga (recheck direcionado de dados.mg.gov.br + varredura de sistemas próprios) Veredito executivo | Frente | Veredito | Granularidade municipal | |---|---|---| | Qualidade da água | VIÁVEL (com ressalva de granularidade) | Não nativa — precisa de join espacial | | Outorga | VIÁVEL (com ressalva de custo/fragmentação) | Existe, mas fragmentada entre 3 formatos com trade-offs diferentes | | CKAN dados.mg.gov.br para água/outorga/IGAM | CONFIRMADO: zero resultados | N/A — descarte reafirmado, agora com busca direcionada | --- Parte 1 — Recheck direcionado do CKAN dados.mg.gov.br A alegação de 2026-08-07 ("110 datasets, zero ambientais") foi verificada de novo, agora com termos específicos de água/outorga/IGAM, não só "legislação". Nota técnica: a API do CKAN devolve 403 Forbidden ("Request forbidden by administrative rules") sem um User-Agent de navegador — isso pode ter feito sondas automatizadas simples falharem silenciosamente no passado; com UA de navegador, responde normalmente. Organizações (organization_list, 18 no total, nenhuma delas ambiental): artemig, cge, der-mg, fapemig, fhemig, gmg, ipsemg, iepha, pcmg, casa-civil, sedese, fazenda, segov, seinfra, sejusp, seplag, ses, secretaria-geral. Não existe organização igam nem semad — confirmado também por organization_show?id=igam → HTTP 404 e id=semad → HTTP 404. Total de datasets hoje: package_search?q=:&rows=0 → 94 (a sessão anterior registrou 110 em 2026-08-07; diferença provavelmente é churn de 2 dias, não investigada a fundo — sinalizo como não totalmente explicado, não é uma contradição forte o bastante pra mudar o veredito). Buscas direcionadas — todas as específicas deram zero: | Query | count | |---|---| | q=igam | 0 | | q=semad | 0 | | q=outorga | 0 | | q=água (acentuado) | 0 | | q=agua (sem acento) | 0 | | q=recursos+hidricos / recursos+hídricos | 0 | | q=balneabilidade | 0 | | q=hidrografia | 0 | | q=bacia+hidrografica | 0 | | q=IGAM / q=SISEMA | 0 | | q=efluente | 0 | | q=poço+tubular | 0 | | q=licenciamento+ambiental | 0 | | q=COPAM / q=FEAM | 0 | Buscas amplas que deram resultado — todas falso-positivo, verificado registro a registro: | Query | count | Resultados reais | |---|---|---| | q=qualidade+da+água | 5 | Datasets de saúde da FHEMIG/SES (condições adquiridas em internação, readmissão…

**Arquivos declarados:**
- (não declarados no resumo)

### 2026-08-09 — controle-popular · worktree ambiental-f0

- **Agente:** `agent-a8254e090ee223938`
- **Commit:** (sem commit declarado)
- **Transcrição (fora do repo):** `C:\Users\teste\.claude\projects\X--DevCoder-controle-popular--claude-worktrees-ambiental-f0\b35a519f-d1d9-4349-8f53-15e0f5f6fee1\subagents\agent-a8254e090ee223938.jsonl`

**Tarefa:** Você está pesquisando fontes de dados públicos para o projeto "Controle Popular" (repo em X:\DevCoder\controle-popular\.claude\worktrees\ambiental-f0 — leia arquivos aí à vontade, é um git worktree normal). É uma investigação, NÃO escreva nem edite nenhum arquivo, não crie nada, não toque em banco de dados (NÃO defina DATABASE_URL, não rode nenhum ETL de escrita). CONTEXTO: o projeto está montando um eixo…

**Resumo final:** Investigação: dados abertos do IBAMA — Autos de Infração e Áreas Embargadas Verificado ao vivo em 2026-08-09 contra os serviços reais (curl direto, sem WebFetch/WebSearch — ambos foram bloqueados por política do harness; toda evidência abaixo vem de requisições HTTP reais feitas com curl e inspeção do conteúdo baixado com Python). Contexto lido antes de começar: docs/ambiental/F0-discovery.md (estado da arte atual do eixo), docs/ambiental/PROVENIENCIA.json (gate de uso comercial), docs/betim/ambiental-pecma-research.md (pesquisa anterior, só olhou PECMA/MPMG) e etl/betim/etl/apis/anm_cfem.py (padrão de coletor nacional com guarda de identidade). Veredito resumido | Tema | Veredito | Granularidade municipal | Licença | |---|---|---|---| | Autos de Infração | ✅ VIÁVEL | Sim — COD_MUNICIPIO é o código IBGE de 7 dígitos, verificado | "Outra (Aberta)", sem vedação a uso comercial | | Áreas Embargadas | ✅ VIÁVEL | Sim — mesmo padrão COD_MUNICIPIO IBGE | "Outra (Aberta)" (CSV) / ODbL (SHP-ZIP geo) — nenhuma das duas veda uso comercial | Ambas as fontes vivem no mesmo portal CKAN: https://dadosabertos.ibama.gov.br. Este é o achado central: o candidato certo listado na tarefa (dadosabertos.ibama.gov.br) é exatamente onde os dois conjuntos moram, com URL de download direto, sem chave, sem login, atualizado nos últimos dias. --- 1. Autos de Infração 1.1 Onde e como Dataset CKAN: fiscalizacao-auto-de-infracao (https://dadosabertos.ibama.gov.br/dataset/fiscalizacao-auto-de-infracao), 24 recursos (CSV/XML/JSON × 8 tabelas). O recurso principal: https://stibamadadosabertosprd.blob.core.windows.net/dados-abertos/dados/SIFISC/auto_infracao/auto_infracao/auto_infracao_csv.zip - HEAD antes de baixar: HTTP 200, Content-Length: 121.247.278 bytes (121,2 MB), Last-Modified: Wed, 05 Aug 2026 16:40:27 GMT (4 dias antes de "hoje"). - Baixei o arquivo inteiro (121 MB é pequeno o bastante — não é o CSV de "vários GB" que a tarefa pediu pra evitar). Dentro do zip: 48 arquivos, um por ano, de auto_infracao_1977.csv a auto_infracao_2026.csv (não 1980 como as extras do próprio dataset declaram — ver armadilha 8 abaixo). - Total uncompressed: 711.418.068 bytes (711,4 MB) somando os 48 anos. - Também existem _json.zip e _xml.zip equivalentes (não testados, mesma URL trocando o sufixo). 1.2 Schema real (79 colunas, header idêntico em todos os 48 anos)…

**Arquivos declarados:**
- (não declarados no resumo)

### 2026-08-09 — controle-popular · worktree ambiental-f0

- **Agente:** `agent-ae45313c137e9e0a9`
- **Commit:** (sem commit declarado)
- **Transcrição (fora do repo):** `C:\Users\teste\.claude\projects\X--DevCoder-controle-popular--claude-worktrees-ambiental-f0\b35a519f-d1d9-4349-8f53-15e0f5f6fee1\subagents\agent-ae45313c137e9e0a9.jsonl`

**Tarefa:** Você está pesquisando fontes de dados públicos para o projeto "Controle Popular" (repo em X:\DevCoder\controle-popular\.claude\worktrees\ambiental-f0 — leia arquivos aí à vontade, é um git worktree normal). É uma investigação, NÃO escreva nem edite nenhum arquivo, não crie nada, não toque em banco de dados (NÃO defina DATABASE_URL, não rode nenhum ETL de escrita). CONTEXTO IMPORTANTE — leia…

**Resumo final:** Investigação concluída: SNISB/ANA Veredito: VIÁVEL — acrescenta cobertura real e substancial, não coberta por FEAM nem pelo dashboard ANM. Resumo em uma frase: o SNISB tem 31.135 barragens no Brasil e 2.212 em MG (quase 9× as 249 da FEAM), e a maioria delas em MG (~1.871) é fiscalizada por IGAM, ANEEL e ANA — três reguladores inteiramente ausentes das fontes já documentadas — cobrindo abastecimento humano, irrigação e hidrelétricas que FEAM/ANM simplesmente não têm. A fatia de mineração dentro do SNISB (909 barragens nacionais atribuídas à ANM) é, como esperado, redundante com o dashboard ANM já catalogado (894). --- 1. Domínio correto (achado prévio já estava com a URL errada) snisb.ana.gov.br não existe. O domínio real é www.snisb.gov.br (WordPress institucional), que eu só achei rastreando os links de saída de ana.gov.br. Registrar isso evita que a próxima sessão perca tempo repetindo a tentativa errada. 2. URLs testadas ao vivo (sucesso e falha) | URL | Resultado | |---|---| | https://snisb.ana.gov.br/ | ❌ falha de navegação — domínio errado | | https://www.gov.br/ana/pt-br/assuntos/seguranca-de-barragens | ❌ 404 — slug errado | | https://www.gov.br/ana/pt-br/assuntos/seguranca-hidrica/seguranca-de-barragens | ✅ existe (página institucional) | | http://www.snisb.gov.br/ | ✅ 200, site WordPress, link correto pro mapa | | https://portal1.snirh.gov.br/ana/rest/services | ❌ HTTP 500 — "ArcGIS Web Adaptor: não foi possível acessar nenhuma máquina do servidor" (beco sem saída, o adaptor "ana" está quebrado) | | https://portal1.snirh.gov.br/ana/server/rest/services | ❌ mesmo erro 500 | | https://portal1.snirh.gov.br/server/rest/services/SNISB_MapaInterativo2023/MapServer/0 | ✅ 200 — endpoint real, achado rastreando as chamadas de rede do WebAppViewer | | https://www.snirh.gov.br/arcgis/rest/services/IG/SNISB/FeatureServer/0 | ✅ 200 — endpoint canônico, o mesmo linkado a partir de dados.gov.br → dadosabertos.ana.gov.br | | https://dados.gov.br/dados/conjuntos-dados?q=SNISB | parâmetro q= da UI não filtra (é um no-op) — precisei descobrir via rede que o parâmetro real da API é titulo= | | https://dadosabertos.ana.gov.br/api/download/v1/items/.../csv\|geojson\|shapefile\|kml\|filegdb | ✅ 302 → redireciona para hub.arcgis.com/api/v3/datasets/.../downloads/data (mecanismo padrão Esri Hub, funcional) | Os dois serviços ArcGIS (portal1.snirh.gov.br/server/... e…

**Arquivos declarados:**
- (não declarados no resumo)


## Sessões do opencode

Extrato de prompt e conclusão de **130** sessões (**96** subagentes),
direto do banco local do opencode: [opencode-sessoes-cp.md](../relatorios-automacao/opencode-sessoes-cp.md).
Leitura somente-leitura, CPF e segredo redigidos, sem custo de modelo.

## Entregas e handoffs

| Data | Documento | Domínio | Resumo |
|---|---|---|---|
| 2026-10-30 | [HANDOFF — Cavas de mineração: cron desligado, falha diagnosticada e próximos passos](/docs/historico/entregas/HANDOFF-2026-10-30-CAVAS-MINERACAO.md) | mineração (cavas), infraestrutura (Azure) | Cron da VM desligado; falha `abortado-rc0`/`Killed`/`RasterioIOError` diagnosticada; custo do portal e canário no anexo. |
| 2026-10-18 | [Handoff — Sessão de 02/09/2026 (tarde) — Plano Nossos + Painéis-Sanfona + Telegram](/docs/historico/entregas/2026-09-02-HANDOFF-SESSAO-TELEGRAM.md) | operação do projeto | Handoff — Sessão de 02/09/2026 (tarde) — Plano Nossos + Painéis-Sanfona + Telegram |
| 2026-10-15 | [Plano — CI de ingestao automatica RAG + busca + padronizacao de unidades](/docs/historico/entregas/PLANO-CI-RAG-INGESTAO-UNIDADES.md) | global (CI, RAG, busca, ETL, transformacao de dados) | Tres perguntas do dono, uma so resposta estruturada: |
| 2026-10-14 | [📤 HANDOFF — Routes de Cidades (Sessão Delegada)](/handoffs/HANDOFF-cidades-routes.md) | — | Expansão nacional do Controle Popular — 5.570 municípios do Brasil já coletados em apps/web/data/municipios-brasil.json. A route /cidades/sp foi implementada como template em apps/web/app/cidades/sp/page.tsx. |
| 2026-10-04 | [HANDOFF — Azure (espelho + VM + Blob) e preparador das cavas](/docs/historico/entregas/HANDOFF-2026-10-04-AZURE-CAVAS.md) | global (infra, operação) | HANDOFF — Azure (espelho + VM + Blob) e preparador das cavas |
| 2026-09-29 | [RESUMO PLANOS](/docs/historico/entregas/RESUMO-PLANOS.md) | global | 0. 🏛️ Conselhos Sociais / Direitos / Temáticos Status: ✅ CONCLUÍDO |
| 2026-09-25 11:26 | [HANDOFF — Fechamento PNCP no home-pc (24/09)](/docs/HANDOFF-24-09-FECHAMENTO-PNCP.md) | cidades | HANDOFF — Fechamento PNCP no home-pc (24/09) |
| 2026-09-23 ~15:30 | [HANDOFF — PNCP SP + demais capitais (23/09)](/docs/HANDOFF-23-09-PNCP-SP-CAPITAIS.md) | cidades | Duas IAs na mesma máquina. Uma fila por sessão. BH não é desta IA. |
| 2026-09-22 ~21:30 | [HANDOFF — coleta Guara + pendência de deploy (22/09)](/docs/historico/entregas/HANDOFF-22-09-COLETA-GUARA.md) | global | Esta sessão moveu a coleta do Neon (banco cheio, 94%) para o Postgres do Guara e encheu as tabelas vazias do Betim. Se o PC desligar, este arquivo é o ponto de retomada: não reabrir diagnóstico já feito. |
| 2026-09-19 | [HANDOFF ONDA2 AMBIENTAL](/docs/historico/entregas/HANDOFF-ONDA2-AMBIENTAL.md) | global | 6 estados com coletor comprometido + amostra no feed |
| 2026-09-19 | [PLANO ESTRUTURA NACIONAL](/docs/historico/entregas/PLANO-ESTRUTURA-NACIONAL.md) | global | Expandir a cobertura do Controle Popular de apenas Betim (MG) para todos os polos principais do Brasil, mantendo dentro dos limites do Neon Free (0.5 GB storage, 100 CU-horas/mês, 5 GB transferência). |
| 2026-09-08 | [Roteiro — retorno à Neon (atualizado em 2026-09-08)](/docs/historico/entregas/ROTEIRO-NEON-01-09.md) | global | 1. Zerado o dado defasado (351 MB de agosto) — drop schema public cascade 2. 87 migrations aplicadas (0001–0087). Dois obstáculos, ambos resolvidos: |
| 2026-09-02 (18:35) | [Fila de tarefas entre agentes](/docs/historico/entregas/FILA-AGENTES.md) | coordenação entre agentes | Regras de uso: ver historico/planos/PONTE-JCODE-GEMINI.md. Cada item é uma seção; o donatário marca status e conversa nas Notas. Nunca apagar Notas. |
| 2026-09-01 | [Plano — navegação padrão, pedidos por e-mail, notificações e contador público](/docs/historico/entregas/PLANO-NAVEGACAO-E-NOTIFICACOES.md) | global | Plano — navegação padrão, pedidos por e-mail, notificações e contador público |
| 2026-08-31 | [Fase 2 — Biblioteca Paraopeba: Classificação + Análise](/docs/historico/entregas/HANDOFF-FASE2-PARAOPEBA.md) | paraopeba | O portal tem 3 fontes sobre Brumadinho cruzadas na página /paraopeba/analise: 1. Auditoria AECOM — 467 documentos, 337 relatórios, 16 eixos temáticos 2. Perícia judicial UFMG — 7 documentos do CTC/UFMG 3. ATIs (biblioteca) — 645 itens de 3 assessorias (AEDAS 435, Guaicuy 162, NACAB 48) |
| 2026-08-31 | [PLANO — Canário Telegram v2 (funções novas + integração opencode)](/docs/historico/entregas/PLANO-CANARIO-TELEGRAM.md) | global | PLANO — Canário Telegram v2 (funções novas + integração opencode) |
| 2026-08-31 | [PLANO — Cloudflare Tunnel como acesso remoto ao home-pc](/docs/historico/entregas/PLANO-CLOUDFLARE-TUNNEL.md) | global | Hoje o home-pc publica o portal e expõe dois canais de controle: |
| 2026-08-31 | [Plano de Expansão Nacional — 27 Estados, 27 Capitais e Polos do Interior](/docs/historico/entregas/PLANO-EXPANSAO-NACIONAL-CIDADES-E-ESTADOS.md) | global | Definir o plano mestre, as diretrizes de dados, os links de validação e a estratégia técnica para expandir o portal Controle Popular (controlepopular.com.br) para todas as 27 Unidades Federativas (26 Estados + DF), todas as 27 Capitais e mais de 110 cidades estratégicas do interior, com o Índice de Risco a Direitos, a Teia de Interesses e a análise… |
| 2026-08-30 | [2026-08-30 — ENTREGA: SIRENEJud nas frentes + API pública v1 + catálogo dados.gov.br](/docs/historico/entregas/2026-08-30-ENTREGA-sirenejud-api-publica.md) | global | 2026-08-30 — ENTREGA: SIRENEJud nas frentes + API pública v1 + catálogo dados.gov.br |
| 2026-08-22 | [Direitos em Movimento — plano da seção](/docs/historico/entregas/PLANO-DIREITOS-EM-MOVIMENTO.md) | global | Isto não é uma seção para construir. É uma seção para ABRIR. |
| 2026-08-22 | [Facilitador de denúncia de violação de direitos humanos — plano](/docs/historico/entregas/PLANO-ACAO-CIDADA.md) | global | Facilitador de denúncia de violação de direitos humanos — plano |
| 2026-08-22 | [Handoff: alertas de território (indígena/quilombola × barragem/mineração/legislação)](/docs/historico/entregas/HANDOFF-ALERTAS-TERRITORIO.md) | global | Este documento é para quem estiver com apps/web/public/terras/globo/js/config.js e js/ui/layerspanel.js abertos — eu não toquei em nenhum dos dois, de propósito: outra frente estava editando os dois arquivos ao vivo, noutro worktree, no momento desta entrega (mesma regra que já valia para docs/HANDOFF-CAMADA-DINHEIRO.md, que eu li como referência de formato… |
| 2026-08-22 | [Handoff: as páginas do Painel Paraopeba que não chegaram ao portal](/docs/historico/entregas/HANDOFF-PAINEL-PARAOPEBA-PAGINAS-PERDIDAS.md) | paraopeba | Medido em 2026-08-15, rodando scripts/extrair-clipping-ati.mts e contando cada array programaticamente sobre o arquivo-fonte. Nada aqui é estimativa. Fonte medida: X:\DevCoder\Projetos html\painel-paraopeba (V1).html (376.048 bytes, 365.010 caracteres, UTF-8 válido, sem charset declarad... |
| 2026-08-22 | [Handoff: ligar as camadas de dinheiro ao globo 3D](/docs/historico/entregas/HANDOFF-CAMADA-DINHEIRO.md) | global | Este documento é para quem estiver com apps/web/public/terras/globo/js/config.js e js/ui/layerspanel.js abertos — eu não toquei em nenhum dos dois, de propósito: outro agente estava editando os dois arquivos ao vivo, noutro worktree, no momento desta entrega, e mexer neles teria dado conf... |
| 2026-08-22 | [Handoff: o raio de 8 km × SIGMINE — a lacuna de método que faltava](/docs/historico/entregas/HANDOFF-ALERTA-RAIO-8KM.md) | global | Este documento é para quem estiver com apps/web/public/terras/globo/js/config.js aberto — eu não toquei nesse arquivo nem em nada dentro de js/, de propósito: o dev estava editando config.js ao vivo no momento desta entrega (mesma regra de docs/HANDOFF-ALERTAS-TERRITORIO.md, que eu l... |
| 2026-08-22 | [O deploy travou por tamanho de asset — e o culpado não era o dado](/docs/historico/entregas/HANDOFF-PAYLOAD-LEGISLACAO.md) | global | O deploy travou por tamanho de asset — e o culpado não era o dado |
| 2026-08-22 | [Plano — painel de edição do site](/docs/historico/entregas/PLANO-PAINEL-EDICAO.md) | global | medido contra um ganho que a opção 1, desacoplada, já entrega. |
| 2026-08-22 | [Plano — transparência de MP, DP e Judiciário além do dinheiro](/docs/historico/entregas/PLANO-TRANSPARENCIA-JUSTICA.md) | global | Plano — transparência de MP, DP e Judiciário além do dinheiro |
| 2026-08-22 | [Plano de expansão do Controle Popular — acordos, contratos e convênios em MG](/docs/historico/entregas/PLANO-EXPANSAO-ACORDOS-MG.md) | global | Plano de expansão do Controle Popular — acordos, contratos e convênios em MG |
| 2026-08-22 | [Plano de geocodificação — dados do monitoramento da Vale e camadas novas](/docs/historico/entregas/PLANO-GEOCODIFICACAO.md) | global | Plano de geocodificação — dados do monitoramento da Vale e camadas novas |
| 2026-08-22 | [Plano: bases de vulnerabilidade climática e risco](/docs/historico/entregas/PLANO-BASES-CLIMA-E-RISCO.md) | global | Plano: bases de vulnerabilidade climática e risco |
| 2026-08-22 | [Plano: guardar cópia dos documentos que o portal cita](/docs/historico/entregas/PLANO-ARQUIVO-DE-FONTES.md) | global | Plano: guardar cópia dos documentos que o portal cita |
| 2026-08-22 | [Plano: imagens de satélite do INPE no mapa 3D](/docs/historico/entregas/PLANO-IMAGENS-INPE.md) | global | Tudo abaixo foi chamado de verdade em 2026-08-13: o catálogo foi aberto no navegador, a API real por trás dele foi descoberta pela aba de rede (não adivinhada), 6 buscas STAC foram feitas contra ela, e 3 imagens de verdade foram baixadas e medidas (tamanho em bytes, dimensão em pixel). Onde não deu para confirmar — porque a etapa seguinte exige cadastro, e… |
| 2026-08-22 | [Plano: ingestão do Painel Paraopeba e do acervo geocodificado da UFMG](/docs/historico/entregas/PLANO-INGESTAO-PARAOPEBA.md) | paraopeba | Duas fontes, pedidas juntas pelo dev, medidas separadamente porque não têm nada em comum tecnicamente: uma é um arquivo HTML estático entregue à mão (painel-paraopeba.html, 380 mil caracteres), a outra é um índice Solr vivo da UFMG já mapeado em docs/PLANO-INTEGRACAO-BRUMADINHO.md. Este docu... |
| 2026-08-22 | [Plano: integração Brumadinho — mapa e acervo judicial](/docs/historico/entregas/PLANO-INTEGRACAO-BRUMADINHO.md) | global | Tudo abaixo foi chamado de verdade e confirmado respondendo em 2026-08-13. Onde não confirmei, está escrito que não confirmei. Contagem é sempre contagem medida contra o endpoint, nunca estimativa. |
| 2026-08-15 | [Handoff — 15/08/2026, noite](/docs/historico/entregas/HANDOFF-2026-08-15-NOITE.md) | global | 7. Documentos e notícias relacionadas no fim da ficha — pedido explícito, nunca construído |
| 2026-08-15 | [Plano consolidado — 15/08/2026](/docs/historico/entregas/PLANO-2026-08-15.md) | global | O site está congelado desde 13/08 por volta das 22h. Nove commits de hoje estão no GitHub e nenhum está no ar. |

## Planos com pendência aberta

| Última medição | Plano | Status | Pendências abertas | Resumo |
|---|---|---|---|---|
| 2026-10-18 | [Plano integrado — Ambiental e dados](/docs/planos/PLANO-INTEGRADO-AMBIENTAL-E-DADOS.md) | sem status | 13 | Plano único do tema ambiental e dados. Reúne o que estava espalhado em dezenas de planos arquivados em ../historico/planos/ e o que o radar mediu em 18/10/2026. |
| 2026-10-18 | [Plano integrado — Operação e agentes](/docs/planos/PLANO-INTEGRADO-OPERACAO-E-AGENTES.md) | sem status | 18 | Plano único do tema operação, infraestrutura e agentes. Junta deploy, dívida de código, LinkMender, orquestração multi-agente e a dívida das worktrees, com o que o radar mediu. |
| 2026-10-18 | [Plano integrado — Produto e interface](/docs/planos/PLANO-INTEGRADO-PRODUTO-E-INTERFACE.md) | sem status | 13 | Plano único do tema produto e interface. Junta o que restava de página, texto, SEO, acessibilidade, identidade visual e divulgação, com o que o radar mediu em 18/10/2026. |

## Worktrees e linhas de trabalho

| Branch | Último commit | Data | Assunto | Distância de origin/main | Caminho |
|---|---|---|---|---|---|
| `pend-0710` | `4a2dba4b` | 2026-10-09 | infra: tira o dominio do Worker (landmine) e detalha o alerta do canario | atrás 156 · à frente 0 | `.claude/worktrees/cp-pend-0710` |
| `cp-hero-vivo` | `5d8fb85e` | 2026-10-07 | Seu Nono por cima da pata e acessibilidade dentro do chat | atrás 236 · à frente 0 | `.claude/worktrees/cp-hero-vivo` |
| `cp-scroll` | `17d85eda` | 2026-10-06 | Status (Pages): timeout de 20s — cold start do espelho nao e "Fora do ar" | atrás 280 · à frente 0 | `.claude/worktrees/cp-scroll` |
| `cp-radio` | `1dc4a6a1` | 2026-10-04 | Docs: incidente do drizzle-orm no standalone, migration 0011 e o servidor 2 | atrás 337 · à frente 0 | `.claude/worktrees/cp-radio` |
| `cp-seo` | `cd202617` | 2026-10-04 | blog: titulos em caixa de frase, fim do Title Case | atrás 336 · à frente 0 | `.claude/worktrees/cp-seo` |
| `companheiro` | `5f8cb0cf` | 2026-10-01 | chore(companheiro): arte cartoon do bichinho no site e espelho sincronizado | atrás 424 · à frente 0 | `.claude/worktrees/companheiro` |
| `companheiro-i3` | `84066cf7` | 2026-09-30 | docs(companheiro): marca a sessao pareada (portal + app) como pronta | atrás 529 · à frente 0 | `.claude/worktrees/companheiro-i3` |
| `cp-ecossistema` | `0ef51498` | 2026-09-30 | feat(globo): salva as camadas ligadas e gera link compartilhavel | atrás 516 · à frente 0 | `.claude/worktrees/cp-ecossistema` |
| `cp-bots-lab` | `a0aa7117` | 2026-09-24 | build: regenera cidades-do-build e proveniencia do globo | atrás 747 · à frente 7 | `.claude/worktrees/cp-bots-lab` |

## Relatórios automáticos

| Data | Documento | Domínio | Resumo |
|---|---|---|---|
| 2026-10-18 | [LinkMender v2 — Auditoria de Links e Validação de Conteúdo](/docs/relatorios-automacao/linkmender-v2-propostas.md) | — | LinkMender v2 — Auditoria de Links e Validação de Conteúdo |
| 2026-10-18 | [Sessões do opencode — prompt e conclusão](/docs/relatorios-automacao/opencode-sessoes-cp.md) | — | Guardar o começo e o fim de cada sessão do opencode no Controle Popular: a pergunta que abriu o trabalho e a conclusão a que o agente chegou. O meio (ferramentas, diffs, arquivos) fica fora de propósito — o valor está no pedido e no veredito. |
| 2026-10-16 | [LinkMender — Propostas de Correcao de Links](/docs/relatorios-automacao/linkmender-propostas.md) | — | LinkMender — Propostas de Correcao de Links |
| 2026-10-16 | [Padrao de pagina (top 100) - auditoria estatica](/docs/relatorios-automacao/padrao-pagina-2026-10-14.md) | — | Padrao de pagina (top 100) - auditoria estatica |
| 2026-10-16 | [Parecer Consolidado de Automação e Auditoria — Colibri](/docs/relatorios-automacao/parecer-colibri-agentes.md) | — | Parecer Consolidado de Automação e Auditoria — Colibri |
| 2026-10-14 | [Inconsistências de data na memória (triagem)](/docs/relatorios-automacao/inconsistencias-mistica.md) | — | Inconsistências de data na memória (triagem) |
| 2026-10-14 | [Linha do tempo completa — memória das lutas](/docs/relatorios-automacao/linha-do-tempo-completa.md) | — | Linha do tempo completa — memória das lutas |
| 2026-10-14 | [LinkMender v2 — Auditoria de Links e Validação de Conteúdo](/docs/relatorios-automacao/linkmender-empresas-report.md) | — | LinkMender v2 — Auditoria de Links e Validação de Conteúdo |
| 2026-10-14 | [Padrao de pagina (top 100) - auditoria estatica](/docs/relatorios-automacao/padrao-pagina-2026-10-13.md) | — | Padrao de pagina (top 100) - auditoria estatica |
| 2026-10-14 | [Radio + navegacao — baseline](/docs/relatorios-automacao/radio-navegacao-baseline-2026-10-03-1545.md) | — | A fila vem de catalogo.ts (rotaLegada), dos 4 hubs de eixo e de top-100-paginas.json, nessa ordem. |
| 2026-10-14 | [Radio + navegacao — hero-birds-conserto](/docs/relatorios-automacao/radio-navegacao-hero-birds-conserto-2026-10-06-0933.md) | — | A fila vem de catalogo.ts (rotaLegada), dos 4 hubs de eixo e de top-100-paginas.json, nessa ordem. |
| 2026-10-14 | [Radio + navegacao — hero-vivo](/docs/relatorios-automacao/radio-navegacao-hero-vivo-2026-10-05-1836.md) | — | A fila vem de catalogo.ts (rotaLegada), dos 4 hubs de eixo e de top-100-paginas.json, nessa ordem. |
| 2026-10-14 | [Radio + navegacao — hero-vivo-fase4b](/docs/relatorios-automacao/radio-navegacao-hero-vivo-fase4b-2026-10-05-2126.md) | — | A fila vem de catalogo.ts (rotaLegada), dos 4 hubs de eixo e de top-100-paginas.json, nessa ordem. |
| 2026-10-14 | [Radio + navegacao — hero-vivo-fase4c](/docs/relatorios-automacao/radio-navegacao-hero-vivo-fase4c-2026-10-05-2150.md) | — | A fila vem de catalogo.ts (rotaLegada), dos 4 hubs de eixo e de top-100-paginas.json, nessa ordem. |
| 2026-10-14 | [Radio + navegacao — hero-vivo-final](/docs/relatorios-automacao/radio-navegacao-hero-vivo-final-2026-10-05-1930.md) | — | A fila vem de catalogo.ts (rotaLegada), dos 4 hubs de eixo e de top-100-paginas.json, nessa ordem. |
| 2026-10-14 | [Radio + navegacao — hero-vivo-reteste](/docs/relatorios-automacao/radio-navegacao-hero-vivo-reteste-2026-10-05-1903.md) | — | A fila vem de catalogo.ts (rotaLegada), dos 4 hubs de eixo e de top-100-paginas.json, nessa ordem. |
| 2026-10-14 | [Revisão de textos da memória (Mística do Dia e Linha do tempo)](/docs/relatorios-automacao/revisao-textos-memoria.md) | — | Revisão de textos da memória (Mística do Dia e Linha do tempo) |
| 2026-10-04 | [Auditoria de SEO on-page — top 100 páginas](/docs/relatorios-automacao/auditoria-seo-2026-10-04.md) | global | Nota da medição (04/10/2026, tarde). O site oscilou durante a varredura: uma rodada anterior no mesmo dia respondeu 92/100 e as mesmas páginas que caíram voltaram a responder 200 no teste manual, uma a uma. Os 31 HTTP 503 desta rodada são queda do serviço, não defeito de página — inclusive a home caiu no meio da coleta. Rerodar quando o Guara estiver… |
| 2026-10-02 | [Integração de dados órfãos — resumo da análise](/docs/relatorios-automacao/INTEGRACAO-DADOS-ORFAOS.md) | dados / integração | HIGH PRIORITY (big impact, easy integration) |
| 2026-09-20 | [AUDITORIA — Mapeamento e Correção de Links nas Top 100 Páginas, Eixos e Subfrentes](/docs/relatorios-automacao/AUDITORIA-LINKS-EIXOS-TOP100.md) | global | Este relatório documenta a auditoria completa de links internos e externos realizada nas 100 páginas nobres catalogadas em apps/web/data/top-100-paginas.json, nos 3 Grandes Eixos Temáticos (Direitos em Movimento, Terra e Territórios e Estado e Economia), nas frentes cívicas e nas suas 18 subfrentes. |
| 2026-09-08 | [Relatório técnico geral do site](/docs/relatorios-automacao/relatorio-tecnico-geral.md) | global | Documento gerado por scripts/gerar-relatorio-tecnico.mts em 2026-09-08. Fonte da verdade: o código do repositório (rotas do App Router, registry de fontes, catálogo de eixos) e os JSONs versionados, medidos na geração. |
| 2026-09-01 (arquivo criado; nenhuma ação registrada ainda) | [Divulgação — log de execução](/docs/relatorios-automacao/DIVULGACAO-LOG.md) | global (Controle Popular + Floresta de Apps) | Este arquivo é o registro de uma linha por ação de divulgação — o contraponto de execução do plano de divulgação. Ele existe para três coisas: |

## Documentos de domínio

| Data | Documento | Domínio | Resumo |
|---|---|---|---|
| 2026-08-22 | [Ambiental — F0 · Descoberta de fontes](/docs/dominios/ambiental/F0-discovery.md) | ambiental | O eixo /ambiental cobre licenciamento ambiental de MG (SEMAD/COPAM), barragens e um painel unificado de legislação ambiental nacional e estadual. |
| 2026-08-22 | [Ambiental — plano de execução das quatro seções](/docs/dominios/ambiental/plano-execucao.md) | ambiental | Ambiental — plano de execução das quatro seções |
| 2026-08-22 | [Domínio: Ambiental](/docs/dominios/ambiental/README.md) | ambiental | Referência de domínio para a frente Ambiental: pauta do COPAM, licenciamento, barragens, legislação e patrimônio cultural de MG. |
| 2026-08-22 | [Revisão crítica dos alertas de contrato — fundamentação jurídica](/docs/dominios/cidades/betim/alertas-contratos-revisao-juridica.md) | cidades | Revisão crítica dos alertas de contrato — fundamentação jurídica |
| 2026-08-22 | [Runbook — provisionar uma cidade nova no eixo Cidades](/docs/dominios/cidades/betim/runbook-cidade-nova.md) | cidades | Runbook — provisionar uma cidade nova no eixo Cidades |
| 2026-08-22 | [Domínio: Cidades](/docs/dominios/cidades/README.md) | cidades | Referência de domínio para as seis cidades do portal (Betim, Belo Horizonte, São Paulo, Diamantina, Araçuaí e Itinga). Cada subpasta guarda o runbook específico da cidade. |
| 2026-08-22 | [F4 — Benchmark da rubrica](/docs/dominios/congresso/F4-benchmark.md) | congresso | Mesmos prompts, mesma rubrica v1.0.0, mesmo cálculo determinístico. Só mudou quem respondeu. |
| 2026-08-22 | [Que modelo pode analisar — resultado medido](/docs/dominios/congresso/F4-modelos.md) | congresso | Que modelo pode analisar — resultado medido |
| 2026-08-22 | [Domínio: Congresso](/docs/dominios/congresso/README.md) | congresso | Referência de domínio para a frente Congresso: proposições federais, bancadas, comissões e ofícios. |
| 2026-08-22 | [Contrato do extrator único — relatórios de inspeção CNJ/TJMG (2012–2026)](/docs/dominios/judiciario/CONTRATO-PARSER-INSPECOES.md) | judiciario | Contrato do extrator único — relatórios de inspeção CNJ/TJMG (2012–2026) |
| 2026-08-22 | [Crítica adversarial — o que não se sustenta](/docs/dominios/judiciario/CRITICA-ADVERSARIAL-INSPECAO-TJMG.md) | judiciario | Crítica adversarial — o que não se sustenta |
| 2026-08-22 | [Crítica adversarial — 5 ramos, regex rodados contra os PDFs](/docs/dominios/judiciario/CRITICA-DOS-RAMOS-DO-PARSER.md) | judiciario | Crítica adversarial — 5 ramos, regex rodados contra os PDFs |
| 2026-08-22 | [Domínio: Judiciário](/docs/dominios/judiciario/README.md) | judiciario | Referência de domínio para a frente Judiciário: composição dos tribunais, vacância, indicações do Senado e inspeções da Corregedoria Nacional. |
| 2026-08-22 | [O que o CNJ encontrou no Tribunal de Justiça de Minas Gerais](/docs/dominios/judiciario/RESUMO-INSPECAO-TJMG-2026.md) | judiciario | Se um juiz de Belo Horizonte mandar soltar você hoje, é provável que você durma mais uma noite na cadeia — e quem diz isso não somos nós: é o Conselho Nacional de Justiça, que contou "quase 500(quinhentos) presos" incluídos "mensalmente no sistema prisional desnecessariamente". |
| 2026-08-22 | [Sondagem de inspeção/correição — STJ, TST, TRT-3 (MG), STF](/docs/dominios/judiciario/SONDAGEM-STJ-TST-TRT3-STF.md) | judiciario | Base de comparação já em casa: CNJ / tribunais de Justiça — 32 órgãos, 330 relatórios, 1,7 GB, 2008–2026, JSON puro sem login. Deste lote de quatro, nada chega perto disso. O total coletável aqui é 13 documentos, por cerca de 42 requisições, em duas rotas que não se parecem entre si nem com a do CNJ. |
| 2026-09-20 | [Laboratório de dados](/docs/dominios/LABORATORIO.md) | global (todas as frentes) | A /laboratorio deixa o leigo comparar dois conjuntos de dado do portal no mesmo padrão visual, sem escrever código. Critério de pronto (do plano): o dev monta, em dois cliques, uma comparação tipo "congresso × economia", com o Seu Nonô acendo os gráficos por botão. |
| 2026-08-22 | [Domínio: Paraopeba](/docs/dominios/paraopeba/README.md) | paraopeba | Referência de domínio para a frente Paraopeba: reparação de Brumadinho, clipping, linha do tempo, auxílio, documentos do processo e auditoria AJRI. |
