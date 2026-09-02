# Proposta — Sanitização do repositório (2026-09)

> **Tipo:** PROPOSTA
> **Domínio:** operação do projeto
> **Última medição:** 2026-09-02
> **Leitura estimada:** média (5–15 min)
> **Relacionados:** [DESENVOLVIMENTO](../03-desenvolvimento/DESENVOLVIMENTO.md), [AGENTS](/AGENTS.md), [ESTADO](../02-estado/ESTADO.md), [PLANO-NOSSOS-PAINEIS-SANFONA](./PLANO-NOSSOS-PAINEIS-SANFONA.md)
> **Palavras-chave:** sanitizacao, worktree, branch, limpeza, organizacao, git, divida tecnica, rotina

## 🩺 Diagnóstico (medido em 02/09/2026)

O repositório **cresceu muito rápido**. 🚀

Muitas frentes, muitos worktrees e branches. 🌿

Isso deixou o repo **difícil de navegar**. 🧭

### O que foi medido

| Item | Medição | Leitura |
|---|---|---|
| Worktrees ativos | **~45** em `C:\DevCoder\*` | Muitos são de tarefas já entregues |
| Branch principal local | `main` em `cbee142` | Divergiu de `origin/main` (`9b0c4f4`) |
| Situação do `main` local | **ahead 14 / behind 30** | Faltam 30 commits do GitHub; sobram 14 locais |
| Pasta `Kimi_Agent_Retrospectiva do Projeto` | Dentro de `docs/planos/` | Contém **outro repositório completo** (repo-controle-popular) + capturas + patches |
| Arquivos "modificados" | ~3.591 | A maioria é **ruído de CRLF** (linha nova do Windows) |
| Diferença real | 47 arquivos | Trabalho vivo ainda não commitado |
| Números do repo | 903 commits em 36 dias | Crescimento acelerado, padrão "maratona" |

### Os 5 problemas

1. 🪵 **Worktrees demais.** Tarefa entregue deixou worktree para trás.
2. 🔀 **`main` local divergido.** Sem sincronia com o GitHub.
3. 📦 **Repo dentro do repo.** A pasta do Kimi tem um `.git` próprio dentro de `docs/`.
4. 🐍 **Ruído de CRLF.** Windows grava `\r\n`; o git espera `\n`. O `git status` fica poluído.
5. 📄 **Documentos duplicados.** Alguns planos existem na pasta do Kimi e não no lugar oficial.

## 🎯 Estado-alvo (daqui a 1 mês)

- **1 branch principal:** `main` (GitHub) = deploy. 🎯
- Worktrees **curtos**: nascem para uma tarefa, morrem na entrega. ⏳
- **Zero** repo dentro de repo em `docs/`. 🚫
- `git status` **limpo** no home-pc (sem ruído CRLF). 🧼
- Toda documentação no **lugar oficial** (`docs/`), sem cópia solta. 🗂️

## 🪜 Plano por custo (do menor ao maior)

### Etapa 1 — Parar de sangrar (P)

| Ação | Custo | Efeito |
|---|---|---|
| Decidir o destino da pasta do Kimi (mover para `C:\DevCoder\arquivo-kimi\` ou apagar) | P | Remove repo-dentro-de-repo de `docs/` |
| Adicionar `.gitattributes` com `* text=auto eol=lf` | P | Mata o ruído CRLF nos próximos clones |
| Rodar `git add --renormalize .` + commit único de normalização | P | `git status` volta a mostrar só mudança real |
| Criar rotina mensal de limpeza de worktrees (script) | P | Worktree morto não acumula |

### Etapa 2 — Reconciliar o `main` (M)

| Ação | Custo | Efeito |
|---|---|---|
| `git fetch origin` + comparar commits locais × remotos | M | Ver o que é trabalho novo vs. duplicado |
| Rebase do `main` local sobre `origin/main` (com cuidado, sem `--force`) | M | Local volta a ser igual ao GitHub + trabalho local |
| Push do trabalho local legítimo | M | Nada se perde |
| Apagar branches órfãs já entregues (com aval do dono) | M | Lista de branches encolhe |

### Etapa 3 — Organizar documentação (M)

| Ação | Custo | Efeito |
|---|---|---|
| Trazer os planos da pasta do Kimi para `docs/planos/` (os que são oficiais) | M | Fonte única |
| Mover capturas, refs e patches para acervo fora de `docs/` | M | `docs/` fica só texto |
| Atualizar `docs/LEIA-PRIMEIRO.md` com o mapa novo | P | Onboarding rápido |

### Etapa 4 — Rotina de higiene (M)

| Ação | Custo | Efeito |
|---|---|---|
| Todo worktree nasce com data e tarefa no nome | P | Dá para saber a idade |
| Script de auditoria semanal: worktrees velhos + branches sem merge | P | Alerta antes de acumular |
| Regra: entregou, apagou o worktree no mesmo dia | P | Disciplina barata |
| Rodar `npm test` + `tsc` antes de cada merge grande | M | Qualidade não volta a atrasar |

## 🧭 Regras de ouro

1. **Nunca** `--force` no `main`. 🚫
2. **Nunca** commit de arquivo de outra sessão (pathspec explícito). 📌
3. **Nunca** dado pessoal em prompt, arquivo ou commit. 🔐
4. Pasta de retrospectiva **não mora dentro de `docs/`** com `.git` próprio. 🚫📦
5. Documento oficial vive **num lugar só**; o resto é ponteiro. 🗂️
6. Trabalho de IA: **commita aos poucos**, nunca WIP gigante esquecido. 🧩

## ✅ Critérios de aceite da sanitização

1. `git worktree list` mostra só worktrees vivos. 🪵
2. `git status` no home-pc sem ruído CRLF. 🧼
3. `main` local == `origin/main` (ou diferença documentada). 🔀
4. `docs/` sem repositório aninhado. 📦➡️🚫
5. Qualquer agente novo entende o mapa em 10 minutos. 🗺️

## ⏭️ Próximos passos sugeridos

1. Dono aprova destino da pasta do Kimi (mover ou apagar). ✅
2. Aplicar `.gitattributes` + normalização (Etapa 1). 🧼
3. Reconciliar `main` (Etapa 2) — de preferência numa sessão dedicada, com calma. 🔀
4. Trazer planos oficiais da pasta do Kimi para `docs/planos/`. 🗂️
5. Instalar a rotina mensal de limpeza. 📅
