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

## Planejado

Os 11 ALTO e 8 MÉDIO restantes são de **dependências do npm e da base Alpine**
dentro da imagem, não do runtime do portal — de maior a menor alcance:

- **`apk upgrade --no-cache`** já roda nos 3 estágios do `Dockerfile`; um novo
  deploy (imagem nova) tende a trocar pacotes do SO já corrigidos. **Re-scan
  após cada deploy** para confirmar.
- **`brace-expansion`, `picomatch`** (transitivas de ferramentas de build):
  correção via `overrides` no `package.json` da raiz é possível, mas exige
  rodar a suíte depois — **avaliar antes**, porque override de transitiva
  pode quebrar `minimatch`/`glob`.
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
