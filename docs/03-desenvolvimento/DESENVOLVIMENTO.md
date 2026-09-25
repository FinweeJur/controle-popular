# DESENVOLVIMENTO — fluxo de trabalho deste repositório

> **Tipo:** DESENVOLVIMENTO
> **Domínio:** global
> **Última medição:** 2026-09-19
> **Leitura estimada:** media (5-15 min)
> **Relacionados:** [AGENTS.md](/AGENTS.md), [ESTADO.md](../02-estado/ESTADO.md), [OPERACAO.md](../05-operacao/OPERACAO.md)
> **Palavras-chave:** worktree, commit, push, testes, typescript, IA, verificacao, code-graph-arag

## Sumário

- [Propósito](#propósito)
- [Multi-sessão: worktree próprio por sessão](#multi-sessão-worktree-próprio-por-sessão)
- [Regras de commit](#regras-de-commit)
- [Antes do push — checklist](#antes-do-push-checklist)
- [Trabalhar com IA](#trabalhar-com-IA)
- [Grafo de código](#grafo-de-código)
- [Padrão das Seis Qualidades da Informação Cívica](#padrão-das-seis-qualidades-da-informação-cívica)
- [Padrão de Código e Comentários Explicativos](#padrão-de-código-e-comentários-explicativos)
- [Verificação](#verificação)
- [Origem](#origem)

## Propósito

Guia operacional para todos os agentes de código here.
Regras duras (dado pessoal, privacy, `--force`) ficam no
[AGENTS.md](/AGENTS.md) — este documento só remete, não duplica.

## Multi-sessão: worktree próprio por sessão

O trabalho é concorrente: várias sessões operam em paralelo, o Git é o ponto
de encontro. Cada sessão opera no **seu** checkout (cópia de trabalho),
com worktree próprio (checkout anexo ao mesmo repositório, sem clonagem):

| Quem | Onde trabalha | Quem publica |
|---|---|---|
| Sessão de assistente | `.claude/worktrees/<nome>` | ela mesma (rebase + push) |
| Tarefa do dono | checkout principal | ela mesma |
| Máquina de build | checkout dela | ela, e é a única que publica o site |

```bash
git worktree add .claude/worktrees/<nome> -b <nome> origin/main
```

**`node_modules` por junção** (junction = link do Windows que não duplica
disco), nunca `npm install`:

```powershell
New-Item -ItemType Junction -Path <wt>\node_modules -Target <repo>\node_modules
New-Item -ItemType Junction -Path <wt>\apps\web\node_modules -Target <repo>\apps\web\node_modules
```

**Porta própria por worktree.** Entrada em `.claude/launch.json` com `--port`
próprio. Faixa atual: 3021–3039 e 3901–3912. Anexar no dev server de outro
checkout responde **200 com código errado, sem avisar** — a pior forma de errar.
Ao resolver conflito no `launch.json`: manter as duas entradas; mesmas portas
= mover uma para livre; validar o JSON antes de continuar:

```bash
node -e "const j=require('./.claude/launch.json');const p=j.configurations.map(c=>c.port);const d=[...new Set(p.filter((v,i)=>p.indexOf(v)!==i))];console.log(d.length?'DUPLICADA: '+d.join(','):'portas ok')"
```

**Confirem com `git worktree list`, não com `ls`:**

```bash
git worktree list                                             # a verdade
test -e .claude/worktrees/<nome>/.git && echo worktree || echo ORFAO
```

**Órfão:** pasta sem `.git`; `git -C <orfanado>` sobe a árvore e roda no
**checkout principal**. Confira se há arquivos exclusivos antes de apagar:

```bash
git worktree remove .claude/worktrees/<nome>
git branch -d <nome>
```

**Junção e `rm -rf` não se misturam.** `rm -rf` numa junção no Windows pode
seguir o link e apagar o `node_modules` do repo inteiro.
Remova o link pelo caminho que não o segue:

```powershell
cmd /c rmdir "<caminho-da-juncao>"
```

## Regras de commit

- **Pathspec explícito, sempre.** `git commit` sem caminho leva tudo que
  estiver em *staging* — inclusive o que outra sessão deixou lá
  (aconteceu duas vezes, já pushado). Antes de commitar:
  `git diff --cached --name-only` deve estar **vazio**.
- **Arquivo novo não entra por `--only`:** `git add` antes, conferir o
  staging, depois commitar.

```bash
git commit --only <caminho> -F <arquivo-da-mensagem>
```

- **Mensagem por arquivo (`-F`), nunca `-m`.** Crase dentro de aspas no Bash
  vira substituição de comando e come o texto (o commit retorna sucesso).
  Here-string de PowerShell deixa `@` sozinho no título.
  As duas já saíram pushadas antes de alguém ver.
- **Sem acento** (o terminal do Windows corrompe), em português.
- **Trailer obrigatório:** `Co-Authored-By:` no fim.
- **`--force` nunca** — é a única operação que apaga trabalho de outra sessão.

## Antes do push — checklist

| # | Passo | Comando |
|---|---|---|
| 1 | Testes | `npm test` (da raiz) |
| 2 | Tipos | `npx tsc --noEmit` |
| 3 | Dado pessoal | roda na suíte; hook pre-push e CI rechecam — ligue o hook: `git config core.hooksPath .githooks` |
| 4 | Atualizar | `git fetch origin && git rebase origin/main` |
| 5 | Publicar o próprio trabalho | `git push origin HEAD:main` |
| 6 | Segurar o push durante build/deploy da máquina que publica | commit local, espera |

Conflito no rebase: em `docs/` ou no `launch.json`, quase sempre "manter as
duas versões". Qualquer outro: **parar e avisar**, não adivinhar.

**Antes de build:** mate apenas o SEU `wrangler dev` — `workerd.exe` segura
`.open-next/assets` aberto, o build falha com `EBUSY`.
Confira o `CommandLine` antes de matar: outras sessões têm processos iguais.

## Trabalhar com IA

- **`.gitignore` não protege contra leitura por IAs:** Claude Code, Cursor,
  Antigravity, OpenCode varrem o disco; `.gitignore` evita commit mas não
  leitura. Configurações de bloqueio obrigatórias: `permissions.deny` em
  `.claude/settings.json`; bloqueio total em `.cursorignore`.
- **Nunca cole nem leia segredos na conversa** — nem `DATABASE_URL`, nem
  qualquer `.env*`/`.dev.vars*`. A jurisdição do provedor muda, o risco não.
- **Sem dado pessoal em prompts:** ao usar LLM para resumir TAC/ato oficial,
  sanitize CSV ao lado.
- **Pedidos pequenos:** "olhe `lib/link-zona.tsx`" custa menos e devolve mais
  precisão que "este projeto existe?".
- **Confirme no código:** decisões vivem como comentário no arquivo; o Agente
  as lê junto, respostas sem citação código são suspeitas.
- **Não confie em status 200:** API devolve 200 e mente; valide CONTEÚDO.
- **Regra editorial em dobro:** dois dados verdadeiros podem sugerir um
  terceiro, falso. Número vem do dado; modelo só embrulha.

## Grafo de código

Explora a estrutura do repo por consulta, não por grep:
[code-graph-rag](https://github.com/vitali87/code-graph-rag).
Grafo (Memgraph) + busca semântica (Qdrant) em Docker local.
Ferramenta de sessão; não está no build nem na CI.

```bash
uv tool install "code-graph-rag[treesitter-full,semantic]"    # uma vez
cgr daemon up                                                  # sobe Memgraph + Qdrant
cgr start --repo-path X:\DevCoder\controle-popular --update-graph
```

Snapshot 22/08/2026: 799 módulos, 3.684 arquivos, 8.412 funções;
`lib/db/queries/municipios.ts` mais central (111 imports).
## Padrão das Seis Qualidades da Informação Cívica

Toda página ou componente que apresenta acervos ou volumes de dados (tabelas, listas, contratos, compras, licenças, territórios) segue rigorosamente a **Regra das Seis Qualidades** (consolidada no [AGENTS.md § 8](/AGENTS.md#8-padrão-de-dados-a-regra-das-seis-qualidades) e exemplificada em `apps/web/app/[municipio]/components/TabelaEstatica.tsx`):

1. **Dados Sempre Linkáveis e Verificados:** Todo registro visível ao usuário (contrato, convênio, lei, processo, órgão, edital, parlamentar, fornecedor) deve possuir hiperlink direto e específico para a fonte oficial pública (aberto e testado pelo agente no momento da coleta). É expressamente vedado link genérico para a página inicial de um ministério ou portal quando o ato possui URL canônica própria ou protocolo oficial de busca.
2. **Buscável e Filtrável com Tags Reais:** Busca textual em tempo real no cliente (tolerante a acentos) e filtros por facetas reais (status, UF, ano, categoria, tags). Filtro vazio é expressamente proibido.
3. **Classificável e Ordenável por Coluna:** Ordenação por colunas (crescente e decrescente) cobrindo tanto valores e datas quanto tipos nominais e categorias.
4. **Resumos e Cartões de Topo:** Agregados destacados acima da listagem que respondem "quanto é isso no total?" com dados medidos e datados.
5. **Contexto para o Chatbot (Seu Nonô / Alceu Dispor):** Toda nova rota ou entidade tem suas tags e perguntas mapeadas em `apps/web/lib/seo/contexto-pagina.ts` e nos módulos regionais (`contexto-vales.ts`, etc.), permitindo que o assistente cívico sugira temas correlatos em frases curtas de até 13 palavras, sem alucinar nem sugerir a própria página onde o leitor já está.
6. **Exportável Multi-formato com BOM UTF-8:**
   - **CSV**: Gera arquivo contendo estritamente o conjunto filtrado em tela, com separador ponto-e-vírgula (`;`) e BOM UTF-8 (`\uFEFF`) para leitura direta sem distorção de acentuação no Excel brasileiro.
   - **PDF / Imprimir**: Dispara `window.print()` estilizado via regras CSS `@media print`, gerando PDF vetorial de alta legibilidade através do próprio navegador (sem bibliotecas externas pesadas no cliente).
   - **Copiar Texto**: Botão rápido utilizando `navigator.clipboard.writeText` para área de transferência.
   - **Gráficos Nativos**: Gráficos inline em SVG ou CSS sem dependências pesadas de terceiros.

## Padrão de Código e Comentários Explicativos

> **Regra do dono (25/09/2026):** Código sem comentário é código opaco. O Controle Popular é software cívico público, e cada linha deve ser auditável e compreensível por qualquer cidadão ou desenvolvedor.

1. **Cabeçalho de Módulo Obrigatório**:
   - Todo arquivo (`.ts`, `.tsx`, `.py`, `.mjs`) deve iniciar com um bloco descritivo explicando:
     - Qual é a função daquele arquivo no ecossistema do portal.
     - As fontes de dados consumidas ou produzidas.
     - Particularidades ou armadilhas que motivaram a implementação.
2. **Documentação de Funções e Métodos**:
   - Funções públicas e utilitárias devem usar JSDoc/TSDoc em TypeScript ou docstrings em Python.
   - Declarar o que a função faz, o significado de cada parâmetro e o formato do retorno.
3. **Explicação do "Porquê"**:
   - Documentar a motivação técnica ou a regra legal/cívica (ex.: fórmula do DV do IBGE, motivo de filtros de esfera, estratégias de retry em APIs públicas).
4. **Linguagem**:
   - Comentários escritos em português claro, direto e acessível, evitando jargões obscuros sem explicação.

## Verificação

```bash
npm test                                        # vitest + globo 3D
npx tsc --noEmit                                # tipos
npm run lint:textos                             # acentuação e grandezas
npm run fix:textos                              # correção determinística
python scripts/checar-dado-pessoal-em-dado.py    # CPF mod-11 (obrigatório)
```

Baseline em 19/09/2026: **1.579 testes no vitest + 146 no globo 3D**.
⚠️ Contagem envelhece rápido: já circularam 247, 401, 601, 681, 699, 741…
Antes de citar um número de teste, **remeça** e anote a data ao lado.
Comentário errado sobrevive meses; teste é o que pega
(um teste de código vs. nome IBGE salvou o case em 15/08).

## Origem

Absorvidos (em [`historico/`](../historico/)):
`SESSOES-CONCORRENTES.md`, `ANTES-DO-PUSH.md`, `USAR-COM-IA.md`,
`worktrees.md`.
