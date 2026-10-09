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

## Estágio atual do repo (medido 09/10/2026)

- **Publicação em duas casas, troca concluída em 07/10:** o
  `www.controlepopular.com.br` serve do **Azure Container Apps** (principal)
  e o `www.controlepopular.tech` aponta para o **Guara Cloud** (secundário).
  Os dois apex vivem de redirect 301 no Cloudflare. O certificado gerenciado
  do Azure está `SniEnabled`.
- **⛔ O Guara estourou a cota do plano Starter** (aviso do dono, 09/10).
  Serviço medido `stopped` com health `crash_loop`; o endpoint público não
  responde e o `guara deploy` fica travado até o ciclo reiniciar. O CLI
  `guara services info` continua respondendo (só o deploy é que trava).
- **Dois caminhos de publicação:**
  - **Azure (principal):** `gh workflow run azure-mirror.yml --ref main`
    (~6 min: build da imagem no CI → GHCR → Container App). Corrigir/renovar
    só o certificado do domínio: `gh workflow run azure-certificado.yml`
    (~1 min, sem build). Trocar os CNAMEs: `gh workflow run trocar-dominios.yml
    -f confirmar=TROCAR`.
  - **Guara (manual):** `guara deploy --project controle-popular` (~17 min da
    cota de 250 min/ciclo). Política: **deploy a cada ~5 dias** — e hoje
    ⛔ bloqueado pela cota estourada. Push na `main` só testa. Detalhe:
    `OPERACAO.md § 0`.
- **Banco: Heroku Postgres** (mudou em 08/10; medido 09/10 por comparação
  de host, nunca de valor):

  | Onde | O que se mediu |
  |---|---|
  | app Heroku | `controle-popular`, add-on `postgresql-rectangular-44619`, plano `heroku-postgresql:essential-0` |
  | secret `DATABASE_URL` | atualizado em 08/10/2026 15:16 UTC |
  | `apps/web/.env.local` | host e nome do banco **idênticos** ao do app Heroku — mesmo banco |

  ⚠️ **`scripts/rotina-local.mts` recusa host que não seja `127.0.0.1`**
  (`exigirBancoLocal()`): a rotina local não pode apontar direto para o
  Heroku. A guarda existe porque um build local já bateu na Neon e levou
  HTTP 402. Se precisar rodar a rotina, é com Postgres local ou com a
  guarda revista **por decisão do dono**.
  A Neon continua na conta em 94%, **sem uso** — sobra desligá-la.
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
- **Páginas de protótipo não commitadas** (decisão pendente do dono):
  `app/prototipo-home/` (ShapeBlur anel + OndaCursor) e `app/prototipo-scroll/`.

## Passo 2 — ambiente (máquina, worktree e porta)

**Descubra em qual PC você está antes de assumir nada** — este skill não
presume máquina. Confira com `tailscale status --json` → `.Self.HostName`.

| Máquina (medido 09/10/2026) | IP Tailscale | Papel |
|---|---|---|
| `DESKTOP-FEFPDDP` | `100.126.160.109` | **self** desta sessão — builda, testa, pusha |
| `Home-PC` | `100.91.10.1` | servidor de produção e do túnel — ⛔ **OFFLINE** desde 08/10 23:38 UTC |
| `Redmi 14C` | `100.80.127.117` | celular, offline desde 09/10 05:01 UTC |

> ⛔ **`Home-PC` offline = transferência Tailscale não sai.**
> `tailscale file cp <arquivo> Home-PC` falha enquanto o par estiver de pé.
> Confira antes de prometer envio: `tailscale status`.

Há **outras sessões ativas**. Worktree próprio, porta própria — **nunca
anexe no dev de outra sessão** (responde 200 com código errado, sem avisar).
Confira com `git worktree list`.

Worktrees medidos em 09/10: `companheiro`, `companheiro-i3`, `cp-bots-lab`,
`cp-ecossistema`, `cp-hero-vivo`, `cp-radio`, `cp-scroll`, `cp-seo`,
`cp-pend-0710` (mais a branch `cp-salvo-ecossistema`).

