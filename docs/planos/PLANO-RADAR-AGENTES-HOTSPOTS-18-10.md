# Plano — Radar de agentes e hotspots (18/10/2026)

> **Tipo:** PLANO
> **Domínio:** global (documentação, coordenação de agentes, priorização de trabalho)
> **Última medição:** 2026-10-18
> **Leitura estimada:** média (5–15 min)
> **Relacionados:** [ESTADO.md](../02-estado/ESTADO.md), [RADAR-HOTSPOTS.md](../02-estado/RADAR-HOTSPOTS.md), [RELATORIOS-AGENTES.md](../02-estado/RELATORIOS-AGENTES.md), [GUIA-DE-DOCUMENTACAO.md](../GUIA-DE-DOCUMENTACAO.md), [FILA-AGENTES.md](/docs/historico/entregas/FILA-AGENTES.md), [AGENTS.md](/AGENTS.md)
> **Palavras-chave:** agentes, subagentes, relatorios, sumario, hotspots, radar, documentacao, hiperlinks, priorizacao, handoff, worktree, codescene, vigia, coletores

## Sumário

- [Propósito](#propósito)
- [Diagnóstico medido](#diagnóstico-medido)
- [O que será entregue](#o-que-será-entregue)
- [Como o radar decide prioridade](#como-o-radar-decide-prioridade)
- [Fases](#fases)
- [Critérios de pronto](#critérios-de-pronto)
- [Manutenção](#manutenção)
- [Riscos e limites](#riscos-e-limites)
- [Decisões registradas](#decisões-registradas)

## Propósito

Juntar, num lugar só, o que cada agente entregou no Controle Popular.
Transformar essa memória dispersa num **radar de trabalho**.
O radar responde, em menos de um minuto, quatro perguntas:

1. **Corrigir:** o que está quebrado ou bloqueado agora?
2. **Atualizar:** qual dado envelheceu e qual coletor parou?
3. **Editar:** qual texto, página ou acervo precisa de revisão?
4. **Ampliar:** qual cobertura, fonte ou página falta?

Cada linha do radar leva a três coisas: **evidência datada**, **documento de
origem** e **ponto de partida no código**. Sem link, a linha não entra.

## Diagnóstico medido

Medições feitas em 18/10/2026 nesta máquina.

| Fonte | Medida | Leitura |
|---|---|---|
| `docs/` | **255 arquivos `.md`** | volume alto; a busca por intenção não existe hoje |
| `docs/planos/` | **98 planos** | planos ativos e históricos misturados na mesma pasta |
| `docs/historico/` | **78 documentos** | muita entrega boa que ninguém encontra |
| `docs/relatorios-automacao/` | **21 relatórios** | sinal automático sem índice único |
| Handoffs com `HANDOFF` no nome | **15** | fora de um sumário consolidado |
| Worktrees de agente | **10** | cada uma é uma linha de trabalho, sem inventário |
| Transcrições de subagente (Claude, projeto CP) | **9 arquivos**; **4** com `StructuredOutput.resumo` | resumo final existe, mas está fora do repo |
| `vigia-coletores` | **29 fontes**; **18 atrasadas**; **5 vermelhas fora da catraca** | regressão de coletor é o hotspot mais concreto |
| `padrao-pagina` (top 100) | **2 completas**, **97 parciais**, **1 ausente** | a régua das oito qualidades ainda não fecha |
| CodeScene | **3 amarelos** (`CompanheiroFlutuante` 7,03; `betim.ts` 7,30; `indice/page.tsx` 7,96) | fila de refatoração pequena e esquecida |
| LinkMender | **6 PRs abertos**; o maior com 2.467 correções | fila de links parada fora do radar |

Conclusão: **o problema não é falta de informação. É falta de porta de entrada.**
O conteúdo existe em planos, handoffs, relatórios e commits. O leitor novo não
sabe qual arquivo abre primeiro.

## O que será entregue

### 1. `docs/02-estado/RELATORIOS-AGENTES.md` (gerado)

Inventário único dos relatórios de agente, em quatro blocos:

- **Subagentes com resumo final:** tarefa, data, resumo, arquivos e commit.
- **Entregas e handoffs:** título, domínio, data, status e link.
- **Planos com pendência aberta:** o que ficou e onde está o aceite.
- **Worktrees e linhas de trabalho:** branch, último commit e estado.

O arquivo é **gerado** por `scripts/agentes/consolidar-relatorios.mts`.
Gerado não se edita à mão; quem quiser mudar o conteúdo muda a fonte.

### 2. `docs/02-estado/RADAR-HOTSPOTS.md` (curado)

O índice por intenção. Seis seções:

1. **Corrigir agora** — bug, bloqueio ou regressão medida.
2. **Atualizar dado** — coletor atrasado, link morto, data sem carimbo.
3. **Editar conteúdo** — texto, resumo, memória, página fora do padrão.
4. **Ampliar cobertura** — cidade, fonte, rota ou camada que falta.
5. **Refatorar** — hotspot de saúde de código, sempre com nota medida.
6. **Publicar e operar** — deploy, certificado, cota, integração externa.

Cada linha tem: **hotspot**, **por que agora (número + data)**, **comece por
aqui** (arquivo ou comando), **documento de origem** e **próxima ação**.

### 3. Navegação

- `docs/README.md` ganha a porta “**Quero saber onde mexer agora**”.
- `AGENTS.md` §2 ganha a linha do radar.
- `package.json` ganha `npm run radar` para regenerar o inventário.

### 4. AGENTS.md enxuto, com o detalhe linkado

O `AGENTS.md` vira um **mapa**: resumo de cada regra em uma linha e link para
o documento que guarda o texto completo, a medição e o motivo. O detalhe sai
para documentos temáticos, sem apagar nada:

| Documento | Recebe |
|---|---|
| [`REGRAS-DURAS.md`](../03-desenvolvimento/REGRAS-DURAS.md) | §5.1 a §5.15 completas |
| [`REGRA-EDITORIAL.md`](../01-produto/REGRA-EDITORIAL.md) | §7 |
| [`QUALIDADES-DA-INFORMACAO.md`](../04-arquitetura/QUALIDADES-DA-INFORMACAO.md) | §8 |
| [`VERIFICACAO-E-ENTREGA.md`](../03-desenvolvimento/VERIFICACAO-E-ENTREGA.md) | §9 |
| [`FERRAMENTAS-E-MCP.md`](../05-operacao/FERRAMENTAS-E-MCP.md) | §10 |
| [`COLETA-ETICA.md`](../06-fontes/COLETA-ETICA.md) | §11 + pesquisa na internet |
| [`COMUNICACAO-COM-O-DONO.md`](../03-desenvolvimento/COMUNICACAO-COM-O-DONO.md) | §12 |
| [`SETUP-LOCAL.md`](../03-desenvolvimento/SETUP-LOCAL.md) | setup que estava no README |

O README da raiz e o `README.en.md` ficam curtos: o que é, frentes, porta de
entrada da documentação, API e licença.

### 5. Pesquisa na internet com identidade honesta

Vale para este repositório e para os demais repositórios do dono:

1. **User-Agent honesto:** `finweejur/github artur colito`.
2. **Antes de acessar:** termos de uso, `robots.txt`, `/docs` e `/api`.
3. **Respeitar** `Disallow`, `Crawl-delay`, limite de requisições e área
   autenticada.
4. **Uso ético:** dado público, finalidade cívica, sem burlar login,
   CAPTCHA, paywall ou rate limit.
5. **Registrar a decisão** no cabeçalho do coletor quando houver exceção.

O detalhe e o checklist ficam em
[`COLETA-ETICA.md`](../06-fontes/COLETA-ETICA.md). A regra também é replicada
no `AGENTS.md` global do opencode, para valer em qualquer repositório.

## Como o radar decide prioridade

A ordem não é opinião. É uma fila de cinco réguas:

| Régua | Sinal | Exemplo |
|---|---|---|
| **1. Dano** | número errado, CPF, link oficial morto, página ilegível | link quebrado em ato oficial |
| **2. Regressão** | algo que funcionava parou | 5 fontes vermelhas fora da catraca |
| **3. Bloqueio** | trava outra frente | cota do Guara bloqueia deploy |
| **4. Envelhecimento** | dado com carimbo vencido | 18 fontes atrasadas |
| **5. Oportunidade** | ampliação com fonte já medida | PNCP, Rio Doce, CAR |

Empate resolve por **esforço pequeno primeiro**, como já manda o `ESTADO.md`.

## Fases

### Fase 1 — Inventário (esta sessão)

- Criar o gerador e o inventário `RELATORIOS-AGENTES.md`.
- Medir as fontes: transcrições, handoffs, planos, worktrees e relatórios.
- Não mover nem apagar documento nenhum.

### Fase 2 — Radar (esta sessão)

- Escrever `RADAR-HOTSPOTS.md` com as linhas medidas hoje.
- Ligar o radar no `docs/README.md` e no `AGENTS.md`.

### Fase 3 — Guarda contra apodrecimento (próxima)

- `scripts/agentes/consolidar-relatorios.mts --check` falha quando o inventário
  está velho ou quando um link do radar aponta para arquivo inexistente.
- Rodar na CI junto de `scripts/validar-documentacao.py`.
- Só então o radar vira catraca, não boa intenção.

### Fase 4 — Enriquecimento (opcional)

- Cruzar cada hotspot com o último commit que tocou o arquivo.
- Puxar saúde do CodeScene por arquivo no momento da geração.
- Abrir uma linha por worktree com “à frente / atrás” de `origin/main`.

## Critérios de pronto

1. O inventário lista **todas** as fontes medidas, com contagem visível.
2. Nenhum link interno quebrado.
3. Todo hotspot tem **número, data e link** para a origem.
4. O radar cabe em uma leitura de 5 a 15 minutos.
5. `python scripts/validar-documentacao.py` passa.
6. `npx tsc --noEmit` do script passa.
7. Quem chega pelo `docs/README.md` encontra o radar em **um clique**.
8. O `AGENTS.md` cabe em uma leitura curta e nenhuma regra foi apagada:
   cada uma tem link para o texto completo.
9. A regra de pesquisa na internet está no `AGENTS.md` do projeto **e** no
   `AGENTS.md` global do opencode.

## Manutenção

- **Toda sessão que entrega trabalho** atualiza a fonte, não o gerado:
  handoff em `docs/historico/entregas/`, pendência em `docs/planos/`.
- **Toda sexta-feira** (ou antes de escolher a próxima tarefa):
  `npm run radar` e conferir o diff do inventário.
- **Toda medição vencida** perde a linha do radar ou ganha nova data.
- **Plano concluído** sai de `docs/planos/` para `docs/historico/entregas/`;
  o inventário passa a mostrá-lo como entrega, não como pendência.

## Riscos e limites

1. **Transcrição fora do repo apodrece.** Os arquivos `agent-*.jsonl` moram em
   `%USERPROFILE%\.claude\projects`. O gerador aceita `--transcricoes` e
   declara “0 encontrados” em vez de inventar. O repo guarda só o resumo.
2. **Resumo de agente não é fonte oficial.** O inventário copia o que o agente
   declarou e aponta o commit. Quem for agir confere o código.
3. **Dado pessoal.** O gerador passa um filtro de CPF por mod-11 e substitui o
   número por `[CPF removido]`. Nenhum segredo é lido.
4. **Radar curado envelhece.** Por isso a Fase 3 transforma a conferência em
   teste; até lá, a data no cabeçalho é a promessa.
5. **Não duplicar o ESTADO.** O radar não substitui a fila; ele é a camada de
   **entrada por intenção**. A fila continua sendo a fonte de verdade.

## Resultado (18/10/2026)

- Inventário gerado: [RELATORIOS-AGENTES.md](../02-estado/RELATORIOS-AGENTES.md).
- Radar curado: [RADAR-HOTSPOTS.md](../02-estado/RADAR-HOTSPOTS.md).
- 130 sessões do opencode extraídas para
  [opencode-sessoes-cp.md](../relatorios-automacao/opencode-sessoes-cp.md)
  por `npm run radar:opencode`.
- 96 planos arquivados em `historico/`; pendências reunidas em
  [ambiental e dados](PLANO-INTEGRADO-AMBIENTAL-E-DADOS.md),
  [produto e interface](PLANO-INTEGRADO-PRODUTO-E-INTERFACE.md) e
  [operação e agentes](PLANO-INTEGRADO-OPERACAO-E-AGENTES.md).
- Radar é **local**; não entra na CI.

## Decisões registradas

1. **18/10/2026 — inventário gerado, radar curado.** O inventário muda toda
   hora; o julgamento de prioridade é humano e auditável.
2. **18/10/2026 — uma linha por intenção, não por pasta.** Quem procura não
   sabe se o assunto mora em `planos/`, `historico/` ou `dominios/`.
3. **18/10/2026 — sem link, sem linha.** Hotspot sem documento ou código
   apontável é opinião, e opinião não entra no radar.
4. **18/10/2026 — transcrição não entra no repo.** Entra o resumo destilado,
   com caminho e commit; o bruto fica na máquina.
5. **18/10/2026 — o radar não move arquivo.** Reorganização de `docs/` é outra
   decisão; esta frente só acrescenta portas de entrada.
