# HANDOFF — Cavas de mineração: cron desligado, falha diagnosticada e próximos passos

> **Tipo:** ENTREGA
> **Domínio:** mineração (cavas), infraestrutura (Azure)
> **Última medição:** 2026-10-30
> **Leitura estimada:** longa (15–25 min)
> **Relacionados:** [PLANO-CAVAS-MVP.md](../../planos/PLANO-CAVAS-MVP.md), [MEDICOES-CAVAS-MINERACAO.md](../planos/MEDICOES-CAVAS-MINERACAO.md), [PLANO-GLOBO-CAVAS-MINERACAO.md](../planos/PLANO-GLOBO-CAVAS-MINERACAO.md), [ESTEIRA-CAVAS.md](../planos/ESTEIRA-CAVAS.md), [CAMBER-CAVAS-RUNBOOK.md](../planos/CAMBER-CAVAS-RUNBOOK.md), [HANDOFF-2026-10-04-AZURE-CAVAS.md](./HANDOFF-2026-10-04-AZURE-CAVAS.md), [ESTADO.md](../../02-estado/ESTADO.md), [OPERACAO.md](../../05-operacao/OPERACAO.md), [FONTES.md](../../06-fontes/FONTES.md), [AGENTS.md](../../../AGENTS.md)
> **Palavras-chave:** cavas, mineracao, azure, vm, cron, preparador, abortado-rc0, oom, rasterio, cbers, custo, budget, telegram, canario

## Sumário

