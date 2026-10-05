# HANDOFF — Azure (espelho + VM + Blob) e preparador das cavas

> **Tipo:** ENTREGA
> **Domínio:** global (infra, operação)
> **Última medição:** 2026-10-04
> **Relacionados:** [PLANO-STUDENT-PACK-2026-10.md](../../planos/PLANO-STUDENT-PACK-2026-10.md), [PLANO-GLOBO-CAVAS-MINERACAO.md](../../planos/PLANO-GLOBO-CAVAS-MINERACAO.md), [OPERACAO.md](../../05-operacao/OPERACAO.md), [AGENTS.md](/AGENTS.md)
> **Palavras-chave:** azure, container apps, vm, blob, ghcr, acr, new relic, termius, ssh, tailscale, cavas, preparador

## Sumário

- [O que ficou pronto](#o-que-ficou-pronto)
- [Recursos Azure criados](#recursos-azure-criados)
- [Como operar](#como-operar)
- [Pendências (ordem)](#pendências-ordem)
- [Ações do dono](#ações-do-dono)
- [Armadilhas novas medidas](#armadilhas-novas-medidas)

## O que ficou pronto

Sessão de 04/10/2026 (modelo DeepSeek V4.1 Flash via opencode). Trabalho feito
em worktrees limpos a partir do `origin/main` (§5.4), commits publicados na
`main` pelo próprio agente.

- **New Relic no espelho do Azure** — agente conectado, reporta como
  "Controle Popular (Azure)". Exigiu dois consertos: (1) o pacote `newrelic`
  vinha **incompleto** no standalone (`outputFileTracingIncludes`); (2) a tag
  fixa `:latest` **escondia** a revisão nova no Container Apps — agora usa o
  **SHA** do commit.
- **CSP** liberado para o Simple Analytics (`script-src`/`connect-src`).
- **Status page** `/status` (custo zero, `noindex`).
- **Espelho no Azure Container Apps** funcionando (rotas 200).
- **Termius + SSH** no `home-pc` (chave) + Tailscale já ativo.
- **VM B2ats_v2** criada (desligada por padrão) e **Blob** `cpdados4751`.
- **Preparador das cavas (Fase 1)** agendado: liga a VM, coleta, sobe os
  recortes no Blob e desliga a VM.

## Recursos Azure criados

| Recurso | Nome | Nota |
|---|---|---|
| Assinatura | Azure for Students | US$ 100 / 12 meses; **Brasil bloqueado** (política) — região usada: `northcentralus` |
| Grupo | `cp-app` | |
| Container Apps env | `cp-env` | |
| Container App | `cp-web` | espelho; escala a zero; New Relic ligado |
| Registro | ACR `cpwebacr3pdo` (Basic) | **a migrar para GHCR** (grátis) |
| VM | `cp-vm` (Standard_B2ats_v2) | IP `52.252.147.150`; user `cpadmin`; **deallocada** |
| Blob | `cpdados4751` / container `cavas` | recortes das cavas |
| Log Analytics | (auto do `cp-env`) | logs; `az containerapp logs show` tem bug → usar `az monitor log-analytics query` |

Chave SSH: `C:\Users\teste\.ssh\id_rsa` (serve `home-pc` **e** `cp-vm`).

## Como operar

- **Espelho**: workflow `azure-mirror.yml` (manual). Builda no CI (banco público
  via `secrets.DATABASE_URL`), publica no registro e atualiza o `cp-web`.
- **Preparador das cavas**: workflow `cavas-preparador.yml`, **diário 12:30 UTC**
  (09:30 BRT). Liga a `cp-vm`, roda `scripts/etl/cavas/preparador-cavas.sh`
  (positivos + negativos), sobe `recortes-*.tgz` + `manifesto-*.json` no Blob e
  desliga a VM. Baixar no PC: `scripts/etl/cavas/baixar-recortes-blob.md`.
- **Ligar a VM na mão**: `az vm start -g cp-app -n cp-vm`.

## Pendências (ordem)

1. **Testar o preparador** de ponta a ponta (disparar com `limite=20`).
2. **GHCR**: rodar `azure-mirror.yml` (já usa GHCR) e validar o espelho; então
   **apagar o ACR** (~US$ 5/mês).
3. **Domínio `.tech`**: os **nameservers no Name.com** ainda não propagaram
   (`ns*.name.com`); ao ativarem na Cloudflare (`jose`/`maya`), rodar o bind
   `www.controlepopular.tech` no Azure + redirect do apex.
4. **Deploy no Guara** (quando a cota de build liberar) para ativar o New Relic
   no site oficial. A imagem só pega o conserto do `newrelic` no próximo deploy.
5. **Azure Speech (TTS)**: integrar a oferta grátis (0,5 mi chars/mês) no
   "Ouvir Página".
6. **Alerta de orçamento** no Azure (ex.: US$ 20).

## Ações do dono

- ⚠️ **Rotacionar o token do Name.com** — foi colado no chat (vazado).
- Confirmar no **Name.com** os nameservers `jose`/`maya` do `.tech`.
- Decidir sobre registrar `controlepopular.com` (livre; pago).

## Armadilhas novas medidas

- **`az storage account create` → `SubscriptionNotFound`** até o provedor
  `Microsoft.Storage` terminar de registrar. Confirme com `az provider show`.
- **`az containerapp logs show` quebrado** (`KeyError: eventStreamEndpoint`).
  Use o Log Analytics: `az monitor log-analytics query -w <workspace-id>` com
  `ContainerAppLogConsoleLogs_CL`.
- **Container Apps não repuxa imagem de tag fixa** — use o **SHA** do commit.
