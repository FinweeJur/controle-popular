# Mapa de caminhos — esta máquina (home-pc)

> **Tipo:** OPERACAO
> **Domínio:** operacao
> **Última medição:** 2026-09-01
> **Leitura estimada:** curta (< 5 min)
> **Relacionados:** [OPERACAO.md](OPERACAO.md), [ESTADO.md](../02-estado/ESTADO.md), [GATILHO-REMOTO.md](GATILHO-REMOTO.md)
> **Palavras-chave:** caminhos, maquina, home-pc, producao, deploy, backup, compactar

## Sumário

- [Esta máquina É o home-pc](#esta-máquina-é-o-home-pc)
- [Caminhos principais](#caminhos-principais)
- [Como buildar e publicar (manual)](#como-buildar-e-publicar-manual)
- [Como reiniciar o next start](#como-reiniciar-o-next-start)
- [Backup / compactação](#backup--compactação)
- [Armadilhas medidas](#armadilhas-medidas)

## Esta máquina É o home-pc

**C:\DevCoder\controle-popular é a máquina de PRODUÇÃO** (o "home-pc" citado no
ESTADO.md). O site controlepopular.com.br é servido daqui:

- `next start -p 3000` serve `C:\DevCoder\controle-popular\apps\web` (o `.next`
  da última build);
- o tráfego chega via **Cloudflare Tunnel** (`controle-popular`), processo
  `cloudflared` independente;
- o banco é o **Postgres local** em `127.0.0.1:5432`, database `controle_popular`.

Qualquer build/deploy feito em outro lugar não muda o site — o que vale é o
`.next` desta pasta.

## Caminhos principais

| O quê | Caminho |
|---|---|
| Repositório (casa do código e do site) | `C:\DevCoder\controle-popular` |
| App web (Next.js) | `C:\DevCoder\controle-popular\apps\web` |
| Node do hermes (usado nos scripts de produção) | `C:\Users\Home\AppData\Local\hermes\node\node.exe` |
| Postgres local | `127.0.0.1:5432` / db `controle_popular` (credencial em `apps/web/.env.local`) |
| Secrets (nunca versionados) | `scripts/.env` (Telegram, R2, DB), `apps/web/.env.local` (Cloudflare, AI, DB) |
| Rotina de deploy (ETL → build → deploy, agendada) | `scripts/rotina-local.mts` (ver [OPERACAO.md](OPERACAO.md)) |
| Reinício manual do site | `restart-next-start.ps1` (raiz) |
| Rotinas noturnas (Agendador de Tarefas) | `scripts/executar-rotina-*.ps1` |
| Logs da rotina | `C:\DevCoder\controle-popular\logs` |
| Worktree de deploy (build limpa a partir do origin/main) | `C:\DevCoder\_deploy` (usa junções de `node_modules` — ver armadilhas) |
| Backup/compactação | `scripts/compactar-backup.cmd` (ver abaixo) |

## Como buildar e publicar (manual)

```cmd
cd C:\DevCoder\_deploy\apps\web
npm run build
```

- O prebuild gera cidades, índice de busca (`/busca-indice`), proveniência do
  globo e os 14 datasets da API v1; o `next build --webpack` tipa e pré-renderiza
  ~4.880 páginas lendo o Postgres local (leva ~15 min).
- Depois de buildar, reiniciar o servidor (abaixo). O deploy em produção usa
  `scripts/rotina-local.mts` com a trava de contagem de páginas (recusa publicar
  abaixo do piso).

## Como reiniciar o `next start`

```powershell
# parar o atual (achar o PID na porta 3000: netstat -ano | findstr :3000)
Stop-Process -Id <PID> -Force
# subir de novo a partir do build desejado
Start-Process -FilePath "C:\Users\Home\AppData\Local\hermes\node\node.exe" `
  -ArgumentList "C:\DevCoder\_deploy\node_modules\next\dist\server\lib\start-server.js","start","-p","3000" `
  -WorkingDirectory "C:\DevCoder\_deploy\apps\web" -WindowStyle Hidden
```

Verificação: `curl -s -o NUL -w "%{http_code}" http://localhost:3000` → 200, e a
contagem de páginas em `apps/web/.next/prerender-manifest.json` (acima de 1.000 =
banco foi lido; ~21 = build sem banco).

## Backup / compactação

`scripts/compactar-backup.cmd` gera um `.zip` em `C:\Backups\` com o repositório
sem `node_modules`, `.next`, `.git`, `logs` e `.claude` (usa o `tar` do Windows):

```cmd
C:\DevCoder\controle-popular\scripts\compactar-backup.cmd
```

Para incluir também o worktree de deploy (`.next` de produção): zipar
`C:\DevCoder\_deploy\apps\web\.next` à parte, se quiser um artefato executável.

## Armadilhas medidas

- **Worktrees `C:\DevCoder\_cp-*` bloqueiam junção de `node_modules`** (acesso
  negado ao criar/atravessar). Para buildar um worktree, usar um caminho novo
  (ex.: `C:\DevCoder\_deploy`) — a junção (`mklink /J`) funciona lá.
- O `python` do PATH é o venv do hermes-agent; os scripts do Agendador usam
  `py -3` (launcher do system32) de propósito — não confiar no `python` do PATH.
- `apps/web/.env.local` e `scripts/.env` são locais; uma cópia do repo sem eles
  não builda (falta `DATABASE_URL`) nem envia Telegram (falta o token).
