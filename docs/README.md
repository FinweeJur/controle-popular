# Índice da documentação

> **Tipo:** INDICE
> **Domínio:** global
> **Última medição:** 2026-08-22
> **Leitura estimada:** curta (< 5 min)
> **Relacionados:** [GUIA-DE-DOCUMENTACAO.md](GUIA-DE-DOCUMENTACAO.md), [AGENTS.md](/AGENTS.md), [LEIA-PRIMEIRO.md](LEIA-PRIMEIRO.md)
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

| Quando ler | Documento | Onde está hoje |
|---|---|---|
| Sempre — o que é o portal, frentes e regras editoriais | **PRODUTO** | [`PRODUTO.md`](PRODUTO.md) |
| Decidir o que fazer agora — fila, bloqueios, dívida | **ESTADO** | [`ESTADO.md`](ESTADO.md) |
| Antes do primeiro commit | **DESENVOLVIMENTO** | [`DESENVOLVIMENTO.md`](DESENVOLVIMENTO.md) |

## Documentos por área

| Área | Documento | Onde está hoje |
|---|---|---|
| Fontes e coleta | FONTES | [`FONTES.md`](FONTES.md) |
| Arquitetura e payload | ARQUITETURA | [`ARQUITETURA.md`](ARQUITETURA.md) |
| Mapa técnico detalhado | MAPA-APLICACAO | [`MAPA-APLICACAO.md`](MAPA-APLICACAO.md) |
| Operação, build e deploy | OPERACAO | [`OPERACAO.md`](OPERACAO.md) |
| Gatilho remoto de publicação | GATILHO-REMOTO | [`GATILHO-REMOTO.md`](GATILHO-REMOTO.md) |
| Edição de conteúdo sem código | EDICAO | [`EDICAO.md`](EDICAO.md) |
| Créditos de mídia | CREDITOS-MIDIA | [`CREDITOS-MIDIA.md`](CREDITOS-MIDIA.md) |
| Protocolos de LAI | LAI-PROTOCOLOS | [`LAI-PROTOCOLOS.json`](LAI-PROTOCOLOS.json) |

## Planos ativos

Planos de trabalho não iniciados ou em andamento vivem em [`planos/`](planos/). Veja o estado de cada um em [`ESTADO.md`](ESTADO.md).

## Histórico

Documentos entregues ou superados vivem em [`_historico/`](_historico/). Números lá são medições do passado; se for decidir com eles, remeça.

## Decisões registradas

- **A docs/ será reorganizada em pastas numeradas (`01-produto/` a `07-edicao/`)** — decisão de 22/08/2026. Durante a migração, este índice aponta para os locais atuais dos arquivos.
- **`ARQUITETURA.md` e `MAPA-APLICACAO.md` serão fundidos** — decisão ainda em aberto (item 28 de `ESTADO.md`). Até lá, ambos estão listados.
