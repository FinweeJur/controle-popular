---
name: cp
description: Handoff de sessão do projeto Controle Popular. Recupera contexto — quanto aos docs de entrada, como montar o worktree, porta própria, comandos prontos e a fila viva. Use ao começar uma sessão nova quando o dono digita "/cp", ou quando o contexto ficou longo e é preciso retomar onde a sessão anterior parou.
---

# Handoff — Controle Popular

Sessão nova, contexto limpo. Este documento te coloca a trabalhar em menos
de 1 minuto. Nada aqui substitui o [AGENTS.md](/AGENTS.md) — este é o
atalho; lá são as regras.

## Passo 1 — leia 3 arquivos, nesta ordem

1. **[AGENTS.md](/AGENTS.md)** — regras duras: commit, dado pessoal,
   worktree, armadilhas. Não negociável.
2. **[docs/02-estado/ESTADO.md](docs/02-estado/ESTADO.md)** — a fila viva
   (blocos A→D) e os bloqueios de hoje.
3. **[docs/planos/PLANO-FILA-PROXIMA-SESSAO.md](docs/planos/PLANO-FILA-PROXIMA-SESSAO.md)**
   — os itens prioritários da vez, ranqueados por dificuldade.

Se a tarefa tocar nisso, leia um por área:

| Área | Documento |
|---|---|
| rotas, payload, banco | [ARQUITETURA.md](docs/04-arquitetura/ARQUITETURA.md) |
| publicar, buildar, deployar | [OPERACAO.md](docs/05-operacao/OPERACAO.md) |
| fonte nova ou coleta | [FONTES.md](docs/06-fontes/FONTES.md) |
| editar conteúdo publicável | [EDICAO.md](docs/07-edicao/EDICAO.md) |

## Passo 2 — ambiente (worktree e porta)

Este PC é o `home-pc`, servidor de produção. Worktree próprio, porta
própria — **nunca anexe no dev de outra sessão** (responde 200 com código
errado, sem avisar).

```bash
git worktree add .claude/worktrees/<nome> -b <nome> origin/main
```

A porta nova fica em `.claude/launch.json` (faixas 3021–3039 e
3901–3912). O `node_modules` entra por **junção** (junction do Windows,
link que não duplica disco), nunca `npm install`:

```powershell
New-Item -ItemType Junction -Path <wt>\node_modules -Target <repo>\node_modules
New-Item -ItemType Junction -Path <wt>\apps\web\node_modules -Target <repo>\apps\web\node_modules
```

## Passo 3 — ferramentas prontas

| Situação | Comando |
|---|---|
| Status do serviço no Guara | `guara services info` |
| Deploy manual no Guara | `guara deploy` (leva ~16 min) |
| Env var de build | `guara env set -b KEY=valor` |
| Logs do Guara | `guara logs` |
| String do Postgres da Neon | `neonctl connection-string production --pooled` |
| Secret no GitHub | `gh secret set NOME --body "..."` |
| Scan de vulnerabilidade | `guara services vulnerabilities` |
| Testes | `npm test` (na raiz); `npx tsc --noEmit` |

Conferir secrets do repositório: `gh secret list --repo FinweeJur/controle-popular`.

## Passo 4 — fila viva (os 3 primeiros)

Abra a [fila do ESTADO.md](docs/02-estado/ESTADO.md#fila-viva). Os itens de
hoje devem estar lá; caso tenha mudado, acate o documento, não este.

## Regras que você não pode esquecer

- **Commit** com `--only <arquivo> -F <arquivo-de-mensagem>`; sem acento;
  trailer `Co-Authored-By`. Nunca `-m` com texto longo.
- **`--force` nunca** (nem push, nem commit).
- **CPF**: varrer o **dado ingerido** antes de commitar dado novo.
- Sessões paralelas: cada agente publica o próprio trabalho; não pegar
  trabalho alheio.
- **Remeça antes de decidir**: número sem data não entra no código.
- O dono lê rápido: no chat, frases até 13 palavras, termo técnico com
  explicação logo depois, analogia quando couber. Emojis funcionam.

## Se travar

| Sintoma | Primeiro passo |
|---|---|
| Deploy do Guara lento ou travado | `guara services info` e `guara logs` |
| Vulnerabilidades | `guara services vulnerabilities` e `npm audit --package-lock-only` |
| Erro 1014 no site | ver item 1 do plano (proxy do Cloudflare no `www`) |
| Página vazia na rota que lê banco | `guara env list` com `-b DATABASE_URL`? |
| `guara security findings` quebra | use `guara services vulnerabilities` |

---

O dono digita `/cp`; você responde com o próximo passo (fila + link) antes
de escrever qualquer linha de código.
