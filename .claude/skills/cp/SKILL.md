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
   (blocos A→D), os bloqueios e as entregas recentes.
3. **[docs/README.md](docs/README.md)** — o índice da documentação; diz
   qual doc abrir por área.

> ⚠️ O antigo `docs/planos/PLANO-FILA-PROXIMA-SESSAO.md` saiu de `planos/`.
> O arquivo vive em `docs/historico/planos/`. Números de lá são do passado:
> remeça antes de decidir com eles.

Se a tarefa tocar nisso, leia um por área:

| Área | Documento |
|---|---|
| rotas, payload, banco | [ARQUITETURA.md](docs/04-arquitetura/ARQUITETURA.md) |
| publicar, buildar, deployar | [OPERACAO.md](docs/05-operacao/OPERACAO.md) |
| fonte nova ou coleta | [FONTES.md](docs/06-fontes/FONTES.md) |
| editar conteúdo publicável | [EDICAO.md](docs/07-edicao/EDICAO.md) |
| companheiro Seu Nonô (bichinho) | [PLANO-COMPANHEIRO-SEU-NONO.md](docs/planos/PLANO-COMPANHEIRO-SEU-NONO.md) |
| RAG do assistente | [PLANO-RAG-COMPLETO.md](docs/planos/PLANO-RAG-COMPLETO.md) |

## Estágio atual do repo (medido 30/09/2026)

- **Publicação:** o site é a **Guara Cloud** — `www.controlepopular.com.br`.
  O túnel do `home-pc` (`next start -p 3000`) é o **servidor 2**. O Worker
  da Cloudflare é o fallback técnico. A raiz do domínio depende de um
  redirect 301 no Cloudflare (pendência do dono).
- **Deploy é manual** (auto-deploy desligado). `guara deploy` gasta ~17 min
  da cota de 250 min/ciclo. Política do dono: **deploy a cada ~5 dias, no
  máximo**. Push na `main` só testa. Detalhe: `OPERACAO.md § 0`.
- **Banco:** o app aponta para o **Postgres do Guara** (`cp-postgres-597bd0`).
  A Neon continua na conta em 94%, **sem uso** — sobra desligá-la. O
  catálogo do Guara **não tem pgvector** (medido 30/09).
- **RAG do Seu Nonô roda em memória** (397 pedaços). Não usa pgvector nem
  Neon. O desenho em memória é o final; a Fase 5 (Qdrant) foi cancelada.
- **Frentes novas (29–30/09):** `/internacional`, `/eua`, `/canada`,
  `/assembleias`, `/mineracao/cavas`, `/radio`, `/laboratorio`.
- **Companheiro Seu Nonô** (desktop, fork `FinweeJur/clicky-ptbr`):
  `companion/` no monorepo é espelho do fork. **Não edite à mão** — rode
  `scripts/sync-companion.mts`. Rota `/api/companheiro` no ar (I0).
- **Curadas do Seu Nonô:** 91 respostas regeradas pelo RAG, em revisão no
  [REVISAO-CURADAS-2026-09-30.md](docs/planos/REVISAO-CURADAS-2026-09-30.md).
  **Não aplicar no `SeuNonoData.ts` antes do dono revisar** — número errado é dano.

## Passo 2 — ambiente (worktree e porta)

Este PC é o `home-pc`, servidor de produção. Há **outras sessões ativas**.
Worktree próprio, porta própria — **nunca anexe no dev de outra sessão**
(responde 200 com código errado, sem avisar). Confira com `git worktree list`.

Worktrees existentes nesta data: `companheiro`, `cp-bots-lab`,
`cp-ecossistema` (e a branch `cp-salvo-ecossistema`).

```bash
git worktree add .claude/worktrees/<nome> -b <nome> origin/main
```

A porta nova fica em `.claude/launch.json` (faixas **3021–3045** e
**3901–3912**; a maior hoje em uso é 3045). O `node_modules` entra por
**junção** (junction do Windows, link que não duplica disco), nunca
`npm install`:

