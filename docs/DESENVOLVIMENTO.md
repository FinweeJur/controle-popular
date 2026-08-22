# Desenvolvimento — o fluxo de trabalho deste repositório

Guia operacional: multi-sessão em worktrees, regras de commit, checagem antes do push, uso de IA e verificação. Regras gerais e armadilhas vivem no `AGENTS.md` — este documento remete a ele, não duplica.

## Multi-sessão: worktree próprio por sessão

Cada sessão de assistente (e cada frente de trabalho) opera no **seu** checkout; ninguém integra o trabalho de ninguém — cada um publica o próprio. O git é o ponto de encontro.

| Quem | Onde trabalha | Quem publica |
|---|---|---|
| Sessão de assistente | `.claude/worktrees/<nome>` | ela mesma (rebase + push) |
| Tarefa iniciada pelo dono | checkout principal | ela mesma |
| Máquina de build | checkout dela | ela mesma — e é a única que **publica o site** |

```bash
git worktree add .claude/worktrees/<nome> -b <nome> origin/main
```

`node_modules` por **junção** (segundos, sem duplicar disco), nunca `npm install`:

```powershell
New-Item -ItemType Junction -Path <worktree>\node_modules -Target <repo>\node_modules
New-Item -ItemType Junction -Path <worktree>\apps\web\node_modules -Target <repo>\apps\web\node_modules
```

**Porta própria por worktree.** Cada worktree ganha entrada em `.claude/launch.json` com `--port` próprio (faixas atuais: 3021–3039 e 3901–3912). O Next 16 recusa um segundo dev server para o mesmo diretório, e anexar no servidor de OUTRO checkout responde **200 com o código errado, sem avisar** — a pior forma de errar numa verificação. Ao resolver conflito nesse arquivo: manter as duas entradas e, se pedirem a mesma porta, mover a que chegou para uma livre; validar o JSON **antes** de continuar o rebase:

```bash
node -e "const j=require('./.claude/launch.json');const p=j.configurations.map(c=>c.port);const d=[...new Set(p.filter((v,i)=>p.indexOf(v)!==i))];console.log(d.length?'DUPLICADA: '+d.join(','):'portas ok')"
```

**Confira com `git worktree list`, nunca com `ls`.** Pasta em `.claude/worktrees/` sem `.git` é **órfã**: `git -C <orfao>` sobe a árvore e executa no **checkout principal**, reportando o estado dele como se fosse do órfão. Distinguir antes de acreditar em qualquer `git -C`:

```bash
git worktree list                        # a verdade
test -e .claude/worktrees/<nome>/.git && echo "worktree" || echo "ORFAO"
```

Antes de apagar órfão, confira se só existem lá arquivos exclusivos (`diff -rq --exclude=node_modules --exclude=.next --exclude=.git` e procure `Only in` — arquivos que diferem são esperados, os que só existem lá é que importam).

**Junção e `rm -rf` não se misturam.** `rm -rf` numa junção no Windows pode seguir o link e apagar o `node_modules` do repositório inteiro. Remova o link pelo caminho que não o segue, e confira a contagem do alvo antes e depois:

```powershell
cmd /c rmdir "<caminho-da-juncao>"
```

Limpeza: publicado, o worktree sai — worktree abandonado é onde alguém edita por engano.

```bash
git worktree remove .claude/worktrees/<nome>
git branch -d <nome>
```

## Regras de commit

- **Pathspec explícito, sempre.** `git commit` sem caminho leva tudo que estiver em *staging* — inclusive o que outra sessão deixou lá (aconteceu duas vezes, já pushado). Antes de commitar: `git diff --cached --name-only` tem que estar **vazio**.
- **Arquivo novo não entra por `git commit --only`**: precisa de `git add` antes, e o staging deve ser conferido entre o add e o commit.

```bash
git commit --only <caminho> -F <arquivo-da-mensagem>
```

- **Mensagem por arquivo, com `-F`, nunca `-m`.** Crase dentro de aspas no Bash vira substituição de comando e come o texto (o commit retorna sucesso); here-string de PowerShell deixa `@` sozinho no título. As duas coisas já foram pushadas antes de alguém ver.
- **Sem acento** (o terminal do Windows corrompe), em português: primeira linha diz o efeito, o corpo explica o **porquê** com número medido.
- **Trailer obrigatório** no fim: `Co-Authored-By:`.
- **`--force` nunca** — é a única operação capaz de apagar o trabalho de outra sessão sem volta. Mensagem torta publicada não tem conserto: vira commit novo.

## Antes do push — checklist

| # | Passo | Comando |
|---|---|---|
| 1 | Testes | `npm test` (da raiz; delega ao workspace) |
| 2 | Tipos | `npx tsc --noEmit` |
| 3 | Dado pessoal | roda na suíte; o hook pre-push e a CI rechecam — ligue o hook uma vez por clone: `git config core.hooksPath .githooks` |
| 4 | Atualizar | `git fetch origin && git rebase origin/main` |
| 5 | Publicar o próprio trabalho | `git push origin HEAD:main` |
| 6 | Segurar o push | durante build/deploy da máquina que publica, commite localmente e espere a liberação |

Conflito no rebase: em `docs/` ou no arquivo de launch, quase sempre a resolução é **manter as duas versões**. Qualquer outro conflito: **parar e avisar**, não adivinhar.

