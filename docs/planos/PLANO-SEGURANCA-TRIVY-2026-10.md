# Plano — Segurança pós-Trivy e pendências do Guara Shield

> **Tipo:** PLANO
> **Domínio:** global (segurança, build, deploy)
> **Última medição:** 2026-10-03
> **Leitura estimada:** curta (3–8 min)
> **Relacionados:** [OPERACAO.md](../05-operacao/OPERACAO.md), [APRENDIZADOS-BUILD-DEPLOY-E-BANCO.md](../03-desenvolvimento/APRENDIZADOS-BUILD-DEPLOY-E-BANCO.md), [AGENTS.md](/AGENTS.md)
> **Palavras-chave:** seguranca, trivy, guara shield, cve, next, npm, overrides, docker, alpine, auditoria

## Sumário

- [Propósito](#propósito)
- [Medição de 03/10/2026](#medição-de-03102026)
- [Corrigido](#corrigido)
- [Planejado](#planejado)
- [Pendência do CLI (Guara Shield)](#pendência-do-cli-guara-shield)
- [Régua](#régua)

## Propósito

Registra o que a varredura de imagem do Guara (Trivy, `guara services
vulnerabilities`) apontou no serviço `controle-popular-web-0b4895`, o que foi
corrigido e o que fica planejado. A varredura de **findings/posture do Guara
Shield está quebrada no CLI** (ver abaixo), então o Trivy é a régua viva.

## Medição de 03/10/2026

Primeiro scan do dia (imagem `deploy-acde2665`, `Scanned 13:18:18`):
**1 CRÍTICO · 11 ALTO · 8 MÉDIO (20 total)**, com correção disponível.

## Corrigido

- **`next` 16.3.5 → 16.3.6** (GHSA-vcvr-r3jv-pc5j, CRÍTICO). Aplicado em
  `apps/web/package.json` (`^16.3.6`) + `package-lock.json` (commit junto).
  É a única CVE CRÍTICA e a única do código do próprio portal.
- **`nodemailer` REMOVIDO** (era dependência de produção na raiz, mas **não é
  importada em lugar nenhum** — o envio de e-mail é feito à mão, via
  `node:net`/`node:tls` em `lib/email/enviar-smtp.ts`). Ela carregava 1 ALTO
  (DoS/backtracking). Remover a dependência órfã é melhor que atualizá-la:
  `npm audit --omit=dev` agora responde **0 vulnerabilidades**.
- **Régua nova:** script `npm run audit` (`npm audit --omit=dev`) para rodar no
  CI/local — auditoria de produção nunca vai para o build pago.

## Planejado

Os 11 ALTO e 8 MÉDIO restantes são de **dependências do npm e da base Alpine**
dentro da imagem, não do runtime do portal — de maior a menor alcance:

- **`apk upgrade --no-cache`** já roda nos 3 estágios do `Dockerfile`; um novo
  deploy (imagem nova) tende a trocar pacotes do SO já corrigidos. **Re-scan
  após cada deploy** para confirmar.
- **`brace-expansion`, `picomatch`** (transitivas de build): **não são nossas.**
  A árvore do repo já está nas versões corrigidas (`brace-expansion`
  2.1.7/5.0.12/1.1.21, `picomatch` 4.0.5/4.0.7). O Trivy aponta `2.0.2`/`4.0.3`
  porque são as versões do **npm embutido na imagem `node:22-alpine`** — sai com
  atualização da base, não por `overrides` no repo.
- **`pacote`, `sigstore`, `ip-address`, `http-cache-semantics`:** vêm do npm
  embutido na imagem `node:22-alpine`, não de `dependencies` do repo — não se
  resolve por `overrides`; depende de **nova base Node** no `Dockerfile`.
  `http-cache-semantics` está **sem correção** publicada: monitorar.
- **`npm ci --no-audit`** no `Dockerfile` pula a auditoria de propósito (build
  pago); a auditoria de dependências do repo fica para o CI/local
  (`npm audit --omit=dev`), não para o build.

## Pendência do CLI (Guara Shield)

`guara security findings` e `guara security posture` falham no CLI 0.3.0 com
`MODULE_NOT_FOUND: '@guaracloud/shared-types'` (pacote faltando no bundle —
mesma família do `guara security findings` já anotado no AGENTS §6). O caminho
que funciona hoje é `guara services vulnerabilities` (Trivy). Vale reportar ao
suporte do Guara.

## Régua

Depois de cada deploy, rodar e datar:

```bash
guara services vulnerabilities -s controle-popular-web-0b4895 --summary
```

Zero CRÍTICO é o piso. ALTO/MÉDIO de base-imagem se acompanha no tempo; ALTO
de dependência do app entra na fila de bump.
