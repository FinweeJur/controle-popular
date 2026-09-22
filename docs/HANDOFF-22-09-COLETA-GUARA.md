# HANDOFF — coleta Guara + pendência de deploy (22/09)

> **Tipo:** HANDOFF
> **Domínio:** global
> **Última medição:** 2026-09-22
> **Leitura estimada:** curta (< 5 min)
> **Relacionados:** [ESTADO.md](02-estado/ESTADO.md), [AGENTS.md](/AGENTS.md), [OPERACAO.md](05-operacao/OPERACAO.md), [PLANO-FILA-PROXIMA-SESSAO.md](planos/PLANO-FILA-PROXIMA-SESSAO.md)
> **Palavras-chave:** handoff, guara, etl, copam, pncp, licitacoes, contratos, deploy, convenios, proxy

## Sumário

- [Propósito](#propósito)
- [O que já está feito](#feito)
- [Coletas em andamento (22/09 17:17)](#andamento)
- [Como continuar se o PC desligar](#continuar)
- [Próximo passo depois das coletas](#deploy)
- [Armadilhas desta sessão](#armadilhas)

## Propósito

Esta sessão moveu a coleta do Neon (banco cheio, 94%) para o **Postgres do
Guara** e encheu as tabelas vazias do Betim. Se o PC desligar, este arquivo
é o ponto de retomada: não reabrir diagnóstico já feito.

## O que já está feito

| Item | Estado | Como saber |
|---|---|---|
| Banco: `cp-postgres-597bd0` no Guara | ✅ | serviço ato, carga validada |
| `DATABASE_URL` runtime **e** build no Guara | ✅ | `guara env list` → Build=Yes |
| Auth do CLI Guara | ✅ | `gk_live_…` válida; auth `arturcolito@gmail.com` |
| Proxy TCP 15432 (TTL ~30s documentado) | ✅ | scripts commitados `17304c84` |
| `convenios_federais` | ✅ 167 linhas | R$ 298.608.526,57 (Betim 3106705) |
| `ambiental_licenciamento` | ✅ 8.612 | coleta 22/09 |
| `atos_oficiais` | ✅ 10.344 | já no banco |
| MCP portal-transparencia | ⛔ não integrar | chave própria + ETL basta |
| SSH home-pc `.env` | ⛔ cancelado | sem senha; chave nova de TRANSPARENCIA no lugar |
| Commit dos scripts de proxy + gitignore logs | ✅ `17304c84` | `scripts/start-proxy.ps1`, `restart-proxy.ps1`, `test-proxy-session.mjs` |

## Coletas em andamento (22/09 17:17)

Três ETLs detached no `home-pc` (cwd `etl\betim`). Logs na **raiz** do repo
(gitignored).

| ETL | Log | Comando | Situação 17:17 |
|---|---|---|---|
| COPAM | `copam.log` | `python -u -m etl.apis.copam_reunioes --pagina-inicial 1 --pagina-final 454` | 🚧 423+ reuniões / 2222+ itens; pauta descendo (ago/2023) |
| PNCP contratos 2025 | `pncp.log` | `python -u -m etl.pncp.contratos --id-municipio 3106705 --ano-inicio 2025` | 🔄 relançado após 504; `contratos`=655 antes do 2025 |
| PNCP licitações | `licitacoes.log` | `python -u -m etl.pncp.licitacoes --id-municipio 3106705 --ano-inicio 2021` | 🚧 ano 2021, mod. 1 teve RetryError (parcial, re-rodar) |

Contagens no banco (22/09 17:13): `convenios_federais`=167,
`copam_reunioes`=423, `copam_pauta_itens`=2222, `contratos`=655,
`licitacoes`=0, `ambiental_licenciamento`=8612, `atos_oficiais`=10344.

**Tabela se chama `licitacoes` (sem acento).** Query com `licitações` falha.

## Como continuar se o PC desligar

1. Veja se os processos vivem:
   `Get-Process -Id 30312,3544,23140 -ErrorAction SilentlyContinue`
   (COPAM filho python ~30312; contratos ~23140; licitações ~3544 —
   PIDs mudam a cada relance; confira com
   `Get-CimInstance Win32_Process -Filter "Name='python.exe'"`).
2. Se morto, relance o que faltou (mesmo cwd, log na raiz):

```powershell
# contratos 2025 (sobe se morrer; upsert-safe)
Invoke-CimMethod -ClassName Win32_Process -MethodName Create -Arguments @{
  CommandLine='cmd /c cd /d X:\DevCoder\OpenCode\controle-popular\etl\betim && set PYTHONUNBUFFERED=1 && python -u -m etl.pncp.contratos --id-municipio 3106705 --ano-inicio 2025 > ..\..\pncp.log 2>&1'
}
# licitações (re-rode para fechar anos/mods com AVISO)
# mesmo padrão com etl.pncp.licitacoes --ano-inicio 2021
# COPAM: etl.apis.copam_reunioes --pagina-inicial 1 --pagina-final 454
```

3. Contagem rápida (sem acento na tabela):

```bash
node "C:\nodejs\node_modules\@guaracloud\cli\bin\run.js" catalog query \
  --project controle-popular --service cp-postgres-597bd0 --json \
  --query "SELECT 'contratos' t, count(*) n FROM contratos \
  UNION ALL SELECT 'licitacoes', count(*) FROM licitacoes \
  UNION ALL SELECT 'copam_reunioes', count(*) FROM copam_reunioes \
  UNION ALL SELECT 'copam_pauta_itens', count(*) FROM copam_pauta_itens"
```

4. Se o proxy 15432 cair (`FATAL: bouncer config error` / TTL ~30s):
   `scripts/restart-proxy.ps1` (commitado). Sessões remotas: teto 5.

5. PNCP 504 de novo: relançar o mesmo comando — é upsert; não zerar tabela.

## Próximo passo depois das coletas

**Não deployar antes de as 3 coletas terminarem** (ordem do dono, 22/09).

Quando COPAM + contratos 2025 + licitações saírem (EXIT=0 no log / processo
morto sem traceback fatal):

1. Recontar as tabelas (query acima).
2. Suíte + `tsc --noEmit` se for commitar código.
3. **`guara deploy`** no serviço web `controle-popular-web-0b4895` —
   o HTML é `output: 'export'` e congela no build; só a imagem nova com
   `DATABASE_URL` de build re-renderiza as páginas.
4. Conferir no ar:
   - `/betim/emendas` — sair de "Em breve" (gate `configured && ok && length`);
   - `/ambiental/copam` — reuniões/itens;
   - `/betim/prefeitura/contratos` — contratos;
   - `/ambiental/licenciamento` — 8.612 linhas.
5. Push do trabalho próprio:
   `git fetch origin && git rebase origin/main && git push origin HEAD:main`.

**Cadência de deploy:** ~5 dias (política do dono; cota de build Starter).
Não fazer deploy agora se ainda faltar coleta — o dono pediu ir **até o
fim das coletas** antes.

## Armadilhas desta sessão

| Armadilha | Fato |
|---|---|
| Tabela `licitacoes` sem acento | query com `licitações` → SQL_QUERY_EXECUTION_FAILED |
| PNCP 504 | contratos 2025 morreu 1×; retry esgotado no `tenacity` |
| Licitações parcial | AVISO `ano=2021 modalidade=1 interrompida (RetryError)` — re-rodar |
| Só 1 CNPJ da prefeitura | AVISO no contratos — opcional: `etl.pncp.orgaos --id-municipio 3106705 --gravar` |
| Copam `Cannot open empty stream` | AVISO não fatal em Decisão id_fonte |
| Chave Guara no repo | **removida** do `test-proxy-session.mjs` antes do commit `17304c84` |
| Logs na raiz | gitignored em `17304c84` (`proxy.*`, `copam.log`, `pncp.log`, `licitacoes.log`) |

## Origem

Sessão de 22/09/2026: encher Postgres do Guara via CLI Guara, sem SSH.
Pedido do dono: "vá até o final das coletas antes do deploy" e
"salve o trabalho… pra caso o pc desligar".