> ⚠️ **O checkout principal (`main`) pode estar ATRÁS de `origin/main` e com
> alterações não commitadas.** Medido 09/10: `main` em `a1379d9c` (8 de 18
> hotspots) contra `origin/main` em `0d862fdb` (12 de 18), e a skill neste
> arquivo estava **50 linhas adiantadas sem commit**. Remeça com
> `git fetch` antes de decidir; não publique trabalho alheio por engano.

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
| Publicar no Azure (principal) | `gh workflow run azure-mirror.yml --ref main` (~6 min) |
| Só o certificado do domínio | `gh workflow run azure-certificado.yml --ref main` (~1 min) |
| Trocar CNAMEs (Guara ↔ Azure) | `gh workflow run trocar-dominios.yml -f confirmar=TROCAR` |
| Domínio custom no Guara | `guara domains add --domain <host> --project controle-popular --service controle-popular-web-0b4895 -y` |
| Env var de build (Guara) | `guara env set -b KEY=valor` |
| Logs do Guara | `guara logs` |
| Scan de vulnerabilidade | `guara services vulnerabilities` (Trivy) |
| Secret no GitHub | `gh secret set NOME --body "..."` |
| Espelhos do código | GitLab (`git push gitlab HEAD:main`) e Hugging Face, automáticos |
| Testes | `npm test` (na raiz); `npx tsc --noEmit` |
| Docs | `python scripts/validar-documentacao.py` |
| Saúde do código (local) | `cs delta <base> <head> --error-on-warnings` |
| Um arquivo à mão | `cs review <arquivo>` (ou `cs check <arquivo>`) |
| Ajuda do `cs` | `cs docs <tópico>` — `git-hooks`, `code-health-rules`, `custom-quality-gates-template` |
| MCP do CodeScene | `scripts/mcp-codescene.ps1` (sobe o servidor; lê o token do `scripts/.env`) |

> ⚠️ **`gh workflow run` executa o arquivo do REF do repositório remoto**, não o
> seu checkout local. Editar o workflow e disparar antes do `git push` faz a
> rodada usar a versão antiga — sem aviso (medido 06/10/2026).

**CodeScene (ligado em 09/10/2026):** hook `.githooks/pre-commit` barra commit
que piora a saúde; action `codescene-saude.yml` roda o mesmo exame na nuvem no
push e em PR. Regras próprias em `.codescene/code-health-rules.json` (arquivo de
teste não é punido por complexidade). Os dois exigem `CS_ACCESS_TOKEN` —
**pulam sozinhos se faltar**, então clone sem a ferramenta não trava.
Detalhe: [AGENTS.md § 9](/AGENTS.md).

**Banco — Heroku, não Guara:** `neonctl connection-string production --pooled`
ainda funciona, mas o banco de produção é o **Heroku Postgres** (medido 09/10).
⚠️ **`scripts/rotina-local.mts` só aceita `127.0.0.1`** — não aponte a rotina
local para o Heroku; a guarda é proposital (HTTP 402 na Neon, histórico na § 6).

Conferir secrets do repositório: `gh secret list --repo FinweeJur/controle-popular`.

> ⛔ **`guara env list` só com máscara.** Um valor já vazou em print uma vez.
> Nunca cole segredo em chat, commit ou relatório.

## Passo 4 — fila viva (os primeiros)