- [Para que serve esta sessão](#para-que-serve-esta-sessão)
- [Estado medido em 30/10/2026](#estado-medido-em-30102026)
- [O que foi feito nesta sessão](#o-que-foi-feito-nesta-sessão)
- [Diagnóstico da falha](#diagnóstico-da-falha)
- [Caminhos dos arquivos](#caminhos-dos-arquivos)
- [Links úteis](#links-úteis)
- [Aprendizados](#aprendizados)
- [Próximos passos (checklist)](#próximos-passos-checklist)
- [Ações do dono](#ações-do-dono)
- [Riscos e armadilhas](#riscos-e-armadilhas)
- [Anexo — custo do portal (fora do escopo das cavas)](#anexo--custo-do-portal-fora-do-escopo-das-cavas)

## Para que serve esta sessão

A sessão anterior **parou o sangramento**: o cron diário que ligava a VM foi
desligado e o gasto recorrente parou. Ela também **diagnosticou** por que a
coleta das cavas nunca fecha. O que falta é a parte de engenharia: corrigir a
coleta, provar com uma rodada manual e só então religar o cron.

**Escopo desta sessão:**

1. ligar a VM **com ordem do dono** e ler a causa real da morte do `python3`;
2. corrigir memória e o erro de leitura do CBERS no coletor;
3. rodar `limite=10` na mão até sair `manifesto-<STAMP>.json` no Blob;
4. só depois reativar o workflow e o `schedule`;
5. **não** mexer no portal, no canário do `cp-web` nem nos alertas de custo —
   isso é outro assunto e está no anexo.

Leia antes de tocar em qualquer coisa: [PLANO-CAVAS-MVP.md](../../planos/PLANO-CAVAS-MVP.md)
(o plano ativo), [MEDICOES-CAVAS-MINERACAO.md](../planos/MEDICOES-CAVAS-MINERACAO.md)
(todo o histórico medido) e o cabeçalho de
[`scripts/etl/cavas/preparador-cavas.sh`](../../../scripts/etl/cavas/preparador-cavas.sh).

## Estado medido em 30/10/2026

| Item | Valor medido | Onde foi medido |
|---|---|---|
| VM `cp-vm` | `Standard_B2ats_v2`, RG `CP-APP`, `northcentralus` | `az vm list -d` |
| Estado da VM | **deallocated** (desligada) | `az vm get-instance-view` |
| IP público | `52.252.147.150`, Standard estático, ligado à NIC `cp-vmVMNic` | `az network public-ip show` |
| Acesso | usuário `cpadmin`, só chave SSH; NSG libera 22 e 5678 só para `191.185.78.61` | `az vm show`, `az network nsg rule list` |
| Disco do SO | Premium P4, 32 GiB (`Premium_LRS`) | `az disk show` |
| Workflow | `.github/workflows/cavas-preparador.yml` | arquivo |
| Cron antigo | `30 12 * * *` (12:30 UTC = 09:30 BRT) | arquivo (hoje comentado) |
| Estado do workflow | **`disabled_manually`** | `gh workflow list` |
| Última execução | run **40932319914**, 29/10 18:36→20:05 UTC | `gh run list` |
| Resultado da última | `preparar` success, `vigiar` **failure**, `desligar` success | `gh run view` |
| Falha do preparador | `abortado-rc0`, `positivos=141`, `negativos=0`, sem manifesto | heartbeat no Blob |
| Padrão | **todo run agendado desde 18/10 falha** | `gh run list` |
| Custo de outubro | **R$ 241,90** (portal mostrou R$ 239,96 no recorte 1–30/10) | Cost Management |
| Container Apps | **R$ 187,36** (77%) | Cost Management |
| VM (computação) | **R$ 0,00** — medidor `B2ats v2 - Free` | Cost Management |
| Disco + IP da VM | ≈ **R$ 1,27/dia** (P4 + IP, cobrados mesmo desligada) | API + doc de 13/10 |
| Crédito | **US$ 100** (04/10/2026 → 04/10/2027) | portal de créditos |
| Crédito usado em 19/10 | US$ 23,17; restante US$ 76,83 (R$ 401,01) | portal de créditos |

**Leitura curta:** a VM das cavas não é o problema de custo. A computação dela
é gratuita nesse tamanho; o que custa é o disco + IP (≈ R$ 1,27/dia) e,
principalmente, o portal no Container Apps (R$ 187,36 no mês). O problema das
cavas é **técnico**: a coleta não termina.

## O que foi feito nesta sessão

1. **Descoberta da ativação.** A VM não tinha cron próprio. Quem a ligava era o
   GitHub Actions, no workflow `cavas-preparador.yml`, usando o service
   principal **`cp-github-mirror`** por OIDC. O log de atividades mostra sempre
   a mesma identidade (`dffee827-6f29-4513-86de-05453ddaf967`): `Start`,
   `Restart`, `Run Command` e `Deallocate`.
2. **Cron desligado.** `gh workflow disable cavas-preparador.yml -R
   FinweeJur/controle-popular` → estado `disabled_manually`. A VM estava
   `deallocated`; nenhum gasto de computação em curso.
3. **Schedule removido do YAML.** Commit `28924b3a` comentou o bloco
   `schedule` em `.github/workflows/cavas-preparador.yml`, preservando
   `workflow_dispatch`. A intenção é não voltar por engano. O push usou
   `[skip ci]` para não disparar deploy.
4. **Diagnóstico da falha** (seção seguinte): o `python3` é morto (`Killed`) e
   há `RasterioIOError` em imagem CBERS remota; o preparador aborta e o
   `vigiar` falha por não ver manifesto novo.
5. **Alertas de custo** (anexo): budget de R$ 43,50/mês com e-mail em 80%/100%,
   workflow `alerta-custos.yml` no Telegram e RBAC `Cost Management
   Contributor` para o `cp-github-mirror`.
6. **Canário do portal** (anexo): revisão `cp-web--canario` com 0,25 CPU / 0,5
   GiB, 10% do tráfego, `min=0`; monitor `canario-cp-web.yml` testa a cada 30
   min e resume a cada 6 h.

**O que NÃO foi feito:** a coleta das cavas continua quebrada. O cron está
desligado de propósito. Não houve deploy.

## Diagnóstico da falha

### Sintoma no run de 29/10

- `preparar` sobe a VM, espera o guest agent, reinicia e dispara o
  `preparador-cavas.sh`.
- O heartbeat no Blob vai para `abortado-rc0` às 18:59:54, com
  `positivos=141`, `negativos=0`.
- O job `vigiar` espera 72 min por um `manifesto-*.json` que nunca aparece e
  falha. O job `desligar` puxa o fim de `/var/log/preparador-cavas.log` e
  desliga a VM às 20:05 UTC.

### O que o log da VM mostra

O tail vem do próprio job `desligar` (é ele que lê o log antes de desligar).
Trechos medidos:

```
/prep.sh: line 173: 1578 Killed   python3 scripts/coletar-cavas-calibracao.py --tipo positivo --limite "$LIM_POS"
...
alvos: 7667 | ja no checkpoint: 165
alvos ja coletados pulados: 141
leitura falhou: RasterioIOError: '/vsicurl/https://data.inpe.br/bdc/data/CB4A-WPM-L2-DN/2025_12/.../CBERS_4A_WPM_20251219_206_135_L2_BAND2.tif' not recognized as a supported file format.
```

- **`Killed`** é SIGKILL. Na VM `B2ats_v2` (≈ 1 GiB de RAM), a hipótese
  principal é **OOM**: `rasterio` + `numpy` + janelas grandes estouram a
  memória. O log mostra `Killed` em mais de uma rodada (24/10, 25/10, 29/10).
- **`RasterioIOError`** é leitura de TIFF remoto via `/vsicurl`. Uma cena
  específica pode estar indisponível/corrompida ou o formato não é suportado.
  Hoje o erro parece derrubar a rodada em vez de pular a cena.
- **`abortado-rc0`** vem do `trap EXIT` do script: ele grava `abortado-rc${rc}`
  quando `FINALIZOU` ainda é 0. `rc0` significa que o script saiu antes de
  marcar `FINALIZOU=1` — ou que o trap rodou depois de um kill. O tail do log é
  uma **concatenação** de rodadas; para a causa exata, leia o log inteiro dentro
  da VM, não só o tail.
- **`negativos=0`** provavelmente é consequência: a fase de positivos morreu
  antes de chegar aos negativos.

### Como ler o log do último run sem abrir a VM

`gh run view 40932319914 --log-failed` mostra só o job `vigiar` (o que falhou).
O log da VM está no job `desligar`, que **passou**:

```bash
JOB=$(gh run view 40932319914 -R FinweeJur/controle-popular --json jobs \
  --jq '.jobs[] | select(.name=="desligar") | .databaseId')
gh run view 40932319914 -R FinweeJur/controle-popular --job "$JOB" --log
```

### Hipóteses a confirmar na VM

1. **OOM** — `dmesg -T | grep -i -E 'oom|killed'`, `free -m`, `journalctl -k`.
2. **Cena CBERS ruim** — repetir a leitura da URL que falhou; ver se é
   transitória ou permanente.
3. **Checkpoint** — ver se a fase de positivos gravou 141/165 e se os negativos
   chegaram a começar.
4. **Extensão do run-command** — o job `preparar` respondeu success; o problema
   é dentro do processo, não no disparo.

## Caminhos dos arquivos

| Papel | Caminho |
|---|---|
| Workflow do preparador | `.github/workflows/cavas-preparador.yml` |
| Script que roda na VM | `scripts/etl/cavas/preparador-cavas.sh` |
| Coletor (positivos/negativos) | `scripts/coletar-cavas-calibracao.py` |
| Como baixar os recortes do Blob | `scripts/etl/cavas/baixar-recortes-blob.md` |
| Plano ativo das cavas | `docs/planos/PLANO-CAVAS-MVP.md` |
| Plano do globo/cavas | `docs/historico/planos/PLANO-GLOBO-CAVAS-MINERACAO.md` |
| Esteira das cavas | `docs/historico/planos/ESTEIRA-CAVAS.md` |
| Runbook do Camber | `docs/historico/planos/CAMBER-CAVAS-RUNBOOK.md` |
| Todas as medições | `docs/historico/planos/MEDICOES-CAVAS-MINERACAO.md` |
| Estado vivo (B4) | `docs/02-estado/ESTADO.md` (Nota B4 e “Conserto 11/10”) |
| Handoff anterior do Azure | `docs/historico/entregas/HANDOFF-2026-10-04-AZURE-CAVAS.md` |
| Alerta de custo (Telegram) | `.github/workflows/alerta-custos.yml` |
| Monitor do canário do portal | `.github/workflows/canario-cp-web.yml` |
| Dados publicados das cavas | `apps/web/data/cavas-*` |
| Página `/mineracao/cavas` | `apps/web/app/mineracao/cavas/page.tsx` |

## Links úteis

- **Último run das cavas:** https://github.com/FinweeJur/controle-popular/actions/runs/40932319914
- **Workflow no `main`:** https://github.com/FinweeJur/controle-popular/blob/main/.github/workflows/cavas-preparador.yml
- **Commit que comentou o `schedule`:** `28924b3a`
- **Cost Management (análise):** https://portal.azure.com/#view/Microsoft_Azure_CostManagement/Menu/~/costanalysis
- **Créditos:** https://portal.azure.com/#view/Microsoft_Azure_Billing/ModernBillingMenuBlade/Credits
- **Brazil Data Cube / INPE (CBERS):** https://data.inpe.br/bdc/
- **Blob dos recortes:** conta `cpdados4751`, container `cavas` (privado; use `az storage blob list --account-name cpdados4751 --container-name cavas`)
- **Budget criado:** `cp-credito-mensal` (R$ 43,50/mês; e-mail em 80% e 100%)

## Aprendizados

1. **Cron dentro de VM desligada não existe.** Quem ligava a `cp-vm` era o
   GitHub Actions, não um cron da VM. A identidade no log de atividades era o
   service principal `cp-github-mirror`.
2. **O GitHub atrasa o cron.** O agendamento é 12:30 UTC, mas os runs reais
   caíram entre 16:00 e 18:47 UTC. Não conte com horário exato.
3. **O log da VM sai pelo job `desligar`.** `--log-failed` só mostra o `vigiar`.
   Para ler o preparador, pegue o `databaseId` do `desligar` e use `--job`.
4. **A computação da VM é gratuita neste tamanho.** O medidor é
   `B2ats v2 - Free` (R$ 0,0000). O custo fixo é disco + IP (≈ R$ 1,27/dia).
   Trocar para `B2als_v2` (4 GiB) pode sair do medidor gratuito — **remeça**
   antes de assumir que o upgrade é barato.
5. **`Killed` é sinal de OOM, não de código.** Em 1 GiB, `rasterio` + `numpy`
   + janela grande estouram. A correção pode ser reduzir a janela/limite,
   liberar arrays ou subir a VM.
6. **Um TIFF remoto ruim não pode matar a rodada.** `RasterioIOError` deve ser
   tratado por cena (retry/skip/log), não propagado até o `set -e`.
7. **O `vigiar` falhar é o comportamento correto** quando não há manifesto
   novo. Ele é a prova de que a coleta não terminou; não é a causa.
8. **`Cost Management Reader` não basta para a API de consulta.** O papel só
   tem `*/read`; o POST de `query` exige `Microsoft.CostManagement/query/action`.
   Use `Cost Management Contributor` no service principal de automação.
9. **A API de custo dá 429.** Faça retry com espera (20 s) e não dispare em
   rajada.
10. **`[skip ci]` evita deploy acidental.** Push no `main` dispara
    `guara-deploy.yml` (push) e `docs.yml` (paths). Para commits de
    infraestrutura/docs, use `[skip ci]` na mensagem.
11. **O IP da VM é usado.** O NSG libera 22 (SSH) e 5678 (n8n) só para
    `191.185.78.61`; o IP também serve de saída para apt/git/CBERS. Não remova
    sem substituto (NAT gateway ou Bastion).
12. **Disco Premium é caro para o uso.** P4 32 GiB custa US$ 5,28/mês;
    Standard SSD E4 cai para US$ 2,40 e Standard HDD S4 para US$ 1,54.
    A troca exige a VM desligada (ela já está).
13. **O `main` local está sujo.** Trabalhe em worktree (`.claude/worktrees/`),
    stage só os arquivos da tarefa e nunca use `--force`.
14. **O tail do log mistura rodadas.** O `enviar_log` manda o fim do arquivo,
    que acumula execuções. Para a rodada atual, leia o log inteiro na VM.

## Próximos passos (checklist)

> **Regra:** a VM só liga com ordem do dono. O run manual liga a VM e gasta
> disco/IP (a computação é gratuita), mas o custo fixo já existe.

1. **Ler a causa real dentro da VM.** Com a VM ligada:
   ```bash
   free -m
   dmesg -T | grep -i -E 'oom|killed'
   journalctl -k --since '-2 hours' | grep -i -E 'oom|killed'
   tail -n 200 /var/log/preparador-cavas.log
   grep -i -E 'RasterioIOError|Killed|Traceback' /var/log/preparador-cavas.log
   ls -lh /opt/controle-popular/scripts/.cache/cavas-calibracao
   ```
2. **Reproduzir pequeno.** Rodar na mão, observando `free -m` em outra aba:
   ```bash
   cd /opt/controle-popular
   python3 scripts/coletar-cavas-calibracao.py --tipo positivo --limite 5
   python3 scripts/coletar-cavas-calibracao.py --tipo negativo --limite 5
   ```
3. **Corrigir a memória.** Opções, em ordem de custo:
   - reduzir a janela/limite e liberar arrays no coletor;
   - processar uma cena por vez, sem segurar todas as bandas;
   - só então considerar `B2als_v2` (4 GiB) — reMEDIR o custo, porque o
     medidor `Free` pode não valer para o tamanho maior.
4. **Tratar `RasterioIOError` por cena.** Envolver `ler_janela` em try/except,
   pular a cena com log e seguir; não deixar o `set -e` matar a rodada.
5. **Garantir a fase de negativos.** Conferir o checkpoint e o `--tipo
   negativo`; o `negativos=0` atual é suspeita de morte antes da fase.
6. **Provar o fim.** Rodar até aparecer `manifesto-<STAMP>.json` no Blob
   `cpdados4751/cavas`. Sem manifesto, não religue o cron.
7. **Reativar o workflow.**
   ```bash
   gh workflow enable cavas-preparador.yml -R FinweeJur/controle-popular
   ```
   Descomentar o `schedule` no YAML (ou rodar só `workflow_dispatch` com
   `limite=10` até confiar).
8. **Manter o custo sob controle.** O budget `cp-credito-mensal` e o
   `alerta-custos.yml` continuam valendo. O canário do portal é outro assunto;
   não o relacione com a coleta.

## Ações do dono

- Autorizar **ligar a VM** para a leitura do `dmesg`/`free` e a rodada manual
  de `limite=5`.
- Decidir entre **corrigir memória no código** e **subir a VM** (e aceitar o
  custo do tamanho maior).
- Autorizar **religar o cron** só depois de um manifesto novo no Blob.
- Revisar o limite do budget (R$ 43,50/mês) e o canal do alerta.

## Riscos e armadilhas

- **Não use `--force`** em git. O `main` local tem trabalho de outras sessões.
- **Não remova o IP público** sem NAT gateway/Bastion: quebra SSH, n8n e a
  saída para apt/git/CBERS.
- **Não troque o disco com a VM ligada.** A VM precisa estar `deallocated`.
- **Não confunda** o canário do `cp-web` (custo do portal) com a coleta das
  cavas. São frentes separadas.
- **Não trate o `vigiar` failure como causa.** Ele é o mensageiro.
- **Não confie no tail** do log: ele mistura rodadas.
- **Cuidado com o run-command:** ele tem limite de 90 min e pode travar em
  `Conflict`; o canal confiável é o Blob (`progresso-*.json` e
  `log-*.txt`).
- **O `main` remoto anda sozinho** (CI de dados e monitoramento). Faça
  `git fetch` e merge antes de push; nunca force.

## Anexo — custo do portal (fora do escopo das cavas)

Isto foi feito na mesma sessão, mas é sobre o `cp-web`, não sobre a VM:

- **Budget `cp-credito-mensal`**: R$ 43,50/mês, de 01/10/2026 a 31/10/2027,
  avisos por e-mail em 80% (R$ 34,80) e 100% (R$ 43,50) para
  `colito2023@gmail.com`.
- **Telegram `alerta-custos.yml`**: todo dia às 11:00 UTC consulta o
  Cost Management e avisa acima de `CUSTO_ALERTA_BRL` (padrão 43,50). O
  crédito de referência é `CUSTO_CREDITO_BRL` (padrão 521,94).
- **RBAC**: o service principal `cp-github-mirror` recebeu
  `Cost Management Contributor` na assinatura. `Reader` sozinho não permite o
  POST de `query` (só `*/read`).
- **Canário do portal**: revisão `cp-web--canario` com 0,25 CPU / 0,5 GiB,
  `min=0`, `max=1`, 10% do tráfego; base `cp-web--0000057` com 90%. FQDN
  direto da revisão:
  `cp-web--canario.yellowsmoke-cc226486.spaincentral.azurecontainerapps.io`.
- **Monitor `canario-cp-web.yml`**: testa o canário a cada 30 min (HTTP direto,
  memória, reinícios, 5xx) e manda resumo no Telegram a cada 6 h; problema avisa
  na hora. Rollback manual no próprio relatório:
  `az containerapp ingress traffic set -n cp-web -g CP-APP --revision-weight cp-web--0000057=100`.
- **Custo medido**: Container Apps R$ 187,36 (77%), Virtual Network R$ 31,53,
  Storage R$ 22,66, VM R$ 0,00.
