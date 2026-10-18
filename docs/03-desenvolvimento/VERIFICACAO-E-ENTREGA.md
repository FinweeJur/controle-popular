# Verificação em camadas e entrega

> **Tipo:** GUIA
> **Domínio:** global (testes, CodeScene, tsc, entrega)
> **Última medição:** 2026-10-18
> **Leitura estimada:** média (5–15 min)
> **Relacionados:** [AGENTS.md](/AGENTS.md), [REGRAS-DURAS.md](REGRAS-DURAS.md), [DESENVOLVIMENTO.md](DESENVOLVIMENTO.md), [/.githooks/pre-commit](/.githooks/pre-commit)
> **Palavras-chave:** verificacao, testes, tsc, eslint, codescene, pre-commit, pre-push, cpf, deploy, entrega

## Sumário

- [Verificação em camadas](#verificação-em-camadas)
- [CodeScene no pré-commit](#codescene-no-pré-commit)
- [Escopo do diff](#escopo-do-diff)
- [Antes do push e do deploy](#antes-do-push-e-do-deploy)

## Verificação em camadas

**Regra do dono, 30/09/2026: a verificação é em CAMADAS.** O commit não
espera a suíte inteira. Medido naquele dia: 2.134 testes, ~2–3 min, e a
suíte cresce a cada sessão. Rodar tudo a cada commit bloqueia por trabalho de
**outra sessão** (o repo muda sob você) e não protege mais que o escopo do
diff. O que protege de verdade continua em todo commit.

**Todo commit (segundos):**

```bash
npx tsc --noEmit                              # em apps/web
npx vitest run lib/sem-cpf-no-repo.test.ts    # guarda de CPF: o dado não pode vazar
npx eslint <arquivos do diff>                 # só o que mudou
python scripts/validar-documentacao.py        # se mexeu em docs/
```

## CodeScene no pré-commit

**Automático desde 08/10/2026.** O hook
`.githooks/pre-commit` roda sozinho a cada `git commit`. Ele mede a "saúde
do código" (nota de 0 a 10; menor = mais caro de mexer) **só no que está no
commit** — código antigo que você nem tocou não conta.

```bash
cs delta --git-hook --staged
```

- **Barra o commit** (código 1) quando a mudança introduz problema novo, e
  mostra a lista. Para ignorar de propósito (raro): `git commit --no-verify`.
- **Pula sozinho** se o `cs` não estiver instalado, ou se faltar
  `CS_ACCESS_TOKEN` — não trava clone sem a ferramenta (§5.8: o token sai de
  `scripts/.env`, nunca é impresso).
- **Regras próprias** em [.codescene/code-health-rules.json](/.codescene/code-health-rules.json):
  as regras estruturais (Complex Method, aninhamento, nº de argumentos,
  duplicação, Large Method) ficam **desligadas em arquivo de teste** — teste
  repete setup de propósito. Aplicação usa o padrão do CodeScene.
- **Revisar um arquivo à mão:** `cs review <arquivo>` (aceita
  `--output-format json`); `cs check <arquivo>` é o apelido do mesmo exame.
  O `cs` exige `CS_ACCESS_TOKEN` no ambiente.
- Ativa junto com o pre-push — mesma chave `core.hooksPath .githooks` (§5.2).
- **O mesmo exame roda também na nuvem** (ligado em 09/10/2026): a action
  [.github/workflows/codescene-saude.yml](/.github/workflows/codescene-saude.yml)
  instala o CLI e compara `cs delta <base> <head> --error-on-warnings`
  no push da `main` e em cada PR. Falha a ação em vez do commit — cobre clone
  sem hook, do mesmo jeito que `dado-pessoal.yml` cobre o pre-push de CPF.
  Precisa do secret **`CS_ACCESS_TOKEN`**. **Não dispara deploy** (§5.7.1).
- **O PR também tem portão no lado do CodeScene:**
  [.codescene/custom-quality-gates.json](/.codescene/custom-quality-gates.json)
  (`new_code_health`, `hotspot_decline`, regras críticas; aviso só de
  `advisory_health_rules`). Esse só passa a valer quando a integração de PR
  estiver ligada **no painel codescene.io** — nem CLI nem MCP expõem essa
  chave, é clique do dono.
- **Meta de saúde: 10,00.** O CodeScene trata 10 como o padrão de código
  legível por máquina — "9 e pouco" não é suficiente. Se a saúde regredir,
  **refatore, não declare pronto**.
- **Salvaguarda pelo MCP (fluxo recomendado):** `pre_commit_code_health_safeguard`
  no que está na mão **antes** de cada commit, e `analyze_change_set`
  (branch contra a base) **antes** de abrir PR. Deram regressão?
  `code_health_review` diz o quê, e refatora em passos de 3 a 5.

## Escopo do diff

**Se o diff toca `lib/`:** rode o escopo do diff. O vitest usa o grafo de
módulos e roda só os testes ligados ao que mudou:

```bash
npm run test:lib -- --changed HEAD   # de apps/web; o wrapper repassa a flag
```

`--changed` é mais seguro que escolher teste à mão: mexeu em `lib/x.ts`, ele
roda quem importa `x`. Se você sabe de um teste sensível que ele não pegou,
rode esse teste à mão.

**UI pura (`.tsx`, sem `lib/`):** `tsc` + `eslint` bastam — nenhum teste
importa componente.

## Antes do push e do deploy

**Aí sim, a suíte completa.** aí sim a suíte completa e o globo.

```bash
npm test                 # raiz: vitest (lib/**/*.test.ts) + node:test (globo 3D)
```

Baseline em 30/09/2026: **2.134 testes no vitest** (globo à parte).
A guarda de CPF e o validador de docs entram em TODO commit — o que muda é
só o volume de lógica não tocada.

Armadilha que virou teste, não comentário: em 15/08 um comentário errado
sobre código IBGE sobreviveu meses e copiou-se para uma tarefa. Quem pegou
foi um teste que compara código com nome. Comentário errado continua
convincente — teste não.

## Origem / Histórico

Movido do AGENTS.md §9 em 18/10/2026, sem perda de texto.
