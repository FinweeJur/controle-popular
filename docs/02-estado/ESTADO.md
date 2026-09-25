# ESTADO — o portal hoje, o que vem a seguir

> **Tipo:** ESTADO
> **Domínio:** global
> **Última medição:** 2026-09-24
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

**Banco (medido 22/09):** a coleta do Betim já vai para o **Postgres do
Guara** (`cp-postgres-597bd0`). A Neon continua na conta em 94%
(470/500 MB) até a troca final de `DATABASE_URL` da aplicação (Fase 4).
`DATABASE_URL` no Guara: **runtime e build = Yes** (CLI `env list`, 22/09).

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
| 13 | Código sobe para o Gitee no futuro (espelho, não mudança) | 🟡 runbook pronto |
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
| A4 | **Fase 4: migrar app Neon → Postgres do Guara** | 🚧 | banco Guara já enche; falta apontar a app e largar a Neon |

**Nota A3:** scan `guara services vulnerabilities` (19/09) achou 3 CRITICAL,
28 HIGH, 22 MEDIUM. Os críticos: `next` 16.2.12 (fix em 16.3.x) e `tar`
6.2.1 (fix em 7.5.x). `npm audit fix` aplicado; sobem os transitivos.
`guara security findings` está com bug no CLI — use `services vulnerabilities`.

**Nota A4:** o Postgres do Guara tem 1 GiB incluso (2 GiB máximo), snapshot
diário e endpoint privado (a rede particular da Guara, mais rápida e mais
fechada que a internet). Variante pgvector habilita embeddings do assistente
(rootbook `ROTEIRO-PGVECTOR-CHATBOT.md`); PostGIS habilita consultas de mapa
no servidor. Migração: `pg_dump` da Neon, carga no Guara, troca de
`DATABASE_URL`, `guara deploy`.

### Bloco B — destravadas, aguardando ordem

| # | Tarefa | Estado | Nota |
|---|---|---|---|
| B1 | Voz própria do TTS: CosyVoice 3 (Alibaba, Apache 2.0) no servidor | ⛔ | protótipo barato hoje: Edge TTS; spike: Piper/Vozz no browser |
| B2 | Cidades novas do `CIDADES_DO_BUILD`: revisar testes do assistente junto | ✅ | feitos no 19/09; repetir o ritto a cada adição |
| B3 | Confirmar deploy pós `-b` renderizou as páginas com dado | 🚧 | depende de A1 |
| B4 | Globo 3D: rastreamento de cavas de mineração (detectar atividade sem cadastro ANM) | ⛔ | **plano da próxima sessão (amanhã, 25/09)**: [PLANO-GLOBO-CAVAS-MINERACAO.md](../planos/PLANO-GLOBO-CAVAS-MINERACAO.md); Fase 0 pode correr junto |
| B5 | Expansão PNCP: coleta da fila (105 cidades) e delegação das 30 grandes ao Gemini | 🚧 | medido 24/09 — 31 completas; ver [HANDOFF-24-09](../HANDOFF-24-09-FECHAMENTO-PNCP.md) |
| B6 | Remuneração de servidores + QSA de empresas (novas APIs, 1–2 semanas) | ⛔ | aguarda ordem; fontes no [PLANO-FILA arquivado §8](../historico/planos/PLANO-FILA-PROXIMA-SESSAO.md) |

### Bloco C — ação externa do dono

| # | Tarefa | Nota |
|---|---|---|
| C1 | Redirect da raiz no Cloudflare (A2) | dashboard do Cloudflare |
| C2 | Anotar protocolo da LAI no `docs/LAI-PROTOCOLOS.json` | CI vigia o prazo sozinha |
| C3 | Informar `AJRI_COOKIE` (fases 2 e 3 do PDFs da AJRI) | valor expira |
| C4 | Abrir conta no Gitee e espelhar o código | runbook `PLANO-ESPELHO-GITEE.md` |
| C5 | Aceitar convite do GitBook | espelho de docs |

### Bloco D — destrava com a Fase 4

- Fase 5 do chatbot: pgvector no banco novo (runbook no `planos/`).
- Coleta nova volta ao Postger (hoje vai para D1 por causa do storage).
- Índice de busca pode voltar a crescer sem estourar o teto da Neon.

Runbooks: [`planos/`](../planos/).

## Bloqueios

| Bloqueio | Quem desbloqueia |
|---|---|
| Neon em 94% storage | Fase 4 (A4) — dono decide data |
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
