# ESTADO — o portal hoje, o que vem a seguir

> **Tipo:** ESTADO
> **Domínio:** global
> **Última medição:** 2026-10-07
> **Leitura estimada:** media (5-15 min)
> **Relacionados:** [PRODUTO.md](../01-produto/PRODUTO.md), [OPERACAO.md](../05-operacao/OPERACAO.md), [AGENTS.md](/AGENTS.md), [ARQUITETURA.md](../04-arquitetura/ARQUITETURA.md), [HANDOFF-22-09-COLETA-GUARA.md](../historico/entregas/HANDOFF-22-09-COLETA-GUARA.md)
> **Palavras-chave:** estado, fila, bloqueios, divida, decisões, guara, azure, neon, tunnel, deploy, tts, shield, postgres, etl, coleta, dominio

## Sumário

- [Propósito](#propósito)
- [No ar agora](#no-ar-agora)
- [Decisões do dev](#decisões-do-dev)
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

**Publicação em duas casas (troca de 06/10/2026, pedido do dono).** O Guara
está com o serviço `stopped` (ciclo/cota) e só volta com `guara deploy`
quando o dono puder; enquanto isso o **Azure Container Apps** é o principal.

| Papel | Modo | Estado |
|---|---|---|
| **principal** | `www.controlepopular.com.br` → Azure Container Apps | ✅ 07/10 — CNAME com proxy + certificado gerenciado; home e `/ambiental/licenciamento` (19.704 / 145 licenças) conferidos |
| secundário | `www.controlepopular.tech` → Guara Cloud | ⛔ serviço `stopped` (`crash_loop`) até o redeploy; 404 no ar |
| banco | Postgres do Guara (`cp-postgres-597bd0`) | ✅ usado pelos dois (o Azure ganhou a env em runtime em 06/10) |
| servidor de teste | Cloudflare Tunnel do `home-pc` (`next dev`) | ✅ de pé |
| fallback técnico | Worker Cloudflare (OpenNext), sem custom domains | ✅ deployado |
| raízes `.com.br` e `.tech` | redirect 301 no Cloudflare → www | ✅ medido 07/10 |

**Como publicar:** Azure → `gh workflow run azure-mirror.yml --ref main`
(~6 min, sem gastar cota do Guara); Guara → `guara deploy` (~17 min, a cada
~5 dias). Só certificado do domínio: `azure-certificado.yml`.

**Domínio:** o Guara devolve `APEX_DOMAIN_NOT_SUPPORTED` na raiz (medido 19/09);
no Azure, o apex exigiria `A` + `TXT asuid`. Por isso as duas raízes vivem de
redirect 301 no Cloudflare.

**Novos Hubs e Módulos Ativos (29/09):**
- `/internacional`: Hub multilateral (ONU/PNUD, UNESCO, OMS, OMC, commodities e povos originários) com modo trilíngue e 6 Qualidades.
- `/eua`: Transparência dos EUA (SEC EDGAR, barragens NID/USACE, compras USAspending.gov e BIA).
- `/canada`: Mineradoras na TSX operando no Brasil, emissões ECCC NPRI, caso Mount Polley vs Mariana e ouvidoria CORE.
- `/assembleias`: Hub e detalhe das 27 assembleias legislativas estaduais brasileiras.
- `/mineracao/cavas`: Série histórica de cavas de mineração em MG com modelo VLM calibrado no holdout de 88 negativos.
- `/laboratorio`: Caderno NotebookLM cívico offline (citações `[n]`, resumos) e widgets de Generative UI.
- Assistente Seu Nonô: escada determinística para 100 páginas, tolerância a digitação, grafo de conhecimento e leitura por voz (TTS).
- Infraestrutura Cívica: Vigia ETL de 397 bases, motor de fact-checking e espelho do código no GitLab e Hugging Face.

**Banco — Fase 4 concluída (confirmada pelo dev em 29/09):** a aplicação
aponta para o **Postgres do Guara** (`cp-postgres-597bd0`, Postgres 17),
com `DATABASE_URL` **runtime e build = Yes** e carga validada igual à da
Neon, menos as 2 tabelas `embeddings`. A Neon continua na conta em 94%
(470/500 MB) **sem uso** — sobra decidir o desligamento, que é do dev.

**Coleta 22/09 (Guara) — fechada 22/09 21:30:** `copam_reunioes`=479,
`convenios_federais`=167, `contratos`=11.471, `licitacoes`=4.869,
`ambiental_licenciamento`=8.612, `atos_oficiais`=10.344. Contagem e
retomada em [HANDOFF-22-09-COLETA-GUARA.md](../historico/entregas/HANDOFF-22-09-COLETA-GUARA.md).

**Alerta:** página que lê do banco no build congela HTML sem a variável de
build. Restart não resolve; resolve `guara deploy` de imagem nova.
Medido em 19/09 (deploys `de291a9b` e `5a4a08cc`). `/betim/emendas` com
"Em breve" é o mesmo efeito: `configured=false` no build antigo.

## Decisões do dev

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
| 11 | Protocolo da LAI do INCRA: o dev cuida | ⛔ pendente |
| 12 | ETL antigo da FGV continua vivo e alinhado | ✅ decisão mantida |
| 13 | Espelho do código fora do GitHub | ✅ GitLab no lugar do Gitee (29/09) |
| 14 | Backfill do diário oficial desde jan/2020 | ✅ concluído (30/08) |
| 15 | Estrutura investigativa do diário: 7 eixos | registrado, sem implementação |

## Fila viva

Organizada por custo e benefício. Esforço pequeno primeiro.

### Bloco A — fazer agora

| # | Tarefa | Estado | Nota |
|---|---|---|---|
| A1 | **Troca de casas dos domínios** | ✅ | `www.controlepopular.com.br` no Azure (certificado gerenciado + proxy) e `.tech` no Guara; concluída em 07/10 depois do TXT `asuid.www` correto |
| A2 | **Redeploy do Guara (`guara deploy`) para o `.tech` voltar** | ⛔ | serviço `stopped` com health `crash_loop`; o CLI não tem comando de start — depende do ciclo/cota do plano |
| A3 | **Ligar o banco em runtime no Azure** | ✅ | `azure-mirror.yml` publica `DATABASE_URL` (Postgres do Guara) como segredo+env; medido 06/10: `/ambiental/licenciamento` voltou a mostrar 2.094 licenças (era 0) |
| A4 | **Fase 4: migrar app Neon → Postgres do Guara** | ✅ | app no Guara desde 29/09; sobra desligar a conta Neon |
| A5 | **SEO Fases 1–3 (canonical, sitemap, robots) + Fases 4–5** | 🚧 | código em `main` em 04/10; **falta `guara deploy`** para o canonical e o sitemap novo chegarem ao ar — baseline em [auditoria-seo-2026-10-04](../relatorios-automacao/auditoria-seo-2026-10-04.md) |
| A6 | **Bot Telegram com 14 links quebrados** | 🚧 | mapeados e corrigidos em `b9a84e7f` (05/10); publica no próximo `guara deploy` (cota ⛔ até ~08/10). Espelho local `scripts/escuta-telegram-correcao.mts` corrigido no disco mas **sem track** (arquivo de outra sessão) |
| A7 | **Piso da rotina local em 1000 abortava toda rodada boa** | ✅ | `PISO_PAGINAS` 1000 → 300 (`df61439a`); medido 05/10: saudável = 621 rotas prerenderizadas (12 cidades ativas), sem banco = 21, regime antigo = 1.471 |

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
| B4 | Globo 3D: rastreamento de cavas de mineração (detectar atividade sem cadastro ANM) | 🚧 | Fases 0, 1, 3 e 5 publicadas em 29/09: duas camadas no globo, página `/mineracao/cavas`, deep-link `?camada=` e contexto no chatbot. Gate v5 PASSOU (01/10); lote v6 (recortes 2 m, pan-sharpen) em geração — ver **Nota B4**. Sentinel ainda ⛔ (ver FONTES.md); Fases 2 e 4 na fila: [PLANO-GLOBO-CAVAS-MINERACAO.md](../planos/PLANO-GLOBO-CAVAS-MINERACAO.md) |
| B5 | Expansão PNCP: coleta da fila (89 cidades) e delegação das 30 grandes ao Gemini | 🚧 | medido 25/09 11:26 — 47 completas; ver [HANDOFF-24-09](../HANDOFF-24-09-FECHAMENTO-PNCP.md) |
| B6 | Remuneração de servidores + QSA de empresas (novas APIs, 1–2 semanas) | ⛔ | aguarda ordem; fontes no [PLANO-FILA arquivado §8](../historico/planos/PLANO-FILA-PROXIMA-SESSAO.md) |
| B7 | **Turbopack no build (decisão do dono 05/10: manter se melhor)** | ✅ | Home PC ✅ medido 05/10: 338s vs 369–398s webpack, pico 3.886 MB vs 5.392 MB, `.next` 754 MB vs 1.501 MB, 621 rotas iguais, Drizzle 73 KB gzip vs 60 KB, server 32,0 vs 32,2 MB gzip, type-check roda no turbo (Next 16.3.5). Guara-proxy ✅ verde: imagem podman `cp-turbo-test` (Linux/standalone, 1,12 GB, build frio ~46 min) construída e servidor servindo páginas reais (delta 543 vs 621 rotas = ausência de `DATABASE_URL` no container, não do bundler). **Adotado:** `apps/web/package.json` `build` → `--turbopack`. Deploy real na próxima janela de cota (~08/10); `cf:build` herda a flag — fumaça antes de usar o fallback Cloudflare. Azure pulado (ordem do dono 05/10). Worktree `med-turbo` guarda as medições — não apagar |

**Nota B4 — geração de imagem vai para a VM; a rede local é o teto (04/10).**
O lote v6 (recortes 2 m) roda no `home-pc`, mas é **limitado pela rede**, não
pela máquina. Medido em 04/10: o gerador usa **35% de 1 núcleo** (de 16), a
GPU fica em **0%** e o **link entrega ~8 Mbps** (2 medições). CPU/GPU/RAM
ociosas **não** aceleram — paralelizar dividiria o mesmo cano e arriscaria OOM
(RAM livre 1,2 GB, consumida por apps e outras sessões). Decisão: a **geração
pesada de rede migra para a VM** (sessão do Azure); aqui fica a **GPU**
(treino/gate). Ganho local restante seria cache da cena (18,7 recortes/cena
reusam a mesma imagem). Estado 05/10: a geração **passou de 95%** e o **treino
v6 iniciou** (GPU 43%, 3.150 MiB). O gate só sai se o PC ficar ligado ~1 h; se
desligar, re-rodar `fecha-v6.ps1` retoma e vai direto ao treino. **Veredito v6
(05/10): PASSOU, mas o 2 m NÃO superou o v5** — sobreamostragem, holdout 1.043,
limiar 0,33: precisão 0,782 / recall 0,888 / acurácia bal. 0,799, contra
0,811 / 0,886 / 0,823 do v5 (8 m). Decisão: **seguir no 8 m**; não gastar banda
gerando 2 m para o restante.

### Bloco C — ação externa do dev

| # | Tarefa | Nota |
|---|---|---|
| C1 | Redirect da raiz no Cloudflare (A2) | ✅ medido 04/10 — 301 no ar |
| C2 | Anotar protocolo da LAI no `docs/LAI-PROTOCOLOS.json` | CI vigia o prazo sozinha |
| C3 | Informar `AJRI_COOKIE` (fases 2 e 3 do PDFs da AJRI) | valor expira |
| C4 | ~~Abrir conta no Gitee e espelhar o código~~ | ✅ feito no GitLab (29/09), `OPERACAO.md` § 2 |
| C5 | Aceitar convite do GitBook | espelho de docs |
| C6 | Criar conta New Relic e definir `NEW_RELIC_LICENSE_KEY` no Guara (runtime, **sem** `-b`) | habilita o APM; sem a chave o portal sobe normal e sem rastreio — ver [PLANO-STUDENT-PACK](../planos/PLANO-STUDENT-PACK-2026-10.md) |

### Bloco D — destrava com a Fase 4

- Fase 5 do chatbot (persistência do índice): ⛔ cancelada (decisão do dev,
  30/09) — o Guara não tem pgvector e o Qdrant não cabe no plano. O RAG roda
  em memória (397 pedaços) e basta — ver
  [PLANO-RAG-COMPLETO.md](../planos/PLANO-RAG-COMPLETO.md).
- Coleta nova volta ao Postger (hoje vai para D1 por causa do storage).
- Índice de busca pode voltar a crescer sem estourar o teto da Neon.

**Nota — Camber (GitHub Student Pack): tarefa pesada pública fora daqui (proposta 04/10).**
Camber oferece **200 h CPU, 75 GB e 200 chamadas de LLM/mês**. Candidato:
reprocessar cavas/ETL e classificar base grande em lote. ⚠️ AGENTS §5.8: é
**nuvem de terceiro** — só **dado público**; nunca dado pessoal nem segredo.
**Passo 1 (medir o tempo local antes de migrar):** para o candidato principal
(a geração 2 m do v6), o número já existe — **~5,2 recortes/min** no `home-pc`,
**limitado pela rede (~8 Mbps)**, não pela CPU (0,35 de 16 núcleos). Leitura:
no caso das cavas o gargalo é **banda**, então Camber só ganha se a rede de lá
for maior; CPU sozinha não resolve. Próximo: escolher a tarefa candidata e medir
o tempo local dela.
**Decisão 05/10 (revisada):** plano **Student do Camber** (GitHub Honor Roll):
**40 h CPU, 5 h GPU, 50 GB de Stash e 1 GPU NVIDIA L4 (24 GB VRAM)**. Papel:
**gerar recortes 8 m no CPU (não gasta GPU) _e_ rodar os embeddings/classificação
no GPU (com parcimônia)**. Ordem dos estados: **MG → PA → GO → BA → AM**. O
checkpoint treinado v5 sobe por Stash/Blob. Com 24 GB de VRAM o treino fino cabe
folgado — medir se vale migrar do `home-pc`. Passo 1: lote de 100 (recortes +
embeddings) e medir tempo e banda.

Runbooks: [`planos/`](../planos/).

## Bloqueios

| Bloqueio | Quem desbloqueia |
|---|---|
| **Cota de build do Guara** (`Build minutes quota exceeded`, medido 05/10) — `guara deploy` recusa; site atual segue saudável | janela abre ~08/10 (política de deploy a cada ~5 dias, OPERACAO § 0) |
| **Push da `main` segurado** — 5 commits de outra sessão + `df61439a`/`b9a84e7f` locais; rebase exige árvore limpa (§ 5.4) | árvore limpa → `git fetch && git rebase origin/main && git push origin HEAD:main` (§ 5.7) |
| Deploy falhando por contexto de build (442 MB > teto 256) | ✅ derrubado a 223,5 MB (01/10) — ver [PLANO-REDUCAO-BUILD.md](../planos/PLANO-REDUCAO-BUILD.md); falta o deploy provar |
| Neon em 94% storage | ✅ app já no Guara (29/09) — sobra cancelar a conta Neon |
| HTML pré-renderizado sem dado no build | deploy novo com env de build (A1) |
| Raiz do domínio com 403 | ✅ redirect 301 medido no ar (04/10) |
| `guara security findings` quebrado | usar `guara services vulnerabilities` |
| PDFs da AJRI parados | `AJRI_COOKIE` (dev) |
| `AI_API_KEY` nunca vai para o repo | fica em `.env.local`, fora do Git |

## Dívida técnica registrada

- **Duas compactações não se unificam** (decisão de 16/08, medida):
  `lib/comunicabr/arquivo.ts` (aninhado, 99 MiB → 2,16 MB) e
  `lib/estatico/compactar.ts` (tabela plana, 7,9 MB → 2,4 MB).
- **`apps/web/public/` pesa 52,3 MB.** Nada acima do aviso de 20 MiB;
  o maior é `sigmine-interesse.geojson.gz` (6,06 MB).
- **Auditoria dos 25.729 links** pendente
  ([CLASSIFICACAO-COMPLETUDE.md](../planos/CLASSIFICACAO-COMPLETUDE.md)).
- **Soft-404: rota inexistente devolve HTTP 200.** Medido 05/10: corpo
  ~106,7 KB, título genérico "Portal Independente de Fiscalização Cidadã".
  Status sozinho NÃO detecta 404; a string "Página não encontrada" aparece
  até em página real (chunk inline). Detector validado: título genérico +
  tamanho, conferido contra páginas reais. 14 dos 43 links do menu do bot
  estavam quebrados (12 hard + 3 soft).
- **Comentários do `apps/web/package.json` sobre Turbopack estavam
  desatualizados** (medido 05/10): Drizzle 626 KiB → 73 KB gzip, e o
  type-check RODA no `next build --turbopack` (Next 16.3.5,
  "Finished TypeScript in 97s"). `build` trocado para `--turbopack`
  (B7). O `cf:build` do OpenNext dispara o mesmo script e **herda a
  flag** — rodar um `cf:build` de fumaça e conferir o bundle do Worker
  contra os 3 MiB antes de depender do fallback Cloudflare.

## Entregas recentes

**05/10/2026 — servidor 2 publicado, piso consertado, links do bot e medição Turbopack:**

- **Servidor 2 (túnel) no build de 05/10:** worktree `pub-tunel` (origin/main),
  build 640/640 em 117 s, 621 rotas, `backup.controlepopular.com.br` serve
  05/10; a raiz do domínio agora é 301 → www (A2 ✅).
- **Banco local reparado:** 12 cidades ativas repostas (idênticas ao Neon),
  `DATABASE_URL` restaurada no `.env` da raiz, schema `terras` criado na
  Neon. Piso da rotina corrigido (A7).
- **Bot do Telegram:** 43 links mapeados contra o servidor local, 14
  quebrados corrigidos (A6), 38/38 e 30/30 verdes em `route.ts` e no
  espelho local. Publicação = próximo deploy.
- **Turbopack medido (B7):** Home PC ganha nos três eixos (tempo, pico de
  RAM, tamanho do `.next`) com as mesmas 621 rotas. Teste Linux/standalone
  (proxy do Guara) verde via podman: imagem `cp-turbo-test` e servidor
  servindo páginas reais.

**04/10/2026 — imagem sem `drizzle-orm` derrubou a leitura do banco; migration 0011 e caminho do servidor 2:**

- **Incidente medido:** o container no ar não levava o driver `drizzle-orm`.
  Toda página que lê do banco caía no vazio — log
  `Cannot find module 'drizzle-orm/node-postgres'` desde 14:40Z, com o
  `getDb()` falhando em cada request. `/ambiental/licenciamento` no ar com
  **0 das 8.612 linhas** da tabela `public.ambiental_licenciamento`.
- **Conserto quente (temporário):** `drizzle-orm@0.45.2` copiado à mão para
  dentro do container (`/app/apps/web/node_modules/drizzle-orm`). A página
  voltou a mostrar **8.612 licenças**; sem erro de banco no log. O pacote vive
  só no container — **some no próximo reinício** e volta o sintoma.
- **Conserto definitivo (no repo, commit `2b6dcd8a`):**
  `outputFileTracingIncludes` em `apps/web/next.config.ts` passou a incluir
  `../../node_modules/drizzle-orm/**/*` — o `@vercel/nft` não enxergava o
  `createRequire` de `apps/web/lib/db/client.ts`. Sobe no próximo deploy.
- **Migration `0011_vicio_legislativo.sql` aplicada no Guara:** criadas
  `congresso.vicios_legislativos` e `congresso.vicio_itens` (0 linhas — o ETL
  ainda não rodou). Os erros `banco:congresso ... falhou` pararam.
- **Banco conferido:** conecta em `controle_popular`, **134 tabelas**; nenhuma
  tabela do eixo betim vazia. `public.fila_coleta` existe com 0 linhas — a
  migration `0090` **está** aplicada (o texto de 03/10 dizia o contrário).
- **Bloqueio:** `guara deploy` devolve `Build minutes quota exceeded`. Enquanto
  a cota não libera, o caminho combinado é publicar o **servidor 2** (túnel do
  `home-pc`, peer Tailscale `100.91.10.1`) e manter o conserto quente de pé.

**03/10/2026 — rádio sobrevive à navegação, pet, arrasto, memória e fila Guara:**

- **Rádio persistente:** o `<audio>` do player morria a cada clique em `<a>`
  interno (reload de documento troca a página inteira). Causa medida com
  `scripts/verificar-radio-navegacao.py` (Playwright): o baseline morreu no
  salto `/direitos-em-movimento/ajuda` → `/ambiental` com "novo `<audio>`
  nasceu pausado". Correção: links de página convertidos para `NextLink` e um
  **`InterceptadorLinks`** global no layout raiz entrega ao router QUALQUER
  `<a>` interno — inclusive os de `href` dinâmico (navbar e rodapé) que o
  ESLint não vê. É o padrão do que permanece ativo: navbar, faixa, rodapé,
  Seu Nonô, companheiro e rádio sobrevivem à navegação.
- **Rastro do cursor** mais lento e visível (`SUAVE` 0,15/0,13, 36 px/letra,
  ocioso 1600 ms, fade 1,6 s, fonte 0,95 rem, brilho 9 px) — pedido do dono.
- **404** com a imagem do lobo-guará (reuso de
  `terra-e-territorios-ipe-lobo.jpg`) e o pet em estado `failed` por 6 s via
  evento `cp:companheiro-failed`.
- **Pet:** `PetIcone` usava no `background-size` a medida de UMA célula, e
  espremia a folha de 8×9 num ícone de ~20 px (borrão que parecia código);
  agora usa a folha inteira, como o `CompanheiroFlutuante`.
- **Arrasto dos flutuantes:** o `dragstart` nativo da `<img>` emitia
  `pointercancel` e travava o gesto no 1º pixel; o clamp media a pega em vez
  do container. `useArrastavel` cancela o arrasto nativo e acha a caixa por
  `data-arrastavel-caixa`; o rádio voltou a arrastar com posição lembrada.
- **`/memoria`:** fontes agregadas em 5 rótulos (MST, MAB, APIB, Aos que Virão,
  Wikipédia), complementos do Calendário Histórico da APIB
  (`apiboficial.org/historicoatl`) e visão **calendário** por data/mês
  ignorando o ano, na ordem da mística do dia.
- **Fila Guara (Fase 1):** tabela `fila_coleta` (migration `0090`), rota
  autenticada `POST /api/fila/semear` (falha fechada + allowlist de hosts),
  `cron-fila.yaml` (*/15) e puller Ollama local (`scripts/fila-coleta-puller.mts`).
  A migration **ainda não foi aplicada** no Guara; o `FILA_SEGREDO` precisa ser
  criado sem `-b`.
- **`/direitos-em-movimento/conselhos`:** removida a epígrafe poética a pedido
  do dono.

**02/10/2026 — deploy do Guara volta a subir (healthy) e cursor temático:**

- **Deploy `278e6430` healthy** depois de destravar três causas de build, todas
  de TEMPO (não de contexto): `dynamicParams` não-literal, agregações do copam
  sem `comBancoReserva` e `getCloudflareContext({ async: true })` subindo
  wrangler/workerd no SSG (teto de 60s por página). Detalhe em
  [PLANO-REDUCAO-BUILD.md](../planos/PLANO-REDUCAO-BUILD.md) e
  [OPERACAO.md](../05-operacao/OPERACAO.md).
- **Cursor segue a cor primária do tema:** `CursorTema.tsx` recoloriza o
  preenchimento dos `.cur` em runtime (canvas → data URI em variável CSS);
  contorno preto intacto. Commit `96625e37`.

**01/10/2026 — Postgres do Guara completo + contexto de build no teto:**

- **Banco:** as 48 tabelas que estavam em 0 no Guara foram populadas por
  replicação `pg_dump --data-only` do Postgres local → proxy Guara
  (destaques: `servidores` 139.599, `saude_internacoes_cid` 82.376,
  `cap_autos_infracao` 78.039, `licitacoes` restante, `socios`, `ibama_*`,
  `paraopeba_*`, `patrimonio_tombado_iepha`). Conferido: **0 tabelas em 0
  que tenham dado local**. `nota_transparencia` foi com mapeamento de colunas
  (`*_uf` local → `*_mg` Guara). Fonte da verdade dos coletores segue sendo o
  Postgres local; não mexi em `.env` nenhum (credenciais só em variável de
  processo).
- **Build:** contexto de build derrubado de **442,1 MB para 223,5 MB**
  (teto Guara 256 MB) — F1 (`.dockerignore`: docs, PDFs, etl fora de
  `dados/`) + F2 (JSON de licença sai do contexto; build lê amostras
  versionadas com total real preservado). F3 (compactação) dispensada.
  Detalhe e verificação: [PLANO-REDUCAO-BUILD.md](../planos/PLANO-REDUCAO-BUILD.md).
- **Tailscale:** já ativo no `home-pc` (100.91.10.1, online, tailnet
  `finweejur.github`) com `sshd` do Windows de pé — o desktop alcança este PC
  por SSH no IP do tailnet. O Guara tem serviço de catálogo Tailscale
  (v1.96.5, pede auth key) **não deployado**; o acesso ao Postgres segue pelo
  `guara proxy`, que funciona (token de sessão falha 1× a cada tanto — basta
  reconectar).

**01/10/2026 — Correção do BuildKit 12Gi, Aceleração de Build e Resiliência da Reserva:**

- **BuildKit 12Gi pod evicted (Guara Cloud):** corrigido com exclusão de pastas
  de dados brutos (`data/`, `acervo-documentos/`, `logs/`, `screenshots/`) no
  `.dockerignore` e remoção inline de `apps/web/.next/cache` e `/root/.npm` no mesmo
  comando `RUN` de compilação do `Dockerfile`.
- **Aceleração do build standalone:** `staticGenerationMaxConcurrency: 8` e
  `retryCount: 1` no alvo standalone em `next.config.ts` (mantendo 3 para o
  Cloudflare Workers), além de desativar source maps de produção do navegador
  (`productionBrowserSourceMaps: false`) e adicionar
  `NODE_OPTIONS="--max-old-space-size=2560"` para estabilidade de memória.
- **Blindagem da reserva de banco:** adicionado `comTimeout` defensivo em
  `apps/web/lib/db/reserva.ts` (10s Guara, 5s reservas). Evita travar o servidor
  ou gerar timeouts em cascata quando a Neon está inativa ou suspensa.
- **Resolução de GeoJSON no monorepo:** `resolverDirCamadas()` em
  `apps/web/lib/terras/camadas.ts` busca em cascata na raiz e em `apps/web/public/`,
  com captura graciosa em `lerGeoJSON` para nunca derrubar o build por camada ausente.

**30/09/2026 — Diretório de rádios (`/radio`) e player multi-estação:**

- Rota `/radio` com **44 estações** de **11 países**: 8 federais (EBC, Câmara,
  Senado), **21 universitárias** (UFVJM, UFOP, UFV, UFU, UFMG, UFES, UFG, UFAL,
  UFC, UFDPar, UFPB, UFPel, UFMS, UFSCar, UFCG, UFF, UFABC, UEL, UDESC, UFRJ,
  USP) e comunitárias/populares do Sul Global (Cuba, Argentina, Peru,
  Moçambique, Senegal, Gana, África do Sul, Nigéria, Palestina, Jamaica).
- Dado curado em `apps/web/lib/radio/estacoes.ts`; cada stream é HTTPS e foi
  conferido por requisição HTTP (áudio ou playlist), com o `site` oficial em
  cada linha. Fonte da coleta: `radio-browser.info` e `radio.garden`
  ([FONTES.md § Rádios](../06-fontes/FONTES.md)).
- Player persistente reescrito: multi-estação por evento (`cp:radio-tocar`),
  índice expansível no hover ao lado do Seu Nonô, logo + bandeira por estação.
  HLS das federais via `hls.js` sob demanda (nova dependência).
- Transcrição ao vivo **no navegador** (Whisper local, `transformers.js`) só
  nas federais de fala com CORS; bolha sobe sozinha, o leitor pausa e rola
  para trás. Sem API de IA. ⚠️ falta o teste de fumaça no navegador.
- Verificação: 15 testes novos em `lib/radio`; `tsc` limpo nos arquivos novos.

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
- **R5:** cancelado (decisão do dev, 30/09) — o Guara não tem pgvector e o
  Qdrant não cabe no plano (`TIER_LIMIT_EXCEEDED`, 402). O índice em memória
  é o desenho final.
- **Busca × RAG:** a busca global (navbar e `/busca`) passou a cobrir a
  memória e as bases (hubs completados + indexador `gerar-indice-busca.mts`)
  e ganhou a ponte "Perguntar ao Seu Nonô".
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
- Domínio da raiz não aceito no Guara → redirect no Cloudflare, pendente do dev.
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
