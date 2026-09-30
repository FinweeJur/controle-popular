# ESTADO — o portal hoje, o que vem a seguir

> **Tipo:** ESTADO
> **Domínio:** global
> **Última medição:** 2026-09-30
> **Leitura estimada:** media (5-15 min)
> **Relacionados:** [PRODUTO.md](../01-produto/PRODUTO.md), [OPERACAO.md](../05-operacao/OPERACAO.md), [AGENTS.md](/AGENTS.md), [ARQUITETURA.md](../04-arquitetura/ARQUITETURA.md), [HANDOFF-22-09-COLETA-GUARA.md](../historico/entregas/HANDOFF-22-09-COLETA-GUARA.md)
> **Palavras-chave:** estado, fila, bloqueios, divida, decisões, guara, neon, tunnel, deploy, tts, shield, postgres, etl, coleta

## Sumário

- [Propósito](#propósito)
- [No ar agora](#no-ar-agora)
- [Decisões do dono](#decisões-do-dono)
- [Fila viva](#fila-viva)
- [Bloqueios](#bloqueios)
- [Dívida técnica registrada](#dívida-técnica-registrada)
- [Entregas recentes](#entregas-recentes)
- [Rito de trabalho](#rito-de-trabalho)
- [Origem](#origem)

## Propósito

Estado medido do portal. A porta de entrada é o [PRODUTO.md](../01-produto/PRODUTO.md).
Detalhe e medição antiga ficam em [`historico/`](../historico/).
Aqui vai ponteiro, não cópia. Mudou algo? Atualize aqui no mesmo commit.

## No ar agora

**Publicação (desde 19/09):** o site principal é servido pela **Guara Cloud**.
Guara é a PaaS (plataforma que hospeda seu código) brasileira que roda
o portal em container Docker, datacenter em São Paulo.
Endereço em produção: `www.controlepopular.com.br`.
Ciclo: push na `main` → CI testa → deploy automático. Manual: `guara deploy`.

| Papel | Modo | Estado |
|---|---|---|
| **principal** | `www.controlepopular.com.br` → Guara Cloud | ✅ 19/09 |
| servidor 2 | Cloudflare Tunnel do `home-pc` com `next start -p 3000` | ✅ de pé, monitorado |
| fallback técnico | Worker Cloudflare (OpenNext), sem custom domains | ✅ deployado |
| raiz `controlepopular.com.br` | redirect 301 no Cloudflare → www | ⛔ pendente do dono |

**Domínio:** o Guara devolve `APEX_DOMAIN_NOT_SUPPORTED` na raiz (medido 19/09).
A raiz nunca mora no Guara.

**Novos Hubs e Módulos Ativos (29/09):**
- `/internacional`: Hub multilateral (ONU/PNUD, UNESCO, OMS, OMC, commodities e povos originários) com modo trilíngue e 6 Qualidades.
- `/eua`: Transparência dos EUA (SEC EDGAR, barragens NID/USACE, compras USAspending.gov e BIA).
- `/canada`: Mineradoras na TSX operando no Brasil, emissões ECCC NPRI, caso Mount Polley vs Mariana e ouvidoria CORE.
- `/assembleias`: Hub e detalhe das 27 assembleias legislativas estaduais brasileiras.
- `/mineracao/cavas`: Série histórica de cavas de mineração em MG com modelo VLM calibrado no holdout de 88 negativos.
- `/laboratorio`: Caderno NotebookLM cívico offline (citações `[n]`, resumos) e widgets de Generative UI.
- Assistente Seu Nonô: escada determinística para 100 páginas, tolerância a digitação, grafo de conhecimento e leitura por voz (TTS).
- Infraestrutura Cívica: Vigia ETL de 397 bases, motor de fact-checking e espelho do código no GitLab e Hugging Face.

**Banco — Fase 4 concluída (confirmada pelo dono em 29/09):** a aplicação
aponta para o **Postgres do Guara** (`cp-postgres-597bd0`, Postgres 17),
com `DATABASE_URL` **runtime e build = Yes** e carga validada igual à da
Neon, menos as 2 tabelas `embeddings`. A Neon continua na conta em 94%
(470/500 MB) **sem uso** — sobra decidir o desligamento, que é do dono.

**Coleta 22/09 (Guara) — fechada 22/09 21:30:** `copam_reunioes`=479,
`convenios_federais`=167, `contratos`=11.471, `licitacoes`=4.869,
`ambiental_licenciamento`=8.612, `atos_oficiais`=10.344. Contagem e
retomada em [HANDOFF-22-09-COLETA-GUARA.md](../historico/entregas/HANDOFF-22-09-COLETA-GUARA.md).

**Alerta:** página que lê do banco no build congela HTML sem a variável de
build. Restart não resolve; resolve `guara deploy` de imagem nova.
Medido em 19/09 (deploys `de291a9b` e `5a4a08cc`). `/betim/emendas` com
"Em breve" é o mesmo efeito: `configured=false` no build antigo.

## Decisões do dono

Decisões de 22/08, numa sessão única. **Não reabrir sem remensurar.**

| # | Decisão | Estado |
|---|---|---|
| 1 | Diário oficial: nomeação e exoneração publicadas; CPF de pessoa física continua cortado | ✅ coleta completa (16.601 atos) |
| 2 | Cérebro do chatbot: Maritaca/Sabiá (BR), com DeepSeek como alternativa | na Fase 5 do chatbot |
| 3 | Acervo do chatbot: tudo que o determinístico não cobre | parte do plano |
| 4 | Ressalva de IA sempre visível, com citação da fonte | ✅ implementado |
| 5 | Terras e Paraopeba com cabeçalho enxuto | ✅ entregue |
| 6 | DataJud fica em consulta ao vivo, sem coleta | decisão mantida |
| 7 | Espelho dos 467 PDFs da AJRI é público, destino R2 | fase 2, bloqueada por cookie |
| 8 | Home com linha de orientação sobre a grade das cidades | ✅ entregue (22/08) |
| 9 | GitHub Pages fora da fila | ✅ decisão mantida |
| 10 | Diário de Itinga: `www.itinga.mg.gov.br/diario` | ✅ corrigido |
| 11 | Protocolo da LAI do INCRA: o dono cuida | ⛔ pendente |
| 12 | ETL antigo da FGV continua vivo e alinhado | ✅ decisão mantida |
| 13 | Espelho do código fora do GitHub | ✅ GitLab no lugar do Gitee (29/09) |
| 14 | Backfill do diário oficial desde jan/2020 | ✅ concluído (30/08) |
| 15 | Estrutura investigativa do diário: 7 eixos | registrado, sem implementação |

## Fila viva

Organizada por custo e benefício. Esforço pequeno primeiro.

### Bloco A — fazer agora

| # | Tarefa | Estado | Nota |
|---|---|---|---|
| A0 | **Fim das coletas Betim no Guara antes de deploy** (ordem do dono 22/09) | ✅ | fechadas 22/09 21:30; contagem em [HANDOFF](../historico/entregas/HANDOFF-22-09-COLETA-GUARA.md) |
| A1 | Validar banco no site: `/ambiental/licenciamento`, `/betim/emendas`, `/ambiental/copam` | 🚧 | `guara deploy` **só depois de A0** (liberado); env de build já Yes |
| A2 | Redirect 301 no Cloudflare: raiz → www | ⛔ | ação do dono, 2 minutos |
| A3 | Corrigir vulnerabilidades do container (Guara Shield) | 🚧 | ver nota abaixo |
| A4 | **Fase 4: migrar app Neon → Postgres do Guara** | ✅ | app no Guara desde 29/09; sobra desligar a conta Neon |

**Nota A3:** scan `guara services vulnerabilities` (19/09) achou 3 CRITICAL,
28 HIGH, 22 MEDIUM. Os críticos: `next` 16.2.12 (fix em 16.3.x) e `tar`
6.2.1 (fix em 7.5.x). `npm audit fix` aplicado; sobem os transitivos.
`guara security findings` está com bug no CLI — use `services vulnerabilities`.

**Nota A4:** o Postgres do Guara tem 1 GiB incluso (2 GiB máximo), snapshot
diário e endpoint privado (a rede particular da Guara, mais rápida e mais
fechada que a internet). O catálogo **não tem variante pgvector** (medido
30/09/2026): a extensão `vector` não existe no banco. PostGIS está
disponível (consultas de mapa no servidor). O RAG do assistente roda em
memória e não depende de pgvector — ver
[PLANO-RAG-COMPLETO.md](../planos/PLANO-RAG-COMPLETO.md). Migração:
`pg_dump` da Neon, carga no Guara, troca de `DATABASE_URL`, `guara deploy`.

### Bloco B — destravadas, aguardando ordem

| # | Tarefa | Estado | Nota |
|---|---|---|---|
| B1 | Voz própria do TTS: CosyVoice 3 (Alibaba, Apache 2.0) no servidor | ⛔ | protótipo barato hoje: Edge TTS; spike: Piper/Vozz no browser |
| B2 | Cidades novas do `CIDADES_DO_BUILD`: revisar testes do assistente junto | ✅ | feitos no 19/09; repetir o ritto a cada adição |
| B3 | Confirmar deploy pós `-b` renderizou as páginas com dado | 🚧 | depende de A1 |
| B4 | Globo 3D: rastreamento de cavas de mineração (detectar atividade sem cadastro ANM) | 🚧 | Fases 0, 1, 3 e 5 publicadas em 29/09: duas camadas no globo, página `/mineracao/cavas`, deep-link `?camada=` e contexto no chatbot. Sentinel ainda ⛔ (ver FONTES.md); Fases 2 e 4 na fila: [PLANO-GLOBO-CAVAS-MINERACAO.md](../planos/PLANO-GLOBO-CAVAS-MINERACAO.md) |
| B5 | Expansão PNCP: coleta da fila (89 cidades) e delegação das 30 grandes ao Gemini | 🚧 | medido 25/09 11:26 — 47 completas; ver [HANDOFF-24-09](../HANDOFF-24-09-FECHAMENTO-PNCP.md) |
| B6 | Remuneração de servidores + QSA de empresas (novas APIs, 1–2 semanas) | ⛔ | aguarda ordem; fontes no [PLANO-FILA arquivado §8](../historico/planos/PLANO-FILA-PROXIMA-SESSAO.md) |

### Bloco C — ação externa do dono

| # | Tarefa | Nota |
|---|---|---|
| C1 | Redirect da raiz no Cloudflare (A2) | dashboard do Cloudflare |
| C2 | Anotar protocolo da LAI no `docs/LAI-PROTOCOLOS.json` | CI vigia o prazo sozinha |
| C3 | Informar `AJRI_COOKIE` (fases 2 e 3 do PDFs da AJRI) | valor expira |
| C4 | ~~Abrir conta no Gitee e espelhar o código~~ | ✅ feito no GitLab (29/09), `OPERACAO.md` § 2 |
| C5 | Aceitar convite do GitBook | espelho de docs |

### Bloco D — destrava com a Fase 4

- Fase 5 do chatbot (persistência do índice): ⛔ cancelada (decisão do dono,
  30/09) — o Guara não tem pgvector e o Qdrant não cabe no plano. O RAG roda
  em memória (397 pedaços) e basta — ver
  [PLANO-RAG-COMPLETO.md](../planos/PLANO-RAG-COMPLETO.md).
- Coleta nova volta ao Postger (hoje vai para D1 por causa do storage).
- Índice de busca pode voltar a crescer sem estourar o teto da Neon.

Runbooks: [`planos/`](../planos/).

## Bloqueios

| Bloqueio | Quem desbloqueia |
|---|---|
| Neon em 94% storage | ✅ app já no Guara (29/09) — sobra cancelar a conta Neon |
| HTML pré-renderizado sem dado no build | deploy novo com env de build (A1) |
| Raiz do domínio com 403 | redirect rule no Cloudflare (A2) |
| `guara security findings` quebrado | usar `guara services vulnerabilities` |
| PDFs da AJRI parados | `AJRI_COOKIE` (dono) |
| `AI_API_KEY` nunca vai para o repo | fica em `.env.local`, fora do Git |

## Dívida técnica registrada

- **Duas compactações não se unificam** (decisão de 16/08, medida):
  `lib/comunicabr/arquivo.ts` (aninhado, 99 MiB → 2,16 MB) e
  `lib/estatico/compactar.ts` (tabela plana, 7,9 MB → 2,4 MB).
- **`apps/web/public/` pesa 52,3 MB.** Nada acima do aviso de 20 MiB;
  o maior é `sigmine-interesse.geojson.gz` (6,06 MB).
- **Auditoria dos 25.729 links** pendente
  ([CLASSIFICACAO-COMPLETUDE.md](../planos/CLASSIFICACAO-COMPLETUDE.md)).

## Entregas recentes

**30/09/2026 — RAG completo do Seu Nonô (cobertura das bases):**

- O acervo do RAG ganhou a camada **município** da memória (F3) e um
  inventário medido de **todas as bases versionadas** (274 arquivos,
  233,7 MB, 22 temas), mais o catálogo curado de bases com fonte oficial.
- `scripts/inventariar-bases-dados.mts` (novo) gera
  `data/bases-portal.json`; `acervo.ts` ganhou `deBases()` e
  `deBasesPortal()`.
- Correção de rota: o RAG é **em memória**, no alvo **Guara**; **não** usa
  pgvector/Neon. Plano corrigido em
  [PLANO-RAG-COMPLETO.md](../planos/PLANO-RAG-COMPLETO.md).
- **R4:** golden set em `lib/assistente/golden-set.ts` (22 casos) e correção
  da abstenção no modo lexical (peso IDF + palavras de pergunta nas
  stopwords + piso 0,45). Sem isso, "receita de bolo" casava orçamento.
- **R5:** cancelado (decisão do dono, 30/09) — o Guara não tem pgvector e o
  Qdrant não cabe no plano (`TIER_LIMIT_EXCEEDED`, 402). O índice em memória
  é o desenho final.
- Verificação: suíte verde, `tsc --noEmit` limpo. Sem build nem deploy.

**30/09/2026** — F3 da memória: a camada município, com fonte local fechada.

- `apps/web/lib/memoria/municipios.ts`: **9 verbetes municipais** com fonte
  conferida na coleta — Betim (caminhada pelo Rio Paraopeba, Brasil de Fato,
  2022), Ipatinga (Massacre de Ipatinga, 1963, Arquivo Nacional), Araçuaí
  (Quilombo Baú, Comissão Pró-Índio/Palmares), Brumadinho (Memorial
  Brumadinho, 2019), Diamantina (Parque do Biribiri público), Itinga
  (resistência à mineração de lítio), Governador Valadares (atingidos do Rio
  Doce), Felisburgo (Massacre de Felisburgo, 2003) e Mariana (barragem de
  Fundão, 2015).
- `CAMADAS_MEMORIA.municipio` deixa de ser vazio; `UF_POR_MUNICIPIO` cresce
  com os códigos IBGE das cidades com verbete.
- Lacuna declarada para as demais cidades: sem fonte local fechada, o
  cartão desce para o estado, a região ou o país — nunca marco inventado.
- Verificação: 1.949 testes vitest + 168 do globo verdes; `tsc --noEmit`
  limpo.

**29/09/2026 (noite)** — Planos 2 a 5, com dados reais:

- **Plano 3 — Autorizações territoriais (TAUS/CDRU e afins):** base fabricada
  removida e trocada por **553 imóveis reais da União em MG** (SPU,
  Transparência Ativa). Rota `/ambiental/autorizacoes` reescrita; gerador
  `scripts/etl/territorio/gerar-destinacoes-uniao-mg.py`.
- **Plano 4 — PPP:** base fabricada removida e trocada por **20 contratos reais
  do Estado de MG** (Portal da Transparência MG / CKAN), separados em
  `instrumento_concessao`, `supervisao_verificacao` e `estruturacao_estudos`.
  Rota `/ambiental/ppp` criada (antes quebrada); gerador
  `scripts/etl/concessoes/gerar-ppp-mg.py`.
- **Plano 2 — Cidades de MG:** `/cidades/mg` com os 853 municípios do IBGE e os
  10 polos com **população exata do Censo 2022** (IBGE, agregado 4714), não
  mais estimativa digitada à mão.
- **Plano 5 — Fiscalização de dados:** `bots/fiscaliza-bases.mts` varre as bases
  JSON (399 arquivos, 173.119 registros), acusa CPF por mod-11, IBGE inválido,
  duplicata, URL de fonte ausente e lacuna; `--self-test` com 11 casos.
- **Verificação:** 1.872 testes vitest + 168 do globo verdes; `tsc --noEmit`
  limpo; 0 crítico na varredura de CPF. Incidente das bases fabricadas
  registrado em [FONTES.md § fontes dos Planos 2 a 4](../06-fontes/FONTES.md).

**25/09/2026** — coleta PNCP (madrugada e manhã, desktop):

- 16 cidades fechadas: AM (Manacapuru, Parintins, Tefé), PA (Abaetetuba,
  Altamira, Ananindeua, Cametã, Castanhal, Itaituba, Marabá, Paragominas,
  Redenção, Santarém, Tucuruí), AP (Santana), TO (Gurupi) —
  **47 completas, 89 na fila** (medido 25/09 11:26). Checkpoints
  402 contratos / 4.281 licitações, 1 parcial.
- Imperatriz/MA morreu no timeout (74/78 chaves) e passava como
  completa; modalidade 2026-9 marcada `parcial` no checkpoint local
  para refazer e cobrir 2026-10..13. Ananindeua teve o mesmo problema
  de madrugada (chaves removidas). Lock órfão `.fila-pncp.lock`
  removido e gitignorado.

**29/09/2026** — consolidado dos últimos 50 commits (`b69e2e68` → `b8bcb7e3`):

- **Segurança Cívica & Infraestrutura (`b8bcb7e3`):**
  - Implementado `vigia-dados-etl.mts` monitorando 397 bases e coletores.
  - Criado motor de fact-checking cívico padrão IFCN/Lupa (`bot-fact-checker-pr.mts`).
  - Blindagem estrita contra injeção de prompt direta e indireta no assistente.
  - Auditor de supply chain bloqueando serializações inseguras e formatos binários.
  - Espelho automatizado do repositório no GitLab (`ce7d2380`) e Hugging Face (`e49e616e`).
- **Expansão Multilateral & Internacional (`89b7bc7f`, `ef7e6d79`, `b5a9906e`):**
  - Hub multilateral `/internacional` com dados de ONU/PNUD (IDH, Gini, GII),
    UNESCO (educação), OMS (saúde), OMC/Comtrade (minérios) e terras indígenas.
  - Hubs temáticos `/eua` (SEC EDGAR, barragens NID/USACE, USAspending, BIA) e
    `/canada` (mineradoras TSX, emissões NPRI, caso Mount Polley vs Mariana, CORE).
  - Tradução dinâmica completa PT/EN/ES em botões, abas, tabelas e CSV.
  - Bot coletor autônomo (`bot-coletor-autonomo.mts`) com R2/S3 e avisos Telegram.
- **Laboratório de Dados, NotebookLM & Generative UI (`11d1ccf1`):**
  - Caderno aberto NotebookLM offline com citações em colchetes `[n]` e dossiês.
  - Três widgets Generative UI: Onboarding Cívico, Rastreabilidade Transnacional
    e Painel de Debug do Seu Nonô.
- **Assistente Seu Nonô & Grafo de Conhecimento (`97de5905`, `774245a3`, `ea39d4d9`, `81a019e4`):**
  - Escada determinística expandida para 100 páginas, blog e central de transparência.
  - Grafo da árvore de conhecimento estilo Obsidian com links de navegação cívica.
  - Tolerância fonética a erros de digitação e typewriter responsivo.
- **Terras, Cavas de Mineração & Visual (`b69e2e68` → `dc87165b`):**
  - Detecção de cavas de mineração por satélite com modelo VLM holdout 88 negativos.
  - Série temporal anual de MG no globo 3D e rota dedicada `/mineracao/cavas`.
  - 8 temas oficiais com contraste medido no globo 3D e vista 2D.
  - Ponteiro Korkhon 2.0 XS e auditoria mobile com overflow corrigido em 20 rotas.
- **Assembleias Legislativas & Biblioteca Acadêmica (`d955172a`, `f4e1ba6c`):**
  - Hub e páginas individuais das 27 assembleias estaduais do Brasil.
  - 39 novos artigos acadêmicos SciELO e UFMG catalogados no acervo.
- **Verificação:** 47/47 testes da suíte internacional e laboratório verdes,
  0 erros de TypeScript e 0 dados pessoais em 473 JSONs.

**24/09/2026** — `49f8db91` · `5c440d4f` · `7c67a3a0` · `cd60b79c`:

- Litígios climáticos: teses citam processo real e linkam painel.
- Expansão PNCP: fila, manifesto (203 cidades) e cobertura commitados;
  coleta em curso na desktop — 31 completas, 105 na fila (medido 24/09).
- 30 cidades grandes delegadas ao Gemini; 25 capitais são fila de outra
  IA. Checkpoints contratatos 300 ok / licitações 2.959 ok, 0 parciais.
- Globo 3D: plano de cavas de mineração medido no disco (`cd60b79c`).
- Documentação: 4 planos/handoffs superados movidos para
  [`historico/`](../historico/) (PLANO-FILA, PLANO-SESSAO-23-09,
  HANDOFF-22-09, HANDOFF-ONDA2).

**22/09/2026** — coleta no Postgres do Guara (detalhe:
[HANDOFF-22-09-COLETA-GUARA.md](../historico/entregas/HANDOFF-22-09-COLETA-GUARA.md)):

- `convenios_federais` 167 linhas (R$ 298,6 mi, Betim); licenciamento
  8.612; `DATABASE_URL` Build=Yes confirmada no CLI.
- Scripts do proxy TCP commitados (`17304c84`): start/restart + teste de
  TTL; chave Guara removida do repositório; logs da raiz no gitignore.
- COPAM (479), contratos (11.471) e licitações (4.869) fechados às 21:30 —
  deploy do site pode ser a próxima ordem (A1).

**20/09/2026** — push `d6e739a6`–`594d6b66`:

- `/laboratorio` (F1–F7): dock flutuante, duas janelas dither, Seu Nonô
  lateral, 22 fontes no catálogo, sessão na URL, testes.
- Gráficos dither do amicro (MIT) adaptados, 6 tipos, sem dependência nova.
- `/judiciario/contatos`: HTML de 986 KB para 265 KB — estatística do
  agregado pré-computado e catálogo completo no bundle do cliente.
- `BotoesExportar` (CSV, copiar, imprimir) em 5 tabelas do portal.
- Dado órfão integrado: educação MG, ESG Vale, busca, Seu Nonô.
- `guara-shield-bot.mts`: Trivy → Telegram, dedup por histórico.
- drizzle-orm 0.45.2 (fecha HIGH de SQL injection).
- Telegram: mensagens longas via stdin — o `npx` corta argumento na
  quebra de linha; `$OutputEncoding = UTF8` antes do pipe.
- Branches: F1 unificado; worktrees `cp-blog`, `cp-exportar`, `cp-guara`,
  `cp-lab` removidos (backup dos pendentes no TEMP).

**19/09/2026** — commit `34983f01` e anteriores desta sessão:

- `DATABASE_URL` da Neon no Guara, runtime e build.
- `www.controlepopular.com.br` active no Guara (via CLI).
- Domínio da raiz não aceito no Guara → redirect no Cloudflare, pendente do dono.
- Scan Trivy: 3 CRITICAL / 28 HIGH / 22 MEDIUM (fila A3).
- TTS fala o microresumo do top-100 antes do conteúdo (`resumos-top100.ts`).
- Loader pequeno `DotsRing` no buscador e no overlay (o grande continua o Wave).
- 4 testes do assistente corrigidos (Uberlândia virou cidade atendida).

**Anteriores:** [`historico/`](../historico/).

## Rito de trabalho

1. Leia [PRODUTO.md](../01-produto/PRODUTO.md) e
   [DESENVOLVIMENTO.md](../03-desenvolvimento/DESENVOLVIMENTO.md).
2. Confira a [fila viva](#fila-viva) e os [bloqueios](#bloqueios).
3. Antes de comitar: suíte e `tsc --noEmit`.
4. Depois: rebase no `origin/main` e push do próprio trabalho.
5. Dúvida entre dois caminhos: medição antes. Anote no documento certo.

## Origem

O estado antigo (filas de 30/08, 31/08 e 08/09) saiu deste documento.
Foi consolidado na fila única acima; o detalhe mora em
[`historico/`](../historico/).