```powershell
New-Item -ItemType Junction -Path <wt>\node_modules -Target <repo>\node_modules
New-Item -ItemType Junction -Path <wt>\apps\web\node_modules -Target <repo>\apps\web\node_modules
```

## Passo 3 — ferramentas prontas

| Situação | Comando |
|---|---|
| Status do serviço no Guara | `guara services info` |
| Deploy manual no Guara | `guara deploy --project controle-popular` (~17 min) |
| Env var de build | `guara env set -b KEY=valor` |
| Logs do Guara | `guara logs` |
| Scan de vulnerabilidade | `guara services vulnerabilities` (Trivy) |
| Secret no GitHub | `gh secret set NOME --body "..."` |
| Espelhos do código | GitLab (`git push gitlab HEAD:main`) e Hugging Face, automáticos |
| Testes | `npm test` (na raiz); `npx tsc --noEmit` |
| Docs | `python scripts/validar-documentacao.py` |

**Neon (legado):** `neonctl connection-string production --pooled` ainda
funciona, mas o banco de produção é o **Postgres do Guara**. A Neon só
espera o desligamento.

Conferir secrets do repositório: `gh secret list --repo FinweeJur/controle-popular`.

> ⛔ **`guara env list` só com máscara.** Um valor já vazou em print uma vez.
> Nunca cole segredo em chat, commit ou relatório.

## Passo 4 — fila viva (os primeiros)

Abra a [fila do ESTADO.md](docs/02-estado/ESTADO.md#fila-viva). Os itens de
hoje devem estar lá; caso tenha mudado, acate o documento, não este.

Resumo medido em 30/09:

- **A1** 🚧 validar banco no site (`/ambiental/licenciamento`, `/betim/emendas`,
  `/ambiental/copam`) exige `guara deploy` com env de build.
- **A2** ⛔ redirect 301 da raiz no Cloudflare — ação do dono, 2 minutos.
- **A3** 🚧 vulnerabilidades do container (`guara services vulnerabilities`).
- **A4** ✅ migração Neon → Postgres do Guara concluída; sobra desligar a Neon.

## Regras que você não pode esquecer

- **Commit** com `--only <arquivo> -F <arquivo-de-mensagem>`; sem acento.
  Nunca `-m` com texto longo. Confira `git diff --cached --name-only` vazio antes.
- **Trailer sempre com MODELO e PLATAFORMA**, um por linha:

      Co-Authored-By: DeepSeek V4.1 Flash <noreply@deepseek.com>
      Co-Authored-By: opencode <noreply@opencode.ai>

- **`--force` nunca** (nem push, nem commit). `git fetch` → `git rebase origin/main` → push.
- **CPF**: varrer o **dado ingerido** antes de commitar dado novo.
- **Código comentado** (regra 25/09): cabeçalho de arquivo, intenção nas funções,
  o "porquê" e não só o "o quê". PT-BR claro.
- Sessões paralelas: cada agente publica o próprio trabalho; não pegar trabalho alheio.
- **Remeça antes de decidir**: número sem data não entra no código.
- O dono lê rápido: frases até 13 palavras, termo técnico explicado na frente,
  analogia quando couber, emojis para guiar o olho.
- Em etapa longa, avise no Telegram (2–3 linhas) ao fim de cada etapa.

## Se travar

| Sintoma | Primeiro passo |
|---|---|
| Deploy do Guara lento ou travado | `guara services info` e `guara logs` |
| Deploy em push vermelho (`No project specified`) | use `--project controle-popular` |
| Vulnerabilidades | `guara services vulnerabilities` e `npm audit --package-lock-only` |
| Erro 1014 no site | proxy do Cloudflare no `www` (ver fila) |
| Página vazia na rota que lê banco | a env de build tem `DATABASE_URL`? Só `guara deploy` reconstrói |
| `guara security findings` quebra | use `guara services vulnerabilities` |
| Espelho do companheiro desatualizado | rode `scripts/sync-companion.mts` |

---

O dono digita `/cp`; você responde com o próximo passo (fila + link) antes
de escrever qualquer linha de código.
