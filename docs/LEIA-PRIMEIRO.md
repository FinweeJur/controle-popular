# Leia primeiro

> `docs/` tem **8 documentos na raiz** — cada um cobre uma parte do portal, e a
> regra é: **ninguém lê tudo. Nunca.** `docs/planos/` guarda o que ainda está por
> fazer; `docs/_historico/` guarda o que foi entregue ou superado (54 arquivos,
> datados — lá só para arqueologia).
>
> *(Contagens conferidas em 16/08. Se for decidir por elas, conte de novo:*
> `ls -1 docs | wc -l`*, `ls -1 docs/planos | wc -l`*, `ls -1 docs/_historico | wc -l`*.)*

## Os oito documentos

| Documento | O que é | Quando ler |
|---|---|---|
| **`PRODUTO.md`** | o que é o portal, as seis frentes, features, regras editoriais | sempre — é a porta |
| **`ESTADO.md`** | o que está no ar, a fila viva ranqueada, bloqueios, dívida registrada | sempre que for decidir o que fazer |
| **`DESENVOLVIMENTO.md`** | worktrees, regras de commit, checklist antes do push, uso de IA | **antes do primeiro commit**, sempre |
| **`FONTES.md`** | cada fonte de dados: como coletar, o que mente, o que falta | mexer em fonte ou dado |
| **`ARQUITETURA.md`** | tetos de payload, compactação, índice e assistente, banco | mexer em rota, payload ou banco |
| **`OPERACAO.md`** | quem publica, rotina de coleta e build, credenciais | publicar, coletar, buildar |
| **`EDICAO.md`** | como editar conteúdo sem código (painel, dados, verificação) | editar conteúdo |
| **`LEIA-PRIMEIRO.md`** | este arquivo | sempre |

E na **raiz do repositório**, não aqui em `docs/`: **`AGENTS.md`** — as regras
que não se negociam e as armadilhas que já custaram tempo. Ferramenta de agente
lê esse arquivo sozinha; humano também deveria.

## `docs/planos/` — o que ainda está por fazer

Planos de trabalho ativos, cada um com o próprio estado. Ler o que a tarefa
tocar. Hoje: índice estático e assistente (o degrau 2 é o próximo trabalho),
revisão de UX, diário oficial, bases de clima e risco, espelho PDF da AJRI,
GitHub Pages (alvo alternativo) e a dívida antes de feature.

## `docs/_historico/` — não leia, salvo arqueologia

Documentam **um dia** e não descrevem o estado atual. Respondem "por que isto
está assim", nunca "como está hoje". A curadoria de 16/08 unificou a raiz em
oito documentos e moveu para cá todo o resto: os `FONTES-*.md` de cada domínio
(absorvidos por `FONTES.md`), os `PLANO-*` entregues (absorvidos por
`ESTADO.md`), os diários, handoffs e descobertas de cada dia.

⚠️ **Documento datado envelhece sem avisar.** Número em documento antigo **não**
é medição atual — se for decidir com ele, remeça. O que está na raiz descreve o
presente, com a data da medição ao lado de cada número.

## Subpastas de domínio

`docs/betim/`, `docs/congresso/` e `docs/ambiental/` continuam onde estão —
são referência de domínio de frentes específicas, consultadas junto com
`FONTES.md` quando a tarefa toca o assunto.

## Regra para quem escrever aqui

Antes de criar arquivo novo, **pergunte se ele cabe num que já existe.** Um
arquivo novo se justifica quando:

- é **referência de domínio** que vai ser consultada muitas vezes (vira seção de `FONTES.md`);
- é **procedimento** que alguém executa (vira seção de `OPERACAO.md` ou `EDICAO.md`);
- é **plano** de trabalho que ainda não começou (vai para `docs/planos/`).

Não se justifica para registrar o que foi feito num dia — isso é mensagem de
commit, e o `git log` já guarda. Se for indispensável, vai para
`docs/_historico/`, com a data no nome.