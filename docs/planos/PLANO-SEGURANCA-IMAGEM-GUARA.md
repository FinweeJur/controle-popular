# PLANO — segurança da imagem Guara (Trivy 23/09)

> **Tipo:** PLANO
> **Domínio:** global
> **Última medição:** 2026-09-24 (P0 Dockerfile aplicado; rescan pendente de deploy)
> **Leitura estimada:** curta (< 5 min)
> **Relacionados:** [OPERACAO.md](../05-operacao/OPERACAO.md), [ESTADO.md](../02-estado/ESTADO.md), [AGENTS.md](/AGENTS.md), [PLANO-POS-DEPLOY-23-09-CORRECOES.md](PLANO-POS-DEPLOY-23-09-CORRECOES.md)
> **Palavras-chave:** seguranca, trivy, cve, guara, docker, alpine, openssl, supply-chain, remediation

## Sumário

- [Propósito](#propósito)
- [O que o relatório diz](#o-que-o-relatório-diz)
- [Risco real neste portal](#risco-real-neste-portal)
- [Causa raiz medida](#causa-raiz-medida)
- [Plano de correção](#plano-de-correção)
- [Verificação](#verificação)
- [Fora do escopo](#fora-do-escopo)
- [Decisões registradas](#decisões-registradas)
- [Origem](#origem)

## Propósito

Corrigir as 44 falhas do scan Trivy na imagem de produção do Guara
e deixar o caminho de re-scan medido — sem pânico por CVE sem caminho
de ataque neste portal.

## O que o relatório diz

| Campo | Valor medido |
|---|---|
| Imagem | `registry.guaracloud.com/controle-popular/svc-6a817bb9:deploy-a0012fc1` |
| Scan | 2026-09-23T20:31:07Z |
| Severidade | **1 CRITICAL · 23 HIGH · 20 MEDIUM** (44 total) |
| Endpoint | `controle-popular-web-0b4895-….guaracloud.com` com tráfego |
| Alegação Guara | *risk context, not proof of abuse* |
| CVEs de topo | CVE-2024-21538, CVE-2025-64756, CVE-2026-26996, CVE-2026-27903, CVE-2026-27904 |

Fila pré-existente no [ESTADO.md, nota A3](../02-estado/ESTADO.md):
scan de 19/09 já mostrava 3 CRITICAL / 28 HIGH / 22 MEDIUM.

**CRITICAL único:** CVE-2026-59873 em `tar@6.2.1` (gzip bomb no extract).

## Risco real neste portal

Classificação pela **consequência** (skill de revisão), não pela etiqueta
do CVE. Portal sem login; conteúdo é dado público de propósito.

| Achado | Biblioteca no scan | Existe no nosso lock? | Caminho de ataque aqui? | Risco |
|---|---|---|---|---|
| CRITICAL tar (gzip bomb, hardlink, PAX…) | `tar@6.2.1` | **Não** — ausente do `package-lock.json` | O runtime **não** extrai `.tar` de usuário | **Baixo** (DoS só se alguém expuser extract) |
| HIGH minimatch/glob/brace-expansion (ReDoS, inj. de cmd) | `minimatch@9`, `glob@10`, `brace-expansion@2` | Só em **devDependencies** (eslint, opennext) com versões **outras** | Padrão de glob não vem do visitante | **Baixo** em runtime; médio em CI se aceitar glob de terceiro |
| HIGH cross-spawn ReDoS | `cross-spawn@7.0.3` | Lock tem `7.0.6` **[dev]** | Não roda no runner standalone | **Baixo** |
| HIGH OpenSSL (QUIC, CMS, PKCS#7) | `libcrypto3`/`libssl3@3.5.6-r0` | Camada do **Alpine** no `node:20-alpine` | Runtime usa TLS/Postgres SSL | **Alto** — é o pacote de sistema que efetivamente roda |
| demais HIGH/MEDIUM npm (sigstore, pacote, ip-address…) | várias | **Ausentes** do lock | Vêm do **npm embutido na imagem base**, não do app | **Baixo** no server; infla o score do Trivy |

**Resumo honesto:** o número 44 assusta, mas a maior parte é
*supply-chain de build/npm da imagem base*. O que **realmente roda**
com o visitante é **OpenSSL do Alpine** + o standalone do Next.

Se alguém for derrubar ou adulterar este projeto hoje, o caminho mais
provável continua sendo **cadeia de dependência / configuração de
deploy**, não esses CVEs de `tar` sem extract no runtime.

## Causa raiz medida

1. **`Dockerfile` usa `node:20-alpine` crua** — sem `apk upgrade`,
   sem pin de digest. Alpine 3.x com OpenSSL 3.5.6-r0.
2. **Estágio `runner` não limpa o npm/tooling da base** — o Trivy
   varre a imagem final e acha `tar`, `minimatch`, `pacote`… que o
   `node:20-alpine` embute, mesmo o app não usá-los.
3. **Lockfile local ≠ versões do scan** — prova de que o CVE vem da
   base, não do `package-lock.json` do monorepo:

   | Pacote | Scan (imagem) | `package-lock.json` |
   |---|---|---|
   | tar | 6.2.1 | **ausente** |
   | minimatch | 9.0.5 | 3.1.5 / 8.0.7 / 10.2.6 **[dev]** |
   | cross-spawn | 7.0.3 | 7.0.6 **[dev]** |
   | brace-expansion | 2.0.1 | 1.1.21 / 2.1.7 / 5.0.12 **[dev]** |
   | glob | 10.4.2 | 9.3.5 / 12.0.0 **[dev]** |

4. **Deploy caro:** ~17 min e teto de 250 min/ciclo (Operação §0).
   Toda correção de imagem consome cota — empilhar, não iterar.
5. **Shield já existe** (`guara-shield-bot.mts`) mas sem
   `scripts/.env` (Telegram) o alerta não sai do PC.

## Plano de correção

Prioridade: **P0** corta o que roda de verdade; **P1** limpa o
score e o supply-chain de build; **P2** processo; **P3** higiene.

| # | Pri | Ação | Arquivo / alvo | Estado (24/09) |
|---|---|---|---|---|
| 1 | **P0** | Base `node:22-alpine` + `apk upgrade --no-cache` em todos os estágios | `Dockerfile` | ✅ aplicado no worktree |
| 2 | **P0** | Runner **sem** npm/yarn/corepack (CMD só `node server.js`) | `Dockerfile` | ✅ aplicado no worktree |
| 3 | **P1** | `npm audit --omit=dev` no `@cp/web` | lock | ✅ **0 falhas** (154 deps prod) |
| 4 | **P1** | Rescan Trivy **após** deploy da janela | CLI Guara | ⬜ espera `guara deploy` |
| 5 | **P1** | Shield `--once` p/ gravar relatório pós-fix | bot | ⬜ pós-rescan |
| 6 | **P2** | `scripts/.env` com `TELEGRAM_*` | gitignored | ⬜ token do dono |
| 7 | **P2** | OPERACAO: re-scan + Node 22 alinhado | `OPERACAO.md` | ✅ §1 e §1b |
| 8 | **P3** | audit de dev só local, não bloqueia deploy | CI opcional | ⬜ opcional |

### Ordem de execução

1. ~~Dockerfile (itens 1–2)~~ ✅ feito.
2. Gates locais (suíte + `tsc` + docs).
3. **Um** deploy na janela de ~5 dias (só o dono manda).
4. Rescan Trivy + Shield `--once` (itens 4–5).
5. Telegram (item 6) quando o dono colar o token — não bloqueia.

### Risco da correção

| Risco | Mitigação |
|---|---|
| `apk upgrade` muda imagem e quebra something | multi-etapa já isola build; standalone não depende de apk extras além de `libc6-compat` |
| Remover npm do runner quebra start | `CMD` é `node apps/web/server.js` — não invoca npm |
| Cota de build | empilhar com outros commits da mesma janela |
| Rescan ainda com HIGH de base | subir minor do tag Alpine / trocar por `node:22-alpine` ( OPERACAO já menciona Node 22 no comentário do Dockerfile — **alinhar doc e Dockerfile** ) |

⚠️ **Inconsistência medida:** `OPERACAO.md` §1 diz “Node 22 Alpine”;
o `Dockerfile` está em **`node:20-alpine`**. O plano **alinha para
`node:22-alpine` (ou 20 LTS mais novo com digest)** e corrige a doc.

## Verificação

```bash
# local (antes do deploy)
npm test
npx tsc --noEmit -p apps/web
python scripts/validar-documentacao.py

# imagem (depois do deploy da janela)
guara services vulnerabilities -s controle-popular-web-0b4895
npx tsx scripts/agent-tools/guara-shield-bot.mts --once
```

Critério de pronto:

- [ ] CRITICAL `tar` some **ou** fica documentado como “só na base, sem extract no runtime” com data;
- [ ] HIGH de `libssl3`/`libcrypto3` ≤ 0 (ou versão ≥ fix do relatório);
- [ ] `guara-shield-relatorio.json` atualizado com data ≥ deploy;
- [ ] OPERACAO.md e Dockerfile dizem o **mesmo** Node major.

## Fora do escopo

- Penetração test, fuzzing, força bruta (proibido na revisão do portal).
- Trocar de PaaS ou desligar o endpoint público.
- `git push` / `guara deploy` sem pedido do dono.
- Reescrever histórico para esconder CVE (não resolve imagem).
- OWASP de sessão/MFA/CSRF — portal sem login (revisão CP § “não se aplica”).

## Decisões registradas

| Data | Decisão |
|---|---|
| 2026-09-24 | Não tratar os 44 CVEs como 44 explorações: separar **base Alpine/npm** × **lock do app** × **devDependencies**. |
| 2026-09-24 | Priorizar **Dockerfile (OpenSSL + limpeza do runner)** antes de overrides de npm — o scan majority não está no nosso lock. |
| 2026-09-24 | Deploy de segurança entra na **janela de 5 dias** (cota); não abrir build só por Trivy. |
| 2026-09-24 | Alinhar `OPERACAO.md` (Node 22) com o `Dockerfile` real na mesma edição — **feito**: Dockerfile agora é `node:22-alpine`. |
| 2026-09-24 | P0 aplicado no worktree; **não** fazer push/deploy sem ordem do dono (cota ~5 dias). |

## Origem

- Relatório Trivy: `vulnerabilities-6a817bb9-…-2026-09-24.md` (download do painel Guara, 23/09 scan).
- Runtime Risk Signals Guara: severidade Alta, confiança média, tráfego observado.
- Medido no worktree `cp-bots-lab`: `Dockerfile`, `package-lock.json` (lockfileVersion 3), `apps/web/package.json`.
- Fila anterior: ESTADO.md nota A3 (19/09).
