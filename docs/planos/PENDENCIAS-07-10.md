# PENDÊNCIAS 07.10 — CodeScene MCP, analytics e site do Guara

> **Tipo:** PLANO
> **Domínio:** global (CodeScene/Student Pack, CSP e analytics do portal, site no ar, estado do repositório)
> **Última medição:** 2026-10-08
> **Leitura estimada:** media
> **Relacionados:** [AGENTS.md](/AGENTS.md), [ESTADO.md](../02-estado/ESTADO.md), [PLANO-STUDENT-PACK-2026-10.md](PLANO-STUDENT-PACK-2026-10.md), [PENDENCIAS-02-10.md](PENDENCIAS-02-10.md)
> **Palavras-chave:** codescene, mcp, hotspots, divida, student-pack, csp, simple-analytics, guara, deploy, opencode, pendencias

## Sumário

- [Propósito](#propósito)
- [Achados medidos](#achados-medidos)
- [Pendências abertas](#pendências-abertas)
- [Primeira leitura de dívida](#primeira-leitura-de-dívida)
- [Próximos passos, em ordem](#próximos-passos-em-ordem)
- [Onde mora o quê](#onde-mora-o-quê)

## Propósito

Fila única do que ficou em aberto na sessão de 07/10/2026 — integração do
CodeScene (GitHub Student Pack) e conferência do Simple Analytics — para não se
perder entre sessões. Complementa o
[PLANO-STUDENT-PACK-2026-10.md](PLANO-STUDENT-PACK-2026-10.md).

## Achados medidos

Medidos em 07/10/2026 nesta máquina (`home-pc`); as linhas 10 a 13 são da
rodada de **08/10/2026**, mesma máquina.

| # | Achado | Número medido |
|---|---|---|
| 1 | Binário do MCP baixado e íntegro | `cs-mcp.exe` v1.5.8 com **84.749.712 bytes**, igual ao `Content-Length` do release |
| 2 | Assinatura do binário | `Get-AuthenticodeSignature` → **`Valid`** |
| 3 | Handshake MCP | `initialize` no protocolo `2025-06-18` → `codescene-mcp-server` no ar |
| 4 | `verify_installation` | **5 de 6 PASS** (git, auth, CLI, API, runtime); falha só em "Agent Instructions" |
| 5 | CLI do CodeScene | `cs version 1.0.49` instalada e no PATH do usuário |
| 6 | Ferramentas abertas | **28** tools (`select_project`, `list_technical_debt_hotspots_for_project`, `code_health_score`…) |
| 7 | Simple Analytics no ar | script + pixel `noscript` respondendo **200** no HTML de produção |
| 8 | CSP | ainda **`Report-Only`** e **sem `report-uri`** — violações não são visíveis |
| 9 | Repositório | `main` local **7 ahead / 93 behind** `origin/main` (sessão outra) |
| 10 | `verify_installation` em 08/10 | **6 de 6 PASS**, apontando para o worktree `cp-pend-0710` (com `CS_ACCESS_TOKEN` injetado pelo wrapper) |
| 11 | Por que o 6º check falhava | o `AGENTS.md` com a seção do CodeScene só existia em `origin/main`: o **disco** local estava 95 commits atrás. Não era falta de restart do opencode |
| 12 | CSP com coletor | `report-uri` + `report-to` + `Reporting-Endpoints` ligados nos **dois** arquivos (commit `341f38ab`) — ainda Report-Only |
| 13 | Escada do Seu Nonô | `avaliarEscadaBruta` (1.115 linhas, saúde 1,45) quebrado em **11 funções** por degrau (commit `cad5f8fa`, diff **156 inserções / 0 deleções**) |

**Armadilha medida — download truncado.** O binário veio pela metade (35.028.419
de 84.749.712 bytes) e o erro aparece de três formas mentirosas: `spawn UNKNOWN`
(no. -4094), `spawn EPERM` e `%1 não é um aplicativo Win32 válido`. Conferência
certa: comparar o tamanho do arquivo com o `Content-Length` do release
(`curl -sSI -L <url>`), e retomar com `curl -C -` (o servidor aceita `Range`).

**Armadilha medida — `verify_installation` exige parâmetro.** Chamado sem
argumento devolve `missing field git_repository_path`; passe
`{ "git_repository_path": "<raiz do git>" }`.

**Armadilha medida — `verify_installation` sem o token parecia "deslogado".**
Sem `CS_ACCESS_TOKEN` no ambiente dos checks de Authentication/CLI/API falham
com `OAuth not signed in` no stderr — que parece pedido de `cs auth login`, mas
é a variável ausente. Preencha o ambiente antes de chamar (mesmo comando do
[AGENTS.md §10](/AGENTS.md)).

**`guara logs` instável.** A API do Guara respondeu `✖ Could not reach
GuaraCloud API` em parte das chamadas; os logs que passaram mostram
`Cannot find module 'drizzle-orm/node-postgres'` e reservas do Neon vazias
(armadilha já registrada no [AGENTS.md §6](/AGENTS.md)).

## Pendências abertas

| # | Pendência | Onde | Estado |
|---|---|---|---|
| 1 | **Reiniciar o opencode** para o MCP `codescene` aparecer como ferramenta embutida (config só recarrega no restart) | `C:\Users\teste\.config\opencode\opencode.json` | ⛔ dono — **medido 08/10:** pelo wrapper o MCP já funciona, `verify_installation` **6/6**; o restart só dá o atalho embutido |
| 2 | **Primeira consulta real** de dívida no MCP | MCP CodeScene (projeto 85760) | ✅ feito — ver [leitura](#primeira-leitura-de-dívida) |
| 3 | **AGENTS.md sem seção do CodeScene** — era o único check 6/6 que falhava | `AGENTS.md` §10 | ✅ feito em 07/10; **6/6 confirmado em 08/10** (o disco local só alcança o `origin/main` num worktree) |
| 4 | **CSP: coletor ligado; virada para bloqueante** (medição de 24 h depois do deploy) | `apps/web/next.config.ts` + `apps/web/public/_headers` | 🚧 **report-uri feito** (`341f38ab`); virada ⛔ decisão do dono |
| 5 | **Conferir se os dados chegam** no painel do Simple Analytics | painel Simple Analytics | ⛔ dono |
| 6 | **Deploy** — imagem nova com `drizzle-orm` (Guara) / casa principal Azure | `gh workflow run azure-mirror.yml --ref main` (Azure) ou `guara deploy --project controle-popular` | ⛔ dono — **não agora** (decisão de 08/10); a medição da CSP só começa DEPOIS |
| 7 | **Rebase do checkout principal** (7 commits locais sem push, 93 atrás) | `main` local | ⚠️ sessão outra |
| 8 | **Token Name.com exposto** (rotacionar), secret `GITHUB_ISSUES_TOKEN`, alerta de orçamento Azure | Name.com / GitHub / Azure | ⛔ dono |
| 9 | **Economia de token** do MCP: `CS_DEFAULT_PROJECT_ID` e `CS_ENABLED_TOOLS` (AGENTS §5.12) | config do opencode | 💡 opcional |
| 10 | **Refatoração dos hotspots** — só os do doc, nunca por intuição | `escada-determinista.ts` (saúde 1,45) | ✅ feito em 08/10 (`cad5f8fa`) — 11 funções, 12 testes verdes; próximo candidato: `Catalogo100PaginasClient.tsx` (2,17) |

## Primeira leitura de dívida

Consulta ao MCP do CodeScene em 07/10/2026, projeto `controle-popular` (id
**85760**). Os números são de máquina e datados — dizem o que a análise mediu
naquele instante, não julgamento de autor (AGENTS §7).

**Estado do projeto:** saúde geral **8,69** (mês **−0,34**); saúde dos pontos
quentes **8,36** (mês **−0,55**); análise `ok`; **18 arquivos** marcados
`recommended-refactoring-target`. Mapa:
[codescene.io/projects/85760](https://codescene.io/projects/85760).

**Piores em saúde de código** (saúde de 0 a 10; quanto menor, mais caro de
mexer):

| Saúde | Arquivo | Loc | Revisões |
|---|---|---|---|
| **1,45** | `apps/web/lib/assistente/escada-determinista.ts` — **refatorada em 08/10** (`cad5f8fa`, 11 funções por degrau); saúde a recalcular na próxima análise | 1.088 | 7 |
| **2,17** | `apps/web/app/indice/Catalogo100PaginasClient.tsx` | 466 | 4 |
| **5,73** | `apps/web/lib/ambiental/licencas-unificada.ts` | 620 | 8 |
| 6,46 | `apps/web/public/terras/globo/js/ui/rotulos.js` | 514 | 16 |
| 6,87 | `etl/betim/etl/common.py` | 647 | 10 |
| 6,98 | `apps/web/lib/assistente/acervo.ts` | 558 | 15 |
| 7,09 | `apps/web/lib/db/queries/betim.ts` | 2.558 | 32 |
| 7,27 | `apps/web/app/sobre/page.tsx` | 613 | 19 |
| 7,31 | `apps/web/app/[municipio]/vereadores/[slug]/page.tsx` | 617 | 17 |
| 7,49 | `apps/web/app/page.tsx` | 543 | 51 |

**Mais mexidos** (revisões — onde o código muda mais):

| Revisões | Arquivo | Saúde | Loc |
|---|---|---|---|
| 51 | `apps/web/app/page.tsx` | 7,49 | 543 |
| 40 | `apps/web/app/components/TopNav.tsx` | 8,46 | 474 |
| 38 | `apps/web/app/layout.tsx` | 8,98 | 323 |
| 36 | `apps/web/app/components/SeuNono.tsx` | 7,95 | 1.909 |
| 34 | `apps/web/app/ambiental/page.tsx` | 8,06 | 410 |
| 32 | `apps/web/lib/db/queries/betim.ts` | 7,09 | 2.558 |

**O que os dois cortes mostram, lidos juntos:**

- `escada-determinista.ts` (1,45) e `Catalogo100PaginasClient.tsx` (2,17)
  têm **poucas revisões** e saúde ruim: dívida velha, acumulada — não efeito
  de edição recente.
- `betim.ts` e `app/page.tsx` têm **saúde mediana e atrito subindo no mês**
  (0,20 e 0,26): aqui o custo está crescendo agora.
- `layout.tsx` e `TopNav.tsx` são os mais editados e **ainda saudáveis**
  (8,98 e 8,46): mexer neles hoje é barato; deixar de mexer é o que encarece.

## Próximos passos, em ordem

1. ✅ **Seção do CodeScene no AGENTS.md** (§10) e **6/6 do
   `verify_installation`** — confirmado em 08/10 apontando para o worktree
   (o disco local estava defasado, não faltava restart; ver linha 11 dos
   [achados](#achados-medidos)).
2. ✅ **Primeira leitura de dívida** feita e registrada na seção acima
   (projeto 85760, 18 hotspots). Refatoração só a partir daqui.
3. ✅ **Perguntar ao dono** (08/10): CSP ganha `report-uri` primeiro;
   deploy **não agora**; Simple Analytics o dono confere; refatoração
   começa pelo pior hotspot (`escada-determinista.ts`).
4. ✅ **`report-uri` ligado** nos dois arquivos (`341f38ab`) e **escada
   quebrada** em 11 funções (`cad5f8fa`) — ambos ainda **sem push**.
5. 🚧 **Depois do deploy** (decisão do dono): medir violações por 24 h em
   `csp:*` da tabela `contadores`; só então promover a CSP para bloqueante.
6. **Fechar a conta Simple Analytics** lendo o painel (o script e o pixel já
   estão no ar; falta confirmar o número de visitas lá).
7. **Próximo hotspot do doc**, quando houver sessão: `Catalogo100PaginasClient.tsx`
   (saúde 2,17) — nunca refatorar por intuição.

## Onde mora o quê

| O quê | Caminho | Commitado? |
|---|---|---|
| Wrapper que injeta o token no MCP | `scripts/mcp-codescene.ps1` | ✅ já em `origin/main` desde 07/10 — o `??` no checkout principal é o local **95 atrás**, não falta de commit (medido 08/10) |
| PAT do CodeScene | `scripts/.env` (`CS_ACCESS_TOKEN`) | 🚫 gitignorado; nunca imprimir |
| Config do MCP do opencode | `C:\Users\teste\.config\opencode\opencode.json` (`mcp.codescene`) | 🚫 fora do repo; exige restart |
| Binário do MCP | `%LOCALAPPDATA%\npm-cache\_npx\85498f9af683b8f2\node_modules\@codescene\codehealth-mcp\.cache\1.5.8\cs-mcp.exe` | 🚫 cache do npx |
| CLI `cs` | `%USERPROFILE%\AppData\Local\Programs\CodeScene\cs.exe` | 🚫 fora do repo |
| Ensaio de handshake (pipe) | `%TEMP%\opencode\teste-mcp-codescene.mjs` | 🚫 temporário |
| Coletor de violações de CSP | `apps/web/app/api/csp-report/route.ts` | ✅ `341f38ab` |
| Interpretador dos relatórios (+ teste) | `apps/web/lib/csp/reportes.ts` / `reportes.test.ts` | ✅ `341f38ab` |
| Onde a contagem mora | tabela `contadores`, chaves `csp:<diretiva>:<origem>`, `csp:disposicao:*`, `csp:total` | ✅ sem migration |
| Escada refatorada em 11 degraus | `apps/web/lib/assistente/escada-determinista.ts` | ✅ `cad5f8fa` |
| Trabalho da sessão de 08/10 | worktree `.claude/worktrees/cp-pend-0710`, branch `pend-0710` | 🚧 local, **sem push** (decisão do dono) |

O wrapper lê só a chave `CS_ACCESS_TOKEN` do `.env`, tolera BOM e CRLF, e
nunca imprime valor nenhum — mesma régua da [AGENTS.md §5.8](/AGENTS.md).

**Duas armadilhas medidas em 08/10**, as duas custaram uma conclusão errada:

- **`git cat-file -e <ref>` responde vazio no SUCESSO.** Checar presença de
  arquivo pela saída do comando em PowerShell faz `if (...)` cair no falso:
  parecia que o wrapper não estava em `origin/main`, e estava. O que vale é
  `$LASTEXITCODE`.
- **`??` no checkout local não é "nunca commitado".** O checkout principal
  está 95 atrás de `origin/main`: arquivo commitado no remoto em 07/10
  aparece como não rastreado aqui. Confira com
  `git cat-file -e origin/main:<caminho>` (ou `git ls-tree origin/main`).
- **Copiar arquivo `.ps1` sem o BOM muda a leitura.** O commit `808150cb`
  entrou com a cópia sem BOM e foi revertido em seguida: o PowerShell 5.1
  lê `.ps1` sem BOM como ANSI e quebra os acentos dos textos. Byte a byte
  igual ao do remoto é o estado certo para arquivo que não mudou.
