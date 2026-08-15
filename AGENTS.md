# AGENTS.md — o que qualquer agente precisa saber antes de tocar neste repositório

> Lido automaticamente por opencode e por outros agentes de terminal.
> Escrito em 15/08/2026, no fim de um dia com 15 commits, 6 agentes em paralelo
> e três incidentes reais. **Cada regra abaixo tem uma medição ou um estrago
> atrás — nenhuma é preferência de estilo.**

## O que é este projeto

Portal cívico de transparência (**controlepopular.com.br**), monorepo Next.js 16
com `output: export` para Cloudflare Workers. Seis frentes: Cidades, Congresso,
Judiciário, Função Social da Terra, Paraopeba e Ambiental.

**Não é um site comum.** É lido por quem está sob estresse — denúncia, remoção,
barragem. Isso muda o padrão de qualidade em três pontos concretos:
acessibilidade não é opcional, número errado é dano, e **insinuação é dano
mesmo quando cada dado isolado está certo**.

## Por onde começar a ler

`docs/` tem **8 documentos na raiz** (curadoria de 16/08) + `planos/` (o que
está por fazer) + `_historico/` (entregue, só arqueologia). **Ninguém precisa
ler tudo. Nunca.**

| Arquivo | Quando |
|---|---|
| **`docs/PRODUTO.md`** | sempre — é a porta: o que é o portal, frentes, regras editoriais |
| `docs/ESTADO.md` | a fila viva, ranqueada por custo × benefício, e os bloqueios |
| `docs/DESENVOLVIMENTO.md` | **antes do primeiro commit** — worktrees, commit, push |
| `docs/FONTES.md` | mexer em fonte ou dado coletado |
| `docs/ARQUITETURA.md` | mexer em rota, payload ou banco |
| `docs/OPERACAO.md` | publicar, coletar, buildar |
| `docs/EDICAO.md` | editar conteúdo sem código |

## Os dois tetos que mandam na arquitetura

1. **Cloudflare Workers: 25 MiB por asset**, 3 MiB gzip de bundle, 20.000 arquivos.
2. **Neon (Postgres) em HTTP 402 até 2026-09-01.** Sem banco não há `next build`.
   Quem publica é a máquina `home-pc`, que tem Postgres local. Esta máquina
   **não** consegue buildar nem medir `.cache`.

Consequência prática: se sua tarefa depende de medir tamanho de rota ou de ler
o banco, **você não vai conseguir hoje**. Diga isso em vez de estimar.

## ⛔ Regras que não se negociam

### 1. Coleção nunca vai como props de componente de cliente

Foi assim que `/ambiental/legislacao` chegou a **35,5 MiB** contra o teto de 25.
O texto real das ementas dava 4,7 MiB — **inflação de 7,5×**, porque o payload
é serializado três vezes (HTML, RSC flight e `segmentData`) e cada linha repete
o nome de todos os campos.

Acima de ~2 mil linhas: ou serve do índice fatiado, ou pagina no servidor.
**Onze listas em onze rotas já usam `apps/web/app/[municipio]/components/TabelaEstatica.tsx`**
(medição em 16/08 — remeça antes de decidir com ele) — siga uma delas, não invente mecanismo novo.

### 2. Dado pessoal: varrer o DADO, não só o código

Em 15/08 este repositório público publicou **CPF real de pessoa física** duas
vezes, por dois caminhos diferentes:

- dentro da **ementa oficial** de um TAC do IBAMA (o ato público trazia o dado);
- **215 CPFs colados ao NOME** no acervo da Lei Rouanet — a fonte mascarava o
  campo de documento e o número ia por extenso no campo ao lado.

A lição: **guarda que olha uma lista de campos suspeitos falha.** Varra todo
campo de texto de todo registro. `apps/web/lib/sem-cpf-no-repo.test.ts` valida
por mod-11; rode a suíte **antes** de commitar dado coletado.

### 3. `--force` nunca

É a única operação capaz de apagar trabalho de outra sessão sem volta. Como
consequência: **mensagem de commit publicada torta não tem conserto.** Ver a
regra 6.

### 4. Worktree próprio, porta própria

```bash
git worktree add .claude/worktrees/<nome> -b <nome> origin/main
```

`node_modules` por junção (PowerShell), nunca `npm install`:

```powershell
New-Item -ItemType Junction -Path <worktree>\node_modules -Target <repo>\node_modules
New-Item -ItemType Junction -Path <worktree>\apps\web\node_modules -Target <repo>\apps\web\node_modules
```

Cada worktree ganha entrada própria em `.claude/launch.json` com porta própria.
**Anexar no dev server de outro checkout responde 200 com o código errado, sem
avisar** — a pior forma de errar numa verificação.

### 5. Commit por pathspec explícito

```bash
git diff --cached --name-only   # tem que estar vazio ANTES
git commit --only <caminho> -F <arquivo-de-mensagem>
```

`git commit` sem caminho leva tudo que estiver em *staging*, **inclusive o que
outra sessão deixou lá** — aconteceu duas vezes, já pushado quando se percebeu.
Arquivo novo precisa de `git add` antes.

### 6. Mensagem de commit por ARQUIVO, nunca `-m`

Crase dentro de aspas duplas no Bash **vira substituição de comando** e come o
texto, com `git commit` retornando sucesso. Here-string de PowerShell (`@'...'@`)
usada no Bash deixa `@` sozinho no título. As duas coisas aconteceram em 15/08 e
**as duas foram pushadas antes de alguém ver**.

Escreva a mensagem num arquivo e use `git commit -F`. Em português, **sem
acento** (convenção do repositório), terminando com o trailer `Co-Authored-By`.

### 7. Publique o próprio trabalho