**Antes do build (quem testou ao vivo):** derrube o **SEU** `wrangler dev` — `workerd.exe` segura `.open-next/assets` aberto, o `rm -rf` falha com `EBUSY` e o build nunca roda. Mate só os seus processos: confira o `CommandLine` antes de matar (`Get-Process -Name workerd` sozinho não distingue worktrees e mata o da outra sessão).

## Trabalhar com IA

- **Pedidos pequenos.** Perguntas que apontam para o arquivo ("olhe `lib/link-zona.tsx`") custam menos tokens e devolvem mais precisão que "explique este projeto".
- **Peça para confirmar no código.** Decisões não óbvias vivem como comentário no próprio código; a IA os lê junto. Resposta sem citação é suspeita.
- **Nunca confie em status 200 de API.** A API responde 200 e mente: filtro inexistente devolve o catálogo inteiro, `sort` é ignorado em silêncio, código IBGE errado devolve esqueleto vazio com `nome_ibge: null`. **Valide o CONTEÚDO, nunca o status.**
- **Nunca cole segredo na conversa** — nem `DATABASE_URL`, nem nada de `.env`, com nenhum provedor (a jurisdição do provedor muda, o risco não).
- A regra editorial vale dobrado: dois dados verdadeiros lado a lado podem implicar um terceiro, falso. O número vem do dado; o modelo, se houver, só embrulha.

## Grafo de código (code-graph-rag)

Ferramenta opcional para explorar a estrutura do repo por consulta em vez de grep: [`code-graph-rag`](https://github.com/vitali87/code-graph-rag) faz o parsing com Tree-sitter e grava um grafo (Memgraph) + busca semântica (Qdrant) em Docker local. Não faz parte do build nem do CI — é ferramenta de sessão, sob demanda.

**Instalação** (uma vez por máquina; usa `uv tool install`, isolado, não toca em nenhum venv do projeto — ver a armadilha do venv do Hermes no `AGENTS.md`):

```bash
uv tool install cmake                                          # cmake não vem por padrão nesta máquina
uv tool install "code-graph-rag[treesitter-full,semantic]"
```

**Uso:**

```bash
cgr daemon up                                                   # sobe Memgraph (7687) + Qdrant (6333) no Docker
cgr start --repo-path X:\DevCoder\controle-popular --update-graph   # reindexa
```

Repetir `--update-graph` sempre que quiser refletir mudanças recentes — a indexação inteira do monorepo leva ~5-10 min. Consultas Cypher diretas usam o Python do próprio tool (evita instalar `pymgclient` em outro venv):

```bash
"$(uv tool dir)/code-graph-rag/Scripts/python.exe" - <<'PY'
import mgclient
conn = mgclient.connect(host="localhost", port=7687); conn.autocommit = True
cur = conn.cursor()
cur.execute("MATCH (n) RETURN labels(n)[0], count(*) ORDER BY count(*) DESC")
print(cur.fetchall())
PY
```

**Snapshot em 22/08/2026** (repo inteiro, incl. `apps/web`, `etl/*`, `scripts/`): 799 módulos, 3.684 arquivos, 8.412 funções, 110 métodos, 30 classes; 15.401 chamadas de função e 2.939 imports resolvidos no grafo — mais 4.064 embeddings semânticos (`nomic-embed-text` via Ollama local, Qdrant). Módulos mais centrais (mais importados por outros) continuam os utilitários de base: `lib/db/queries/municipios.ts` (111), `lib/betim/format.ts` (86), `lib/betim/staticParams.ts` (63), `lib/betim/cidade.ts` (56) — mexer neles tem raio de impacto amplo. Os mais acoplados (mais imports próprios) são scripts geradores: `scripts/paridade-betim.mts` (37 imports), `scripts/isolamento-cidades.mts` (32) — esperado, são scripts de ETL/build que amarram várias fontes.

*(Número muda a cada reindexação — se for decidir com ele, rode `cgr start --update-graph` de novo antes.)*

## Verificação

```bash
npm test                       # da raiz: vitest (lib/**/*.test.ts) + node:test (globo 3D)
npx tsc --noEmit
```

Medido em 21/08/2026: **57 arquivos, 776 testes no vitest + 137 no globo**. Serve como referência de regressão, não como verdade eterna — se o seu número divergir, **remeça** e explique a diferença antes de concluir.

⚠️ **Contagem de teste envelhece rápido e já circulou em seis versões diferentes** neste repo (247, 401, 601, 681, 699, 741), cada documento citando a sua. Antes de repetir um número daqui, meça:

```bash
npm test                       # da raiz: delega ao workspace, roda vitest + globo
```

E, ao citar, escreva a data ao lado — número sem data é o que produziu as seis versões.

**Armadilha: comentário vira teste, não convicção.** Um comentário errado sobre código IBGE sobreviveu meses e foi copiado para o enunciado de uma tarefa, propagando o erro — quem pegou foi um **teste** que compara código com nome. Comentário errado continua convincente; afirmação sobre comportamento que importa vira teste, não comentário.

## Origem

Documentos absorvidos por esta página (movidos para `docs/_historico/`):

- `docs/_historico/SESSOES-CONCORRENTES.md` — **absorvido** (multi-sessão, worktrees, commit)
- `docs/_historico/ANTES-DO-PUSH.md` — **absorvido** (checklist, hook, dado pessoal)
- `docs/_historico/USAR-COM-IA.md` — **absorvido** (padrões de uso de IA)
- `docs/_historico/worktrees.md` — já histórico; lições (território, migração, build) preservadas na memória do repositório