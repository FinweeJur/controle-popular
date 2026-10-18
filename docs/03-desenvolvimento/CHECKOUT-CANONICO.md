# Checkout canônico — um só lugar para o código

> **Tipo:** DESENVOLVIMENTO
> **Domínio:** global (checkout, worktree, clones, arquivamento)
> **Última medição:** 2026-10-18
> **Leitura estimada:** curta (< 5 min)
> **Relacionados:** [AGENTS.md](/AGENTS.md), [DESENVOLVIMENTO.md](DESENVOLVIMENTO.md), [SETUP-LOCAL.md](SETUP-LOCAL.md), [OPERACAO.md](../05-operacao/OPERACAO.md)
> **Palavras-chave:** checkout, canonico, clone, worktree, git, bundle, arquivo, x-devcoder, c-users, limpeza

## Sumário

- [Regra](#regra)
- [Caminho canônico](#caminho-canônico)
- [O que nunca fazer](#o-que-nunca-fazer)
- [Sessão nova](#sessão-nova)
- [Worktree nova](#worktree-nova)
- [Worktree concluída](#worktree-concluída)
- [Arquivar um clone antigo](#arquivar-um-clone-antigo)
- [Agentes, MausBot e Telegram](#agentes-mausbot-e-telegram)
- [Prompt pronto](#prompt-pronto)
- [O que não é código](#o-que-não-é-código)
- [Estado em 18/10/2026](#estado-em-18102026)

## Regra

**Código mora só em `X:\DevCoder`.** Um checkout canônico. Worktrees dentro
dele. Nada de clone em `C:\Users\...` nem em pasta de outro projeto.

Motivo medido: em 18/10/2026 existiam três clones do portal — um em
`X:\DevCoder`, um em `X:\DevCoder\OpenCode` e um em `C:\Users\teste` — com
commits e estados diferentes. Sessão que abre no clone errado commita no
lugar errado e o push parece certo.

## Caminho canônico

```
X:\DevCoder\controle-popular
```

É o caminho que o MausBot (bot Dev), o opencode e o Telegram devem usar.
O `X:\DevCoder\OpenCode\controle-popular` é clone de sessão antiga e deve
ser arquivado quando as sessões que o usam terminarem.

No **home-pc** o canônico é `C:\DevCoder\controle-popular` — a máquina não
tem `X:`. É a única exceção à regra; o nome da pasta é o mesmo (`DevCoder`).

## O que nunca fazer

- Clonar em `C:\Users\teste\...` ou em `C:\DevCoder\...`.
- Rodar `git commit`/`push` em clone que não seja o canônico.
- Apagar clone sem `git bundle` antes.
- Remover worktree com arquivo não commitado sem zip/bundle.

## Sessão nova

```powershell
cd X:\DevCoder\controle-popular
git fetch origin
git status -sb
git worktree list
```

Se `main` estiver atrás: `git merge --ff-only origin/main`.
Se houver 2+ sessões: abra worktree, nunca anexe no dev server de outra.

## Worktree nova

```powershell
git worktree add .claude/worktrees/<nome> -b <nome> origin/main
```

A porta vai em `.claude/launch.json` (faixas 3021–3045 e 3901–3912).
`node_modules` entra por junção do Windows, nunca `npm install` dentro do
worktree.

## Worktree concluída

O trabalho só é considerado concluído quando está **no GitHub**. O rito:

```powershell
# 1. garante que a branch está commitada e pushada como arquivo
git push origin refs/heads/<branch>:refs/heads/archive/<AAAA-MM-DD>/<branch>

# 2. remove a worktree
git worktree remove --force .claude/worktrees/<nome>

# 3. remove a branch local
git branch -D <branch>

# 4. limpa registro órfão
git worktree prune
```

Se a worktree tiver arquivo não commitado, antes do passo 2:
zipar em `X:\DevCoder\_backup-git\` ou commitar na branch e pushar.

## Arquivar um clone antigo

```powershell
# 1. bundle com todos os refs
git -C <clone-antigo> bundle create X:\DevCoder\_backup-git\<nome>-<data>.bundle --all

# 2. confirmar que o clone está limpo
git -C <clone-antigo> status --porcelain

# 3. remover a pasta
Remove-Item -LiteralPath <clone-antigo> -Recurse -Force
```

O bundle é a garantia. Só apague depois de conferir que `origin/main` tem
tudo que importa.

## Agentes, MausBot e Telegram

- **opencode:** abrir a sessão em `X:\DevCoder\controle-popular`.
- **Skill `/cp`:** aponta o canônico e manda remeçar com `git fetch`.
- **MausBot:** o app vive em `X:\DevCoder\OpenMausBot`. Os dados ficam em
  `X:\DevCoder\OpenMausBotData`, escolhidos pela variável `OMB_DATA_DIR`
  (persistente com `setx OMB_DATA_DIR "X:\DevCoder\OpenMausBotData"`).
  Cada bot que mexe em código usa `cwd` canônico.
- **Estado antigo do MausBot:** `C:\Users\teste\.openmausbot` ficou travado
  pelo Bitdefender (erro `EPERM` ao renomear `bots.json`). Só leia, copie ou
  remova depois de abrir exceção no antivírus.
- **Telegram / home-pc:** o canônico lá é `C:\DevCoder\controle-popular`
  (máquina sem `X:`). O gatilho remoto e o túnel usam esse caminho.

## Arquivos travados por antivírus

Sintoma: `EPERM: operation not permitted, rename ... -> bots.json` ou
`window-state.json`, mesmo com o app fechado.

- Não é permissão: as ACLs estão certas.
- É um lock externo (Bitdefender). O serviço `VSSERV` é protegido e não para
  pelo terminal.
- Saída imediata: apontar o app para outro data dir com `OMB_DATA_DIR`.
- Correção durável: exceção no Bitdefender para
  `C:\Users\teste\.openmausbot` e `C:\Users\teste\AppData\Roaming\openmausbot`,
  depois reiniciar o app.

## Prompt pronto

Texto para colar em sessão nova, bot ou Telegram:
[PROMPT-SESSAO-NOVA.md](PROMPT-SESSAO-NOVA.md).

## O que não é código

Pode ficar em `C:\Users\teste`:

- `C:\Users\teste\.config\opencode` — configuração do agente;
- `C:\Users\teste\.local\share\opencode` — banco e cache do opencode;
- `C:\Users\teste\.claude` — transcrições e skills globais;
- `C:\Users\teste\.openmausbot` — estado do MausBot;
- `C:\Users\teste\AppData` — cache de npm, uv e temp.

Esses caminhos não são checkout. Não precisam ir para `X:`.

## Estado em 18/10/2026

- **Canônico:** `X:\DevCoder\controle-popular`, em `origin/main`.
- **Removido:** `C:\Users\teste\controle-popular`; bundle em
  `X:\DevCoder\_backup-git\controle-popular-users-teste-20261018.bundle`.
- **Worktrees:** 9 concluídas arquivadas em
  `origin/archive/2026-10-18/<branch>` e removidas; protótipos do
  `cp-hero-vivo` zipados em `X:\DevCoder\_backup-git\`.
- **Pendente:** o clone `X:\DevCoder\OpenCode\controle-popular` é a sessão
  ativa; arquivar quando as sessões que o usam fecharem.

## Decisões registradas

1. **18/10/2026 — um checkout canônico em `X:\DevCoder\controle-popular`.**
   Fim dos três clones.
2. **18/10/2026 — worktree concluída vira `archive/<data>/<branch>` no
   GitHub.** Branch local e pasta só somem depois do push.
3. **18/10/2026 — clone antigo só sai com bundle.** Arquivar não é apagar.
4. **18/10/2026 — estado de ferramenta fica em `C:\Users`.** Só código vai
   para `X:\DevCoder`.