```bash
git fetch origin && git rebase origin/main && git push origin HEAD:main
```

**Ninguém integra o trabalho de ninguém.** Não existe coordenador que recolhe
branches. Durante build/deploy na máquina que publica, **segure o push**.

## 🪤 Armadilhas que já custaram tempo

| Armadilha | O que acontece |
|---|---|
| **`git -C` em pasta órfã** | pasta em `.claude/worktrees/` sem `.git` faz o comando subir e executar **no checkout principal**. Sete pastas assim em 15/08, e as sete reportavam o estado do principal como se fosse delas. Confira com `git worktree list`, não com `ls` |
| **`rm -rf` em junção do Windows** | pode seguir o link e apagar o `node_modules` do repositório inteiro. Remova o link com `cmd /c rmdir` primeiro |
| **Conflito em `.claude/launch.json`** | quase sempre "manter as duas versões" — **exceto quando as duas pedem a mesma porta**. E são **três** marcadores: onde estava `=======` precisa entrar `},` e `{`, senão o JSON quebra |
| **API responde 200 e mente** | filtro inexistente devolve o catálogo inteiro; `sort` é ignorado em silêncio; código IBGE errado devolve esqueleto vazio com `nome_ibge: null`. **Valide o CONTEÚDO, nunca o status** |
| **Código IBGE de 6 × 7 dígitos** | o de 6 é o de 7 **sem o dígito verificador**. Betim é `3106705`/`310670`; `3106200` é **Belo Horizonte** |
| **Casar município por nome** | grafia diverge entre tabelas oficiais (caixa alta, acento inconsistente). **Case por código**, e relate o que não casou em vez de forçar |
| **`cmd.exe` não expande `*`** | `npm` roda script por `cmd.exe /d /s /c`; glob em script de teste chega literal. Use diretório, não glob |
| **Medir cor em HSL** | `css/tokens/colors.css` declara a paleta em **OKLCH**. Medir no espaço errado inverte a conclusão com toda a aparência de rigor |
| **Contraste com transição congelada** | `globals.css` tem `transition: background .3s` no `body`; sem compositing, `getComputedStyle` devolve a cor velha. Injete `transition:none !important` antes de medir |

## 🧭 A regra editorial, que é a mais fácil de violar sem perceber

O portal republica ato oficial e dado público. **A tentação constante é pôr dois
dados verdadeiros lado a lado e deixar o leitor concluir um terceiro, falso.**

Casos reais deste repositório, e como foram resolvidos:

- **Repasse do Acordo**: 827 das 853 cidades não têm relação com a bacia. A tela
  diz com todas as letras que **receber o valor não significa ter sido atingida**,
  e mostra população ao lado do valor para não sugerir proporcionalidade que a
  lei não seguiu.
- **Incentivador × fornecedor**: aparecer nos dois acervos **não é troca de
  favor**. A junção é ponto de partida para investigar, não achado.
- **`total_doado` da Rouanet** é do Brasil inteiro. Exibi-lo ao lado de um
  contrato municipal sugere que o dinheiro foi para ali. A ressalva viaja colada
  ao número, ou o número não vai.
- **Resumo gerado por modelo** é **o portal afirmando algo**. Rotule como
  gerado por máquina, com data e modelo, e **nunca** apresente como conclusão do
  autor do documento.
- **Lacuna é informação.** Publicar só o que tem valor faz a cobertura parecer
  completa. Diga quantos itens vieram vazios.

E a regra que resume: **o número vem do dado; o modelo, se houver, só embrulha.**
Se a fonte não tem, a resposta é "não sei, e aqui está o que existe perto".

## Como verificar

```bash
cd apps/web && npm test        # vitest (lib/**/*.test.ts) + node:test (globo 3D)
npx tsc --noEmit
```

Baseline em 15/08 à noite: **601 testes no vitest + 121 no globo**.

Armadilha que vira teste, não comentário: em 15/08 um comentário errado sobre o
código IBGE sobreviveu meses e foi **copiado para o enunciado de uma tarefa**,
propagando o erro. Quem pegou foi um teste que compara código com nome. O
comentário estava errado e continuava convincente.

## Onde as coisas moram

```
apps/web/app/         rotas (App Router). *.din.ts só existe no alvo Cloudflare
apps/web/lib/         lógica pura + testes ao lado (padrão: <mod>.ts + <mod>.test.ts)
apps/web/lib/db/      Drizzle: schema.ts e queries/ (Postgres)
apps/web/data/        dado versionado, lido no build — compacte antes de commitar
scripts/              coletores e rotinas (rotina-local.mts publica)
docs/                 ver LEIA-PRIMEIRO.md
```

**Compactação de dado**: `apps/web/lib/comunicabr/arquivo.ts` e
`apps/web/lib/estatico/compactar.ts` — esqueleto + rótulos internados. Fez 853
municípios caberem em 2,16 MB, e 7,9 MB da Rouanet virarem 2,4 MB (−69%).
⚠️ São **duas** implementações da mesma técnica com formatos diferentes — por
**decisão documentada** (16/08) **não unificar**: aplainar o codec do ComunicaBR
perderia o ganho de ordem de grandeza (99 MiB → 2,16 MB). Remeça antes de reabrir.

## Coleta de dado de fonte pública

- Pausa entre requisições, **User-Agent que identifica o projeto honestamente**
  (nunca UA de navegador falso), retomada por checkpoint, e **fora da CI**.
- Leia o `robots.txt` e **registre a decisão no cabeçalho do coletor** quando
  optar por seguir mesmo assim — há um caso desses no repositório
  (`www18.fgv.br` responde `Disallow: /`), feito a pedido do dono, com escopo
  reduzido e o raciocínio escrito.
- Varra dado pessoal **antes** de commitar. Sempre.
