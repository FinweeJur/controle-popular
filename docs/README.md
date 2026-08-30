# Índice da documentação

> **Tipo:** INDICE
> **Domínio:** global
> **Última medição:** 2026-08-30
> **Leitura estimada:** curta (< 5 min)
> **Relacionados:** [LEIA-PRIMEIRO.md](LEIA-PRIMEIRO.md), [GUIA-DE-DOCUMENTACAO.md](GUIA-DE-DOCUMENTACAO.md), [AGENTS.md](/AGENTS.md)
> **Palavras-chave:** índice, documentação, portal, frentes, planos, histórico, navegação

## Sumário

- [Propósito](#propósito)
- [Como usar este índice](#como-usar-este-índice)
- [Porta de entrada](#porta-de-entrada)
- [Documentos por área](#documentos-por-área)
- [Planos ativos](#planos-ativos)
- [Histórico](#histórico)
- [Decisões registradas](#decisões-registradas)

## Propósito

Servir como porta de entrada para toda a documentação do projeto. Quem chega em `docs/` deve saber em qual documento entrar em menos de um minuto.

## Como usar este índice

- **Ninguém lê tudo.** Cada documento tem um propósito claro no cabeçalho; leia só o que sua tarefa exige.
- As regras duras do repositório — commit, worktree, dado pessoal, publicação — estão em [`AGENTS.md`](/AGENTS.md).
- As regras de escrita, template e manutenção dos documentos estão em [`GUIA-DE-DOCUMENTACAO.md`](GUIA-DE-DOCUMENTACAO.md).

## Porta de entrada

| Quando ler | Documento | Caminho |
|---|---|---|
| Sempre — o que é o portal, frentes e regras editoriais | **PRODUTO** | [`01-produto/PRODUTO.md`](01-produto/PRODUTO.md) |
| Decidir o que fazer agora — fila, bloqueios, dívida | **ESTADO** | [`02-estado/ESTADO.md`](02-estado/ESTADO.md) |
| Antes do primeiro commit | **DESENVOLVIMENTO** | [`03-desenvolvimento/DESENVOLVIMENTO.md`](03-desenvolvimento/DESENVOLVIMENTO.md) |

## Documentos por área

| Área | Documento | Caminho |
|---|---|---|
| Fontes e coleta | FONTES | [`06-fontes/FONTES.md`](06-fontes/FONTES.md) |
| Catálogo dados.gov.br — uso e sugestões | DADOS-GOV-BR | [`06-fontes/DADOS-GOV-BR.md`](06-fontes/DADOS-GOV-BR.md) |
| Arquitetura e payload | ARQUITETURA | [`04-arquitetura/ARQUITETURA.md`](04-arquitetura/ARQUITETURA.md) |
| Mapa técnico detalhado | MAPA-APLICACAO | [`04-arquitetura/MAPA-APLICACAO.md`](04-arquitetura/MAPA-APLICACAO.md) |
| Operação, build e deploy | OPERACAO | [`05-operacao/OPERACAO.md`](05-operacao/OPERACAO.md) |
| Gatilho remoto de publicação | GATILHO-REMOTO | [`05-operacao/GATILHO-REMOTO.md`](05-operacao/GATILHO-REMOTO.md) |
| Edição de conteúdo sem código | EDICAO | [`07-edicao/EDICAO.md`](07-edicao/EDICAO.md) |
| Créditos de mídia | CREDITOS-MIDIA | [`07-edicao/CREDITOS-MIDIA.md`](07-edicao/CREDITOS-MIDIA.md) |
| Protocolos de LAI | LAI-PROTOCOLOS | [`06-fontes/LAI-PROTOCOLOS.json`](06-fontes/LAI-PROTOCOLOS.json) |

## Planos ativos

Planos de trabalho não iniciados ou em andamento vivem em [`planos/`](planos/). Veja o estado de cada um em [`02-estado/ESTADO.md`](02-estado/ESTADO.md).

## Histórico

Documentos entregues ou superados vivem em [`historico/`](historico/). Números lá são medições do passado; se for decidir com eles, remeça.

## Decisões registradas

- **A docs/ foi reorganizada em pastas numeradas (`01-produto/` a `07-edicao/`)** — decisão de 22/08/2026, executada em 22/08/2026.
- **`ARQUITETURA.md` e `MAPA-APLICACAO.md` serão fundidos** — decisão ainda em aberto (item 28 de `02-estado/ESTADO.md`). Até lá, ambos estão em [`04-arquitetura/`](04-arquitetura/).
