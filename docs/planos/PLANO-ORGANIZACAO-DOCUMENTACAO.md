# Plano de organização da documentação do repositório

> **Tipo:** PLANO
> **Domínio:** global
> **Última medição:** 2026-09-01
> **Leitura estimada:** média (5–15 min)
> **Relacionados:** [GUIA-DE-DOCUMENTACAO.md](../GUIA-DE-DOCUMENTACAO.md), [ESTADO.md](../02-estado/ESTADO.md), [README.md](../README.md), [AGENTS.md](/AGENTS.md)
> **Palavras-chave:** documentacao, historico, planos, template, medição, gitignore, validar-documentacao

## Sumário

- [Propósito](#propósito)
- [Diagnóstico (medido em 01/09/2026)](#diagnóstico-medido-em-01092026)
- [Fase 0 — sanear o git antes de mexer](#fase-0--sanear-o-git-antes-de-mexer)
- [Fase 1 — o que vai para historico/](#fase-1--o-que-vai-para-historico)
- [Fase 1b — consolidar duplicados](#fase-1b--consolidar-duplicados)
- [Fase 2 — o que está desatualizado](#fase-2--o-que-está-desatualizado)
- [Fase 3 — índice mestre e validação](#fase-3--índice-mestre-e-validação)
- [Decisões registradas](#decisões-registradas)
- [Origem / Histórico](#origem--histórico)

## Propósito

Organizar a documentação do repositório neste PC: separar o que é vivo do que é histórico, eliminar ruído de git, atualizar o que está desatualizado e deixar uma rotina que impeça o acúmulo de novo lixo. Não muda código do portal.

## Diagnóstico (medido em 01/09/2026)

- **Árvore de git poluída:** `git status --porcelain` conta **3.761 arquivos modificados**. O git avisa `LF will be replaced by CRLF` para praticamente todo arquivo de docs — mistura de ruído de fim de linha com conteúdo real não commitado.
- **Pass de template não commitado:** em 01/09 ~11:50, um enxame de agentes rodou `scripts/aplicar-template-docs.py` e `scripts/aplicar-template-historico.py`, tocando ~100 arquivos em `docs/` que estão marcados como `M` sem commit. Esse pass precisa virar um commit só, ou ser revertido, antes de qualquer reorganização.
- **Docs na raiz de `docs/` fora do padrão:** `HANDOFF-FASE2-PARAOPEBA.md` mora na raiz; o GUIA diz que a raiz é só índice/guias (`README.md`, `GUIA-DE-DOCUMENTACAO.md`, `LEIA-PRIMEIRO.md`).
- **Planos entregues ainda em `planos/`:** vários `PLANO-*` já foram entregues ou superados e deveriam estar em `historico/entregas/` (ver Fase 1).
- **Planos duplicados de um mesmo assunto:** três planos de chatbot/assistente (`PLANO-CHATBOT-IA`, `PLANO-SEU-NONO-NOTEBOOKLM`, `PLANO-CANARIO-TELEGRAM`) e dois de completude (`planos/CLASSIFICACAO-COMPLETUDE.md` × `historico/procedimentos/REVISAO-COMPLETUDE.md`).
- **Datas de medição velhas:** ~70 docs carregam `Última medição: 2026-08-22`; alguns tiveram conteúdo mudado depois disso e não foram re-medidos (GUIA, ARQUITETURA, OPERACAO, GATILHO-REMOTO, LEIA-PRIMEIRO, DESENVOLVIMENTO).
- **Lixo versionado:** `scripts/_tmp-*`, `scripts/_tmp-probrumadinho/`, `scripts/__pycache__/`, `apps/logs/coleta-diario-completa.log` e `docs/relatorios-automacao/logs/*.log` estão no working tree e deveriam estar fora do git.
- **Incidente vivo não registrado:** o deploy de 01/09 falhou (ver Fase 2b); `docs/02-estado/ESTADO.md` não tem o registro.

## Fase 0 — sanear o git antes de mexer

Pré-requisito. Sem isso, qualquer commit mistura ruído de linha com conteúdo.

1. Criar/ajustar `.gitattributes`: `* text=auto eol=lf`; `*.md text eol=lf`; `*.json text eol=lf`; binários conhecidos com `-text`.
2. `git add --renormalize .` e commit único `chore(git): normaliza fim de linha via .gitattributes`.
3. Commitar separado o pass de template de 01/09: `docs(template): aplica cabeçalho padrão nos docs` (ou reverter, se for ruído puro — conferir um diff antes).
4. `.gitignore`: `logs/`, `apps/logs/*.log`, `docs/relatorios-automacao/logs/`, `scripts/_tmp-*`, `scripts/_tmp-probrumadinho/`, `__pycache__/`, `.cache/` (conferir o que já está ignorado).
5. Só depois disso, trabalhar conteúdo de docs com a árvore limpa.

## Fase 1 — o que vai para historico/

Regra do GUIA: plano entregue ou superado → `historico/entregas/`; descoberta/fonte → `historico/descobertas/` ou `historico/fontes/`; procedimento antigo → `historico/procedimentos/`. Mover = `git mv` + atualizar `02-estado/ESTADO.md` + `docs/README.md`.

Candidatos medidos em 01/09:

| Arquivo | Motivo | Destino |
|---|---|---|
| `planos/deploy-github-pages.md` | legado explícito no OPERACAO ("não é o caminho de publicação") | `historico/planos/` |
| `planos/PLANO-NAVEGACAO-WIKI.md` | superado pela estrutura numerada do GUIA | `historico/planos/` |
| `planos/PLANO-INDICE-ESTATICO-E-ASSISTENTE.md` | índice estático entregue (commit da /busca) | `historico/entregas/` |
| `planos/PLANO-EXPANSAO-ACORDOS-MG.md` | marcado "Bloco 0 ENTREGUE"; só o que falta vai para ESTADO | `historico/entregas/` |
| `planos/PLANO-M7-M11-CURADORIA-OSS.md` | fila M1–M6 entregue; atualizar estado antes de arquivar | `historico/entregas/` |
| `planos/PLANO-CLOUDFLARE-TUNNEL.md` | túnel implementado (config.yml e credenciais existem) | `historico/entregas/` |
| `planos/PLANO-PGVECTOR-CHATBOT.md` | runbook de fase pós-Neon; reclassificar após ROTEIRO-NEON | `historico/` (se executado) |
| `planos/diario-oficial-plano.md` | conferir se o diário oficial foi publicado | `historico/` (se entregue) |
| `HANDOFF-FASE2-PARAOPEBA.md` (raiz docs) | fora do padrão da raiz; conferir estado | `historico/entregas/` ou `planos/` |
| `planos/ROTEIRO-EXECUCAO-PENDENCIAS.md` | fila consolidada deve viver no ESTADO | fundir em ESTADO e arquivar |
| `planos/TODO-PROXIMAS-RODADAS.md` | dívidas vivem no ESTADO | fundir em ESTADO e arquivar |
| `planos/ROTEIRO-NEON-01-09.md` | data de validade 01/09; executar e arquivar com resultado | `historico/entregas/` |

Demais `planos/` ativos (bases clima/risco, geocodificação, transparência justiça, espelho PDF AJRI, expansão nacional, revisão dados, SEO, UX/onboarding, diagnóstico UX, Handoff M9/M10 Podman, canário/chatbot consolidado) ficam em `planos/`, mas com estado e data de medição atualizados.

## Fase 1b — consolidar duplicados

- **Chatbot/assistente:** um único plano ativo (proposta: `planos/PLANO-ASSISTENTE-IA.md`) absorvendo `PLANO-CHATBOT-IA.md` + `PLANO-SEU-NONO-NOTEBOOKLM.md` + `PLANO-CANARIO-TELEGRAM.md`; os três vão para `historico/`.
- **Completude:** fundir `planos/CLASSIFICACAO-COMPLETUDE.md` e `historico/procedimentos/REVISAO-COMPLETUDE.md` em um documento único; arquivar o outro com redirect.

## Fase 2 — o que está desatualizado

1. Re-medir e atualizar data + números dos docs com `Última medição: 2026-08-22` cujo conteúdo mudou: `GUIA-DE-DOCUMENTACAO.md`, `04-arquitetura/ARQUITETURA.md`, `05-operacao/OPERACAO.md`, `05-operacao/GATILHO-REMOTO.md`, `03-desenvolvimento/DESENVOLVIMENTO.md`, `LEIA-PRIMEIRO.md`, `07-edicao/EDICAO.md`.
2. `docs/README.md` (índice mestre) refletir a estrutura real: incluir `relatorios-automacao/`, `dados/`, `dominios/` e o que foi movido.
3. Atualizar `docs/02-estado/ESTADO.md` com:
   - o incidente de 01/09 (deploy falhou às 14:46Z no upload de assets da Cloudflare — `fetch failed` / "Unable to resolve Cloudflare's API hostname"; 2.649 de 4.891 assets; log `logs/rotina-2026-09-01T13-40-20-24500.log` termina em `ABORTADO: o deploy falhou. O site continua com a versão anterior.`);
   - estado do ar: site `controlepopular.com.br` respondendo 502 em 01/09 ~15h — servidor `next start -p 3000` e túnel `controle-popular` não estão rodando (só o túnel `sementeira` está ativo);
   - a fila viva pós-consolidação (Fase 1).
4. Conferir consistência do template aplicado em 01/09 (pass pode ter deixado cabeçalho incompleto em alguns arquivos).

## Fase 3 — índice mestre e validação

1. Rodar `scripts/validar-documentacao.py` e corrigir o que apontar: docs sem sumário, links internos quebrados, medições com mais de 60 dias, `docs/README.md` fora da realidade.
2. Registrar no `GUIA-DE-DOCUMENTACAO.md` uma regra executável: plano entregue → `git mv` para `historico/entregas/` no MESMO commit da entrega + atualizar ESTADO.md e README.md.
3. Rotina mensal (dia 1): rodar `validar-documentacao.py` e conferir `docs/relatorios-automacao/` (manter só o snapshot mais recente versionado; logs fora do git).

## Decisões registradas

- **Sanear antes de reorganizar** — 3.761 arquivos `M` impossibilitam diff limpo; a normalização de linha e o pass de template viram commits próprios.
- **`historico/` ganha `planos/`** — planos entregues não são "entregas" nem "descobertas"; ter subpasta própria evita forçar nome.
- **Fila viva mora no ESTADO** — `TODO-PROXIMAS-RODADAS.md` e `ROTEIRO-EXECUCAO-PENDENCIAS.md` deixam de existir como planos separados.
- **Um plano por assunto** — chatbot/assistente e completude passam a ter um documento único.
- **Incidente vira registro de estado** — falha de deploy de 01/09 entra no ESTADO.md, não só no log.

## Origem / Histórico

Escrito em 01/09/2026 a partir de medição ao vivo do repo (`git status`, datas de `Última medição` em ~115 docs, logs de `rotina-*.log`, estado das tarefas agendadas e do túnel). Absorve o pedido de organizar a documentação deste PC e separar histórico de conteúdo vivo.