Abra a [fila do ESTADO.md](docs/02-estado/ESTADO.md#fila-viva). Os itens de
hoje devem estar lá; caso tenha mudado, acate o documento, não este.

Resumo medido em 09/10/2026 (a fonte é o ESTADO, não este resumo):

- **A2** ⛔ **Guara com cota Starter estourada** — serviço `stopped`,
  health `crash_loop`, endpoint público inacessível. Bloqueia o `.tech` e
  qualquer `guara deploy`. Só destrava quando o ciclo reiniciar.
- **A4** 🚧 Fase 4: migração Neon → banco feita; **sobra desligar a conta
  Neon** (ação do dono, fora do terminal).
- **A5** 🚧 SEO (canonical + sitemap) — código em `main`, **espera deploy**.
- **A6** 🚧 Bot do Telegram com 14 links corrigidos (`b9a84e7f`) —
  **espera deploy**.
- **A7** ✅ `PISO_PAGINAS` 1000 → 300 (`df61439a`).
- ⚠️ **Gate de PR do CodeScene falta 1 clique:** o arquivo
  `.codescene/custom-quality-gates.json` está no repo, mas a integração só
  passa a valer quando o dono ligar "automated pull request integration"
  no painel **codescene.io** (projeto 85760). Nem CLI nem MCP abrem essa
  chave.

> ⛔ **Não dispare `guara deploy` por conta própria** — a cota está no
> vermelho e a política é do dono (§ 5.7.1 do AGENTS).

## Continuidade entre PCs (Tailscale)

**Regra de ouro: tudo que está versionado NÃO precisa ser enviado — vem no
`git pull`.** Isso vale para código, docs, skills, hooks e workflows.

O que **não** está no repo e precisa ir por fora, por ser segredo:

| Arquivo | O que carrega |
|---|---|
| `scripts/.env` | `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `TELEGRAM_WEBHOOK_SECRET`, `CS_ACCESS_TOKEN`, `GATILHO_*`, `R2_*` |
| `apps/web/.env.local` | `DATABASE_URL` (Heroku), `HEROKU_API_KEY`, chaves de IA, `CLOUDFLARE_*`, `R2_*` |
| `C:\Users\<user>\.config\opencode\opencode.json` | registro do MCP `codescene` (fora do repo, por máquina) |

**Como enviar** (canal cifrado do Tailscale — a rede privada entre os PCs):

```powershell
tailscale file cp <arquivo> Home-PC:<nome-de-destino>
# exemplo:
tailscale file cp scripts\.env Home-PC:scripts\.env
```

O destinatário retira com `tailscale file get <pasta>`.

> ⛔ **Nunca mande segredo por chat, commit ou print** (AGENTS §5.8).
> O Tailscale é fio privado, não conversa.
> ⚠️ **Só funciona com o par online.** Medido 09/10: `Home-PC`
> (`100.91.10.1`) está **OFFLINE desde 08/10 23:38 UTC** — o envio falha
> até a máquina subir. Confira com `tailscale status` **antes** de prometer.

**Ao chegar numa PC nova, na ordem:**

1. `git config core.hooksPath .githooks` (senão os hooks não rodam);
2. copiar `scripts/.env` e `apps/web/.env.local` (Tailscale);
3. `npx --yes @codescene/codehealth-mcp` uma vez — baixa ~83 MB e some do
   `spawn UNKNOWN`;
4. registrar o MCP no `opencode.json` daquela máquina;
5. `python scripts/validar-documentacao.py` para provar que o clone está são.

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
| Rolagem "não desce mais" no mouse (destrava ao arrastar a barra do navegador) | Lenis dessincronizado — `RolagemSuave.tsx` realinha por `ResizeObserver` + `scroll` nativo |
| Painel que não rola com a roda do mouse | falta `data-lenis-prevent` no contêiner (chat do Seu Nonô, índice do rádio, menu de pets) |
| Overlay do Next acusa erro em código que não existe; página "presa" num build antigo | service worker em dev — `RegistrarServiceWorker` só registra em produção |
| "Encountered a script tag while rendering React component" | `next/script` em página: usar `<script>` cru de componente de servidor |
| Página vazia no espelho do Azure | sem `DATABASE_URL` em runtime (`azure-mirror.yml` liga) — páginas com `unstable_noStore` leem o banco a cada request |
| Resposta do Seu Nonô sobre outro assunto | casamento do `buscarRespostaCurada` (palavras de função) — teste em `escada-determinista.test.ts` |
| Página não responsiva no celular (layout de ~1140 px) | `min-w-max`/largura fixa sem `min-w-0` no ancestral flex |
| Rolagem lateral falsa no celular (~13 px) | brilho com `inset` negativo (BorderGlow) — escondido em `(hover:none)`/tela estreita |
| Deploy do Guara lento ou travado | `guara services info` e `guara logs` |
| Deploy em push vermelho (`No project specified`) | use `--project controle-popular` |
| Vulnerabilidades | `guara services vulnerabilities` e `npm audit --package-lock-only` |
| Erro 1014 no site | proxy do Cloudflare no `www` (ver fila) |
| `guara security findings` quebra | use `guara services vulnerabilities` |
| Espelho do companheiro desatualizado | rode `scripts/sync-companion.mts` |

---

O dono digita `/cp`; você responde com o próximo passo (fila + link) antes
de escrever qualquer linha de código.
