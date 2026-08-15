# Como várias sessões trabalham neste repositório ao mesmo tempo

> Escrito em 15/08/2026, no dia em que **16 worktrees**, duas máquinas e várias
> sessões de assistente mexeram no mesmo repositório — e em que três colisões
> aconteceram de verdade. Isto não é regra de estilo: cada item abaixo tem um
> incidente medido atrás.

## Quem publica o quê

| Quem | Onde trabalha | Quem publica |
|---|---|---|
| Sessão de assistente com worktree próprio | `.claude/worktrees/<nome>` | **ela mesma**, por `rebase` + `push` |
| Sessão iniciada pelo dono (tarefa de fundo) | o checkout principal | **ela mesma** |
| A máquina de build (`home-pc`) | o checkout dela | ela mesma, e é a única que **publica o site** |

**Ninguém integra o trabalho de ninguém.** Não existe um coordenador que
recolhe branches; cada sessão leva o próprio trabalho até `origin/main`. O git
é o ponto de encontro, e a única disciplina que ele exige está abaixo.

## As três regras, e o incidente de cada uma

### 1. Worktree próprio por sessão

**Incidente:** duas sessões trabalharam no mesmo checkout. A segunda rodou
`git commit` e **levou junto as edições da primeira** — duas vezes, com a
mensagem errada, e já pushado quando se percebeu. Pior: as duas escreveram o
**mesmo componente** em paralelo (`RadarSecao.tsx` × `RadarRecente.tsx`), e um
dos dois foi jogado fora.

```bash
git worktree add .claude/worktrees/<nome> -b <nome> origin/main
```

`node_modules` por junção, em vez de `npm install` (segundos, sem duplicar
disco):

```powershell
New-Item -ItemType Junction -Path <worktree>\node_modules -Target <repo>\node_modules
New-Item -ItemType Junction -Path <worktree>\apps\web\node_modules -Target <repo>\apps\web\node_modules
```

### 2. Porta própria por worktree

**Incidente:** o Next 16 **recusa** um segundo dev server para o mesmo
diretório ("Another next dev server is already running"), e anexar no servidor
de OUTRO checkout responde **200 com o código errado, sem avisar** — que é a
pior forma de errar numa verificação.

Cada worktree ganha entrada própria em `.claude/launch.json`. As portas em uso
hoje vão de 3021 a 3033.

### 3. `rebase` + `push`, nunca `--force`

```bash
git fetch origin && git rebase origin/main && git push origin HEAD:main
```

**Incidente:** a máquina de build estava publicando enquanto quatro frentes
tinham commits prontos. Push no meio de um deploy arrisca conflito **na máquina
que publica** — então, durante build/deploy, as sessões **seguram o push**,
commitam localmente e esperam liberação.

`--force` nunca: ele é a única operação capaz de apagar o trabalho de outra
sessão de forma irreversível.

**Conflito no rebase:** se for em `docs/` ou em `.claude/launch.json`, quase
sempre a resolução é **manter as duas versões** — cada frente edita uma seção
ou acrescenta uma entrada, e não há disputa real. Aconteceu duas vezes hoje, e
nas duas as duas versões deviam coexistir. Qualquer outro conflito: **parar e
avisar**, não adivinhar.

## Antes de todo commit

```bash
git diff --cached --name-only   # tem que estar vazio
```

E commitar **por pathspec explícito**, nunca `git commit -a`. `git commit` sem
caminho leva tudo que estiver em *staging* — inclusive o que outra sessão
deixou lá.

⚠️ Arquivo **novo** não entra por `git commit --only`: precisa de `git add`
antes. Nesse caso, conferir o staging depois do `add` e antes do `commit`.

## Antes de afirmar qualquer coisa sobre o repositório

```bash
git fetch && git log --oneline -5
```

**Incidente:** o checkout envelheceu **durante a própria sessão** — mais de uma
vez hoje, e num caso o trabalho já estava mesclado por outra máquina antes de
se tentar publicá-lo. Descrever, planejar ou editar a partir de um checkout
velho produz conclusão errada com toda a aparência de rigor.

## Limpeza

Worktree que já teve o trabalho publicado deve sair:

```bash
git worktree remove .claude/worktrees/<nome>
git branch -d <nome>
```

Havia **16** worktrees em 15/08. A maioria já não tinha trabalho pendente — e
worktree abandonado é onde alguém edita por engano, achando que é o checkout
principal.
