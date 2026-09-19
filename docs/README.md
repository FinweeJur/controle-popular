# Índice da documentação

> **Tipo:** INDICE
> **Domínio:** global
> **Última medição:** 2026-09-19
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
| Sempre — o que é o portal, frentes e regras editoriais | **PRODUTO** | [`01-produto/PRODUTO.md`](01-produto/PRODUTO.md) |
| Decidir o que fazer agora — fila, bloqueios, dívida | **ESTADO** | [`02-estado/ESTADO.md`](02-estado/ESTADO.md) |
| Antes do primeiro commit — worktree, commit, push | **DESENVOLVIMENTO** | [`03-desenvolvimento/DESENVOLVIMENTO.md`](03-desenvolvimento/DESENVOLVIMENTO.md) |
| Regras duras do repo (lido por agentes) | AGENTS | [`/AGENTS.md`](/AGENTS.md) |

## Documentos por área

| Área | Documento | Caminho |
|---|---|---|
| Arquitetura e payload | ARQUITETURA | [`04-arquitetura/ARQUITETURA.md`](04-arquitetura/ARQUITETURA.md) |
| Mapa técnico detalhado | MAPA-APLICACAO | [`04-arquitetura/MAPA-APLICACAO.md`](04-arquitetura/MAPA-APLICACAO.md) |
| Operação, build e deploy | OPERACAO | [`05-operacao/OPERACAO.md`](05-operacao/OPERACAO.md) |
| Fontes e coleta | FONTES | [`06-fontes/FONTES.md`](06-fontes/FONTES.md) |
| Catálogo dados.gov.br | DADOS-GOV-BR | [`06-fontes/DADOS-GOV-BR.md`](06-fontes/DADOS-GOV-BR.md) |
| Protocolos de LAI | LAI-PROTOCOLOS | [`06-fontes/LAI-PROTOCOLOS.json`](06-fontes/LAI-PROTOCOLOS.json) |
| Edição de conteúdo sem código | EDICAO | [`07-edicao/EDICAO.md`](07-edicao/EDICAO.md) |
| Créditos de mídia | CREDITOS-MIDIA | [`07-edicao/CREDITOS-MIDIA.md`](07-edicao/CREDITOS-MIDIA.md) |

Operação tem docs irmãos em `05-operacao/`: [GATILHO-REMOTO.md](05-operacao/GATILHO-REMOTO.md)
(ativação por Telegram) e runbooks citados no OPERACAO.

## Planos e histórico

- **Planos ativos:** [`planos/`](planos/) — o estado de cada um está na
  [fila do ESTADO.md](02-estado/ESTADO.md#fila-viva).
- **Histórico:** [`historico/`](historico/) — entregue ou superado.
  Números lá são medições do passado; se decidir com eles, remeça.

## Decisões registradas

- **Deploy principal = Guara Cloud** (19/09/2026): `www.controlepopular.com.br`
  ativa; a raiz vive de redirect no Cloudflare. Túnel e Worker seguem como
  servidor 2 e fallback. Detalhes: [ESTADO.md § No ar agora](02-estado/ESTADO.md#no-ar-agora).
- **Docs reorganizados em pastas numeradas** (`01-produto/` a `07-edicao/`) —
  decisão de 22/08/2026, executada no mesmo dia.
- **`ARQUITETURA.md` e `MAPA-APLICACAO.md` serão fundidos** — decisão em aberto
  (item 28 do [ESTADO.md](02-estado/ESTADO.md)). Até lá, ambos em
  [`04-arquitetura/`](04-arquitetura/).
