# AGENTS.md — mapa de regras para quem trabalha neste repositório

> Lido automaticamente por opencode e por outros agentes de terminal.
> **A regra mora no documento linkado; aqui fica o resumo e o caminho.**
> Os links são caminhos do repositório no GitHub.
> Última medição: 18/10/2026.

**Palavras-chave:** agente, mapa, regras, commit, worktree, CPF, deploy,
robots, user-agent, pesquisa, qualidades, SEO, acessibilidade, Ollama.

## Sumário

- [Comece por aqui](#comece-por-aqui)
- [O que é o projeto](#o-que-é-o-projeto)
- [Estado vivo](#estado-vivo)
- [Onde as coisas moram](#onde-as-coisas-moram)
- [Regras que não se negociam](#regras-que-não-se-negociam)
- [Verificação mínima](#verificação-mínima)
- [Pesquisa na internet](#pesquisa-na-internet)
- [Armadilhas](#armadilhas)
- [Como falar com o dono](#como-falar-com-o-dono)
- [Mapa de documentos](#mapa-de-documentos)

## Comece por aqui

| Você quer… | Leia |
|---|---|
| começar sessão nova e achar o caminho | [PROMPT-SESSAO-NOVA.md](docs/03-desenvolvimento/PROMPT-SESSAO-NOVA.md) |
| saber o que fazer agora | [ESTADO.md](docs/02-estado/ESTADO.md) e [RADAR-HOTSPOTS.md](docs/02-estado/RADAR-HOTSPOTS.md) |
| entender o portal e as frentes | [PRODUTO.md](docs/01-produto/PRODUTO.md) |
| commitar, worktree, sessão nova | [DESENVOLVIMENTO.md](docs/03-desenvolvimento/DESENVOLVIMENTO.md) |
| o texto completo de cada regra dura | [REGRAS-DURAS.md](docs/03-desenvolvimento/REGRAS-DURAS.md) |
| verificar antes de entregar | [VERIFICACAO-E-ENTREGA.md](docs/03-desenvolvimento/VERIFICACAO-E-ENTREGA.md) |
| coletar ou pesquisar na internet | [COLETA-ETICA.md](docs/06-fontes/COLETA-ETICA.md) |
| criar ou revisar página | [PADRAO-PAGINA-WIKI.md](docs/03-desenvolvimento/PADRAO-PAGINA-WIKI.md) |
| publicar, buildar, operar | [OPERACAO.md](docs/05-operacao/OPERACAO.md) |
| consultar uma fonte ou coletor | [FONTES.md](docs/06-fontes/FONTES.md) |
| fugir de um erro que já custou tempo | [ARMADILHAS.md](ARMADILHAS.md) |
| escolher ferramenta ou modelo | [FERRAMENTAS-E-MCP.md](docs/05-operacao/FERRAMENTAS-E-MCP.md) |
| falar com o dono | [COMUNICACAO-COM-O-DONO.md](docs/03-desenvolvimento/COMUNICACAO-COM-O-DONO.md) |

## O que é o projeto

Portal cívico de transparência: **controlepopular.com.br**.
Junta dado oficial espalhado e publica por cidade e por tema.
O leitor está sob estresse: número errado é dano, insinuação também.
Quatro eixos e mais de 36 subfrentes. Detalhe em
[PRODUTO.md](docs/01-produto/PRODUTO.md).

## Estado vivo

- **Banco:** Heroku Postgres desde 08/10/2026. A Neon antiga está sem uso.
  ⚠️ O RDS fica em `us-east-1`, fora do Brasil — decisão do dono.
- **Publicação principal:** Azure Container Apps, `www.controlepopular.com.br`.
  Guara Cloud está parado por cota; o túnel do `home-pc` é o servidor 2.
- **Deploy é manual.** Push não publica. Publicar só com ordem do dono.
- **Fila viva, bloqueios e dívida:** [ESTADO.md](docs/02-estado/ESTADO.md).
- **Onde corrigir, atualizar, editar e ampliar:** [RADAR-HOTSPOTS.md](docs/02-estado/RADAR-HOTSPOTS.md).
- **O que cada agente entregou:** [RELATORIOS-AGENTES.md](docs/02-estado/RELATORIOS-AGENTES.md).

Tato é melhor que suposição: **remeça** antes de decidir com número antigo.

## Onde as coisas moram

```
apps/web/app/         rotas (App Router). *.din.ts só existe no alvo Cloudflare
apps/web/lib/         lógica pura + testes ao lado (<mod>.ts + <mod>.test.ts)
apps/web/lib/db/      Drizzle: schema e queries
apps/web/data/        dado versionado, lido no build — compacte antes de commitar
apps/web/scripts/     geradores (cidades-do-build, índice de busca)
scripts/              coletores, agentes e rotinas (rotina-local.mts publica)
docs/                 índice: docs/README.md
etl/                  ETL em Python
```

Arquitetura, payload e banco: [ARQUITETURA.md](docs/04-arquitetura/ARQUITETURA.md).
Fluxo de trabalho: [DESENVOLVIMENTO.md](docs/03-desenvolvimento/DESENVOLVIMENTO.md).

### Checkout canônico

- **Código só em `X:\DevCoder`.** O checkout canônico é
  `X:\DevCoder\controle-popular`.
- Nunca clone em `C:\Users\...` nem em `C:\DevCoder\...`.
- Worktree só dentro do canônico: `.claude\worktrees\<nome>`.
- Worktree concluída: push para `origin/archive/<data>/<branch>`, depois
  `git worktree remove` e `git branch -D`.
- Clone antigo só sai depois de `git bundle` em `X:\DevCoder\_backup-git\`.
- **MausBot** roda em `X:\DevCoder\OpenMausBot`; dados em
  `X:\DevCoder\OpenMausBotData` via `OMB_DATA_DIR`.
- Detalhe e comandos: [CHECKOUT-CANONICO.md](docs/03-desenvolvimento/CHECKOUT-CANONICO.md).
- Prompt pronto para sessão nova: [PROMPT-SESSAO-NOVA.md](docs/03-desenvolvimento/PROMPT-SESSAO-NOVA.md).

## Regras que não se negociam

Cada linha tem o resumo. O texto completo, a medição e o motivo estão em
[REGRAS-DURAS.md](docs/03-desenvolvimento/REGRAS-DURAS.md).

| # | Regra em uma linha |
|---|---|
| [5.1](docs/03-desenvolvimento/REGRAS-DURAS.md#51-coleção-nunca-como-props-de-componente-de-cliente) | Coleção acima de ~2 mil linhas não vai como props de componente de cliente; use índice fatiado ou paginação no servidor. |
| [5.2](docs/03-desenvolvimento/REGRAS-DURAS.md#52-dado-pessoal-varrer-o-dado-não-só-o-código) | Varra o **dado**, não só o código: CPF por mod-11, `DIRETORIOS_DADO` e suíte antes de commitar dado coletado. |
| [5.3](docs/03-desenvolvimento/REGRAS-DURAS.md#53---force-nunca) | `--force` nunca. É a única operação que apaga trabalho de outra sessão sem volta. |
| [5.4](docs/03-desenvolvimento/REGRAS-DURAS.md#54-worktree-quando-há-briga-sessão-nova-quando-o-contexto-fica-sujo) | 1 sessão: commit na `main`. 2+ sessões: worktree, branch e porta próprios. Contexto sujo: sessão nova. |
| [5.5](docs/03-desenvolvimento/REGRAS-DURAS.md#55-commit-por-pathspec-explícito) | Commit por `git commit --only <caminho>`; `git diff --cached --name-only` tem de estar vazio antes. |
| [5.6](docs/03-desenvolvimento/REGRAS-DURAS.md#56-mensagem-de-commit-por-arquivo-nunca--m) | Mensagem em arquivo, `git commit -F`. Nunca `-m`. Trailer com modelo e plataforma. |
| [5.7](docs/03-desenvolvimento/REGRAS-DURAS.md#57-commit-e-push-sempre-na-hora) | Trabalho terminado vira commit e push na hora. O push não publica. |
| [5.7.1](docs/03-desenvolvimento/REGRAS-DURAS.md#571-push-deploy-manual-cota-de-build-do-guara) | Deploy só com ordem do dono. Azure é o caminho principal; Guara gasta cota. |
| [5.8](docs/03-desenvolvimento/REGRAS-DURAS.md#58-privacidade-contra-agentes-de-ia) | Nunca leia nem exiba segredo; nunca mande CPF bruto para prompt de IA. |
| [5.9](docs/03-desenvolvimento/REGRAS-DURAS.md#59-código-tem-sim-comentários-explicativos-e-função-clara) | Todo módulo abre com comentário: o que é, fonte oficial e por que foi feito assim. |
| [5.10](docs/03-desenvolvimento/REGRAS-DURAS.md#510-fonte-mínima-da-descrição-da-página) | Descrição sob o `<h1>` nunca menor que `text-sm`; longa usa “Ver + Texto”. |
| [5.11](docs/03-desenvolvimento/REGRAS-DURAS.md#511-o-webhook-do-bot-do-telegram-aponta-para-o-portal-só) | Webhook do bot público só em `https://www.controlepopular.com.br/api/telegram`. |
| [5.12](docs/03-desenvolvimento/REGRAS-DURAS.md#512-ollama-local-confira-hardware-e-modelos-delegue-o-repetitivo-poupe-token) | Confira hardware e modelo antes de usar Ollama; delegue o repetitivo, não o julgamento. |
| [5.13](docs/03-desenvolvimento/REGRAS-DURAS.md#513-casca-persistente-link-interno-navega-no-cliente-nunca-recarrega) | Link interno usa `next/link`; a casca e o rádio não podem desmontar. |
| [5.14](docs/03-desenvolvimento/REGRAS-DURAS.md#514-o-celular-é-a-régua-responsividade-e-legibilidade-são-qualidade-do-dado) | O celular é a régua: 390 px, sem rolagem lateral falsa, `<main>` com `w-full`. |
| [5.15](docs/03-desenvolvimento/REGRAS-DURAS.md#515-modelo-de-ia-escolhido-pela-dificuldade-da-tarefa-barato-primeiro) | Modelo pela dificuldade, barato primeiro; soberania do dado decide o motor. |

## Verificação mínima

Todo commit, em segundos:

```bash
npx tsc --noEmit                              # em apps/web
npx vitest run lib/sem-cpf-no-repo.test.ts    # CPF não pode vazar
npx eslint <arquivos do diff>                 # só o que mudou
python scripts/validar-documentacao.py        # se mexeu em docs/
```

Antes do push e do deploy: `npm test`.
CodeScene, escopo do diff e suíte completa:
[VERIFICACAO-E-ENTREGA.md](docs/03-desenvolvimento/VERIFICACAO-E-ENTREGA.md).

## Pesquisa na internet

Vale para este repositório **e para qualquer repositório do dono**.

1. **User-Agent honesto, sempre:** `FinweeJur/Github Artur colito`.
   Nunca UA de navegador falso, nunca UA vazio.
2. **Antes de acessar, leia:** termos de uso, `robots.txt`, `/docs`/`/api`
   e a licença.
3. **Respeite:** `Disallow`, `Crawl-delay`, limite de requisições e área
   autenticada. Termo que proíbe coleta encerra a tarefa.
4. **Uso ético:** só dado público, finalidade cívica, sem burlar login,
   CAPTCHA, paywall ou rate limit.
5. **Ritmo:** 1–2 s por host; checkpoint; coleta fora da CI.
6. **Registre a decisão** no cabeçalho do coletor quando houver exceção.

Detalhe e checklist: [COLETA-ETICA.md](docs/06-fontes/COLETA-ETICA.md).

## Armadilhas

A tabela única, sem duplicata, mora em [ARMADILHAS.md](ARMADILHAS.md).
Consulte antes de repetir um caminho que já falhou.

## Como falar com o dono

Frases de até 13 palavras. Oração direta. Termo técnico explicado.
Emojis para guiar o olho: ✅ 🚧 ⛔ ⚠️. Quebre linha.
Em etapa longa, avise no Telegram em 2–3 linhas.
Detalhe: [COMUNICACAO-COM-O-DONO.md](docs/03-desenvolvimento/COMUNICACAO-COM-O-DONO.md).

## Mapa de documentos

| Tema | Documento |
|---|---|
| Produto, frentes e público | [PRODUTO.md](docs/01-produto/PRODUTO.md) |
| Regra editorial | [REGRA-EDITORIAL.md](docs/01-produto/REGRA-EDITORIAL.md) |
| Estado, fila, bloqueios e dívida | [ESTADO.md](docs/02-estado/ESTADO.md) |
| Radar de correção, atualização, edição e ampliação | [RADAR-HOTSPOTS.md](docs/02-estado/RADAR-HOTSPOTS.md) |
| Relatórios finais de agentes | [RELATORIOS-AGENTES.md](docs/02-estado/RELATORIOS-AGENTES.md) |
| Fluxo de trabalho e worktrees | [DESENVOLVIMENTO.md](docs/03-desenvolvimento/DESENVOLVIMENTO.md) |
| Checkout canônico e prompt de sessão nova | [CHECKOUT-CANONICO.md](docs/03-desenvolvimento/CHECKOUT-CANONICO.md) e [PROMPT-SESSAO-NOVA.md](docs/03-desenvolvimento/PROMPT-SESSAO-NOVA.md) |
| Regras duras completas | [REGRAS-DURAS.md](docs/03-desenvolvimento/REGRAS-DURAS.md) |
| Verificação e entrega | [VERIFICACAO-E-ENTREGA.md](docs/03-desenvolvimento/VERIFICACAO-E-ENTREGA.md) |
| Padrão de página wiki | [PADRAO-PAGINA-WIKI.md](docs/03-desenvolvimento/PADRAO-PAGINA-WIKI.md) |
| Glossário | [GLOSSARIO-DEV.md](docs/03-desenvolvimento/GLOSSARIO-DEV.md) |
| Arquitetura e payload | [ARQUITETURA.md](docs/04-arquitetura/ARQUITETURA.md) |
| Oito qualidades da informação | [QUALIDADES-DA-INFORMACAO.md](docs/04-arquitetura/QUALIDADES-DA-INFORMACAO.md) |
| Revisão de código | [REVISAO-CODIGO.md](docs/04-arquitetura/REVISAO-CODIGO.md) |
| Operação, build e deploy | [OPERACAO.md](docs/05-operacao/OPERACAO.md) |
| Ferramentas de CLI e MCP | [FERRAMENTAS-E-MCP.md](docs/05-operacao/FERRAMENTAS-E-MCP.md) |
| Fontes e coleta | [FONTES.md](docs/06-fontes/FONTES.md) |
| Coleta ética e pesquisa na internet | [COLETA-ETICA.md](docs/06-fontes/COLETA-ETICA.md) |
| Edição sem código | [EDICAO.md](docs/07-edicao/EDICAO.md) |
| Planos ativos | [docs/planos/](docs/planos/) |
| Histórico e entregas | [docs/historico/](docs/historico/) |
| Índice geral da documentação | [docs/README.md](docs/README.md) |

## Origem / Histórico

- **18/10/2026 — AGENTS.md vira mapa.** O texto completo das regras foi movido
  para documentos temáticos, com link em cada linha. Nada foi apagado.
- **18/10/2026 — pesquisa na internet ganha regra própria:** UA honesto
  `FinweeJur/Github Artur colito`, leitura de termos, `robots.txt`, `/docs`,
  respeito aos limites e uso ético.
- Histórico de incidentes: [docs/historico/](docs/historico/).
