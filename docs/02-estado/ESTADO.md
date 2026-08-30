# ESTADO — o portal hoje, o que vem a seguir

> **Tipo:** ESTADO
> **Domínio:** global
> **Última medição:** 2026-08-30 (diário oficial D1 concluído, upload R2 concluído, revisão de copy do portal; SIRENEJud, API pública v1, catálogo dados.gov.br)
> **Leitura estimada:** longa (> 15 min)
> **Relacionados:** [PRODUTO.md](../01-produto/PRODUTO.md), [DESENVOLVIMENTO.md](../03-desenvolvimento/DESENVOLVIMENTO.md), [OPERACAO.md](../05-operacao/OPERACAO.md), [PLANO-CLOUDFLARE-TUNNEL.md](../planos/PLANO-CLOUDFLARE-TUNNEL.md), [AGENTS.md](/AGENTS.md)
> **Palavras-chave:** estado, fila, bloqueios, divida tecnica, decisoes, plano unico, neon, build, tunnel

## Sumário

- [Propósito](#propósito)
- [No ar agora](#no-ar-agora)
- [Decisões do dono — 22/08/2026](#decisões-do-dono-22082026)
- [Plano único — ordem de execução](#plano-único-ordem-de-execução)
- [Fila viva — ranqueada por custo × benefício](#fila-viva-ranqueada-por-custo-benefício)
- [Bloqueios](#bloqueios)
- [Dívida técnica registrada](#dívida-técnica-registrada)
- [Rito de trabalho](#rito-de-trabalho)

## Propósito

Estado medido do portal controlepopular.com.br: o que está no ar, o que está bloqueado, o que vem a seguir, e as decisões que não podem ser reabertas sem remensurar. (medição em 16/08 — remeça antes de decidir com ele)

> **Fila e decisões atualizadas em 22/08/2026.** A pedido do dono, este documento
> passa a ser **o plano único**: tudo que falta fazer está aqui, em ordem, com a
> decisão que destrava cada coisa. Os 13 arquivos de `docs/planos/` continuam
> sendo onde mora a **medição** de cada trilha — aqui vai ponteiro, não cópia.
> Duplicar detalhe foi o que fez o plano da expansão envelhecer em um dia.

## No ar agora

**Modo de publicação (a partir de 26/08/2026):** o site é servido por `next start` no `home-pc`, exposto à internet via **Cloudflare Tunnel** (`controle-popular`, `e0d8ef85-e1c2-4958-b503-d7cc71556876`). O Worker Cloudflare continua deployado, mas **sem custom domains** — ele só existe como fallback técnico. O domínio `controlepopular.com.br` (e `www`) aponta para o túnel, não mais para o Worker. Ver detalhes operacionais em [OPERACAO.md](../05-operacao/OPERACAO.md) e o histórico da decisão em [PLANO-CLOUDFLARE-TUNNEL.md](../planos/PLANO-CLOUDFLARE-TUNNEL.md).

Publicado em 15/08 (build no `home-pc`, deploy passou). Seis frentes:

| Frente | O que está no ar |
|---|---|
| **Cidades** | seis municípios com contrato, licitação, diário de câmaras, rede de proteção, clima e defesa civil; índice fatiado em `[municipio]/camara/legislacao` |
| **Congresso** | PLs e ofício ao Congresso com `.docx`/`.pdf` gerados no navegador; rubrica determinística |
| **Judiciário** | grafo de jurisprudência com link de fonte; página de privacidade; processos ambientais por UF e tribunal (SIRENEJud, `/judiciario/sirenejud`) |
| **Função Social da Terra** | globo 3D com imagem de satélite por zoom e tooltip de 2 s; camadas de barragem, mineração, quilombolas; 4 camadas de alerta de sobreposição ligadas; faixa de 8 km × SIGMINE (1.899 processos que a interseção pura não vê); alerta quilombola × mancha com 6 sobreposições |
| **Paraopeba** | auditoria AJRI com 467 fichas legíveis (sem modelo) e relacionados por tema+data; execução do Acordo (26 municípios, R$ 5,48 bi, 73,8% pago); repasse (1.214/1.214 linhas, R$ 1,65 bi); biblioteca das ATIs (597); clipping de ATIs (46) e IJs (59); radar de notícias; linha do tempo; ressalva `AvisoColetaEmCurso` em 5 páginas |
| **Ambiental** | direito crítico (30 normas + 15 precedentes em 5 temas); legislação estadual (6.378 normas); microssistema com instrumento e precedente por tema; processos ambientais por município de MG (SIRENEJud/CNJ, `/ambiental/judiciario`) |

Transversais confirmados: **painel de edição web** (token, editar, publicar, sincronizar, último deploy); **termo LGPD** com canal de contato; **assistente** degraus 0 (navegação, 0,35 ms), 1 (busca no índice) e 2 (composição determinística) no ar; **Direitos em Movimento** com as quatro portas e o facilitador de denúncia (`.docx`/`.pdf` só no navegador, rascunho opt-in); **Rouanet** coletado e compactado no repo (7.206 projetos + 20.785 incentivadores de MG, 7,9 MB → 2,4 MB), tela adiada de propósito; **ComunicaBR** dos 853 municípios coletado (17fccf9, 61% dos itens vazios); **API pública v1** (`/api`, Swagger UI + OpenAPI, 14 datasets estáticos gerados no prebuild — 30/08/2026).

## Decisões do dono — 22/08/2026

Tomadas numa sessão só, depois do levantamento das 13 decisões que estavam
espalhadas pelos planos. **Não reabrir sem remensurar.**

| # | Decisão | O que ela destrava |
|---|---|---|
| 1 | **Diário oficial: nomeação e exoneração SÃO publicadas** — "dados públicos de interesse coletivo, sob minha responsabilidade" (palavras do dono). ⚠️ O corte de **CPF, endereço e dado de saúde de pessoa física continua valendo** — não foi objeto desta decisão, é dado de terceiro, e as duas guardas automáticas (`scripts/checar-dado-pessoal-em-dado.py` e `sem-cpf-no-repo.test.ts`, mod-11) barram o commit de qualquer jeito | o coletor do diário (D1), parado desde 16/08. **✅ Coleta completa em 30/08/2026: 16.601 atos (jan/2020 → jul/2026), 80 meses × 2 entidades, 0 falhas** — `etl/betim/etl/camaras/sigpub.py` migrado de `curl.exe` para `requests` (curl.exe quebrado na máquina), commit `1e93eeb` |
| 2 | **Chatbot: o cérebro é a Maritaca (Sabiá), com DeepSeek como alternativa.** Ambas são fora de EUA/Europa, que era a intenção da regra original; a Maritaca ainda é brasileira e treinada em português | `PLANO-CHATBOT-IA.md` + degrau 3 do `PLANO-INDICE…` |
| 3 | **Acervo do chatbot: tudo que as respostas determinísticas não cobrirem.** O degrau 3 entra onde os degraus 0–2 devolvem vazio | idem |
| 4 | **Ressalva de IA: sempre visível**, em toda resposta gerada, com citação da fonte | idem |
| 5 | **Terras e Paraopeba ganham cabeçalho enxuto** (molde `congresso/layout.tsx`, não o `Header.tsx` rico de Cidades) | `REVISAO-UX-E-ONBOARDING.md` §5 |
| 6 | **DataJud fica em consulta ao vivo** — não se publica derivado, então não é preciso notificar o CNJ (cláusulas 3.8/3.9). Confirma o desenho que o B8 já estava seguindo | B8 do plano da expansão |
| 7 | **Espelho dos 467 PDFs da AJRI: público.** O resumo por modelo (§6) **continua em aberto** — decidir com os 10 primeiros PDFs medidos, não antes | `PLANO-ESPELHO-PDF-AJRI.md` fase 2 |
| 8 | **Home ganha uma linha de orientação acima do grid** ("procurando sua cidade…"), sem redesenho dos 6 cards | `REVISAO-UX-E-ONBOARDING.md` §7 |
| 9 | **GitHub Pages sai da fila.** ⚠️ Duas correções de fato: o repositório **é público** (`gh repo view` → PUBLIC em 22/08; o plano dizia "privado hoje"), e o Cloudflare já serve o portal — Pages não resolve problema nenhum hoje. `deploy-github-pages.md` vira contingência, não tarefa | — |
| 10 | **Diário de Itinga: `https://www.itinga.mg.gov.br/diario`** (informado pelo dono; medido em 22/08: HTTP 200, página real da prefeitura) — a última das 6 cidades sem `fontes.diario_oficial` | o card do diário em Itinga |
| 11 | **Protocolo da LAI do INCRA: o dono cuida do número** (prazo 28/08) | — |
| 12 | **O ETL antigo da FGV continua vivo**, alinhado (User-Agent honesto + pausa de 1,5 s desde 17/08). Não aposentar por ora — é ele que alimenta a tela de Betim | encerra a dívida §3b do `TODO-PROXIMAS-RODADAS.md` |
| 13 | **O código vai subir também para o Gitee, no futuro** — espelho, não mudança de casa: o GitHub continua sendo onde a CI roda (6 ETLs, as duas guardas de dado pessoal e o vigia de prazo de LAI). Sem data | item 29 |
| 14 | **Backfill do diário oficial: desde janeiro/2020** ("penúltima gestão municipal"). **✅ CONCLUÍDO em 30/08/2026** — 16.601 atos de jan/2020 a jul/2026 (80 meses × 2 entidades), 0 falhas. Precisava de banco que a máquina de desenvolvimento não tem; coleta feita no home-pc com Postgres local, módulo `requests` (curl.exe quebrado na máquina). | `docs/planos/diario-oficial-plano.md` |
| 15 | **Proposta de estruturação sociológica/investigativa do diário** — 7 eixos além dos 7 tipos (encadear processo/contrato, dispensa/inexigibilidade como subtipo, buracos de numeração, concentração de fornecedor, subtipo de pessoal, ritmo temporal, comparação entre cidades). Registrada, nada implementado | `docs/planos/diario-oficial-plano.md`, seção "Proposta" |

**Ainda em aberto** (não decididas hoje): licença da fonte *Icones do Brasil*
(item 27); fusão `ARQUITETURA.md` × `MAPA-APLICACAO.md` (item 28); credenciamento
no Conecta gov.br (item 16); resumo por modelo do AJRI (item 17).

## Plano único — ordem de execução

**Agora (destravado pelas decisões de 22/08):**

1. ~~**Restaurar o ETL da FGV**~~ — ✅ **feito em 22/08** (`git restore`). Os dois arquivos estavam apagados no diretório de trabalho, sem commit e sem decisão, com `.github/workflows/etl-betim.yml:359` ainda chamando o módulo.
2. ~~**Diário oficial D1**~~ — ✅ **implementado e MESCLADO em 22/08** (branch `diario-oficial`, 5 commits). Coletor `etl/betim/etl/camaras/sigpub.py` + classificador portado pra Python. O conflito dos dois relatos do mecanismo se resolveu a favor da migration `0077` (GET + sessão + token CSRF reutilizável); ela errava só num ponto (`pagina` nunca vem preenchida). Medido ao vivo: 196 matérias da Prefeitura + 11 da Câmara só em julho/2026. ✅ **Gap de calibração fechado pelo chip `task_f4a38f90`**: "outro" caiu de 16% (32/196) para 5,6% (11/196) — fixture cresceu para 75 títulos reais, classificador (TS + Python) ganhou `REGISTRO DE PRECO` e `RATIFICACAO` isolada. Backfill decidido: desde 2020 (decisão 14). **Pendência real:** migration `0079` (ids de entidade) nunca aplicada em banco nenhum — gravação em `atos_diario` segue por fazer.
3. ~~**Itinga no `diario_oficial`**~~ — ✅ **feito em 22/08** (`08998ea`), e a mesma passada achou um segundo erro: **Araçuaí apontava para `diariomunicipal.com.br/amm-mg`**, o portal da Associação Mineira de Municípios, e não para o diário da cidade — o mapeamento de 16/08 já media que só Diamantina bate limpo com SIGPub. Corrigido para `aracuai.mg.gov.br/diario-oficial-categorias` (HTTP 200 medido em 22/08). É a mesma família do crítico #2 de 17/08, sobrevivendo numa cidade que ninguém reconferiu.
4. ~~**Cabeçalho enxuto em Terras e Paraopeba**~~ — ✅ **implementado em 22/08**, branch `cabecalho-zonas` (9 commits, não mesclada). Paraopeba ganhou `layout.tsx` de zona real (⚠️ tem 11 subpáginas, não 9 — corrigido durante o trabalho). Terras ganhou componente manual (`Cabecalho.tsx`), não `layout.tsx` — o conflito com o HUD do globo em `/mapa` foi **medido**, não suposto: o HUD roda isolado dentro do `<iframe>`, 9 painéis intactos após a mudança. `npm test`: 996+141, 0 falhas.
5. ~~**Linha de orientação na home**~~ — ✅ **implementado em 22/08**, branch `home-orientacao` (2 commits, não mesclada). Contraste medido nos 3 temas (7,08:1 / 8,30:1 / 21:1 — todos acima do piso de 7:1 do alto-contraste).
6. **Chatbot, passo 1: fechar a peça que falta.** ⚠️ Medido em 22/08: **nem Maritaca nem DeepSeek publicam endpoint de embeddings** (a doc da Maritaca recomenda a DeepInfra; a do DeepSeek só documenta `chat/completions`). RAG precisa de embeddings antes de geração. Caminho de custo zero: vetorizar **local via Ollama**, que também mantém o texto na máquina até a varredura de dado pessoal passar. ✅ **Medido em 22/08:** `nomic-embed-text` devolve 768 dimensões, mesma dimensão do índice de código do `code-graph-rag`. ✅ **Prova de conceito implementada em 22/08**, branch `chatbot-poc` (1 commit, não mesclada): `apps/web/lib/assistente/embeddings/`, testado sobre 4 normas reais do repo — 3 de 4 perguntas acertaram por similaridade; a 4ª (busca por termo exato) não acertou, achado documentado no código. **Achado de segurança:** a guarda de dado pessoal não cobre `etl/betim/dados/` (chip `task_dae5f906`). Falta ainda: geração de resposta (Maritaca/DeepSeek — precisa de credencial que não existe) e citação obrigatória (decisão 4) ligadas por cima disto.
7. **Protocolar TCE-MG e CGE-MG** — os dois textos estão prontos no vault (`C:\Users\teste\Documents\Obsidian Vault\Projetos\`), sem protocolo desde 07/08. Depois de enviar, registrar em `docs/LAI-PROTOCOLOS.json` — aí a CI diária vigia o prazo sozinha.
8. ~~**SEO — visibilidade em buscadores**~~ — ✅ **integrado em 22/08** (`seo-fundacao`, 5 commits). `metadataBase`, Open Graph, Twitter Cards, JSON-LD (`WebSite` + `Organization`), sitemap atualizado, títulos/descriptions otimizados nas páginas principais de cidade, metadata adicionado em páginas sem, e `BreadcrumbJsonLd` na página de contratos. `tsc`, `validar-documentacao.py` e `npm test` verdes.
9. ~~**Revisão de dados — Sprint 2 (contratos e fornecedores)**~~ — ✅ **integrado em 22/08** (`revisao-dados`, 5 commits). Limiares da dispensa corrigidos para os valores do art. 75 da Lei 14.133/2021, indicio de concentração por ano com N=3 configurável, badge e filtro `?conc=1` na tela de contratos, plano atualizado com pendências e lacunas declaradas. **Pendência real:** rodar ETL no `home-pc` para os novos limiares chegarem ao banco, e medir payload (Neon 402 nesta máquina).
10. ~~**Revisão de dados — Sprint 3 (território e empreendimentos)**~~ — ✅ **pushada em 22/08** (`revisao-dados-sprint3`, 5 commits, sem merge). Tela `/[municipio]/terras/cruzamentos/` com cartões, gráfico, tabela filtrável, CSV e deep-link para o globo 3D; três tipos de cruzamento espacial (mineração, requerimento/interesse, mancha de barragem × quilombola); co-ocorrência municipal separada e rotulada; editorial do AGENTS.md aplicado (interseção ≠ causalidade, sem buffer). **Pendências:** payload só mede no home-pc; casamento por nome ainda é limitação; barragens completas dependem do banco.
11. **Chatbot IA — laboratório L4** — ✅ **pushado em 22/08** (`chatbot-lab`). Pipeline RAG local via Ollama (`nomic-embed-text` + `qwen2.5:7b`), rota `/api/chatbot`, widget `/assistente-ia-lab` com ressalva e fontes. **Pendência:** decidir onde colocar a chave da API remota (Maritaca/DeepSeek) — `apps/web/.env.local` na máquina de dev para testes; `apps/web/.env.local` no home-pc ou secret do Cloudflare Worker para produção. Nunca commitar.

**Esperando data:**

8. **01/09 — Neon volta.** Runbook pronto e em ordem: `docs/planos/ROTEIRO-NEON-01-09.md` (migrations 0071–0077 → backfill de temas → URLs do TJMG → carga das 8.570 normas federais → auditoria dos 25.729 links). O B4 (PNCP) entra aqui, não antes.
9. **28/08 — prazo da LAI do INCRA.** O dono anota o protocolo; a CI já vigia.

**Esperando dado ou decisão de terceiro:** itens 16, 17, 19, 22, 23 e 27 da fila
abaixo.

## Fila viva — ranqueada por custo × benefício

**Degrau 2 do assistente entregue (16/08)** — composição determinística, sem modelo: "compare Betim e Belo Horizonte", "o que falta em Betim", "Contagem não é atendida". Regra escrita em `apps/web/lib/assistente/compor.ts`, sobre o índice do degrau 1, sem rede além dele; 23 testes novos. **Diário oficial D1** (coletor SIGPub — mecanismo de busca confirmado) deixou de esperar em 22/08, com o corte de LGPD decidido. Depois: indexação do ComunicaBR por município no índice (item 6), que espera o banco local.

| # | Tarefa | Estado | Por quê / bloqueio |
|---|---|---|---|
| 1 | Degrau 2 do assistente | ✅ | entregue em 16/08: comparar/lacuna/não-atendida; 23 testes novos (681 vitest + 137 globo verdes); sem modelo, sem rede além do índice |
| 2 | Protocolo da LAI do INCRA no Fala.BR | ⛔ | prazo real **2026-08-28** (`prorrogacao_concedida: true`); a única tarefa que fica **impossível** se atrasar. **O dono cuida do número** (decisão 11 de 22/08) — só o campo `protocolo` de `docs/LAI-PROTOCOLOS.json` |
| 3 | Carregar as 8.940 normas federais | ✅ | **feito em 26/08** no Postgres local: 8.570 normas do MMA + 370 do CNDH carregadas; classificação de temas executada (`python -m etl.apis.classificar_temas_ambientais`) — 4.690/15.318 normas com tema atribuído. O site só reflete no próximo build. |
| 4 | Clima e risco: aplicar migration `0074` e carregar o coletado | ✅ | **feito em 26/08** no Postgres local: migration `0074_adaptabrasil_risco_climatico.sql` aplicada e `etl.apis.adaptabrasil_risco` sincronizou 6.824 índices (8 indicadores × 853 municípios de MG). INMET continua só leitura (`--sondar`) — tabela de avisos ainda não existe. |
| 5 | Migration `0071` na Neon | ⛔ | até 01/09; sem ela os 6 ETLs do GitHub reintroduzem convênio duplicado |
| 6 | ComunicaBR: indexação por município no índice estático | ✅ | **feito em 26/08**: `scripts/gerar-indice-busca.mts` agora inclui um documento por município de MG a partir de `public/data/comunicabr-31.json`; só entram municípios com pelo menos 1 item com valor (ressalva da fonte preservada). São 853 municípios no arquivo, 5 cidades ativas do portal indexadas. |
| 7 | **Arquivo de fontes em R2 (espelho)** | ✅ | **concluído em 30/08/2026**: 261 arquivos de fonte enviados para o bucket `controlepopular-fontes` (R2), 0 pendentes. 138 registros `sha256='sem-conteudo'` permanecem locais (sem PDF). | — |
| 8 | 13 quilombolas + 103 barragens sem mancha | 🟡 | lacuna de dado; cobertura ainda é o maior risco de conclusão errada (a primeira lacuna desse tipo mudou um alerta de zero para seis) |
| 9 | Trava de dado pessoal que varre o DADO | ✅ | entregue em 16/08: `scripts/checar-dado-pessoal-em-dado.py` (CPF mod-11 sobre valores de JSON de acervo) no pre-push e na CI + teste gêmeo vitest; segue a amostragem dos 200 documentos do acervo (plano Brumadinho §3) quando o dump existir |
| 10 | Rouanet: junção incentivador × fornecedor + tela | 🟡 | 2.261 CNPJs (de 20.785 incentivadores) × `contratos.fornecedor_cnpj`; quantos casam só se sabe com banco; tela com ressalva colada ao número |
| 11 | Coletor de notícias diário | ✅ | **concluído em 30/08**: coleta completa do diário oficial (D1) — 16.601 artigos de jan/2020 a jul/2026, 80 meses × 2 entidades, 0 falhas. Commit `1e93eeb`. |
| 12 | Três ATIs como fonte do radar | ✅ | entregue em 16/08: feeds AEDAS/ADAI/Guaicuy no coletor + regra "Nota de pesar" na triagem, com teste (35 testes verdes) |
| 13 | Resumir contratos/PLs/convênios truncados | 🟡 | escopo não definido: quantos, quais listagens |
| 14 | URN / normas.leg.br | 🟡 | lib no ar; verificação em build e resolvedor estadual abertos; caminho: dataset LexML, depois URN das 15.318 normas |
| 15 | Incentivo ao esporte | ⛔ | `DADOS_GOV_BR_API_TOKEN` é JWT expirado — renovar em `etl/betim/.env` e o item destrava inteiro |
| 16 | Conecta gov.br (CNPJ/CEP) | ⛔ | decisão do dono: credenciamento de PJ de direito privado ou não |
| 17 | AJRI fase 2 (espelho dos 467 PDFs) e fase 3 (resumo) | ⛔ | **espelho público decidido em 22/08** (decisão 7) e destino é o R2, nunca o repositório — o `download_cover` carimba nome e CPF do pesquisador em cada PDF, e a trava mod-11 barra isso no git. Segue bloqueado por `AJRI_COOKIE`; ordem obrigatória: baixar → extrair → varrer dado pessoal → resumir; medir 10 PDFs antes de projetar. **O resumo por modelo continua em aberto** — decidir com os 10 medidos |
| 18 | Diário oficial (D0–D5) | 🟢 | **destravado em 22/08** (decisão 1). D1 SIGPub com mecanismo confirmado, migration 0077 + classificador + **coleta completa 16.601 atos (jan/2020 → jul/2026, 80 meses, 0 falhas)** implementados e mesclados em 30/08 (`1e93eeb`). Itinga e Araçuaí com fontes. |
| 19 | Pró-Brumadinho: outras duas páginas | 🟡 | obrigações da Vale (R$ 11,48 bi × R$ 16,38 bi) e 99 publicações; validar conteúdo (302 de período eleitoral), não status |
| 20 | ETL antigo da FGV | ✅ | **decidido em 22/08: continua vivo e alinhado** (UA honesto + pausa de 1,5 s desde 17/08), não se aposenta. Arquivos `etl/betim/etl/apis/{__init__,fgv_paraopeba}.py` presentes e `etl-betim.yml:359` consistente — verificado em 26/08 |
| 21 | Ordenar e filtrar as listas de dados | ✅ | entregue em 17/08: `lib/tabela/ordenar.ts` (comparador texto/número/data, 14 testes) colado em `TabelaEstatica.tsx` — clique no cabeçalho (asc/desc/original), `aria-sort`, estado na URL (`?ordem=chave:asc`). As 11 listas herdam; lista com `formatar` só ordena declarando `ordernavel: true` |
| 22 | Monitoramento da Vale — página dedicada | 🟡 | pedido do dono (16/08): documentos, prestação de contas, relatórios, notícias, onde investiu, benefícios fiscais recebidos, onde presta contas, pra quem vendeu — uma frente nova, camadas detalhadas no TODO-PROXIMAS-RODADAS.md (item 11) |
| 23 | Geocodificar os dados da Vale | 🟡 | pedido do dono (16/08): escrever o plano de georreferenciar o que o item 22 levantar, reutilizando a infra de mapa/geometria existente (TODO-PROXIMAS-RODADAS.md item 12); executar quando houver dado |
| 24 | Chatbot IA sobre o acervo | 🟢 | **as 3 decisões saíram em 22/08** (decisões 2–4): cérebro Maritaca/Sabiá (DeepSeek como alternativa), acervo = tudo que o determinístico não cobre, ressalva de IA sempre visível com citação. ⚠️ **Peça nova, medida em 22/08: nenhuma das duas tem endpoint de embeddings** — decidir o vetorizador (recomendado: bge-m3 ou e5-large local no home-pc) antes de codar. Plano em `docs/planos/PLANO-CHATBOT-IA.md` |
| 25 | Cabeçalho enxuto em Terras e Paraopeba | ✅ | **entregue em 22/08** (decisão 5): Paraopeba tem `app/paraopeba/layout.tsx` e Terras tem `app/funcaosocialterra/Cabecalho.tsx` importado nas páginas |
| 26 | Linha de orientação na home | ✅ | **entregue em 22/08** (decisão 8): linha "Procurando sua cidade? O primeiro card abaixo é o seu." em `app/page.tsx` |
| 27 | Licença da fonte *Icones do Brasil* | ⛔ | **decisão do dono, ainda em aberto** — e já está no repositório: 22 ícones mapeados em `BrasilIcon.tsx`. Licença **não verificada** (fonttoolbox "Unknown", fonts2u "Personal use"); uso público pede autorização do autor ou troca de fonte. *Brasil Icons* (a outra) é donationware e está resolvida com crédito |
| 28 | Fundir `ARQUITETURA.md` × `MAPA-APLICACAO.md` | ⛔ | **decisão do dono, ainda em aberto**: os dois abrem descrevendo stack e deploy, e o MAPA ainda se intitula "Leilões.app / controle-popular". Recomendado: sobrevive `ARQUITETURA.md` (é o que `AGENTS.md` manda ler), absorvendo o que o MAPA tem de único — quem sumir quebra os links de `docs/LEIA-PRIMEIRO.md:27`. Conferir na fusão uma terceira divergência: `AGENTS.md` diz `output: export`, ARQUITETURA e MAPA dizem que **não** é export, é OpenNext |
| 29 | Espelhar o código no Gitee | 🟡 | **decidido em 22/08** (decisão 13), sem data. É **espelho**: a CI não se muda — os 6 ETLs, `dado-pessoal.yml` e `prazos-lai.yml` são GitHub Actions e reescrevê-los seria o custo real da migração. Medido em 22/08: o repositório é público no GitHub, então não há segredo a reavaliar antes de espelhar. **A confirmar antes de abrir conta:** o Gitee exige verificação de identidade e submete repositório novo a revisão antes de ficar público — regra de plataforma, não deste projeto, e não foi medida aqui |
| 30 | Publicar o portal após o bloqueio do Worker Free (erro 10027) | ✅ | **resolvido em 26/08 via Cloudflare Tunnel + `next start` no home-pc**. O Worker continua deployado sem custom domains; `controlepopular.com.br` e `www` apontam para o túnel. Pendências operacionais: dono remover custom domains do Worker e criar `CLOUDFLARE_D1_API_TOKEN` para escrita D1 via REST fallback (sem isso, `/api/pageview` e writes similares falham). Ver [PLANO-CLOUDFLARE-TUNNEL.md](../planos/PLANO-CLOUDFLARE-TUNNEL.md) |
| 31 | Canário Telegram com interação automática | ✅ | entregue em 25/08: `scripts/gatilho-remoto.mts` rodando como ouvinte permanente no `home-pc` (Telegram long-poll + HTTP só no tailnet), respondendo `/status` e `/sincronizar` (fail-closed com árvore suja); novos `scripts/avisar-telegram.mts` (enviar status do deploy) e `scripts/ler-updates-telegram.mts` (ler respostas do dono). Credenciais em `scripts/.env`, nunca versionadas |

## Bloqueios

| Bloqueio | Até | O que desbloqueia |
|---|---|---|
| Neon em HTTP 402 | 01/09 | pagar/vencer o prazo — sem banco não há `next build` nesta máquina. No modo túnel, o build continua no home-pc; a máquina de dev não builda |
| **Worker Free 3 MiB gzip (erro 10027)** | ✅ resolvido em 26/08 | publicação migrou para **Cloudflare Tunnel + `next start` no home-pc**. O Worker continua deployado, mas sem custom domains; o domínio aponta para o túnel. Ver fila #30 e [PLANO-CLOUDFLARE-TUNNEL.md](../planos/PLANO-CLOUDFLARE-TUNNEL.md) |
| Build e publicação só no `home-pc` | — | no modo túnel, `next start` no home-pc é o servidor de produção; build e deploy do Worker são opcionais/fallback |
| **Coleta diário oficial D1** | ✅ resolvido em 30/08 | 16.601 atos de jan/2020 a jul/2026 coletados via SIGPub; módulo migrado de `curl.exe` (quebrado na máquina) para `requests` |
| **Upload R2 de fontes** | ✅ resolvido em 30/08 | 261 arquivos de fonte enviados ao bucket `controlepopular-fontes`; 0 pendentes |
| Remoção de custom domains do Worker | ✅ resolvido em 26/08 | custom domains removidos do dashboard; DNS aponta para o túnel `controle-popular` |
| Rede bloqueada na máquina de dev (WinError 10013) | — | navegador do dono para sondagens (foi assim que as duas correções do ComunicaBR saíram) |
| LAI INCRA — login humano | **2026-08-28** (prorrogação concedida) | acessar o Fala.BR, localizar o pedido e anotar o protocolo em `docs/LAI-PROTOCOLOS.json` — o dono cuida disso |
| Índice estático pendente de Postgres local | — | banco local com as cargas novas (Rouanet, ComunicaBR por município, repasse) — quem mede índice precisa do banco |
| GitBook com convite pendente | — | dono aceitar o convite para espelhar `docs/` |
| **`AI_API_KEY` pendente e NUNCA vai para o repo** | — | chave do provedor de IA (Maritaca/DeepSeek, decisão nº 2 acima) fica só em `.env.local` no `home-pc`; o repo segue com `.env.example` documentando o nome da variável. Quem implementar o degrau 3 do assistente lê de variável de ambiente, nunca commita credencial (regra do AGENTS.md) |

## Dívida técnica registrada

As **duas compactações** (`apps/web/lib/comunicabr/arquivo.ts` × `apps/web/lib/estatico/compactar.ts`) **não são a mesma coisa**: uma é codec de estrutura aninhada com esqueleto nacional compartilhado (é o que faz 99 MiB caberem em 2,16 MB nos 853 municípios); a outra é genérica para tabela plana (Rouanet, 7,9 MB → 2,4 MB). **Decisão documentada: não unificar** — aplainar o ComunicaBR perde o ganho de ordem de grandeza, e enxertar aninhamento no genérico é complexidade para um único consumidor. Remeça antes de reabrir.

**Auditoria de assets (2026-08-23, code-review-geral):** `public/` inteiro pesa **52,3 MB**, maior asset individual é `sigmine-interesse.geojson.gz` com **6,06 MB** — nada acima do aviso de 20 MiB, muito menos do teto de 25. As camadas cruas seguintes (`sigmine-operacao` 5,67, `vazio-cadastral-vales` 4,53, `unidades-conservacao` 3,13, `lotes-vagos-bh` 2,97) ficam **abaixo do limiar de ~8 MiB crus** que governa o uso de `comprimida: true` no registry do globo — decisão mantida: não comprimir abaixo dele. Os dois grandes JSONs fora das camadas (`risco-climatico` 2,78 MB, `comunicabr-31` 2,16 MB) já estão minificados.

## Entregas de 30/08/2026

- **Diário oficial D1 — coleta completa**: 16.601 atos de jan/2020 a jul/2026 (80 meses × 2 entidades: Diamantina e Itinga), 0 falhas. Módulo `etl/betim/etl/camaras/sigpub.py` migrado de `curl.exe` (quebrado na máquina) para `requests.Session`. Commit `1e93eeb`.
- **Upload R2 de fontes concluído**: 261 arquivos de fonte enviados ao bucket `controlepopular-fontes`; 0 pendentes. 138 registros `sha256='sem-conteudo'` permanecem locais (sem PDF).
- **Revisão de copy do portal**: 30 páginas principais verificadas — todas leem números do banco/bundle ao vivo (sem números hardcoded); 5 novas páginas de índice por frente criadas (`/ambiental/indice`, `/congresso/indice`, `/judiciario/indice`, `/paraopeba/indice`, `/funcaosocialterra/indice`). Todas as 22 rotas principais 200 OK após rebuild (`next build --webpack`). Commit `f6da72c`.
- **Comandos `/code` e `/andamento` no Telegram**: status ao vivo (contagens de atos_diario, R2, backfill).

## Rito de trabalho

Quem quer trabalhar entra por **PRODUTO.md** (a porta) e lê **DESENVOLVIMENTO.md** antes do primeiro commit; **FONTES.md**, **ARQUITETURA.md**, **OPERACAO.md** e **EDICAO.md** cobrem fonte, tetos, operação e edição conforme a tarefa. Dúvida entre dois caminhos: o registro de decisão e a medição vêm antes da escolha.

## Origem

Este documento absorve a fila viva e o estado de 16/08, atualizado com entregas de 30/08/2026. Arquivos-fonte e classificação:

- `PLANO-2026-08-15.md` — **ENTREGUE** (executado até o fim; a fila viva dele é este documento)
- `HANDOFF-2026-08-15-NOITE.md` — **ENTREGUE** (entrega documentada; pendências e decisões migradas para as seções acima)
- `PLANO-DIREITOS-EM-MOVIMENTO.md` — **ENTREGUE** (quatro portas no ar: home, ajuda, informação e denúncia)
- `PLANO-ACAO-CIDADA.md` — **ENTREGUE** (facilitador de denúncia em produção, fases 1–3)
- `TODO-PROXIMAS-RODADAS.md` — **ATIVO** (dívidas que não couberam inteiras aqui: análise do commit CAR/INCRA, revisão de completude de páginas, ETL FGV)
- `diario-oficial-plano.md` — **ENTREGUE** (fases D0–D5 concluídas: coleta completa 16.601 atos em 30/08/2026, commit `1e93eeb`)
- `PLANO-BASES-CLIMA-E-RISCO.md` — **ATIVO** (fatia 1 entregue; BATER, CEMADEN, INPE, SNIS e MapBiomas pendentes)
- `PLANO-ESPELHO-PDF-AJRI.md` — **ATIVO** (fase 1 entregue; fases 2–3 por fazer, bloqueadas por `AJRI_COOKIE`)

Classificação dos 13 planos, feita em 22/08 junto com as decisões acima:

| Plano | Classificação |
|---|---|
| `PLANO-EXPANSAO-ACORDOS-MG.md` | **ATIVO** — Blocos 0, A e a maior parte do B entregues (PR #2, 22/08); B7 morto com medição; B4 no Bloco C (Neon); Bloco D respondido hoje |
| `PLANO-TRANSPARENCIA-JUSTICA.md` | **ATIVO** — sondagem fechada em 22/08; as 3 frentes estão sendo executadas em sessão paralela |
| `PLANO-CHATBOT-IA.md` | **ATIVO** — decisões 2–4 tomadas; falta o vetorizador (item 24) |
| `PLANO-INDICE-ESTATICO-E-ASSISTENTE.md` | **PARCIAL** — Parte 1 e degraus 0–2 entregues (16/08); o degrau 3 é o mesmo trabalho do chatbot, não um segundo |
| `REVISAO-UX-E-ONBOARDING.md` | **QUASE FECHADO** — consertos feitos em 14/08; sobraram os itens 25 e 26, agora decididos, e o skip-link em Terras/Paraopeba/`/busca`/`/sobre`/Direitos em Movimento |
| `CLASSIFICACAO-COMPLETUDE.md` | **PARCIAL** — 4 críticos corrigidos em 17/08; falta a auditoria dos 25.729 links (01/09) |
| `PLANO-GEOCODIFICACAO.md` | **ESPERANDO DADO** — plano escrito em 17/08; executa quando o monitoramento da Vale (item 22) tiver coleta |
| `ROTEIRO-NEON-01-09.md` | **RUNBOOK** — executa em 01/09. ⚠️ O cabeçalho está escrito no passado ("a Neon voltou… em 01/09") e ainda não rodou; corrigir o tempo verbal antes que alguém leia como feito |
| `deploy-github-pages.md` | **CONTINGÊNCIA, não fila** — o Cloudflare já serve o portal e o repositório é público (medido em 22/08); nada a executar (decisão 9) |
