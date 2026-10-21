# Índice da documentação

> **Tipo:** INDICE
> **Domínio:** global
> **Última medição:** 2026-10-21
> **Leitura estimada:** curta (< 5 min)
> **Relacionados:** [GUIA-DE-DOCUMENTACAO.md](GUIA-DE-DOCUMENTACAO.md), [AGENTS.md](/AGENTS.md)
> **Palavras-chave:** índice, documentação, portal, frentes, planos, histórico, navegação

## Sumário

- [Propósito](#propósito)
- [Como usar](#como-usar)
- [Porta de entrada](#porta-de-entrada)
- [Documentos por área](#documentos-por-área)
- [Planos e histórico](#planos-e-histórico)
- [Decisões registradas](#decisões-registradas)

## Propósito

Entrada única da documentação. Quem chega descobre o documento certo
em menos de um minuto. As regras duras do repositório — commit, worktree,
dado pessoal, publicação — estão no [`AGENTS.md`](/AGENTS.md), que é lido
automáticamente pelos agentes de código.

## Como usar

- **Ninguém lê tudo.** Leia só o que a tarefa exige.
- Cada documento abre com metadados (`Tipo`, `Domínio`, `Última medição`).
- A validação da CI roda em qualquer edição de docs:
  `python scripts/validar-documentacao.py`.

## Porta de entrada

| Quando ler | Documento | Caminho |
|---|---|---|
| Procurar onde corrigir, atualizar, editar ou ampliar | **RADAR-HOTSPOTS** | [`02-estado/RADAR-HOTSPOTS.md`](02-estado/RADAR-HOTSPOTS.md) |
| Ver o que cada agente entregou e o que ficou aberto | **RELATORIOS-AGENTES** | [`02-estado/RELATORIOS-AGENTES.md`](02-estado/RELATORIOS-AGENTES.md) |
| Sempre — o que é o portal, frentes e regras editoriais | **PRODUTO** | [`01-produto/PRODUTO.md`](01-produto/PRODUTO.md) |
| Decidir o que fazer agora — fila, bloqueios, dívida | **ESTADO** | [`02-estado/ESTADO.md`](02-estado/ESTADO.md) |
| Antes do primeiro commit — worktree, commit, push | **DESENVOLVIMENTO** | [`03-desenvolvimento/DESENVOLVIMENTO.md`](03-desenvolvimento/DESENVOLVIMENTO.md) |
| Texto completo de cada regra dura | **REGRAS-DURAS** | [`03-desenvolvimento/REGRAS-DURAS.md`](03-desenvolvimento/REGRAS-DURAS.md) |
| Criar página nova ou revisar o padrão wiki | **PADRAO-PAGINA-WIKI** | [`03-desenvolvimento/PADRAO-PAGINA-WIKI.md`](03-desenvolvimento/PADRAO-PAGINA-WIKI.md) |
| Rodar o portal na sua máquina | **SETUP-LOCAL** | [`03-desenvolvimento/SETUP-LOCAL.md`](03-desenvolvimento/SETUP-LOCAL.md) |
| Checkout canônico, worktree e arquivamento | **CHECKOUT-CANONICO** | [`03-desenvolvimento/CHECKOUT-CANONICO.md`](03-desenvolvimento/CHECKOUT-CANONICO.md) |
| Prompt para sessão nova | **PROMPT-SESSAO-NOVA** | [`03-desenvolvimento/PROMPT-SESSAO-NOVA.md`](03-desenvolvimento/PROMPT-SESSAO-NOVA.md) |
| Soul curto de bot de código | **SOUL-BOT-DEV** | [`03-desenvolvimento/SOUL-BOT-DEV.md`](03-desenvolvimento/SOUL-BOT-DEV.md) |
| Coletar ou pesquisar na internet | **COLETA-ETICA** | [`06-fontes/COLETA-ETICA.md`](06-fontes/COLETA-ETICA.md) |
| Regras duras do repo (lido por agentes) | AGENTS | [`/AGENTS.md`](/AGENTS.md) |

## Documentos por área

| Área | Documento | Caminho |
|---|---|---|
| Arquitetura e payload | ARQUITETURA | [`04-arquitetura/ARQUITETURA.md`](04-arquitetura/ARQUITETURA.md) |
| Mapa técnico detalhado | MAPA-APLICACAO | [`04-arquitetura/MAPA-APLICACAO.md`](04-arquitetura/MAPA-APLICACAO.md) |
| Oito qualidades da informação | QUALIDADES | [`04-arquitetura/QUALIDADES-DA-INFORMACAO.md`](04-arquitetura/QUALIDADES-DA-INFORMACAO.md) |
| Revisão de código e onboarding | REVISAO-CODIGO | [`04-arquitetura/REVISAO-CODIGO.md`](04-arquitetura/REVISAO-CODIGO.md) |
| Manual de RAG, LLM, avaliação e agentes locais | MANUAL-RAG-E-LLM | [`03-desenvolvimento/MANUAL-RAG-E-LLM.md`](03-desenvolvimento/MANUAL-RAG-E-LLM.md) |
| Operação, build e deploy | OPERACAO | [`05-operacao/OPERACAO.md`](05-operacao/OPERACAO.md) |
| Ferramentas de CLI e MCP | FERRAMENTAS-E-MCP | [`05-operacao/FERRAMENTAS-E-MCP.md`](05-operacao/FERRAMENTAS-E-MCP.md) |
| Fontes e coleta | FONTES | [`06-fontes/FONTES.md`](06-fontes/FONTES.md) |
| Coleta ética e pesquisa na internet | COLETA-ETICA | [`06-fontes/COLETA-ETICA.md`](06-fontes/COLETA-ETICA.md) |
| Regra editorial | REGRA-EDITORIAL | [`01-produto/REGRA-EDITORIAL.md`](01-produto/REGRA-EDITORIAL.md) |
| Verificação em camadas | VERIFICACAO-E-ENTREGA | [`03-desenvolvimento/VERIFICACAO-E-ENTREGA.md`](03-desenvolvimento/VERIFICACAO-E-ENTREGA.md) |
| Comunicação com o dono | COMUNICACAO-COM-O-DONO | [`03-desenvolvimento/COMUNICACAO-COM-O-DONO.md`](03-desenvolvimento/COMUNICACAO-COM-O-DONO.md) |
| Transnacional G20 e Brasil | G20-TRANSNACIONAL | [`06-fontes/G20-TRANSNACIONAL-BRASIL.md`](06-fontes/G20-TRANSNACIONAL-BRASIL.md) |
| Catálogo dados.gov.br | DADOS-GOV-BR | [`06-fontes/DADOS-GOV-BR.md`](06-fontes/DADOS-GOV-BR.md) |
| Protocolos de LAI | LAI-PROTOCOLOS | [`06-fontes/LAI-PROTOCOLOS.json`](06-fontes/LAI-PROTOCOLOS.json) |
| Edição de conteúdo sem código | EDICAO | [`07-edicao/EDICAO.md`](07-edicao/EDICAO.md) |
| Créditos de mídia | CREDITOS-MIDIA | [`07-edicao/CREDITOS-MIDIA.md`](07-edicao/CREDITOS-MIDIA.md) |
| Laboratório de dados | LABORATORIO | [`dominios/LABORATORIO.md`](dominios/LABORATORIO.md) |

Operação tem docs irmãos em `05-operacao/`: [GATILHO-REMOTO.md](05-operacao/GATILHO-REMOTO.md)
(ativação por Telegram) e runbooks citados no OPERACAO.

## Planos e histórico

- **Inventário de agentes:** [`02-estado/RELATORIOS-AGENTES.md`](02-estado/RELATORIOS-AGENTES.md)
  — resumos finais, handoffs, planos abertos e worktrees.
- **Radar de trabalho:** [`02-estado/RADAR-HOTSPOTS.md`](02-estado/RADAR-HOTSPOTS.md)
  — onde corrigir, atualizar, editar e ampliar.
- **Planos ativos (6):**
  [`PLANO-INTEGRADO-AMBIENTAL-E-DADOS.md`](planos/PLANO-INTEGRADO-AMBIENTAL-E-DADOS.md),
  [`PLANO-INTEGRADO-PRODUTO-E-INTERFACE.md`](planos/PLANO-INTEGRADO-PRODUTO-E-INTERFACE.md),
  [`PLANO-INTEGRADO-OPERACAO-E-AGENTES.md`](planos/PLANO-INTEGRADO-OPERACAO-E-AGENTES.md),
  [`PLANO-CAVAS-MVP.md`](planos/PLANO-CAVAS-MVP.md),
  [`PLANO-RAG-JURIMETRIA-TJMG.md`](planos/PLANO-RAG-JURIMETRIA-TJMG.md) e
  [`PLANO-RAG-DOCUMENTAL.md`](planos/PLANO-RAG-DOCUMENTAL.md).
- **Histórico:** [`historico/`](historico/) — os outros planos foram
  arquivados em 18/10/2026 em [`historico/planos/`](historico/planos/) e
  [`historico/entregas/`](historico/entregas/), com nota de arquivamento.
  Números lá são medições do passado; se decidir com eles, remeça.

## Decisões registradas

- **Catálogo de fonte se prova por teste, não por confiança** (30/09/2026):
  a revisão de código achou 13 de 42 caminhos de arquivo do catálogo de fontes
  apontando para arquivo inexistente (o dado migrara para bundles ETL em
  `etl/betim/dados/` ou fora consolidado). `lib/fontes/registry.test.ts` agora
  recusa caminho que não existe. Detalhe: [REVISAO-CODIGO.md, Parte 18](04-arquitetura/REVISAO-CODIGO.md).
- **Deploy principal = Azure Container Apps** (06/10/2026): `www.controlepopular.com.br`
  no Azure; a raiz vive de redirect no Cloudflare. Guara está parado por cota;
  túnel do `home-pc` é o servidor 2 e o Worker é fallback. Detalhes:
  [ESTADO.md § No ar agora](02-estado/ESTADO.md#no-ar-agora).
- **Expansão Multilateral & Internacional** (29/09/2026): Hubs `/internacional`,
  `/eua` e `/canada`, modo trilíngue PT/EN/ES com voz nativa e bot coletor com R2.
- **Espelhos de Resiliência** (29/09/2026): Replicação automática do código no
  GitLab e Hugging Face em substituição ao Gitee.
- **Docs reorganizados em pastas numeradas** (`01-produto/` a `07-edicao/`) —
  decisão de 22/08/2026, executada no mesmo dia.
- **`ARQUITETURA.md` e `MAPA-APLICACAO.md` serão fundidos** — decisão em aberto
  (item 28 do [ESTADO.md](02-estado/ESTADO.md)). Até lá, ambos em
  [`04-arquitetura/`](04-arquitetura/).
