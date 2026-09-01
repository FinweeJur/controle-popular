# Guia de documentação

> **Tipo:** GUIA
> **Domínio:** global
> **Última medição:** 2026-09-01
> **Leitura estimada:** média (5–15 min)
> **Relacionados:** [README.md](README.md), [AGENTS.md](/AGENTS.md)
> **Palavras-chave:** documentação, template, sumário, metadados, links internos, nomenclatura, validação, manutenção

## Sumário

- [Propósito](#propósito)
- [Estrutura de pastas](#estrutura-de-pastas)
- [Template obrigatório](#template-obrigatório)
- [Como decidir onde um documento novo entra](#como-decidir-onde-um-documento-novo-entra)
- [Nomenclatura de arquivos](#nomenclatura-de-arquivos)
- [Links internos](#links-internos)
- [Atualização e arquivamento](#atualização-e-arquivamento)
- [Revisão periódica](#revisão-periódica)
- [Decisões registradas](#decisões-registradas)

## Propósito

Definir a estrutura, o template e as regras de manutenção da documentação do repositório `controle-popular`, para que ajustes futuros não dependam de memória individual nem quebrem referências no código.

Regras duras de commit, worktree, dado pessoal e publicação continuam no [`AGENTS.md`](/AGENTS.md). Este documento cuida apenas da documentação em `docs/`.

## Estrutura de pastas

```
docs/
├── README.md                    # Índice mestre de toda a docs/
├── GUIA-DE-DOCUMENTACAO.md      # Este arquivo
│
├── 01-produto/                  # O que é o portal, para quem, regras editoriais
├── 02-estado/                   # Estado atual, fila, bloqueios, dívida
├── 03-desenvolvimento/          # Fluxo de trabalho, commit, worktrees, verificação
├── 04-arquitetura/              # Tetos, payload, banco, rotas
├── 05-operacao/                 # Coletar, buildar, publicar, credenciais
├── 06-fontes/                   # Fontes de dados e coleta
├── 07-edicao/                   # Painel de edição e conteúdo sem código
│
├── dominios/                    # Documentação específica por frente
├── planos/                      # Planos de trabalho ativos (não entregues)
├── historico/                   # Documentos entregues ou superados
│   ├── entregas/                #   Planos/handoffs concluídos e datados
│   ├── planos/                  #   Planos supersedidos ou arquivados (sem conclusão)
│   ├── descobertas/             #   Descobertas, auditorias, diários
│   ├── fontes/                  #   Fontes pesquisadas/medidas
│   └── procedimentos/           #   Procedimentos superados
└── pesquisa/                    # Rascunhos de pesquisa externa
```

As pastas numeradas refletem a ordem de leitura recomendada. Subpastas de domínio (`dominios/`) são consultadas junto com `06-fontes/` quando a tarefa toca o assunto.

## Template obrigatório

Todo arquivo `.md` em `docs/` deve começar com o bloco abaixo (exceção: arquivos de `historico/` datados, que podem ter versão enxuta):

```markdown
# Título do documento

> **Tipo:** PRODUTO | ESTADO | DESENVOLVIMENTO | ARQUITETURA | OPERACAO | FONTE | EDICAO | GUIA | PLANO | HISTORICO | PESQUISA
> **Domínio:** (global | cidades | congresso | judiciario | ambiental | paraopeba | ...)
> **Última medição:** YYYY-MM-DD
> **Leitura estimada:** curta (< 5 min) | média (5-15 min) | longa (> 15 min)
> **Relacionados:** [NOME-DO-DOC.md](caminho/NOME-DO-DOC.md), [AGENTS.md](/AGENTS.md)
> **Palavras-chave:** palavra1, palavra2, palavra3, ...

## Sumário

- [Seção A](#secao-a)
- [Seção B](#secao-b)
- [Decisões registradas](#decisoes-registradas)
- [Origem / Histórico](#origem--historico)

## Propósito

Uma frase dizendo o que este documento responde.
```

### Regras do sumário

- O sumário deve conter links âncora para todas as seções de nível 2 (`##`).
- Seções de nível 3 só entram no sumário quando são decisões, armadilhas ou checklists.
- A seção **Decisões registradas** é obrigatória em documentos técnicos (`ARQUITETURA`, `OPERACAO`, `FONTES`).
- A seção **Origem / Histórico** é obrigatória para documentos que absorveram outros arquivos.

### Palavras-chave

As palavras-chave devem cobrir:

- conceitos (ex: `payload`, `worktree`, `ETL`, `build`);
- tecnologias (ex: `Cloudflare Workers`, `Neon`, `Drizzle`, `Next.js`);
- riscos (ex: `dado pessoal`, `teto de asset`, `build silencioso`);
- domínios (ex: `contratos`, `legislacao`, `paraopeba`).

## Como decidir onde um documento novo entra

Antes de criar um documento novo, pergunte se ele cabe num existente. Se não couber, use a matriz:

| Tipo de conteúdo | Pasta |
|---|---|
| Visão, frentes, regras editoriais | `01-produto/` |
| Estado, fila, bloqueios | `02-estado/` |
| Fluxo de trabalho, commit, IA, verificação | `03-desenvolvimento/` |
| Tetos, payload, banco, rotas | `04-arquitetura/` |
| Coleta, build, deploy, credenciais | `05-operacao/` |
| Fontes de dados, coletores, LAI | `06-fontes/` |
| Painel de edição, conteúdo, mídia | `07-edicao/` |
| Plano de trabalho não iniciado | `planos/` |
| Documento entregue ou superado | `historico/` |
| Rascunho de pesquisa externa | `pesquisa/` |
| Documentação por frente específica | `dominios/<frente>/` |

## Nomenclatura de arquivos

- **Raiz e pastas numeradas:** `NOME-EM-MAIUSCULO.md`.
- **Planos ativos:** `PLANO-<NOME>.md` ou `<NN>-<NOME>.md` quando houver ordem.
- **Histórico:**
  - entregas: `YYYY-MM-DD-<HANDOFF|PLANO|ENTREGA>-<nome>.md`;
  - descobertas: `YYYY-MM-DD-<DISCOVERY|AUDITORIA|DIARIO>-<nome>.md`;
  - fontes: `YYYY-MM-DD-FONTE-<nome>.md`.
- **Domínios:** `README.md` em cada pasta de domínio + arquivos descritivos em maiúsculo ou `kebab-case`.

## Links internos

- Todo arquivo deve linkar para os documentos que ele cita.
- Links para [`AGENTS.md`](/AGENTS.md), [`README.md`](README.md) e [`LEIA-PRIMEIRO.md`](LEIA-PRIMEIRO.md) usam caminho absoluto a partir da raiz do repo.
- Links entre documentos de `docs/` usam caminho relativo.

## Atualização e arquivamento

- Quando um documento for movido para `historico/`, adicionar um `redirect` textual no novo local indicando o arquivo substituto.
- Quando um número medido mudar, atualizar a data no cabeçalho.
- Quando um plano for entregue, mover para `historico/entregas/` e atualizar `02-estado/ESTADO.md`.
- Plano arquivado **sem conclusão** (supersedido ou abandonado) vai para `historico/planos/`; a entrega **concluída** vai para `historico/entregas/`. Em ambos os casos, adicionar o redirect no novo local e atualizar a classificação na tabela `Origem` do `ESTADO.md`.

## Revisão periódica

A cada 30 dias, rodar `scripts/validar-documentacao.py`:

1. Listar documentos sem sumário.
2. Listar links internos quebrados.
3. Listar medições com mais de 60 dias sem revisão.
4. Verificar se `docs/README.md` reflete a estrutura real.

## Decisões registradas

- **Estrutura numerada (`01-` a `07-`)** — substitui a contagem ambígua de "8" ou "12" documentos na raiz por uma navegação visual imediata.
- **`ARQUITETURA.md` absorve `MAPA-APLICACAO.md`** — elimina a pergunta "qual dos dois leio?" e o risco de divergência.
- **`_historico/` vira `historico/` sem underline** — facilita busca e navegação; subdivide-se por tipo.
- **Não duplicar `AGENTS.md`** — regras de commit, worktree e dado pessoal continuam lá; docs apenas remetem.
- **Número medido com data** — toda medição citada traz a data; número sem data vira dívida.
